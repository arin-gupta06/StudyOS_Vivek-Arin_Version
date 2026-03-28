const Event = require("../models/Event");

// @desc   Get all events for user
// @route  GET /api/events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Create an event
// @route  POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, date, time, reminder, reminderMinutes } =
      req.body;
    const event = await Event.create({
      user: req.user._id,
      title,
      description: description || "",
      type,
      date,
      time: time || "",
      reminder: reminder || false,
      reminderMinutes: reminderMinutes || 30,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update an event
// @route  PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true },
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete an event
// @route  DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

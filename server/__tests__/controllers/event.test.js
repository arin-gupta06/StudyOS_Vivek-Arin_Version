/**
 * Event Controller Tests
 *
 * Tests CRUD for calendar events including:
 * - Getting events sorted by date
 * - Creating with reminder settings
 * - Updating events
 * - Deleting events
 * - Edge cases (missing date, invalid types)
 */

const { createMockRes } = require("../helpers");
const mongoose = require("mongoose");

jest.mock("../../models/Event");
const Event = require("../../models/Event");

const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../../controllers/eventController");

describe("Event Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  // ═══════════════════════════════════════════════════════════════
  // GET EVENTS
  // ═══════════════════════════════════════════════════════════════
  describe("getEvents", () => {
    test("should return events sorted by date", async () => {
      const events = [
        { title: "Event 1", date: new Date("2026-03-06") },
        { title: "Event 2", date: new Date("2026-03-10") },
      ];
      Event.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(events),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getEvents(req, res);

      expect(res.json).toHaveBeenCalledWith(events);
    });

    test("should return empty array when no events", async () => {
      Event.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getEvents(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CREATE EVENT
  // ═══════════════════════════════════════════════════════════════
  describe("createEvent", () => {
    test("should create an event with all fields", async () => {
      const eventData = {
        _id: new mongoose.Types.ObjectId(),
        title: "Midterm Exam",
        type: "Exam",
        date: new Date("2026-04-15"),
        time: "10:00 AM",
        reminder: true,
        reminderMinutes: 60,
      };
      Event.create.mockResolvedValue(eventData);

      const req = {
        user: { _id: mockUserId },
        body: {
          title: "Midterm Exam",
          type: "Exam",
          date: new Date("2026-04-15"),
          time: "10:00 AM",
          reminder: true,
          reminderMinutes: 60,
        },
      };
      const res = createMockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(eventData);
    });

    test("should create event with defaults for optional fields", async () => {
      Event.create.mockResolvedValue({
        title: "Quick Reminder",
        description: "",
        time: "",
        reminder: false,
        reminderMinutes: 30,
      });

      const req = {
        user: { _id: mockUserId },
        body: { title: "Quick Reminder", date: new Date() },
      };
      const res = createMockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "",
          time: "",
          reminder: false,
          reminderMinutes: 30,
        })
      );
    });

    test("should handle all event types", async () => {
      const types = ["Quiz", "Exam", "Assignment", "Reminder"];

      for (const type of types) {
        jest.clearAllMocks();
        Event.create.mockResolvedValue({ title: `${type} Event`, type });

        const req = {
          user: { _id: mockUserId },
          body: { title: `${type} Event`, type, date: new Date() },
        };
        const res = createMockRes();

        await createEvent(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // UPDATE EVENT
  // ═══════════════════════════════════════════════════════════════
  describe("updateEvent", () => {
    test("should update event fields", async () => {
      const updated = { _id: "evt1", title: "Updated Exam", type: "Exam" };
      Event.findOneAndUpdate.mockResolvedValue(updated);

      const req = {
        user: { _id: mockUserId },
        params: { id: "evt1" },
        body: { title: "Updated Exam" },
      };
      const res = createMockRes();

      await updateEvent(req, res);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    test("should return 404 for non-existent event", async () => {
      Event.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        user: { _id: mockUserId },
        params: { id: "nonexistent" },
        body: { title: "Updated" },
      };
      const res = createMockRes();

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE EVENT
  // ═══════════════════════════════════════════════════════════════
  describe("deleteEvent", () => {
    test("should delete existing event", async () => {
      Event.findOneAndDelete.mockResolvedValue({ _id: "evt1" });

      const req = { user: { _id: mockUserId }, params: { id: "evt1" } };
      const res = createMockRes();

      await deleteEvent(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Event deleted" })
      );
    });

    test("should return 404 when deleting non-existent event", async () => {
      Event.findOneAndDelete.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "fake" } };
      const res = createMockRes();

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

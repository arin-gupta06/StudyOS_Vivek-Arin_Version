const User = require("../models/User");
const UserStat = require("../models/UserStat");
const Subject = require("../models/Subject");
const Task = require("../models/Task");
const Event = require("../models/Event");
const Note = require("../models/Note");
const jwt = require("jsonwebtoken");

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, email, password, socialLinks, avatar } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Run both duplicate checks in parallel
    const [emailExists, usernameExists] = await Promise.all([
      User.findOne({ email }).lean(),
      User.findOne({ username }).lean(),
    ]);
    if (emailExists) return res.status(400).json({ message: "Email already in use" });
    if (usernameExists) return res.status(400).json({ message: "Username already taken" });

    const user = await User.create({
      username,
      email,
      password,
      ...(socialLinks && { socialLinks }),
      ...(avatar && { avatar }),
    });

    if (user) {
      // Run all seed data inserts in parallel — do NOT block the response on these
      Promise.all([
        UserStat.create({
          user: user._id,
          focusScore: 0,
          currentStreak: 0,
          studyHours: 0,
          tasksDone: 0,
        }),
        Subject.create([
        {
          user: user._id,
          name: "Advanced Mathematics",
          icon: "📐",
          color: "from-indigo-500 to-purple-500",
          bgLight: "bg-indigo-500/10",
          textColor: "text-indigo-400",
          borderColor: "border-indigo-500/20",
          progress: 60,
          totalChapters: 12,
          completedChapters: 7,
          totalTasks: 24,
          completedTasks: 14,
          studyHours: 18.5,
          lastStudied: "2 hours ago",
          status: "in-progress",
          chapters: [
            { name: "Linear Algebra", progress: 100, tasks: 3, completed: 3 },
            { name: "Calculus I", progress: 100, tasks: 2, completed: 2 },
            { name: "Calculus II", progress: 80, tasks: 3, completed: 2 },
            {
              name: "Differential Equations",
              progress: 45,
              tasks: 4,
              completed: 2,
            },
            {
              name: "Probability & Statistics",
              progress: 20,
              tasks: 3,
              completed: 1,
            },
            { name: "Number Theory", progress: 0, tasks: 2, completed: 0 },
          ],
        },
        {
          user: user._id,
          name: "Physics - Quantum Mechanics",
          icon: "⚛️",
          color: "from-cyan-500 to-blue-500",
          bgLight: "bg-cyan-500/10",
          textColor: "text-cyan-400",
          borderColor: "border-cyan-500/20",
          progress: 30,
          totalChapters: 10,
          completedChapters: 3,
          totalTasks: 20,
          completedTasks: 6,
          studyHours: 12.0,
          lastStudied: "1 day ago",
          status: "in-progress",
          chapters: [
            {
              name: "Wave-Particle Duality",
              progress: 100,
              tasks: 2,
              completed: 2,
            },
            {
              name: "Schrödinger Equation",
              progress: 100,
              tasks: 3,
              completed: 3,
            },
            { name: "Quantum States", progress: 60, tasks: 3, completed: 1 },
            { name: "Wave Motion", progress: 10, tasks: 4, completed: 0 },
            {
              name: "Quantum Entanglement",
              progress: 0,
              tasks: 2,
              completed: 0,
            },
          ],
        },
        {
          user: user._id,
          name: "Organic Chemistry",
          icon: "🧪",
          color: "from-emerald-500 to-green-500",
          bgLight: "bg-emerald-500/10",
          textColor: "text-emerald-400",
          borderColor: "border-emerald-500/20",
          progress: 15,
          totalChapters: 14,
          completedChapters: 2,
          totalTasks: 28,
          completedTasks: 4,
          studyHours: 8.0,
          lastStudied: "3 days ago",
          status: "needs-attention",
          chapters: [
            { name: "Hydrocarbons", progress: 100, tasks: 2, completed: 2 },
            { name: "Functional Groups", progress: 50, tasks: 3, completed: 2 },
            { name: "Stereochemistry", progress: 10, tasks: 3, completed: 0 },
            {
              name: "Reaction Mechanisms",
              progress: 0,
              tasks: 4,
              completed: 0,
            },
          ],
        },
        {
          user: user._id,
          name: "Data Structures & Algorithms",
          icon: "💻",
          color: "from-orange-500 to-amber-500",
          bgLight: "bg-orange-500/10",
          textColor: "text-orange-400",
          borderColor: "border-orange-500/20",
          progress: 85,
          totalChapters: 8,
          completedChapters: 7,
          totalTasks: 16,
          completedTasks: 14,
          studyHours: 32.0,
          lastStudied: "5 hours ago",
          status: "almost-done",
          chapters: [
            { name: "Arrays & Strings", progress: 100, tasks: 2, completed: 2 },
            { name: "Linked Lists", progress: 100, tasks: 2, completed: 2 },
            { name: "Trees & Graphs", progress: 100, tasks: 3, completed: 3 },
            {
              name: "Dynamic Programming",
              progress: 80,
              tasks: 3,
              completed: 2,
            },
            {
              name: "Sorting & Searching",
              progress: 100,
              tasks: 2,
              completed: 2,
            },
            { name: "Advanced Graphs", progress: 40, tasks: 2, completed: 1 },
          ],
        },
      ]),
      Task.create([
        {
          user: user._id,
          title: "Research Paper Outline",
          description: "Structure the thesis statement...",
          status: "todo",
        },
        { user: user._id, title: "Lab Report Drafting", status: "todo" },
        {
          user: user._id,
          title: "Algorithm Finalization",
          status: "inProgress",
          progress: 65,
        },
        { user: user._id, title: "Literature Review", status: "completed" },
      ]),
      Event.create([
        {
          user: user._id,
          title: "Physics: Wave Motion",
          type: "Quiz",
          date: new Date(Date.now() + 86400000),
        },
        {
          user: user._id,
          title: "Math Midterm Exam",
          type: "Exam",
          date: new Date(Date.now() + 5 * 86400000),
        },
        {
          user: user._id,
          title: "Chemistry Lab Report",
          type: "Assignment",
          date: new Date(Date.now() + 3 * 86400000),
        },
        {
          user: user._id,
          title: "DSA Project Submission",
          type: "Assignment",
          date: new Date(Date.now() + 7 * 86400000),
        },
      ]),
      Note.create([
        {
          user: user._id,
          category: "Study",
          label: "Study Prep",
          title: "Physics Exam Revision",
          type: "checklist",
          items: [
            { text: "Review Chapter 4 notes", done: true },
            { text: "Complete practice set A", done: true },
            { text: "Derive Maxwell equations", done: false },
            { text: "Lab report submission", done: false },
          ],
          color: "emerald",
        },
        {
          user: user._id,
          category: "Work",
          label: "Work",
          title: "Design System Audit",
          type: "bullets",
          items: [
            "Check accessibility contrast for the mint green primary color",
            "Update icon set to Material Round",
            "Verify dark mode border tokens",
          ],
          color: "purple",
        },
        {
          user: user._id,
          category: "Personal",
          label: "Quick Thought",
          title: "Project Idea: Focus API",
          type: "text",
          body: "Build a lightweight Chrome extension that syncs study sessions directly with the ChronOS dashboard. Should include a simple pomodoro timer and site blocker.",
          color: "amber",
        },
        {
          user: user._id,
          category: "Study",
          label: "Motivation",
          type: "quote",
          body: '"Success is not final, failure is not fatal: it is the courage to continue that counts."',
          author: "— Winston Churchill",
          pinned: true,
          color: "emerald",
        },
      ]),
      ]).catch((err) => console.error("Seed data error for user", user._id, err));

      const token = generateToken(user._id);

      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        socialLinks: user.socialLinks,
        avatar: user.avatar,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        socialLinks: user.socialLinks,
        avatar: user.avatar,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error", detail: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Update user social links
// @route   PUT /api/auth/social-links
// @access  Private
exports.updateSocialLinks = async (req, res) => {
  try {
    const { linkedin, github, reddit, discord, quora } = req.body;

    const links = { linkedin, github, reddit, discord, quora };

    // Clean up links — trim whitespace
    const cleaned = {};
    for (const [key, val] of Object.entries(links)) {
      cleaned[key] = val ? val.trim() : '';
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { socialLinks: cleaned },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Update user profile (avatar, etc)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { avatar, username, email } = req.body;
    
    const updateData = {};
    if (avatar !== undefined) updateData.avatar = avatar;

    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed) return res.status(400).json({ message: 'Username cannot be empty' });
      const taken = await User.findOne({ username: trimmed, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: 'Username already taken' });
      updateData.username = trimmed;
    }

    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ message: 'Email cannot be empty' });
      const taken = await User.findOne({ email: trimmed, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: 'Email already in use' });
      updateData.email = trimmed;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

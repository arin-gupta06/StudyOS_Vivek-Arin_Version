/**
 * Auth Controller Tests
 *
 * Tests registration, login, logout, profile update, and social links.
 * All database operations are mocked.
 */

process.env.JWT_SECRET = "test_jwt_secret_key_for_testing";
process.env.NODE_ENV = "test";

const { createMockRes } = require("../helpers");

// ─── Mock all models ────────────────────────────────────────────
jest.mock("../../models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("../../models/UserStat", () => ({ create: jest.fn() }));
jest.mock("../../models/Subject", () => ({ create: jest.fn() }));
jest.mock("../../models/Task", () => ({ create: jest.fn() }));
jest.mock("../../models/Event", () => ({ create: jest.fn() }));
jest.mock("../../models/Note", () => ({ create: jest.fn() }));

const User = require("../../models/User");
const UserStat = require("../../models/UserStat");
const Subject = require("../../models/Subject");
const Task = require("../../models/Task");
const Event = require("../../models/Event");
const Note = require("../../models/Note");

const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  updateSocialLinks,
  updateProfile,
} = require("../../controllers/authController");

const mongoose = require("mongoose");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Explicitly recreate mock functions to guarantee clean state
    User.findOne = jest.fn();
    User.create = jest.fn();
    User.findById = jest.fn();
    User.findByIdAndUpdate = jest.fn();
    UserStat.create = jest.fn();
    Subject.create = jest.fn();
    Task.create = jest.fn();
    Event.create = jest.fn();
    Note.create = jest.fn();
  });

  // ═══════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════
  describe("registerUser", () => {
    test("should return 400 if username is missing", async () => {
      const req = { body: { email: "a@b.com", password: "123456" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Please provide all required fields" })
      );
    });

    test("should return 400 if email is missing", async () => {
      const req = { body: { username: "user", password: "123456" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 if password is missing", async () => {
      const req = { body: { username: "user", email: "a@b.com" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 if password is less than 6 characters", async () => {
      const req = { body: { username: "user", email: "a@b.com", password: "12345" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Password must be at least 6 characters long" })
      );
    });

    test("should return 400 if email already exists", async () => {
      User.findOne
        .mockResolvedValueOnce({ email: "a@b.com" }); // emailExists check — controller returns early, no second call

      const req = { body: { username: "user", email: "a@b.com", password: "123456" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Email already in use" })
      );
    });

    test("should return 400 if username already exists", async () => {
      let callCount = 0;
      User.findOne.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(null);
        return Promise.resolve({ username: "user" });
      });

      const req = { body: { username: "user", email: "a@b.com", password: "123456" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Username already taken" })
      );
    });

    test("should return 201 and create user with seed data on success", async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const createdUser = {
        _id: mockUserId,
        username: "newuser",
        email: "new@example.com",
        socialLinks: {},
        avatar: "",
      };

      User.findOne.mockImplementation(() => Promise.resolve(null));
      User.create.mockImplementation(() => Promise.resolve(createdUser));
      UserStat.create.mockImplementation(() => Promise.resolve({}));
      Subject.create.mockImplementation(() => Promise.resolve([]));
      Task.create.mockImplementation(() => Promise.resolve([]));
      Event.create.mockImplementation(() => Promise.resolve([]));
      Note.create.mockImplementation(() => Promise.resolve([]));

      const req = {
        body: { username: "newuser", email: "new@example.com", password: "password123" },
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockUserId,
          username: "newuser",
          email: "new@example.com",
          token: expect.any(String),
        })
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "jwt",
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
      // Verify seed data was created
      expect(UserStat.create).toHaveBeenCalled();
      expect(Subject.create).toHaveBeenCalled();
      expect(Task.create).toHaveBeenCalled();
      expect(Event.create).toHaveBeenCalled();
      expect(Note.create).toHaveBeenCalled();
    });

    test("should accept optional socialLinks and avatar", async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const createdUser = {
        _id: mockUserId,
        username: "user2",
        email: "user2@example.com",
        socialLinks: { github: "https://github.com/user2" },
        avatar: "avatar-url",
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(createdUser);
      UserStat.create.mockResolvedValue({});
      Subject.create.mockResolvedValue([]);
      Task.create.mockResolvedValue([]);
      Event.create.mockResolvedValue([]);
      Note.create.mockResolvedValue([]);

      const req = {
        body: {
          username: "user2",
          email: "user2@example.com",
          password: "password123",
          socialLinks: { github: "https://github.com/user2" },
          avatar: "avatar-url",
        },
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          socialLinks: { github: "https://github.com/user2" },
          avatar: "avatar-url",
        })
      );
    });

    test("should return 400 with empty body", async () => {
      const req = { body: {} };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should handle password of exactly 6 characters", async () => {
      User.findOne.mockResolvedValue(null);
      const mockUserId = new mongoose.Types.ObjectId();
      User.create.mockResolvedValue({
        _id: mockUserId,
        username: "user",
        email: "a@b.com",
        socialLinks: {},
        avatar: "",
      });
      UserStat.create.mockResolvedValue({});
      Subject.create.mockResolvedValue([]);
      Task.create.mockResolvedValue([]);
      Event.create.mockResolvedValue([]);
      Note.create.mockResolvedValue([]);

      const req = { body: { username: "user", email: "a@b.com", password: "123456" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════
  describe("loginUser", () => {
    test("should return 401 for non-existent email", async () => {
      User.findOne.mockResolvedValue(null);

      const req = { body: { email: "nobody@example.com", password: "123456" } };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid email or password" })
      );
    });

    test("should return 401 for wrong password", async () => {
      User.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        matchPassword: jest.fn().mockResolvedValue(false),
      });

      const req = { body: { email: "user@example.com", password: "wrongpass" } };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should return user data and set cookie on successful login", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: "testuser",
        email: "user@example.com",
        socialLinks: {},
        avatar: "",
        matchPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(mockUser);

      const req = { body: { email: "user@example.com", password: "correctpass" } };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockUser._id,
          username: "testuser",
          token: expect.any(String),
        })
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "jwt",
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
    });

    test("should handle missing email in login body", async () => {
      User.findOne.mockResolvedValue(null);

      const req = { body: { password: "123456" } };
      const res = createMockRes();

      await loginUser(req, res);

      // findOne({ email: undefined }) returns null
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should handle missing password in login body", async () => {
      User.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        matchPassword: jest.fn().mockResolvedValue(false),
      });

      const req = { body: { email: "user@example.com" } };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET ME
  // ═══════════════════════════════════════════════════════════════
  describe("getMe", () => {
    test("should return user data", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: "me",
        email: "me@example.com",
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = { user: { _id: mockUser._id } };
      const res = createMockRes();

      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════
  describe("logoutUser", () => {
    test("should clear JWT cookie and return success message", () => {
      const req = {};
      const res = createMockRes();

      logoutUser(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "jwt",
        "",
        expect.objectContaining({
          httpOnly: true,
          expires: expect.any(Date),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Logged out successfully" })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // UPDATE SOCIAL LINKS
  // ═══════════════════════════════════════════════════════════════
  describe("updateSocialLinks", () => {
    test("should update and return trimmed social links", async () => {
      const userId = new mongoose.Types.ObjectId();
      const updatedUser = {
        _id: userId,
        username: "user",
        socialLinks: { linkedin: "https://linkedin.com/in/user", github: "", reddit: "", discord: "", quora: "" },
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      });

      const req = {
        user: { _id: userId },
        body: { linkedin: "  https://linkedin.com/in/user  ", github: "", reddit: null, discord: undefined, quora: "" },
      };
      const res = createMockRes();

      await updateSocialLinks(req, res);

      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // UPDATE PROFILE
  // ═══════════════════════════════════════════════════════════════
  describe("updateProfile", () => {
    test("should update avatar and username", async () => {
      const userId = new mongoose.Types.ObjectId();
      const updatedUser = { _id: userId, username: "newname", avatar: "new-avatar-url" };

      // No username/email conflict
      User.findOne.mockResolvedValue(null);

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      });

      const req = {
        user: { _id: userId },
        body: { username: "newname", avatar: "new-avatar-url" },
      };
      const res = createMockRes();

      await updateProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });
  });
});

/**
 * Subject Controller Tests
 */

const mongoose = require("mongoose");
const { createMockRes } = require("../helpers");

jest.mock("../../models/Subject");
const Subject = require("../../models/Subject");

const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../../controllers/subjectController");

describe("Subject Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  describe("getSubjects", () => {
    test("should return all subjects sorted by createdAt desc", async () => {
      const items = [{ name: "Math" }, { name: "Physics" }];
      Subject.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(items),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getSubjects(req, res);

      expect(Subject.find).toHaveBeenCalledWith({ user: mockUserId });
      expect(res.json).toHaveBeenCalledWith(items);
    });

    test("should return empty array for new user", async () => {
      Subject.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getSubjects(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("createSubject", () => {
    test("should create a subject with provided data", async () => {
      const subject = { _id: "s1", name: "Chemistry", icon: "🧪" };
      Subject.create.mockResolvedValue(subject);

      const req = {
        user: { _id: mockUserId },
        body: { name: "Chemistry", icon: "🧪" },
      };
      const res = createMockRes();

      await createSubject(req, res);

      expect(Subject.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUserId, name: "Chemistry", icon: "🧪" })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(subject);
    });
  });

  describe("updateSubject", () => {
    test("should update subject fields", async () => {
      const updated = { _id: "s1", name: "Updated Math", progress: 50 };
      Subject.findOneAndUpdate.mockResolvedValue(updated);

      const req = {
        user: { _id: mockUserId },
        params: { id: "s1" },
        body: { name: "Updated Math", progress: 50 },
      };
      const res = createMockRes();

      await updateSubject(req, res);

      expect(Subject.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "s1", user: mockUserId },
        req.body,
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    test("should return 404 if subject not found", async () => {
      Subject.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        user: { _id: mockUserId },
        params: { id: "none" },
        body: { name: "X" },
      };
      const res = createMockRes();

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteSubject", () => {
    test("should delete subject", async () => {
      Subject.findOneAndDelete.mockResolvedValue({ _id: "s1" });

      const req = { user: { _id: mockUserId }, params: { id: "s1" } };
      const res = createMockRes();

      await deleteSubject(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Subject deleted" })
      );
    });

    test("should return 404 if subject not found", async () => {
      Subject.findOneAndDelete.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "none" } };
      const res = createMockRes();

      await deleteSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

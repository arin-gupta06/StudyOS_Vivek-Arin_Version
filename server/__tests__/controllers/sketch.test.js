/**
 * Sketch Controller Tests
 */

const mongoose = require("mongoose");
const { createMockRes } = require("../helpers");

jest.mock("../../models/Sketch");
const Sketch = require("../../models/Sketch");

const {
  getSketches,
  getSketch,
  createSketch,
  updateSketch,
  deleteSketch,
} = require("../../controllers/sketchController");

describe("Sketch Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  describe("getSketches", () => {
    test("should return all sketches sorted by updatedAt desc", async () => {
      const items = [{ title: "Sketch A" }, { title: "Sketch B" }];
      Sketch.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(items),
        }),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getSketches(req, res);

      expect(Sketch.find).toHaveBeenCalledWith({ user: mockUserId });
      expect(res.json).toHaveBeenCalledWith(items);
    });
  });

  describe("getSketch", () => {
    test("should return a single sketch", async () => {
      const sketch = { _id: "s1", title: "Test" };
      Sketch.findOne.mockResolvedValue(sketch);

      const req = { user: { _id: mockUserId }, params: { id: "s1" } };
      const res = createMockRes();

      await getSketch(req, res);

      expect(res.json).toHaveBeenCalledWith(sketch);
    });

    test("should return 404 if sketch not found", async () => {
      Sketch.findOne.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "none" } };
      const res = createMockRes();

      await getSketch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("createSketch", () => {
    test("should create with defaults when no body provided", async () => {
      Sketch.create.mockResolvedValue({
        title: "Untitled Sketch",
        width: 1920,
        height: 1080,
        dataUrl: "",
        thumbnail: "",
      });

      const req = { user: { _id: mockUserId }, body: {} };
      const res = createMockRes();

      await createSketch(req, res);

      expect(Sketch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Untitled Sketch",
          width: 1920,
          height: 1080,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should create with custom dimensions and title", async () => {
      Sketch.create.mockResolvedValue({
        title: "Custom",
        width: 800,
        height: 600,
      });

      const req = {
        user: { _id: mockUserId },
        body: { title: "Custom", width: 800, height: 600 },
      };
      const res = createMockRes();

      await createSketch(req, res);

      expect(Sketch.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Custom", width: 800, height: 600 })
      );
    });
  });

  describe("updateSketch", () => {
    test("should update sketch fields", async () => {
      const sketch = {
        _id: "s1",
        title: "Old",
        dataUrl: "",
        thumbnail: "",
        width: 1920,
        height: 1080,
        save: jest.fn().mockResolvedValue(true),
      };
      Sketch.findOne.mockResolvedValue(sketch);

      const req = {
        user: { _id: mockUserId },
        params: { id: "s1" },
        body: { title: "New Title", width: 800 },
      };
      const res = createMockRes();

      await updateSketch(req, res);

      expect(sketch.title).toBe("New Title");
      expect(sketch.width).toBe(800);
      expect(sketch.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(sketch);
    });

    test("should return 404 if sketch not found", async () => {
      Sketch.findOne.mockResolvedValue(null);

      const req = {
        user: { _id: mockUserId },
        params: { id: "none" },
        body: { title: "X" },
      };
      const res = createMockRes();

      await updateSketch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should only update provided fields", async () => {
      const sketch = {
        _id: "s1",
        title: "Original",
        dataUrl: "data:old",
        thumbnail: "thumb:old",
        width: 1920,
        height: 1080,
        save: jest.fn().mockResolvedValue(true),
      };
      Sketch.findOne.mockResolvedValue(sketch);

      const req = {
        user: { _id: mockUserId },
        params: { id: "s1" },
        body: { thumbnail: "thumb:new" },
      };
      const res = createMockRes();

      await updateSketch(req, res);

      expect(sketch.title).toBe("Original");
      expect(sketch.thumbnail).toBe("thumb:new");
      expect(sketch.dataUrl).toBe("data:old");
    });
  });

  describe("deleteSketch", () => {
    test("should delete sketch", async () => {
      Sketch.findOneAndDelete.mockResolvedValue({ _id: "s1" });

      const req = { user: { _id: mockUserId }, params: { id: "s1" } };
      const res = createMockRes();

      await deleteSketch(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Sketch deleted" })
      );
    });

    test("should return 404 if sketch not found", async () => {
      Sketch.findOneAndDelete.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "none" } };
      const res = createMockRes();

      await deleteSketch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

/**
 * Notebook Controller Tests
 */

const mongoose = require("mongoose");
const { createMockRes } = require("../helpers");

jest.mock("../../models/Notebook");
jest.mock("../../models/Subject");
const Notebook = require("../../models/Notebook");
const Subject = require("../../models/Subject");

const {
  getNotebooks,
  getNotebook,
  getSharedNotebook,
  updateSharedNotebook,
  toggleShare,
  getByChapter,
  createNotebook,
  updateNotebook,
  bulkDeleteNotebooks,
  deleteAllNotebooks,
  deleteNotebook,
} = require("../../controllers/notebookController");

describe("Notebook Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  describe("getNotebooks", () => {
    test("should return all notebooks sorted by updatedAt desc", async () => {
      const items = [{ title: "Notebook A" }];
      Notebook.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(items),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getNotebooks(req, res);

      expect(res.json).toHaveBeenCalledWith(items);
    });
  });

  describe("getNotebook", () => {
    test("should return single notebook", async () => {
      Notebook.findOne.mockResolvedValue({ _id: "n1", title: "Test" });

      const req = { user: { _id: mockUserId }, params: { id: "n1" } };
      const res = createMockRes();

      await getNotebook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "n1" })
      );
    });

    test("should return 404 if notebook not found", async () => {
      Notebook.findOne.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "none" } };
      const res = createMockRes();

      await getNotebook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getSharedNotebook", () => {
    test("should return shared notebook without ownership check", async () => {
      Notebook.findOne.mockResolvedValue({ _id: "n1", isShared: true });

      const req = { params: { id: "n1" } };
      const res = createMockRes();

      await getSharedNotebook(req, res);

      expect(Notebook.findOne).toHaveBeenCalledWith({
        _id: "n1",
        isShared: true,
      });
      expect(res.json).toHaveBeenCalled();
    });

    test("should return 404 if notebook not shared", async () => {
      Notebook.findOne.mockResolvedValue(null);

      const req = { params: { id: "n1" } };
      const res = createMockRes();

      await getSharedNotebook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateSharedNotebook", () => {
    test("should update shared notebook and compute word count", async () => {
      const updated = { _id: "n1", wordCount: 5 };
      Notebook.findOneAndUpdate.mockResolvedValue(updated);

      const req = {
        params: { id: "n1" },
        body: {
          blocks: [
            { type: "text", html: "<p>Hello world is great today</p>" },
            { type: "code", code: "const x = 1" },
          ],
        },
      };
      const res = createMockRes();

      await updateSharedNotebook(req, res);

      expect(Notebook.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "n1", isShared: true },
        expect.objectContaining({ wordCount: expect.any(Number) }),
        { new: true }
      );
    });

    test("should return 404 if not shared", async () => {
      Notebook.findOneAndUpdate.mockResolvedValue(null);

      const req = { params: { id: "n1" }, body: { title: "X" } };
      const res = createMockRes();

      await updateSharedNotebook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("toggleShare", () => {
    test("should set isShared to true", async () => {
      const notebook = {
        _id: "n1",
        isShared: false,
        save: jest.fn().mockResolvedValue(true),
      };
      Notebook.findOne.mockResolvedValue(notebook);

      const req = { user: { _id: mockUserId }, params: { id: "n1" } };
      const res = createMockRes();

      await toggleShare(req, res);

      expect(notebook.isShared).toBe(true);
      expect(notebook.save).toHaveBeenCalled();
    });

    test("should return 404 if notebook not found", async () => {
      Notebook.findOne.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "none" } };
      const res = createMockRes();

      await toggleShare(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getByChapter", () => {
    test("should return existing notebook for subject+chapter", async () => {
      Notebook.findOne.mockResolvedValue({ _id: "n1", chapterName: "Ch1" });

      const req = {
        user: { _id: mockUserId },
        query: { subjectId: "sub1", chapterName: "Ch1" },
      };
      const res = createMockRes();

      await getByChapter(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ chapterName: "Ch1" })
      );
    });

    test("should auto-create notebook if none exists for chapter", async () => {
      Notebook.findOne.mockResolvedValue(null);
      Subject.findById.mockResolvedValue({ name: "Physics" });
      Notebook.create.mockResolvedValue({
        _id: "new1",
        chapterName: "Ch2",
        title: "Ch2 Notes",
      });

      const req = {
        user: { _id: mockUserId },
        query: { subjectId: "sub1", chapterName: "Ch2" },
      };
      const res = createMockRes();

      await getByChapter(req, res);

      expect(Notebook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Ch2 Notes",
          subjectName: "Physics",
        })
      );
    });
  });

  describe("createNotebook", () => {
    test("should create notebook", async () => {
      Notebook.create.mockResolvedValue({ _id: "n1", title: "New" });

      const req = {
        user: { _id: mockUserId },
        body: { title: "New" },
      };
      const res = createMockRes();

      await createNotebook(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateNotebook", () => {
    test("should compute word count from blocks", async () => {
      Notebook.findOneAndUpdate.mockResolvedValue({
        _id: "n1",
        wordCount: 3,
      });

      const req = {
        user: { _id: mockUserId },
        params: { id: "n1" },
        body: {
          blocks: [{ type: "text", html: "<b>Hello</b> <i>world</i> test" }],
        },
      };
      const res = createMockRes();

      await updateNotebook(req, res);

      expect(Notebook.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "n1", user: mockUserId },
        expect.objectContaining({ wordCount: expect.any(Number) }),
        { new: true }
      );
    });

    test("should compute word count from content string", async () => {
      Notebook.findOneAndUpdate.mockResolvedValue({ _id: "n1" });

      const req = {
        user: { _id: mockUserId },
        params: { id: "n1" },
        body: { content: "<p>Two words</p>" },
      };
      const res = createMockRes();

      await updateNotebook(req, res);

      expect(Notebook.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ wordCount: 2 }),
        expect.anything()
      );
    });

    test("should return 404 if notebook not found", async () => {
      Notebook.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        user: { _id: mockUserId },
        params: { id: "none" },
        body: { title: "X" },
      };
      const res = createMockRes();

      await updateNotebook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("bulkDeleteNotebooks", () => {
    test("should delete multiple notebooks by ids", async () => {
      Notebook.deleteMany.mockResolvedValue({ deletedCount: 3 });

      const req = {
        user: { _id: mockUserId },
        body: { ids: ["a", "b", "c"] },
      };
      const res = createMockRes();

      await bulkDeleteNotebooks(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ deletedCount: 3 })
      );
    });

    test("should return 400 if no ids provided", async () => {
      const req = { user: { _id: mockUserId }, body: {} };
      const res = createMockRes();

      await bulkDeleteNotebooks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 if ids is empty array", async () => {
      const req = { user: { _id: mockUserId }, body: { ids: [] } };
      const res = createMockRes();

      await bulkDeleteNotebooks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteAllNotebooks", () => {
    test("should delete all notebooks for user", async () => {
      Notebook.deleteMany.mockResolvedValue({ deletedCount: 10 });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await deleteAllNotebooks(req, res);

      expect(Notebook.deleteMany).toHaveBeenCalledWith({ user: mockUserId });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ deletedCount: 10 })
      );
    });
  });

  describe("deleteNotebook", () => {
    test("should delete a single notebook", async () => {
      Notebook.findOneAndDelete.mockResolvedValue({ _id: "n1" });

      const req = { user: { _id: mockUserId }, params: { id: "n1" } };
      const res = createMockRes();

      await deleteNotebook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Notebook deleted" })
      );
    });

    test("should return 404 if notebook not found", async () => {
      Notebook.findOneAndDelete.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "none" } };
      const res = createMockRes();

      await deleteNotebook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

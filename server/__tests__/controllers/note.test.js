/**
 * Note Controller Tests
 */

const { createMockRes } = require("../helpers");
const mongoose = require("mongoose");

jest.mock("../../models/Note");
const Note = require("../../models/Note");

const { getNotes, createNote, updateNote, deleteNote } = require("../../controllers/noteController");

describe("Note Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  describe("getNotes", () => {
    test("should return notes sorted by pinned then updatedAt", async () => {
      const notes = [
        { title: "Pinned", pinned: true },
        { title: "Recent", pinned: false },
      ];
      Note.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(notes),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getNotes(req, res);

      expect(Note.find).toHaveBeenCalledWith({ user: mockUserId });
      expect(res.json).toHaveBeenCalledWith(notes);
    });
  });

  describe("createNote", () => {
    test("should create a checklist note", async () => {
      const noteData = {
        _id: new mongoose.Types.ObjectId(),
        title: "My Checklist",
        type: "checklist",
        category: "Study",
        items: [{ text: "Item 1", done: false }],
      };
      Note.create.mockResolvedValue(noteData);

      const req = {
        user: { _id: mockUserId },
        body: {
          title: "My Checklist",
          type: "checklist",
          category: "Study",
          items: [{ text: "Item 1", done: false }],
        },
      };
      const res = createMockRes();

      await createNote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should create a text note", async () => {
      Note.create.mockResolvedValue({ title: "Text Note", type: "text", body: "Content" });

      const req = {
        user: { _id: mockUserId },
        body: { title: "Text Note", type: "text", body: "Content" },
      };
      const res = createMockRes();

      await createNote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should create a quote note with author", async () => {
      Note.create.mockResolvedValue({
        type: "quote",
        body: "A great quote",
        author: "Someone Famous",
      });

      const req = {
        user: { _id: mockUserId },
        body: { type: "quote", body: "A great quote", author: "Someone Famous", pinned: true },
      };
      const res = createMockRes();

      await createNote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateNote", () => {
    test("should update note and set updatedAt", async () => {
      const updated = { _id: "note1", title: "Updated Title" };
      Note.findOneAndUpdate.mockResolvedValue(updated);

      const req = {
        user: { _id: mockUserId },
        params: { id: "note1" },
        body: { title: "Updated Title" },
      };
      const res = createMockRes();

      await updateNote(req, res);

      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "note1", user: mockUserId },
        expect.objectContaining({ title: "Updated Title", updatedAt: expect.any(Number) }),
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    test("should return 404 for non-existent note", async () => {
      Note.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        user: { _id: mockUserId },
        params: { id: "fake" },
        body: { title: "Updated" },
      };
      const res = createMockRes();

      await updateNote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteNote", () => {
    test("should delete a note", async () => {
      Note.findOneAndDelete.mockResolvedValue({ _id: "note1" });

      const req = { user: { _id: mockUserId }, params: { id: "note1" } };
      const res = createMockRes();

      await deleteNote(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Note deleted" })
      );
    });

    test("should return 404 for non-existent note", async () => {
      Note.findOneAndDelete.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "fake" } };
      const res = createMockRes();

      await deleteNote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

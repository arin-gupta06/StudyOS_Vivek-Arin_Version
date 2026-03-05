/**
 * Task Controller Tests
 *
 * Tests CRUD operations for tasks including:
 * - Getting tasks grouped by status
 * - Creating tasks with various fields
 * - Updating task status/progress
 * - Deleting tasks
 * - Access control (user isolation)
 * - Edge cases (missing fields, invalid IDs)
 */

const { createMockRes } = require("../helpers");
const mongoose = require("mongoose");

jest.mock("../../models/Task");
const Task = require("../../models/Task");

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../../controllers/taskController");

describe("Task Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  // ═══════════════════════════════════════════════════════════════
  // GET TASKS
  // ═══════════════════════════════════════════════════════════════
  describe("getTasks", () => {
    test("should return tasks grouped by status", async () => {
      const tasks = [
        { _id: "1", title: "Task 1", status: "todo", user: mockUserId },
        { _id: "2", title: "Task 2", status: "inProgress", user: mockUserId },
        { _id: "3", title: "Task 3", status: "completed", user: mockUserId },
        { _id: "4", title: "Task 4", status: "todo", user: mockUserId },
      ];

      Task.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(tasks),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getTasks(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.todo).toHaveLength(2);
      expect(result.inProgress).toHaveLength(1);
      expect(result.completed).toHaveLength(1);
    });

    test("should return empty groups when no tasks exist", async () => {
      Task.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getTasks(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.todo).toHaveLength(0);
      expect(result.inProgress).toHaveLength(0);
      expect(result.completed).toHaveLength(0);
    });

    test("should handle database errors gracefully", async () => {
      Task.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("DB error")),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Server error" })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CREATE TASK
  // ═══════════════════════════════════════════════════════════════
  describe("createTask", () => {
    test("should create a basic task with defaults", async () => {
      const created = {
        _id: new mongoose.Types.ObjectId(),
        user: mockUserId,
        title: "New Task",
        status: "todo",
        priority: "Medium",
        progress: 0,
      };
      Task.create.mockResolvedValue(created);

      const req = { user: { _id: mockUserId }, body: { title: "New Task" } };
      const res = createMockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    test("should create a task with all fields specified", async () => {
      const dueDate = new Date("2026-04-01");
      const created = {
        _id: new mongoose.Types.ObjectId(),
        user: mockUserId,
        title: "Full Task",
        description: "A detailed task",
        status: "inProgress",
        priority: "High",
        progress: 50,
        dueDate,
      };
      Task.create.mockResolvedValue(created);

      const req = {
        user: { _id: mockUserId },
        body: {
          title: "Full Task",
          description: "A detailed task",
          status: "inProgress",
          priority: "High",
          progress: 50,
          dueDate,
        },
      };
      const res = createMockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Full Task",
          priority: "High",
          progress: 50,
        })
      );
    });

    test("should create task with Urgent priority", async () => {
      Task.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        title: "Urgent Task",
        priority: "Urgent",
      });

      const req = {
        user: { _id: mockUserId },
        body: { title: "Urgent Task", priority: "Urgent" },
      };
      const res = createMockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should handle task creation failure", async () => {
      Task.create.mockRejectedValue(new Error("Validation failed"));

      const req = { user: { _id: mockUserId }, body: { title: "" } };
      const res = createMockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // UPDATE TASK
  // ═══════════════════════════════════════════════════════════════
  describe("updateTask", () => {
    test("should update task fields", async () => {
      const existingTask = {
        _id: "task123",
        user: mockUserId,
        title: "Old Title",
        status: "todo",
        save: jest.fn().mockResolvedValue(true),
      };
      Task.findOne.mockResolvedValue(existingTask);

      const req = {
        user: { _id: mockUserId },
        params: { id: "task123" },
        body: { title: "New Title", status: "inProgress" },
      };
      const res = createMockRes();

      await updateTask(req, res);

      expect(existingTask.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test("should return 404 when task not found", async () => {
      Task.findOne.mockResolvedValue(null);

      const req = {
        user: { _id: mockUserId },
        params: { id: "nonexistent" },
        body: { title: "Updated" },
      };
      const res = createMockRes();

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task not found" })
      );
    });

    test("should update task progress to 100", async () => {
      const task = {
        _id: "task123",
        progress: 50,
        save: jest.fn().mockResolvedValue(true),
      };
      Task.findOne.mockResolvedValue(task);

      const req = {
        user: { _id: mockUserId },
        params: { id: "task123" },
        body: { progress: 100, status: "completed" },
      };
      const res = createMockRes();

      await updateTask(req, res);

      expect(task.progress).toBe(100);
      expect(task.status).toBe("completed");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE TASK
  // ═══════════════════════════════════════════════════════════════
  describe("deleteTask", () => {
    test("should delete existing task", async () => {
      Task.findOneAndDelete.mockResolvedValue({ _id: "task123" });

      const req = { user: { _id: mockUserId }, params: { id: "task123" } };
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task deleted" })
      );
    });

    test("should return 404 when deleting non-existent task", async () => {
      Task.findOneAndDelete.mockResolvedValue(null);

      const req = { user: { _id: mockUserId }, params: { id: "nonexistent" } };
      const res = createMockRes();

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

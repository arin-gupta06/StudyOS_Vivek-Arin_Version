/**
 * Calculator Controller Tests
 */

const { createMockRes } = require("../helpers");
const mongoose = require("mongoose");

jest.mock("../../models/Calculation");
const Calculation = require("../../models/Calculation");

const {
  getHistory,
  addCalculation,
  clearHistory,
  deleteCalculation,
} = require("../../controllers/calculatorController");

describe("Calculator Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  describe("getHistory", () => {
    test("should return calculation history (max 50, newest first)", async () => {
      const items = [
        { expression: "2+2", result: "4" },
        { expression: "10*5", result: "50" },
      ];
      Calculation.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(items),
        }),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(items);
    });

    test("should return empty array when no history", async () => {
      Calculation.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getHistory(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("addCalculation", () => {
    test("should save a calculation", async () => {
      const calc = {
        _id: new mongoose.Types.ObjectId(),
        title: "CALCULATION",
        expression: "2+2",
        result: "4",
      };
      Calculation.create.mockResolvedValue(calc);

      const req = {
        user: { _id: mockUserId },
        body: { expression: "2+2", result: "4" },
      };
      const res = createMockRes();

      await addCalculation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(calc);
    });

    test("should return 400 if expression is missing", async () => {
      const req = {
        user: { _id: mockUserId },
        body: { result: "4" },
      };
      const res = createMockRes();

      await addCalculation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "expression and result required" })
      );
    });

    test("should return 400 if result is missing", async () => {
      const req = {
        user: { _id: mockUserId },
        body: { expression: "2+2" },
      };
      const res = createMockRes();

      await addCalculation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should use custom title if provided", async () => {
      Calculation.create.mockResolvedValue({
        title: "Custom Title",
        expression: "sin(45)",
        result: "0.707",
      });

      const req = {
        user: { _id: mockUserId },
        body: { title: "Custom Title", expression: "sin(45)", result: "0.707" },
      };
      const res = createMockRes();

      await addCalculation(req, res);

      expect(Calculation.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Custom Title" })
      );
    });

    test("should default title to CALCULATION when not provided", async () => {
      Calculation.create.mockResolvedValue({ title: "CALCULATION" });

      const req = {
        user: { _id: mockUserId },
        body: { expression: "1+1", result: "2" },
      };
      const res = createMockRes();

      await addCalculation(req, res);

      expect(Calculation.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "CALCULATION" })
      );
    });
  });

  describe("clearHistory", () => {
    test("should delete all calculations for user", async () => {
      Calculation.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await clearHistory(req, res);

      expect(Calculation.deleteMany).toHaveBeenCalledWith({ user: mockUserId });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "History cleared" })
      );
    });
  });

  describe("deleteCalculation", () => {
    test("should delete a single calculation", async () => {
      Calculation.findOneAndDelete.mockResolvedValue({ _id: "calc1" });

      const req = { user: { _id: mockUserId }, params: { id: "calc1" } };
      const res = createMockRes();

      await deleteCalculation(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Deleted" })
      );
    });
  });
});

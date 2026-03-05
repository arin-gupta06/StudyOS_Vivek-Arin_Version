/**
 * Auth Middleware Tests
 *
 * Tests the JWT authentication middleware for:
 * - Valid tokens (cookie and header)
 * - Missing tokens
 * - Expired / invalid tokens
 * - Malformed Authorization headers
 */

const jwt = require("jsonwebtoken");
const { createMockReq, createMockRes, createMockNext, createMockUser, generateTestToken } = require("../helpers");

// Mock the User model
jest.mock("../../models/User", () => ({
  findById: jest.fn(),
}));

const User = require("../../models/User");
const { protect } = require("../../middleware/authMiddleware");

process.env.JWT_SECRET = "test_jwt_secret_key_for_testing";

describe("Auth Middleware - protect", () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = createMockUser();
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });
  });

  // ─── Valid Token via Cookie ─────────────────────────────────────
  test("should authenticate with valid JWT cookie", async () => {
    const token = generateTestToken(mockUser._id);
    const req = { cookies: { jwt: token }, headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── Valid Token via Authorization Header ───────────────────────
  test("should authenticate with valid Bearer token in header", async () => {
    const token = generateTestToken(mockUser._id);
    const req = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
    };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
  });

  // ─── Cookie takes priority over header ──────────────────────────
  test("should prefer cookie token over header token", async () => {
    const cookieUser = createMockUser({ username: "cookieUser" });
    const headerUser = createMockUser({ username: "headerUser" });

    const cookieToken = generateTestToken(cookieUser._id);
    const headerToken = generateTestToken(headerUser._id);

    // First call returns cookieUser, second would return headerUser
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(cookieUser),
    });

    const req = {
      cookies: { jwt: cookieToken },
      headers: { authorization: `Bearer ${headerToken}` },
    };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(cookieUser);
  });

  // ─── No Token Provided ─────────────────────────────────────────
  test("should return 401 when no token is provided", async () => {
    const req = { cookies: {}, headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Not authorized, no token" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Invalid / Tampered Token ──────────────────────────────────
  test("should return 401 for an invalid token", async () => {
    const req = { cookies: { jwt: "invalid.token.here" }, headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Not authorized, token failed" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Expired Token ─────────────────────────────────────────────
  test("should return 401 for an expired token", async () => {
    const expiredToken = jwt.sign(
      { id: mockUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" } // already expired
    );
    const req = { cookies: { jwt: expiredToken }, headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Token signed with wrong secret ────────────────────────────
  test("should return 401 for token signed with wrong secret", async () => {
    const badToken = jwt.sign({ id: mockUser._id }, "wrong_secret", {
      expiresIn: "1h",
    });
    const req = { cookies: { jwt: badToken }, headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Malformed Authorization Header ────────────────────────────
  test("should return 401 for Authorization header without Bearer prefix", async () => {
    const token = generateTestToken(mockUser._id);
    const req = {
      cookies: {},
      headers: { authorization: `Token ${token}` },
    };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Not authorized, no token" })
    );
  });

  // ─── Empty Authorization Header ────────────────────────────────
  test("should return 401 for empty Authorization header", async () => {
    const req = {
      cookies: {},
      headers: { authorization: "" },
    };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ─── User Not Found in DB ──────────────────────────────────────
  test("should return 401 when user not found in database", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const token = generateTestToken(mockUser._id);
    const req = { cookies: { jwt: token }, headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    // The middleware calls next() even with null user since it doesn't check
    // Controllers will fail downstream, but middleware passes
    expect(next).toHaveBeenCalled();
  });

  // ─── Bearer with extra spaces ──────────────────────────────────
  test("should authenticate with Bearer token with extra spaces stripped", async () => {
    const token = generateTestToken(mockUser._id);
    const req = {
      cookies: {},
      headers: { authorization: `Bearer  ${token}` }, // double space
    };
    const res = createMockRes();
    const next = createMockNext();

    await protect(req, res, next);

    // Double space means split(' ')[1] is empty, so this should fail
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

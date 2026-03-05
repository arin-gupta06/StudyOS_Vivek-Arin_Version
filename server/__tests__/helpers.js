const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Mock JWT secret for testing
process.env.JWT_SECRET = "test_jwt_secret_key_for_testing";
process.env.NODE_ENV = "test";

/**
 * Creates a fake user object for testing protected routes.
 */
const createMockUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  username: "testuser",
  email: "test@example.com",
  avatar: "",
  socialLinks: {
    linkedin: "",
    github: "",
    reddit: "",
    discord: "",
    quora: "",
  },
  ...overrides,
});

/**
 * Generates a valid JWT token for the given user ID.
 */
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

/**
 * Creates a mock request object with user & common fields.
 */
const createMockReq = (user, body = {}, params = {}, query = {}) => ({
  user,
  body,
  params,
  query,
  cookies: {},
  headers: {},
});

/**
 * Creates a mock response object with chaining support.
 */
const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Creates a mock next function for middleware tests.
 */
const createMockNext = () => jest.fn();

module.exports = {
  createMockUser,
  generateTestToken,
  createMockReq,
  createMockRes,
  createMockNext,
};

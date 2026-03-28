const { createClient } = require("redis");
const dotenv = require("dotenv");
dotenv.config();

let redisClient = null;

if (process.env.REDIS_URI) {
  redisClient = createClient({ url: process.env.REDIS_URI });

  redisClient.on("error", (err) => console.error("Redis Client Error", err));
  redisClient.on("connect", () => console.log("Redis Client Connected"));

  redisClient.connect().catch(console.error);
}

module.exports = redisClient;


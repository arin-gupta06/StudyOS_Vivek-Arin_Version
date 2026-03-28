const redisClient = require("../config/redis");

const cache = (ttlSeconds) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET" || !redisClient) {
      return next();
    }

    // Use URL + user ID as cache key to avoid mixed up data
    const key = `cache:${req.user ? req.user.id : "public"}:${req.originalUrl || req.url}`;
    
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Overwrite res.json to intercept the response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Cache the response
        redisClient.setEx(key, ttlSeconds, JSON.stringify(data)).catch((err) => {
          console.error("Redis setEx error:", err);
        });
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Middleware to clear cache based on prefix
const clearCache = async (req, res, next) => {
  if (!redisClient) return next();
  try {
    // When a POST/PUT/DELETE happens, we should invalidate the user's cache
    // E.g., user deletes a note -> clear all caching related to this user
    if (req.user && req.method !== "GET") {
      const keys = await redisClient.keys(`cache:${req.user.id}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error("Clear Cache error:", error);
  }
  next();
};

module.exports = { cache, clearCache };


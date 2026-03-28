module.exports = {
  apps: [
    {
      name: "studyos-api",
      script: "./index.js",
      instances: "max", // Allows node to scale across all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
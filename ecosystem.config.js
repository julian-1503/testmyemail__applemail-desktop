module.exports = {
  apps: [
    {
      name: "Apple Mail Screenshot App",
      script: "index.js",
      max_memory_restart: "1000M",
      restart_delay: 5000,
      max_restarts: 20,
      instances: 1,
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

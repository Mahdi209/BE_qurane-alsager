module.exports = {
  apps: [{
    name: "QuranAlsager",
    script: "./src/server.js",
    instances: 1,  // Changed from "max" to 4 instances
    exec_mode: "cluster",
    watch: true,
    env: {
      NODE_ENV: "development",
      PORT: 5056
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5056
    }
  }]
}

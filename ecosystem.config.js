module.exports = {
  apps: [{
    name: "QuranAlsager",
    script: "./src/server.js",
    instances: 1,
    exec_mode: "cluster",
    watch: true,
    env: {
      NODE_ENV: "development",
      PORT: 6001
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 6001
    }
  }]
}

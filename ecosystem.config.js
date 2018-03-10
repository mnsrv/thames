module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name: "thames",
      script: "index.js",
      env: {},
      env_production : {
        NODE_ENV: "production"
      }
    }
  ]
}

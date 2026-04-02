// PM2 ecosystem configuration for production deployment.
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save              # persist process list across reboots
//   pm2 startup           # generate and enable startup script
//
// Requires: npm run build before starting.
// Env vars are loaded from .env.local by Next.js; do NOT duplicate secrets here.

module.exports = {
  apps: [
    {
      name: 'canvas-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: __dirname,

      // Automatically restart if the process crashes
      autorestart: true,
      // Wait 5 seconds before restarting on crash (avoids tight restart loops)
      restart_delay: 5000,
      // Restart if memory exceeds 512 MB (tune for your server)
      max_memory_restart: '512M',

      // Environment — override or add vars here; secrets should stay in .env.local
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Log files — PM2 rotates these if pm2-logrotate module is installed
      out_file: 'logs/canvas-dashboard.out.log',
      error_file: 'logs/canvas-dashboard.error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Graceful shutdown: wait up to 10 s for in-flight requests to finish
      kill_timeout: 10000,
      listen_timeout: 10000,
    },
  ],
};

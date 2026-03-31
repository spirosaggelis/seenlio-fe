module.exports = {
  apps: [
    {
      name: 'Seenlio-FE',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      merge_logs: true,
    },
  ],
};

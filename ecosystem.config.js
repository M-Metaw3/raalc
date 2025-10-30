module.exports = {
  apps: [{
    name: 'raalc-api',
    script: './src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    // Load .env file
    env_file: '.env',
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Process management
    kill_timeout: 5000,
    wait_ready: false,
    listen_timeout: 10000
  }]
};


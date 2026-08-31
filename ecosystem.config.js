module.exports = {
  apps: [
    {
      name: 'second-brain-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
    {
      name: 'second-brain-bot',
      script: 'scripts/telegram_bot_runner.py',
      interpreter: 'python',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      restart_delay: 3000,
      max_restarts: 50,
      env: {
        PYTHONUNBUFFERED: '1',
      },
    },
  ],
};

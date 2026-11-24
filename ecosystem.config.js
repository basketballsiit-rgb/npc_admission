module.exports = {
  apps: [
    {
      name: "npc_admission",
      script: "/var/www/npc_admission/node_modules/next/dist/bin/next",
      args: "start -p 3007",
      cwd: "/var/www/npc_admission",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: "production",
        PORT: 3007,
        NEXT_PUBLIC_BASE_PATH: "/npc_admission",
      },
    },
  ],
};

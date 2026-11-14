#!/bin/bash
set -e

# ==============================================================
# NPC Admission - Manual & CI/CD Deployment Script
# ตำแหน่งบนเซิร์ฟเวอร์: /var/www/npc_admission/deploy.sh
# ==============================================================

PROJECT_DIR="/var/www/npc_admission"
echo "=== 🚀 Starting NPC_Admission Deployment ==="
cd "$PROJECT_DIR"

# 1. โหลด Node.js Environment (NVM v20)
if [ -d "/root/.nvm/versions/node/v20.20.2/bin" ]; then
    export PATH="/root/.nvm/versions/node/v20.20.2/bin:$PATH"
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 2. ดึงโค้ดล่าสุดจาก GitHub main branch
echo "=== 📥 Git Pull & Reset ==="
git config --global --add safe.directory "$PROJECT_DIR" || true
git fetch origin main
git reset --hard origin/main

# 3. ตรวจสอบไฟล์ .env
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# 4. ติดตั้ง Node Dependencies
echo "=== 📦 Installing NPM Packages ==="
npm install --prefer-offline --no-audit --no-fund

# 5. ซิงค์ฐานข้อมูล Prisma
echo "=== 🗄️ Prisma Generate & DB Push & Seed ==="
npx prisma generate
npx prisma db push --accept-data-loss || true
node prisma/seed.js || true

# 6. Build Next.js Production
echo "=== ⚡ Building Next.js Application ==="
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build

# 7. รีสตาร์ท Process ด้วย PM2 (พอร์ต 3007)
echo "=== 🔄 Restarting Application via PM2 ==="
if command -v pm2 > /dev/null 2>&1; then
    pm2 restart npc_admission || pm2 start ecosystem.config.js
    pm2 save
else
    npx pm2 restart npc_admission || npx pm2 start ecosystem.config.js
    npx pm2 save
fi

echo "=== ✅ NPC_Admission Deployment Completed Successfully ==="

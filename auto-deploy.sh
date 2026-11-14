#!/bin/bash
# ==============================================================
# NPC ADMISSION - Automated Polling Deploy Script
# รูปแบบเดียวกับ /var/www/npc_smartflow/auto-deploy.sh
# ==============================================================

PROJECT_DIR="/var/www/npc_admission"
cd "$PROJECT_DIR"

if [ -d "/root/.nvm/versions/node/v20.20.2/bin" ]; then
    export PATH="/root/.nvm/versions/node/v20.20.2/bin:$PATH"
fi

# ตรวจสอบการเชื่อมต่อกับ Remote ก่อนทำงาน
git fetch origin main > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "$(date): [Error] Cannot fetch from origin. Check network or Git configuration." >> deploy.log
    exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# หากพบว่าโค้ดบน GitHub มีการแก้ไข (Local ไม่ตรงกับ Remote)
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): [Update Found] Starting automated deployment..." >> deploy.log

    git pull origin main >> deploy.log 2>&1
    npm install --prefer-offline --no-audit --no-fund >> deploy.log 2>&1
    npx prisma generate >> deploy.log 2>&1
    npx prisma db push --accept-data-loss >> deploy.log 2>&1
    npm run build >> deploy.log 2>&1

    if [ $? -eq 0 ]; then
        if command -v pm2 > /dev/null 2>&1; then
            pm2 restart npc_admission || pm2 start ecosystem.config.js >> deploy.log 2>&1
        fi
        echo "$(date): [Finished] NPC Admission is up to date and online!" >> deploy.log
    else
        echo "$(date): [Error] Build failed! Rollback or manual fix required." >> deploy.log
    fi
else
    echo "$(date): [No Change] Already up to date." >> deploy.log
fi

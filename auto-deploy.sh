#!/bin/bash
# ==============================================================
# NPC ADMISSION - Automated Polling Deploy Script (For Crontab)
# ตำแหน่งบนเซิร์ฟเวอร์: /var/www/npc_admission/auto-deploy.sh
# รูปแบบเดียวกับ /var/www/npc_smartflow/auto-deploy.sh
# ==============================================================

PROJECT_DIR="/var/www/npc_admission"
LOCK_FILE="/tmp/npc_admission_deploy.lock"
cd "$PROJECT_DIR" || exit 1

# ป้องกันการรันซ้ำซ้อนขณะกำลัง build
if [ -f "$LOCK_FILE" ]; then
    # หากค้างเกิน 15 นาที ให้ลบ lock ทิ้ง
    if [ $(find "$LOCK_FILE" -mmin +15) ]; then
        rm -f "$LOCK_FILE"
    else
        exit 0
    fi
fi

# โหลด Node.js และ PM2
if [ -d "/root/.nvm/versions/node/v20.20.2/bin" ]; then
    export PATH="/root/.nvm/versions/node/v20.20.2/bin:$PATH"
fi

# ตรวจสอบการเชื่อมต่อกับ Remote ก่อนทำงาน
git config --global --add safe.directory "$PROJECT_DIR" || true
git fetch origin main > /dev/null 2>&1
if [ $? -ne 0 ]; then
    exit 0
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# หากพบว่าโค้ดบน GitHub มีการแก้ไข (Local ไม่ตรงกับ Remote)
if [ "$LOCAL" != "$REMOTE" ]; then
    touch "$LOCK_FILE"
    echo "==========================================================" >> deploy.log
    echo "$(date): [Update Found] Starting automated deployment..." >> deploy.log
    echo "Remote commit: $REMOTE" >> deploy.log

    # 1. ดึงโค้ดล่าสุดลงมา
    git pull origin main >> deploy.log 2>&1

    # 2. ซิงค์ Prisma & ติดตั้งแพ็กเกจ
    npx prisma generate >> deploy.log 2>&1
    npx prisma db push --accept-data-loss >> deploy.log 2>&1

    # 3. Build Next.js Production
    echo "$(date): [Build] Running npm run build..." >> deploy.log
    npm run build >> deploy.log 2>&1

    if [ $? -eq 0 ]; then
        echo "$(date): [Build Success] Restarting PM2 process..." >> deploy.log

        # 4. รีสตาร์ทผ่าน PM2
        if command -v pm2 > /dev/null 2>&1; then
            pm2 restart npc_admission --update-env || pm2 start ecosystem.config.js >> deploy.log 2>&1
            pm2 save >> deploy.log 2>&1
        elif [ -x "/root/.nvm/versions/node/v20.20.2/bin/pm2" ]; then
            /root/.nvm/versions/node/v20.20.2/bin/pm2 restart npc_admission --update-env || /root/.nvm/versions/node/v20.20.2/bin/pm2 start ecosystem.config.js >> deploy.log 2>&1
            /root/.nvm/versions/node/v20.20.2/bin/pm2 save >> deploy.log 2>&1
        fi

        echo "$(date): [Finished] ✅ NPC Admission is up to date and online!" >> deploy.log
    else
        echo "$(date): [Error] ❌ Build failed! Check deploy.log." >> deploy.log
    fi

    rm -f "$LOCK_FILE"
fi

@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ====================================================
echo   Second Brain AI — GitHub + Render Deploy
echo ====================================================
echo.

SET GITCMD=C:\Program Files\Git\cmd\git.exe

echo [OK] Git 2.46.0 topildi
echo.
echo GitHub Personal Access Token olish:
echo   1. github.com ga kiring (yoki ro'yxatdan o'ting)
echo   2. Settings ^> Developer settings ^> Personal access tokens ^> Tokens (classic)
echo   3. "Generate new token (classic)" bosing
echo   4. Note: second-brain, Expiration: No expiration
echo   5. "repo" checkboxni belgilang
echo   6. "Generate token" bosing va tokenni NUSXALANG
echo.

SET /P GITHUB_USER=GitHub username kiriting: 
SET /P GITHUB_TOKEN=GitHub token kiriting (ghp_...): 

echo.
echo [1/4] Git konfiguratsiya...
"%GITCMD%" config --global user.name "%GITHUB_USER%"
"%GITCMD%" config --global user.email "%GITHUB_USER%@users.noreply.github.com"
echo  OK

echo [2/4] GitHub da repository yaratilmoqda...
curl -s -X POST -H "Authorization: token %GITHUB_TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"second-brain-ai\",\"private\":true,\"description\":\"Second Brain AI Neural Knowledge System\"}" https://api.github.com/user/repos > nul 2>&1
echo  OK (allaqachon mavjud bo'lsa ham OK)

echo [3/4] Git repository tayyorlanmoqda...
IF NOT EXIST ".git" (
    "%GITCMD%" init
)
"%GITCMD%" add .
"%GITCMD%" commit -m "Deploy: Second Brain AI v1.0" --allow-empty
"%GITCMD%" branch -M main
"%GITCMD%" remote remove origin > nul 2>&1
"%GITCMD%" remote add origin https://%GITHUB_USER%:%GITHUB_TOKEN%@github.com/%GITHUB_USER%/second-brain-ai.git

echo [4/4] GitHub ga yuklanmoqda...
"%GITCMD%" push -u origin main --force
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo  MUVAFFAQIYAT! Kod yuklandi.
    echo  https://github.com/%GITHUB_USER%/second-brain-ai
    echo ====================================================
    echo.
    echo  Render.com da deploy:
    echo  1. https://render.com ga o'ting
    echo  2. "Sign in with GitHub" bosing
    echo  3. New + =^> Web Service =^> second-brain-ai
    echo  4. Build: npm ci --production=false ^&^& npx prisma generate ^&^& npm run build
    echo  5. Start: node scripts/render-start.js
    echo  6. Plan: Free
    echo  7. Environment Variables qo'shing (ENV_VARS.txt ga qarang)
    echo.
) ELSE (
    echo.
    echo  XATO: Push muvaffaqiyatsiz!
    echo  Token to'g'ri ekanligini tekshiring.
)

pause

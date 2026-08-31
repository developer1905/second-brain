"""
Second Brain AI — Avtomatik GitHub Deploy Script
Foydalanuvchi faqat GitHub token va username kiritadi.
"""
import os
import sys
import subprocess
import shutil
import json
import urllib.request

def run(cmd, cwd=None, check=True):
    """Run command and print output."""
    print(f"  > {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    if result.stdout.strip():
        print(f"    {result.stdout.strip()}")
    if result.returncode != 0 and check:
        if result.stderr.strip():
            print(f"    XATO: {result.stderr.strip()}")
    return result

def find_git():
    """Find git executable."""
    candidates = [
        "git",
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files (x86)\Git\cmd\git.exe",
        r"C:\Users\555\AppData\Local\Programs\Git\cmd\git.exe",
    ]
    for g in candidates:
        result = subprocess.run([g, "--version"], capture_output=True)
        if result.returncode == 0:
            return g
    return None

def create_github_repo(username, token, repo_name="second-brain-ai"):
    """Create private GitHub repository via API."""
    url = "https://api.github.com/user/repos"
    data = json.dumps({
        "name": repo_name,
        "private": True,
        "description": "Second Brain AI — O'zbek tili Neural Knowledge System",
        "auto_init": False,
    }).encode()
    
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"token {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "SecondBrainDeployer/1.0")
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            return result.get("clone_url"), None
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        err_data = json.loads(body) if body else {}
        if "already exists" in str(err_data):
            return f"https://github.com/{username}/{repo_name}.git", "already_exists"
        return None, err_data.get("message", str(e))
    except Exception as e:
        return None, str(e)

def main():
    print("=" * 55)
    print("  Second Brain AI — GitHub + Render Deploy")
    print("=" * 55)
    print()
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. Git topish
    print("[1/6] Git tekshirilmoqda...")
    git = find_git()
    if not git:
        print("  ❌ Git topilmadi!")
        print("  https://git-scm.com/download/win dan yuklab o'rnatib qayta ishga tushiring.")
        sys.exit(1)
    print(f"  ✅ Git topildi: {git}")
    
    # 2. GitHub ma'lumotlari
    print()
    print("[2/6] GitHub ma'lumotlari:")
    print("  GitHub Personal Access Token olish:")
    print("  github.com → Settings → Developer settings → Personal access tokens → Classic")
    print("  'repo' permissionini bering.")
    print()
    username = input("  GitHub username: ").strip()
    token    = input("  GitHub Personal Access Token: ").strip()
    
    if not username or not token:
        print("  ❌ Username yoki token kiritilmadi!")
        sys.exit(1)
    
    # 3. GitHub repo yaratish
    print()
    print("[3/6] GitHub repository yaratilmoqda...")
    repo_url, err = create_github_repo(username, token, "second-brain-ai")
    
    if err == "already_exists":
        print(f"  ℹ️  Repo allaqachon mavjud: {repo_url}")
    elif err:
        print(f"  ❌ Repo yaratishda xatolik: {err}")
        print("  Token to'g'riligini tekshiring.")
        sys.exit(1)
    else:
        print(f"  ✅ Repo yaratildi: {repo_url}")
    
    # Remote URL with token for push
    auth_url = f"https://{username}:{token}@github.com/{username}/second-brain-ai.git"
    
    # 4. Git init va commit
    print()
    print("[4/6] Git repository tayyorlanmoqda...")
    
    git_dir = os.path.join(BASE_DIR, ".git")
    if not os.path.exists(git_dir):
        run([git, "init"], cwd=BASE_DIR)
    
    run([git, "config", "user.name", username], cwd=BASE_DIR)
    run([git, "config", "user.email", f"{username}@users.noreply.github.com"], cwd=BASE_DIR)
    
    run([git, "add", "."], cwd=BASE_DIR)
    
    result = run([git, "commit", "-m", "Initial commit: Second Brain AI v1.0"], cwd=BASE_DIR, check=False)
    if result.returncode != 0 and "nothing to commit" in result.stdout + result.stderr:
        print("  ℹ️  Hech qanday o'zgarish yo'q, mavjud commit ishlatiladi.")
    
    run([git, "branch", "-M", "main"], cwd=BASE_DIR)
    
    # Remove old remote if exists
    run([git, "remote", "remove", "origin"], cwd=BASE_DIR, check=False)
    run([git, "remote", "add", "origin", auth_url], cwd=BASE_DIR)
    
    # 5. GitHub ga push
    print()
    print("[5/6] GitHub ga yuklanmoqda (bu bir necha daqiqa ketishi mumkin)...")
    result = run([git, "push", "-u", "origin", "main", "--force"], cwd=BASE_DIR, check=False)
    
    if result.returncode != 0:
        print(f"  ❌ Push muvaffaqiyatsiz!")
        print(f"  {result.stderr}")
        sys.exit(1)
    
    print("  ✅ Kod GitHub ga yuklandi!")
    
    # 6. Render ko'rsatmalar
    print()
    print("[6/6] ✅ BARCHA TAYYOR!")
    print()
    print("=" * 55)
    print("  Render.com da deploy uchun:")
    print("=" * 55)
    print()
    print("  1. https://render.com ga o'ting")
    print("  2. 'Sign in with GitHub' bosing")
    print("  3. New + → Web Service")
    print(f"  4. '{username}/second-brain-ai' reponi tanlang")
    print("  5. Quyidagilarni kiriting:")
    print()
    print("     Build Command:")
    print("     npm ci --production=false && npx prisma generate && npm run build")
    print()
    print("     Start Command:")
    print("     node scripts/render-start.js")
    print()
    print("     Plan: Free")
    print()
    print("  6. Environment Variables:")
    print("     DATABASE_URL = file:./prisma/prod.db")
    print("     ADMIN_PASSWORD = admin2025")
    print("     TELEGRAM_BOT_TOKEN = (token)")
    print("     TELEGRAM_ADMIN_ID = (admin id)")
    print("     GEMINI_API_KEY = (key)")
    print()
    print("  7. Deploy tugagach URL ni NEXT_PUBLIC_APP_URL ga kiriting")
    print()
    print("  8. UptimeRobot (BEPUL) bilan doim yoqiq saqlash:")
    print("     https://uptimerobot.com → Monitor type: HTTP(s)")
    print("     URL: https://YOUR-APP.onrender.com/api/health")
    print("     Interval: 5 minutes")
    print()
    print(f"  GitHub: https://github.com/{username}/second-brain-ai")
    print("=" * 55)

if __name__ == "__main__":
    main()

"""
커밋할 때마다 화면 버전(1.커밋 수)과 날짜를 자동으로 올리는 git 훅을 설치한다 (새 컴퓨터에서 한 번).

    python tools/install_hooks.py
"""
import os
import shutil
import stat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(ROOT, "tools", "hooks", "pre-commit")
dst = os.path.join(ROOT, ".git", "hooks", "pre-commit")
shutil.copyfile(src, dst)
os.chmod(dst, os.stat(dst).st_mode | stat.S_IEXEC)
print(f"설치했어요: {dst}")

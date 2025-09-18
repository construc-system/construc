@echo off
echo ==========================
echo  STATUS REPO SEKARANG
echo ==========================
git status
echo.

set /p files=File/folder yang mau di-add (isi . untuk semua): 
git add %files%

set /p msg=Pesan commit: 
git commit -m "%msg%"

echo Menjalankan git pull...
git pull origin main
if errorlevel 1 (
    echo Pull gagal ❌
    pause
    exit /b
) else (
    echo Pull berhasil ✅
)

echo Menjalankan git push...
git push origin main
if errorlevel 1 (
    echo Push gagal ❌
    pause
    exit /b
) else (
    echo Push berhasil ✅
)

echo Selesai 🚀
pause

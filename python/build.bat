@echo off
chcp 65001 >nul
echo ============================================
echo   简易 Git GUI - EXE 构建工具
echo ============================================
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM 安装依赖
echo [1/3] 安装构建依赖...
pip install pyinstaller -q

REM 构建
echo [2/3] 开始构建...
pyinstaller --noconfirm --clean SimpleGitGUI.spec

REM 完成
echo.
echo [3/3] 构建完成！
echo.
echo 输出文件: %~dp0dist\SimpleGitGUI.exe
echo.
pause

# -*- coding: utf-8 -*-
"""
构建 EXE 脚本
使用 PyInstaller 将程序打包成单个可执行文件
"""

import subprocess
import sys
import os

def main():
    # 确保在正确的目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("=" * 50)
    print("简易 Git GUI - EXE 构建工具")
    print("=" * 50)
    
    # 检查 PyInstaller 是否安装
    try:
        import PyInstaller
        print(f"✓ PyInstaller 版本: {PyInstaller.__version__}")
    except ImportError:
        print("✗ PyInstaller 未安装，正在安装...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("✓ PyInstaller 安装完成")
    
    # 构建命令
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=SimpleGitGUI",           # 输出名称
        "--onefile",                      # 单文件模式
        "--windowed",                     # 无控制台窗口 (GUI 模式)
        "--noconfirm",                    # 覆盖已有文件
        "--clean",                        # 清理临时文件
        "--add-data=simple_git_gui;simple_git_gui",  # Windows: 分号分隔
        "--version-file=version_info.txt",  # 版本信息
        "run_git_gui.py"                  # 入口脚本
    ]
    
    print("\n正在构建...")
    print(f"命令: {' '.join(cmd)}\n")
    
    try:
        subprocess.check_call(cmd)
        print("\n" + "=" * 50)
        print("✓ 构建成功！")
        print(f"  输出文件: {os.path.join(script_dir, 'dist', 'SimpleGitGUI.exe')}")
        print("=" * 50)
    except subprocess.CalledProcessError as e:
        print(f"\n✗ 构建失败: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

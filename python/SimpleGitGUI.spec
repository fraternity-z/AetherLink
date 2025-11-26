# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller 构建规格文件
用于更精细地控制构建过程
使用方法: pyinstaller SimpleGitGUI.spec
"""

block_cipher = None

a = Analysis(
    ['run_git_gui.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'simple_git_gui',
        'simple_git_gui.config',
        'simple_git_gui.git_core',
        'simple_git_gui.ui_components',
        'simple_git_gui.app',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='SimpleGitGUI',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # 设为 True 可以看到调试输出
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # 可以添加图标: icon='icon.ico'
)

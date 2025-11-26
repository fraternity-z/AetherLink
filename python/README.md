# 简易 Git GUI (SimpleGitGUI)

一个基于 Tkinter 的轻量级 Git 图形界面工具，支持 Windows、macOS 和 Linux。

## 🚀 功能特性

- **仓库管理** - 选择和切换 Git 仓库
- **状态查看** - 实时显示未暂存和已暂存的文件
- **文件操作** - 暂存/取消暂存单个或多个文件
- **提交管理** - 编写和提交更改
- **分支操作** - 创建、切换、删除分支
- **远程仓库** - 添加、删除远程仓库，推送/拉取代码
- **异步执行** - 所有 Git 命令异步执行，UI 不卡顿
- **中文支持** - 完美支持中文文件名和路径

## 📦 安装和运行

### 方式一：直接运行源码

```bash
# 克隆或下载项目
cd python

# 安装依赖（仅需构建时）
pip install -r requirements.txt

# 运行程序
python run_git_gui.py
```

### 方式二：模块方式运行

```bash
# 在 python 目录下
python -m simple_git_gui
```

### 方式三：构建成 EXE（Windows）

```bash
# 使用批处理脚本（推荐）
build.bat

# 或使用 Python 脚本
python build_exe.py

# 或直接使用 PyInstaller
pyinstaller SimpleGitGUI.spec
```

构建完成后，可执行文件位于 `dist/SimpleGitGUI.exe`

## 🛠️ 项目结构

```
python/
├── simple_git_gui/          # 主模块
│   ├── __init__.py          # 包初始化
│   ├── __main__.py          # 模块入口
│   ├── config.py            # 配置常量
│   ├── git_core.py          # Git 核心功能
│   ├── ui_components.py     # UI 组件
│   └── app.py               # 主应用程序
├── run_git_gui.py          # 启动脚本
├── build_exe.py            # Python 构建脚本
├── build.bat               # Windows 批处理构建脚本
├── SimpleGitGUI.spec       # PyInstaller 规格文件
├── version_info.txt        # Windows 版本信息
├── requirements.txt        # 依赖列表
└── README.md              # 说明文档
```

## ✨ 主要改进

相比原版 `1.py`，新版本修复了以下问题：

1. **内存泄漏修复** - 移除了 `lru_cache` 装饰器，避免对象无法回收
2. **线程安全改进** - 使用锁保护共享状态，避免竞态条件
3. **异步执行优化** - 所有 Git 命令异步执行，UI 响应更流畅
4. **模块化设计** - 代码按功能分离，便于维护和扩展
5. **异常处理增强** - 添加完善的错误处理，提高稳定性
6. **构建系统完善** - 支持一键打包成 EXE

## 📋 使用说明

1. **选择仓库** - 点击"选择仓库目录"按钮选择 Git 仓库
2. **查看状态** - 程序会自动显示文件状态
3. **暂存文件** - 选择文件后点击"暂存选中项"
4. **提交更改** - 输入提交信息后点击"提交"
5. **分支操作** - 使用下拉列表切换或创建分支
6. **远程同步** - 配置远程仓库后进行推送/拉取

## 🔧 系统要求

- Python 3.8+
- Git 命令行工具（需要在 PATH 中）
- Windows/macOS/Linux

## 📝 注意事项

- 程序依赖系统安装的 Git 命令行工具
- 首次运行可能需要配置 Git 用户信息
- 推送/拉取操作需要网络连接和认证配置
- 建议在 Git 仓库根目录下运行

## 🐛 问题反馈

如遇到问题，请检查：
1. Git 是否正确安装并在 PATH 中
2. 当前目录是否为有效的 Git 仓库
3. 网络连接是否正常（远程操作时）

## 📄 许可证

本项目采用 MIT 许可证。

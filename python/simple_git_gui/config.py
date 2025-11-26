# -*- coding: utf-8 -*-
"""
配置常量模块
"""

import platform


class Config:
    """应用配置常量"""
    
    # 窗口配置
    WINDOW_TITLE = "简易 Git 图形界面 (v2.0)"
    WINDOW_WIDTH = 950
    WINDOW_HEIGHT = 780
    
    # 性能配置
    COMMAND_TIMEOUT = 30  # Git 命令超时时间（秒）
    MAX_OUTPUT_LINES = 1000  # 输出区域最大行数
    REFRESH_DELAY_MS = 100  # 刷新延迟（毫秒）
    BRANCH_UPDATE_DELAY_MS = 200  # 分支更新延迟
    
    # Git 配置
    DEFAULT_REMOTE = "origin"
    PROTECTED_BRANCHES = ['main', 'master', 'dev', 'develop', 'release']
    STATUS_EXCLUDE_PATTERNS = []  # 在此添加需要从未暂存列表隐藏的相对路径或通配符
    
    # 分支名称验证正则
    INVALID_BRANCH_CHARS = r'\s|~|\^|:|\\|\.\.|\*|\?|\[|@\{'
    
    # 字体配置
    OUTPUT_FONT = ("Consolas", 9)
    BRANCH_FONT = ('TkDefaultFont', 10, 'bold')
    
    # 主题配置
    @staticmethod
    def get_theme():
        """根据操作系统获取合适的主题"""
        system = platform.system()
        if system == "Windows":
            return 'vista'  # 或 'xpnative'
        elif system == "Darwin":
            return 'aqua'
        else:
            return 'clam'
    
    # 欢迎信息
    WELCOME_MESSAGE = (
        "欢迎使用简易 Git GUI！\n"
        "请确保此脚本在 Git 仓库根目录下运行，"
        "或使用\"选择仓库目录\"按钮指定。\n"
    )

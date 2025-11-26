# -*- coding: utf-8 -*-
"""
简易 Git 图形界面工具
模块化重构版本
"""

__version__ = "2.0.0"
__author__ = "SimpleGitGUI"

from .config import Config
from .git_core import GitCore
from .app import SimpleGitApp, main

__all__ = ['Config', 'GitCore', 'SimpleGitApp', 'main']

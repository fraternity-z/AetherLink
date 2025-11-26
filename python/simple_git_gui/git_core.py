# -*- coding: utf-8 -*-
"""
Git 核心功能模块
处理所有 Git 命令的执行和解析
"""

import os
import subprocess
import threading
import queue
from typing import Optional, Tuple, List, Callable, Any

from .config import Config


class GitCore:
    """Git 命令执行核心类"""
    
    def __init__(self, repo_path: str = None):
        self.repo_path = repo_path or os.getcwd()
        
        # 异步执行相关
        self.result_queue = queue.Queue()
        self._is_busy = False
        self._busy_lock = threading.Lock()  # 修复：使用锁保证线程安全
        
        # 缓存（修复：使用字典而非 lru_cache）
        self._repo_cache = {}
        self._path_cache = {}
    
    @property
    def is_busy(self) -> bool:
        """线程安全地获取忙碌状态"""
        with self._busy_lock:
            return self._is_busy
    
    @is_busy.setter
    def is_busy(self, value: bool):
        """线程安全地设置忙碌状态"""
        with self._busy_lock:
            self._is_busy = value
    
    def is_git_repo(self, path: str) -> bool:
        """检查指定路径是否为 Git 仓库（带缓存）"""
        if not path:
            return False
        
        # 规范化路径
        norm_path = os.path.normpath(path)
        
        # 检查缓存
        if norm_path in self._repo_cache:
            return self._repo_cache[norm_path]
        
        # 检查是否存在 .git 目录
        result = os.path.isdir(path) and os.path.exists(os.path.join(path, '.git'))
        
        # 缓存结果（限制缓存大小）
        if len(self._repo_cache) > 32:
            self._repo_cache.clear()
        self._repo_cache[norm_path] = result
        
        return result
    
    def clear_cache(self):
        """清理缓存"""
        self._repo_cache.clear()
        self._path_cache.clear()
    
    def parse_git_path(self, filepath: str) -> str:
        """解析 Git 输出的文件路径"""
        if not filepath:
            return filepath
        
        # 检查缓存
        if filepath in self._path_cache:
            return self._path_cache[filepath]
        
        result = filepath
        
        # 处理引号
        if result.startswith('"') and result.endswith('"'):
            result = result[1:-1]
        
        # 处理重命名 (old -> new)
        if ' -> ' in result:
            result = result.split(' -> ')[-1]
            if result.startswith('"') and result.endswith('"'):
                result = result[1:-1]
        
        # 处理转义字符
        if '\\' in result:
            try:
                # 尝试解码八进制转义（Git 对非 ASCII 字符的处理）
                result = result.encode('latin-1').decode('unicode_escape').encode('latin-1').decode('utf-8')
            except (UnicodeDecodeError, UnicodeEncodeError):
                try:
                    result = result.encode('utf-8').decode('unicode_escape')
                except (UnicodeDecodeError, UnicodeEncodeError):
                    pass  # 保留原始路径
        
        # 限制缓存大小
        if len(self._path_cache) > 128:
            self._path_cache.clear()
        self._path_cache[filepath] = result
        
        return result
    
    def run_command_sync(self, command_list: List[str]) -> Tuple[str, str, int]:
        """
        同步执行 Git 命令
        
        Returns:
            (stdout, stderr, returncode) 元组
        """
        if not self.repo_path or not os.path.exists(self.repo_path):
            err_msg = f"错误：仓库路径 '{self.repo_path}' 无效或不存在。"
            return "", err_msg, -1
        
        try:
            env = os.environ.copy()
            env['GIT_EDITOR'] = 'true'
            
            process = subprocess.run(
                command_list,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                cwd=self.repo_path,
                check=False,
                env=env,
                timeout=Config.COMMAND_TIMEOUT
            )
            
            # 清理输出 - 保留空行和状态码格式
            stdout_clean = process.stdout
            stderr_clean = process.stderr
            
            return stdout_clean, stderr_clean, process.returncode
            
        except subprocess.TimeoutExpired:
            return "", f"Git 命令执行超时（{Config.COMMAND_TIMEOUT}秒）", -1
        except FileNotFoundError:
            return "", "错误: 'git' 命令未找到。请确保 Git 已安装并在 PATH 中。", -1
        except Exception as e:
            return "", f"运行命令时发生错误: {e}", -1
    
    def run_command_async(
        self,
        command_list: List[str],
        callback: Optional[Callable] = None,
        command_type: str = "Git命令"
    ) -> bool:
        """
        异步执行 Git 命令
        
        Args:
            command_list: 命令列表
            callback: 完成回调函数 callback(success, stdout, stderr)
            command_type: 命令类型描述
            
        Returns:
            是否成功启动命令
        """
        # 使用锁确保原子操作
        with self._busy_lock:
            if self._is_busy:
                return False
            self._is_busy = True
        
        def execute():
            try:
                stdout, stderr, returncode = self.run_command_sync(command_list)
                success = returncode == 0
                self.result_queue.put((command_type, success, stdout, stderr, callback))
            except Exception as e:
                self.result_queue.put((command_type, False, "", str(e), callback))
            finally:
                with self._busy_lock:
                    self._is_busy = False
        
        thread = threading.Thread(target=execute, daemon=True)
        thread.start()
        return True
    
    # ==================== Git 操作方法 ====================
    
    def get_status(self) -> Tuple[List[Tuple[str, str]], List[Tuple[str, str]]]:
        """
        获取仓库状态
        
        Returns:
            (unstaged_files, staged_files) 元组
            每个文件是 (status_code, filepath) 元组
        """
        unstaged = []
        staged = []
        
        stdout, _, returncode = self.run_command_sync(['git', 'status', '--porcelain=v1'])
        if returncode != 0 or not stdout:
            return unstaged, staged
        
        for line in stdout.split('\n'):
            if not line:
                continue
            
            # Git porcelain format: XY filename
            # X = staged status, Y = working tree status
            status_code = line[:2]
            filepath = line[3:]  # 不用 strip()，保留原始路径
            
            # 解析文件路径（处理转义等）
            filepath = self.parse_git_path(filepath)
            
            staged_char = status_code[0]
            unstaged_char = status_code[1]
            
            # 已暂存（第一个字符不是空格且不是问号）
            if staged_char != ' ' and staged_char != '?':
                staged.append((status_code, filepath))
            
            # 未暂存（第二个字符不是空格，或者是未跟踪文件）
            if unstaged_char != ' ' or status_code == '??':
                unstaged.append((status_code, filepath))
        
        return unstaged, staged
    
    def get_current_branch(self) -> str:
        """获取当前分支名"""
        stdout, _, returncode = self.run_command_sync(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD']
        )
        if returncode == 0 and stdout:
            return stdout.strip()
        return "未知"
    
    def get_all_branches(self) -> Tuple[str, List[str], List[str]]:
        """
        获取所有分支
        
        Returns:
            (current_branch, local_branches, remote_branches) 元组
        """
        stdout, _, returncode = self.run_command_sync(
            ['git', 'branch', '-a', '--no-color']
        )
        
        if returncode != 0:
            return "未知", [], []
        
        current_branch = None
        local_branches = []
        remote_branches = []
        
        for line in stdout.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            is_current = line.startswith('*')
            branch_name = line.replace('*', '').strip()
            
            # 跳过特殊引用
            if 'HEAD detached' in branch_name or ' -> ' in branch_name:
                if is_current:
                    current_branch = branch_name
                continue
            
            if branch_name.startswith('remotes/'):
                parts = branch_name.split('/', 2)
                if len(parts) == 3:
                    display_name = f"{parts[1]}/{parts[2]}"
                    remote_branches.append(display_name)
            else:
                local_branches.append(branch_name)
                if is_current:
                    current_branch = branch_name
        
        if current_branch is None and local_branches:
            current_branch = local_branches[0]
        
        return current_branch or "未知", local_branches, remote_branches
    
    def get_remotes(self) -> List[str]:
        """获取所有远程仓库"""
        stdout, _, returncode = self.run_command_sync(['git', 'remote'])
        if returncode != 0 or not stdout:
            return []
        return [r.strip() for r in stdout.split('\n') if r.strip()]
    
    def get_remote_url(self, remote_name: str) -> Optional[str]:
        """获取远程仓库 URL"""
        stdout, _, returncode = self.run_command_sync(
            ['git', 'remote', 'get-url', remote_name]
        )
        if returncode == 0 and stdout:
            return stdout.strip()
        return None
    
    def stage_files(self, files: List[str]) -> Tuple[bool, str]:
        """暂存文件"""
        command = ['git', 'add', '--'] + files
        stdout, stderr, returncode = self.run_command_sync(command)
        return returncode == 0, stderr or stdout
    
    def unstage_files(self, files: List[str]) -> Tuple[bool, str]:
        """取消暂存文件"""
        command = ['git', 'reset', 'HEAD', '--'] + files
        stdout, stderr, returncode = self.run_command_sync(command)
        return returncode == 0, stderr or stdout
    
    def commit(self, message: str) -> Tuple[bool, str]:
        """提交更改"""
        stdout, stderr, returncode = self.run_command_sync(
            ['git', 'commit', '-m', message]
        )
        return returncode == 0, stderr or stdout
    
    def has_staged_changes(self) -> bool:
        """检查是否有已暂存的更改"""
        _, _, returncode = self.run_command_sync(['git', 'diff', '--cached', '--quiet'])
        return returncode != 0
    
    def has_uncommitted_changes(self) -> bool:
        """检查是否有未提交的更改"""
        _, _, wc_dirty = self.run_command_sync(['git', 'diff', '--quiet'])
        _, _, idx_dirty = self.run_command_sync(['git', 'diff', '--cached', '--quiet'])
        return wc_dirty != 0 or idx_dirty != 0
    
    def configure_quotepath(self):
        """配置 Git 正确显示中文文件名"""
        self.run_command_sync(['git', 'config', 'core.quotepath', 'false'])

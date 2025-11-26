# -*- coding: utf-8 -*-
"""
主应用程序模块
整合所有组件，构建完整的 Git GUI 应用
"""

import tkinter as tk
import tkinter.ttk as ttk
import tkinter.scrolledtext as scrolledtext
import tkinter.messagebox as messagebox
import tkinter.filedialog as filedialog
import os
import platform
import re
import fnmatch

from .config import Config
from .git_core import GitCore
from .ui_components import OutputPanel, DialogHelper


class SimpleGitApp:
    """简易 Git 图形界面应用主类"""
    
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(Config.WINDOW_TITLE)
        self.root.geometry(f"{Config.WINDOW_WIDTH}x{Config.WINDOW_HEIGHT}")
        
        # 初始化 Git 核心
        self.git = GitCore()
        
        # 状态标志
        self.pending_refresh = False
        
        # 设置主题
        self._setup_theme()
        
        # 构建 UI
        self._build_ui()
        
        # 启动结果处理
        self._start_result_processor()
        
        # 初始化显示
        self._initialize()
    
    def _setup_theme(self):
        """设置应用主题"""
        style = ttk.Style()
        try:
            style.theme_use(Config.get_theme())
        except tk.TclError:
            print("Info: Default Tk theme will be used.")
    
    def _build_ui(self):
        """构建用户界面"""
        # 仓库和分支控制框架 (顶部)
        self._build_repo_branch_frame()
        
        # 主框架 (包含状态和操作区域)
        self._build_main_frame()
        
        # 命令输出框架 (底部)
        self.output_panel = OutputPanel(self.root)
    
    def _build_repo_branch_frame(self):
        """构建仓库和分支控制区域"""
        frame = ttk.Frame(self.root, padding="5")
        frame.pack(fill=tk.X, padx=10, pady=(10, 0))
        frame.columnconfigure(1, weight=1)
        
        # 第 0 行: 选择仓库
        ttk.Button(frame, text="选择仓库目录", command=self.select_repository).grid(
            row=0, column=0, padx=(0, 5), pady=2
        )
        self.repo_path_var = tk.StringVar(value=f"当前仓库: {self.git.repo_path}")
        ttk.Label(frame, textvariable=self.repo_path_var, anchor=tk.W, 
                  relief=tk.SUNKEN, padding=(2, 2)).grid(
            row=0, column=1, columnspan=5, sticky="ew", padx=5, pady=2
        )
        
        # 第 1 行: 当前分支
        ttk.Label(frame, text="当前分支:").grid(row=1, column=0, sticky="e", padx=(0, 5), pady=2)
        self.current_branch_var = tk.StringVar(value="...")
        ttk.Label(frame, textvariable=self.current_branch_var, anchor=tk.W,
                  font=Config.BRANCH_FONT).grid(
            row=1, column=1, columnspan=5, sticky="w", padx=5, pady=2
        )
        
        # 第 2 行: 切换分支
        ttk.Label(frame, text="切换到分支:").grid(row=2, column=0, sticky="e", padx=(0, 5), pady=2)
        self.branch_combobox = ttk.Combobox(frame, state="readonly", width=45)
        self.branch_combobox.grid(row=2, column=1, sticky="ew", padx=5, pady=2)
        ttk.Button(frame, text="切换", command=self.switch_branch).grid(row=2, column=2, padx=5, pady=2)
        ttk.Button(frame, text="刷新列表", command=self.update_branch_info).grid(row=2, column=3, padx=5, pady=2)
        ttk.Button(frame, text="抓取更新(Fetch)", command=self.fetch_remote).grid(row=2, column=4, padx=5, pady=2)
        
        # 第 3 行: 创建分支
        ttk.Label(frame, text="新分支名称:").grid(row=3, column=0, sticky="e", padx=(0, 5), pady=5)
        self.new_branch_entry = ttk.Entry(frame, width=47)
        self.new_branch_entry.grid(row=3, column=1, sticky="ew", padx=5, pady=5)
        ttk.Button(frame, text="创建并切换", command=self.create_and_switch_branch).grid(
            row=3, column=2, columnspan=3, padx=5, pady=5, sticky="w"
        )
        
        # 第 4 行: 删除分支
        delete_frame = ttk.Frame(frame)
        delete_frame.grid(row=4, column=0, columnspan=5, pady=5, sticky="w")
        ttk.Label(delete_frame, text="删除选中分支:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(delete_frame, text="仅本地 (-d)", 
                   command=lambda: self.delete_local_branch(force=False)).pack(side=tk.LEFT, padx=5)
        ttk.Button(delete_frame, text="强制本地 (-D)", 
                   command=lambda: self.delete_local_branch(force=True)).pack(side=tk.LEFT, padx=5)
        ttk.Button(delete_frame, text="远程 (origin)", 
                   command=self.delete_remote_branch).pack(side=tk.LEFT, padx=5)
    
    def _build_main_frame(self):
        """构建主框架（状态和操作区域）"""
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10)
        main_frame.columnconfigure(0, weight=3)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(0, weight=1)
        
        # 状态区域
        self._build_status_frame(main_frame)
        
        # 操作区域
        self._build_operation_frame(main_frame)
    
    def _build_status_frame(self, parent):
        """构建状态区域"""
        status_frame = ttk.LabelFrame(parent, text="状态", padding="10")
        status_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 5))
        status_frame.rowconfigure(1, weight=1)
        status_frame.rowconfigure(4, weight=1)
        status_frame.rowconfigure(7, weight=1)
        status_frame.columnconfigure(0, weight=1)
        
        # 未暂存文件列表
        ttk.Label(status_frame, text="未暂存的更改 (Untracked / Modified):").grid(
            row=0, column=0, columnspan=2, sticky="w", pady=(0, 2)
        )
        
        unstaged_frame = ttk.Frame(status_frame)
        unstaged_frame.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=(0, 5))
        unstaged_frame.rowconfigure(0, weight=1)
        unstaged_frame.columnconfigure(0, weight=1)
        
        self.unstaged_list = tk.Listbox(unstaged_frame, selectmode=tk.EXTENDED, height=8)
        self.unstaged_list.grid(row=0, column=0, sticky="nsew")
        unstaged_scroll = ttk.Scrollbar(unstaged_frame, orient=tk.VERTICAL, command=self.unstaged_list.yview)
        unstaged_scroll.grid(row=0, column=1, sticky="ns")
        self.unstaged_list['yscrollcommand'] = unstaged_scroll.set
        
        # 未暂存操作按钮
        unstaged_buttons = ttk.Frame(status_frame)
        unstaged_buttons.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(0, 10))
        ttk.Button(unstaged_buttons, text="暂存选中项", command=self.stage_selected).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2
        )
        ttk.Button(unstaged_buttons, text="暂存所有更改", command=self.stage_all).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2
        )
        ttk.Button(unstaged_buttons, text="排除选中项", command=self.exclude_selected_from_unstaged).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2
        )
        
        # 已暂存文件列表
        ttk.Label(status_frame, text="已暂存的更改 (Staged):").grid(
            row=3, column=0, columnspan=2, sticky="w", pady=(5, 2)
        )
        
        staged_frame = ttk.Frame(status_frame)
        staged_frame.grid(row=4, column=0, columnspan=2, sticky="nsew", pady=(0, 5))
        staged_frame.rowconfigure(0, weight=1)
        staged_frame.columnconfigure(0, weight=1)
        
        self.staged_list = tk.Listbox(staged_frame, selectmode=tk.EXTENDED, height=8)
        self.staged_list.grid(row=0, column=0, sticky="nsew")
        staged_scroll = ttk.Scrollbar(staged_frame, orient=tk.VERTICAL, command=self.staged_list.yview)
        staged_scroll.grid(row=0, column=1, sticky="ns")
        self.staged_list['yscrollcommand'] = staged_scroll.set
        
        # 已暂存操作按钮
        staged_buttons = ttk.Frame(status_frame)
        staged_buttons.grid(row=5, column=0, columnspan=2, sticky="ew")
        ttk.Button(staged_buttons, text="取消暂存选中项", command=self.unstage_selected).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2
        )
        ttk.Button(staged_buttons, text="取消所有暂存", command=self.unstage_all).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2
        )
        
        # 刷新按钮
        ttk.Button(status_frame, text="刷新状态", command=self.refresh_status).grid(
            row=6, column=0, columnspan=2, sticky="ew", pady=(15, 0)
        )
        
        ttk.Label(status_frame, text="已排除的路径:").grid(
            row=7, column=0, columnspan=2, sticky="w", pady=(15, 2)
        )
        excluded_frame = ttk.Frame(status_frame)
        excluded_frame.grid(row=8, column=0, columnspan=2, sticky="nsew")
        excluded_frame.rowconfigure(0, weight=1)
        excluded_frame.columnconfigure(0, weight=1)
        self.excluded_list = tk.Listbox(excluded_frame, selectmode=tk.EXTENDED, height=6)
        self.excluded_list.grid(row=0, column=0, sticky="nsew")
        excluded_scroll = ttk.Scrollbar(excluded_frame, orient=tk.VERTICAL, command=self.excluded_list.yview)
        excluded_scroll.grid(row=0, column=1, sticky="ns")
        self.excluded_list['yscrollcommand'] = excluded_scroll.set
        excluded_buttons = ttk.Frame(status_frame)
        excluded_buttons.grid(row=9, column=0, columnspan=2, sticky="ew", pady=(5, 0))
        ttk.Button(excluded_buttons, text="移除选中排除", command=self.remove_selected_exclusions).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2
        )
    
    def _build_operation_frame(self, parent):
        """构建操作区域"""
        commit_frame = ttk.LabelFrame(parent, text="操作", padding="10")
        commit_frame.grid(row=0, column=1, sticky="nsew", padx=(5, 0))
        commit_frame.columnconfigure(0, weight=1)
        
        # 提交信息
        ttk.Label(commit_frame, text="提交信息:").pack(anchor=tk.W, pady=(0, 5))
        self.commit_message = scrolledtext.ScrolledText(commit_frame, height=6, wrap=tk.WORD)
        self.commit_message.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # 基本操作按钮
        ttk.Button(commit_frame, text="提交 (Commit)", command=self.commit).pack(fill=tk.X, pady=5)
        ttk.Button(commit_frame, text="拉取 (Pull)", command=self.pull).pack(fill=tk.X, pady=5)
        
        # 远程仓库管理
        remote_frame = ttk.LabelFrame(commit_frame, text="远程仓库管理")
        remote_frame.pack(fill=tk.X, pady=10, padx=0)
        
        remote_list_frame = ttk.Frame(remote_frame)
        remote_list_frame.pack(fill=tk.X, pady=5)
        ttk.Label(remote_list_frame, text="远程仓库:").pack(side=tk.LEFT, padx=(0, 5))
        self.remote_combobox = ttk.Combobox(remote_list_frame, state="readonly")
        self.remote_combobox.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(remote_list_frame, text="刷新", command=self.refresh_remotes).pack(side=tk.LEFT)
        
        remote_buttons = ttk.Frame(remote_frame)
        remote_buttons.pack(fill=tk.X, pady=5)
        ttk.Button(remote_buttons, text="添加远程仓库", command=self.show_add_remote_dialog).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=2
        )
        ttk.Button(remote_buttons, text="删除远程仓库", command=self.show_remove_remote_dialog).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=2
        )
        
        # 推送按钮
        push_buttons = ttk.Frame(commit_frame)
        push_buttons.pack(fill=tk.X, pady=5)
        ttk.Button(push_buttons, text="推送到默认", command=lambda: self.push()).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=2
        )
        ttk.Button(push_buttons, text="推送到选中", command=self.push_to_selected).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=2
        )
        ttk.Button(push_buttons, text="推送到所有", command=self.push_to_all).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=2
        )
    
    def _start_result_processor(self):
        """启动异步结果处理（仅使用定时器，避免线程竞态）"""
        self._check_results()
    
    def _check_results(self):
        """定期检查异步结果"""
        try:
            while not self.git.result_queue.empty():
                result = self.git.result_queue.get_nowait()
                if result is not None:
                    self._handle_result(result)
                else:
                    # 收到退出信号
                    return
        except Exception as e:
            # 避免队列处理崩溃导致程序卡死
            print(f"结果处理错误: {e}")
        
        # 继续定时检查
        self.root.after(100, self._check_results)
    
    def _handle_result(self, result):
        """处理命令执行结果"""
        command_type, success, stdout, stderr, callback = result
        
        if stdout or stderr:
            self.output_panel.display(f"命令完成: {command_type}")
            if stdout:
                self.output_panel.display(f"输出: {stdout}")
            if stderr and not success:
                self.output_panel.display(f"错误: {stderr}")
        
        if callback:
            try:
                callback(success, stdout, stderr)
            except Exception as e:
                self.output_panel.display(f"回调错误: {e}")
        
        if self.pending_refresh:
            self.pending_refresh = False
            self.root.after(Config.REFRESH_DELAY_MS, self.refresh_status)
    
    def _initialize(self):
        """初始化应用"""
        self.output_panel.display(Config.WELCOME_MESSAGE)
        
        if self.git.is_git_repo(self.git.repo_path):
            self.git.configure_quotepath()
        
        self.update_repository_display()
        self.refresh_remotes()

    def _should_hide_unstaged_file(self, filepath: str) -> bool:
        """判断路径是否需要在未暂存列表中隐藏"""
        patterns = getattr(Config, 'STATUS_EXCLUDE_PATTERNS', None)
        if not patterns or not filepath:
            return False
        normalized = filepath.replace('\\', '/').lstrip('./')
        for pattern in patterns:
            if not pattern:
                continue
            normalized_pattern = pattern.replace('\\', '/').lstrip('./')
            if not normalized_pattern:
                continue
            if normalized_pattern.endswith('/'):
                directory = normalized_pattern.rstrip('/')
                if normalized.startswith(directory):
                    return True
            if fnmatch.fnmatch(normalized, normalized_pattern):
                return True
        return False
    
    # ==================== 仓库操作 ====================
    
    def select_repository(self):
        """选择仓库目录"""
        new_path = filedialog.askdirectory(
            title="请选择 Git 仓库根目录",
            initialdir=self.git.repo_path
        )
        
        if new_path and os.path.normpath(new_path) != os.path.normpath(self.git.repo_path):
            if self.git.is_git_repo(new_path):
                self.git.repo_path = os.path.normpath(new_path)
                self.git.clear_cache()
                self.output_panel.display(f"仓库已切换到: {self.git.repo_path}", clear_previous=True)
                self.update_repository_display()
            else:
                messagebox.showerror("错误", f"所选目录 '{new_path}' 不是一个有效的 Git 仓库。")
    
    def update_repository_display(self):
        """更新仓库显示"""
        self.repo_path_var.set(f"当前仓库: {self.git.repo_path}")
        
        if self.git.is_git_repo(self.git.repo_path):
            self.update_branch_info()
            self.refresh_status()
        else:
            self.current_branch_var.set("N/A")
            self.branch_combobox['values'] = []
            self.branch_combobox.set('')
            self.unstaged_list.delete(0, tk.END)
            self.staged_list.delete(0, tk.END)
            self.output_panel.display(
                f"错误：目录 '{self.git.repo_path}' 不是有效的 Git 仓库。",
                clear_previous=True
            )
    
    # ==================== 状态操作 ====================
    
    def refresh_status(self):
        """刷新状态列表"""
        if not self.git.is_git_repo(self.git.repo_path):
            self.unstaged_list.delete(0, tk.END)
            self.staged_list.delete(0, tk.END)
            self._refresh_excluded_list()
            return
        
        self.unstaged_list.delete(0, tk.END)
        self.staged_list.delete(0, tk.END)
        
        unstaged, staged = self.git.get_status()
        
        displayed_unstaged = 0
        excluded_count = 0
        for status_code, filepath in unstaged:
            if self._should_hide_unstaged_file(filepath):
                excluded_count += 1
                continue
            self.unstaged_list.insert(tk.END, f"{status_code} {filepath}")
            displayed_unstaged += 1
        
        for status_code, filepath in staged:
            self.staged_list.insert(tk.END, f"{status_code} {filepath}")
        
        if displayed_unstaged == 0 and not staged:
            if excluded_count > 0:
                self.output_panel.display(
                    f"未暂存更改均已根据 STATUS_EXCLUDE_PATTERNS 隐藏（共 {excluded_count} 项）。",
                    clear_previous=True
                )
            else:
                self.output_panel.display("工作区干净，没有变更。", clear_previous=True)
            return

        message = "状态已刷新。"
        if excluded_count > 0:
            message += f"（已隐藏 {excluded_count} 项未暂存更改）"
        self.output_panel.display(message, clear_previous=True)
        self._refresh_excluded_list()
    
    def _get_selected_files(self, listbox) -> list:
        """获取选中的文件"""
        selected = []
        for i in listbox.curselection():
            line = listbox.get(i)
            filepath = self.git.parse_git_path(line[3:].strip())
            selected.append(filepath)
        return selected
    
    def stage_selected(self):
        """暂存选中文件"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        files = self._get_selected_files(self.unstaged_list)
        if not files:
            messagebox.showinfo("提示", "请先在\"未暂存的更改\"列表中选择文件。")
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.pending_refresh = True
        
        self.git.run_command_async(
            ['git', 'add', '--'] + files,
            callback,
            f"暂存 {len(files)} 个文件"
        )
    
    def stage_all(self):
        """暂存所有更改"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        unstaged, _ = self.git.get_status()
        files = []
        skipped = 0
        seen = set()
        for _, filepath in unstaged:
            if self._should_hide_unstaged_file(filepath):
                skipped += 1
                continue
            if filepath in seen:
                continue
            seen.add(filepath)
            files.append(filepath)
        
        if not files:
            message = "没有可暂存的更改。"
            if skipped:
                message += f"（已跳过 {skipped} 个排除项）"
            self.output_panel.display(message, clear_previous=False)
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.pending_refresh = True
        
        command = ['git', 'add', '--'] + files
        description = "暂存所有可见更改"
        if skipped:
            description += f"（已跳过 {skipped} 个排除项）"
        self.git.run_command_async(command, callback, description)
    
    def exclude_selected_from_unstaged(self):
        """将选中项加入排除列表"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        files = self._get_selected_files(self.unstaged_list)
        if not files:
            messagebox.showinfo("提示", "请先选择需要排除的文件或文件夹。")
            return
        
        apply_folder = messagebox.askyesno(
            "排除选中项",
            "是否按所在文件夹进行排除？\n选择“是”会排除整个文件夹，选择“否”仅排除这些文件。",
            icon=messagebox.QUESTION
        )
        added_patterns = []
        skipped = 0
        for path in files:
            normalized = path.replace('\\', '/').lstrip('./')
            if not normalized:
                continue
            pattern = normalized
            if apply_folder:
                folder = os.path.dirname(normalized)
                if folder and folder not in ('.', ''):
                    pattern = folder.rstrip('/') + '/'
            if pattern in Config.STATUS_EXCLUDE_PATTERNS:
                skipped += 1
                continue
            Config.STATUS_EXCLUDE_PATTERNS.append(pattern)
            added_patterns.append(pattern)
        
        if not added_patterns:
            message = "未添加新的排除规则。"
            if skipped:
                message += f"（其中 {skipped} 条已存在）"
            self.output_panel.display(message)
            return
        
        summary = "\n".join(f"- {pattern}" for pattern in added_patterns)
        self.output_panel.display(
            "已将以下模式加入 STATUS_EXCLUDE_PATTERNS：\n" + summary,
            clear_previous=False
        )
        self.refresh_status()

    def _refresh_excluded_list(self):
        """刷新已排除列表显示"""
        if not hasattr(self, 'excluded_list'):
            return
        self.excluded_list.delete(0, tk.END)
        if not Config.STATUS_EXCLUDE_PATTERNS:
            return
        for pattern in Config.STATUS_EXCLUDE_PATTERNS:
            self.excluded_list.insert(tk.END, pattern)
    
    def remove_selected_exclusions(self):
        """从排除列表中移除选中项"""
        if not hasattr(self, 'excluded_list'):
            return
        selections = self.excluded_list.curselection()
        if not selections:
            messagebox.showinfo("提示", "请选择需要移除的排除规则。")
            return
        removed = 0
        values = [self.excluded_list.get(i) for i in selections]
        for value in values:
            if value in Config.STATUS_EXCLUDE_PATTERNS:
                Config.STATUS_EXCLUDE_PATTERNS.remove(value)
                removed += 1
        if removed:
            self.output_panel.display(f"已移除 {removed} 条排除规则。", clear_previous=False)
        else:
            self.output_panel.display("未能移除选中的排除规则。", clear_previous=False)
        self._refresh_excluded_list()
        self.refresh_status()

    def unstage_selected(self):
        """取消暂存选中文件"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        files = self._get_selected_files(self.staged_list)
        if not files:
            messagebox.showinfo("提示", "请先在\"已暂存的更改\"列表中选择文件。")
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.pending_refresh = True
        
        self.git.run_command_async(
            ['git', 'reset', 'HEAD', '--'] + files,
            callback,
            f"取消暂存 {len(files)} 个文件"
        )
    
    def unstage_all(self):
        """取消所有已暂存的更改"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.pending_refresh = True
        
        description = "取消所有暂存的更改"
        self.git.run_command_async(['git', 'reset', 'HEAD', '--', '.'], callback, description)
    
    # ==================== 提交和推送 ====================
    
    def commit(self):
        """提交更改"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        message = self.commit_message.get("1.0", tk.END).strip()
        if not message:
            messagebox.showwarning("警告", "提交信息不能为空！")
            return
        
        if not self.git.has_staged_changes():
            messagebox.showinfo("提示", "没有已暂存的更改可供提交。")
            self.refresh_status()
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.root.after(0, lambda: self.commit_message.delete("1.0", tk.END))
                self.pending_refresh = True
        
        self.git.run_command_async(['git', 'commit', '-m', message], callback, "提交更改")
    
    def push(self, remote: str = None):
        """推送到远程仓库"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        if remote:
            command = ['git', 'push', remote]
            desc = f"推送到 {remote}"
        else:
            command = ['git', 'push']
            desc = "推送到默认远程仓库"
        
        self.git.run_command_async(command, None, desc)
    
    def push_to_selected(self):
        """推送到选中的远程仓库"""
        selected = self.remote_combobox.get()
        if not selected:
            messagebox.showwarning("警告", "请先选择一个远程仓库。")
            return
        self.push(selected)
    
    def push_to_all(self):
        """推送到所有远程仓库"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        remotes = self.git.get_remotes()
        if not remotes:
            messagebox.showinfo("提示", "没有找到远程仓库。")
            return
        
        for remote in remotes:
            self.output_panel.display(f"推送到 {remote}...")
            stdout, stderr, returncode = self.git.run_command_sync(['git', 'push', remote])
            if stdout:
                self.output_panel.display(stdout)
            if stderr:
                self.output_panel.display(stderr)
    
    def pull(self):
        """拉取更改"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.pending_refresh = True
                self.root.after(Config.BRANCH_UPDATE_DELAY_MS, self.update_branch_info)
        
        self.git.run_command_async(['git', 'pull'], callback, "拉取更改")
    
    # ==================== 分支操作 ====================
    
    def update_branch_info(self):
        """更新分支信息"""
        if not self.git.is_git_repo(self.git.repo_path):
            self.current_branch_var.set("N/A")
            self.branch_combobox['values'] = []
            self.branch_combobox.set('')
            return
        
        current, local_branches, remote_branches = self.git.get_all_branches()
        self.current_branch_var.set(current)
        
        # 合并并排序分支列表
        all_branches = sorted(
            set(local_branches + remote_branches),
            key=lambda x: (x not in local_branches, x)
        )
        
        self.branch_combobox['values'] = all_branches
        if current in all_branches:
            self.branch_combobox.set(current)
        elif all_branches:
            self.branch_combobox.set(all_branches[0])
    
    def fetch_remote(self):
        """抓取远程更新"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.root.after(0, self.update_branch_info)
        
        self.git.run_command_async(
            ['git', 'fetch', 'origin', '--prune'],
            callback,
            "抓取远程更新"
        )
    
    def switch_branch(self):
        """切换分支"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        target = self.branch_combobox.get()
        if not target:
            messagebox.showwarning("警告", "请先选择一个目标分支。")
            return
        
        current = self.current_branch_var.get()
        if target == current:
            messagebox.showinfo("提示", f"你当前已经在 '{current}' 分支了。")
            return
        
        # 检查未提交更改
        if self.git.has_uncommitted_changes():
            if not messagebox.askyesno("警告", "检测到未提交的更改。\n是否仍然切换？"):
                return
        
        # 提取实际分支名
        actual_name = target.split('/')[-1] if '/' in target else target
        
        def callback(success, stdout, stderr):
            self.update_branch_info()
            self.refresh_status()
        
        self.git.run_command_async(['git', 'checkout', actual_name], callback, f"切换到 {actual_name}")
    
    def create_and_switch_branch(self):
        """创建并切换到新分支"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        name = self.new_branch_entry.get().strip()
        if not name:
            messagebox.showwarning("警告", "新分支名称不能为空！")
            return
        
        # 验证分支名
        if re.search(Config.INVALID_BRANCH_CHARS, name) or name.startswith('/') or name.endswith('/'):
            messagebox.showwarning("警告", "分支名称包含无效字符。")
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.new_branch_entry.delete(0, tk.END)
                self.update_branch_info()
                self.refresh_status()
        
        self.git.run_command_async(['git', 'checkout', '-b', name], callback, f"创建分支 {name}")
    
    def delete_local_branch(self, force: bool = False):
        """删除本地分支"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        branch = self.branch_combobox.get()
        if not branch or '/' in branch:
            messagebox.showerror("错误", "请选择一个本地分支。")
            return
        
        if branch == self.current_branch_var.get():
            messagebox.showerror("错误", "不能删除当前分支！")
            return
        
        flag = "-D" if force else "-d"
        action = "强制删除" if force else "删除"
        
        if messagebox.askyesno("确认", f"确定要{action}分支 '{branch}' 吗？"):
            def callback(success, stdout, stderr):
                self.update_branch_info()
            
            self.git.run_command_async(['git', 'branch', flag, branch], callback, f"{action}分支 {branch}")
    
    def delete_remote_branch(self):
        """删除远程分支"""
        if not self.git.is_git_repo(self.git.repo_path):
            return
        
        branch = self.branch_combobox.get()
        if not branch:
            messagebox.showwarning("警告", "请先选择一个分支。")
            return
        
        # 解析远程名和分支名
        if '/' in branch:
            parts = branch.split('/', 1)
            remote_name, branch_name = parts[0], parts[1]
        else:
            remote_name, branch_name = 'origin', branch
        
        # 保护重要分支
        if branch_name in Config.PROTECTED_BRANCHES:
            if not messagebox.askyesno("高风险警告", f"'{branch_name}' 是受保护的分支！\n确定要删除吗？"):
                return
        elif not messagebox.askyesno("确认", f"确定要删除远程分支 '{remote_name}/{branch_name}' 吗？"):
            return
        
        def callback(success, stdout, stderr):
            if success:
                self.fetch_remote()
        
        self.git.run_command_async(
            ['git', 'push', remote_name, '--delete', branch_name],
            callback,
            f"删除远程分支 {branch_name}"
        )
    
    # ==================== 远程仓库管理 ====================
    
    def refresh_remotes(self):
        """刷新远程仓库列表"""
        remotes = self.git.get_remotes()
        self.remote_combobox['values'] = remotes
        if remotes:
            self.remote_combobox.set(remotes[0])
        else:
            self.remote_combobox.set('')
    
    def show_add_remote_dialog(self):
        """显示添加远程仓库对话框"""
        if not self.git.is_git_repo(self.git.repo_path):
            messagebox.showerror("错误", "不是有效的 Git 仓库。")
            return
        
        def on_confirm(name, url):
            stdout, stderr, returncode = self.git.run_command_sync(['git', 'remote', 'add', name, url])
            if returncode == 0:
                self.output_panel.display(f"成功添加远程仓库 '{name}': {url}")
                self.refresh_remotes()
                return True
            else:
                messagebox.showerror("错误", f"添加失败: {stderr}")
                return False
        
        DialogHelper.show_add_remote_dialog(self.root, on_confirm)
    
    def show_remove_remote_dialog(self):
        """删除远程仓库"""
        selected = self.remote_combobox.get()
        if not selected:
            messagebox.showwarning("警告", "请先选择一个远程仓库。")
            return
        
        if selected == 'origin':
            if not messagebox.askyesno("警告", "确定要删除默认的 'origin' 吗？"):
                return
        elif not messagebox.askyesno("确认", f"确定要删除远程仓库 '{selected}' 吗？"):
            return
        
        stdout, stderr, returncode = self.git.run_command_sync(['git', 'remote', 'remove', selected])
        if returncode == 0:
            self.output_panel.display(f"成功删除远程仓库 '{selected}'")
            self.refresh_remotes()
        else:
            messagebox.showerror("错误", f"删除失败: {stderr}")
    
    def cleanup(self):
        """清理资源"""
        try:
            self.git.result_queue.put(None)
            self.git.clear_cache()
        except Exception as e:
            print(f"清理时出错: {e}")


def main():
    """程序入口"""
    # Windows DPI 感知
    try:
        if platform.system() == "Windows":
            from ctypes import windll
            try:
                windll.shcore.SetProcessDpiAwareness(2)
            except Exception:
                try:
                    windll.user32.SetProcessDPIAware()
                except Exception:
                    pass
    except Exception:
        pass
    
    root = tk.Tk()
    app = SimpleGitApp(root)
    
    def on_closing():
        app.cleanup()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        on_closing()


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
UI 组件模块
封装可复用的 UI 组件
"""

import tkinter as tk
import tkinter.ttk as ttk
import tkinter.scrolledtext as scrolledtext
import tkinter.messagebox as messagebox

from .config import Config


class OutputPanel:
    """输出面板组件"""
    
    def __init__(self, parent: ttk.Frame):
        self.frame = ttk.LabelFrame(parent, text="命令输出 / 消息", padding="10")
        self.frame.pack(fill=tk.BOTH, expand=False, padx=10, pady=(5, 10))
        self.frame.rowconfigure(0, weight=1)
        self.frame.columnconfigure(0, weight=1)
        
        self.text = scrolledtext.ScrolledText(
            self.frame,
            height=8,
            wrap=tk.WORD,
            state=tk.DISABLED,
            font=Config.OUTPUT_FONT
        )
        self.text.grid(row=0, column=0, sticky="nsew")
        
        scrollbar = ttk.Scrollbar(self.frame, orient=tk.VERTICAL, command=self.text.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.text['yscrollcommand'] = scrollbar.set
    
    def display(self, text: str, clear_previous: bool = False):
        """显示文本到输出面板"""
        try:
            self.text.config(state=tk.NORMAL)
            
            if clear_previous:
                self.text.delete("1.0", tk.END)
            
            self.text.insert(tk.END, text + "---\n")
            
            # 限制输出行数
            content = self.text.get("1.0", tk.END)
            lines = content.split('\n')
            if len(lines) > Config.MAX_OUTPUT_LINES:
                self.text.delete("1.0", tk.END)
                self.text.insert("1.0", '\n'.join(lines[-Config.MAX_OUTPUT_LINES:]))
            
            self.text.see(tk.END)
            self.text.config(state=tk.DISABLED)
        except Exception as e:
            print(f"显示输出时出错: {e}")
    
    def clear(self):
        """清空输出"""
        self.text.config(state=tk.NORMAL)
        self.text.delete("1.0", tk.END)
        self.text.config(state=tk.DISABLED)


class FileListPanel:
    """文件列表面板组件"""
    
    def __init__(
        self,
        parent: ttk.Frame,
        title: str,
        height: int = 8,
        buttons: list = None
    ):
        self.frame = parent
        
        # 标题
        ttk.Label(parent, text=title).pack(anchor=tk.W, pady=(0, 2))
        
        # 列表框架
        list_frame = ttk.Frame(parent)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 5))
        list_frame.rowconfigure(0, weight=1)
        list_frame.columnconfigure(0, weight=1)
        
        # 列表框
        self.listbox = tk.Listbox(list_frame, selectmode=tk.EXTENDED, height=height)
        self.listbox.grid(row=0, column=0, sticky="nsew")
        
        # 滚动条
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.listbox.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.listbox['yscrollcommand'] = scrollbar.set
        
        # 按钮框架
        if buttons:
            button_frame = ttk.Frame(parent)
            button_frame.pack(fill=tk.X, pady=(0, 5))
            for btn_text, btn_command in buttons:
                ttk.Button(
                    button_frame,
                    text=btn_text,
                    command=btn_command
                ).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
    
    def clear(self):
        """清空列表"""
        self.listbox.delete(0, tk.END)
    
    def add_item(self, item: str):
        """添加项目"""
        self.listbox.insert(tk.END, item)
    
    def get_selected_items(self) -> list:
        """获取选中的项目"""
        selections = self.listbox.curselection()
        return [self.listbox.get(i) for i in selections]


class BranchCombobox:
    """分支选择下拉框组件"""
    
    def __init__(self, parent: ttk.Frame, row: int, label_text: str):
        ttk.Label(parent, text=label_text).grid(row=row, column=0, sticky="e", padx=(0, 5), pady=2)
        
        self.combobox = ttk.Combobox(parent, state="readonly", width=45)
        self.combobox.grid(row=row, column=1, sticky="ew", padx=5, pady=2)
    
    def get(self) -> str:
        """获取当前选中值"""
        return self.combobox.get()
    
    def set(self, value: str):
        """设置当前值"""
        self.combobox.set(value)
    
    def set_values(self, values: list):
        """设置可选值列表"""
        self.combobox['values'] = values
    
    def clear(self):
        """清空"""
        self.combobox['values'] = []
        self.combobox.set('')


class DialogHelper:
    """对话框辅助类"""
    
    @staticmethod
    def show_add_remote_dialog(
        parent: tk.Tk,
        on_confirm: callable
    ) -> tk.Toplevel:
        """显示添加远程仓库对话框"""
        dialog = tk.Toplevel(parent)
        dialog.title("添加远程仓库")
        dialog.geometry("500x200")
        dialog.transient(parent)
        dialog.grab_set()
        
        # 名称输入
        ttk.Label(dialog, text="远程仓库名称:").grid(row=0, column=0, padx=10, pady=10, sticky="e")
        name_entry = ttk.Entry(dialog, width=30)
        name_entry.grid(row=0, column=1, padx=10, pady=10, sticky="ew")
        name_entry.insert(0, "gitcode")
        
        # URL 输入
        ttk.Label(dialog, text="远程仓库URL:").grid(row=1, column=0, padx=10, pady=10, sticky="e")
        url_entry = ttk.Entry(dialog, width=50)
        url_entry.grid(row=1, column=1, padx=10, pady=10, sticky="ew")
        
        # 提示
        ttk.Label(
            dialog,
            text="例如: https://gitcode.com/username/repo.git",
            font=("TkDefaultFont", 8)
        ).grid(row=2, column=1, padx=10, sticky="w")
        
        # 按钮
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=3, column=0, columnspan=2, pady=20)
        
        def confirm():
            name = name_entry.get().strip()
            url = url_entry.get().strip()
            
            if not name:
                messagebox.showwarning("警告", "远程仓库名称不能为空！", parent=dialog)
                return
            if not url:
                messagebox.showwarning("警告", "远程仓库URL不能为空！", parent=dialog)
                return
            
            if on_confirm(name, url):
                dialog.destroy()
        
        ttk.Button(button_frame, text="确定", command=confirm).pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="取消", command=dialog.destroy).pack(side=tk.LEFT, padx=10)
        
        dialog.columnconfigure(1, weight=1)
        name_entry.focus_set()
        
        return dialog


class StatusBar:
    """状态栏组件"""
    
    def __init__(self, parent: tk.Tk):
        self.frame = ttk.Frame(parent)
        self.frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.label_var = tk.StringVar(value="就绪")
        self.label = ttk.Label(
            self.frame,
            textvariable=self.label_var,
            relief=tk.SUNKEN,
            padding=(5, 2)
        )
        self.label.pack(fill=tk.X)
    
    def set_text(self, text: str):
        """设置状态文本"""
        self.label_var.set(text)
    
    def set_busy(self, busy: bool = True):
        """设置忙碌状态"""
        if busy:
            self.label_var.set("正在处理...")
        else:
            self.label_var.set("就绪")

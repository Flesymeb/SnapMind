#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @FileName  : copy.py
# @Description:
# @Time      : 2025/5/30 18:25
# @Author    : Hyoung Yan


import pyperclip
import re

def copy_code_block(markdown_text: str):
    """
    提取所有 ``` 代码块并复制到剪贴板。
    """
    pattern = r"```(?:[\w+\s]*)?\n([\s\S]*?)```"
    matches = re.findall(pattern, markdown_text)
    if matches:
        all_code = "\n\n".join(code.strip() for code in matches)
        pyperclip.copy(all_code)
        print("✅ 已复制所有代码块到剪贴板")
    else:
        print("❌ 未找到任何代码块")


# def copy_code_block(markdown_text: str):
#     """
#     从 Markdown 文本中提取第一个 ``` 代码块，并复制到剪贴板。
#     """
#     pattern = r"```(?:[\w+\s]*)?\n([\s\S]*?)```"
#     match = re.search(pattern, markdown_text)
#     if match:
#         code = match.group(1).strip()
#         pyperclip.copy(code)
#         print("✅ 已复制代码到剪贴板")
#     else:
#         print("❌ 未找到代码块")




from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from utils.convert import convert_image_to_webp_base64
from utils.copy import copy_code_block
import os
from openai import OpenAI
import requests

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)


# 读取环境变量中的 API 密钥
API_KEY = os.getenv("SILICONFLOW_API_KEY")
if not API_KEY:
    raise ValueError("SILICONFLOW_API_KEY 环境变量未设置")
API_URL = "https://api.siliconflow.cn/v1"
# 初始化 OpenAI 客户端
client = OpenAI(api_key=API_KEY, base_url=API_URL)


# 全局变量：保存最近一条回答\记录截图次数
latest_answer = ""
upload_count = 0
has_uploaded = False
history_answers = []  # 用于存储历史记录

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    global latest_answer, upload_count, has_uploaded, history_answers

    try:
        image_bytes = await file.read()

        # 图像转 base64
        base64_image = convert_image_to_webp_base64(image_bytes)

        # 构造多模态内容结构
        prompt = r"""
            你是一个专业的编程与解题 AI 助手。请阅读截图内容，判断其是否为一道题目，并严格根据下列规则进行回应：

            ---

            ## 🔎 判断内容类型
            请首先判断截图是否为题目（尤其是编程题）：
            - 须包含：题干描述 + 输入格式 + 输出格式 + 样例输入输出，才属于“算法题”（某些情况下可能截图不全）；
            - 若是选择题或填空题，则题干后紧跟选项或空格；
            - 若为非题目类（如工具界面、命令说明、公式、图像），请总结核心内容；

            ---

            ## 🧠 回答方式（分类说明）：

            1. ### **算法题**（如背包、排序、图论等）：
            - 识别关键点：输入输出格式、约束条件、是否要求输出方案；
            - 简要分析题意与考察知识点；
            - 严格依据样例，给出 **完整、可运行的 C++ 代码**，包含 `main()`，并包裹在 ```cpp``` 中；
            - 必须满足题设要求，例如：“输出路径”、“字典序最小”、“可重不可重”等；
            - 补充时间复杂度与边界说明。

            2. ### **选择题 / 填空题**：
            - 直接输出答案选项（如 `B` 或 `12.5`），用粗体标明；
            - 在下方用 2~3 句话简要解释。

            3. ### **非题目内容**：
            - 按照要求理解，并给出解答步骤和答案；
            - 禁止生成伪问题、伪解法。

            ---

            ## ⚙️ 格式规范（严格要求）：

            - 输出为纯 **Markdown 格式**，不需要包裹```markdown```；
            - 代码仅用 ```cpp``` 包裹；
            - 公式使用KaTeX语法，确保Markdown中的数学公式正确渲染；
            - 注意 Markdown 渲染兼容性，所有数学内容都要确保用 `$` 和 `$$` 包围；
            - 所有 **块级公式** 请使用 `$$...$$` 包裹，**并在前后保留空行**
            - 所有 **行内公式** 使用 `$...$` 包裹，不允许 `\(...\)` 或 `\[...\]`
            - 禁止使用 `[ \int ... ]`、`\(...\)`、`\[...\]` 等非标准 Markdown 表达；
            - **禁止使用 markdown、html、LaTeX 交叉嵌套**（如不要在代码中嵌入 `$$...$$`）


            ---
            你将被用于截图 OCR 后的自动解题系统，请输出结构清晰、格式稳定、便于前端渲染的内容。
            """


        content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}",
                    "detail": "low"
                }
            },
            {
                "type": "text",
                "text": prompt
            }
        ]

        # 发起请求（流式处理）
        stream = client.chat.completions.create(
            model="Qwen/Qwen2.5-VL-72B-Instruct",
            messages=[
                {"role": "system", "content": "你是一个擅长分析题目的 AI 助手，能准确识别截图内容并做出专业解答。"},
                {"role": "user", "content": content}],
            stream=True
        )

        # 聚合流式响应
        full_reply = ""
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                full_reply += delta.content

        # 更新状态
        latest_answer = full_reply
        upload_count += 1
        has_uploaded = True
        # 收到回答后，追加进列表
        history_answers.append(full_reply)
        # 复制到剪切板
        copy_code_block(latest_answer)
        return JSONResponse(content={"answer": full_reply})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# 添加get结构，使前端可以轮询
@app.get("/latest_answer")
async def get_latest_answer():
    global latest_answer, upload_count, has_uploaded
    if upload_count == 0:
        return JSONResponse(content={
            "status": "init",
            "message": "🕐 暂无截图记录，请按快捷键(Shift+Ctrl+S)截图后再试。"
        })
    else:
        return JSONResponse(content={
            "status": "ok",
            "latest_answer": latest_answer,
            "upload_count": upload_count
        })
    # if latest_answer:
    #     return JSONResponse(content={"latest_answer": latest_answer})
    # else:
    #     return JSONResponse(status_code=404, content={"error": "No answer available"})
    
# 添加状态检查接口
@app.get("/status")
async def get_status():
    return {
        "has_uploaded": has_uploaded,
        "upload_count": upload_count,
        "latest_available": bool(latest_answer),
    }


# 添加历史记录接口
@app.get("/history")
async def get_history(index: int = -1):
    if not history_answers:
        return JSONResponse(content={
            "status": "init",
            "message": "暂无任何历史记录，请先截图后再查看。",
            "index": -1,
            "total": 0,
            "answer": ""
        })

    if index < 0 or index >= len(history_answers):
        index = len(history_answers) - 1

    return JSONResponse(content={
        "status": "ok",
        "index": index,
        "total": len(history_answers),
        "answer": history_answers[index],
        "upload_count": len(history_answers) if history_answers else 0
    })


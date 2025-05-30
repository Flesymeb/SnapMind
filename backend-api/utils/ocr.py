# ocr.py
from PIL import Image
import pytesseract
import io

def run_ocr(image_bytes: bytes) -> str:
    """
    使用 Tesseract OCR 识别图像中的文本。
    :param image_bytes: 图像的字节数据
    :return: 识别出的文本
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image, lang="eng")  # 可改为 'chi_sim' 中文
        print("OCR Result:", text)  # 调试输出
        if not text.strip():
            print("OCR did not detect any text.")
            return "未检测到文本"
        return text
    except Exception as e:
        print("OCR Error:", e)
        return ""

# convert.py

from PIL import Image
import io
import base64

def convert_image_to_webp_base64(image_bytes: bytes) -> str:
    """
    将图片字节流转换为 WebP 格式的 Base64 编码字符串。
    :param image_bytes: 图片的字节流
    :return: WebP 格式的 Base64 编码字符串
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        byte_arr = io.BytesIO()
        image.save(byte_arr, format='WEBP')
        return base64.b64encode(byte_arr.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"❌ 图片转换失败: {e}")
        raise e


# def convert_image_to_webp_base64(input_image_path):
#     """
#     将图片转换为 WebP 格式的 Base64 编码字符串。
#     """
#     try:
#         with Image.open(input_image_path) as img:
#             byte_arr = io.BytesIO()
#             img.save(byte_arr, format='JPEG', quality=80)  # 可选 WebP 也行
#             byte_arr = byte_arr.getvalue()
#             base64_str = base64.b64encode(byte_arr).decode('utf-8')
#             return base64_str
#     except IOError:
#         print(f"Error: Unable to open or convert the image {input_image_path}")
#         return None

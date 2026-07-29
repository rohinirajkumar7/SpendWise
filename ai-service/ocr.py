from io import BytesIO
from PIL import Image, ImageOps, ImageFilter
import easyocr
import numpy as np

reader = easyocr.Reader(['en'], gpu=False)

MIN_DIMENSION = 1000
# EasyOCR's runtime on CPU scales with pixel count. Phone camera photos are
# frequently 3000-4000px on the long side, which is far more resolution than
# a receipt needs and is a major contributor to requests blowing past the
# backend's timeout. Capping the long side keeps worst-case OCR time bounded
# without affecting quality - MIN_DIMENSION already guarantees small images
# get upscaled to a legible size, this just stops the other extreme.
MAX_DIMENSION = 2200

def image_from_bytes(b: bytes):
    try:
        img = Image.open(BytesIO(b))
        # Verify the image is valid
        img.verify()
        # Reopen after verify (verify closes the file)
        img = Image.open(BytesIO(b)).convert('RGB')
        return img
    except (IOError, SyntaxError, OSError) as e:
        raise ValueError(f"Invalid or corrupted image file: {str(e)}")

def preprocess_for_ocr(img: Image.Image) -> Image.Image:
    """Upscale + sharpen + boost contrast so small/low-res receipt photos
    become legible to OCR. This directly targets character-level misreads
    (a blurry '$' collapsing into something that looks like '5', etc)."""
    # Upscale small images. Receipt photos/screenshots are frequently much
    # smaller than a camera photo (e.g. 217x365), which is far below what
    # EasyOCR needs for reliable digit/symbol recognition.
    shortest_side = min(img.width, img.height)
    longest_side = max(img.width, img.height)
    if shortest_side < MIN_DIMENSION:
        scale = MIN_DIMENSION / shortest_side
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.LANCZOS)
    elif longest_side > MAX_DIMENSION:
        scale = MAX_DIMENSION / longest_side
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.LANCZOS)

    # Grayscale + autocontrast makes faint thermal-printer text stand out
    # from the background before OCR ever binarizes/detects it.
    gray = ImageOps.grayscale(img)
    gray = ImageOps.autocontrast(gray, cutoff=1)

    # A light unsharp mask helps re-crisp edges that got softened by the
    # upscaling step, without introducing the noise a stronger sharpen would.
    gray = gray.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=2))

    return gray.convert('RGB')

def ocr_image_bytes(image_bytes: bytes) -> str:
    try:
        img = image_from_bytes(image_bytes)
        img = preprocess_for_ocr(img)
        arr = np.array(img)

        # Check if image array is valid
        if arr.size == 0:
            return ""

        
        results = reader.readtext(arr, detail=1)  # [(bbox, text, conf), ...]
        if not results:
            return ""

        # bbox is 4 points (x,y). Use the top-left y as the row anchor.
        def top_y(item):
            bbox = item[0]
            return min(p[1] for p in bbox)

        def left_x(item):
            bbox = item[0]
            return min(p[0] for p in bbox)

        results.sort(key=top_y)

        # Estimate a "same line" threshold from typical box height.
        heights = [max(p[1] for p in b) - min(p[1] for p in b) for (b, _, _) in results]
        avg_height = sum(heights) / len(heights) if heights else 20
        line_threshold = max(avg_height * 0.6, 8)

        lines = []
        current_line = [results[0]]
        current_y = top_y(results[0])

        for item in results[1:]:
            y = top_y(item)
            if abs(y - current_y) <= line_threshold:
                current_line.append(item)
            else:
                lines.append(current_line)
                current_line = [item]
                current_y = y
        lines.append(current_line)

        # Within each line, order left-to-right.
        line_strings = []
        for line in lines:
            line.sort(key=left_x)
            line_strings.append(' '.join(text for (_bbox, text, _conf) in line))

        full_text = '\n'.join(line_strings)
        return full_text
    except ValueError as e:
        print(f"Image validation error: {e}")
        return ""
    except Exception as e:
        print(f"OCR processing error: {e}")
        return ""

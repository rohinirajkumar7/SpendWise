import easyocr

print("Downloading EasyOCR models...")
reader = easyocr.Reader(['en'], gpu=False, download_enabled=True)
print("Models downloaded successfully!")

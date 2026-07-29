from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ocr import ocr_image_bytes
from nlp import extract_entities
from categorize import predict_category
import traceback

app = FastAPI(title="AI Service for Expense Tracker")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/parse_receipt")
async def parse_receipt(file: UploadFile = File(...)):
    text = ""
    parsed = {}
    
    try:
        # Read file contents
        contents = await file.read()
        
        # Validate file size (max 10MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB"
            )
        
        # Validate file type
        if file.content_type and not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image"
            )
        
        # Check if file is empty
        if len(contents) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        
        # 1. OCR Text Extraction
        try:
            text = ocr_image_bytes(contents)
            if not text or len(text.strip()) == 0:
                return JSONResponse(
                    status_code=200,
                    content={
                        "amount": 0.0,
                        "suggested_category": "Uncategorized",
                        "merchant": "",
                        "currency": "INR",
                        "date": None,
                        "raw_text": "",
                        "raw_entities": {},
                        "warning": "No text detected in image. Image quality may be poor."
                    }
                )
        except ValueError as ve:
            # Image validation error
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as ocr_error:
            print(f"OCR Error: {ocr_error}")
            raise HTTPException(
                status_code=500,
                detail="OCR processing failed. Please ensure image is clear and readable."
            )
        
        # 2. NLP Entity Extraction
        try:
            parsed = extract_entities(text)
        except Exception as nlp_error:
            print(f"NLP Error: {nlp_error}")
            parsed = {"merchant": None, "amount": None, "currency": "INR", "date": None}
        
        # 3. ML Categorization
        description_for_ml = text[:300].strip() if text else ""
        amount_for_ml = parsed.get("amount") or 0.0
        
        try:
            suggested = predict_category(description_for_ml, amount_for_ml)
        except Exception as cat_error:
            print(f"Categorization Error: {cat_error}")
            suggested = "Uncategorized"
        
        # 4. Final Data Compilation
        parsed["suggested_category"] = suggested
        parsed["raw_text"] = text
        
        return JSONResponse(status_code=200, content=parsed)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"AI Processing Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="AI processing failed. Please try again with a clearer image."
        )
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Expense Parser",
        "ocr_ready": True
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting AI Service on http://0.0.0.0:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")


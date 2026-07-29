import os
import joblib
import pandas as pd 
from io import BytesIO

# Define the path to the trained model file
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'expense_model.joblib')

_model_bundle = None

def load_model():
    """Loads the trained Scikit-learn Pipeline (preprocessor + model)."""
    global _model_bundle
    if _model_bundle is None:
        # Load the saved pipeline object from the ML file
        # It contains the preprocessor (TFIDF + Scaler) and the classifier
        _model_bundle = joblib.load(MODEL_PATH)
    
    # We return the pipeline object itself, which is stored under the 'pipeline' key.
    return _model_bundle['pipeline'] 

def predict_category(description: str, amount: float):
    """
    Predicts the expense category using both the text description and the amount.
    
    The ML pipeline requires both pieces of information to be passed in a DataFrame.
    """
    try:
        pipeline = load_model()
        
        # The pipeline expects a DataFrame containing all features 
        # ('description' and 'amount') used during training.
        X_predict = pd.DataFrame({
            'description': [description],
            'amount': [amount]
        })
        
        # The pipeline handles the preprocessing (TF-IDF, Scaling) and prediction in one step.
        cat = pipeline.predict(X_predict)[0]
        return cat
        
    except Exception as e:
        # Log the error for debugging, but return a safe default value.
        print(f"Categorization Prediction Error: {e}")
        return 'Uncategorized'
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
# MinMaxScaler is used (not StandardScaler) because MultinomialNB requires non-negative input
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# This file must exist and contain 'description', 'category', and 'amount' columns
DATA_FILE = 'sample_expenses_enhanced.csv'

try:
    df = pd.read_csv(DATA_FILE)
except FileNotFoundError:
    print(f"ERROR: Training data file '{DATA_FILE}' not found. Cannot train model.")
    exit(1)

X = df[['description', 'amount']]
y = df['category']

# Split by UNIQUE description, not by row — otherwise a description that
# repeats many times in the dataset (with different amounts) can land in
# both train and test, letting the model "cheat" on rows it has effectively
# already memorized. Grouping by description text closes that leak.
unique_descs = df['description'].unique()
desc_categories = df.drop_duplicates('description').set_index('description')['category']

train_descs, test_descs = train_test_split(
    unique_descs, test_size=0.2, random_state=42,
    stratify=desc_categories.loc[unique_descs].values
)

train_mask = df['description'].isin(train_descs)
test_mask = df['description'].isin(test_descs)

X_train, y_train = X[train_mask], y[train_mask]
X_test, y_test = X[test_mask], y[test_mask]

preprocessor = ColumnTransformer(
    transformers=[
        ('text_feature', TfidfVectorizer(ngram_range=(1, 2), min_df=1), 'description'),
        ('numeric_feature', MinMaxScaler(), ['amount']),
    ],
    remainder='passthrough'
)

model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', MultinomialNB(alpha=0.5)),
])

model_pipeline.fit(X_train, y_train)

# Evaluate on the held-out test set so we actually know how well this generalizes
y_pred = model_pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Test accuracy: {accuracy:.3f}")
print(classification_report(y_test, y_pred, zero_division=0))

# Refit on the full dataset for the deployed model, now that we've measured accuracy
model_pipeline.fit(X, y)

bundle = {'pipeline': model_pipeline, 'feature_names': X.columns.tolist()}
joblib.dump(bundle, 'expense_model.joblib')
print('Saved pipeline model to expense_model.joblib')
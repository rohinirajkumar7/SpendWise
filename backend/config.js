require('dotenv').config();

if (!process.env.JWT_SECRET) {
  // Fail loudly instead of silently signing tokens with a guessable default —
  // a hardcoded fallback secret here would make auth tokens forgeable.
  throw new Error('JWT_SECRET is not set. Add it to your .env file before starting the server.');
}

module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker',
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 4000,
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  // EasyOCR on CPU can genuinely take 30-90s depending on image size and
  // machine - 30s was aborting requests that were still running fine on the
  // Python side (visible as a "200 OK" in the AI service log *after* Node
  // had already logged a timeout and saved a blank expense).
  aiServiceTimeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 90000
};

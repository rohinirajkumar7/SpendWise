const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  category: { type: String, required: true },
  description: { type: String },
  merchant: { type: String },
  date: { type: Date, required: true },
  receiptUrl: { type: String }
}, { timestamps: true });
ExpenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);

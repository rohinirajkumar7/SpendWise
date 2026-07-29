
const Expense = require('../models/Expense');
const config = require('../../config');
const FormData = require('form-data');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

// Helper function to check AI service health
async function checkAIServiceHealth() {
    try {
        const response = await fetch(`${config.aiServiceUrl}/health`, {
            method: 'GET',
            timeout: 5000
        });
        return response.ok;
    } catch {
        return false;
    }
}

exports.createExpense = async (req, res) => {
    console.log('==== CREATE EXPENSE HIT ====');
    console.log('AI Service URL:', config.aiServiceUrl);
    console.log('Request user:', req.user);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? 'File present' : 'No file');

    try {
        const { amount, category, description, merchant, date, currency } = req.body;
        let parsedFromAI = null;

        if (req.file) {
            if (req.file.size > 10 * 1024 * 1024) {
                return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
            }

            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ error: 'Invalid file type. Please upload an image.' });
            }

            const form = new FormData();
            
            form.append('file', req.file.buffer, {
                filename: req.file.originalname || 'receipt.jpg',
                contentType: req.file.mimetype || 'image/jpeg',
                knownLength: req.file.buffer.length
            });

            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
            }, config.aiServiceTimeoutMs);

            try {
                const aiResp = await fetch(`${config.aiServiceUrl}/parse_receipt`, {
                    method: 'POST',
                    headers: form.getHeaders(),
                    body: form,
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (aiResp.ok) {
                    parsedFromAI = await aiResp.json();
                    console.log('AI parsing successful:', parsedFromAI);
                } else {
                    const errorText = await aiResp.text();
                    console.error('AI service error:', {
                        status: aiResp.status,
                        statusText: aiResp.statusText,
                        body: errorText
                    });
                    parsedFromAI = null;
                }
            } catch (fetchError) {
                clearTimeout(timeout);
                if (fetchError.name === 'AbortError') {
                    console.error(`AI service timeout after ${config.aiServiceTimeoutMs}ms`);
                } else {
                    console.error('AI service connection error:', fetchError.message);
                }
                parsedFromAI = null;
            }
        }

        const expense = new Expense({
            user: req.user.id,
            amount: parseFloat(amount) || parsedFromAI?.amount || 0,
            category: category || parsedFromAI?.suggested_category || 'Uncategorized',
            description: description || parsedFromAI?.raw_text?.slice(0, 500) || '',
            merchant: merchant || parsedFromAI?.merchant || '',
            date: date ? new Date(date) : (parsedFromAI?.date ? new Date(parsedFromAI.date) : new Date()),
            currency: currency || parsedFromAI?.currency || 'INR',
            receiptUrl: null
        });

        await expense.save();
        
        console.log('Expense saved successfully to MongoDB!');
        res.json(expense);
        
    } catch (err) {
        console.error('Expense creation error:', err);
        res.status(500).json({ 
            error: 'Server error', 
            message: err.message,
            details: err.errors ? Object.keys(err.errors).map(key => ({
                field: key,
                message: err.errors[key].message
            })) : []
        });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        console.log('Getting expenses for user:', req.user.id);
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
        console.log(`Found ${expenses.length} expenses`);
        res.json(expenses);
    } catch (err) {
        console.error('Get expenses error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

// update expense
exports.updateExpense = async (req, res) => {
    try {
        console.log('==== UPDATE EXPENSE HIT ====');
        console.log('Expense ID:', req.params.id);
        console.log('Update data:', req.body);

        const { amount, category, description, merchant, date, currency } = req.body;

        let expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this expense' });
        }

        if (amount !== undefined) expense.amount = parseFloat(amount);
        if (category) expense.category = category;
        if (description !== undefined) expense.description = description;
        if (merchant !== undefined) expense.merchant = merchant;
        if (date) expense.date = new Date(date);
        if (currency) expense.currency = currency;

        await expense.save();

        console.log('Expense updated successfully!');
        res.json(expense);

    } catch (err) {
        console.error('Update expense error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

// delete expense
exports.deleteExpense = async (req, res) => {
    try {
        console.log('==== DELETE EXPENSE HIT ====');
        console.log('Expense ID:', req.params.id);

        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this expense' });
        }

        await Expense.findByIdAndDelete(req.params.id);

        console.log('Expense deleted successfully!');
        res.json({ message: 'Expense deleted successfully', id: req.params.id });

    } catch (err) {
        console.error('Delete expense error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

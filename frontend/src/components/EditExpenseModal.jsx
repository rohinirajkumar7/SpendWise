import React, { useState } from 'react';
import { expenseAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';


export default function ExpenseForm({ onSaved }) {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('success');


    const resetForm = () => {
        setAmount('');
        setCategory('');
        setDescription('');
        setDate(new Date().toISOString().slice(0, 10));
        setFile(null);
        setPreview(null);
        // ❌ DON'T clear message here - let it timeout naturally
        // setMessage(null);
    };


    const showMessage = (msg, type = 'success', duration = 5000) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(null), duration);
    };


    const onFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;

        if (f.size > 10 * 1024 * 1024) {
            showMessage('File too large. Maximum size is 10MB.', 'error', 5000);
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(f.type)) {
            showMessage('Invalid file type. Please upload JPG, PNG, or WEBP images.', 'error', 5000);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setFile(f);
                setPreview(URL.createObjectURL(f));
                showMessage('✓ Receipt attached. Ready to scan & save!', 'success', 3000);
            };
            img.onerror = () => {
                showMessage('Corrupted or invalid image file. Please try another.', 'error', 5000);
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            showMessage('Error reading file. Please try again.', 'error', 3000);
        };
        reader.readAsDataURL(f);
    };


    const removeFile = () => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
        showMessage('Receipt removed.', 'success', 2000);
    };


    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        
        try {
            const form = new FormData();
            form.append('amount', amount || 0);
            if (category) form.append('category', category);
            form.append('description', description || '');
            form.append('merchant', '');
            form.append('date', date);
            form.append('currency', 'INR');
            
            if (file) {
                form.append('receipt', file);
            }

            const res = await expenseAPI.create(form);
            
            showMessage(
                `✓ Expense saved successfully!\nAmount: ₹${res.data.amount} | Category: ${res.data.category} | Merchant: ${res.data.merchant || 'N/A'}`,
                'success',
                7000
            );
            
            // call onSaved before resetting the form
            if (onSaved) onSaved();
            resetForm();
        } catch (err) {
            console.error(err);
            showMessage(`❌ Error: ${err.response?.data?.error || 'Server error'}`, 'error', 5000);
        } finally {
            setLoading(false);
        }
    };


    const quickScan = async () => {
        if (!file) {
            showMessage('❌ Attach a receipt image first to scan!', 'error', 3000);
            return;
        }
        
        setLoading(true);
        setMessage(null);
        
        try {
            const form = new FormData();
            form.append('amount', amount || 0);
            if (category) form.append('category', category);
            form.append('description', description || '');
            form.append('merchant', '');
            form.append('date', date);
            form.append('currency', 'INR');
            form.append('receipt', file);
            
            const res = await expenseAPI.create(form);
            
            showMessage(
                `✓ Receipt scanned & saved successfully!\nAmount: ₹${res.data.amount} | Category: ${res.data.category} | Merchant: ${res.data.merchant || 'N/A'}`,
                'success',
                8000
            );
            
            // call onSaved before resetting the form
            if (onSaved) onSaved();
            resetForm();
            
        } catch (err) {
            console.error(err);
            showMessage(
                `❌ Scan failed: ${err.response?.data?.error || err.message || 'Server error'}`,
                'error',
                7000
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100"
        >
            <div className="flex items-start justify-between mb-4 border-b pb-3">
                <div>
                    <h2 className="text-2xl font-bold text-indigo-700">Log New Expense</h2>
                    <p className="text-sm text-gray-500">Manual entry or upload a receipt to auto-scan & save.</p>
                </div>
            </div>

            {/* animated success/error message box */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-6 p-4 rounded-xl font-medium text-sm shadow-lg border-2 ${
                            messageType === 'success'
                                ? 'bg-green-50 text-green-800 border-green-300'
                                : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {messageType === 'success' ? (
                                <svg 
                                    className="w-6 h-6 flex-shrink-0 mt-0.5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                                    />
                                </svg>
                            ) : (
                                <svg 
                                    className="w-6 h-6 flex-shrink-0 mt-0.5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                    />
                                </svg>
                            )}
                            <div className="flex-1 whitespace-pre-line">{message}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-6 gap-6 mt-4">
                <div className="sm:col-span-2">
                    <label htmlFor="amount" className="form-label">Amount</label>
                    <input
                        id="amount"
                        required
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 499.00"
                        className="form-input"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="category" className="form-label">Category</label>
                    <input
                        id="category"
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Food, Transport, Groceries"
                        className="form-input"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="date" className="form-label">Date</label>
                    <input
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        type="date"
                        className="form-input"
                    />
                </div>

                <div className="sm:col-span-6">
                    <label htmlFor="description" className="form-label flex justify-between">
                        Description
                        <span className="text-xs text-gray-400 font-normal">Optional, max 500 chars</span>
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Lunch at Cafe with a friend..."
                        className="form-input resize-none"
                        rows="2"
                        maxLength="500"
                    />
                </div>

                <div className="sm:col-span-6">
                    <label className="form-label">Receipt Upload (optional)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition duration-150 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onFileChange}
                                className="hidden"
                            />
                            <span className="text-sm font-medium">{file ? 'Change Receipt' : 'Attach Receipt'}</span>
                        </label>

                        {file && (
                            <button
                                type="button"
                                onClick={quickScan}
                                disabled={loading}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-emerald-700 transition disabled:bg-emerald-300"
                            >
                                {loading ? 'Processing... (may take 20-40s)' : '🔍 Scan & Save Receipt'}
                            </button>
                        )}
                    </div>

                    {preview && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-4 border"
                        >
                            <img src={preview} alt="Receipt Preview" className="w-24 h-24 object-cover rounded-md border shadow-sm" />
                            <div>
                                <div className="text-sm font-semibold text-gray-800">File: {file?.name || 'receipt.jpg'}</div>
                                <div className="text-xs text-gray-500 mt-1">Ready for scan & save</div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                                >
                                    Remove File
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="sm:col-span-6 flex items-center gap-4 mt-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading || !amount || !category}
                        className="flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition disabled:bg-indigo-300"
                    >
                        {loading ? 'Processing...' : '💾 Save Expense'}
                    </motion.button>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition"
                    >
                        Reset Form
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

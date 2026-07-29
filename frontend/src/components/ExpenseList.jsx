import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditExpenseModal from './EditExpenseModal';
import { expenseAPI } from '../services/api';

export default function ExpenseList({ expenses, onUpdate }) {
  const [editingExpense, setEditingExpense] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  const handleSave = async (updatedData) => {
    try {
      await expenseAPI.update(editingExpense._id, updatedData);
      showMessage('✓ Expense updated successfully!');
      setEditingExpense(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      showMessage('Error updating expense: ' + (err.response?.data?.error || 'Server error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await expenseAPI.delete(id);
      showMessage('✓ Expense deleted successfully!');
      if (onUpdate) onUpdate();
    } catch (err) {
      showMessage('Error deleting expense: ' + (err.response?.data?.error || 'Server error'));
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-200">
        <p className="text-lg text-gray-500">No expenses recorded yet. Add your first one!</p>
      </div>
    );
  }

  const formatAmount = (amount, currency = '₹') => {
    return `${currency}${Number(amount).toFixed(2)}`;
  };
  
  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              message.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </motion.div>
        )}

        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Expense History</h3>
        
        <div className="overflow-x-auto">
          <motion.table 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.1 }}
            className="min-w-full table-auto text-sm"
          >
            <thead>
              <tr className="text-left text-gray-500 font-medium bg-gray-50">
                <th className="px-4 py-3 rounded-l-lg">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {expenses.map((e, i) => (
                <motion.tr 
                  key={e._id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="border-b border-gray-100 hover:bg-indigo-50 transition duration-150"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-600">
                    {formatAmount(e.amount, e.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.merchant || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                    {e.description || 'No description'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(e)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(e._id)}
                        className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </div>
      </div>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ======= frontend/src/pages/Dashboard.jsx =======

import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
// Removed redundant Navbar import (already in App.jsx)
import ExpenseForm from '../components/ExpenseForm'; // Renamed from ReceiptScanner functionality
import ExpenseList from '../components/ExpenseList';
import Reports from '../components/Reports';
import Feedback from '../components/Feedback';
import { expenseAPI } from '../services/api';

const tabs = [
  { path: 'add', name: 'Add Expense' },
  { path: 'list', name: 'Expense History' },
  { path: 'reports', name: 'Financial Reports' },
  { path: 'feedback', name: 'Feedback' },
];

const TabButton = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname.includes(to);
  
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `px-4 py-2 font-semibold transition duration-300 rounded-lg ${
          isActive ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-gray-600 hover:bg-gray-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = async () => {
    try {
      const res = await expenseAPI.list();
      // Sort expenses by date descending for better UX
      const sortedExpenses = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sortedExpenses);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      // Optional: Show an error notification
    }
  };

  useEffect(() => { fetchExpenses(); }, []);
  
  // Custom motion for inner page transitions (optional but nice)
  const pageTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Your Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-3 mb-8 p-3 bg-white rounded-xl shadow-md sticky top-16 z-[5]">
        {tabs.map(tab => (
          <TabButton key={tab.path} to={tab.path}>{tab.name}</TabButton>
        ))}
      </div>

      {/* Nested Routes for Tabs */}
      <Routes>
        <Route index element={<Navigate to="add" replace />} /> {/* Redirects /dashboard to /dashboard/add */}
        <Route path="add" element={
          <motion.div {...pageTransition} key="add-expense">
            <ExpenseForm onSaved={fetchExpenses} />
          </motion.div>
        } />
        <Route path="list" element={
  <motion.div {...pageTransition} key="expense-list">
    <ExpenseList expenses={expenses} onUpdate={fetchExpenses} />
  </motion.div>
} />

        <Route path="reports" element={
          <motion.div {...pageTransition} key="reports">
            <Reports expenses={expenses} />
          </motion.div>
        } />
        <Route path="feedback" element={
          <motion.div {...pageTransition} key="feedback">
            <Feedback />
          </motion.div>
        } />
      </Routes>
    </motion.div>
  );
}
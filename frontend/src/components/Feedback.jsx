// ======= frontend/src/components/Feedback.jsx =======

import React, { useState } from 'react';
import SuggestionBox from './SuggestionBox';
import { motion } from 'framer-motion';

export default function Feedback() {
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = (text) => {
    // In a real app, this would be an API call to save feedback to the database
    console.log('Feedback submitted:', text);
    setSubmitted(true);
    // Simulate a successful submission message
    setTimeout(() => setSubmitted(false), 5000); 
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100"
    >
      <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-3">Feedback & Suggestions</h3>
      
      {submitted ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-green-100 text-green-700 rounded-xl font-medium flex items-center gap-3"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/></svg>
            <span>Success! Thank you for helping us improve SpendWise.</span>
        </motion.div>
      ) : (
        <SuggestionBox onSubmit={submitFeedback} />
      )}
    </motion.div>
  );
}


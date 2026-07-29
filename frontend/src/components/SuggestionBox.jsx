// ======= frontend/src/components/SuggestionBox.jsx =======

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SuggestionBox({ onSubmit }) {
  const [text, setText] = useState('');
  
  const handleSubmit = () => {
      if (text.trim().length > 10) {
          onSubmit(text); 
          setText('');
      } else {
          alert('Please enter a more detailed suggestion (min 10 characters).');
      }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-indigo-500 resize-y transition duration-200"
        rows={5} 
        value={text} 
        onChange={e => setText(e.target.value)}
        placeholder="Tell us what you love or how we can improve. All feedback is valuable!"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-md font-medium hover:bg-indigo-700 disabled:bg-indigo-300 transition"
        onClick={handleSubmit}
        disabled={text.trim().length === 0}
      >
        Submit Feedback
      </motion.button>
    </div>
  );
}



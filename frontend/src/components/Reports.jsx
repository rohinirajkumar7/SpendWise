// ======= frontend/src/components/Reports.jsx =======

import React, { useMemo, useRef } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';

// Chart Colors Palette (Aesthetic)
const CHART_COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', 
  '#8b5cf6', '#a855f7', '#ec4899', '#f97316', '#14b8a6'
];

export default function Reports({ expenses = [] }) {
  const reportRef = useRef();
  
  // Logic to group by Category
  const { categories, amounts, categoryColors } = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      const cat = e.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    }
    const cats = Object.keys(map);
    const amnts = Object.values(map);
    const colors = cats.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    return { categories: cats, amounts: amnts, categoryColors: colors };
  }, [expenses]);
  
  // Logic to group by Month
  const monthlyMap = useMemo(() => {
    const m = {};
    for (const e of expenses) {
      const d = new Date(e.date);
      // Format: YYYY-MM
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      m[key] = (m[key] || 0) + (Number(e.amount) || 0);
    }
    const labels = Object.keys(m).sort();
    const data = labels.map(l => m[l]);
    return { labels, data };
  }, [expenses]);
  
  const pieData = {
    labels: categories,
    datasets: [{
      data: amounts,
      backgroundColor: categoryColors,
      hoverOffset: 8,
    }],
  };
  
  const barData = {
    labels: monthlyMap.labels,
    datasets: [{ 
      label: 'Monthly Spend (₹)', 
      data: monthlyMap.data,
      backgroundColor: CHART_COLORS[0],
      borderColor: CHART_COLORS[0],
      borderWidth: 1,
    }],
  };
  
  const total = amounts.reduce((a, b) => a + (b || 0), 0);
  
  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    
    // Use a higher scale for better PDF quality
    const canvas = await html2canvas(element, { scale: 3, logging: false }); 
    const imgData = canvas.toDataURL('image/jpeg', 1.0); // Use JPEG for smaller file size
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // Calculate new height to maintain aspect ratio
    const imgProps = canvas.width > 0 ? { width: canvas.width, height: canvas.height } : { width: pdfWidth, height: pdfWidth };
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('SpendWise-Report.pdf');
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-200">
        <p className="text-lg text-gray-500">Add some expenses to view your financial reports!</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 border-b pb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-700">Financial Reports</h3>
          <div className="text-sm text-gray-500">Visualize spending and export to PDF.</div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadPDF} 
          className="mt-3 sm:mt-0 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition"
        >
          Download PDF
        </motion.button>
      </div>

      <div ref={reportRef} className="p-4 bg-white rounded-lg">
        {/* Total Spend Summary */}
        <div className="mb-8 p-4 bg-indigo-50 rounded-xl shadow-inner border border-indigo-200">
          <div className="text-md text-indigo-600 font-semibold">Total Spent (All Time)</div>
          <div className="text-4xl font-extrabold text-indigo-800 mt-1">₹{total.toFixed(2)}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown - Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Category Breakdown</div>
            <div className="h-80 w-full flex justify-center items-center">
                <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          
          {/* Monthly Spend - Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Monthly Spend Analysis</div>
            <div className="h-80 w-full">
                <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
// ======= frontend/src/App.jsx =======

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './routes/PrivateRoute';
// The PublicRoute is redundant with PrivateRoute logic, will remove it.

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3 }}
    className="px-4 py-8 max-w-7xl mx-auto" // Added content padding and max-width for modern layout
  >
    {children}
  </motion.div>
);

export default function App() {
  const location = useLocation(); // To track location for AnimatePresence
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <AnimatePresence mode="wait"> {/* 'wait' mode ensures one component finishes animating before the next enters */}
        <Routes location={location} key={location.pathname}> {/* Key the Routes component */}
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/dashboard/*" element={ // Note the '/*' for nested routes
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard/add" replace />} /> {/* Default to a friendly dashboard route */}
          <Route path="*" element={<Navigate to="/dashboard/add" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
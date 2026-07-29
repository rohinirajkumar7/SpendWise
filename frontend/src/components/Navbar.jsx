// ======= frontend/src/components/Navbar.jsx =======

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isOpen, setIsOpen] = useState(false); // For mobile menu

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItemClass = "text-gray-700 hover:text-indigo-600 font-medium transition duration-150";

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="text-2xl font-extrabold text-indigo-700 tracking-wider">
            SpendWise 
          </Link>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center space-x-4">
            {!token ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link to="/login" className={navItemClass}>Login</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link to="/register" className={navItemClass}>Register</Link>
                </motion.div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)" }}
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium shadow-md transition duration-150"
              >
                Logout
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-indigo-600 focus:outline-none focus:text-indigo-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: "auto" },
          closed: { opacity: 0, height: 0, transition: { duration: 0.3 } },
        }}
        className="sm:hidden overflow-hidden bg-gray-50 border-t"
      >
        <div className="pt-2 pb-3 space-y-1 px-4">
          {!token ? (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                Login
              </Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-500 text-white hover:bg-red-600 transition"
            >
              Logout
            </button>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
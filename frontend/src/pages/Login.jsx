// ======= frontend/src/pages/Login.jsx =======

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();
  
  const onSubmit = async (data) => {
    try {
      const res = await authAPI.login(data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard/add'); // Redirect to the preferred initial dashboard tab
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      // Use react-hook-form's setError to show error within the form if possible
      setError("apiError", { type: "manual", message });
      alert(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-16 bg-gray-50"> {/* -mt-16 pulls it up behind the navbar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-8 border border-gray-100"
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-indigo-700">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to manage your expenses</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.apiError && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{errors.apiError.message}</p>}

          <div>
            <label className="form-label">Email</label>
            <input 
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="form-input"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="form-label">Password</label>
            <input 
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="form-input"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition disabled:bg-indigo-300"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Don’t have an account? 
          <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-800 ml-1 transition">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
// ======= frontend/src/pages/Register.jsx =======

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();
  
  const onSubmit = async (data) => {
    try {
      await authAPI.register(data);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
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
          <h2 className="text-3xl font-extrabold text-pink-600">Create Account</h2>
          <p className="text-gray-500 mt-2">Start tracking your expenses smartly</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.apiError && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{errors.apiError.message}</p>}
          
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="form-input"
              placeholder="Your Name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

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
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
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
            className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-pink-700 transition disabled:bg-pink-300"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </motion.button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Already have an account? 
          <Link to="/login" className="text-pink-600 font-medium hover:text-pink-800 ml-1 transition">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLogin = () => {
  const [values, setValues] = useState({
    AdminID: '',
    Password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing tokens on login page load
    localStorage.removeItem('token');
  }, []);

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!values.AdminID || !values.Password) {
      setError("Please fill in both Admin ID and Password.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:3000/auth/admin-login', values);
      if (response.status === 201) {
        localStorage.setItem('token', response.data.token);
        
        // Add a small delay for better UX
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 500);
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4 py-10">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:justify-between rounded-3xl overflow-hidden shadow-2xl bg-white">
          
          {/* Left Side - Hero Section */}
          <motion.div 
            className="hidden md:flex flex-col justify-center items-start p-10 lg:p-16 bg-gradient-to-br from-blue-700 to-blue-600 text-white w-full md:w-1/2 h-full"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Welcome, Administrator!</h1>
            <p className="text-lg mb-8 text-blue-100">
              Access your dashboard to manage faculty, students, classes, and system settings to ensure smooth academic operations.
            </p>
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-3">Administration Portal</h3>
              <p className="text-blue-100">
                Oversee your educational institution with complete control over user management, academic records, and system configuration.
              </p>
            </div>
          </motion.div>
          
          {/* Right Side - Login Form */}
          <motion.div 
            className="w-full md:w-1/2 p-8 lg:p-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="max-w-md mx-auto">
              <motion.div className="flex justify-center mb-6" variants={itemVariants}>
                <img src={Logo} className="w-24 h-24 lg:w-28 lg:h-28 object-contain" alt="Logo" />
              </motion.div>
              
              <motion.h2 
                className="text-center text-2xl lg:text-3xl font-bold text-blue-700 mb-8"
                variants={itemVariants}
              >
                ADMIN PORTAL
              </motion.h2>
              
              {error && (
                <motion.div 
                  className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
              
              <motion.form 
                className="space-y-6" 
                onSubmit={handleSubmit}
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <label className="text-gray-700 text-sm font-medium mb-2 block">Admin ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <input
                      name="AdminID"
                      type="text"
                      required
                      value={values.AdminID}
                      className="w-full text-gray-800 border border-gray-300 pl-12 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="Enter your Admin ID"
                      onChange={handleChanges}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className="text-gray-700 text-sm font-medium mb-2 block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <input
                      name="Password"
                      type="password"
                      required
                      value={values.Password}
                      className="w-full text-gray-800 border border-gray-300 pl-12 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="Enter your password"
                      onChange={handleChanges}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
                
                <motion.button 
                  type="submit" 
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                    loading 
                      ? 'bg-blue-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                  }`}
                  disabled={loading}
                  variants={itemVariants}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </motion.button>
              </motion.form>
              
              <motion.p 
                className="text-gray-600 text-sm mt-8 text-center"
                variants={itemVariants}
              >
                <Link 
                  to="/faculty-login" 
                  className="text-green-700 font-medium hover:text-green-800 hover:underline flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                  Login as Faculty
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;

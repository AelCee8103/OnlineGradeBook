import React, { useState, useEffect } from 'react';
import Logo from '../assets/logo.png';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyLogin = () => {
  const [values, setValues] = useState({
    FacultyID: '',
    Password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing tokens on login page load
    localStorage.removeItem('token');
    localStorage.removeItem('facultyID');
  }, []);

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!values.FacultyID || !values.Password) {
      setError("Please fill in both Faculty ID and Password.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:3000/auth/faculty-login', values);
      if (response.status === 201) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem("facultyID", response.data.facultyID);
        
        // Add a small delay for better UX
        setTimeout(() => {
          navigate('/faculty-dashboard');
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

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 25 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { 
        duration: 0.2 
      }
    }
  };

  // Backdrop animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4 py-10">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:justify-between rounded-3xl overflow-hidden shadow-2xl bg-white">
          
          {/* Left Side - Hero Section */}
          <motion.div 
            className="hidden md:flex flex-col justify-center items-start p-10 lg:p-16 bg-gradient-to-br from-green-700 to-green-600 text-white w-full md:w-1/2 h-full"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Welcome Back!</h1>
            <p className="text-lg mb-8 text-green-100">
              Access your dashboard to manage student grades, track academic progress, and organize classroom activities all in one place.
            </p>
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-3">Online Grade Book System</h3>
              <p className="text-green-100">
                Securely manage your class information and student records with our comprehensive grade management solution.
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
                className="text-center text-2xl lg:text-3xl font-bold text-green-700 mb-8"
                variants={itemVariants}
              >
                FACULTY PORTAL
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
                  <label className="text-gray-700 text-sm font-medium mb-2 block">Faculty ID</label>
                  <div className="relative">
                    {/* Fixed icon placement */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <input
                      name="FacultyID"
                      type="text"
                      required
                      className="w-full text-gray-800 border border-gray-300 pl-12 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="Enter your Faculty ID"
                      onChange={handleChanges}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className="text-gray-700 text-sm font-medium mb-2 block">Password</label>
                  <div className="relative">
                    {/* Fixed icon placement */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <input
                      name="Password"
                      type="password"
                      required
                      className="w-full text-gray-800 border border-gray-300 pl-12 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="Enter your password"
                      onChange={handleChanges}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
                
                <motion.div className="flex items-center justify-end" variants={itemVariants}>
                  {/* DaisyUI modal trigger */}
                  <label 
                    htmlFor="forgot-password-modal" 
                    className="text-sm text-green-600 hover:text-green-800 hover:underline font-medium transition-colors duration-200 cursor-pointer"
                  >
                    Forgot your password?
                  </label>
                </motion.div>
                
                <motion.button 
                  type="submit" 
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                    loading 
                      ? 'bg-green-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-opacity-50'
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
                  to="/admin-login" 
                  className="text-blue-700 font-medium hover:text-blue-800 hover:underline flex items-center justify-center gap-2 transition-colors duration-200"
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
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" 
                    />
                  </svg>
                  Login as Admin
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* DaisyUI Modal */}
      <input type="checkbox" id="forgot-password-modal" className="modal-toggle" checked={showForgotModal} onChange={() => setShowForgotModal(!showForgotModal)} />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white relative">
          <label htmlFor="forgot-password-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset</h3>
            
            <p className="text-gray-600 mb-6">
              Faculty accounts are managed by your school administrator. Please contact your administrator to reset your password or resolve account issues.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 w-full">
              <h4 className="text-gray-700 font-medium mb-2">Contact Information:</h4>
              <p className="text-gray-600">
                Email: admin@bernardo.edu.ph<br />
                Phone: (123) 456-7890<br />
                Office: Administration Building, Room 101
              </p>
            </div>
            
            <div className="modal-action w-full">
              <label 
                htmlFor="forgot-password-modal" 
                className="btn btn-block bg-green-600 hover:bg-green-700 border-none text-white"
              >
                I Understand
              </label>
            </div>
          </div>
        </div>
        
        {/* Modal backdrop */}
        <label className="modal-backdrop" htmlFor="forgot-password-modal">Close</label>
      </div>
    </section>
  );
};

export default FacultyLogin;

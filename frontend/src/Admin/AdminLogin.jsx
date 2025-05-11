import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const AdminLogin = () => {
  const [values, setValues] = useState({
    AdminID: '',
    Password: ''
  });

  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!values.AdminID || !values.Password) {
      alert("Please fill in both Admin ID and Password.");
      return;
    }
    
    try {
      // First clear any previous authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('adminID');
      localStorage.removeItem('adminName');
      localStorage.removeItem('facultyID');
      localStorage.removeItem('facultyName');
      
      const response = await axios.post('http://localhost:3000/auth/admin-login', values);
      if (response.status === 201 && response.data.token) {
        // Store authentication data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('adminID', values.AdminID);
        localStorage.setItem('adminName', response.data.adminName || 'Admin');
        
        console.log("Admin login successful, redirecting to dashboard");
        
        // Add a small delay before redirect to ensure localStorage is updated
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 100);
      } else {
        // Handle unexpected response
        alert("Login failed. Unexpected server response.");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response) {
        // Handle specific error responses
        if (err.response.status === 404) {
          alert("Admin ID not found or password incorrect.");
        } else if (err.response.status === 500) {
          alert("Server error. Please try again later.");
        } else {
          alert(err.response.data?.message || "Login failed. Please try again.");
        }
      } else if (err.request) {
        // Network error
        alert("Network error. Please check your internet connection.");
      } else {
        // Unexpected error
        alert("Invalid credentials or server error.");
      }
    }
  };

  return (
    <section className="bg-gray-200 min-h-screen flex items-center justify-center">
     <div className="container mx-auto px-4 sm:px-8 md:px-24 lg:px-32">
        <div className="flex flex-col md:flex-row items-center md:justify-between">
          {/* Content Section */}
          <div className="hidden md:flex flex-col justify-center items-start px-4 md:px-20 text-center md:text-left">
            <h1 className="text-5xl font-bold">Welcome!</h1>
            <p className="text-lg py-6">
              Easily manage faculty, students, and classes. Log in to oversee and streamline operations across your educational institution.
            </p>
          </div>

          {/* Login Form */}
          <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
            <img src={Logo} alt="Logo" className="w-32 h-32 mx-auto" />
            <h2 className="text-blue-700 text-center text-2xl font-bold mt-4">ADMIN PORTAL</h2>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {/* Admin ID Input */}
              <div>
                <label className="text-gray-800 text-sm mb-2 block">Admin ID</label>
                <div className="relative">
                  <input
                    name="AdminID"
                    type="text"
                    value={values.AdminID}
                    onChange={handleChanges}
                    required
                    className="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
                    placeholder="Enter admin ID"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-gray-800 text-sm mb-2 block">Password</label>
                <div className="relative">
                  <input
                    name="Password"
                    type="password"
                    value={values.Password}
                    onChange={handleChanges}
                    required
                    className="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <a href="#" className="text-gray-400 hover:underline font-semibold text-sm">
                  Forgot your password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Sign in
              </button>
            </form>
               <Link to="/faculty-login" className='text-blue-700 flex justify-center text-md mt-4 hover:underline'>Login as Faculty</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;

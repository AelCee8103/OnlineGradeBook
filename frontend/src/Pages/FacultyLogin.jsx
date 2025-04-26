import React, { useState } from 'react';
import Logo from '../assets/logo.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FacultyLogin = () => {
  const [values, setValues] = useState({
    FacultyID: '',
    Password: ''
  });

  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!values.FacultyID || !values.Password) {
      alert("Please fill in both Faculty ID and Password.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/auth/faculty-login', values);
      if (response.status === 201) {
        localStorage.setItem('token', response.data.token);

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("facultyID", response.data.facultyID); // ← IMPORTANT
        navigate('/faculty-dashboard');
      }
    } catch (err) {
      console.log(err);
      alert("Invalid credentials or server error.");
    }
  };

  return (
    <section className="bg-gray-200 min-h-screen flex items-center justify-center">
    <div className="container mx-auto px-4 sm:px-8 md:px-24 lg:px-32">
      <div className="flex flex-col gap-12 md:flex-row items-center md:justify-between ">
        {/* Content Section */}
        <div className="hidden md:flex flex-col justify-center items-start px-4 md:px-20">
          <h1 className="text-3xl md:text-5xl font-bold text-center md:text-left">Welcome!</h1>
          <p className="text-base md:text-lg py-4 md:py-10 text-center md:text-left">
            Manage, track, and organize your students' grades with ease. Login to access your personalized dashboard.
          </p>
        </div>
  
        {/* Login Form */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
          <div className="p-4 sm:p-6 md:p-8 rounded-2xl bg-white shadow-md">
            <img src={Logo} className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto" alt="Logo" />
            <h2 className="text-green-700 text-center text-lg sm:text-xl md:text-2xl font-bold mt-4">FACULTY PORTAL</h2>
  
            {/* FORM */}
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-gray-800 text-sm mb-2 block">Faculty ID</label>
                <input
                  name="FacultyID"
                  type="text"
                  required
                  className="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
                  placeholder="Enter Faculty ID"
                  onChange={handleChanges}
                />
              </div>
              <div>
                <label className="text-gray-800 text-sm mb-2 block">Password</label>
                <input
                  name="Password"
                  type="password"
                  required
                  className="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
                  placeholder="Enter password"
                  onChange={handleChanges}
                />
              </div>
              <div className="flex items-center justify-end">
                <a href="#" className="text-gray-400 hover:underline font-semibold text-sm">
                  Forgot your password?
                </a>
              </div>
              <button type="submit" className="w-full py-3 px-4 text-sm rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                Sign in
              </button>
            </form>
  
            <p className="text-gray-800 text-sm mt-4 text-center">
              Don't have an account?{' '}
              <a href="/faculty-register" className="text-green-600 hover:underline font-semibold">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
  

  );
};

export default FacultyLogin;

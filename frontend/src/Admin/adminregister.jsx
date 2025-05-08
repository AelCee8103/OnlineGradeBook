import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';


const adminregister = () => {
  const [values, setValues] = useState({
    adminID: '',
    FirstName: '',
    MiddleName: '',
    LastName: '',
    Email: '',
    Password: ''
  });
  const navigate = useNavigate();
  const handleChanges = (e) => {
    setValues({...values, [e.target.name]:e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.adminID || !values.FirstName || !values.MiddleName || !values.LastName || !values.Email || !values.Password) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/auth/admin-register', values);
          if(response.status === 201){
        navigate('/admin-login');
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='shadow-lg px-8 py-5 border w-96'>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className='block text-gray-700'>Admin ID</label>
            <input type="text" name="adminID" placeholder='Enter Admin ID' className='w-full px-3 py-2 border' onChange={handleChanges} />
          </div>
          <div className="mb-4">
            <label className='block text-gray-700'>First Name</label>
            <input type="text" name="FirstName" placeholder='Enter First Name' className='w-full px-3 py-2 border' 
            onChange={handleChanges} />
          </div>
          <div className="mb-4">
            <label className='block text-gray-700'>Middle Name</label>
            <input type="text" name="MiddleName" placeholder='Enter Middle Name' className='w-full px-3 py-2 border' onChange={handleChanges} />
          </div>
          <div className="mb-4">
            <label className='block text-gray-700'>Last Name</label>
            <input type="text" name="LastName" placeholder='Enter Last Name' className='w-full px-3 py-2 border' onChange={handleChanges} />
          </div>
          <div className="mb-4">
            <label className='block text-gray-700'>Email</label>
            <input type="email" name="Email" placeholder='Enter Email' className='w-full px-3 py-2 border' onChange={handleChanges} />
          </div>
          <div className="mb-4">
            <label className='block text-gray-700'>Password</label>
            <input type="password" name="Password" placeholder='Enter Password' className='w-full px-3 py-2 border' onChange={handleChanges} />
          </div>
          <button className="w-full bg-green-600 text-white hover:bg-green-700 py-2 ">Submit</button>
        </form>
        <div className="text-center mt-4">
          <span>Already have an account? </span>
          <Link to='/admin-login' className='text-blue-500'>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default adminregister;

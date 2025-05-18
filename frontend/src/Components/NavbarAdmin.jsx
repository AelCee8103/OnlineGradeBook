import React, { useState, useEffect } from "react";
import axios from "axios";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 
import { useSocket } from "../context/SocketContext";

const NavbarAdmin = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("Loading...");
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('authenticated', (response) => {
      if (response.success) {
        setSocketStatus('authenticated');
      } else {
        setSocketStatus('auth_failed');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('authenticated');
    };
  }, [socket]);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const adminID = localStorage.getItem("adminID");
      const storedName = localStorage.getItem("adminName");
      
      if (!adminID || !storedName) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const response = await axios.get("http://localhost:3000/auth/admin-dashboard", {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.admin) {
              const { AdminID, FirstName } = response.data.admin;
              localStorage.setItem("adminID", AdminID);
              localStorage.setItem("adminName", FirstName);
              setAdminName(FirstName);

              // Authenticate socket after getting admin info
              if (socket) {
                socket.emit('authenticate', {
                  userType: 'admin',
                  userID: AdminID,
                  adminName: FirstName
                });
              }
            }
          } catch (error) {
            console.error("Error fetching admin profile:", error);
            setAdminName("Admin");
          }
        }
      } else {
        setAdminName(storedName);
        // Authenticate socket if we already have the info
        if (socket) {
          socket.emit('authenticate', {
            userType: 'admin',
            userID: adminID,
            adminName: storedName
          });
        }
      }
    };

    fetchAdminProfile();
  }, [socket]);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("adminID");
    localStorage.removeItem("adminName");
    
    // Disconnect socket if needed
    if (socket) {
      socket.emit('logout');
    }
    
    // Redirect to login page
    window.location.href = "/";
  };

  return (
    <div className="navbar bg-base-100 px-2 sm:px-4 shadow-md">
      {/* Left Section - Hamburger + Logo */}
      <div className="navbar-start">
        <button className="lg:hidden btn btn-ghost btn-circle" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>
        <a className="normal-case text-base sm:text-lg md:text-xl font-bold text-blue-700 ml-0 sm:ml-2">BDCNHS GRADEBOOK</a>
      </div>
      
      {/* Center Section - Can be used for navigation links on larger screens */}
      <div className="navbar-center hidden lg:flex">
        {/* Add any center content here if needed */}
      </div>

      {/* Right Section */}
      <div className="navbar-end">
        {/* Socket Status - Hide on very small screens */}
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <div className={`w-2 h-2 rounded-full ${
            socketStatus === 'connected' ? 'bg-yellow-400' :
            socketStatus === 'authenticated' ? 'bg-green-400' :
            socketStatus === 'auth_failed' ? 'bg-red-400' :
            'bg-gray-400'
          }`} />
          <span className="text-xs md:text-sm text-gray-600">
            {socketStatus === 'connected' ? 'Connected' :
            socketStatus === 'authenticated' ? 'Authenticated' :
            socketStatus === 'auth_failed' ? 'Auth Failed' :
            'Disconnected'}
          </span>
        </div>
        
        {/* Admin Profile Dropdown - Desktop */}
        <div className="dropdown dropdown-end hidden sm:block">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost btn-sm md:btn-md rounded-btn"
          >
            <div className="flex items-center gap-1 md:gap-2">
              <FontAwesomeIcon icon={faUser} className="text-md md:text-lg" />
              <span className="text-sm md:text-base">{adminName}</span>
            </div>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[100] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2"
          >
            <li className="menu-title">
              <span className="text-xs font-semibold text-gray-500">Admin Account</span>
            </li>
            <li>
              <button onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </li>
          </ul>
        </div>
        
        {/* Mobile View Profile Button */}
        <div className="sm:hidden">
          <button className="btn btn-ghost btn-circle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <FontAwesomeIcon icon={faUser} className="text-lg" />
          </button>
          
          {/* Mobile Profile Dropdown */}
          {isDropdownOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setIsDropdownOpen(false)}>
              <div className="absolute right-2 top-16 w-64 bg-base-100 rounded-lg shadow-lg p-3 z-50" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 p-2 border-b border-gray-100 pb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="font-semibold">{adminName}</div>
                    <div className="text-xs text-gray-500">Administrator</div>
                  </div>
                </div>
                
                {/* Socket status in mobile view */}
                <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${
                    socketStatus === 'connected' ? 'bg-yellow-400' :
                    socketStatus === 'authenticated' ? 'bg-green-400' :
                    socketStatus === 'auth_failed' ? 'bg-red-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-600">
                    {socketStatus === 'connected' ? 'Connected' :
                    socketStatus === 'authenticated' ? 'Authenticated' :
                    socketStatus === 'auth_failed' ? 'Auth Failed' :
                    'Disconnected'}
                  </span>
                </div>
                
                <div className="mt-2">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavbarAdmin;
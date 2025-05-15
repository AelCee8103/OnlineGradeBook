import React, { useState, useEffect } from "react";
import axios from "axios";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 
import NotificationDropdown from "../Components/NotificationDropdown"; // Adjust the import path as necessary
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

  return (
    <div className="navbar bg-base-100 px-4 shadow-md">
      {/* Left Section - Hamburger + Logo */}
      <div className="flex-1 flex items-center">
        <button className="md:hidden text-2xl mr-3" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <a className="ml-4 text-xl text-blue-700 font-bold">BDCNHS GRADEBOOK</a>
      </div>

      {/* Right Section */}
      <div className="flex-none">
        <div className="flex items-center gap-4">
          {/* Add Notification Dropdown Here */}
      

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              socketStatus === 'connected' ? 'bg-yellow-400' :
              socketStatus === 'authenticated' ? 'bg-green-400' :
              socketStatus === 'auth_failed' ? 'bg-red-400' :
              'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600">
              {socketStatus === 'connected' ? 'Connected' :
              socketStatus === 'authenticated' ? 'Authenticated' :
              socketStatus === 'auth_failed' ? 'Auth Failed' :
              'Disconnected'}
            </span>
          </div>
          
          <div className="flex grow justify-end px-2">
            <div className="flex items-stretch">
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost rounded-field">Admin</div>
                <ul
                  tabIndex={0}
                  className="menu dropdown-content bg-white rounded-box z-1 mt-4 w-52 p-2 shadow-sm">
                  <li><a className="bg-">LOGOUT</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile View */}
        <div className="md:hidden">
          <div className="relative">
            <button className="btn btn-ghost" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FontAwesomeIcon icon={faUser} className="text-xl" />
            </button>
            {isDropdownOpen && (
              <ul className="absolute right-0 mt-3 p-2 shadow bg-base-100 rounded-box w-52 z-10">
                <li className="p-2 flex items-center">
                  <FontAwesomeIcon icon={faUser} className="text-gray-900 text-xl mr-2" />
                  <span className="text-lg font-semibold">{adminName}</span>
                </li>
                <li className="px-4 text-sm text-gray-500">Admin</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarAdmin;
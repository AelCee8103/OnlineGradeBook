import React, { useState, useEffect } from "react";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NotificationDropdown from "../Components/NotificationDropdown";
import axios from "axios";
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

const NavbarFaculty = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [facultyName, setFacultyName] = useState("Loading...");
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socket = useSocket();

  useEffect(() => {
    const fetchFacultyProfile = async () => {
      const token = localStorage.getItem("token");
      const facultyID = localStorage.getItem("facultyID");

      if (!token || !facultyID) {
        console.error("Missing authentication details");
        return;
      }

      try {
        const response = await axios.get("http://localhost:3000/auth/faculty-dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.user) {
          const { LastName, FirstName, MiddleName } = response.data.user;
          const fullName = `${LastName}, ${FirstName}${MiddleName ? ` ${MiddleName.charAt(0)}.` : ''}`;
          localStorage.setItem("facultyName", fullName);
          setFacultyName(fullName);

          // Authenticate socket after getting faculty info
          if (socket) {
            socket.emit('authenticate', {
              userType: 'faculty',
              userID: facultyID,
              facultyName: fullName
            });
          }
        }
      } catch (error) {
        console.error("Error fetching faculty profile:", error);
        toast.error("Failed to load faculty profile");
      }
    };

    fetchFacultyProfile();
  }, [socket]);

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

  return (
    <div className="navbar bg-base-100 px-4 shadow-md">
      {/* Left Section - Hamburger + Logo */}
      <div className="flex-1 flex items-center">
        <button className="md:hidden text-2xl mr-3" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <a className="ml-4 text-xl text-green-800 font-bold">BDCNHS Gradebook</a>
      </div>

      {/* Right Section */}
      <div className="flex-none">
        <div className="flex items-center gap-4">
          <NotificationDropdown userType="faculty" />
          
          {/* Socket Status Indicator */}
          <div className="hidden md:flex items-center gap-2">
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
          
          {/* Desktop View - User Info */}
          <div className="hidden md:flex items-center text-gray-600">
            <FontAwesomeIcon icon={faUser} className="text-gray-900 text-2xl mr-3" />
            <div className="flex flex-col px-2">
              <h1 className="text-lg font-semibold">{facultyName}</h1>
              <span className="text-sm text-gray-500">Faculty Member</span>
            </div>
          </div>
        </div>

        {/* Mobile View - User Dropdown */}
        <div className="md:hidden">
          <div className="relative">
            <button className="btn btn-ghost" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FontAwesomeIcon icon={faUser} className="text-xl" />
            </button>
            {isDropdownOpen && (
              <ul className="absolute right-0 mt-3 p-2 shadow bg-base-100 rounded-box w-52 z-10">
                <li className="p-2 flex items-center">
                  <FontAwesomeIcon icon={faUser} className="text-gray-900 text-xl mr-2" />
                  <span className="text-lg font-semibold">{facultyName}</span>
                </li>
                <li className="px-4 text-sm text-gray-500">Faculty Member</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarFaculty;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const NavbarAdmin = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("Loading...");

  useEffect(() => {
        const storedName = localStorage.getItem("FirstName");
        setAdminName(storedName || "Admin");
  }, []);

  return (
    <div className="navbar bg-base-100 px-4 shadow-md">
      {/* Left Section - Hamburger + Logo */}
      <div className="flex-1 flex items-center">
        <button className="md:hidden text-2xl mr-3" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <a className="ml-4 text-xl text-blue-700 font-bold">BDCNHS Gradebook</a>
      </div>

      {/* Right Section */}
      <div className="flex-none">
        <div className="hidden md:flex items-center text-gray-600">
          <FontAwesomeIcon icon={faUser} className="text-gray-900 text-2xl mr-3" />
          <div className="flex flex-col px-2">
            <h1 className="text-lg font-semibold">Admin</h1>
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

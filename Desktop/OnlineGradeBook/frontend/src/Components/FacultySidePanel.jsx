import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../assets/logo.png";
import {
  faHome,
  faChalkboardTeacher,
  faUsers,
  faClipboardList,
  faUserCheck,    
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import LogoutModal from "../Components/LogoutModal"; // Import the Logout Modal component

const FacultySidePanel = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", icon: faHome, link: "/faculty-dashboard" },
    { label: "Class Advisory", icon: faChalkboardTeacher, link: "/faculty-class-advisory" },
    { label: "Classes", icon: faUsers, link: "/faculty-classes" },
    { label: "Attendance", icon: faUserCheck, link: "/faculty-attendance" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/faculty-login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen bg-white shadow-lg p-6 rounded-r-xl overflow-y-auto">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Faculty Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-green-700 text-center mb-6">Faculty Panel</h2>

        <ul className="space-y-4 flex-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                className={`flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 
                  ${isActive(item.link) ? "bg-green-700 text-white" : "text-gray-700 hover:bg-green-700 hover:text-white"}`}
                to={item.link}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="mt-6 bg-green-700 text-white w-full py-3 rounded-lg hover:bg-green-800 flex items-center justify-center"
          onClick={() => setLogoutModalOpen(true)}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Log Out
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg p-6 rounded-r-xl transform transition-transform z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden overflow-y-auto`}
      >
        <button className="absolute top-4 right-4 text-2xl text-gray-700" onClick={toggleSidebar}>
          ✖
        </button>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Faculty Panel</h2>

        <ul className="space-y-4 flex-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                className={`flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 
                  ${isActive(item.link) ? "bg-green-700 text-white" : "text-gray-700 hover:bg-green-700 hover:text-white"}`}
                to={item.link}
                onClick={toggleSidebar}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="mt-6 bg-green-700 text-white w-full py-3 rounded-lg hover:bg-green-800 flex items-center justify-center"
          onClick={() => {
            toggleSidebar();
            setLogoutModalOpen(true);
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Log Out
        </button>
      </div>
    </>
  );
};

export default FacultySidePanel;

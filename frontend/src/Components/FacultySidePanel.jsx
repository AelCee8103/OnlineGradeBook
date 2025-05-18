import React, { useState, useEffect } from "react";
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

  // Add body class when sidebar is open to disable scrolling
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isSidebarOpen]);

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

      {/* Overlay for Mobile - This is the key change */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen bg-white shadow-lg p-6 rounded-r-xl overflow-y-auto">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Faculty Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 text-center mb-6">Faculty Panel</h2>

        <ul className="space-y-4 flex-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                className={`flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 
                  ${isActive(item.link) ? "bg-green-800 text-white" : "text-gray-700 hover:bg-green-800 hover:text-white"}`}
                to={item.link}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="mt-6 bg-green-800 text-white w-full py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
          onClick={() => setLogoutModalOpen(true)}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Log Out
        </button>
      </div>

      {/* Mobile Sidebar - Improved z-index to appear above the overlay */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl p-6 rounded-r-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img src={Logo} alt="Faculty Logo" className="w-12 h-12 object-contain mr-3" />
            <h2 className="text-xl font-bold text-green-800">Faculty Panel</h2>
          </div>
          <button 
            className="text-gray-500 hover:text-gray-700 focus:outline-none" 
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="space-y-3 flex-1 mt-8">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                className={`flex items-center px-4 py-3 text-lg font-medium rounded-lg transition-all duration-300 
                  ${isActive(item.link) ? "bg-green-800 text-white" : "text-gray-700 hover:bg-green-800 hover:text-white"}`}
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
          className="mt-8 bg-green-800 text-white w-full py-3 rounded-lg hover:bg-green-900 flex items-center justify-center shadow-md"
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

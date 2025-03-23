import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faChalkboardTeacher, faUsers, faClipboardList, faUserCheck, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/logo.png";

const FacultySidePanel = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token or any auth info
    navigate("/faculty-login"); // Redirect to faculty login
  };

  const menuItems = [
    { label: "Dashboard", icon: faHome, link: "/faculty-dashboard" },
    { label: "Class Advisory", icon: faChalkboardTeacher, link: "/class-advisory" },
    { label: "Classes", icon: faUsers, link: "/classes" },
    { label: "Grades", icon: faClipboardList, link: "/grades" },
    { label: "Attendance", icon: faUserCheck, link: "/attendance" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen bg-white shadow-lg p-6 rounded-r-xl">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Faculty Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 text-center mb-6">Faculty Dashboard</h2>

        <ul className="space-y-4">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                className="flex items-center px-5 py-3 text-lg font-medium text-gray-700 rounded-lg transition-all duration-300 hover:bg-green-900 hover:text-white"
                to={item.link}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center px-5 py-3 text-lg font-medium text-white rounded-lg bg-green-700 hover:bg-green-800 transition-all duration-300"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-xl" />
          Logout
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

        <ul className="space-y-4">
          {menuItems.map((item, index) => (
            <li key={index} onClick={toggleSidebar}>
              <Link
                className="flex items-center px-5 py-3 text-lg font-medium text-gray-700 rounded-lg transition-all duration-300 hover:bg-green-900 hover:text-white"
                to={item.link}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout Button for Mobile */}
        <button
          onClick={() => {
            handleLogout();
            toggleSidebar();
          }}
          className="mt-6 w-full flex items-center px-5 py-3 text-lg font-medium text-red-600 rounded-lg transition-all duration-300 hover:bg-red-600 hover:text-white"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-xl" />
          Logout
        </button>
      </div>
    </>
  );
};

export default FacultySidePanel;

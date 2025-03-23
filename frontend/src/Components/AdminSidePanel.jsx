import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,             // Dashboard
  faUserGraduate,      // Manage Students
  faChalkboardTeacher, // Manage Faculty
  faGraduationCap,     // Manage Classes
  faFileLines,         // Manage Grades
  faClipboardCheck,    // Validation Requests
  faArchive,           // Archived Records
  faSignOutAlt         // Log Out
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/logo.png";

const AdminSidePanel = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Dashboard", icon: faGauge, link: "/admin-dashboard" },
    { label: "Manage Students", icon: faUserGraduate, link: "/manage-students" },
    { label: "Manage Faculty", icon: faChalkboardTeacher, link: "/manage-faculty" },
    { label: "Manage Classes", icon: faGraduationCap, link: "/manage-classes" },
    { label: "Manage Grades", icon: faFileLines, link: "/manage-grades" },
    { label: "Validation Requests", icon: faClipboardCheck, link: "/validation-requests" },
    { label: "Archived Records", icon: faArchive, link: "/archived-records" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin-login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen bg-white shadow-lg p-6 rounded-r-xl">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Admin Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">Admin Panel</h2>

        <ul className="space-y-4 flex-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                className="flex items-center px-5 py-3 text-lg font-medium text-gray-700 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white"
                to={item.link}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="mt-6 bg-blue-700 text-white w-full py-3 rounded-lg hover:bg-blue-800 flex items-center justify-center"
          onClick={handleLogout}
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
        <button className="absolute top-4 right-4 text-2xl text-gray-700" onClick={toggleSidebar}>✖</button>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Admin Panel</h2>

        <ul className="space-y-4 flex-1">
          {menuItems.map((item, index) => (
            <li key={index} onClick={toggleSidebar}>
              <Link
                className="flex items-center px-5 py-3 text-lg font-medium text-gray-700 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:text-white"
                to={item.link}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="mt-6 bg-blue-700 text-white w-full py-3 rounded-lg hover:bg-blue-800 flex items-center justify-center"
          onClick={() => {
            toggleSidebar();
            handleLogout();
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Log Out
        </button>
      </div>
    </>
  );
};

export default AdminSidePanel;

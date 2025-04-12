import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faUserGraduate,
  faChalkboardTeacher,
  faGraduationCap,
  faFileLines,
  faClipboardCheck,
  faArchive,
  faSignOutAlt,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/logo.png";

const AdminSidePanel = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin-login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin-login");
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center transform transition-transform animate-slideUp">
            <p className="mb-4 text-lg font-semibold">Are you sure you want to log out?</p>
            <div className="flex justify-center space-x-4">
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg" onClick={handleLogout}>Yes</button>
              <button className="bg-gray-400 text-white px-4 py-2 rounded-lg" onClick={() => setShowLogoutModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen bg-white shadow-sm p-6 rounded-r-xl overflow-y-auto">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Admin Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">Admin Panel</h2>

        <ul className="space-y-4 flex-1">
          <li>
            <Link className="flex items-center px-5 py-3 text-md font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-dashboard">
              <FontAwesomeIcon icon={faGauge} className="mr-3 text-xl" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-sm font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-manage-students">
              <FontAwesomeIcon icon={faUserGraduate} className="mr-3 text-xl" />
              Manage Students
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-sm font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-manage-faculty">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-3 text-xl" />
              Manage Faculty
            </Link>
          </li>
          <li>
            <div className="cursor-pointer flex items-center px-5 py-3 text-md font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FontAwesomeIcon icon={faGraduationCap} className="mr-3 text-xl" />
              Manage Classes
              <FontAwesomeIcon icon={faChevronDown} className={`ml-auto transform transition-transform ${isDropdownOpen ? "rotate-180" : "rotate-0"}`} />
            </div>
            <ul className={`pl-10 transition-all duration-300 overflow-hidden ${isDropdownOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
              <li>
                <Link className="block py-2 text-gray-700 hover:text-blue-700 font-bold" to="/admin-adivsory-classes">Advisory Class List</Link>
              </li>
              <li>
                <Link className="block py-2 text-gray-700 hover:text-blue-700 font-bold" to="/admin-manage-subject">Subject Class List</Link>
              </li>
              <li>
                <Link className="block py-2 text-gray-700 hover:text-blue-700 font-bold" 
                to="/admin-assign-subject">Assign Subject</Link>
              </li>
            </ul>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-md font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-manage-grades">
              <FontAwesomeIcon icon={faFileLines} className="mr-3 text-xl" />
              Manage Grades
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-md font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-validation-request">
              <FontAwesomeIcon icon={faClipboardCheck} className="mr-3 text-xl" />
              Validation Requests
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-md font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-archive-records">
              <FontAwesomeIcon icon={faArchive} className="mr-3 text-xl" />
              Archived Records
            </Link>
          </li>
        </ul>

        <button className="mt-6 bg-blue-700 text-white w-full py-3 rounded-lg hover:bg-blue-800 flex items-center justify-center" onClick={() => setShowLogoutModal(true)}>
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Log Out
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 bg-white shadow-lg overflow-y-auto transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:hidden w-64 h-screen p-6`}>
        <button className="absolute top-4 right-4 text-gray-700" onClick={toggleSidebar}>✖</button>
        <ul className="space-y-4 flex-1">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Admin Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">Admin Panel</h2>

        <ul className="space-y-4 flex-1">
          <li>
            <Link className="flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-dashboard">
              <FontAwesomeIcon icon={faGauge} className="mr-3 text-xl" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-manage-students">
              <FontAwesomeIcon icon={faUserGraduate} className="mr-3 text-xl" />
              Manage Students
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-manage-faculty">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-3 text-xl" />
              Manage Faculty
            </Link>
          </li>
          <li>
            <div className="cursor-pointer flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FontAwesomeIcon icon={faGraduationCap} className="mr-3 text-xl" />
              Manage Classes
              <FontAwesomeIcon icon={faChevronDown} className={`ml-auto transform transition-transform ${isDropdownOpen ? "rotate-180" : "rotate-0"}`} />
            </div>
            <ul className={`pl-10 transition-all duration-300 overflow-hidden ${isDropdownOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
              <li>
                <Link className="block py-2 text-gray-700 hover:text-blue-700 font-bold" to="/admin-adivsory-classes">Advisory Class List</Link>
              </li>
              <li>
                <Link className="block py-2 text-gray-700 hover:text-blue-700 font-bold" to="/admin-manage-subject">Subject Class List</Link>
              </li>
              <li>
                <Link className="block py-2 text-gray-700 hover:text-blue-700 font-bold" to="/admin-manage-subject">Assign Subject</Link>
              </li>
            </ul>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-manage-grades">
              <FontAwesomeIcon icon={faFileLines} className="mr-3 text-xl" />
              Manage Grades
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-validation-request">
              <FontAwesomeIcon icon={faClipboardCheck} className="mr-3 text-xl" />
              Validation Requests
            </Link>
          </li>
          <li>
            <Link className="flex items-center px-5 py-3 text-lg font-medium rounded-lg transition-all duration-300 text-gray-700 hover:bg-blue-700 hover:text-white" to="/admin-archive-records">
              <FontAwesomeIcon icon={faArchive} className="mr-3 text-xl" />
              Archived Records
            </Link>
          </li>
        </ul>

        <button className="mt-6 bg-blue-700 text-white w-full py-3 rounded-lg hover:bg-blue-800 flex items-center justify-center" onClick={() => setShowLogoutModal(true)}>
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Log Out
        </button>
        </ul>
      <div className="flex-1 p-6">
        <Outlet />
      </div>
      </div>
    </>
  );
};

export default AdminSidePanel;

import React, { useState } from "react";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel.jsx";
import ClassAdvisoryTable from "../components/ClassAdvisoryTable.jsx";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { useEffect } from "react";

const ClassAdvisory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const Navigate = useNavigate();  //  Consistent with your sample

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/faculty-class-advisory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Navigate("/faculty-login");   //  Same logic as your admin sample
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
    <div
      className={`fixed inset-y-0 left-0 w-64 transition-transform duration-300 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 sm:static z-50`}
    >
      <FacultySidePanel 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
    </div>
    
    {/* Overlay Background when Sidebar is open */}
    {isSidebarOpen && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsSidebarOpen(false)}  // Close sidebar when overlay is clicked
      ></div>
    )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Navbar with Sidebar Toggle on Small Screens */}
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Class Advisory Table */}
        <div className="p-8">
          <ClassAdvisoryTable />
        </div>
      </div>
    </div>
  );
};

export default ClassAdvisory;

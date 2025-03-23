import React, { useState } from "react";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel";
import StatCard from "../components/StatCard.jsx"

const grades = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Hidden on small screens */}
      <div className={`fixed inset-y-0 left-0 w-64 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:static`}>
        <FacultySidePanel />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar with Sidebar Toggle on Small Screens */}
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

       
      </div>
    </div>
  );
};

export default grades;

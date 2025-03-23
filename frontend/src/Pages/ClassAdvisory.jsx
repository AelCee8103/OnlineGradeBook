import React, { useState } from "react";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel.jsx";
import ClassAdvisoryTable from "../components/ClassAdvisoryTable.jsx";

const ClassAdvisory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const studentData = [
    { name: 'Juan Dela Cruz', grade: '10', section: 'A' },
    { name: 'Maria Clara', grade: '10', section: 'B' },
    { name: 'Jose Rizal', grade: '10', section: 'A' },
    { name: 'Andres Bonifacio', grade: '10', section: 'B' },
    { name: 'Emilio Aguinaldo', grade: '10', section: 'C' },
    { name: 'Apolinario Mabini', grade: '10', section: 'C' },
    { name: 'Melchora Aquino', grade: '10', section: 'A' },
    { name: 'Gabriela Silang', grade: '10', section: 'B' },
    { name: 'Antonio Luna', grade: '10', section: 'A' },
    { name: 'Marcela Agoncillo', grade: '10', section: 'C' }
  ];

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

export default ClassAdvisory;

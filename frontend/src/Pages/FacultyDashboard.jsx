import React, { useEffect, useState } from "react";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel";
import StatCard from "../components/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FacultyDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const Navigate = useNavigate();  //  Consistent with your sample

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/faculty-dashboard", {
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

   useEffect(() => {
      Navigate("/faculty-dashboard", { replace: true });
      window.history.pushState(null, "", window.location.href);
      const preventGoBack = () => {
        window.history.pushState(null, "", window.location.href);
      };
      window.addEventListener("popstate", preventGoBack);
  
      return () => window.removeEventListener("popstate", preventGoBack);
    }, [Navigate]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <FacultySidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Overview</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-lg">School Year:</span>
              <select className="border rounded-lg px-3 py-1 text-lg">
                <option>2024-2025</option>
              </select>
              <button
                className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Students" value="120" subtitle="Total No. of Students" />
            <StatCard title="Subject Classes" value="4" subtitle="Total No. of Classes" />
            <StatCard title="Unfinished Grades" value="80" subtitle="Unvalidated Grades" textColor="text-yellow-500" />
            <StatCard title="Finished Grades" value="20" subtitle="Validated Grades" textColor="text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

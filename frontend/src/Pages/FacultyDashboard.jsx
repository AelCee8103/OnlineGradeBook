import React, { useEffect, useState } from "react";
import NavbarFaculty from "../Components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import StatCard from "../Components/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FacultyDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/faculty-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Authentication failed", error);
      alert("Session expired. Redirecting to login...");
      navigate("/faculty-login");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    navigate("/faculty-dashboard", { replace: true });
    window.history.pushState(null, "", window.location.href);
    const preventGoBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", preventGoBack);

    return () => window.removeEventListener("popstate", preventGoBack);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <FacultySidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-6 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
            <div className="flex items-center gap-3">
              <label className="text-gray-600 text-lg">School Year:</label>
              <select className="border border-gray-300 rounded-xl px-4 py-2 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option>2024-2025</option>
              </select>
              <button
                className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow transition duration-300"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Students" value="120" subtitle="Total No. of Students" />
            <StatCard title="Subject Classes" value="4" subtitle="Total No. of Classes" />
            <StatCard
              title="Unfinished Grades"
              value="80"
              subtitle="Unvalidated Grades"
              textColor="text-yellow-500"
            />
            <StatCard
              title="Finished Grades"
              value="20"
              subtitle="Validated Grades"
              textColor="text-green-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

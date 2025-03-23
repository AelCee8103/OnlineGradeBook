import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import StatCard from "../Admin/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const Navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/Admin-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Navigate("/admin-login");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    Navigate("/admin-dashboard", { replace: true });
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
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-6">
          {/* Overview Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Overview</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-lg">School Year:</span>
              <select className="border rounded-lg px-3 py-1 text-lg">
                <option>2024-2025</option>
              </select>
              <button
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-500"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Statistics Grid - Matches the Screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Students" value="282" />
            <StatCard title="Advisories" value="12" />
            <StatCard title="Faculty" value="18" />
            <StatCard title="Subject Classes" value="36" />
            <StatCard title="Unfinished Grades" value="100" subtitle="Unvalidated Grades" textColor="text-yellow-500" />
            <StatCard title="Finished Grades" value="182" subtitle="Validated Grades" textColor="text-green-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

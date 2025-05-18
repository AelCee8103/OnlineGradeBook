import React, { useEffect, useState } from "react";
import NavbarFaculty from "../Components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import StatCard from "../Components/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FacultyDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    students: 0,
    subjectClasses: 0,
    unfinishedGrades: 0,
    finishedGrades: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentSchoolYear, setCurrentSchoolYear] = useState("");

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/auth/faculty-dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Authentication failed", error);
      alert("Session expired. Redirecting to login...");
      navigate("/faculty-login");
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Get current school year
      try {
        const yearResponse = await axios.get("http://localhost:3000/Pages/schoolyear", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (yearResponse.data && Array.isArray(yearResponse.data)) {
          const activeYear = yearResponse.data.find((year) => year.status === 1);
          if (activeYear) {
            setCurrentSchoolYear(activeYear.year);
          }
        } else {
          console.warn("Unexpected response format from schoolyear endpoint:", yearResponse.data);
        }
      } catch (yearError) {
        console.error("Error fetching school year:", yearError);
        // Continue execution to fetch other statistics
      }

      // Get faculty statistics from the new endpoint
      const statsResponse = await axios.get(
        "http://localhost:3000/Pages/faculty/statistics",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (statsResponse.data.success) {
        setStats(statsResponse.data.statistics);
      }

    } catch (error) {
      console.error("Error fetching statistics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchStatistics();
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
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

        <div className="p-6 md:p-8 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
              Faculty Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <label className="text-gray-600 text-lg">School Year:</label>
              <select
                className="border border-gray-300 rounded-xl px-4 py-2 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={true}
              >
                <option>{currentSchoolYear || "Loading..."}</option>
              </select>
              <button
                className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow transition duration-300 flex items-center"
                onClick={() => {
                  fetchUser();
                  fetchStatistics();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Students"
              value={loading ? "..." : (stats.students || "0").toString()}
              subtitle="Total No. of Students"
              icon="students"
            />
            <StatCard
              title="Subject Classes"
              value={loading ? "..." : (stats.subjectClasses || "0").toString()}
              subtitle="Total No. of Classes"
              icon="classes"
            />
            <StatCard
              title="Unfinished Grades"
              value={loading ? "..." : (stats.unfinishedGrades || "0").toString()}
              subtitle="Unvalidated Grades"
              textColor="text-yellow-500"
              icon="pending"
            />
            <StatCard
              title="Finished Grades"
              value={loading ? "..." : (stats.finishedGrades || "0").toString()}
              subtitle="Validated Grades"
              textColor="text-green-600"
              icon="validated"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

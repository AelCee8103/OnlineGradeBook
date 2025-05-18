import React, { useEffect, useState } from "react";
import NavbarFaculty from "../Components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import StatCard from "../Components/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [facultyInfo, setFacultyInfo] = useState(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/auth/faculty-dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data && response.data.faculty) {
        setFacultyInfo(response.data.faculty);
      }
    } catch (error) {
      console.error("Authentication failed", error);
      toast.error("Session expired. Please log in again.");
      navigate("/faculty-login");
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No auth token found");
        toast.error("Authentication error. Please log in again.");
        navigate("/faculty-login");
        return;
      }

      // Get current school year
      let currentYear = "Unknown";
      try {
        const yearResponse = await axios.get("http://localhost:3000/Pages/schoolyear", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (yearResponse.data && Array.isArray(yearResponse.data)) {
          const activeYear = yearResponse.data.find((year) => year.status === 1);
          if (activeYear) {
            setCurrentSchoolYear(activeYear.year);
            currentYear = activeYear.year;
          }
        }
      } catch (yearError) {
        console.error("Error fetching school year:", yearError);
      }

      // Get faculty statistics with better error handling
      console.log("Fetching faculty statistics...");
      try {
        const facultyID = localStorage.getItem("facultyID");
        
        // Log details to help with debugging
        console.log("Using token:", token.substring(0, 15) + "...");
        console.log("Faculty ID from localStorage:", facultyID);
        
        const statsResponse = await axios.get(
          "http://localhost:3000/Pages/faculty/statistics",
          {
            headers: { 
              Authorization: `Bearer ${token}` 
            },
          }
        );

        if (statsResponse.data.success && statsResponse.data.statistics) {
          console.log("Received statistics:", statsResponse.data.statistics);
          setStats(statsResponse.data.statistics);
        } else {
          console.warn("Unexpected statistics response format:", statsResponse.data);
          toast.warning("Statistics may be incomplete");
          
          // Set default values even if response format is unexpected
          setStats({
            students: statsResponse.data.statistics?.students || 0,
            subjectClasses: statsResponse.data.statistics?.subjectClasses || 0,
            unfinishedGrades: statsResponse.data.statistics?.unfinishedGrades || 0,
            finishedGrades: statsResponse.data.statistics?.finishedGrades || 0,
          });
        }
      } catch (statsError) {
        console.error("Error fetching faculty statistics:", statsError);
        
        if (statsError.response) {
          console.error("Server responded with:", statsError.response.data);
          console.error("Status code:", statsError.response.status);
        } else if (statsError.request) {
          console.error("No response received");
        }
        
        toast.error("Failed to load statistics data");
        
        // Set default stats in case of error
        setStats({
          students: 0,
          subjectClasses: 0,
          unfinishedGrades: 0,
          finishedGrades: 0
        });
      }
    } catch (error) {
      console.error("Error in overall statistics fetch:", error);
      toast.error("Failed to load dashboard statistics");
      
      // Set fallback data for UI
      setStats({
        students: 0,
        subjectClasses: 0,
        unfinishedGrades: 0,
        finishedGrades: 0
      });
      setCurrentSchoolYear("Unknown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchStatistics();
  }, []);

  useEffect(() => {
    // Handle browser back button
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

        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl shadow-lg text-white p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  Welcome, {facultyInfo ? `${facultyInfo.FirstName} ${facultyInfo.LastName}` : 'Faculty'}!
                </h1>
                <p className="mt-1 sm:mt-2 opacity-90 text-sm sm:text-base">
                  Here's your teaching overview for the current school year
                </p>
                <div className="flex items-center mt-2 sm:mt-3">
                  <span className="text-green-200 text-sm sm:text-base">School Year:</span>
                  <span className="ml-2 bg-white/20 rounded-xl px-3 py-1 text-sm sm:text-base font-semibold">
                    {currentSchoolYear || "Loading..."}
                  </span>
                </div>
              </div>
              
              <button
                className="bg-white text-green-700 px-4 py-2 rounded-xl shadow transition duration-300 flex items-center gap-2 text-sm sm:text-base hover:bg-green-50 self-start sm:self-auto"
                onClick={() => {
                  fetchUser();
                  fetchStatistics();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4 px-1">Academic Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
    </div>
  );
};

export default FacultyDashboard;

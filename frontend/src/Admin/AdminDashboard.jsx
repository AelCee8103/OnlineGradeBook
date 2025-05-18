import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserGraduate, 
  faChalkboardTeacher, 
  faUserTie, 
  faBookOpen, 
  faFileAlt, 
  faCheck,
  faPlusCircle,
  faChartLine,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newSchoolYear, setSchoolYear] = useState({
    schoolyearID: "",
    year: "",
  });
  const [stats, setStats] = useState({
    students: 0,
    advisories: 0,
    faculty: 0,
    subjectClasses: 0,
    unfinishedGrades: 0,
    finishedGrades: 0,
    currentYear: "Loading..."
  });
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  
  const navigate = useNavigate();

  // Fetch user auth
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        navigate("/admin-login");
        return;
      }
      
      console.log("Checking admin authentication...");
      await axios.get("http://localhost:3000/auth/Admin-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Admin authentication successful");
    } catch (error) {
      console.error("Error fetching data:", error);
      // Only redirect if unauthorized
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        toast.error("Authentication failed. Please login again.");
        navigate("/admin-login");
      }
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Debugging log
      console.log("Fetching dashboard stats...");
      
      // Using the endpoint for statistics - removed authenticateToken middleware
      const response = await axios.get("http://localhost:3000/Pages/admin/dashboard-stats");
      
      console.log("Dashboard statistics response:", response.data);
      
      // Set the statistics
      setStats({
        students: response.data.students || 0,
        faculty: response.data.faculty || 0,
        advisories: response.data.advisories || 0,
        subjectClasses: response.data.subjectClasses || 0,
        unfinishedGrades: response.data.unfinishedGrades || 0, 
        finishedGrades: response.data.finishedGrades || 0,
        currentYear: response.data.currentYear || "Unknown"
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      
      // Show error notification
      toast.error("Failed to load dashboard statistics");
      
      // Set default values in case of error
      setStats({
        students: 0,
        faculty: 0,
        advisories: 0,
        subjectClasses: 0,
        unfinishedGrades: 0,
        finishedGrades: 0,
        currentYear: "Error loading"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch school years
  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get("http://localhost:3000/Pages/schoolyear");
      setYears(response.data);
      // Set selected year to active one
      const activeYear = response.data.find(y => y.status === 1);
      if (activeYear) {
        setSelectedYear(activeYear.year);
      }
    } catch (error) {
      console.error("Error fetching school years:", error);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchDashboardStats();
    fetchSchoolYears();
  }, []);

  const handleCreateSchoolYear = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post("http://localhost:3000/Pages/admin-dashboard", {
        SchoolYear: newSchoolYear.schoolyearID,
        year: newSchoolYear.year
      });
  
      if (response.data.exists) {
        toast.error("School Year already exists.");
      } else if (response.data.success) {
        // Reset fields
        setSchoolYear({ schoolyearID: "", year: "" });
  
        // Close modal safely
        const modal = document.getElementById("my_modal_5");
        if (modal) modal.close();
  
        // Refresh data
        fetchSchoolYears();
        fetchDashboardStats();
          
        toast.success("School Year created successfully!");
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      toast.error("Failed to add school year.");
    }
  };
  
  const handleChanges = (e) => {
    setSchoolYear({
       ...newSchoolYear, [e.target.name]: e.target.value
    });
  };

  // Enhanced responsive stat card
  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider truncate">{title}</p>
            <p className={`text-2xl sm:text-3xl font-bold mt-1 ${color}`}>{loading ? "..." : value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
          </div>
          <div className={`p-2 sm:p-3 rounded-full ${color.replace('text', 'bg')}/10 ml-3 flex-shrink-0`}>
            <FontAwesomeIcon icon={icon} className={`text-xl sm:text-2xl ${color}`} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Sidebar */}
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
          {/* Dashboard Header with Current Year */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md p-4 md:p-6 mb-4 sm:mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-white" />
                  Dashboard Overview
                </h1>
                <div className="flex items-center mt-1 sm:mt-2 text-sm sm:text-base text-blue-100">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  <span>Current School Year: <span className="font-semibold text-white">{stats.currentYear}</span></span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select 
                    className="select select-sm md:select-md bg-blue-700 text-white border-blue-500 text-sm w-full"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map(year => (
                      <option key={year.school_yearID} value={year.year}>
                        {year.year}{year.status === 1 ? " (Active)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="btn btn-sm md:btn-md bg-white text-blue-700 hover:bg-blue-50 text-xs md:text-sm w-full sm:w-auto"
                  onClick={() => document.getElementById('my_modal_5').showModal()}
                >
                  <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
                  Add School Year
                </button>
              </div>
            </div>
          </div>

          {/* Section Labels */}
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700 px-1">School Statistics</h2>

          {/* Statistics Grid - First Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            <StatCard 
              title="Students" 
              value={stats.students} 
              icon={faUserGraduate} 
              color="text-blue-600" 
            />
            <StatCard 
              title="Advisories" 
              value={stats.advisories} 
              icon={faChalkboardTeacher} 
              color="text-indigo-600" 
            />
            <StatCard 
              title="Faculty" 
              value={stats.faculty} 
              icon={faUserTie} 
              color="text-purple-600" 
            />
            <StatCard 
              title="Subject Classes" 
              value={stats.subjectClasses} 
              icon={faBookOpen} 
              color="text-teal-600" 
            />
          </div>

          {/* Section Labels */}
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700 px-1">Grading Status</h2>

          {/* Grades Statistics - Second Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            <StatCard 
              title="Unfinished Grades" 
              value={stats.unfinishedGrades} 
              icon={faFileAlt} 
              color="text-amber-600" 
              subtitle="Pending Validation Requests" 
            />
            <StatCard 
              title="Finished Grades" 
              value={stats.finishedGrades} 
              icon={faCheck} 
              color="text-emerald-600" 
              subtitle="Validated Grade Records" 
            />
          </div>

        

          {/* Modal for adding school year */}
          <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box max-w-md mx-auto">
              <h3 className="font-bold text-lg mb-4 sm:mb-6">Add School Year</h3>
              
              <form onSubmit={handleCreateSchoolYear} method="dialog" className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">School Year ID</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter School Year ID" 
                      className="input input-bordered w-full" 
                      onChange={handleChanges}
                      name="schoolyearID"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">School Year</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter School Year (e.g. 2024-2025)" 
                      className="input input-bordered w-full" 
                      onChange={handleChanges}
                      name="year"
                      required
                    />
                  </div>
                </div>
                
                <div className="modal-action mt-3 sm:mt-4">
                  <div className="flex gap-2 justify-end w-full">
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('my_modal_5').close()}
                      className="btn btn-outline btn-sm md:btn-md"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn bg-blue-700 hover:bg-blue-800 text-white btn-sm md:btn-md">Create</button>
                  </div>
                </div>
              </form>
            </div>
          </dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from "react";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Classes = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch assigned subjects for faculty
  const fetchAssignedSubjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/faculty-login");
        return;
      }

      const response = await axios.get("http://localhost:3000/auth/admin-assign-subject", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Validate response data structure
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data format received from server");
      }

      // Safely set the subjects data
      setAssignedSubjects(response.data || []);
    } catch (error) {
      console.error("Error fetching assigned subjects:", error);
      setError(error.response?.data?.message || error.message || "Failed to load subjects");
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/faculty-login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedSubjects();
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
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Classes</h1>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}

          {/* Assigned Subjects Table */}
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto mb-6">
            <h2 className="text-xl font-bold mb-4">Assigned Subjects</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2">Loading subjects...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    
                    <th className="px-4 py-2 text-gray-600">Subject Code</th>
                    <th className="px-4 py-2 text-gray-600">Subject ID</th>
                    <th className="px-4 py-2 text-gray-600">Faculty ID</th>
                    <th className="px-4 py-2 text-gray-600">Class ID</th>
                    <th className="px-4 py-2 text-gray-600">Year ID</th>
                    <th className="px-4 py-2 text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedSubjects.length > 0 ? (
                    assignedSubjects.map((subject, index) => {
                      // Safely access subject properties with fallbacks
                      const SubjectCode = subject?.SubjectCode || "N/A";
                      const subjectID = subject?.subjectID || "N/A";
                      const FacultyID = subject?.FacultyID || "N/A";
                      const ClassID= subject?.ClassID || "N/A";
                      const yearID= subject?.yearID || "N/A";

                      return (
                        <tr key={index} className="border-b">
                         
                          <td className="px-4 py-2">{SubjectCode}</td>
                          <td className="px-4 py-2">{subjectID}</td>
                          <td className="px-4 py-2">{FacultyID}</td>
                          <td className="px-4 py-2">{ClassID}</td>
                          <td className="px-4 py-2">{yearID}</td>
                          <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 m-2 ml-3 text-sm">
                                   View
                          </button>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        {error ? "Error loading subjects" : "No assigned subjects found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;
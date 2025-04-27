import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import axios from "axios";

const Classes = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAssignedSubjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/faculty-login");
        return;
      }

      const response = await axios.get(
        "http://localhost:3000/auth/faculty-assign-subjects",
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch subjects");
      }

      setAssignedSubjects(response.data.data || []);
      
      if (response.data.data.length === 0) {
        setError("No subjects assigned to you for the current school year");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      
      let errorMessage = "Failed to load subjects";
      if (err.response) {
        errorMessage = err.response.data.message || 
                     err.response.data.error || 
                     errorMessage;
        
        if (err.response.status === 400) {
          if (err.response.data.message === "No active school year found") {
            errorMessage = "System error: No active school year configured";
          }
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (err.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      }
      
      setError(errorMessage);
      
      if (err.response?.status === 401) {
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
      <div className={`fixed inset-y-0 left-0 w-64 transition-transform duration-300 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 sm:static z-50`}>
        <FacultySidePanel 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex-1 overflow-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Classes</h1>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p>{error}</p>
              {error.includes("No subjects assigned") && (
                <button 
                  onClick={() => navigate('/faculty-dashboard')}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Assigned Subjects</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3">Loading subjects...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faculty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade & Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignedSubjects.length > 0 ? (
                      assignedSubjects.map((subject, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.subjectCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.subjectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.facultyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.grade} - {subject.section}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.schoolYear}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => navigate(`/faculty-view-students/${subject.subjectCode}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          No subjects found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;
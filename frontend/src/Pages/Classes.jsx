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
    const facultyId = localStorage.getItem("facultyId");
    
    // Debugging logs
    console.log("Token exists:", !!token);
    console.log("FacultyID:", facultyId);
    
    if (!token) {
      navigate("/faculty-login");
      return;
    }

    if (!facultyId) {
      throw new Error("Faculty ID not found in local storage");
    }

    const response = await axios.get(`http://localhost:3000/faculty-assigned-subjects`, {
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      params: { 
        facultyId: facultyId 
      }
    });

    console.log("API Response:", response.data); // Debugging

    if (!Array.isArray(response.data)) {
      throw new Error("Expected array but got: " + typeof response.data);
    }

    setAssignedSubjects(response.data);
  } catch (error) {
    console.error("API Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    setError(error.response?.data?.error || 
            error.message || 
            "Failed to load subjects");
    
    if (error.response?.status === 401) {
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
                  <th className="px-4 py-2 text-gray-600">Subject Name</th>
                  <th className="px-4 py-2 text-gray-600">Faculty</th>
                  <th className="px-4 py-2 text-gray-600">Grade & Section</th>
                  <th className="px-4 py-2 text-gray-600">School Year</th>
                  <th className="px-4 py-2 text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                {assignedSubjects.length > 0 ? (
                  assignedSubjects.map((subject, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{subject.subjectCode}</td>
                      <td className="px-4 py-2">{subject.subjectName}</td>
                      <td className="px-4 py-2">{subject.facultyName}</td>
                      <td className="px-4 py-2">{subject.grade} - {subject.section}</td>
                      <td className="px-4 py-2">{subject.schoolYear}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No assigned subjects found.
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
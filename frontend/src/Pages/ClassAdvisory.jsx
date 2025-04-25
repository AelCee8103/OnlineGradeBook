import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel.jsx";
import axios from "axios";
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ClassAdvisory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisoryData, setAdvisoryData] = useState({
    grade: "",
    section: "",
    advisorName: "Not Assigned"
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const studentsPerPage = 5;
  const navigate = useNavigate();

  // Fetch advisory class data
  const fetchAdvisoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/faculty-login");
        return;
      }
  
      const response = await axios.get(
        "http://localhost:3000/auth/faculty-class-advisory", 
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );
  
      const responseData = response.data;
      
      if (responseData.message === "No advisory class assigned") {
        setAdvisoryData({
          grade: "",
          section: "",
          advisorName: responseData.advisorName || "Not Assigned"
        });
        setStudents([]);
        setError("No advisory class assigned to you");
        return;
      }
      
      if (!responseData.grade || !responseData.section) {
        throw new Error("Incomplete advisory data received");
      }
  
      setAdvisoryData({
        grade: responseData.grade,
        section: responseData.section,
        advisorName: responseData.advisorName
      });
  
      setStudents(responseData.students || []);
      
    } catch (err) {
      console.error("Fetch error:", err);
      
      let errorMessage = "Failed to load advisory data";
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data.message || 
                      err.response.data.error || 
                      errorMessage;
      } else if (err.request) {
        // Request was made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else if (err.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      }
      
      setError(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        navigate("/faculty-login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisoryData();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.StudentID.toString().includes(searchTerm) ||
    student.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.FirstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatStudentName = (lastName, firstName, middleName) => {
    return `${lastName}, ${firstName}${middleName ? ` ${middleName.charAt(0)}.` : ''}`;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4">Loading advisory class...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500">
        <p className="text-lg mb-4">{error}</p>
        <button 
          onClick={error === "No advisory class assigned to you" ? 
            () => navigate('/faculty-dashboard') : fetchAdvisoryData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          {error === "No advisory class assigned to you" ? "Back to Dashboard" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <FacultySidePanel 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Class Advisory</h1>
          
          {/* Advisory Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Grade</p>
                <p className="text-lg font-semibold">{advisoryData.grade || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Section</p>
                <p className="text-lg font-semibold">{advisoryData.section || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Class Advisor</p>
                <p className="text-lg font-semibold">{advisoryData.advisorName}</p>
              </div>
            </div>
          </div>
    
          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="flex items-center p-4">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search by ID or name" 
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <button className="ml-4 bg-green-700 px-4 py-2 rounded text-white hover:bg-green-800 transition">
                Validate
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16 px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      No.
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Student Number
                    </th>
                    <th className="w-48 px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudents.length > 0 ? (
                    currentStudents.map((student, index) => (
                      <tr key={student.StudentID} className="hover:bg-gray-50">
                        <td className="w-16 px-4 py-4 text-center text-sm text-gray-900">
                          {index + 1 + (currentPage - 1) * studentsPerPage}
                        </td>
                        <td className="px-6 py-4 text-left text-sm text-gray-900">
                          {formatStudentName(student.LastName, student.FirstName, student.MiddleName)}
                        </td>
                        <td className="px-6 py-2 text-left text-sm text-gray-900">
                          {student.StudentID}
                        </td>
                        <td className="w-48 px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button 
                              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md flex items-center justify-center transition-colors"
                              onClick={() => navigate(`/student-profile/${student.StudentID}`)}
                            >
                              View  
                            </button>
                            <button 
                              className="text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md flex items-center justify-center transition-colors"
                              onClick={() => navigate(`/student-grades/${student.StudentID}`)}
                            >
                              Grades
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? "No matching students found" : "No students found in this advisory class"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAdvisory;
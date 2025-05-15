import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel.jsx";
import axios from "axios";
import { FiEye, FiBook } from "react-icons/fi"; // Added missing import
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ViewSubject = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisoryData, setAdvisoryData] = useState({
    Section: "",
    Grade: "",
    AdvisorName: "Not Assigned"
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;
  const navigate = useNavigate();

  // Fetch advisory class data
  const fetchAdvisoryData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/faculty-login");
        return;
      }
  
      const response = await axios.get(
        "http://localhost:3000/auth/faculty-class-advisory", 
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Debug the actual response structure
      console.log("API Response:", response.data);
  
      // Handle both possible response structures
      const responseData = response.data;
      
      setAdvisoryData({
        Section: responseData.section || responseData.Section || "Not Assigned",
        Grade: responseData.grade || responseData.Grade || "",
        AdvisorName: responseData.advisorName || responseData.AdvisorName || "Not Assigned"
      });
  
      // Ensure students is always an array
      const receivedStudents = responseData.students || [];
      console.log("Received students:", receivedStudents);
      setStudents(receivedStudents);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Failed to load advisory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisoryData();
    console.log("Current advisoryData:", advisoryData);
    console.log("Current students:", students);

    
  }, [advisoryData, students]);

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatStudentName = (lastName, firstName, middleName) => {
    return `${lastName}, ${firstName}${middleName ? ` ${middleName.charAt(0)}.` : ''}`;
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
              <p className="text-lg font-semibold">{advisoryData.Grade || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Section</p>
              <p className="text-lg font-semibold">{advisoryData.Section || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Class Advisor</p>
              <p className="text-lg font-semibold">{advisoryData.AdvisorName}</p>
            </div>
          </div>
        </div>
  
        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">

        <input type="text" placeholder="Search by ID number"  className="mb-4 border border-gray-300 rounded-md ml-4 mt-4 px-4 py-2"/>
           <FontAwesomeIcon icon={faMagnifyingGlass}  className="ml-3"/>
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
                          <button className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md flex items-center justify-center transition-colors">
                            View  
                          </button>
                          <button className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md flex items-center justify-center transition-colors">
                             Grades
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? "Loading..." : "No students found in this advisory class"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {students.length > 0 && (
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

export default ViewSubject;
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";

const ViewStudents = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/faculty-login");
          return;
        }

        const response = await axios.get(
          `http://localhost:3000/Pages/faculty-subject-classes/${subjectCode}/students`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setStudents(response.data.students || []);
        } else {
          throw new Error(response.data.message || "Failed to load students");
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        if (error.response?.status === 403) {
          alert(`Access denied: ${error.response.data.message}`);
          navigate("/faculty-classes");
        } else if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/faculty-login");
        } else {
          alert("Failed to load students. Please try again.");
        }
      }
    };

    fetchStudents();
  }, [subjectCode]);

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.StudentID.toString().includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
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
  
    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-auto">
      <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
  
      <main className="p-6 w-full max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-md"
        >
          ← Back
        </button>
  
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Student List</h1>
  
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name or student ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-300 focus:outline-none"
          />
        </div>
  
        {/* Table */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Student Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Student ID</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.StudentID}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">{student.fullName}</td>
                    <td className="px-6 py-4">{student.StudentID}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">
                          View
                        </button>
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded">
                          Grades
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center text-gray-500 py-6">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
  
  
  );
};

export default ViewStudents;

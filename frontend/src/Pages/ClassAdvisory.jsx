// ClassAdvisory.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import axios from "axios";
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ClassAdvisory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisoryData, setAdvisoryData] = useState({ grade: "", section: "", advisorName: "Not Assigned" });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const studentsPerPage = 5;
  const navigate = useNavigate();

  const fetchAdvisoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/faculty-login");

      const { data } = await axios.get("http://localhost:3000/auth/faculty-class-advisory", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (data.message === "No advisory class assigned") {
        setAdvisoryData({ grade: "", section: "", advisorName: data.advisorName || "Not Assigned" });
        setStudents([]);
        setError("No advisory class assigned to you");
        return;
      }

      if (!data.grade || !data.section) throw new Error("Incomplete advisory data received");

      setAdvisoryData({ grade: data.grade, section: data.section, advisorName: data.advisorName });
      setStudents(data.students || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message.includes("timeout")
        ? "Request timed out. Please try again." : "Failed to load advisory data";

      setError(msg);
      if (err.response?.status === 401) navigate("/faculty-login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdvisoryData(); }, []);

  const filteredStudents = students.filter(student =>
    student.StudentID.toString().includes(searchTerm) ||
    student.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.FirstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatName = (last, first, middle) =>
    `${last}, ${first}${middle ? ` ${middle.charAt(0)}.` : ""}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-600">Loading advisory class...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p className="mb-4 text-lg">{error}</p>
        <button
          onClick={error === "No advisory class assigned to you" ? () => navigate("/faculty-dashboard") : fetchAdvisoryData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
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

        <main className="p-6 sm:p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Class Advisory</h1>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="text-lg font-semibold">{advisoryData.grade || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Section</p>
                <p className="text-lg font-semibold">{advisoryData.section || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Advisor</p>
                <p className="text-lg font-semibold">{advisoryData.advisorName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="relative w-full max-w-md">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID or name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button className="ml-4 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition">
                Validate
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-sm text-center font-semibold px-4 py-2">No.</th>
                    <th className="text-sm font-semibold text-left px-6 py-2">Student Name</th>
                    <th className="text-sm font-semibold text-left px-6 py-2">Student Number</th>
                    <th className="text-sm font-semibold text-center px-6 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentStudents.length ? (
                    currentStudents.map((student, idx) => (
                      <tr key={student.StudentID}>
                        <td className="text-center text-sm px-4 py-2">
                          {idx + 1 + (currentPage - 1) * studentsPerPage}
                        </td>
                        <td className="text-sm px-6 py-2">{formatName(student.LastName, student.FirstName, student.MiddleName)}</td>
                        <td className="text-sm px-6 py-2">{student.StudentID}</td>
                        <td className="px-6 py-2 flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/student-profile/${student.StudentID}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/student-grades/${student.StudentID}`)}
                            className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-1 rounded-md"
                          >
                            Grades
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center px-6 py-4 text-sm text-gray-500">
                        {searchTerm ? "No matching students found." : "No students in this advisory class."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-md border ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded-md border ${
                    currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClassAdvisory;

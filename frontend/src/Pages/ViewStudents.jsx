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
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const recordsPerPage = 5;

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
          setSubjectInfo(response.data.subjectInfo || null);
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

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.StudentID.toString().includes(searchTerm)
  );

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Apply pagination to filtered list
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStudents.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

        <main className="p-6 w-full mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-4 bg-gray-400 hover:bg-gray-500 text-white py-2 px-5 rounded-md"
          >
            ← Back
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Student List
            </h1>
            {subjectInfo && (
              <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {subjectInfo.SubjectName}
                </h2>
                <p className="text-gray-700">
                  Subject Code:{" "}
                  <span className="font-semibold">
                    {subjectInfo.SubjectCode}
                  </span>
                </p>
                <p className="text-gray-700">
                  Grade & Section:{" "}
                  <span className="font-semibold">
                    {subjectInfo.Grade} - {subjectInfo.Section}
                  </span>
                </p>
                <p className="text-gray-700">
                  Number of Students:{" "}
                  <span className="font-semibold">{students.length}</span>
                </p>
              </div>
            )}

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
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-1/3 px-6 py-3 text-left font-medium text-gray-700">
                    Student Name
                  </th>
                  <th className="w-1/3 px-6 py-3 text-left font-medium text-gray-700">
                    Student ID
                  </th>
                  <th className="w-1/3 px-6 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((student) => (
                    <tr
                      key={student.StudentID}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">{student.fullName}</td>
                      <td className="px-6 py-4">{student.StudentID}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">
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

            {/* Pagination */}
            {filteredStudents.length > recordsPerPage && (
              <div className="flex justify-between items-center px-6 py-3 border-t text-sm text-gray-700">
                {/* Previous Button - Left */}
                <div>
                  {currentPage > 1 && (
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      className="px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                </div>

                {/* Entry Info - Center */}
                <div>
                  Showing {indexOfFirstRecord + 1} to{" "}
                  {Math.min(indexOfLastRecord, filteredStudents.length)} of{" "}
                  {filteredStudents.length} entries
                </div>

                {/* Next Button - Right */}
                <div>
                  {currentPage < totalPages && (
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      className="px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewStudents;

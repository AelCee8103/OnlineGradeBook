import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarFaculty from "../components/NavbarFaculty"; // ✅ restore Navbar
import FacultySidePanel from "../Components/FacultySidePanel"; // ✅ restore Sidebar

const ViewStudents = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/faculty-login");
        return;
      }
      const response = await axios.get(
        `http://localhost:3000/faculty-subject-classes/${subjectCode}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
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

        <div className="p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Back
          </button>

          <h1 className="text-2xl font-bold mb-4">Students List</h1>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 mb-4 w-full rounded"
          />

          {/* Table */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-gray-700">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.StudentID}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">{student.fullName}</td>
                      <td className="px-6 py-4">{student.StudentID}</td>
                      <td className="px-6 py-4 flex space-x-2">
                        <button className="bg-green-500 text-white px-3 py-1 rounded">
                          View
                        </button>
                        <button className="bg-purple-500 text-white px-3 py-1 rounded">
                          Grades
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudents;

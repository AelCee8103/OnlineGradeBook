import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';


const ArchiveRecords = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [facultyPage, setFacultyPage] = useState(1);
  const studentsPerPage = 5;
  const facultyPerPage = 5;
  const navigate = useNavigate();

  // Fetch archived students and faculty
  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const token = localStorage.getItem("token");
        const [studentsRes, facultyRes] = await Promise.all([
          axios.get("http://localhost:3000/Pages/admin-archive-students", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/Pages/admin-archive-faculty", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setStudents(studentsRes.data.students || []);
        setFaculty(facultyRes.data.faculty || []);
      } catch (error) {
        console.error("Error fetching archived records:", error);
        navigate("/admin-login");
      }
    };
    fetchArchived();
  }, [navigate]);

  // Pagination logic for students
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalStudentPages = Math.ceil(students.length / studentsPerPage);

  // Pagination logic for faculty
  const indexOfLastFaculty = facultyPage * facultyPerPage;
  const indexOfFirstFaculty = indexOfLastFaculty - facultyPerPage;
  const currentFaculty = faculty.slice(indexOfFirstFaculty, indexOfLastFaculty);
  const totalFacultyPages = Math.ceil(faculty.length / facultyPerPage);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
     
         {/* Archived Students Table */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-auto">
            <h3 className="text-xl font-bold mb-4">Archived Students List</h3>
            <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="py-2 px-4">Student ID</th>
                    <th className="py-2 px-4">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((student) => (
                      <tr key={student.StudentID} className="border-b">
                        <td className="py-2 px-4">{student.StudentID}</td>
                        <td className="py-2 px-4">
                          {student.LastName}, {student.FirstName} {student.MiddleName}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 px-4" colSpan="2">No archived students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalStudentPages, p + 1))}
              disabled={currentPage === totalStudentPages}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Next
            </button>
          </div>
        </div>

        {/* Archived Faculty Table */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-auto">
          <h3 className="text-xl font-bold mb-4">Archived Faculty List</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="py-2 px-4">Faculty ID</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {currentFaculty.length > 0 ? (
                currentFaculty.map((f) => (
                  <tr key={f.FacultyID} className="border-b">
                    <td className="py-2 px-4">{f.FacultyID}</td>
                    <td className="py-2 px-4">
                      {f.LastName}, {f.FirstName} {f.MiddleName}
                    </td>
                    <td className="py-2 px-4">{f.Email}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-4" colSpan="3">No archived faculty found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setFacultyPage((p) => Math.max(1, p - 1))}
              disabled={facultyPage === 1}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Previous
            </button>
            <button
              onClick={() => setFacultyPage((p) => Math.min(totalFacultyPages, p + 1))}
              disabled={facultyPage === totalFacultyPages}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveRecords;

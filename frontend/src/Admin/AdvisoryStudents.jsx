import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";

const AdvisoryStudents = () => {
  const { advisoryID } = useParams();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [advisoryInfo, setAdvisoryInfo] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const studentRes = await axios.get(
          `http://localhost:3000/Pages/students-in-advisory/${advisoryID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStudents(studentRes.data);
        setFilteredStudents(studentRes.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const fetchAdvisoryInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:3000/Pages/admin-advisory-classes",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const found = res.data.find(
          (item) => item.advisoryID.toString() === advisoryID
        );
        if (found) {
          setAdvisoryInfo(found);
        }
      } catch (error) {
        console.error("Error fetching advisory info:", error);
      }
    };

    fetchStudents();
    fetchAdvisoryInfo();
  }, [advisoryID]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = students.filter((student) => {
      const fullName =
        `${student.FirstName} ${student.MiddleName} ${student.LastName}`.toLowerCase();
      return (
        student.StudentID.toString().includes(query) || fullName.includes(query)
      );
    });
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="p-8">
          <button
            className="mb-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold mb-4">
            Students in Advisory Class
          </h1>

          {advisoryInfo && (
            <div className="bg-white shadow rounded-lg p-4 mb-6 max-w-screen-lg mx-auto">
              <p>
                <strong>Grade:</strong> {advisoryInfo.grade}
              </p>
              <p>
                <strong>Section:</strong> {advisoryInfo.section}
              </p>
              <p>
                <strong>Class Advisor:</strong> {advisoryInfo.facultyName}
              </p>
              <p>
                <strong>School Year:</strong> {advisoryInfo.SchoolYear}
              </p>
              <p>
                <strong>Number of Students:</strong> {students.length}
              </p>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 border border-gray-300 rounded-md px-4 py-2 w-full"
            />

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-gray-600">No.</th>
                  <th className="px-4 py-2 text-gray-600">Student ID</th>
                  <th className="px-4 py-2 text-gray-600">Full Name</th>
                  <th className="px-4 py-2 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <tr key={student.StudentID} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{student.StudentID}</td>
                      <td className="px-4 py-2">
                        {student.FirstName} {student.MiddleName}{" "}
                        {student.LastName}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                          onClick={() =>
                            navigate(
                              `/admin/advisory/${advisoryID}/students/${student.StudentID}/grades`
                            )
                          }
                        >
                          View Grades
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No matching students found.
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

export default AdvisoryStudents;

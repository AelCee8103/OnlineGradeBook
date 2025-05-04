// FacultyAttendance.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import axios from "axios";
import { format } from "date-fns";

const ViewAttendance = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [currentDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchAttendanceData();
    fetchSubjectInfo();
  }, [subjectCode]);

  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/faculty-login");

      const date = format(new Date(), "yyyy-MM-dd");
      const response = await axios.get(
        `http://localhost:3000/auth/attendance/view/${subjectCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { date },
        }
      );

      if (response.data.success) {
        const formattedStudents = response.data.data.map((student) => ({
          ...student,
          StatusID: parseInt(student.StatusID) || 0, // Ensure StatusID is a number
        }));
        setStudents(formattedStudents);
      } else {
        setError(response.data.message || "Failed to fetch attendance data.");
      }
    } catch (err) {
      console.error("Attendance fetch error:", err.response?.data || err);
      setError(
        err.response?.data?.message || "Failed to load attendance data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjectInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `http://localhost:3000/auth/subject-info/${subjectCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSubjectInfo(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subject info:", err);
    }
  };

  const handleStatusChange = async (studentID, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/faculty-login");

      await axios.post(
        "http://localhost:3000/auth/attendance/update",
        { studentID, subjectCode, statusID: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.StudentID === studentID
            ? { ...student, StatusID: newStatus }
            : student
        )
      );
    } catch (err) {
      console.error("Failed to update attendance:", err);
      alert("Failed to update attendance. Please try again.");
    }
  };

  const getStatusButtonClass = (statusID) => {
    switch (statusID) {
      case 1:
        return "bg-green-500 hover:bg-green-600";
      case 2:
        return "bg-red-500 hover:bg-red-600";
      case 3:
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-300 hover:bg-gray-400";
    }
  };

  const getStatusText = (statusID) => {
    switch (statusID) {
      case 1:
        return "Present";
      case 2:
        return "Absent";
      case 3:
        return "Late";
      default:
        return "Not Marked";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <FacultySidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
            <div className="text-gray-600">{currentDate}</div>
          </div>

          {subjectInfo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {subjectInfo.SubjectName || "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {subjectInfo.Grade || "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Section</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {subjectInfo.Section || "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">
                  School Year
                </h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {subjectInfo.schoolYear || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* Rest of your attendance table code */}
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-600">Loading students...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center text-lg mt-10">
              {error}
            </div>
          ) : students.length === 0 ? (
            <div className="text-gray-500 text-center text-lg mt-10">
              No students found for this class.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Student ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.StudentID} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{student.StudentID}</td>
                      <td className="px-6 py-4">
                        {student.LastName}, {student.FirstName}{" "}
                        {student.MiddleName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            student.StatusID === 1
                              ? "bg-green-500"
                              : student.StatusID === 2
                              ? "bg-red-500"
                              : student.StatusID === 3
                              ? "bg-yellow-500"
                              : "bg-gray-300"
                          }`}
                        >
                          {getStatusText(student.StatusID)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() =>
                              handleStatusChange(student.StudentID, 1)
                            }
                            className={`px-3 py-1 rounded text-white ${getStatusButtonClass(
                              student.StatusID === 1 ? 1 : 0
                            )}`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(student.StudentID, 2)
                            }
                            className={`px-3 py-1 rounded text-white ${getStatusButtonClass(
                              student.StatusID === 2 ? 2 : 0
                            )}`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(student.StudentID, 3)
                            }
                            className={`px-3 py-1 rounded text-white ${getStatusButtonClass(
                              student.StatusID === 3 ? 3 : 0
                            )}`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ViewAttendance;

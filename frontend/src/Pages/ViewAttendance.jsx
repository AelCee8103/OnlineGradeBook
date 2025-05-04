// ViewStudents.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import { Dialog } from "@headlessui/react";
import { Fragment } from "react";

const ViewAttendance = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const recordsPerPage = 5;

 
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
          fetchAttendanceRecords(response.data.students);
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

    const fetchAttendanceRecords = async (studentList) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3000/pages/faculty-subject-attendance/${subjectCode}`,
          {
            params: { date: attendanceDate },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json", 
            },
          }
        );

        if (response.data.success) {
          setAttendanceRecords(response.data.attendance || []);
        } else {
          console.error("Failed to fetch attendance records:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching attendance records:", error);
      }
    };

    useEffect(() => {   
      fetchStudents();
  }, [subjectCode, attendanceDate]);

  const markAttendance = async (studentId, statusId) => {
    try {
      await fetchStudents();
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/faculty-login");
        return;
      }
      const numericSubjectCode = Number(subjectCode); 
      // Debug log
      console.log("Marking attendance with:", {
        subjectCode: numericSubjectCode,
        studentId,
        statusId
      });
  
       
      const response = await axios.post(
        "http://localhost:3000/Pages/faculty-mark-attendance",
        {
          SubjectCode: numericSubjectCode, // Use the cleaned numeric code
          StudentID: studentId,
          StatusID: statusId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      // Debug
      console.log("Attendance response:", response.data);
  
      if (response.data.success) {
        // Update UI state
        const updatedRecords = attendanceRecords.map(record => 
          record.studentId === studentId 
            ? { ...record, statusId, statusName: response.data.statusName }
            : record
        );
        setAttendanceRecords(updatedRecords);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Attendance error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
  
      let errorMessage = "Failed to mark attendance";
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "You don't have permission to mark attendance for this class";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
  
      alert(errorMessage);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/faculty-login");
      }
    }
  };

  const getStatusName = (statusId) => {
    switch(statusId) {
      case 1: return "Present";
      case 2: return "Absent";
      case 3: return "Late";
      default: return "Not Marked";
    }
  };

  const getStatusForStudent = (studentId) => {
    const record = attendanceRecords.find(r => r.studentId === studentId);
    return record ? record.statusId : null;
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.StudentID.toString().includes(searchTerm)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStudents.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
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

      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 w-full mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 bg-gray-400 hover:bg-gray-500 text-white py-2 px-5 rounded-md"
          >
            ← Back
          </button>

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
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Date:
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Search by name or student ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-1/4 px-6 py-3 text-left font-medium text-gray-700">
                    Student Name
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left font-medium text-gray-700">
                    Student ID
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((student) => {
                    const currentStatus = getStatusForStudent(student.StudentID);
                    return (
                      <tr
                        key={student.StudentID}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">{student.fullName}</td>
                        <td className="px-6 py-4">{student.StudentID}</td>
                        <td className="px-6 py-4">
                          {currentStatus ? getStatusName(currentStatus) : "Not Marked"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => markAttendance(student.StudentID, 1)}
                              className={`px-3 py-1 rounded ${
                                currentStatus === 1
                                  ? "bg-green-600 text-white"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(student.StudentID, 2)}
                              className={`px-3 py-1 rounded ${
                                currentStatus === 2
                                  ? "bg-red-600 text-white"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => markAttendance(student.StudentID, 3)}
                              className={`px-3 py-1 rounded ${
                                currentStatus === 3
                                  ? "bg-yellow-600 text-white"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-6">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredStudents.length > recordsPerPage && (
              <div className="flex justify-between items-center px-6 py-3 border-t text-sm text-gray-700">
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

                <div>
                  Showing {indexOfFirstRecord + 1} to{" "}
                  {Math.min(indexOfLastRecord, filteredStudents.length)} of{" "}
                  {filteredStudents.length} entries
                </div>

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

export default ViewAttendance;
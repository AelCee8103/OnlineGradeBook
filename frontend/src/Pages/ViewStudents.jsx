// ViewStudents.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import { Dialog } from "@headlessui/react";
import { Fragment } from "react";

const ViewStudents = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradesModalOpen, setGradesModalOpen] = useState(false);
  const [studentGrades, setStudentGrades] = useState([]);
  const [activeQuarter, setActiveQuarter] = useState(null);
  const [averageGrade, setAverageGrade] = useState(null);
  const [gradeError, setGradeError] = useState("");
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

  const fetchStudentGrades = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/Pages/faculty/student/${studentId}/grades/${subjectCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Ensure we have all 4 quarters
        const allQuarters = [1, 2, 3, 4].map((quarter) => {
          const existing = response.data.grades.find(
            (g) => g.Quarter === quarter
          );
          return existing || { Quarter: quarter, GradeScore: null };
        });

        setStudentGrades(allQuarters);
        setActiveQuarter(response.data.activeQuarter);
        setAverageGrade(response.data.averageGrade);
        setGradesModalOpen(true);
      } else {
        alert("Failed to fetch grades.");
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching grades.");
    }
  };

  const handleGradeChange = (quarter, value) => {
    // Allow empty string for clearing input
    if (value === "") {
      setStudentGrades((prev) =>
        prev.map((g) => (g.Quarter === quarter ? { ...g, GradeScore: "" } : g))
      );
      return;
    }

    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    // Convert to number and validate range
    const numValue = parseFloat(value);
    if (numValue < 0 || numValue > 100) {
      return;
    }

    setStudentGrades((prev) =>
      prev.map((g) => (g.Quarter === quarter ? { ...g, GradeScore: value } : g))
    );
  };

  const saveGrade = async () => {
    const token = localStorage.getItem("token");
    const editable = studentGrades.find((g) => g.Quarter === activeQuarter);

    try {
      // Input validation
      if (!editable) {
        setGradeError("No active quarter selected");
        return;
      }

      if (!editable.GradeScore && editable.GradeScore !== 0) {
        setGradeError("Grade cannot be empty");
        return;
      }

      // Convert to number and validate
      const numericGrade = parseFloat(editable.GradeScore);
      if (isNaN(numericGrade)) {
        setGradeError("Grade must be a valid number");
        return;
      }

      if (numericGrade < 0 || numericGrade > 100) {
        setGradeError("Grade must be between 0 and 100");
        return;
      }

      // Round to 2 decimal places to ensure consistent format
      const roundedGrade = Math.round(numericGrade * 100) / 100;

      await axios.post(
        "http://localhost:3000/Pages/faculty/update-grade",
        {
          StudentID: selectedStudent.StudentID,
          subject_code: subjectCode,
          Quarter: activeQuarter,
          GradeScore: roundedGrade,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Clear any existing errors
      setGradeError("");

      // Fetch updated grades
      await fetchStudentGrades(selectedStudent.StudentID);

      // Show success message and close modal
      alert("Grade updated successfully");
      setGradesModalOpen(false);
    } catch (error) {
      console.error("Grade update error:", error);

      // Handle authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/faculty-login");
        return;
      }

      // Set error message and keep modal open
      setGradeError("Failed to update grade. Please try again.");
    }
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
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              fetchStudentGrades(student.StudentID);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                          >
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

          <Dialog
            open={gradesModalOpen}
            onClose={() => setGradesModalOpen(false)}
          >
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <Dialog.Panel className="bg-white rounded-xl w-full max-w-2xl p-6">
                <Dialog.Title className="text-lg font-semibold mb-4">
                  Grades for {selectedStudent?.fullName}
                </Dialog.Title>

                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 border">Quarter 1</th>
                        <th className="px-4 py-2 border">Quarter 2</th>
                        <th className="px-4 py-2 border">Quarter 3</th>
                        <th className="px-4 py-2 border">Quarter 4</th>
                        <th className="px-4 py-2 border">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[1, 2, 3, 4].map((quarter) => {
                          const grade = studentGrades.find(
                            (g) => g.Quarter === quarter
                          ) || {
                            Quarter: quarter,
                            GradeScore: null,
                          };
                          return (
                            <td key={quarter} className="px-4 py-2 border">
                              <input
                                type="text" // Changed from "number" to "text" for better validation control
                                value={grade.GradeScore || ""}
                                disabled={quarter !== activeQuarter}
                                onChange={(e) =>
                                  handleGradeChange(quarter, e.target.value)
                                }
                                className={`w-full px-3 py-2 border rounded-md ${
                                  quarter === activeQuarter && gradeError
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                placeholder="Enter grade"
                              />
                            </td>
                          );
                        })}
                        <td className="px-4 py-2 border text-center font-medium">
                          {averageGrade || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Add error message display */}
                {gradeError && (
                  <div className="mt-2 text-red-500 text-sm">{gradeError}</div>
                )}

                <div className="mt-4 text-sm text-gray-500">
                  {activeQuarter
                    ? `Note: Only Quarter ${activeQuarter} is editable`
                    : "No active quarter is set"}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setGradeError("");
                      setGradesModalOpen(false);
                    }}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveGrade}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default ViewStudents;

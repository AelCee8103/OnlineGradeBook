import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";

const SubjectClassStudents = () => {
  const { subjectCode } = useParams();
  const [students, setStudents] = useState([]);
  const [subjectInfo, setSubjectInfo] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState({});
  const [studentInfo, setStudentInfo] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjectClassData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:3000/Pages/admin-subject-classes/${subjectCode}/students`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubjectInfo(res.data.subjectInfo);
        setStudents(res.data.students);
      } catch (error) {
        console.error("Error fetching subject class students:", error);
      }
    };

    fetchSubjectClassData();
  }, [subjectCode]);

  const openModalWithGrades = async (studentID) => {
    try {
      const token = localStorage.getItem("token");

      const studentData = students.find((s) => s.StudentID === studentID);
      setStudentInfo(studentData);

      const gradesRes = await axios.get(
        `http://localhost:3000/Pages/student/${studentID}/grades`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStudentGrades(gradesRes.data);
      setSelectedStudent(studentID);
      setModalOpen(true);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
    setStudentGrades({});
  };

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

          <h1 className="text-3xl font-bold mb-4">Subject Class Students</h1>

          {subjectInfo.subjectName && (
            <div className="bg-white shadow rounded-lg p-4 mb-6 max-w-screen-lg mx-auto">
              <p>
                <strong>Subject Name:</strong> {subjectInfo.subjectName}
              </p>
              <p>
                <strong>Subject Code:</strong> {subjectInfo.subjectCode}
              </p>
              <p>
                <strong>Grade:</strong> {subjectInfo.grade}
              </p>
              <p>
                <strong>Section:</strong> {subjectInfo.section}
              </p>
              <p>
                <strong>Faculty:</strong> {subjectInfo.facultyName}
              </p>
              <p>
                <strong>School Year:</strong> {subjectInfo.schoolYear}
              </p>
              <p>
                <strong>Number of Students:</strong> {students.length}
              </p>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
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
                {students.length > 0 ? (
                  students.map((student, index) => (
                    <tr key={student.StudentID} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{student.StudentID}</td>
                      <td className="px-4 py-2">{student.fullName}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                          onClick={() => openModalWithGrades(student.StudentID)}
                        >
                          View Grades
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No students found for this subject class.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Grade Modal */}
          {modalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closeModal}
                >
                  ✕
                </button>

                <h2 className="text-2xl font-semibold mb-4">Student Grades</h2>

                <div className="mb-4">
                  <p>
                    <strong>Student:</strong> {studentInfo.fullName}
                  </p>
                  <p>
                    <strong>Student ID:</strong> {studentInfo.StudentID}
                  </p>
                  <p>
                    <strong>Grade:</strong> {subjectInfo.grade}
                  </p>
                  <p>
                    <strong>Section:</strong> {subjectInfo.section}
                  </p>
                </div>

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Q1</th>
                      <th className="px-4 py-2">Q2</th>
                      <th className="px-4 py-2">Q3</th>
                      <th className="px-4 py-2">Q4</th>
                      <th className="px-4 py-2">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(studentGrades).map(
                      ([subjectCode, data]) => {
                        const q1 = data.quarters[1] || "-";
                        const q2 = data.quarters[2] || "-";
                        const q3 = data.quarters[3] || "-";
                        const q4 = data.quarters[4] || "-";
                        const validGrades = [q1, q2, q3, q4].filter(
                          (n) => !isNaN(n)
                        );
                        const avg =
                          validGrades.length === 4
                            ? (
                                validGrades.reduce((a, b) => a + b, 0) / 4
                              ).toFixed(2)
                            : "-";

                        return (
                          <tr key={subjectCode} className="border-b">
                            <td className="px-4 py-2">{data.subjectName}</td>
                            <td className="px-4 py-2">{q1}</td>
                            <td className="px-4 py-2">{q2}</td>
                            <td className="px-4 py-2">{q3}</td>
                            <td className="px-4 py-2">{q4}</td>
                            <td className="px-4 py-2">{avg}</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectClassStudents;

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import NavbarFaculty from "../Components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";

const StudentGrades = ({ isFaculty = false }) => {
  // Change studentID to studentId to match route parameter
  const { advisoryID, studentId } = useParams(); // Changed from studentID to studentId
  const [grades, setGrades] = useState({});
  const [studentInfo, setStudentInfo] = useState({});
  const [advisoryInfo, setAdvisoryInfo] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const printRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/faculty-login");
      return;
    }

    // Add validation for studentId
    if (!studentId) {
      console.error("No student ID provided");
      navigate(-1);
      return;
    }

    const fetchGrades = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/Pages/student/${studentId}/grades`, // Changed from studentID
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setGrades(res.data);
      } catch (error) {
        console.error("Error fetching grades:", error);
        alert("Failed to fetch grades");
      }
    };

    const fetchStudent = async () => {
      try {
        // For faculty view, use a different endpoint
        const endpoint = isFaculty
          ? `http://localhost:3000/Pages/faculty/student-info/${studentId}` // Changed from studentID
          : "http://localhost:3000/Pages/admin-manage-students";

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isFaculty) {
          if (!res.data) {
            throw new Error("Student not found");
          }
          setStudentInfo(res.data);
          setAdvisoryInfo(res.data.advisoryInfo);
        } else {
          const match = res.data.find(
            (s) => s.StudentID.toString() === studentId // Changed from studentID
          );
          if (!match) {
            throw new Error("Student not found");
          }
          setStudentInfo(match);
        }
      } catch (error) {
        console.error("Error fetching student info:", error);
        alert("Failed to fetch student information");
        navigate(-1);
      }
    };

    const fetchAdvisory = async () => {
      if (!isFaculty) {
        // Only fetch separately for admin view
        try {
          const res = await axios.get(
            `http://localhost:3000/Pages/admin-advisory-classes/${advisoryID}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.data) {
            setAdvisoryInfo(res.data);
          }
        } catch (error) {
          console.error("Error fetching advisory data:", error);
        }
      }
    };

    fetchGrades();
    fetchStudent();
    if (!isFaculty) fetchAdvisory();
  }, [studentId, advisoryID, isFaculty, navigate]); // Changed from studentID

  const handlePrint = () => {
    const confirmed = window.confirm(
      `Are you sure you want to print the grades for ${studentInfo.FirstName} ${studentInfo.LastName}?`
    );
    if (confirmed) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Use appropriate sidebar based on user type */}
      {isFaculty ? (
        <FacultySidePanel
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      ) : (
        <AdminSidePanel
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Use appropriate navbar based on user type */}
        {isFaculty ? (
          <NavbarFaculty
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        ) : (
          <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        )}

        <div className="p-8">
          <div className="flex items-center mb-4">
            <button
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <button
              className="ml-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={handlePrint}
            >
              🖨️ Print Grades
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-4">Student Grades</h1>

          <div ref={printRef}>
            {studentInfo && (
              <div className="bg-white p-4 mb-4 rounded shadow max-w-screen-md mx-auto">
                <p>
                  <strong>Student:</strong> {studentInfo.FirstName}{" "}
                  {studentInfo.MiddleName} {studentInfo.LastName}
                </p>
                <p>
                  <strong>Student ID:</strong> {studentInfo.StudentID}
                </p>
              </div>
            )}

            {advisoryInfo && (
              <div className="bg-white p-4 mb-6 rounded shadow max-w-screen-md mx-auto">
                <p>
                  <strong>Grade:</strong> {advisoryInfo.Grade}
                </p>
                <p>
                  <strong>Section:</strong> {advisoryInfo.Section}
                </p>
                <p>
                  <strong>Class Advisor:</strong> {advisoryInfo.facultyName}
                </p>
                <p>
                  <strong>School Year:</strong> {advisoryInfo.SchoolYear}
                </p>
              </div>
            )}

            <div className="bg-white p-4 rounded shadow max-w-screen-xl mx-auto">
              <h2 className="text-xl font-semibold mb-3">Grades</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Subject</th>
                    <th className="px-4 py-2">Q1</th>
                    <th className="px-4 py-2">Q2</th>
                    <th className="px-4 py-2">Q3</th>
                    <th className="px-4 py-2">Q4</th>
                    <th className="px-4 py-2">Average</th>
                    <th className="px-4 py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grades).map(([subjectCode, subjectData]) => {
                    const { subjectName, quarters } = subjectData;
                    // Get grades for each quarter, ensuring they are numbers
                    const q1 = parseFloat(quarters[1]) || null;
                    const q2 = parseFloat(quarters[2]) || null;
                    const q3 = parseFloat(quarters[3]) || null;
                    const q4 = parseFloat(quarters[4]) || null;

                    // Only include valid numerical grades
                    const validGrades = [q1, q2, q3, q4].filter(
                      (grade) => grade !== null && !isNaN(grade)
                    );

                    // Calculate average only if all quarters have valid grades
                    const finalGrade =
                      validGrades.length === 4
                        ? (validGrades.reduce((a, b) => a + b, 0) / 4).toFixed(
                            2
                          )
                        : "-";

                    const remarks =
                      finalGrade !== "-"
                        ? parseFloat(finalGrade) >= 75
                          ? "Passed"
                          : "Failed"
                        : "-";

                    return (
                      <tr key={subjectCode} className="border-b">
                        <td className="px-4 py-2">{subjectName}</td>
                        <td className="px-4 py-2">{quarters[1] || "-"}</td>
                        <td className="px-4 py-2">{quarters[2] || "-"}</td>
                        <td className="px-4 py-2">{quarters[3] || "-"}</td>
                        <td className="px-4 py-2">{quarters[4] || "-"}</td>
                        <td className="px-4 py-2">{finalGrade}</td>
                        <td className="px-4 py-2">{remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* General Average Calculation */}
              {(() => {
                const subjectsWithCompleteGrades = Object.values(grades)
                  .map(({ quarters }) => {
                    const quarterGrades = [1, 2, 3, 4]
                      .map((q) => parseFloat(quarters[q]))
                      .filter((grade) => !isNaN(grade) && grade !== null);

                    // Only return average if all quarters have valid grades
                    return quarterGrades.length === 4
                      ? quarterGrades.reduce((a, b) => a + b, 0) / 4
                      : null;
                  })
                  .filter((avg) => avg !== null);

                // Only show general average if all subjects have complete grades
                if (
                  subjectsWithCompleteGrades.length ===
                    Object.keys(grades).length &&
                  subjectsWithCompleteGrades.length > 0
                ) {
                  const generalAverage = (
                    subjectsWithCompleteGrades.reduce((a, b) => a + b, 0) /
                    subjectsWithCompleteGrades.length
                  ).toFixed(2);

                  const generalRemarks =
                    parseFloat(generalAverage) >= 75 ? "Passed" : "Failed";

                  return (
                    <div className="mt-4 text-sm font-semibold text-left ml-4">
                      <p>General Average: {generalAverage}</p>
                      <p>Overall Remarks: {generalRemarks}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;

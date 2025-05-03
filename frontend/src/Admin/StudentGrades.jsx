import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";

const StudentGrades = () => {
  const { advisoryID, studentID } = useParams();
  const [grades, setGrades] = useState({});
  const [studentInfo, setStudentInfo] = useState({});
  const [advisoryInfo, setAdvisoryInfo] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const printRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchGrades = async () => {
      const res = await axios.get(
        `http://localhost:3000/Pages/student/${studentID}/grades`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGrades(res.data);
    };

    const fetchStudent = async () => {
      const res = await axios.get(
        "http://localhost:3000/Pages/admin-manage-students",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const match = res.data.find((s) => s.StudentID.toString() === studentID);
      setStudentInfo(match);
    };

    const fetchAdvisory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:3000/Pages/admin-advisory-classes/${advisoryID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Check if response data exists
        if (res.data) {
          setAdvisoryInfo(res.data);
        } else {
          console.warn("No advisory data found");
          setAdvisoryInfo({});
        }
      } catch (error) {
        console.error("Error fetching advisory data:", error);
        setAdvisoryInfo({});
      }
    };

    fetchGrades();
    fetchStudent();
    fetchAdvisory();
  }, [studentID, advisoryID]);

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
                    const q1 = quarters[1] || "-";
                    const q2 = quarters[2] || "-";
                    const q3 = quarters[3] || "-";
                    const q4 = quarters[4] || "-";
                    const validGrades = [q1, q2, q3, q4].filter(
                      (n) => !isNaN(n)
                    );
                    const finalGrade =
                      validGrades.length === 4
                        ? (validGrades.reduce((a, b) => a + b, 0) / 4).toFixed(
                            2
                          )
                        : "-";

                    const remarks =
                      finalGrade !== "-" && parseFloat(finalGrade) >= 75
                        ? "Passed"
                        : finalGrade !== "-"
                        ? "Failed"
                        : "-";

                    return (
                      <tr key={subjectCode} className="border-b">
                        <td className="px-4 py-2">{subjectName}</td>
                        <td className="px-4 py-2">{q1}</td>
                        <td className="px-4 py-2">{q2}</td>
                        <td className="px-4 py-2">{q3}</td>
                        <td className="px-4 py-2">{q4}</td>
                        <td className="px-4 py-2">{finalGrade}</td>
                        <td className="px-4 py-2">{remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(() => {
                const finalGrades = Object.values(grades)
                  .map(({ quarters }) => {
                    const q1 = quarters[1];
                    const q2 = quarters[2];
                    const q3 = quarters[3];
                    const q4 = quarters[4];
                    const quarterGrades = [q1, q2, q3, q4].filter(
                      (n) => !isNaN(n)
                    );
                    if (quarterGrades.length === 4) {
                      return (
                        quarterGrades.reduce((a, b) => a + b, 0) / 4
                      ).toFixed(2);
                    }
                    return null;
                  })
                  .filter((avg) => avg !== null);

                if (finalGrades.length === 0) return null;

                const generalAverage =
                  finalGrades.reduce(
                    (a, b) => parseFloat(a) + parseFloat(b),
                    0
                  ) / finalGrades.length;

                const generalRemarks =
                  generalAverage >= 75 ? "Passed" : "Failed";

                return (
                  <div className="mt-4 text-sm font-semibold text-left ml-4">
                    <p>General Average: {generalAverage.toFixed(2)}</p>
                    <p>Overall Remarks: {generalRemarks}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;

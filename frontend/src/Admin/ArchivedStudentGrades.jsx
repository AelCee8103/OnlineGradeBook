import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import AdminSidePanel from "../Components/AdminSidePanel";
import NavbarAdmin from "../Components/NavbarAdmin";
import axios from "axios";
import { toast } from "react-toastify";

const ArchivedStudentGrades = () => {
  const { studentId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisories, setAdvisories] = useState([]);
  const [studentInfo, setStudentInfo] = useState({});
  const [selectedAdvisory, setSelectedAdvisory] = useState(null);
  const [grades, setGrades] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchAdvisories = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch advisories for all years for this student
        const res = await axios.get(
          `http://localhost:3000/Pages/admin/archived-student/${studentId}/advisories`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAdvisories(res.data.advisories || []);
        // After setAdvisories(res.data.advisories || []);
        console.log("Fetched advisories:", res.data.advisories);
        setStudentInfo(res.data.studentInfo || {});
      } catch (err) {
        toast.error("Failed to fetch advisories");
      }
    };
    fetchAdvisories();
  }, [studentId]);

  const handleViewGrades = async (advisoryID, school_yearID) => {
    try {
      const token = localStorage.getItem("token");
      // Fetch grades for this advisory and year
      const res = await axios.get(
        `http://localhost:3000/Pages/admin/archived-student/${studentId}/grades/${advisoryID}/${school_yearID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGrades(res.data.grades || {});
      setSelectedAdvisory(
        advisories.find(
          (a) =>
            a.advisoryID === advisoryID && a.school_yearID === school_yearID
        )
      );
      setModalOpen(true);
    } catch (err) {
      toast.error("Failed to fetch grades");
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">
            Archived Grades for {studentInfo.FirstName} {studentInfo.LastName}
          </h1>
          <div className="bg-white rounded shadow p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Advisory History</h2>
            <table className="w-full text-left text-sm mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">School Year</th>
                  <th className="px-4 py-2">Grade</th>
                  <th className="px-4 py-2">Section</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {advisories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No advisory records found.
                    </td>
                  </tr>
                ) : (
                  advisories.map((a) => (
                    <tr key={`${a.advisoryID}-${a.school_yearID}`}>
                      <td className="px-4 py-2">{a.year}</td>
                      <td className="px-4 py-2">{a.Grade}</td>
                      <td className="px-4 py-2">{a.Section}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          onClick={() =>
                            handleViewGrades(a.advisoryID, a.school_yearID)
                          }
                        >
                          View Grades
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal for grade report */}
      {modalOpen && (
        <dialog open className="modal" style={{ zIndex: 9999 }}>
          <div className="modal-box max-w-3xl" ref={printRef}>
            <h3 className="font-bold text-lg mb-2">
              Grade Report - {selectedAdvisory?.year} | Grade{" "}
              {selectedAdvisory?.Grade} - {selectedAdvisory?.Section}
            </h3>
            <div className="mb-2">
              <strong>Student:</strong> {studentInfo.FirstName}{" "}
              {studentInfo.MiddleName} {studentInfo.LastName}
            </div>
            <div className="mb-2">
              <strong>Advisory:</strong> Grade {selectedAdvisory?.Grade} -{" "}
              {selectedAdvisory?.Section}
            </div>
            <div className="mb-2">
              <strong>School Year:</strong> {selectedAdvisory?.year}
            </div>
            {/* Grades Table (format like StudentGrades.jsx) */}
            <table className="w-full text-left text-sm mb-4">
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
                  const q1 = parseFloat(quarters[1]) || null;
                  const q2 = parseFloat(quarters[2]) || null;
                  const q3 = parseFloat(quarters[3]) || null;
                  const q4 = parseFloat(quarters[4]) || null;
                  const validGrades = [q1, q2, q3, q4].filter(
                    (grade) => grade !== null && !isNaN(grade)
                  );
                  const finalGrade =
                    validGrades.length === 4
                      ? (validGrades.reduce((a, b) => a + b, 0) / 4).toFixed(2)
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
                  return quarterGrades.length === 4
                    ? quarterGrades.reduce((a, b) => a + b, 0) / 4
                    : null;
                })
                .filter((avg) => avg !== null);

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
            <div className="modal-action flex gap-2 mt-4 no-print">
              <button className="btn" onClick={() => setModalOpen(false)}>
                Close
              </button>
              <button
                className="btn bg-green-600 text-white hover:bg-green-700"
                onClick={handlePrint}
              >
                Print
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default ArchivedStudentGrades;

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import NavbarFaculty from "../Components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import { Toaster, toast } from "react-hot-toast"; // Add this import

const StudentGrades = ({ isFaculty = false }) => {
  const { advisoryID, studentId } = useParams();
  const [grades, setGrades] = useState({});
  const [studentInfo, setStudentInfo] = useState({});
  const [advisoryInfo, setAdvisoryInfo] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    status: null, // "pending", "approved", "rejected", or null
    lastRequestDate: null,
  });
  const [validationLoading, setValidationLoading] = useState(true);
  const navigate = useNavigate();
  const printRef = useRef();
  useEffect(() => {
    // Only run if advisoryID is available (from URL or advisoryInfo)
    const advisoryToCheck = advisoryInfo?.advisoryID || advisoryID;
    if (!advisoryToCheck) return;
    console.log("useEffect: advisoryToCheck =", advisoryToCheck);
    if (!advisoryToCheck) {
      console.log("No advisoryToCheck, skipping validation fetch");
      return;
    }
    const token = localStorage.getItem("token");
    setValidationLoading(true);
    axios
      .get(
        `http://localhost:3000/Pages/faculty/check-pending-request/${advisoryToCheck}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (res.data.success) {
          setValidationStatus({
            status: res.data.status,
            lastRequestDate: res.data.lastRequestDate,
          });
        } else {
          setValidationStatus({ status: null, lastRequestDate: null });
        }
      })
      .catch(() => {
        setValidationStatus({ status: null, lastRequestDate: null });
      })
      .finally(() => {
        setValidationLoading(false);
        console.log("Validation loading set to false");
      });
  }, [advisoryInfo?.advisoryID, advisoryID]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/faculty-login");
      return;
    }

    if (!studentId) {
      console.error("No student ID provided");
      navigate(-1);
      return;
    }

    const fetchGrades = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/Pages/student/${studentId}/grades`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setGrades(res.data);
      } catch (error) {
        console.error("Error fetching grades:", error);
        toast.error("Failed to fetch grades");
      }
    };

    const fetchStudent = async () => {
      try {
        const endpoint = isFaculty
          ? `http://localhost:3000/Pages/faculty/student-info/${studentId}`
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
            (s) => s.StudentID.toString() === studentId
          );
          if (!match) {
            throw new Error("Student not found");
          }
          setStudentInfo(match);
        }
      } catch (error) {
        console.error("Error fetching student info:", error);
        toast.error("Failed to fetch student information");
        navigate(-1);
      }
    };

    const fetchAdvisory = async () => {
      if (!isFaculty) {
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

    // Fetch validation status for the advisory
    const fetchValidationStatus = async () => {
      // Fix: declare advisoryToCheck
      const advisoryToCheck = advisoryInfo?.advisoryID || advisoryID;

      console.log("About to check validation for advisoryID:", advisoryToCheck);
      if (!advisoryToCheck) {
        setValidationStatus({ status: null, lastRequestDate: null });
        setValidationLoading(false);
        return;
      }
      const token = localStorage.getItem("token");
      setValidationLoading(true);
      axios
        .get(
          `http://localhost:3000/Pages/faculty/check-pending-request/${advisoryToCheck}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        .then((res) => {
          if (res.data.success) {
            setValidationStatus({
              status: res.data.status,
              lastRequestDate: res.data.lastRequestDate,
            });
            console.log("Validation status set to:", res.data.status); // <-- Add this
          } else {
            setValidationStatus({ status: null, lastRequestDate: null });
          }
        })
        .then((res) => {
          if (res.data.success) {
            setValidationStatus({
              status: res.data.status,
              lastRequestDate: res.data.lastRequestDate,
            });
          } else {
            setValidationStatus({ status: null, lastRequestDate: null });
          }
        })
        .catch(() => {
          setValidationStatus({ status: null, lastRequestDate: null });
        })
        .finally(() => {
          setValidationLoading(false);
        });
    };

    fetchGrades();
    fetchStudent();
    if (!isFaculty) fetchAdvisory();
    // eslint-disable-next-line
  }, [studentId, advisoryID, isFaculty, navigate, advisoryInfo?.advisoryID]);

  useEffect(() => {
    const getAndCheckValidation = async () => {
      let advisoryToCheck = advisoryInfo?.advisoryID || advisoryID;
      if (!advisoryToCheck && studentId) {
        advisoryToCheck = await fetchStudentAdvisoryID(studentId);
      }
      if (!advisoryToCheck) return;

      const token = localStorage.getItem("token");
      setValidationLoading(true);
      axios
        .get(
          `http://localhost:3000/Pages/faculty/check-pending-request/${advisoryToCheck}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => {
          if (res.data.success) {
            setValidationStatus({
              status: res.data.status,
              lastRequestDate: res.data.lastRequestDate,
            });
          } else {
            setValidationStatus({ status: null, lastRequestDate: null });
          }
        })
        .catch(() => {
          setValidationStatus({ status: null, lastRequestDate: null });
        })
        .finally(() => {
          setValidationLoading(false);
        });
    };

    getAndCheckValidation();
  }, [advisoryInfo?.advisoryID, advisoryID, studentId]);

  // Only allow print if validationStatus.status === "approved"
  const canPrint =
    !validationLoading &&
    (validationStatus.status === "approved" ||
      validationStatus.status === 1 ||
      (typeof validationStatus.status === "string" &&
        validationStatus.status.trim().toLowerCase() === "approved"));

  // Feedback message for print restriction
  let printRestrictionMsg = "";
  if (!validationLoading) {
    if (!validationStatus.status) {
      printRestrictionMsg = "Cannot print. Grade is not validated yet.";
    } else if (validationStatus.status === "pending") {
      printRestrictionMsg =
        "Cannot print. Validation request is still pending.";
    } else if (validationStatus.status === "rejected") {
      printRestrictionMsg = "Cannot print. Validation request was rejected.";
    }
  }

  const handlePrint = () => {
    if (!canPrint) {
      toast.error(printRestrictionMsg || "Printing not allowed.");
      return;
    }
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

  const fetchStudentAdvisoryID = async (studentId) => {
    const token = localStorage.getItem("token");
    // Get current school year
    const syRes = await axios.get("http://localhost:3000/Pages/schoolyear", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const currentSY = (syRes.data || []).find((sy) => sy.status === 1);
    if (!currentSY) return null;

    // Get student_classes for this student and year
    const res = await axios.get(
      `http://localhost:3000/Pages/student-classes/${studentId}/${currentSY.school_yearID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.advisoryID || null;
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <Toaster position="top-center" />
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
              className={`ml-4 px-4 py-2 rounded text-white ${
                canPrint
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={canPrint ? handlePrint : undefined}
              disabled={!canPrint}
            >
              🖨️ Print Grades
            </button>
            {!canPrint && printRestrictionMsg && (
              <span className="ml-4 text-red-600 font-semibold">
                {printRestrictionMsg}
              </span>
            )}
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
                    const q1 = parseFloat(quarters[1]) || null;
                    const q2 = parseFloat(quarters[2]) || null;
                    const q3 = parseFloat(quarters[3]) || null;
                    const q4 = parseFloat(quarters[4]) || null;
                    const validGrades = [q1, q2, q3, q4].filter(
                      (grade) => grade !== null && !isNaN(grade)
                    );
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;

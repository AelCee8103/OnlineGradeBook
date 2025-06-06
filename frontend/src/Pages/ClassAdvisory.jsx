// ClassAdvisory.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavbarFaculty from "../Components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import axios from "axios";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog } from "@headlessui/react";
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";
import NotificationDropdown from "../Components/NotificationDropdown";

const ClassAdvisory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [advisoryData, setAdvisoryData] = useState({
    grade: "",
    section: "",
    advisorName: "Not Assigned",
    schoolYear: "",
    advisoryID: null,
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
  const [lastRequestDate, setLastRequestDate] = useState(null);
  const [validationStatus, setValidationStatus] = useState({
    status: null, // "pending", "approved", "rejected", or null
    lastRequestDate: null,
    activeQuarter: null,
  });
  const [socket, setSocket] = useState(null);
  const studentsPerPage = 5;
  const navigate = useNavigate();

  const fetchAdvisoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/faculty-login");

      const { data } = await axios.get(
        "http://localhost:3000/auth/faculty-class-advisory",
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (data.message === "No advisory class assigned") {
        setAdvisoryData({
          grade: "",
          section: "",
          advisorName: data.advisorName || "Not Assigned",
          advisoryID: null,
        });
        setStudents([]);
        setError("No advisory class assigned to you");
        return;
      }

      if (!data.grade || !data.section)
        throw new Error("Incomplete advisory data received");

      setAdvisoryData({
        grade: data.grade,
        section: data.section,
        advisorName: data.advisorName,
        advisoryID: data.advisoryID,
      });
      setStudents(data.students || []);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message.includes("timeout")
          ? "Request timed out. Please try again."
          : "Failed to load advisory data";

      setError(msg);
      if (err.response?.status === 401) navigate("/faculty-login");
    } finally {
      setLoading(false);
    }
  };

  const checkValidationStatus = useCallback(async () => {
    try {
      if (!advisoryData.advisoryID) return;

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/Pages/faculty/check-pending-request/${advisoryData.advisoryID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setValidationStatus({
          status: response.data.status, // "pending", "approved", "rejected", or null
          lastRequestDate: response.data.lastRequestDate,
          activeQuarter: response.data.activeQuarter,
        });
      }
    } catch (error) {
      console.error("Error checking validation status:", error);
    }
  }, [advisoryData.advisoryID]);

  useEffect(() => {
    fetchAdvisoryData();
  }, []);

  useEffect(() => {
    checkValidationStatus();
    const interval = setInterval(checkValidationStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkValidationStatus]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:3000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    // Get faculty information from localStorage
    const facultyID = localStorage.getItem("facultyID");
    const facultyName = localStorage.getItem("facultyName");

    if (facultyID) {
      // Authenticate socket connection
      newSocket.emit("authenticate", {
        userType: "faculty",
        userID: facultyID,
        facultyName: facultyName,
      });

      // Listen for validation response from admin
      newSocket.on("validationResponseReceived", (data) => {
        const { status, message, requestID } = data;

        console.log("Received validation response:", data);

        // Update validation status - use the correct status comparison
        setValidationStatus((prev) => ({
          ...prev,
          hasPendingRequest: false,
          isApproved: status === "approve", // Not 'approved'
          isRejected: status === "reject", // Not 'rejected'
          lastRequestDate: new Date().toISOString(),
        }));

        // Show detailed notification with the correct status check
        const notificationTitle =
          status === "approve" ? "Validation Approved!" : "Validation Rejected";
        const notificationClass =
          status === "approve" ? "bg-green-600" : "bg-red-600";

        toast.custom(
          <div
            className={`${notificationClass} text-white p-4 rounded shadow-lg`}
          >
            <p className="font-bold">{notificationTitle}</p>
            <p>{message}</p>
            <p className="text-sm mt-1">
              Class: Grade {data.Grade} - {data.Section}
            </p>
          </div>,
          { duration: 6000 }
        );

        // Refresh advisory data if approved
        if (status === "approve") {
          fetchAdvisoryData();
        }
      });
    }

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.off("validationResponseReceived");
        newSocket.off("validationStatusUpdate");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
    };
  }, []);

  // Remove the duplicate useEffect that's also listening for 'validationResponseReceived'
  // Instead, modify this useEffect to handle additional socket events
  useEffect(() => {
    if (!socket) return;

    // Get faculty information from localStorage
    const facultyID = localStorage.getItem("facultyID");

    // Handle socket events here
    const handleStatusUpdate = (data) => {
      if (data.advisoryID === advisoryData.advisoryID) {
        setValidationStatus((prev) => ({
          ...prev,
          hasPendingRequest: false,
          isApproved: data.status === "approve",
          isRejected: data.status === "reject",
          lastRequestDate: new Date(data.timestamp),
        }));
      }
    };

    socket.on("validationStatusUpdate", handleStatusUpdate);

    return () => {
      socket.off("validationStatusUpdate", handleStatusUpdate);
    };
  }, [socket, advisoryData.advisoryID]);

  const fetchStudentDetails = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/Pages/students/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedStudentInfo({
        ...response.data,
        grade: advisoryData.grade,
        section: advisoryData.section,
      });
      setStudentModalOpen(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("Failed to fetch student details", {
        duration: 4000,
        position: "top-center",
        icon: "❌",
      });
    }
  };

  const handleValidateGrades = async () => {
    try {
      setIsValidating(true);
      const token = localStorage.getItem("token");
      const facultyID = localStorage.getItem("facultyID");
      const facultyName = localStorage.getItem("facultyName");

      const response = await axios.post(
        "http://localhost:3000/Pages/faculty/validate-grades",
        { advisoryID: advisoryData.advisoryID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Emit socket event for real-time notification
        socket.emit("validationRequest", {
          requestID: response.data.requestID,
          facultyID: facultyID,
          facultyName: facultyName,
          grade: advisoryData.grade,
          section: advisoryData.section,
          advisoryID: advisoryData.advisoryID,
          schoolYear: advisoryData.schoolYear,
          timestamp: new Date().toISOString(),
        });

        // Update local validation status immediately
        setValidationStatus((prev) => ({
          ...prev,
          status: "pending",
          lastRequestDate: new Date(),
        }));

        // Show detailed confirmation message
        toast.success(
          <div>
            <p className="font-bold">Validation Request Sent</p>
            <p>
              Grades for Grade {advisoryData.grade} - {advisoryData.section}{" "}
              have been submitted for validation.
            </p>
            <p className="text-sm mt-1">Waiting for admin approval.</p>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      handleValidationError(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidationError = (error) => {
    if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action");
      navigate("/faculty-login");
    } else if (
      error.response?.status === 400 &&
      error.response.data.message.includes("pending")
    ) {
      toast.error("You already have a pending validation request");
    } else {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit grades for validation"
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredStudents = students.filter(
    (student) =>
      student.StudentID.toString().includes(searchTerm) ||
      student.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.FirstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatName = (last, first, middle) =>
    `${last}, ${first}${middle ? ` ${middle.charAt(0)}.` : ""}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-600">Loading advisory class...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p className="mb-4 text-lg">{error}</p>
        <button
          onClick={
            error === "No advisory class assigned to you"
              ? () => navigate("/faculty-dashboard")
              : fetchAdvisoryData
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          {error === "No advisory class assigned to you"
            ? "Back to Dashboard"
            : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <FacultySidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 sm:p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Class Advisory</h1>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="text-lg font-semibold">
                  {advisoryData.grade || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Section</p>
                <p className="text-lg font-semibold">
                  {advisoryData.section || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Advisor</p>
                <p className="text-lg font-semibold">
                  {advisoryData.advisorName}
                </p>
              </div>
            </div>
            {lastRequestDate && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Last Validation Request</p>
                <p className="text-lg font-semibold">
                  {formatDate(lastRequestDate)}
                </p>
              </div>
            )}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Validation Status</p>
                  <p className="text-lg font-semibold">
                    {validationStatus.status === "pending" && (
                      <span className="text-yellow-600">Pending</span>
                    )}
                    {validationStatus.status === "approved" && (
                      <span className="text-green-600">Approved</span>
                    )}
                    {validationStatus.status === "rejected" && (
                      <span className="text-red-600">Rejected</span>
                    )}
                    {!validationStatus.status &&
                      (validationStatus.activeQuarter === 4 ? (
                        <span className="text-blue-600">
                          Ready for Validation
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          Not Ready for Validation
                        </span>
                      ))}
                  </p>
                  {validationStatus.lastRequestDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Last Request:{" "}
                      {formatDate(validationStatus.lastRequestDate)}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleValidateGrades}
                  disabled={
                    validationStatus.activeQuarter !== 4 ||
                    validationStatus.status === "pending" ||
                    validationStatus.status === "approved"
                  }
                  className={`px-4 py-2 rounded-md transition ${
                    validationStatus.activeQuarter !== 4 ||
                    validationStatus.status === "pending" ||
                    validationStatus.status === "approved"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-700 hover:bg-green-800 text-white"
                  }`}
                >
                  {isValidating ? "Submitting..." : "Validate Grades"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="relative w-full max-w-md">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by ID or name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-sm text-center font-semibold px-4 py-2">
                      No.
                    </th>
                    <th className="text-sm font-semibold text-left px-6 py-2">
                      Student Name
                    </th>
                    <th className="text-sm font-semibold text-left px-6 py-2">
                      Student Number
                    </th>
                    <th className="text-sm font-semibold text-center px-6 py-2">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentStudents.length ? (
                    currentStudents.map((student, idx) => (
                      <tr key={student.StudentID}>
                        <td className="text-center text-sm px-4 py-2">
                          {idx + 1 + (currentPage - 1) * studentsPerPage}
                        </td>
                        <td className="text-sm px-6 py-2">
                          {formatName(
                            student.LastName,
                            student.FirstName,
                            student.MiddleName
                          )}
                        </td>
                        <td className="text-sm px-6 py-2">
                          {student.StudentID}
                        </td>
                        <td className="px-6 py-2 flex justify-center gap-2">
                          <button
                            onClick={() =>
                              fetchStudentDetails(student.StudentID)
                            }
                            className="bg-blue-500 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md"
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/faculty/students/${student.StudentID}/grades`
                              )
                            }
                            className="bg-green-500 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-md"
                          >
                            Grades
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-gray-500"
                      >
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {currentStudents.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm rounded-md border ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-700">
                    Page <strong>{currentPage}</strong> of{" "}
                    <strong>{totalPages}</strong>
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm rounded-md border ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl w-full max-w-md p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Student Information
            </Dialog.Title>

            {selectedStudentInfo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-medium">
                      {selectedStudentInfo.StudentID}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {`${selectedStudentInfo.FirstName} ${selectedStudentInfo.MiddleName} ${selectedStudentInfo.LastName}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grade & Section</p>
                    <p className="font-medium">
                      {`Grade ${selectedStudentInfo.grade} - ${selectedStudentInfo.section}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStudentModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ClassAdvisory;

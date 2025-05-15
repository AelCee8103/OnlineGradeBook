import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";

const ViewStudents = () => {
  const { advisoryID } = useParams();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [advisoryInfo, setAdvisoryInfo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    const fetchAdvisoryData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/admin-login");
          return;
        }

        // Fetch current school year (status = 1)
        const syRes = await axios.get(
          "http://localhost:3000/Pages/schoolyear",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const currentSY = (syRes.data || []).find((sy) => sy.status === 1);

        // Fetch advisory and students
        const response = await axios.get(
          `http://localhost:3000/Pages/admin-view-students/${advisoryID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.error || "Invalid response format");
        }

        // Only show students with Status === 1 (not archived)
        const activeStudents = response.data.students || [];

        setAdvisoryInfo({
          ...response.data.advisoryInfo,
          SchoolYear: currentSY ? currentSY.year : "N/A",
        });

        setStudents(activeStudents);
        setFilteredStudents(activeStudents);
        console.log("Fetched students from backend:", response.data.students);
        console.log("Filtered active students (Status === 1):", activeStudents);

        setIsLoading(false);
      } catch (error) {
        let errorMsg = "Failed to load data";
        if (error.response) {
          errorMsg = error.response.data?.error || errorMsg;
          if (error.response.data?.details) {
            errorMsg += `: ${error.response.data.details}`;
          }
        } else {
          errorMsg += `: ${error.message}`;
        }
        setError(errorMsg);
        setIsLoading(false);
        setAdvisoryInfo({
          Grade: "Error",
          Section: advisoryID,
          facultyName: "Check console",
          SchoolYear: "N/A",
        });
      }
    };

    fetchAdvisoryData();
  }, [advisoryID, navigate]);

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
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, students]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStudents.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="m-auto">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="m-auto text-red-500">{error}</div>
      </div>
    );
  }

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

          {advisoryInfo ? (
            <div className="bg-white shadow rounded-lg p-4 mb-6 max-w-screen-lg mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Grade & Section:</p>
                  <p>
                    {advisoryInfo.Grade} - {advisoryInfo.Section}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Class Advisor:</p>
                  <p>{advisoryInfo.facultyName}</p>
                </div>
                <div>
                  <p className="font-semibold">School Year:</p>
                  <p>{advisoryInfo.SchoolYear}</p>
                </div>
                <div>
                  <p className="font-semibold">Number of Students:</p>
                  <p>{students.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-4 mb-6 max-w-screen-lg mx-auto">
              <p className="text-red-500">
                Advisory class information not found
              </p>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search by ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-1/2"
              />
              <span className="text-sm text-gray-600 ml-2">
                {filteredStudents.length} students found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-10 py-2 text-gray-600">No.</th>
                    <th className="px-10 py-2 text-gray-600">Student ID</th>
                    <th className="px-10 py-2 text-gray-600">Full Name</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((student, index) => (
                      <tr
                        key={student.StudentID}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-10 py-2">
                          {indexOfFirstRecord + index + 1}
                        </td>
                        <td className="px-10 py-2">{student.StudentID}</td>
                        <td className="px-10 py-2">
                          {student.LastName}, {student.FirstName}{" "}
                          {student.MiddleName}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No students found in this advisory class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudents;

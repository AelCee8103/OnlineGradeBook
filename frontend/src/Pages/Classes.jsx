// Classes.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../Components/FacultySidePanel";
import axios from "axios";

const Classes = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/faculty-login");

      const response = await axios.get(
        "http://localhost:3000/auth/faculty-assign-subjects",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAssignedSubjects(response.data.data || []);
      } else {
        setError("Failed to fetch subjects.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load subjects.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStudents = (subjectCode) => {
    navigate(`/faculty-view-students/${subjectCode}`);
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Classes</h1>

          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-600">Loading subjects...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center text-lg mt-10">{error}</div>
          ) : assignedSubjects.length === 0 ? (
            <div className="text-gray-500 text-center text-lg mt-10">
              You have no assigned classes.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Subject Code</th>
                    <th className="px-6 py-3">Subject Name</th>
                    <th className="px-6 py-3">Faculty</th>
                    <th className="px-6 py-3">Grade & Section</th>
                    <th className="px-6 py-3">School Year</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignedSubjects.map((subject, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{subject.subjectCode}</td>
                      <td className="px-6 py-4">{subject.subjectName}</td>
                      <td className="px-6 py-4">{subject.facultyName}</td>
                      <td className="px-6 py-4">{`${subject.grade} - ${subject.section}`}</td>
                      <td className="px-6 py-4">{subject.schoolYear}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewStudents(subject.subjectCode)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm transition"
                        >
                          View Students
                        </button>
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

export default Classes;

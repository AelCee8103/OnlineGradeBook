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
      if (!token) {
        navigate("/faculty-login");
        return;
      }
      const response = await axios.get(
        "http://localhost:3000/auth/faculty-assign-subjects",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setAssignedSubjects(response.data.data || []);
      } else {
        setError("Failed to fetch subjects");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStudents = (subjectCode) => {
    navigate(`/faculty-view-students/${subjectCode}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`fixed inset-y-0 left-0 w-64 transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 sm:static z-50`}
      >
        <FacultySidePanel
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 overflow-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Classes</h1>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Subject Code</th>
                    <th className="px-6 py-3">Subject Name</th>
                    <th className="px-6 py-3">Faculty</th>
                    <th className="px-6 py-3">Grade & Section</th>
                    <th className="px-6 py-3">School Year</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedSubjects.map((subject, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="px-6 py-4">{subject.subjectCode}</td>
                      <td className="px-6 py-4">{subject.subjectName}</td>
                      <td className="px-6 py-4">{subject.facultyName}</td>
                      <td className="px-6 py-4">
                        {subject.grade} - {subject.section}
                      </td>
                      <td className="px-6 py-4">{subject.schoolYear}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleViewStudents(subject.subjectCode)
                          }
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classes;

import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const ManageGrades = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisories, setAdvisories] = useState([]);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const navigate = useNavigate();
  const [advisorySearch, setAdvisorySearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  // Authenticate Admin
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.get("http://localhost:3000/auth/admin-manage-grades", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      navigate("/admin-login");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch advisory data
  useEffect(() => {
    const fetchAdvisories = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/Pages/admin/manage-grades/:advisoryID",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Advisory API response:", response.data);

        const rawData = Array.isArray(response.data)
          ? response.data
          : response.data.advisories || [];

        const formatted = rawData.map((item) => ({
          advisoryID: item.advisoryID,
          classID: item.classID,
          facultyName: item.facultyName,
          grade: item.grade,
          section: item.section,
          school_Year: item.SchoolYear, // Adjust casing if needed
        }));

        setAdvisories(formatted);
        console.log("Formatted advisories:", formatted);
      } catch (error) {
        console.error("Error fetching advisory data:", error);
      }
    };
    fetchAdvisories();
  }, []);

  // Fetch subject class data
  useEffect(() => {
    const fetchSubjectClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/Pages/admin-assign-subject",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const formatted = response.data.map((item) => ({
          subjectCode: item.subjectCode,
          subjectName: item.subjectName,
          facultyName: item.facultyName,
          grade: item.grade,
          section: item.section,
          schoolYear: item.schoolYear,
          advisoryID: item.advisoryID,
        }));
        setSubjectClasses(formatted);
      } catch (error) {
        console.error("Error fetching subject class list:", error);
      }
    };
    fetchSubjectClasses();
  }, []);

  const filteredAdvisories = advisories.filter((adv) =>
    Object.values(adv).some((value) =>
      value?.toString().toLowerCase().includes(advisorySearch.toLowerCase())
    )
  );

  const filteredSubjects = subjectClasses.filter((subject) =>
    Object.values(subject).some((value) =>
      value?.toString().toLowerCase().includes(subjectSearch.toLowerCase())
    )
  );

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

        {/* Advisory Class List */}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Advisory Class List</h1>
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input
              type="text"
              value={advisorySearch}
              onChange={(e) => setAdvisorySearch(e.target.value)}
              placeholder="Search advisory class..."
              className="mb-4 border border-gray-300 rounded-md px-4 py-2"
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />

            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-gray-600">No.</th>
                    <th className="px-4 py-2 text-gray-600">Faculty Name</th>
                    <th className="px-4 py-2 text-gray-600">Grade</th>
                    <th className="px-4 py-2 text-gray-600">Section</th>
                    <th className="px-4 py-2 text-gray-600">School Year</th>
                    <th className="px-4 py-2 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvisories.length > 0 ? (
                    filteredAdvisories.map((adv, index) => (
                      <tr key={adv.classID} className="border-b">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">{adv.facultyName}</td>
                        <td className="px-4 py-2">{adv.grade}</td>
                        <td className="px-4 py-2">{adv.section}</td>
                        <td className="px-4 py-2">{adv.school_Year}</td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            onClick={() =>
                              navigate(
                                `/admin/advisory/${adv.advisoryID}/students`
                              )
                            }
                          >
                            View Students
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No advisory records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Subject Class List */}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Subject Class List</h1>
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder="Search subject class..."
              className="mb-4 border border-gray-300 rounded-md px-4 py-2"
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-gray-600">No.</th>
                    <th className="px-4 py-2 text-gray-600">Subject Code</th>
                    <th className="px-4 py-2 text-gray-600">Subject Name</th>
                    <th className="px-4 py-2 text-gray-600">Faculty</th>
                    <th className="px-4 py-2 text-gray-600">Grade</th>
                    <th className="px-4 py-2 text-gray-600">Section</th>
                    <th className="px-4 py-2 text-gray-600">School Year</th>
                    <th className="px-4 py-2 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject, index) => (
                      <tr key={subject.subjectCode} className="border-b">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">{subject.subjectCode}</td>
                        <td className="px-4 py-2">{subject.subjectName}</td>
                        <td className="px-4 py-2">{subject.facultyName}</td>
                        <td className="px-4 py-2">{subject.grade}</td>
                        <td className="px-4 py-2">{subject.section}</td>
                        <td className="px-4 py-2">{subject.schoolYear}</td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            onClick={() =>
                              navigate(
                                `/admin/subject-classes/${subject.subjectCode}/students`
                              )
                            }
                          >
                            View Students
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No subject class records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageGrades;

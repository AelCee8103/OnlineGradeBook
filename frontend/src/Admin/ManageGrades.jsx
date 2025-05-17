import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageGrades = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisories, setAdvisories] = useState([]);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const navigate = useNavigate();
  const [advisorySearch, setAdvisorySearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [isLoading, setIsLoading] = useState({
    advisories: true,
    subjects: true,
  });

  // Pagination states for Advisory Classes
  const [advisoryCurrentPage, setAdvisoryCurrentPage] = useState(1);
  const [advisoryItemsPerPage, setAdvisoryItemsPerPage] = useState(10);
  const [advisoryTotalPages, setAdvisoryTotalPages] = useState(1);

  // Pagination states for Subject Classes
  const [subjectCurrentPage, setSubjectCurrentPage] = useState(1);
  const [subjectItemsPerPage, setSubjectItemsPerPage] = useState(10);
  const [subjectTotalPages, setSubjectTotalPages] = useState(1);

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
      setIsLoading((prev) => ({ ...prev, advisories: true }));
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/Pages/admin/manage-grades",
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
        toast.error("Failed to load advisory data");
      } finally {
        setIsLoading((prev) => ({ ...prev, advisories: false }));
      }
    };
    fetchAdvisories();
  }, []);

  // Fetch subject class data
  useEffect(() => {
    const fetchSubjectClasses = async () => {
      setIsLoading((prev) => ({ ...prev, subjects: true }));
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
        toast.error("Failed to load subject class data");
      } finally {
        setIsLoading((prev) => ({ ...prev, subjects: false }));
      }
    };
    fetchSubjectClasses();
  }, []);

  // Filter advisories based on search term
  const filteredAdvisories = advisories.filter((adv) =>
    Object.values(adv).some((value) =>
      value?.toString().toLowerCase().includes(advisorySearch.toLowerCase())
    )
  );

  // Filter subjects based on search term
  const filteredSubjects = subjectClasses.filter((subject) =>
    Object.values(subject).some((value) =>
      value?.toString().toLowerCase().includes(subjectSearch.toLowerCase())
    )
  );

  // Update total pages for advisories
  useEffect(() => {
    setAdvisoryTotalPages(
      Math.ceil(filteredAdvisories.length / advisoryItemsPerPage)
    );
    if (
      advisoryCurrentPage >
        Math.ceil(filteredAdvisories.length / advisoryItemsPerPage) &&
      filteredAdvisories.length > 0
    ) {
      setAdvisoryCurrentPage(1);
    }
  }, [filteredAdvisories, advisoryItemsPerPage, advisoryCurrentPage]);

  // Update total pages for subjects
  useEffect(() => {
    setSubjectTotalPages(Math.ceil(filteredSubjects.length / subjectItemsPerPage));
    if (
      subjectCurrentPage >
        Math.ceil(filteredSubjects.length / subjectItemsPerPage) &&
      filteredSubjects.length > 0
    ) {
      setSubjectCurrentPage(1);
    }
  }, [filteredSubjects, subjectItemsPerPage, subjectCurrentPage]);

  // Pagination handlers for advisories
  const paginateAdvisory = (pageNumber) => setAdvisoryCurrentPage(pageNumber);
  const handleAdvisoryItemsPerPageChange = (e) => {
    setAdvisoryItemsPerPage(parseInt(e.target.value));
    setAdvisoryCurrentPage(1);
  };

  // Pagination handlers for subjects
  const paginateSubject = (pageNumber) => setSubjectCurrentPage(pageNumber);
  const handleSubjectItemsPerPageChange = (e) => {
    setSubjectItemsPerPage(parseInt(e.target.value));
    setSubjectCurrentPage(1);
  };

  // Handle search changes with pagination reset
  const handleAdvisorySearchChange = (e) => {
    setAdvisorySearch(e.target.value);
    setAdvisoryCurrentPage(1);
  };

  const handleSubjectSearchChange = (e) => {
    setSubjectSearch(e.target.value);
    setSubjectCurrentPage(1);
  };

  // Calculate current items for advisories
  const indexOfLastAdvisory = advisoryCurrentPage * advisoryItemsPerPage;
  const indexOfFirstAdvisory = indexOfLastAdvisory - advisoryItemsPerPage;
  const currentAdvisories = filteredAdvisories.slice(
    indexOfFirstAdvisory,
    indexOfLastAdvisory
  );

  // Calculate current items for subjects
  const indexOfLastSubject = subjectCurrentPage * subjectItemsPerPage;
  const indexOfFirstSubject = indexOfLastSubject - subjectItemsPerPage;
  const currentSubjects = filteredSubjects.slice(
    indexOfFirstSubject,
    indexOfLastSubject
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
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Advisory Class List */}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Advisory Class List</h1>
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="relative mb-4">
              <input
                type="text"
                value={advisorySearch}
                onChange={handleAdvisorySearchChange}
                placeholder="Search advisory class..."
                className="border border-gray-300 rounded-md px-4 py-2 w-full pl-10"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-3 text-gray-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-gray-600">No.</th>
                    <th className="px-4 py-2 text-gray-600">Faculty Name</th>
                    <th className="px-4 py-2 text-gray-600">Grade</th>
                    <th className="px-4 py-2 text-gray-600">Section</th>
                    <th className="px-4 py-2 text-gray-600">School Year</th>
                    <th className="px-4 py-2 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading.advisories ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Loading advisory data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentAdvisories.length > 0 ? (
                    currentAdvisories.map((adv, index) => (
                      <tr key={adv.classID} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {indexOfFirstAdvisory + index + 1}
                        </td>
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

            {/* Advisory Pagination Controls */}
            {!isLoading.advisories && filteredAdvisories.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className="flex items-center mb-4 md:mb-0">
                  <span className="text-sm text-gray-700 mr-2">Show</span>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={advisoryItemsPerPage}
                    onChange={handleAdvisoryItemsPerPageChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-gray-700 ml-2">
                    items per page
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-4">
                    Page {advisoryCurrentPage} of {advisoryTotalPages} (
                    {filteredAdvisories.length} total items)
                  </span>
                  <div className="flex">
                    <button
                      onClick={() => paginateAdvisory(1)}
                      disabled={advisoryCurrentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${
                        advisoryCurrentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() =>
                        paginateAdvisory(Math.max(1, advisoryCurrentPage - 1))
                      }
                      disabled={advisoryCurrentPage === 1}
                      className={`px-3 py-1 border-t border-b ${
                        advisoryCurrentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        paginateAdvisory(Math.min(advisoryTotalPages, advisoryCurrentPage + 1))
                      }
                      disabled={advisoryCurrentPage === advisoryTotalPages}
                      className={`px-3 py-1 border-t border-b ${
                        advisoryCurrentPage === advisoryTotalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => paginateAdvisory(advisoryTotalPages)}
                      disabled={advisoryCurrentPage === advisoryTotalPages}
                      className={`px-3 py-1 rounded-r-md border ${
                        advisoryCurrentPage === advisoryTotalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject Class List */}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Subject Class List</h1>
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="relative mb-4">
              <input
                type="text"
                value={subjectSearch}
                onChange={handleSubjectSearchChange}
                placeholder="Search subject class..."
                className="border border-gray-300 rounded-md px-4 py-2 w-full pl-10"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-3 text-gray-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-200">
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
                  {isLoading.subjects ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Loading subject data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentSubjects.length > 0 ? (
                    currentSubjects.map((subject, index) => (
                      <tr key={subject.subjectCode} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{indexOfFirstSubject + index + 1}</td>
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

            {/* Subject Pagination Controls */}
            {!isLoading.subjects && filteredSubjects.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className="flex items-center mb-4 md:mb-0">
                  <span className="text-sm text-gray-700 mr-2">Show</span>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={subjectItemsPerPage}
                    onChange={handleSubjectItemsPerPageChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-gray-700 ml-2">
                    items per page
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-4">
                    Page {subjectCurrentPage} of {subjectTotalPages} (
                    {filteredSubjects.length} total items)
                  </span>
                  <div className="flex">
                    <button
                      onClick={() => paginateSubject(1)}
                      disabled={subjectCurrentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${
                        subjectCurrentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() =>
                        paginateSubject(Math.max(1, subjectCurrentPage - 1))
                      }
                      disabled={subjectCurrentPage === 1}
                      className={`px-3 py-1 border-t border-b ${
                        subjectCurrentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        paginateSubject(Math.min(subjectTotalPages, subjectCurrentPage + 1))
                      }
                      disabled={subjectCurrentPage === subjectTotalPages}
                      className={`px-3 py-1 border-t border-b ${
                        subjectCurrentPage === subjectTotalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => paginateSubject(subjectTotalPages)}
                      disabled={subjectCurrentPage === subjectTotalPages}
                      className={`px-3 py-1 rounded-r-md border ${
                        subjectCurrentPage === subjectTotalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageGrades;

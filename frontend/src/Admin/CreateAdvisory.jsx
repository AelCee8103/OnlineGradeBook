import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAdvisory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisoryClasses, setAdvisoryClasses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    advisoryID: "",
    classID: "",
    facultyID: "",
  });

  const [createFormData, setCreateFormData] = useState({
    classID: "",
    facultyID: "",
    schoolYearID: "",
  });

  const fetchAdvisoryClasses = async () => {
    const token = localStorage.getItem("token");
    try {
      setFetching(true);
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-create-advisory",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Advisory classes response (full data):", response.data);
      console.log("Total advisory records received:", response.data?.length || 0);

      // Check if data is an array and has items
      if (Array.isArray(response.data) && response.data.length > 0) {
        setAdvisoryClasses(response.data);
        // Calculate total pages
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        return response.data;
      } else {
        console.warn("Empty or invalid advisory data received:", response.data);
        setAdvisoryClasses([]);
        setTotalPages(1);
        return [];
      }
    } catch (err) {
      console.error("Error fetching advisory classes:", err);
      toast.error("Failed to load advisory classes");
      setError("Failed to load advisory classes");
      setAdvisoryClasses([]);
      setTotalPages(1);
      return [];
    } finally {
      setFetching(false);
    }
  };

  const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    setFetching(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const classesPromise = axios.get(
        "http://localhost:3000/Pages/admin-advisory-classes",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const facultiesPromise = axios.get(
        "http://localhost:3000/Pages/admin-manage-faculty",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const yearsPromise = axios.get("http://localhost:3000/Pages/schoolyear", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const advisoryPromise = fetchAdvisoryClasses();

      // Wait for all promises to resolve
      const [advisoryData, classesRes, facultiesRes, yearsRes] = await Promise.all(
        [advisoryPromise, classesPromise, facultiesPromise, yearsPromise]
      );

      // Set state with the results
      setClasses(classesRes.data || []);
      setFaculties(facultiesRes.data || []);
      setSchoolYears(yearsRes.data || []);

      // Log the data for debugging
      console.log("Classes data:", classesRes.data);
      console.log("Faculties data:", facultiesRes.data);
      console.log("School years data:", yearsRes.data);
      console.log("Advisory classes:", advisoryData);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
      setError("Failed to load data");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  // Get all facultyIDs currently assigned as advisors
  const assignedFacultyIDs = advisoryClasses.map((a) => a.facultyID);

  // For create modal: only show faculty not assigned as advisor
  const availableFacultyForCreate = faculties.filter(
    (f) => !assignedFacultyIDs.includes(f.FacultyID)
  );

  // For edit modal: show faculty not assigned as advisor, plus the current one
  const availableFacultyForEdit = faculties.filter(
    (f) =>
      !assignedFacultyIDs.includes(f.FacultyID) ||
      f.FacultyID === formData.facultyID // allow current advisor
  );

  // In handleEdit:
  const [originalFacultyID, setOriginalFacultyID] = useState("");
  const handleEdit = (advisory) => {
    setFormData({
      advisoryID: advisory.advisoryID,
      classID: advisory.classID,
      facultyID: advisory.facultyID,
    });
    setOriginalFacultyID(advisory.facultyID); // store original
    document.getElementById("edit_modal").showModal();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3000/Pages/admin-advisory-classes/${formData.advisoryID}`,
        { facultyID: formData.facultyID }, // Only send facultyID
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Advisory class updated successfully");
      await fetchAdvisoryClasses();
      document.getElementById("edit_modal").close();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to update advisory class"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const { classID, facultyID, schoolYearID } = createFormData;

    if (!classID || !facultyID || !schoolYearID) {
      toast.warning("Please fill in all required fields.");
      return;
    }

    const classAlreadyAssigned = advisoryClasses.some(
      (advisory) =>
        advisory.classID === classID &&
        advisory.schoolYearID === schoolYearID &&
        advisory.facultyID
    );

    if (classAlreadyAssigned) {
      toast.warning(
        "This section already has an assigned faculty for the selected school year."
      );
      return;
    }

    const facultyAlreadyAssigned = advisoryClasses.some(
      (advisory) =>
        advisory.facultyID === facultyID &&
        advisory.schoolYearID === schoolYearID
    );

    if (facultyAlreadyAssigned) {
      toast.warning(
        "This faculty is already assigned to another section in the selected school year."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/Pages/admin-create-advisory",
        createFormData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Advisory class successfully created!");

      // Reset form and close modal immediately
      setCreateFormData({
        classID: "",
        facultyID: "",
        schoolYearID: "",
      });
      document.getElementById("create_modal").close();

      // Refresh data
      await fetchAdvisoryClasses();
    } catch (error) {
      console.error("Server error:", error);
      const message =
        error.response?.data?.error ||
        "Server error occurred. Please try again later.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewStudents = (advisoryID) => {
    navigate(`/admin-view-students/${advisoryID}`);
  };

  const filteredAdvisoryClasses = advisoryClasses.filter((advisory) => {
    if (!advisory) return false;
    
    // Create a flag to log any issues with this advisory
    let hasIssues = false;
    
    // Find class and faculty info
    const classInfo = classes.find((c) => c.ClassID === advisory.classID) || {};
    if (!classInfo.ClassID) {
      console.log(`Advisory ${advisory.advisoryID} is missing valid class info`);
      hasIssues = true;
    }
    
    const facultyInfo = faculties.find((f) => f.FacultyID === advisory.facultyID) || {};
    if (!facultyInfo.FacultyID) {
      console.log(`Advisory ${advisory.advisoryID} is missing valid faculty info`);
      hasIssues = true;
    }
    
    // If search term is empty, include all advisories regardless of issues
    if (!searchTerm) return true;
    
    // Create searchable text
    const searchableText = [
      advisory.advisoryID?.toString() || "",
      advisory.classID?.toString() || "",
      classInfo.Grade?.toString() || "",
      (classInfo.Section || "").toLowerCase(),
      (facultyInfo.FirstName || "").toLowerCase(),
      (facultyInfo.LastName || "").toLowerCase(),
    ].join(" ");
    
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort the advisory classes in ascending order by advisoryID
  const sortedAdvisoryClasses = [...filteredAdvisoryClasses].sort((a, b) => {
    return a.advisoryID - b.advisoryID;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAdvisoryClasses.slice(indexOfFirstItem, indexOfLastItem);
  
  // Update totalPages whenever filtered results change
  useEffect(() => {
    setTotalPages(Math.ceil(sortedAdvisoryClasses.length / itemsPerPage));
  }, [sortedAdvisoryClasses, itemsPerPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
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
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Advisory Classes</h1>

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="flex items-center mb-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search advisory classes..."
                  onChange={handleSearchChange}
                  value={searchTerm}
                  className="border border-gray-300 rounded-md px-4 py-2 w-full pl-10"
                />
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>
              <button
                className="btn bg-blue-700 text-white hover:bg-blue-800 ml-4"
                onClick={() =>
                  document.getElementById("create_modal").showModal()
                }
                disabled={loading}
              >
                {loading ? "Loading..." : "Create Advisory Class"}
              </button>
            </div>

            {/* Create Modal */}
            <dialog id="create_modal" className="modal">
              <div className="modal-box max-w-md">
                <h3 className="font-bold text-lg mb-5">
                  Create Advisory Class
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Class</span>
                    </label>
                    <select
                      name="classID"
                      value={createFormData.classID}
                      onChange={handleCreateChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.ClassID} value={cls.ClassID}>
                          Grade {cls.Grade} - {cls.Section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Faculty</span>
                    </label>
                    <select
                      name="facultyID"
                      value={createFormData.facultyID}
                      onChange={handleCreateChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {availableFacultyForCreate.map((faculty) => (
                        <option
                          key={faculty.FacultyID}
                          value={faculty.FacultyID}
                        >
                          {faculty.FacultyID} - {faculty.LastName},{" "}
                          {faculty.FirstName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">School Year</span>
                    </label>
                    <select
                      name="schoolYearID"
                      value={createFormData.schoolYearID}
                      onChange={handleCreateChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select School Year</option>
                      {schoolYears.map((year) => (
                        <option
                          key={year.school_yearID}
                          value={year.school_yearID}
                        >
                          {year.school_yearID} - {year.year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-action">
                    <button
                      type="submit"
                      className="btn bg-blue-700 text-white"
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        document.getElementById("create_modal").close()
                      }
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>

            {/* Edit Modal */}
            <dialog id="edit_modal" className="modal">
              <div className="modal-box max-w-md">
                <h3 className="font-bold text-lg mb-5">Edit Advisory Class</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Advisory ID</span>
                    </label>
                    <input
                      type="text"
                      name="advisoryID"
                      value={formData.advisoryID}
                      className="input input-bordered w-full"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Faculty</span>
                    </label>
                    <select
                      name="facultyID"
                      value={formData.facultyID}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {availableFacultyForEdit.map((faculty) => (
                        <option
                          key={faculty.FacultyID}
                          value={faculty.FacultyID}
                        >
                          {faculty.FacultyID} - {faculty.LastName},{" "}
                          {faculty.FirstName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-action">
                    <button
                      type="submit"
                      className="btn bg-green-700 text-white"
                      disabled={
                        loading ||
                        !formData.facultyID ||
                        formData.facultyID === originalFacultyID // disables if unchanged
                      }
                    >
                      {loading ? "Updating..." : "Update"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        document.getElementById("edit_modal").close()
                      }
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>

            {/* Reset all filters button (add above the table) */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  setItemsPerPage(25); // Increase to show more items
                }}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
              >
                View All ({advisoryClasses.length})
              </button>
            </div>

            {/* Advisory Classes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2">Advisory ID</th>
                    <th className="px-4 py-2">Class</th>
                    <th className="px-4 py-2">Faculty</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fetching ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Loading advisory classes...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((advisory) => {
                      // Find corresponding class and faculty
                      const classInfo = classes.find((c) => c.ClassID === advisory.classID);
                      const facultyInfo = faculties.find((f) => f.FacultyID === advisory.facultyID);

                      return (
                        <tr key={advisory.advisoryID || `advisory-${Math.random()}`} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{advisory.advisoryID || "N/A"}</td>
                          <td className="px-4 py-2">
                            {classInfo && classInfo.Grade ? `Grade ${classInfo.Grade} - ${classInfo.Section}` : "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            {facultyInfo && facultyInfo.LastName ? `${facultyInfo.LastName}, ${facultyInfo.FirstName}` : "N/A"}
                          </td>
                          <td className="px-4 py-2 flex space-x-2">
                            <button
                              onClick={() => handleViewStudents(advisory.advisoryID)}
                              className="bg-green-600 text-white px-3 py-1 mr-2 rounded hover:bg-green-700 text-sm"
                              disabled={!advisory.advisoryID}
                            >
                              View Students
                            </button>
                            <button
                              onClick={() => handleEdit(advisory)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No advisory classes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
              <div className="flex items-center mb-4 md:mb-0">
                <span className="text-sm text-gray-700 mr-2">
                  Show
                </span>
                <select 
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-700 ml-2">
                  items per page
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  Page {currentPage} of {totalPages} 
                  ({sortedAdvisoryClasses.length} total items)
                </span>
                <div className="flex">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border ${
                      currentPage === 1 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-white text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border-t border-b ${
                      currentPage === 1 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-white text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-1 border-t border-b ${
                      currentPage === totalPages || totalPages === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-white text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-1 rounded-r-md border ${
                      currentPage === totalPages || totalPages === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-white text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdvisory;
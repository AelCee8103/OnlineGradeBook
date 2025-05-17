import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageClasses = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [classes, setClasses] = useState([]);
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
    ClassID: "",
    Grade: "",
    Section: "",
  });

  const [createFormData, setCreateFormData] = useState({
    Grade: "",
    Section: "",
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem("token");
      setFetching(true);
      setError(null);
      try {
        const response = await axios.get(
          "http://localhost:3000/Pages/admin-advisory-classes",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setClasses(response.data || []);
      } catch (err) {
        console.error("Error fetching classes:", err);
        toast.error("Failed to load classes");
        setError("Failed to load classes");
      } finally {
        setFetching(false);
      }
    };

    fetchClasses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleEdit = (classItem) => {
    setFormData({
      ClassID: classItem.ClassID,
      Grade: classItem.Grade,
      Section: classItem.Section,
    });
    document.getElementById("edit_modal").showModal();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:3000/Pages/admin-advisory-classes/${formData.ClassID}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Class updated successfully");
      setClasses((prev) =>
        prev.map((c) => (c.ClassID === formData.ClassID ? response.data : c))
      );
      document.getElementById("edit_modal").close();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!createFormData.Grade || !createFormData.Section) {
        throw new Error("Grade and Section are required");
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/Pages/admin-advisory-classes",
        createFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status === 201) {
        toast.success("Class created successfully");
        setCreateFormData({
          Grade: "",
          Section: "",
        });
        document.getElementById("create_modal").close();
        setClasses((prev) => [...prev, response.data]);
      } else {
        throw new Error(response.data.error || "Failed to create class");
      }
    } catch (error) {
      console.error("Creation error:", error);
      toast.error(error.message || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewStudents = (classId) => {
    navigate(`/admin-view-students?classId=${classId}`);
  };

  const filteredClasses = classes.filter((classItem) => {
    if (!classItem) return false;
    return (
      (classItem.ClassID?.toString() || "").includes(searchTerm) ||
      (classItem.Grade?.toString() || "").includes(searchTerm) ||
      (classItem.Section || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);

  // Update total pages whenever filtered results change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredClasses.length / itemsPerPage));
    // If current page is greater than total pages, set to page 1
    if (currentPage > Math.ceil(filteredClasses.length / itemsPerPage) && filteredClasses.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredClasses, itemsPerPage, currentPage]);

  // Pagination controls
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
          <h1 className="text-3xl font-bold mb-6">Class Sections</h1>

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="flex items-center mb-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search classes..."
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
                {loading ? "Loading..." : "Create Class Section"}
              </button>
            </div>

            {/* Create Modal */}
            <dialog id="create_modal" className="modal">
              <div className="modal-box max-w-md">
                <h3 className="font-bold text-lg mb-5">Create Class Section</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Grade Level</span>
                    </label>
                    <select
                      name="Grade"
                      value={createFormData.Grade}
                      onChange={handleCreateChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select Grade</option>
                      {[7, 8, 9, 10, 11, 12].map((grade) => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Section</span>
                    </label>
                    <input
                      type="text"
                      name="Section"
                      value={createFormData.Section}
                      onChange={handleCreateChange}
                      placeholder="Section (e.g., A, B, C)"
                      className="input input-bordered w-full"
                      required
                      maxLength="20"
                    />
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
                      <span className="label-text">Class ID</span>
                    </label>
                    <input
                      type="text"
                      name="ClassID"
                      value={formData.ClassID}
                      className="input input-bordered w-full"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Grade Level</span>
                    </label>
                    <select
                      name="Grade"
                      value={formData.Grade}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                      required
                    >
                      {[7, 8, 9, 10, 11, 12].map((grade) => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Section</span>
                    </label>
                    <input
                      type="text"
                      name="Section"
                      value={formData.Section}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      required
                      maxLength="20"
                    />
                  </div>
                  <div className="modal-action">
                    <button
                      type="submit"
                      className="btn bg-green-700 text-white"
                      disabled={loading}
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

            {/* Classes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2">Class ID</th>
                    <th className="px-4 py-2">Grade</th>
                    <th className="px-4 py-2">Section</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fetching ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Loading classes...</span>
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
                    currentItems.map((classItem) => (
                      <tr key={classItem.ClassID} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{classItem.ClassID}</td>
                        <td className="px-4 py-2">Grade {classItem.Grade}</td>
                        <td className="px-4 py-2">
                          {classItem.Section || "-"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No classes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {!fetching && filteredClasses.length > 0 && (
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
                    Page {currentPage} of {totalPages} 
                    ({filteredClasses.length} total items)
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
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
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
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 border-t border-b ${
                        currentPage === totalPages 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border ${
                        currentPage === totalPages 
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

export default ManageClasses;

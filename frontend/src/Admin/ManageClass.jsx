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
    if (!formData.Grade || !formData.Section) {
      toast.error("Grade and Section are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:3000/Pages/admin-class-section/${formData.ClassID}`,
        {
          Grade: formData.Grade,
          Section: formData.Section,
        },
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
                        Loading classes...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredClasses.length > 0 ? (
                    filteredClasses.map((classItem) => (
                      <tr key={classItem.ClassID} className="border-b">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageClasses;

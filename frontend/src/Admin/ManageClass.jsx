import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageClasses = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [advisoryClasses, setAdvisoryClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    ClassID: "",
    Grade: "",
    Section: "",
    FacultyID: "",
  });

  const [createFormData, setCreateFormData] = useState({
    ClassID: "",
    Grade: "",
    Section: "",
    FacultyID: "",
  });

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (advisory) => {
    setFormData({
      ClassID: advisory.ClassID,
      Grade: advisory.Grade,
      Section: advisory.Section,
      FacultyID: advisory.FacultyID,
    });
    document.getElementById("edit_modal").showModal();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:3000/Pages/admin-advisory-classes", 
        formData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        fetchAdvisoryClasses();
        document.getElementById("edit_modal").close();
        toast.success(response.data.message);
      } else {
        toast.error(response.data.error || "Failed to update class");
      }
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error(error.response?.data?.error || "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/Pages/admin-advisory-classes", 
        createFormData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    
      if (response.data.success) {
        // Update state immediately instead of fetching again
        setAdvisoryClasses(prevClasses => [...prevClasses, response.data.newClass]);
    
        document.getElementById("create_modal").close();
        toast.success(response.data.message);
        setCreateFormData({ ClassID: "", Grade: "", Section: "", FacultyID: "" });
  
        // Redirect to the advisory classes page
        navigate('/admin-advisory-classes');  // <-- Add this line
      } else {
        toast.error(response.data.error || "Failed to create class");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error(error.response?.data?.error || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };
  

  const fetchAdvisoryClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-advisory-classes", 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdvisoryClasses(response.data);
    } catch (error) {
      console.error("Error fetching advisory classes:", error);
      toast.error("Failed to load advisory classes");
    }
  };

  useEffect(() => {
    fetchAdvisoryClasses();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <AdminSidePanel isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Advisory Class List</h1>
          
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="flex items-center mb-4">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder="Search by ID number" 
                  onChange={handleSearchChange} 
                  value={searchTerm} 
                  className="border border-gray-300 rounded-md px-4 py-2 w-full pl-10" 
                />
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-3 text-gray-400" />
              </div>
              <button 
                className="btn bg-blue-700 text-white hover:bg-blue-800 ml-4"
                onClick={() => document.getElementById('create_modal').showModal()}
                disabled={loading}
              >
                {loading ? "Loading..." : "Create Advisory List"}
              </button>
            </div>

            {/* Create Modal */}
            <dialog id="create_modal" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-5">Create Advisory Class</h3>
                <form onSubmit={handleCreate} className="space-y-3">
                  <input 
                    type="text" 
                    name="ClassID" 
                    value={createFormData.ClassID}
                    onChange={handleCreateChange}
                    placeholder="Class ID" 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="Grade" 
                    value={createFormData.Grade}
                    onChange={handleCreateChange}
                    placeholder="Grade Level" 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="Section" 
                    value={createFormData.Section}
                    onChange={handleCreateChange}
                    placeholder="Section" 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="FacultyID" 
                    value={createFormData.FacultyID}
                    onChange={handleCreateChange}
                    placeholder="Faculty ID" 
                    className="input input-bordered w-full" 
                    required 
                  />
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
                      onClick={() => document.getElementById('create_modal').close()}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </dialog>

            {/* Edit Modal */}
            <dialog id="edit_modal" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-5">Edit Advisory Class</h3>
                <form onSubmit={handleUpdate} className="space-y-3">
                  <input 
                    type="text" 
                    name="ClassID" 
                    value={formData.ClassID} 
                    onChange={handleChange} 
                    placeholder="Class ID" 
                    className="input input-bordered w-full" 
                    required 
                    disabled
                  />
                  <input 
                    type="text" 
                    name="Grade" 
                    value={formData.Grade} 
                    onChange={handleChange} 
                    placeholder="Grade Level" 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="Section" 
                    value={formData.Section} 
                    onChange={handleChange} 
                    placeholder="Section" 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="FacultyID" 
                    value={formData.FacultyID} 
                    onChange={handleChange} 
                    placeholder="Faculty ID" 
                    className="input input-bordered w-full" 
                    required 
                  />
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
                      onClick={() => document.getElementById('edit_modal').close()}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </dialog>

            {/* Advisory Classes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2">Class ID</th>
                    <th className="px-4 py-2">Grade Level</th>
                    <th className="px-4 py-2">Section</th>
                    <th className="px-4 py-2">Faculty ID</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advisoryClasses.length > 0 ? (
                    advisoryClasses.map((advisory) => (
                      <tr key={advisory.ClassID} className="border-b">
                        <td className="px-4 py-2">{advisory.ClassID}</td>
                        <td className="px-4 py-2">{advisory.Grade}</td>
                        <td className="px-4 py-2">{advisory.Section}</td>
                        <td className="px-4 py-2">{advisory.FacultyID}</td>
                        <td className="px-4 py-2">
                          <button 
                            onClick={() => handleEdit(advisory)} 
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        {loading ? "Loading..." : "No advisory classes found."}
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
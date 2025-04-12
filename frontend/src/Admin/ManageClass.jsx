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
  const [schoolYears, setSchoolYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

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
    school_yearID: "",
    studentLimit: 50
  });

  const fetchAdvisoryClasses = async () => {
    setFetching(true);
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
    } finally {
      setFetching(false);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/schoolyear",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchoolYears(response.data);
    } catch (error) {
      console.error("Error fetching school years:", error);
      toast.error("Failed to load school years");
    }
  };

  useEffect(() => {
    fetchAdvisoryClasses();
    fetchSchoolYears();
  }, []);

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
      
      if (response.data.message) {
        fetchAdvisoryClasses();
        document.getElementById("edit_modal").close();
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate numeric fields
      if (isNaN(createFormData.ClassID) || 
          isNaN(createFormData.Grade) || 
          isNaN(createFormData.FacultyID)) {
        throw new Error("ClassID, Grade, and FacultyID must be numbers");
      }

      // Validate Section length (VARCHAR(11) in DB)
      if (createFormData.Section.length > 11) {
        throw new Error("Section must be 11 characters or less");
      }

      if (!createFormData.school_yearID) {
        throw new Error("School Year is required");
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/Pages/admin-advisory-classes", 
        {
          ...createFormData,
          ClassID: parseInt(createFormData.ClassID),
          Grade: parseInt(createFormData.Grade),
          FacultyID: parseInt(createFormData.FacultyID),
          studentLimit: parseInt(createFormData.studentLimit) || 50
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    
      if (response.data.success) {
        toast.success(response.data.message);
        
        // Reset form after successful creation
        setCreateFormData({ 
          ClassID: "", 
          Grade: "", 
          Section: "", 
          FacultyID: "",
          school_yearID: "",
          studentLimit: 50
        });

        document.getElementById("create_modal").close();
        fetchAdvisoryClasses();
      }
    } catch (error) {
      console.error("Creation error:", error);
      let errorMessage = "Failed to create class";
      
      if (error.response) {
        errorMessage = error.response.data.error || 
                     error.response.data.details || 
                     error.response.data.message || 
                     errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (classId) => {
    navigate(`/admin-view-students?classId=${classId}`);
  };

  const filteredClasses = advisoryClasses.filter(advisory => 
    advisory.ClassID.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisory.Grade.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (advisory.Section && advisory.Section.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (advisory.FacultyID && advisory.FacultyID.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
    (advisory.FacultyLastName && advisory.FacultyLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (advisory.FacultyFirstName && advisory.FacultyFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (advisory.yearID && advisory.yearID.toString().includes(searchTerm)) ||
    (advisory.year && advisory.year.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                  placeholder="Search classes..." 
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
                {loading ? "Loading..." : "Create Advisory Class"}
              </button>
            </div>

            {/* Create Modal */}
            <dialog id="create_modal" className="modal">
              <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-5">Create Advisory Class</h3>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Class ID</span>
                      </label>
                      <input 
                        type="text" 
                        name="ClassID" 
                        value={createFormData.ClassID}
                        onChange={handleCreateChange}
                        placeholder="Class ID" 
                        className="input input-bordered w-full" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Grade Level</span>
                      </label>
                      <input 
                        type="text" 
                        name="Grade" 
                        value={createFormData.Grade}
                        onChange={handleCreateChange}
                        placeholder="Grade Level" 
                        className="input input-bordered w-full" 
                        required 
                      />
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
                        placeholder="Section" 
                        className="input input-bordered w-full" 
                        required 
                        maxLength="11"
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Faculty ID</span>
                      </label>
                      <input 
                        type="text" 
                        name="FacultyID" 
                        value={createFormData.FacultyID}
                        onChange={handleCreateChange}
                        placeholder="Faculty ID" 
                        className="input input-bordered w-full" 
                        required 
                      />
                    </div>
                    <div>
                    <label className="label">
                      <span className="label-text">School Year</span>
                    </label>
                    <select
                      name="school_yearID"
                      value={createFormData.school_yearID}
                      onChange={handleCreateChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select School Year</option>
                      {Array.isArray(schoolYears) && schoolYears.length > 0 ? (
                        schoolYears.map(year => (
                          <option key={year.school_yearID} value={year.school_yearID}>
                            {year.school_yearID} - {year.year || year.SchoolYear}
                          </option>
                        ))
                      ) : (
                        <option disabled>No school years available</option>
                      )}
                    </select>
                  </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Student Limit</span>
                      </label>
                      <input 
                        type="number" 
                        name="studentLimit" 
                        value={createFormData.studentLimit}
                        onChange={handleCreateChange}
                        placeholder="Student Limit" 
                        className="input input-bordered w-full" 
                        min="1"
                        max="100"
                      />
                    </div>
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
                    className="input input-bordered w-full" 
                    required 
                    disabled
                  />
                  <input 
                    type="text" 
                    name="Grade" 
                    value={formData.Grade} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="Section" 
                    value={formData.Section} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    required 
                  />
                  <input 
                    type="text" 
                    name="FacultyID" 
                    value={formData.FacultyID} 
                    onChange={handleChange} 
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
               {/* Advisory Classes Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm mt-4">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2">Class ID</th>
                        <th className="px-4 py-2">Grade</th>
                        <th className="px-4 py-2">Section</th>
                        <th className="px-4 py-2">Faculty ID</th>
                        <th className="px-4 py-2">School Year ID</th>
                        <th className="px-4 py-2">School Year</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fetching ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            Loading advisory classes...
                          </td>
                        </tr>
                      ) : filteredClasses.length > 0 ? (
                        filteredClasses.map((advisory) => (
                          <tr key={advisory.ClassID} className="border-b">
                            <td className="px-4 py-2">{advisory.ClassID}</td>
                            <td className="px-4 py-2">{advisory.Grade}</td>
                            <td className="px-4 py-2">{advisory.Section}</td>
                            <td className="px-4 py-2">{advisory.FacultyID}</td>
                            <td className="px-4 py-2">{advisory.yearID}</td>
                            <td className="px-4 py-2">{advisory.year}</td>
                            <td className="px-4 py-2">
                              <button 
                                onClick={() => handleViewStudents(advisory.ClassID)} 
                                className="bg-green-600 text-white px-3 py-1 mr-2 rounded hover:bg-green-700 text-sm"
                              >
                                View
                              </button>
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
                          <td colSpan="7" className="text-center py-4">
                            No advisory classes found.
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
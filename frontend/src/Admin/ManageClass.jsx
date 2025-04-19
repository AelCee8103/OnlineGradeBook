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
  const [classes, setClasses] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
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
  });

  useEffect(() => {
    const fetchAll = async () => {
      const token = localStorage.getItem("token");
      setFetching(true);
      setError(null);
      try {
        const [classesRes, schoolYearRes, facultiesRes] = await Promise.all([
          axios.get("http://localhost:3000/Pages/admin-advisory-classes", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/Pages/schoolyear", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/Pages/admin-manage-faculty", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
  
        // Ensure data is properly formatted
        const formattedClasses = classesRes.data.map(cls => ({
          ...cls,
          yearID: cls.school_yearID, // Make sure yearID is available
          SchoolYear: cls.SchoolYear || 'N/A'
        }));
  
        setClasses(formattedClasses);
        setSchoolYears(schoolYearRes.data || []);
        setFaculties(facultiesRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
        setError("Failed to load data");
      } finally {
        setFetching(false);
      }
    };
  
    fetchAll();
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
      FacultyID: classItem.FacultyID,
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
        toast.success(response.data.message);
        setClasses(prev =>
          prev.map(c => (c.ClassID === formData.ClassID ? formData : c))
        );
        document.getElementById("edit_modal").close();
      }
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
      if (
        !createFormData.ClassID ||
        !createFormData.Grade ||
        !createFormData.Section ||
        !createFormData.FacultyID ||
        !createFormData.school_yearID
      ) {
        throw new Error("All fields are required");
      }
  
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/Pages/admin-advisory-classes",
        {
          ...createFormData,
          ClassID: parseInt(createFormData.ClassID),
          Grade: parseInt(createFormData.Grade),
          FacultyID: parseInt(createFormData.FacultyID),
          school_yearID: parseInt(createFormData.school_yearID),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
        }
      );
  
      if (response.status === 201) {
        toast.success(`${response.data.message} (Assigned ${response.data.assignedStudents} students)`);
        setCreateFormData({
          ClassID: "",
          Grade: "",
          Section: "",
          FacultyID: "",
          school_yearID: "",
        });
        document.getElementById("create_modal").close();
        // Add the new class to the state
        setClasses(prev => [...prev, response.data.createdClass]);
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
      (classItem.ClassID?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.Grade?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.Section || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.FacultyID?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.FacultyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.yearID?.toString() || "").includes(searchTerm) ||
      (classItem.SchoolYear || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
                        type="number" 
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
                        type="number" 
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
                        <span className="label-text">Faculty</span>
                      </label>
                      <select
                        name="FacultyID"
                        value={createFormData.FacultyID}
                        onChange={handleCreateChange}
                        className="select select-bordered w-full"
                        required
                      >
                        <option value="">Select Faculty</option>
                        {faculties.map(faculty => (
                          <option key={faculty.FacultyID} value={faculty.FacultyID}>
                          {faculty.FacultyID} - {faculty.FirstName} {faculty.LastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                        <select
                          name="school_yearID"
                          value={createFormData.school_yearID}
                          onChange={handleCreateChange}
                          className="select select-bordered w-full"
                          required
                        >
                          <option value="">Select School Year</option>
                          {schoolYears.length === 0 ? (
                            <option disabled>Loading school years...</option>
                          ) : (
                            schoolYears.map(year => (
                              <option key={year.school_yearID} value={year.school_yearID}>
                                {/* Try different property names */}
                                {year.year || year.SchoolYear || year.schoolYear || 
                                `${year.startYear}-${year.endYear}` || `Year ${year.school_yearID}`}
                              </option>
                            ))
                          )}
                        </select>
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
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
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
                    type="number" 
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
                  <select
                    name="FacultyID"
                    value={formData.FacultyID}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(faculty => (
                      <option key={faculty.FacultyID} value={faculty.FacultyID}>
                        {faculty.FirstName} {faculty.LastName}
                      </option>
                    ))}
                  </select>
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
                      <td colSpan="6" className="text-center py-4">
                        Loading classes...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredClasses.length > 0 ? (
                    filteredClasses.map((classItem) => (
                      <tr key={`${classItem.ClassID}-${classItem.yearID || classItem.school_yearID}`} className="border-b">
                        <td className="px-4 py-2">{classItem.ClassID}</td>
                        <td className="px-4 py-2">{classItem.Grade}</td>
                        <td className="px-4 py-2">{classItem.Section || '-'}</td>
                        <td className="px-4 py-2">
                          <button 
                            onClick={() => handleViewStudents(classItem.ClassID)} 
                            className="bg-green-600 text-white px-3 py-1 mr-2 rounded hover:bg-green-700 text-sm"
                          >
                            View
                          </button>
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
                      <td colSpan="6" className="text-center py-4">
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
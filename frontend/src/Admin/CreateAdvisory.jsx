import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  const [formData, setFormData] = useState({
    advisoryID: "",
    classID: "",
    facultyID: ""
  });

  const [createFormData, setCreateFormData] = useState({
    classID: "",
    facultyID: "",
    schoolYearID: ""
  });

  const fetchAdvisoryClasses = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-create-advisory",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdvisoryClasses(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error("Error fetching advisory classes:", err);
      toast.error("Failed to load advisory classes");
      setError("Failed to load advisory classes");
      return [];
    }
  };

  const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    setFetching(true);
    setError(null);
    try {
      const [advisoryData, classesRes, facultiesRes, yearsRes] = await Promise.all([
        fetchAdvisoryClasses(),
        axios.get("http://localhost:3000/Pages/admin-advisory-classes", 
          { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:3000/Pages/admin-manage-faculty", 
          { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:3000/Pages/schoolyear", 
          { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setClasses(classesRes.data || []);
      setFaculties(facultiesRes.data || []);
      setSchoolYears(yearsRes.data || []);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleEdit = (advisory) => {
    setFormData({
      advisoryID: advisory.advisoryID,
      classID: advisory.classID,
      facultyID: advisory.facultyID
    });
    document.getElementById("edit_modal").showModal();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:3000/Pages/admin-advisory-classes/${formData.advisoryID}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Advisory class updated successfully");
      await fetchAdvisoryClasses();
      document.getElementById("edit_modal").close();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update advisory class");
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
  
    const classAlreadyAssigned = advisoryClasses.some(advisory =>
      advisory.classID === classID &&
      advisory.schoolYearID === schoolYearID &&
      advisory.facultyID
    );
  
    if (classAlreadyAssigned) {
      toast.warning("This section already has an assigned faculty for the selected school year.");
      return;
    }
  
    const facultyAlreadyAssigned = advisoryClasses.some(advisory =>
      advisory.facultyID === facultyID &&
      advisory.schoolYearID === schoolYearID
    );
  
    if (facultyAlreadyAssigned) {
      toast.warning("This faculty is already assigned to another section in the selected school year.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/Pages/admin-create-advisory', 
        createFormData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
  
      toast.success("Advisory class successfully created!");
      
      // Reset form and close modal immediately
      setCreateFormData({
        classID: "",
        facultyID: "",
        schoolYearID: ""
      });
      document.getElementById("create_modal").close();
      
      // Refresh data and navigate
      await fetchAdvisoryClasses();
      navigate("/admin-create-advisory"); // Navigate to the same page to refresh
  
    } catch (error) {
      console.error("Server error:", error);
      const message = error.response?.data?.error || "Server error occurred. Please try again later.";
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
    const classInfo = classes.find(c => c.ClassID === advisory.classID) || {};
    const facultyInfo = faculties.find(f => f.FacultyID === advisory.facultyID) || {};
    
    return (
      (advisory.advisoryID?.toString() || "").includes(searchTerm) ||
      (advisory.classID?.toString() || "").includes(searchTerm) ||
      (classInfo.Grade?.toString() || "").includes(searchTerm) ||
      (classInfo.Section || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facultyInfo.FirstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facultyInfo.LastName || "").toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold mb-6">Assign Faculty to Advisory Classes</h1>
          
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
              <div className="modal-box max-w-md">
                <h3 className="font-bold text-lg mb-5">Create Advisory Class</h3>
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
                      {classes.map(cls => (
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
                      {faculties.map(faculty => (
                        <option key={faculty.FacultyID} value={faculty.FacultyID}>
                          {faculty.FacultyID} - {faculty.LastName}, {faculty.FirstName}
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
                      {schoolYears.map(year => (
                        <option key={year.school_yearID} value={year.school_yearID}>
                          {year.school_yearID} - {year.SchoolYear}
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
                      {faculties.map(faculty => (
                        <option key={faculty.FacultyID} value={faculty.FacultyID}>
                          {faculty.FacultyID} - {faculty.LastName}, {faculty.FirstName}
                        </option>
                      ))}
                    </select>
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
                        Loading advisory classes...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredAdvisoryClasses.length > 0 ? (
                    filteredAdvisoryClasses.map((advisory) => {
                      const classInfo = classes.find(c => c.ClassID === advisory.classID) || {};
                      const facultyInfo = faculties.find(f => f.FacultyID === advisory.facultyID) || {};
                      
                      return (
                        <tr key={advisory.advisoryID} className="border-b">
                          <td className="px-4 py-2">{advisory.advisoryID}</td>
                          <td className="px-4 py-2">
                            {classInfo.Grade ? `Grade ${classInfo.Grade} - ${classInfo.Section}` : 'N/A'}
                          </td>
                          <td className="px-4 py-2">
                            {facultyInfo.FirstName ? `${facultyInfo.FacultyID} - ${facultyInfo.LastName}, ${facultyInfo.FirstName}` : 'N/A'}
                          </td>
                          <td className="px-4 py-2">
                            <button 
                              onClick={() => handleViewStudents(advisory.advisoryID)} 
                              className="bg-green-600 text-white px-3 py-1 mr-2 rounded hover:bg-green-700 text-sm"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdvisory;
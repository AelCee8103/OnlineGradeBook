import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import AdminSidePanel from "../Components/AdminSidePanel";
import NavbarAdmin from "../Components/NavbarAdmin";

const ManageFaculty = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [newFaculty, setNewFaculty] = useState({
    LastName: "", 
    FirstName: "", 
    MiddleName: "", 
    Email: "", 
    Department: "",
    Password: "",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const facultyPerPage = 5;

  const fetchUser = async () => {
    try {
      // Only call the correct endpoint for faculty data
      const response = await axios.get("http://localhost:3000/Pages/admin-manage-faculty");
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Optionally show a toast or handle error
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);
  

  // Form handlers
  const handleChanges = (e) => {
    setNewFaculty({ ...newFaculty, [e.target.name]: e.target.value });
  };

  const handleEditChanges = (e) => {
    setEditingFaculty({
      ...editingFaculty,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = (faculty) => {
    setEditingFaculty(faculty);
    setIsEditMode(true);
    document.getElementById('facultyedit_modal').showModal();
  };

  const fetchFaculty = async () => {
    try {
      const response = await axios.get("http://localhost:3000/Pages/admin-manage-faculty");
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      
    // Check all required fields
    if (!newFaculty.LastName || !newFaculty.FirstName || !newFaculty.Email || !newFaculty.Password) {
      toast.error("Please fill in all required fields!");
      return;
    }
  
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newFaculty.Email)) {
      toast.error("Please enter a valid email address!");
      return;
    }
  
    // Validate password length
    if (newFaculty.Password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:3000/auth/admin-manage-faculty", newFaculty);
        
      if (response.data.exists) {
        toast.error("Faculty ID already exists!");
        return;
      }
  
      toast.success("Faculty added successfully!");
  
      // Reset input fields
      setNewFaculty({
        LastName: "",
        FirstName: "",
        MiddleName: "",
        Email: "",
        Department: "",
        Password: "",
      });
  
      document.getElementById('faculty_modal').close();
      fetchFaculty();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message || "Error adding faculty!");
      } else {
        console.error("Error adding faculty:", error);
        toast.error("Failed to add faculty. Please try again.");
      }
    }
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
  
    // Check required fields for edit form
    if (!editingFaculty.LastName || !editingFaculty.FirstName || !editingFaculty.Email) {
      toast.error("Please fill in all required fields!");
      return;
    }
  
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingFaculty.Email)) {
      toast.error("Please enter a valid email address!");
      return;
    }
  
    try {
      await axios.put(`http://localhost:3000/Pages/admin-manage-faculty`, editingFaculty);
      toast.success("Faculty updated successfully!");
      document.getElementById('facultyedit_modal').close();
      fetchFaculty();
    } catch (error) {
      console.error("Error updating faculty:", error);
      toast.error("Failed to update faculty. Please try again.");
    }
  };
  
  

  // Pagination logic
  const filteredFaculty = faculty.filter(f => 
    f.FacultyID.toString().includes(searchTerm) ||
    f.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.FirstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastFaculty = currentPage * facultyPerPage;
  const indexOfFirstFaculty = indexOfLastFaculty - facultyPerPage;
  const currentFaculty = filteredFaculty.slice(indexOfFirstFaculty, indexOfLastFaculty);
  const totalPages = Math.ceil(filteredFaculty.length / facultyPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
        <AdminSidePanel isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
            <ToastContainer 
               position="top-right"
               autoClose={2000}  // 3 seconds
               hideProgressBar={false}
               newestOnTop={false}
               closeOnClick
               rtl={false}
               pauseOnFocusLoss={false}
               draggable
               pauseOnHover={false}
            />
        

        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Manage Faculty</h1>
          
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by ID or name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow"
              />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />
              <button 
                className="btn bg-blue-500 hover:bg-blue-600 text-white ml-3" 
                onClick={() => document.getElementById('faculty_modal').showModal()}
              >
                Add Faculty
              </button>
            </div>

            {/* Add Faculty Modal */}
            <dialog id="faculty_modal" className="modal">
              <div className="modal-box rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  Add Faculty Information
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-1" htmlFor="LastName">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="LastName"
                        id="LastName"
                        value={newFaculty.LastName}
                        onChange={handleChanges}
                        placeholder="Enter Last Name"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-1" htmlFor="FirstName">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="FirstName"
                        id="FirstName"
                        value={newFaculty.FirstName}
                        onChange={handleChanges}
                        placeholder="Enter First Name"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-1" htmlFor="MiddleName">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        name="MiddleName"
                        id="MiddleName"
                        value={newFaculty.MiddleName}
                        onChange={handleChanges}
                        placeholder="Enter Middle Name (optional)"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col">
                      <label className="text-sm text-gray-600 mb-1" htmlFor="Email">
                        Email
                      </label>
                      <input
                        type="email"
                        name="Email"
                        id="Email"
                        value={newFaculty.Email}
                        onChange={handleChanges}
                        placeholder="Enter Email"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col">
                      <label className="text-sm text-gray-600 mb-1" htmlFor="Email">
                        Password
                      </label>
                      <input
                        type="password"
                        name="Password"
                        id="Password"
                        value={newFaculty.Password}
                        onChange={handleChanges}
                        placeholder="Enter Password "
                        className="input input-bordered w-full"
                      />
                    </div>
                  </div>

                  <div className="modal-action mt-6 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                      onClick={() => document.getElementById('faculty_modal').close()}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn bg-green-600 hover:bg-green-700 text-white"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </dialog>


            {/* Edit Faculty Modal */}
            <dialog id="facultyedit_modal" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Edit Faculty Information</h3>
                {editingFaculty && (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <input 
                      type="number" 
                      name="FacultyID" 
                      value={editingFaculty.FacultyID || ''}
                      onChange={handleEditChanges}
                      className="input input-bordered w-full" 
                      disabled
                    />
                    <input 
                      type="text" 
                      name="LastName" 
                      value={editingFaculty.LastName || ''}
                      onChange={handleEditChanges}
                      className="input input-bordered w-full" 
                      required 
                    />
                    <input 
                      type="text" 
                      name="FirstName" 
                      value={editingFaculty.FirstName || ''}
                      onChange={handleEditChanges}
                      className="input input-bordered w-full" 
                      required 
                    />
                    <input 
                      type="text" 
                      name="MiddleName" 
                      value={editingFaculty.MiddleName || ''}
                      onChange={handleEditChanges}
                      className="input input-bordered w-full" 
                    />
                    <input 
                      type="email" 
                      name="Email" 
                      value={editingFaculty.Email || ''}
                      onChange={handleEditChanges}
                      className="input input-bordered w-full" 
                    />
                    <div className="modal-action">
                      <button type="submit" className="btn bg-green-700 text-white">Update</button>
                      <button 
                        type="button" 
                        className="btn"
                        onClick={() => document.getElementById('facultyedit_modal').close()}
                      >
                        Close
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </dialog>

            {/* Faculty Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2">Faculty ID</th>
                    <th className="px-4 py-2">Last Name</th>
                    <th className="px-4 py-2">First Name</th>
                    <th className="px-4 py-2">Middle Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFaculty.length > 0 ? (
                    currentFaculty.map((faculty, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{faculty.FacultyID}</td>
                        <td className="px-4 py-2">{faculty.LastName}</td>
                        <td className="px-4 py-2">{faculty.FirstName}</td>
                        <td className="px-4 py-2">{faculty.MiddleName || '-'}</td>
                        <td className="px-4 py-2">{faculty.Email || '-'}</td>
                        <td className="px-4 py-2">
                          <button className=" bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm mr-4">Archive</button>
                          <button 
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            onClick={() => handleEditClick(faculty)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">No faculty found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between mt-4">
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1} 
                className="btn"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages} 
                className="btn bg-blue-500 hover:bg-blue-600 text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFaculty;
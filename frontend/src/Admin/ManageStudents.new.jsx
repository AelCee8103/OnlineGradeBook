import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAxios } from "../utils/axiosConfig";

const ManageStudents = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate(); 
  const [searchTerm, setSearchTerm] = useState("");
  const http = useAxios(); // Use our custom axios instance with interceptors

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  // Student form state
  const [student, setStudent] = useState({
    StudentID: '',
    LastName: '',
    FirstName: '',
    MiddleName: '',
  });

  const [selectedStudent, setSelectedStudent] = useState({
    StudentID: '',
    LastName: '',
    FirstName: '',
    MiddleName: '',
  });

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const filteredStudents = students.filter((student) =>
    student.StudentID.toString().includes(searchTerm) ||
    student.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.FirstName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Function to authenticate the user
  const authenticateUser = async () => {
    try {
      await http.get("/auth/admin-manage-students");
      console.log("User Authenticated");
    } catch (error) {
      console.error("Error authenticating user:", error);
      // Handled by axios interceptor
    }
  };

  // Function to fetch all students
  const fetchStudents = async () => {
    try {
      const response = await http.get("/Pages/admin-manage-students");
      setStudents(response.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Failed to load students data. Please try again.");
    }
  };

  useEffect(() => {
    authenticateUser();
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!student.StudentID || !student.LastName || !student.FirstName || !student.MiddleName) {
      toast.error("Please fill in all required fields.");
      return;
    }
  
    try {
      const res = await http.post('/Pages/admin-manage-students', student);
      console.log(res);
      
      // ✅ Update the students state with the new student
      setStudents(prevStudents => [...prevStudents, student]);

      document.getElementById('my_modal_5').close(); // Optional: Close modal after submission
      setStudent({ StudentID: '', LastName: '', FirstName: '', MiddleName: ''}); // Reset form

      toast.success('Student added successfully!');
    } catch (error) {
      console.error("Error adding student:", error);
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message || "Student ID already exists!");
      } else {
        toast.error("Failed to add student. Please try again.");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await http.put(`/Pages/admin-manage-students`, selectedStudent);
      toast.success("Student updated successfully!");

      // Update the students list
      setStudents(students.map(s => (s.StudentID === selectedStudent.StudentID ? selectedStudent : s)));

      // Close modal
      document.getElementById('edit_modal').close();
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student.");
    }
  };

  // Function to handle clicking the Edit button
  const handleEditClick = (student) => {
    setSelectedStudent(student);
    document.getElementById('edit_modal').showModal();
  };

  // Function to update the input fields when editing
  const handleEditChange = (e) => {
    setSelectedStudent({ ...selectedStudent, [e.target.name]: e.target.value });
  };
                      
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
    {/* Sidebar */}
    <AdminSidePanel
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
    />

    {/* Mobile Overlay */}
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
        onClick={() => setIsSidebarOpen(false)}
      ></div>
    )}

  {/* Main Content */}
  <div className="flex-1 flex flex-col overflow-auto">
    <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

    <ToastContainer 
       position="top-right"
       autoClose={2000}  // 2 seconds
       hideProgressBar={false}
       newestOnTop={false}
       closeOnClick
       rtl={false}
       pauseOnFocusLoss={false}
       draggable
       pauseOnHover={false}
    />
      
    {/* Manage Students Content */}
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Students</h1>

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div className="relative w-full md:w-auto mb-3 md:mb-0">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 w-full md:w-64 border border-gray-300 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition"
            onClick={() => document.getElementById('my_modal_5').showModal()}
          >
            Add Student
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Student ID</th>
                <th className="px-4 py-2 text-left">Last Name</th>
                <th className="px-4 py-2 text-left">First Name</th>
                <th className="px-4 py-2 text-left">Middle Name</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student) => (
                <tr key={student.StudentID} className="border-b">
                  <td className="px-4 py-2">{student.StudentID}</td>
                  <td className="px-4 py-2">{student.LastName}</td>
                  <td className="px-4 py-2">{student.FirstName}</td>
                  <td className="px-4 py-2">{student.MiddleName || "N/A"}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded mx-1"
                      onClick={() => handleEditClick(student)}
                    >
                      Edit
                    </button>
                    
                    {/* Add Modal for Edit Student */}
                    <dialog id="edit_modal" className="modal">
                      <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Student Information</h3>

                        <form onSubmit={handleEditSubmit} className="space-y-3">
                          <input
                            type="number"
                            name="StudentID"
                            value={selectedStudent.StudentID}
                            onChange={handleEditChange}
                            className="input input-bordered w-full"
                            required
                            disabled // Prevent ID changes
                          />
                          <input
                            type="text"
                            name="LastName"
                            value={selectedStudent.LastName}
                            onChange={handleEditChange}
                            className="input input-bordered w-full"
                            required
                          />
                          <input
                            type="text"
                            name="FirstName"
                            value={selectedStudent.FirstName}
                            onChange={handleEditChange}
                            className="input input-bordered w-full"
                            required
                          />
                          <input
                            type="text"
                            name="MiddleName"
                            value={selectedStudent.MiddleName}
                            onChange={handleEditChange}
                            className="input input-bordered w-full"
                            required
                          />
                          <div className="modal-action">
                            <button type="submit" className="btn bg-green-700 text-white">
                              Update
                            </button>
                            <button type="button" className="btn" onClick={() => document.getElementById('edit_modal').close()}>
                              Close
                            </button>
                          </div>
                        </form>
                      </div>
                    </dialog>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Modal for Adding Student */}
  <dialog id="my_modal_5" className="modal">
    <div className="modal-box">
      <form method="dialog">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>

      <h3 className="font-bold text-lg mb-4">Add New Student</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="number"
          name="StudentID"
          value={student.StudentID}
          onChange={handleChange}
          placeholder="Student ID"
          className="input input-bordered w-full"
          required
        />
        <input
          type="text"
          name="LastName"
          value={student.LastName}
          onChange={handleChange}
          placeholder="Last Name"
          className="input input-bordered w-full"
          required
        />
        <input
          type="text"
          name="FirstName"
          value={student.FirstName}
          onChange={handleChange}
          placeholder="First Name"
          className="input input-bordered w-full"
          required
        />
        <input
          type="text"
          name="MiddleName"
          value={student.MiddleName}
          onChange={handleChange}
          placeholder="Middle Name"
          className="input input-bordered w-full"
          required
        />
        <div className="modal-action">
          <button type="submit" className="btn bg-green-700 text-white">
            Add Student
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => document.getElementById('my_modal_5').close()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </dialog>
</div>
);
};

export default ManageStudents;

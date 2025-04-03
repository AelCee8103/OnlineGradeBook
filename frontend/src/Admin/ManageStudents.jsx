import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageStudents = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate(); 
  const [searchTerm, setSearchTerm] = useState("");
  



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

    // Function to fetch all students

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/admin-manage-students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      navigate("/admin-login"); 
    }
  };

  useEffect(() => {
    fetchUser();
    axios.get("http://localhost:3000/Pages/admin-manage-students")
    .then(res => setStudents(res.data))
    .catch(err=> console.log(err));
  
  }, []);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });


  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!student.StudentID || !student.LastName || !student.FirstName || !student.MiddleName) {
      alert("Please fill in all required fields.");
      return;
    }
  
    try {
      const res = await axios.post('http://localhost:3000/Pages/admin-manage-students', student);
      console.log(res);

      
    // ✅ Update the students state with the new student
    setStudents(prevStudents => [...prevStudents, student]);

     
    document.getElementById('my_modal_5').close(); // Optional: Close modal after submission
    setStudent({ StudentID: '', LastName: '', FirstName: '', MiddleName: ''}); // Reset form

    toast.success('Student added successfully!');
      navigate('/admin-manage-students');
     
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message || "Faculty ID already exists!");
      } else {
        console.error("Error adding faculty:", error);
        toast.error("Student ID already exists.");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`http://localhost:3000/Pages/admin-manage-students`, selectedStudent);
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
       autoClose={2000}  // 3 seconds
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

        
            {/* Button to Open Modal */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                <input
                type="text"
                placeholder="Search by ID number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow"
              />
          <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" /> 
          
            <button 
                className="btn bg-blue-500 hover:bg-blue-600 text-white ml-3 "
                onClick={() => document.getElementById('my_modal_5').showModal()}
              >
                Add Student
              </button>
            </div>

              {/* Modal */}
              <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                  <h3 className="font-bold text-lg mb-4">Add Student Information</h3>

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
                      placeholder="FirstName" 
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

                    {/* Action Buttons */}
                    <div className="modal-action">
                      <button type="submit" className="btn bg-green-700 text-white">Submit</button>
                      <form method="dialog">
                        <button className="btn">Close</button>
                      </form>
                 
                    </div>
                  </form>
                </div>
              </dialog>
              <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Student No.</th>
              <th className="px-4 py-2">Last Name</th>
              <th className="px-4 py-2">First Name</th>
              <th className="px-4 py-2">Middle Name</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((data, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2">{data.StudentID}</td>
                <td className="px-4 py-2">{data.LastName}</td>
                <td className="px-4 py-2">{data.FirstName}</td>
                <td className="px-4 py-2">{data.MiddleName}</td>
                <td className="px-4 py-2">
                

                {/* Open the modal using document.getElementById('ID').showModal() method */}
                <button 
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                        onClick={() => handleEditClick(data)}
                      >
                        Edit
                      </button>
                      <dialog id="edit_modal" className="modal modal-bottom sm:modal-middle">
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
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? "bg-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
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

export default ManageStudents;
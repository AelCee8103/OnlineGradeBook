import React, { useState } from "react";
import NavbarFaculty from "../components/NavbarFaculty";
import FacultySidePanel from "../components/FacultySidePanel";
import StatCard from "../components/StatCard.jsx"
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect } from "react";

const Attendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const Navigate = useNavigate();  //  Consistent with your sample
  

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5; // Customize how many students per page

  useEffect(() => {
    // Simulated fetch - Replace this with your actual API call
    setStudents([
      { id: 1, name: "John Doe", studentNumber: "2021001" },
      { id: 2, name: "Jane Smith", studentNumber: "2021002" },
      { id: 3, name: "Alice Johnson", studentNumber: "2021003" },
      { id: 4, name: "Bob Brown", studentNumber: "2021004" },
      { id: 5, name: "Charlie Davis", studentNumber: "2021005" },
      { id: 6, name: "Emma Wilson", studentNumber: "2021006" },
      { id: 7, name: "Michael Miller", studentNumber: "2021007" },
      { id: 8, name: "Olivia Anderson", studentNumber: "2021008" },
      { id: 9, name: "John Doe", studentNumber: "2021001" },
      { id: 10, name: "Jane Smith", studentNumber: "2021002" },
      { id: 11, name: "Alice Johnson", studentNumber: "2021003" },
      { id: 12, name: "Bob Brown", studentNumber: "2021004" },
      { id: 13, name: "Charlie Davis", studentNumber: "2021005" },
      { id: 14, name: "Emma Wilson", studentNumber: "2021006" },
      { id: 15, name: "Michael Miller", studentNumber: "2021007" },
      { id: 16, name: "Olivia Anderson", studentNumber: "2021008" },
      { id: 17, name: "John Doe", studentNumber: "2021001" },
      { id: 18, name: "Jane Smith", studentNumber: "2021002" },
      { id: 19, name: "Alice Johnson", studentNumber: "2021003" },
      { id: 20, name: "Bob Brown", studentNumber: "2021004" },
      { id: 21, name: "Charlie Davis", studentNumber: "2021005" },
      { id: 22, name: "Emma Wilson", studentNumber: "2021006" },
      { id: 23, name: "Michael Miller", studentNumber: "2021007" },
      { id: 24, name: "Olivia Anderson", studentNumber: "2021008" },
    ]);
  }, []);

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/faculty-attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Navigate("/faculty-login");   //  Same logic as your admin sample
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
    <div
      className={`fixed inset-y-0 left-0 w-64 transition-transform duration-300 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 sm:static z-50`}
    >
      <FacultySidePanel 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
    </div>
   
    {/* Overlay Background when Sidebar is open */}
    {isSidebarOpen && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsSidebarOpen(false)}  // Close sidebar when overlay is clicked
      ></div>
    )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar with Sidebar Toggle on Small Screens */}
        <NavbarFaculty toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

         {/* Manage Students Content */}
                 <div className="p-8">
                   <h1 className="text-3xl font-bold mb-6">Attendance</h1>
         
                   {/* Students Table */}
                   <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
                     <input type="text" placeholder="Search by ID number"  className="mb-4 border border-gray-300 rounded-md px-4 py-2"/>
                     <FontAwesomeIcon icon={faMagnifyingGlass}  className="ml-3"/>
         
                   
                     <table className="w-full text-left text-sm">
                       <thead>
                         <tr className="bg-gray-100">
                           <th className="px-4 py-2 text-gray-600">No.</th>
                           <th className="px-4 py-2 text-gray-600">Student Name</th>
                           <th className="px-4 py-2 text-gray-600">Student Number</th>
                           <th className="px-4 py-2 text-gray-600">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {currentStudents.length > 0 ? (
                           currentStudents.map((student, index) => (
                             <tr key={student.id} className="border-b">
                               <td className="px-4 py-2">{indexOfFirstStudent + index + 1}</td>
                               <td className="px-4 py-2">{student.name}</td>
                               <td className="px-4 py-2">{student.studentNumber}</td>
                               <td className="px-4 py-2">
                                 <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
                                   View
                                 </button>
                                
                               </td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                             <td colSpan="4" className="text-center py-4">No students found.</td>
                           </tr>
                         )}
                       </tbody>
                     </table>
         
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

export default Attendance;

import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';


const ValidationRequest = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const Navigate = useNavigate();  //  Consistent with your sample
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5; // Customize how many students per page


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
      const response = await axios.get("http://localhost:3000/auth/admin-validation-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Navigate("/admin-login");   //  Same logic as your admin sample
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/Pages/admin/validation-requests",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequests(response.data.requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
    fetchUser();
  }, []);

  const handleValidationSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
  
      const advisoryId = faculty?.advisoryID; 
      
      if (!advisoryId) {
        alert("No advisory class assigned");
        return;
      }
  
      await axios.post(
        "http://localhost:3000/Pages/faculty/submit-validation",
        { advisoryID: advisoryId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Validation request submitted successfully!");
    } catch (error) {
      console.error("Error submitting validation:", error);
      alert("Failed to submit validation request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessRequest = async (requestID, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/Pages/admin/process-validation",
        { requestID, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh the list
      setRequests(requests.map(req => 
        req.requestID === requestID ? {...req, statusID: action === 'approve' ? 1 : 2} : req
      ));
    } catch (error) {
      console.error("Error processing request:", error);
      alert("Failed to process request");
    }
  };

  const viewStudentGrades = async (requestID) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/Pages/admin/validation-request/${requestID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show the grades in a modal or navigate to a details page
      setSelectedRequest(response.data);
      setShowGradesModal(true);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Failed to fetch grades");
    }
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

        {/* Manage Students Content */}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Validation Request</h1>

          {/* Students Table */}
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input type="text" placeholder="Search by ID number"  className="mb-4 border border-gray-300 rounded-md px-4 py-2"/>
            <FontAwesomeIcon icon={faMagnifyingGlass}  className="ml-3"/>

            <button 
              onClick={handleValidationSubmit}
              disabled={isSubmitting}
              className="ml-4 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
            >
              {isSubmitting ? "Submitting..." : "Validate"}
            </button>
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
              {requests.map((request, index) => (
                  <tr key={request.requestID}>
                    <td>{index + 1}</td>
                    <td>{request.studentName}</td>
                    <td>{request.studentID}</td>
                    <td>
                      <button 
                        onClick={() => handleProcessRequest(request.requestID, 'approve')}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleProcessRequest(request.requestID, 'reject')}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm ml-2"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => Navigate(`/admin/students/${request.studentID}/grades`)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm ml-2"
                      >
                        View Grades
                      </button>
                    </td>
                  </tr>
                ))}
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

export default ValidationRequest;

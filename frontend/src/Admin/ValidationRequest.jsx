import React, { useEffect, useState, useCallback } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// Removed toast imports - using notifications dropdown instead
import { useSocket } from '../context/SocketContext';
import { axiosInstance, useAxios } from '../utils/axiosConfig';

const ValidationRequest = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const socket = useSocket();
  // Use our axios instance with authentication interceptors
  const http = useAxios();

    const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {        alert("Authentication token missing. Please login again.");
        navigate("/admin-login");
        return;
      }

      const response = await http.get(
        "/Pages/admin/validation-requests"
      );

      if (response.data.success) {
        setRequests(response.data.requests);
      } else {
        throw new Error(response.data.message || "Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      console.error("Failed to fetch validation requests:", error);
      // Display error in the UI instead of toast
      const errorMessage = error.response?.data?.message || "Failed to fetch validation requests";
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    // Ensure we always fetch requests even if socket initialization fails
    fetchRequests();
    
    // If we don't have a socket, don't try to use socket functionality
    if (!socket) {
      console.warn("Socket not available, falling back to HTTP only");
      setLoading(false); // Make sure we're not stuck in loading state
      return;
    }
    
    // Define event handlers
    const handleNewRequest = (data) => {      
      // Refresh data from the server - notification is handled by the NotificationDropdown
      fetchRequests();
    };
    
    const handleRequestProcessed = (data) => {
      // This handler is for requests processed by this admin - no notification needed
      console.log(`Request ${data.requestID} processed with action: ${data.action}`);
      fetchRequests();
    };

    const handleInitialRequests = (data) => {
      // Use server-sent data directly
      if (data && data.requests) {
        setRequests(data.requests);
        setLoading(false);
      } else {
        console.warn("Received empty or invalid initial requests data");
        // Ensure we don't stay in loading state
        setLoading(false);
      }
    };
    
    // Add handlers with error handling
    socket.on("newValidationRequest", handleNewRequest);
    socket.on("requestProcessed", handleRequestProcessed);
    socket.on("initialRequests", handleInitialRequests);
    socket.on("socketError", (error) => {
      console.error("Socket error:", error.message);
      // Ensure we don't stay in loading state if socket errors
      setLoading(false);
    });

    try {
      // Request fresh data when component mounts
      console.log("Requesting initial validation requests data...");
      socket.emit("getInitialRequests");
    } catch (error) {
      console.error("Error requesting initial data:", error);
      // Make sure we're not stuck in loading state
      setLoading(false);
    }
        // Add a fallback timeout to ensure we exit the loading state
      const fallbackTimer = setTimeout(() => {
        if (loading) {
          console.warn("Timeout waiting for socket response, exiting loading state");
          setLoading(false);
        }
      }, 5000); // 5 second timeout
    
    // The cleanup function for this useEffect
    return () => {
      clearTimeout(fallbackTimer);
      
      // Make sure socket exists before trying to remove listeners
      if (socket) {
        socket.off("newValidationRequest", handleNewRequest);
        socket.off("requestProcessed", handleRequestProcessed);
        socket.off("initialRequests", handleInitialRequests);
        socket.off("socketError");
      }
    };
  }, [socket, fetchRequests]);

  // Process validation request (approve/reject)
const handleProcessRequest = async (requestID, action, facultyID, advisoryID, grade, section, facultyName) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("No token found - user may be logged out");
      alert("Authentication error. Please log in again.");
      navigate('/admin-login');
      return;
    }
      const response = await http.post(
      "/Pages/admin/process-validation",
      { 
        requestID, 
        action,
        grade,
        section 
      }
    );    if (response.data.success) {
      // Generate appropriate message based on action
      let message = action === 'approve' ? 
        'Your grade validation request has been approved. Please visit the office to finalize your validation status.' :
        'Your grade validation request has been rejected. Please visit the office to discuss your validation status.';
      
      // Only need to inform the server that the request was processed
      console.log(`${action === 'approve' ? 'Approved' : 'Rejected'} request ID: ${requestID}`);
      
      // Update local state optimistically
      setRequests(prev => 
        prev.filter(req => req.requestID !== requestID)
      );
      
      // If socket exists, emit event to refresh data on other clients
      if (socket && socket.connected) {
        try {
          socket.emit("requestProcessed", {
            requestID,
            action,
            processed: true
          });
        } catch (socketError) {
          console.warn("Socket error when emitting requestProcessed:", socketError);
          // Non-critical error, continue without the socket notification
        }
      }
  }} catch (error) {
    console.error("Error processing request:", error);
    
    // Check if it's an authentication error
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("Authentication failed - redirecting to login");
      alert("Your session has expired. Please log in again.");
      
      // Clear all authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("adminID");
      localStorage.removeItem("adminName");
      
      // Use setTimeout to avoid navigation during the error handling
      setTimeout(() => {
        navigate('/admin-login');
      }, 100);
      return;
    }
    
    // Handle network errors
    if (error.message && error.message.includes('Network Error')) {
      alert("Network connection issue. Please check your internet connection and try again.");
      return;
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      alert("Server error. The system is currently unavailable. Please try again later.");
      return;
    }
    
    // Handle other types of errors
    alert("Failed to process validation request. Please try again.");
    
    // Re-fetch to ensure UI matches server state after a short delay
    setTimeout(() => {
      fetchRequests();
    }, 500);
  }
};

  const filteredRequests = requests.filter((request) =>
    request.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Grade ${request.Grade} - ${request.Section}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Removed Toaster - notifications now handled by NotificationDropdown */}
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Validation Requests</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="Search by faculty name or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-md px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={`${request.requestID}-${request.facultyID}`}>
                        <td className="px-6 py-4 whitespace-nowrap">{request.facultyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">Grade {request.Grade} - {request.Section}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.schoolYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.requestDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button                            onClick={() => handleProcessRequest(
                              request.requestID, 
                              'approve', 
                              request.facultyID, 
                              request.advisoryID,
                              request.grade,
                              request.section,
                              request.facultyName
                            )}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                          <button                            onClick={() => handleProcessRequest(
                              request.requestID, 
                              'reject',
                              request.facultyID, 
                              request.advisoryID,
                              request.grade,
                              request.section,
                              request.facultyName
                            )}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No validation requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ValidationRequest;

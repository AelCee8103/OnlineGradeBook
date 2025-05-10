import React, { useEffect, useState, useCallback } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useSocket } from '../context/SocketContext';

const ValidationRequest = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const socket = useSocket();

  
  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token missing");
        navigate("/admin-login");
        return;
      }

      const response = await axios.get(
        "http://localhost:3000/Pages/admin/validation-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setRequests(response.data.requests);
      } else {
        throw new Error(response.data.message || "Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error(error.response?.data?.message || "Failed to fetch validation requests");
    } finally {
      setLoading(false);
    }
  }, [navigate]);


  useEffect(() => {
    fetchRequests();

    if (!socket) return;

    const handleNewRequest = (data) => {
      // Verify the new request with the server before adding to UI
      fetchRequests().then(() => {
        toast.success(`New validation request from ${data.facultyName}`);
      });
    };

    const handleStatusUpdate = (data) => {
      // Always verify with server after status updates
      fetchRequests().then(() => {
        toast.success(`Request ${data.status}ed successfully`);
      });
    };

    const handleInitialRequests = (data) => {
      // Use server-sent data directly
      setRequests(data.requests);
      setLoading(false);
    };

    socket.on("newValidationRequest", handleNewRequest);
    socket.on("validationStatusUpdate", handleStatusUpdate);
    socket.on("initialRequests", handleInitialRequests);
    socket.on("socketError", (error) => {
      toast.error(error.message);
    });

    // Request fresh data when component mounts
    socket.emit("getInitialRequests");

    return () => {
      socket.off("newValidationRequest", handleNewRequest);
      socket.off("validationStatusUpdate", handleStatusUpdate);
      socket.off("initialRequests", handleInitialRequests);
      socket.off("socketError");
    };
  }, [socket, fetchRequests]);


  // In ValidationRequest.jsx
const handleProcessRequest = async (requestID, action, facultyID, advisoryID) => {
  try {
    const token = localStorage.getItem("token");
    
    const response = await axios.post(
      "http://localhost:3000/Pages/admin/process-validation",
      { requestID, action },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success && socket) {
      socket.emit("validationResponse", {
        requestID,
        facultyID,
        advisoryID,
        status: action,
        message: `Your validation request has been ${action}d`,
        timestamp: new Date().toISOString(),
      });
      
      // Update local state optimistically
      setRequests(prev => 
        prev.filter(req => req.requestID !== requestID)
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    toast.error("Failed to process request");
    fetchRequests(); // Re-fetch to ensure UI matches server state
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
      <Toaster position="top-center" />
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
                          <button
                            onClick={() => handleProcessRequest(request.requestID, 'approve', request.facultyID, request.advisoryID)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessRequest(request.requestID, 'reject', request.facultyID, request.advisoryID)}
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

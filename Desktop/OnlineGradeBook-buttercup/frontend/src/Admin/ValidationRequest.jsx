import React, { useEffect, useState, useCallback } from "react";
import NavbarAdmin from "../components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
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
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        setRequests(response.data.requests);
        // Store requests in localStorage for persistence
        localStorage.setItem('validationRequests', JSON.stringify(response.data.requests));
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
    // Load stored requests on mount
    fetchRequests();

    // Authenticate admin socket connection
    if (socket) {
      const adminID = localStorage.getItem('adminID');
      const adminName = localStorage.getItem('adminName');

      if (adminID) {
        socket.emit('authenticate', {
          userType: 'admin',
          userID: adminID,
          adminName: adminName
        });

        // Handle authentication response
        socket.on('authenticated', (response) => {
          if (response.success) {
            console.log('Admin socket authenticated successfully');
          } else {
            console.error('Admin socket authentication failed:', response.error);
            toast.error('Failed to connect to notification service');
          }
        });
      }

      // Listen for new validation requests
      socket.on('newValidationRequest', (data) => {
        console.log('New validation request received:', data);
        // Update requests list with new request
        setRequests(prev => {
          const newRequest = {
            requestID: data.requestID,
            facultyID: data.facultyID,
            facultyName: data.facultyName,
            Grade: data.grade,
            Section: data.section,
            schoolYear: data.schoolYear,
            advisoryID: data.advisoryID,
            requestDate: new Date().toLocaleString()
          };
          return [newRequest, ...prev];
        });

        // Show detailed toast notification
        toast.custom(
          <div className="bg-blue-600 text-white p-4 rounded shadow-lg">
            <p className="font-bold">New Validation Request</p>
            <p>Faculty: {data.facultyName}</p>
            <p>Class: Grade {data.grade} - {data.section}</p>
          </div>,
          { duration: 5000 }
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('authenticated');
        socket.off('newValidationRequest');
      }
    };
  }, [socket, fetchRequests]);

  const handleProcessRequest = async (requestID, action, facultyID, advisoryID) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3000/Pages/admin/process-validation",
        { requestID, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Find the request to get full data before removing it
        const request = requests.find(req => req.requestID === requestID);
        
        // Remove processed request from list
        setRequests(prev => prev.filter(req => req.requestID !== requestID));
        
        // Emit socket event for faculty notification with all necessary data
        if (socket && request) {
          console.log("Sending validation response to faculty:", {
            requestID,
            facultyID,
            action
          });
          
          socket.emit('validationResponse', {
            requestID: requestID,
            facultyID: facultyID,
            advisoryID: advisoryID,
            status: action,
            message: `Your grade validation request for Grade ${request.Grade} - ${request.Section} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
            timestamp: new Date().toISOString(),
            Grade: request.Grade,
            Section: request.Section,
            schoolYear: request.schoolYear
          });
          
          // Show success notification to admin
          toast.custom(
            <div className={action === 'approve' ? 'bg-green-600 text-white p-4 rounded shadow-lg' : 'bg-red-600 text-white p-4 rounded shadow-lg'}>
              <p className="font-bold">{action === 'approve' ? 'Request Approved' : 'Request Rejected'}</p>
              <p>Faculty: {request.facultyName}</p>
              <p className="text-sm mt-1">
                Class: Grade {request.Grade} - {request.Section}
              </p>
            </div>,
            { duration: 4000 }
          );
        }
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("Failed to process request");
    }
  };

  const filteredRequests = requests.filter(request => 
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
              <div className="p-4 border-b flex justify-between items-center">
                <div className="relative max-w-md w-full">
                  <input
                    type="text"
                    placeholder="Search by faculty name or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute right-3 top-3 text-gray-400" />
                </div>
                <button 
                  onClick={fetchRequests} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </button>
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
                      <tr key={request.requestID}>
                        <td className="px-6 py-4 whitespace-nowrap">{request.facultyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">Grade {request.Grade} - {request.Section}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.schoolYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.requestDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleProcessRequest(
                              request.requestID, 
                              'approve', 
                              request.facultyID,
                              request.advisoryID
                            )}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessRequest(
                              request.requestID, 
                              'reject', 
                              request.facultyID,
                              request.advisoryID
                            )}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Reject
                          </button>
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            onClick={() =>
                              navigate(
                                `/admin/advisory/${request.advisoryID}/students`
                              )
                            }
                          >
                            View Students
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

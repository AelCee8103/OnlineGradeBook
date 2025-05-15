import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidePanel from '../Components/AdminSidePanel';
import NavbarAdmin from '../Components/NavbarAdmin';
import { useSocket } from '../context/SocketContext';
import { useAxios } from '../utils/axiosConfig';

const ValidationRequest = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const socket = useSocket();
  const http = useAxios();
  
  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await http.get("/Pages/admin/validation-requests");
      if (response.data.success) {
        setRequests(response.data.requests);
      } else {
        console.error("Failed to fetch requests:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate, http]);

  useEffect(() => {
    // Initial data fetch
    fetchRequests();

    if (!socket) return;

    // Socket event handlers
    const handleNewRequest = () => {
      console.log('New validation request received');
      fetchRequests();
    };

    const handleRequestProcessed = () => {
      console.log('Request processed by another admin');
      fetchRequests();
    };

    // Setup socket listeners
    socket.on("newValidationRequest", handleNewRequest);
    socket.on("requestProcessed", handleRequestProcessed);
    socket.on("socketError", (error) => {
      console.error("Socket error:", error);
    });

    // Cleanup socket listeners
    return () => {
      socket.off("newValidationRequest", handleNewRequest);
      socket.off("requestProcessed", handleRequestProcessed);
      socket.off("socketError");
    };
  }, [socket, fetchRequests]);

  // Process validation request (approve/reject)
  const handleProcessRequest = async (requestID, action, facultyID, advisoryID, grade, section, facultyName) => {
    try {
      const response = await http.post('/Pages/admin/process-validation', {
        requestID,
        action
      });

      if (response.data.success) {
        // Update local state immediately
        setRequests(prev => prev.filter(req => req.requestID !== requestID));
        
        // Emit socket event for real-time updates
        if (socket) {
          const adminName = localStorage.getItem('adminName');
          const adminID = localStorage.getItem('adminID');
          
          socket.emit('validationResponse', {
            requestID,
            action,
            facultyID,
            advisoryID,
            grade,
            section,
            facultyName,
            adminName,
            adminID
          });
        }
      }
    } catch (error) {
      console.error('Error processing validation request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process validation request';
      alert(errorMessage);
    }
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter((request) =>
    request.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Grade ${request.Grade} - ${request.Section}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
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
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => (
                        <tr key={`${request.requestID}-${request.facultyID}`}>
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
                                request.advisoryID,
                                request.Grade,
                                request.Section,
                                request.facultyName
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
                                request.advisoryID,
                                request.Grade,
                                request.Section,
                                request.facultyName
                              )}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
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
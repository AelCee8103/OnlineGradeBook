import React, { useEffect, useState, useCallback } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
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

      // Check if we have cached data while waiting for the API response
      const cachedRequests = localStorage.getItem('validationRequests');
      if (cachedRequests) {
        try {
          const parsedRequests = JSON.parse(cachedRequests);
          setRequests(parsedRequests);
          console.log('Using cached validation requests while fetching from server');
        } catch (e) {
          console.error('Error parsing cached requests:', e);
        }
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
        console.log('Fetched validation requests from server:', response.data.requests);
        setRequests(response.data.requests);
        // Store requests in localStorage for persistence
        localStorage.setItem('validationRequests', JSON.stringify(response.data.requests));
        // Force refresh of UI
        setRefreshKey(Date.now());
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
  // First useEffect: Handle authentication when socket is available
  useEffect(() => {
    if (!socket) return;
    
    const adminID = localStorage.getItem('adminID');
    const adminName = localStorage.getItem('adminName');
    
    if (adminID) {
      // Authenticate the socket as admin
      socket.emit('authenticate', {
        userType: 'admin',
        userID: adminID,
        adminName: adminName
      });
      
      // Handle authentication response
      const handleAuthenticated = (response) => {
        if (response.success) {
          console.log('Admin socket authenticated successfully');
        } else {
          console.error('Admin socket authentication failed:', response.error);
          toast.error('Failed to connect to notification service');
        }
      };
      
      socket.on('authenticated', handleAuthenticated);
      
      return () => {
        socket.off('authenticated', handleAuthenticated);
      };
    }
  }, [socket]);
  // Second useEffect: Register socket event for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for new validation requests
    const handleNewValidationRequest = (data) => {
      console.log('Received new validation request:', data);
      
      // Force UI update with new data
      setRequests(prev => {
        // Prevent duplicates
        if (prev.some(r => r.requestID === data.requestID)) return prev;
        
        const newRequest = {
          requestID: data.requestID,
          facultyID: data.facultyID,
          facultyName: data.facultyName,
          Grade: data.grade,
          Section: data.section,
          schoolYear: data.schoolYear,
          advisoryID: data.advisoryID,
          requestDate: data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()
        };
        
        console.log('Adding new validation request to state:', newRequest);
        
        // Add new request at the beginning of the array and create a new array reference
        const updatedRequests = [newRequest, ...prev];
        
        // Store in localStorage for persistence between page refreshes
        localStorage.setItem('validationRequests', JSON.stringify(updatedRequests));
        
        return updatedRequests;
      });
      
      toast.info(`New validation request from ${data.facultyName}`);
    };
    
  // Handler for when another admin processes a request
    const handleRequestProcessed = (data) => {
      console.log('Request processed by another admin:', data);
      
      // Remove the processed request from the list with real-time notification
      setRequests(prev => {
        const updatedRequests = prev.filter(req => req.requestID !== data.requestID);
        
        // Update localStorage
        localStorage.setItem('validationRequests', JSON.stringify(updatedRequests));
        
        // Show notification with status-based styling
        if (data.status === 'approve' || data.status === 'approved') {
          toast.success(`Request from ${data.facultyName} was approved by ${data.processingAdminName || 'another admin'}`, {
            icon: '✓',
            style: {
              borderLeft: '6px solid #10B981', // green border
            }
          });
        } else {
          toast.error(`Request from ${data.facultyName} was rejected by ${data.processingAdminName || 'another admin'}`, {
            icon: '✗',
            style: {
              borderLeft: '6px solid #EF4444', // red border
            }
          });
        }
        
        return updatedRequests;
      });
      
      // Update the refresh key to force a re-render
      setRefreshKey(Date.now());
    };    // Register event listeners
    console.log('Registering socket event listeners');
    socket.on('newValidationRequest', handleNewValidationRequest);
    socket.on('requestProcessed', handleRequestProcessed);
    socket.on('validationStatusUpdate', handleRequestProcessed); // Also listen for general status updates
    
    // Emit a request to get all pending validations if needed
    if (requests.length === 0) {
      console.log('No cached requests - requesting pending validations from server');
      socket.emit('getPendingValidations');
    }
    
    // Verify connection status
    if (socket.connected) {
      console.log('Socket is connected');
    } else {
      console.log('Socket is not connected');
      // Try to initiate connection if not already connected
      socket.connect();
    }
    
    // Cleanup function
    return () => {
      console.log('Removing socket event listeners');
      socket.off('newValidationRequest', handleNewValidationRequest);
      socket.off('requestProcessed', handleRequestProcessed);
      socket.off('validationStatusUpdate', handleRequestProcessed);
    };
  }, [socket]);
  // Third useEffect: Fetch initial requests
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);  const handleProcessRequest = async (requestID, action, facultyID, advisoryID) => {
    try {
      // Show loading state with custom icon based on action type
      toast.loading(
        <div className="flex items-center">
          <div className="mr-2 text-xl">{action === 'approve' ? '✓' : '✗'}</div>
          <div>
            <p className="font-bold">{`${action === 'approve' ? 'Approving' : 'Rejecting'} Request`}</p>
            <p className="text-sm">Processing your action...</p>
          </div>
        </div>, 
        { 
          id: `process-${requestID}`,
          style: {
            borderLeft: `6px solid ${action === 'approve' ? '#10B981' : '#EF4444'}`,
          }
        }
      );
      
      // Optimistic UI update - mark the request as being processed
      setRequests(prev => prev.map(req => 
        req.requestID === requestID ? { ...req, processing: true } : req
      ));
      
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3000/Pages/admin/process-validation",
        { requestID, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Enhanced success notification with styled toast
        toast.success(
          <div className="flex items-center">
            <div className="mr-2 text-xl">{action === 'approve' ? '✓' : '✗'}</div>
            <div>
              <p className="font-bold">{action === 'approve' ? 'Grades Approved!' : 'Grades Rejected'}</p>
              <p className="text-sm">{`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`}</p>
            </div>
          </div>, 
          { 
            id: `process-${requestID}`,
            duration: 3000,
            style: {
              borderLeft: `6px solid ${action === 'approve' ? '#10B981' : '#EF4444'}`,
            }
          }
        );
        
        // Remove processed request from list
        setRequests(prev => prev.filter(req => req.requestID !== requestID));
        
        // Update localStorage
        const updatedRequests = JSON.parse(localStorage.getItem('validationRequests') || '[]')
          .filter(req => req.requestID !== requestID);
        localStorage.setItem('validationRequests', JSON.stringify(updatedRequests));
        
        // Update the refresh key to force a re-render
        setRefreshKey(Date.now());
          // Get admin name
        const adminName = localStorage.getItem('adminName') || 'Administrator';
        const adminID = localStorage.getItem('adminID');        // Emit socket event for faculty notification with enhanced data
        console.log(`Sending validation response to faculty ${facultyID}`);
        socket.emit('validationResponse', {
          requestID,
          facultyID,
          advisoryID,
          adminID,
          adminName,
          status: action,
          message: `Request ${action}ed successfully by ${adminName}`,
          timestamp: new Date().toISOString(),
          forFaculty: true,  // Flag that this is meant for faculty users
          forAdmin: false,   // Not primarily for admins
          isRealTime: true   // Flag for real-time notification
        });
      } else {
        // Error notification
        toast.error(`Failed to ${action} request`, { id: `process-${requestID}` });
        
        // Reset processing state
        setRequests(prev => prev.map(req => 
          req.requestID === requestID ? { ...req, processing: false } : req
        ));
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error(`Error: ${error.response?.data?.message || 'Failed to process request'}`, {
        id: `process-${requestID}`
      });
      
      // Reset processing state
      setRequests(prev => prev.map(req => 
        req.requestID === requestID ? { ...req, processing: false } : req
      ));
    }
  };
  // Add a timestamp to force re-render when requests change
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Update refresh key whenever requests state changes
  useEffect(() => {
    setRefreshKey(Date.now());
  }, [requests]);
  
  const filteredRequests = requests.filter(request => 
    request.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Grade ${request.Grade} - ${request.Section}`.toLowerCase().includes(searchTerm.toLowerCase())
  );  // Auto-refresh mechanism
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Add automatic refresh every 30 seconds as a fallback
  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeElapsed = Date.now() - lastRefresh;
      // Only refresh if it's been more than 30 seconds since the last refresh
      if (timeElapsed > 30000) {
        console.log('Auto-refreshing validation requests...');
        fetchRequests();
        setLastRefresh(Date.now());
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchRequests, lastRefresh]);
  
  // Add a manual refresh button
  const handleManualRefresh = () => {
    fetchRequests();
    setLastRefresh(Date.now());
    toast.success('Refreshing validation requests...');
  }

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
          <div className="container mx-auto px-6 py-8">            <div className="flex flex-col space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Validation Requests</h1>
                <button
                  onClick={handleManualRefresh}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
                <div className="flex justify-end text-sm text-gray-500">
                <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
                <span className="ml-2">
                  {socket && socket.connected ? 
                    <span className="flex items-center text-green-600">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                      Real-time updates active
                    </span> 
                    : 
                    <span className="flex items-center text-amber-600">
                      <span className="h-2 w-2 bg-amber-500 rounded-full mr-1"></span>
                      Real-time updates connecting...
                    </span>
                  }
                </span>
              </div>
              
              {/* Add instruction text for clarity */}
              <p className="text-sm text-gray-600">
                When you approve or reject a validation request, the faculty will be notified in real-time.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="Search by faculty name or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-md px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>              <div className="overflow-x-auto">
                {/* Adding key={refreshKey} to force re-render when data changes */}
                <table className="min-w-full divide-y divide-gray-200" key={refreshKey}>
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
                      <tr key={`${request.requestID}-${refreshKey}`}>
                        <td className="px-6 py-4 whitespace-nowrap">{request.facultyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">Grade {request.Grade} - {request.Section}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.schoolYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.requestDate}</td>                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          {request.processing ? (
                            <span className="inline-flex items-center px-3 py-1 rounded bg-gray-200 text-gray-800">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleProcessRequest(
                                  request.requestID, 
                                  'approve', 
                                  request.facultyID,
                                  request.advisoryID
                                )}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-all duration-200 transform hover:scale-105"
                                disabled={request.processing}
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
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-all duration-200 transform hover:scale-105"
                                disabled={request.processing}
                              >
                                Reject
                              </button>
                              <button
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-all duration-200"
                                onClick={() =>
                                  navigate(
                                    `/admin/advisory/${request.advisoryID}/students`
                                  )
                                }
                              >
                                View Students
                              </button>
                            </>
                          )}
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

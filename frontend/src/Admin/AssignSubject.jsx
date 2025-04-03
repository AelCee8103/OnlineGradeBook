import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from "react-toastify";  
import "react-toastify/dist/ReactToastify.css";  

const AssignSubject = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [newAssignedSubject, setNewAssignedSubject] = useState({
    SubjectCode: "",
    FacultyID: "",
    ClassID: ""
  });
  const Navigate = useNavigate();

  useEffect(() => {
    fetchAssignedSubjects();
    fetchClasses();
    fetchSubjects();
    fetchFaculty();
  }, []);

  const fetchAssignedSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/Pages/admin-assign-subject", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedSubjects(response.data);
    } catch (error) {
      console.error("Error fetching assigned subjects:", error);
      toast.error("Failed to fetch assigned subjects");
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/Pages/admin-adivsory-classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/Pages/admin-manage-subject", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/Pages/admin-manage-faculty", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
      toast.error("Failed to fetch faculty");
    }
  };

  const handleAssignedSubjectChange = (e) => {
    const { name, value } = e.target;
    
    // If SubjectCode changes, find and set the corresponding SubjectName
    if (name === "SubjectCode") {
      const selectedSubject = subjects.find(sub => sub.SubjectCode === value);
      setNewAssignedSubject(prev => ({
        ...prev,
        [name]: value,
        SubjectName: selectedSubject ? selectedSubject.SubjectName : ""
      }));
    } else {
      setNewAssignedSubject(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3000/Pages/admin-assign-subject", newAssignedSubject, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Subject assigned successfully! ✅");  
      document.getElementById("assign_subject_modal").close(); 
      fetchAssignedSubjects(); 
      setNewAssignedSubject({ 
        SubjectCode: "", 
        SubjectName: "", 
        FacultyID: "",
        ClassID: ""
      }); 
    } catch (error) {
      console.error("Error assigning subject:", error);
      toast.error(error.response?.data?.error || "Failed to assign subject ❌");  
    }
  };

  const handleDeleteAssignment = async (ClassID, SubjectCode) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/Pages/admin-assign-subject/${ClassID}/${SubjectCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Assignment deleted successfully! ✅");
      fetchAssignedSubjects();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment ❌");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <ToastContainer position="top-right" autoClose={3000} />  

        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Assign Subject to Advisory Class</h1>

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input type="text" placeholder="Search by ID number" className="mb-4 border border-gray-300 rounded-md px-4 py-2" />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />

            <button
              className="ml-4 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              onClick={() => document.getElementById("assign_subject_modal").showModal()}
            >
              ASSIGN SUBJECT
            </button>

            <table className="w-full text-left text-sm mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-gray-600">Class ID</th>
                  <th className="px-4 py-2 text-gray-600">Subject Code</th>
                  <th className="px-4 py-2 text-gray-600">Faculty ID</th>
                  <th className="px-4 py-2 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedSubjects.length > 0 ? (
                  assignedSubjects.map((assignment) => (
                    <tr key={`${assignment.ClassID}-${assignment.SubjectCode}`} className="border-b">
                      <td className="px-4 py-2">{assignment.ClassID}</td>
                      <td className="px-4 py-2">{assignment.SubjectCode}</td>
                      <td className="px-4 py-2">{assignment.FacultyID}</td>
                      <td className="px-4 py-2">
                        <button 
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                          onClick={() => handleDeleteAssignment(assignment.ClassID, assignment.SubjectCode)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">No assigned subjects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <dialog id="assign_subject_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Assign Subject to Advisory Class</h3>
          <form onSubmit={handleAssignSubject} className="space-y-3">
            <select
              name="ClassID"
              value={newAssignedSubject.ClassID}
              onChange={handleAssignedSubjectChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Advisory Class</option>
              {classes.map(cls => (
                <option key={cls.ClassID} value={cls.ClassID}>
                  {`${cls.Grade} - ${cls.Section} (${cls.ClassID})`}
                </option>
              ))}
            </select>

            <select
              name="SubjectCode"
              value={newAssignedSubject.SubjectCode}
              onChange={handleAssignedSubjectChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.SubjectCode} value={subject.SubjectCode}>
                  {`${subject.SubjectCode} - ${subject.SubjectName}`}
                </option>
              ))}
            </select>
            <select
              name="FacultyID"
              value={newAssignedSubject.FacultyID}
              onChange={handleAssignedSubjectChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Faculty</option>
              {faculty.map(fac => (
                <option key={fac.FacultyID} value={fac.FacultyID}>
                  {`${fac.FacultyID} - ${fac.LastName}, ${fac.FirstName}`}
                </option>
              ))}
            </select>

            <div className="modal-action">
              <button type="submit" className="btn bg-green-700 text-white">Submit</button>
              <button type="button" className="btn" onClick={() => document.getElementById("assign_subject_modal").close()}>Close</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default AssignSubject;
import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from "react-toastify";  
import "react-toastify/dist/ReactToastify.css";  

const AssignSubject = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [newAssignedSubject, setNewAssignedSubject] = useState({
    SubjectCode: "",
    subjectID: "",
    FacultyID: "",
    ClassID: "",
    school_yearID: ""  // Changed from schoolyearID to school_yearID
  });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const Navigate = useNavigate();

  useEffect(() => {
    fetchAssignedSubjects();
    fetchClasses();
    fetchSubjects();
    fetchFaculty();
    fetchSchoolYears();
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
      const response = await axios.get("http://localhost:3000/Pages/admin-advisory-classes", {
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

 const fetchSchoolYears = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get("http://localhost:3000/Pages/schoolyear", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("School years data:", response.data); // Add this to check what's being returned

    // Remove duplicates by school_yearID
    const uniqueYears = Array.from(
      new Map(response.data.map(item => [item.school_yearID, item])).values()
    );
    setSchoolYears(uniqueYears);
  } catch (error) {
    console.error("Error fetching school years:", error);
    toast.error("Failed to fetch school years");
  }
};

  const handleAssignedSubjectChange = (e) => {
    const { name, value } = e.target;
    setNewAssignedSubject(prev => ({
      ...prev,
      [name === "schoolyearID" ? "school_yearID" : name]: value
    }));
  
    // Your existing SubjectCode logic
    if (name === "SubjectID" && value) {
      const selectedSubject = subjects.find(sub => sub.SubjectID === value);
      if (selectedSubject && selectedSubject.SubjectCode) {
        setNewAssignedSubject(prev => ({
          ...prev,
          SubjectCode: selectedSubject.SubjectCode
        }));
      }
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newAssignedSubject.SubjectCode || 
        !newAssignedSubject.subjectID || 
        !newAssignedSubject.FacultyID || 
        !newAssignedSubject.ClassID || 
        !newAssignedSubject.school_yearID) {
      toast.error("Please fill all required fields");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token missing");
        Navigate("/login");
        return;
      }
  
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
  
      const payload = {
        SubjectCode: newAssignedSubject.SubjectCode,
        subjectID: newAssignedSubject.subjectID,
        FacultyID: newAssignedSubject.FacultyID,
        ClassID: newAssignedSubject.ClassID,
        school_yearID: newAssignedSubject.school_yearID
      };
  
      let response;
      if (editingAssignment) {
        // Update existing assignment
        response = await axios.put(
          `http://localhost:3000/Pages/admin-assign-subject/${editingAssignment.ClassID}/${editingAssignment.SubjectCode}`,
          payload,
          config
        );
      } else {
        // Create new assignment
        response = await axios.post(
          "http://localhost:3000/Pages/admin-assign-subject",
          payload,
          config
        );
      }
  
      // Show success message
      toast.success(`Subject assignment ${editingAssignment ? 'updated' : 'added'} successfully! ✅`, {
        autoClose: 3000
      });
  
      // Close modal and reset form
      document.getElementById("assign_subject_modal").close();
      setNewAssignedSubject({
        SubjectCode: "",
        subjectID: "",
        FacultyID: "",
        ClassID: "",
        school_yearID: ""
      });
      
      // Refresh data and clear editing state
      fetchAssignedSubjects();
      setEditingAssignment(null);
  
    } catch (error) {
      console.error("Assignment error:", error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          toast.error(data.error || "Validation failed. Please check your inputs.");
        } else if (status === 401) {
          toast.error("Session expired. Please login again.");
          Navigate("/login");
        } else if (status === 409) {
          toast.error("This subject is already assigned to this class.");
        } else {
          toast.error(data.error || `Failed to ${editingAssignment ? 'update' : 'assign'} subject`);
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setNewAssignedSubject({
      SubjectCode: assignment.SubjectCode,
      subjectID: assignment.subjectID,
      FacultyID: assignment.FacultyID,
      ClassID: assignment.ClassID,
      schoolyearID: assignment.yearID || assignment.schoolyearID,
    });
    document.getElementById("assign_subject_modal").showModal();
  };

  const handleDeleteAssignment = async (ClassID, SubjectCode) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
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
          <h1 className="text-3xl font-bold mb-6">Assign Subject to Faculty</h1>

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input type="text" placeholder="Search by ID number" className="mb-4 border border-gray-300 rounded-md px-4 py-2" />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />

            <button
              className="ml-4 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              onClick={() => {
                setEditingAssignment(null);
                setNewAssignedSubject({ 
                  SubjectCode: "",
                  subjectID: "", 
                  FacultyID: "",
                  ClassID: "",
                  schoolyearID: "",
                });
                document.getElementById("assign_subject_modal").showModal();
              }}
            >
              ASSIGN SUBJECT
            </button>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
              <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2">Subject Code</th>
                      <th className="px-4 py-2">Subject ID</th>
                      <th className="px-4 py-2">Class</th>
                      <th className="px-4 py-2">Faculty</th>
                      <th className="px-4 py-2">School Year ID</th>
                      <th className="px-4 py-2">School Year</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedSubjects.map((assignment) => (
                      <tr key={`${assignment.ClassID}-${assignment.SubjectCode}`} className="border-b">
                        <td className="px-4 py-2">{assignment.SubjectCode}</td>
                        <td className="px-4 py-2">{assignment.subjectID}</td>
                        <td className="px-4 py-2">
                          {assignment.Grade}-{assignment.Section} ({assignment.ClassID})
                        </td>
                        <td className="px-4 py-2">{assignment.FacultyID}</td>
                        <td className="px-4 py-2">{assignment.yearID}</td> {/* Changed from school_yearID to yearID */}
                        <td className="px-4 py-2">
                          {assignment.SchoolYear || 
                          schoolYears.find(y => y.school_yearID === assignment.yearID)?.SchoolYear}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="mr-2 text-blue-600 hover:text-blue-800"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.ClassID, assignment.SubjectCode)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <dialog id="assign_subject_modal" className="modal z-[9999]">
        <div className="modal-box relative max-w-2xl" style={{ overflow: 'visible' }}>
          <h3 className="font-bold text-lg mb-6">
            {editingAssignment ? "Edit Subject Assignment" : "Assign Subject to Advisory Class"}
          </h3>
          <form onSubmit={handleAssignSubject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Code */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input 
                  type="text" 
                  name="SubjectCode"
                  value={newAssignedSubject.SubjectCode}
                  onChange={handleAssignedSubjectChange}
                  placeholder="Enter Subject Code" 
                  className="input input-bordered w-full" 
                  required
                />
              </div>

              {/* Advisory Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advisory Class</label>
                <select
                  name="ClassID"
                  value={newAssignedSubject.ClassID}
                  onChange={handleAssignedSubjectChange}
                  className="select select-bordered w-full"
                  required
                  disabled={!!editingAssignment}
                >
                  <option value="">Select Advisory Class</option>
                  {classes.map(cls => (
                    <option key={cls.ClassID} value={cls.ClassID}>
                      {`${cls.Grade} - ${cls.Section} (${cls.ClassID})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  name="subjectID"
                  value={newAssignedSubject.SubjectID}
                  onChange={handleAssignedSubjectChange}
                  className="select select-bordered w-full"
                  required
                  disabled={!!editingAssignment}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.SubjectID} value={subject.SubjectID}>
                      {`${subject.SubjectID} - ${subject.SubjectName}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
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
              </div>

             {/* School Year Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                <select
                  name="school_yearID"
                  value={newAssignedSubject.school_yearID}
                  onChange={(e) => {
                    handleAssignedSubjectChange({
                      target: {
                        name: "school_yearID",
                        value: e.target.value
                      }
                    });
                  }}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select School Year</option>
                  {schoolYears.map(year => (
                    <option key={year.school_yearID} value={year.school_yearID}>
                      {year.school_yearID} - {year.SchoolYear}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button 
                type="submit" 
                className="btn bg-green-700 text-white hover:bg-green-800 px-6"
              >
                {editingAssignment ? "Update Assignment" : "Assign Subject"}
              </button>
              <button 
                type="button" 
                className="btn btn-outline px-6"
                onClick={() => {
                  document.getElementById("assign_subject_modal").close();
                  setEditingAssignment(null);
                }}
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

export default AssignSubject;

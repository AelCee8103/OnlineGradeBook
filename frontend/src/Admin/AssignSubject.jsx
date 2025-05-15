import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AssignSubject = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [newAssignedSubject, setNewAssignedSubject] = useState({
    SubjectCode: "",
    subjectID: "",
    FacultyID: "",
    advisoryID: "",

    school_yearID: "",

  });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Number of rows per page

  const Navigate = useNavigate();

  useEffect(() => {
    fetchAssignedSubjects();
    fetchClasses();
    fetchSubjects();
    fetchFaculty();
    fetchSchoolYears();
    fetchAdvisories();
  }, []);

  const fetchAdvisories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-create-advisory",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAdvisories(response.data);
    } catch (error) {
      console.error("Error fetching advisories:", error);
      toast.error("Failed to fetch advisories");
    }
  };

  const fetchAssignedSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-assign-subject",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssignedSubjects(response.data);
    } catch (error) {
      console.error("Error fetching assigned subjects:", error);
      toast.error("Failed to fetch assigned subjects");
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-advisory-classes",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-manage-subject",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-manage-faculty",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
      toast.error("Failed to fetch faculty");
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/schoolyear",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("School years data:", response.data); // Add this to check what's being returned

      // Remove duplicates by school_yearID
      const uniqueYears = Array.from(
        new Map(
          response.data.map((item) => [item.school_yearID, item])
        ).values()
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
    [name]: value
  }));

  // Auto-fill SubjectCode if subjectID is selected and subject has a code
  if (name === "subjectID" && value) {
    const selectedSubject = subjects.find(sub => sub.SubjectID === value);
    if (selectedSubject?.SubjectCode) {
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
  if (
    !newAssignedSubject.subjectID ||
    !newAssignedSubject.FacultyID ||
    !newAssignedSubject.advisoryID
  ) {
    toast.error("Please fill all required fields");
    return;
  }

  // Get current school year
  const currentYear = schoolYears.find((year) => year.status === 1);
  if (!currentYear) {
    toast.error("No active school year found");
    return;
  }

  const payload = {
    subjectID: newAssignedSubject.subjectID,
    FacultyID: newAssignedSubject.FacultyID,
    advisoryID: newAssignedSubject.advisoryID,
    school_yearID: currentYear.school_yearID
  };

  if (newAssignedSubject.SubjectCode) {
    payload.SubjectCode = newAssignedSubject.SubjectCode;
  }

  // Check for duplicate assignment
  const alreadyAssigned = assignedSubjects.some(
    (assignment) =>
      assignment.advisoryID === newAssignedSubject.advisoryID &&
      assignment.subjectID === newAssignedSubject.subjectID &&
      assignment.yearID === currentYear.school_yearID &&
      (!editingAssignment || assignment.SubjectCode !== editingAssignment.SubjectCode)
  );

  if (alreadyAssigned) {
    toast.error("This subject is already assigned to this advisory class for the current school year.");
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

    let response;
    if (editingAssignment) {
      response = await axios.put(
        `http://localhost:3000/Pages/admin-assign-subject/${editingAssignment.advisoryID}/${editingAssignment.SubjectCode}`,
        payload,
        config
      );
    } else {
      response = await axios.post(
        "http://localhost:3000/Pages/admin-assign-subject",
        payload,
        config
      );
    }

    toast.success(
      `Subject assignment ${editingAssignment ? "updated" : "added"} successfully! ✅`,
      { autoClose: 3000 }
    );

    document.getElementById("assign_subject_modal").close();
    setNewAssignedSubject({
      SubjectCode: "",
      subjectID: "",
      FacultyID: "",
      advisoryID: ""
    });
    fetchAssignedSubjects();
    setEditingAssignment(null);
  } catch (error) {
    console.error("Assignment error:", error);

    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        toast.error(data.error || "Validation failed. Please check your inputs.");
      } else if (status === 401) {
        toast.error("Session expired. Please login again.");
        Navigate("/login");
      } else if (status === 409) {
        toast.error(data.error || "This subject is already assigned to this advisory class.");
      } else {
        toast.error(data.error || `Failed to ${editingAssignment ? "update" : "assign"} subject`);
      }
    } else {
      toast.error("Network error. Please try again.");
    }
  }
};


  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setNewAssignedSubject({
      SubjectCode: assignment.SubjectCode || "",
      subjectID: assignment.subjectID,
      FacultyID: assignment.FacultyID,
      advisoryID: assignment.advisoryID,
    });
    document.getElementById("assign_subject_modal").showModal();
  };

  
  const totalPages = Math.ceil(assignedSubjects.length / pageSize);
  const paginatedSubjects = assignedSubjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
 

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
            <input
              type="text"
              placeholder="Search by ID number"
              className="mb-4 border border-gray-300 rounded-md px-4 py-2"
            />
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
                    <th className="px-4 py-2">Subject</th>
                    <th className="px-4 py-2">Advisory</th>
                    <th className="px-4 py-2">Faculty</th>
                    <th className="px-4 py-2">School Year</th>{" "}
                    {/* Changed from "School Year ID" */}

                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
{paginatedSubjects.length > 0 ? (
  paginatedSubjects.map((assignment, index) => (
    <tr
      key={assignment.subjectCode || `row-${index}`}
      className="border-b hover:bg-gray-50"
    >
      <td className="px-4 py-2">{assignment.subjectCode || "-"}</td>
      <td className="px-4 py-2 font-medium">{assignment.subjectName || "-"}</td>
      <td className="px-4 py-2">
        {assignment.grade && assignment.section
          ? `Grade ${assignment.grade} - ${assignment.section}`
          : "-"}
      </td>
      <td className="px-4 py-2">
        {assignment.facultyName ||
          (assignment.facultyLastName
            ? `${assignment.facultyLastName}, ${assignment.facultyFirstName}`
            : "-")}
      </td>
      <td className="px-4 py-2">{assignment.schoolYear || "-"}</td>
      <td className="px-4 py-2 flex space-x-2">
        <button
          onClick={() => handleEditAssignment(assignment)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
          title="Edit"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="6" className="text-center py-4 text-gray-500">
      No subject assignments found
    </td>
  </tr>
)}

                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="btn bg-blue-500 hover:bg-blue-600 text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <dialog id="assign_subject_modal" className="modal z-[9999]">
        <div
          className="modal-box relative max-w-2xl"
          style={{ overflow: "visible" }}
        >
          <h3 className="font-bold text-lg mb-6">
            {editingAssignment
              ? "Edit Subject Assignment"
              : "Assign Subject to Advisory Class"}
          </h3>
          <form onSubmit={handleAssignSubject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              {/* Advisory Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advisory Class
                </label>
                <select
                  name="advisoryID"
                  value={newAssignedSubject.advisoryID}
                  onChange={handleAssignedSubjectChange}
                  className="select select-bordered w-full"
                  required
                  disabled={!!editingAssignment}
                >
                  <option value="">Select Advisory Class</option>
                  {advisories.map((advisory) => {
                    const classInfo = classes.find(
                      (c) => c.ClassID === advisory.classID
                    );
                    const facultyInfo = faculty.find(
                      (f) => f.FacultyID === advisory.facultyID
                    );

                    return (
                      <option
                        key={advisory.advisoryID}
                        value={advisory.advisoryID}
                      >
                        {`Grade ${classInfo?.Grade || ""} - Section ${
                          classInfo?.Section || ""
                        } (${
                          facultyInfo ? facultyInfo.LastName : "No Advisor"
                        })`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  name="subjectID"
                  value={newAssignedSubject.subjectID}
                  onChange={handleAssignedSubjectChange}
                  className="select select-bordered w-full"
                  required
                  disabled={!!editingAssignment}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.SubjectID} value={subject.SubjectID}>
                      {`${subject.SubjectID} - ${subject.SubjectName}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty
                </label>
                <select
                  name="FacultyID"
                  value={newAssignedSubject.FacultyID}
                  onChange={handleAssignedSubjectChange}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select Faculty</option>
                  {faculty.map((fac) => (
                    <option key={fac.FacultyID} value={fac.FacultyID}>
                      {`${fac.FacultyID} - ${fac.LastName}, ${fac.FirstName}`}
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

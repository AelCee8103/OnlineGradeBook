import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from "react-toastify";  // ✅ Import Toastify
import "react-toastify/dist/ReactToastify.css";  // ✅ Import Toastify styles

const ManageSubjectList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    SubjectCode: "",
    SubjectName: "",
    FacultyID: "",
  });
  const Navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/Pages/admin-manage-subject", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      if (error.response) {
        console.log("Response data:", error.response.data);
        console.log("Response status:", error.response.status);
      }
      toast.error("Failed to fetch subjects");
    }
  };

  const handleSubjectChange = (e) => {
    setNewSubject({ ...newSubject, [e.target.name]: e.target.value });
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3000/Pages/admin-manage-subject", newSubject, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Subject added successfully! ✅");  // ✅ Show success toast
      document.getElementById("subject_modal").close(); // Close modal
      fetchSubjects(); // Refresh list
      setNewSubject({ SubjectCode: "", SubjectName: "", FacultyID: "" }); // Reset form
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error("Failed to add subject ❌");  // ✅ Show error toast
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
        <ToastContainer position="top-right" autoClose={3000} />  {/* ✅ Toast Container */}

        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Subject Class List</h1>

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input type="text" placeholder="Search by ID number" className="mb-4 border border-gray-300 rounded-md px-4 py-2" />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />

            {/* Open Add Subject Modal */}
            <button
              className="ml-4 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              onClick={() => document.getElementById("subject_modal").showModal()}
            >
              ADD SUBJECT
            </button>

            <table className="w-full text-left text-sm mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-gray-600">Subject Code</th>
                  <th className="px-4 py-2 text-gray-600">Subject Name</th>
                  <th className="px-4 py-2 text-gray-600">Faculty ID</th>
                  <th className="px-4 py-2 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <tr key={subject.SubjectCode} className="border-b">
                      <td className="px-4 py-2">{subject.SubjectCode}</td>
                      <td className="px-4 py-2">{subject.SubjectName}</td>
                      <td className="px-4 py-2">{subject.FacultyID}</td>
                      <td className="px-4 py-2">
                        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
                          Edit
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm ml-2">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">No subjects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      <dialog id="subject_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add Subject</h3>
          <form onSubmit={handleAddSubject} className="space-y-3">
            <input
              type="text"
              name="SubjectCode"
              value={newSubject.subject_code}
              onChange={handleSubjectChange}
              placeholder="Subject Code"
              className="input input-bordered w-full"
              required
            />
            <input
              type="text"
              name="SubjectName"
              value={newSubject.subject_name}
              onChange={handleSubjectChange}
              placeholder="Subject Name"
              className="input input-bordered w-full"
              required
            />
            <input
              type="number"
              name="FacultyID"
              value={newSubject.faculty_id}
              onChange={handleSubjectChange}
              placeholder="Faculty ID"
              className="input input-bordered w-full"
              required
            />
            <div className="modal-action">
              <button type="submit" className="btn bg-green-700 text-white">Submit</button>
              <button type="button" className="btn" onClick={() => document.getElementById("subject_modal").close()}>Close</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default ManageSubjectList;

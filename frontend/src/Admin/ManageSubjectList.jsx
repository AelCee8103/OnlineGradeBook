import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageSubjectList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    SubjectName: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState({ SubjectID: "", SubjectName: "" });
  const [editInput, setEditInput] = useState("");
  const [originalEditName, setOriginalEditName] = useState("");
  const Navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

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

    // Validation: Prevent duplicate subject names (case-insensitive)
    const isDuplicate = subjects.some(
      (subject) =>
        subject.SubjectName.trim().toLowerCase() ===
        newSubject.SubjectName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error("Subject name already exists!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/Pages/admin-manage-subject",
        newSubject,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Subject added successfully! ✅");
      document.getElementById("subject_modal").close();
      fetchSubjects();
      setNewSubject({ SubjectName: "" }); // Reset form
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error("Failed to add subject ❌");
    }
  };

  // --- EDIT FUNCTIONALITY ---

  const openEditModal = (subject) => {
    setEditSubject(subject);
    setEditInput(subject.SubjectName);
    setOriginalEditName(subject.SubjectName);
    setEditModalOpen(true);
    setTimeout(() => {
      document.getElementById("edit_subject_modal").showModal();
    }, 0);
  };

  const handleEditInputChange = (e) => {
    setEditInput(e.target.value);
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();

    // Validation: Prevent duplicate subject names (case-insensitive), except for itself
    const isDuplicate = subjects.some(
      (subject) =>
        subject.SubjectID !== editSubject.SubjectID &&
        subject.SubjectName.trim().toLowerCase() === editInput.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error("Subject name already exists!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3000/Pages/admin-manage-subject/${editSubject.SubjectID}`,
        { SubjectName: editInput },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Subject updated successfully!");
      document.getElementById("edit_subject_modal").close();
      setEditModalOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject ❌");
    }
  };

  // Filter subjects based on search term (by ID or name)
  const filteredSubjects = subjects.filter(
    (subject) =>
      (subject.SubjectID?.toString() || "").includes(searchTerm) ||
      (subject.SubjectName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold mb-6">Subject List</h1>

          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            <input
              type="text"
              placeholder="Search by ID or Subject Name"
              className="mb-4 border border-gray-300 rounded-md px-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />

            {/* Open Add Subject Modal */}
            <button
              className="ml-4 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              onClick={() =>
                document.getElementById("subject_modal").showModal()
              }
            >
              ADD SUBJECT
            </button>

            <table className="w-full text-left text-sm mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-gray-600">Subject ID</th>
                  <th className="px-4 py-2 text-gray-600">Subject Name</th>
                  <th className="px-4 py-2 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <tr key={subject.SubjectID} className="border-b">
                      <td className="px-4 py-2">{subject.SubjectID}</td>
                      <td className="px-4 py-2">{subject.SubjectName}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          onClick={() => openEditModal(subject)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No subjects found.
                    </td>
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
              name="SubjectName"
              value={newSubject.SubjectName}
              onChange={handleSubjectChange}
              placeholder="Subject Name"
              className="input input-bordered w-full"
              required
            />
            <div className="modal-action">
              <button
                type="submit"
                className="btn bg-green-700 text-white"
                disabled={
                  newSubject.SubjectName.trim() === "" ||
                  subjects.some(
                    (subject) =>
                      subject.SubjectName.trim().toLowerCase() ===
                      newSubject.SubjectName.trim().toLowerCase()
                  )
                }
              >
                Submit
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => document.getElementById("subject_modal").close()}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Edit Subject Modal */}
      <dialog id="edit_subject_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Subject</h3>
          <form onSubmit={handleUpdateSubject} className="space-y-3">
            <input
              type="text"
              name="SubjectName"
              value={editInput}
              onChange={handleEditInputChange}
              placeholder="Subject Name"
              className="input input-bordered w-full"
              required
            />
            <div className="modal-action">
              <button
                type="submit"
                className="btn bg-green-700 text-white"
                disabled={
                  editInput.trim().toLowerCase() === originalEditName.trim().toLowerCase() ||
                  editInput.trim() === "" ||
                  subjects.some(
                    (subject) =>
                      subject.SubjectID !== editSubject.SubjectID &&
                      subject.SubjectName.trim().toLowerCase() === editInput.trim().toLowerCase()
                  )
                }
              >
                Update
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  document.getElementById("edit_subject_modal").close();
                  setEditModalOpen(false);
                }}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default ManageSubjectList;

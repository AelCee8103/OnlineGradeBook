import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ManageStudents = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  // Student form state
  const [studentData, setStudentData] = useState({
    StudentID: "",
    LastName: "",
    FirstName: "",
    MiddleName: "",
    isNew: true, // Add this field
    grade: "", // Add this field for initial grade level
    studentType: "", // Add this field for student type
  });

  const [selectedStudent, setSelectedStudent] = useState({
    StudentID: "",
    LastName: "",
    FirstName: "",
    MiddleName: "",
  });

  // New states for file handling
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const filteredStudents = students.filter(
    (student) =>
      student.StudentID.toString().includes(searchTerm) ||
      student.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.FirstName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Function to fetch all students

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/auth/admin-manage-students",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      navigate("/admin-login");
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/admin-manage-students",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Verify authentication
        await fetchUser();

        // Fetch only active students list (Status = 1)
        const response = await axios.get(
          "http://localhost:3000/Pages/admin-manage-students",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          navigate("/admin-login");
        }
      }
    };

    fetchData();
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !studentData.LastName ||
      !studentData.FirstName ||
      !studentData.MiddleName ||
      !studentData.studentType
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3000/Pages/admin-manage-students",
        studentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        // Add the new student with the auto-generated ID to the state
        setStudents((prevStudents) => [...prevStudents, res.data.student]);

        // Close modal and reset form
        document.getElementById("my_modal_5").close();
        setStudentData({
          LastName: "",
          FirstName: "",
          MiddleName: "",
          studentType: "",
          grade: "",
        });

        toast.success("Student added successfully!");

        // Refresh student list
        const updatedResponse = await axios.get(
          "http://localhost:3000/Pages/admin-manage-students",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStudents(updatedResponse.data);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/admin-login");
      } else {
        toast.error(error.response?.data?.message || "Failed to add student.");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:3000/Pages/admin-manage-students`,
        selectedStudent
      );
      toast.success("Student updated successfully!");

      // Update the students list
      setStudents(
        students.map((s) =>
          s.StudentID === selectedStudent.StudentID ? selectedStudent : s
        )
      );

      // Close modal
      document.getElementById("edit_modal").close();
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student.");
    }
  };

  // Function to handle clicking the Edit button
  const handleEditClick = (student) => {
    setSelectedStudent(student);
    document.getElementById("edit_modal").showModal();
  };

  // Function to update the input fields when editing
  const handleEditChange = (e) => {
    setSelectedStudent({ ...selectedStudent, [e.target.name]: e.target.value });
  };

  // New functions for file handling
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");

    // Add headers
    worksheet.columns = [
      { header: "LastName", key: "lastName" },
      { header: "FirstName", key: "firstName" },
      { header: "MiddleName", key: "middleName" },
      { header: "StudentType", key: "studentType" },
      { header: "Grade", key: "grade" },
    ];

    // Add sample data
    worksheet.addRow({
      lastName: "Doe",
      firstName: "John",
      middleName: "Smith",
      studentType: "new",
      grade: "7",
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "student_upload_template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);

      const jsonData = [];
      const headers = {};

      // Get headers
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
      });

      // Get data
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber]] = cell.value;
          });
          jsonData.push(rowData);
        }
      });

      setUploadedFile(jsonData);
      setUploadErrors([]);
    } catch (error) {
      console.error("Error parsing file:", error);
      setUploadErrors(["Invalid file format"]);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadedFile || uploadedFile.length === 0) {
      toast.error("No data to upload");
      return;
    }

    setIsUploading(true);
    const errors = [];

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/Pages/admin-manage-students/bulk",
        { students: uploadedFile },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Update the local students state with the newly added students
        setStudents((prevStudents) => [
          ...prevStudents,
          ...response.data.addedStudents,
        ]);

        // Show success message
        toast.success(
          `Successfully uploaded ${response.data.addedStudents.length} students`
        );

        // Reset upload states
        setUploadedFile(null);
        setUploadErrors([]);

        // Close the modal
        document.getElementById("bulk_upload_modal").close();
      } else {
        // Handle partial success or failure
        if (response.data.errors && response.data.errors.length > 0) {
          setUploadErrors(response.data.errors);
          toast.error(`Failed to upload some students. Check the errors.`);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload students");
      setUploadErrors([error.response?.data?.message || "Upload failed"]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <ToastContainer
          position="top-right"
          autoClose={2000} // 3 seconds
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
        />

        {/* Manage Students Content */}
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Manage Students</h1>

          {/* Students Table */}
          <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
            {/* Button to Open Modal */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by ID number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow"
              />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-3" />

              <button
                className="btn bg-blue-500 hover:bg-blue-600 text-white ml-3 "
                onClick={() =>
                  document.getElementById("my_modal_5").showModal()
                }
              >
                Add Student
              </button>

              {/* Button to Download Template */}
              <button
                className="btn bg-green-500 hover:bg-green-600 text-white ml-3"
                onClick={downloadTemplate}
              >
                Download Template
              </button>

              {/* Bulk Upload Button - NEW */}
              <button
                className="btn bg-green-500 hover:bg-green-600 text-white ml-3"
                onClick={() =>
                  document.getElementById("bulk_upload_modal").showModal()
                }
              >
                Bulk Upload
              </button>

              {/* Bulk Upload Modal - NEW */}
              <dialog
                id="bulk_upload_modal"
                className="modal modal-bottom sm:modal-middle"
              >
                <div className="modal-box">
                  <h3 className="font-bold text-lg mb-4">
                    Bulk Upload Students
                  </h3>

                  <div className="mb-4">
                    <button
                      onClick={downloadTemplate}
                      className="btn btn-outline btn-sm mb-2"
                    >
                      Download Template
                    </button>

                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="file-input file-input-bordered w-full"
                    />
                  </div>

                  {uploadedFile && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        {uploadedFile.length} students found in file
                      </p>
                    </div>
                  )}

                  {uploadErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-100 rounded">
                      <p className="font-semibold text-red-700">Errors:</p>
                      <ul className="list-disc pl-5">
                        {uploadErrors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="modal-action">
                    <button
                      onClick={handleBulkUpload}
                      disabled={isUploading || !uploadedFile}
                      className="btn bg-green-700 text-white"
                    >
                      {isUploading ? "Uploading..." : "Upload Students"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        document.getElementById("bulk_upload_modal").close();
                        setUploadedFile(null);
                        setUploadErrors([]);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </dialog>
            </div>

            {/* Modal */}
            <dialog
              id="my_modal_5"
              className="modal modal-bottom sm:modal-middle"
            >
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">
                  Add Student Information
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    name="LastName"
                    value={studentData.LastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="input input-bordered w-full"
                    required
                  />

                  <input
                    type="text"
                    name="FirstName"
                    value={studentData.FirstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="input input-bordered w-full"
                    required
                  />

                  <input
                    type="text"
                    name="MiddleName"
                    value={studentData.MiddleName}
                    onChange={handleChange}
                    placeholder="Middle Name"
                    className="input input-bordered w-full"
                    required
                  />

                  <select
                    name="studentType"
                    value={studentData.studentType}
                    onChange={handleChange}
                    className="form-input mt-1 block w-full"
                    required
                  >
                    <option value="">Select Student Type</option>
                    <option value="new">New Grade 7 Student</option>
                    <option value="transferee">Transferee</option>
                  </select>

                  {studentData.studentType === "transferee" && (
                    <select
                      name="grade"
                      value={studentData.grade}
                      onChange={handleChange}
                      className="form-input mt-1 block w-full"
                      required
                    >
                      <option value="">Select Grade</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  )}

                  {/* Action Buttons */}
                  <div className="modal-action">
                    <button
                      type="submit"
                      className="btn bg-green-700 text-white"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        document.getElementById("my_modal_5").close()
                      }
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className=" border-b bg-gray-200">
                    <th className="px-4 py-2">Student No.</th>
                    <th className="px-4 py-2">Last Name</th>
                    <th className="px-4 py-2">First Name</th>
                    <th className="px-4 py-2">Middle Name</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map((data, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{data.StudentID}</td>
                      <td className="px-4 py-2">{data.LastName}</td>
                      <td className="px-4 py-2">{data.FirstName}</td>
                      <td className="px-4 py-2">{data.MiddleName}</td>
                      <td className="px-4 py-2">
                        {/* Open the modal using document.getElementById('ID').showModal() method */}
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          onClick={() => handleEditClick(data)}
                        >
                          Edit
                        </button>
                        <dialog
                          id="edit_modal"
                          className="modal modal-bottom sm:modal-middle"
                        >
                          <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">
                              Edit Student Information
                            </h3>

                            <form
                              onSubmit={handleEditSubmit}
                              className="space-y-3"
                            >
                              <input
                                type="number"
                                name="StudentID"
                                value={selectedStudent.StudentID}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                                required
                                disabled // Prevent ID changes
                              />
                              <input
                                type="text"
                                name="LastName"
                                value={selectedStudent.LastName}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                                required
                              />
                              <input
                                type="text"
                                name="FirstName"
                                value={selectedStudent.FirstName}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                                required
                              />
                              <input
                                type="text"
                                name="MiddleName"
                                value={selectedStudent.MiddleName}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                                required
                              />
                              <div className="modal-action">
                                <button
                                  type="submit"
                                  className="btn bg-green-700 text-white"
                                >
                                  Update
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() =>
                                    document
                                      .getElementById("edit_modal")
                                      .close()
                                  }
                                >
                                  Close
                                </button>
                              </div>
                            </form>
                          </div>
                        </dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${
                  currentPage === 1
                    ? "bg-gray-300"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-300"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;

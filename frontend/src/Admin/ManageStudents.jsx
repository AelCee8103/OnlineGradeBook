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
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Student form state
  const [studentData, setStudentData] = useState({
    StudentID: "",
    LastName: "",
    FirstName: "",
    MiddleName: "",
    isNew: true,
    grade: "",
    studentType: "",
  });

  const [selectedStudent, setSelectedStudent] = useState({
    StudentID: "",
    LastName: "",
    FirstName: "",
    MiddleName: "",
  });

  // File handling states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [archiving, setArchiving] = useState(false);

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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          navigate("/admin-login");
        }
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search change and reset to first page
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Enhanced pagination logic
  const filteredStudents = students.filter(
    (student) =>
      (student.StudentID?.toString() || "").includes(searchTerm) ||
      (student.LastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.FirstName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Update total pages whenever filtered results change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredStudents.length / itemsPerPage));
    // If current page is greater than total pages, set to page 1
    if (
      currentPage > Math.ceil(filteredStudents.length / itemsPerPage) &&
      filteredStudents.length > 0
    ) {
      setCurrentPage(1);
    }
  }, [filteredStudents, itemsPerPage, currentPage]);

  // Enhanced pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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

    // For transferee students, grade is required
    if (studentData.studentType === 'transferee' && !studentData.grade) {
      toast.error("Please select a grade level for transferee student.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Create the payload to match backend expectations
      const payload = {
        LastName: studentData.LastName,
        FirstName: studentData.FirstName,
        MiddleName: studentData.MiddleName,
        studentType: studentData.studentType,
        grade: studentData.studentType === 'transferee' ? studentData.grade : "7"
      };

      const res = await axios.post(
        "http://localhost:3000/Pages/admin-manage-students",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
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
        fetchStudents();
      }
    } catch (error) {
      console.error("Error adding student:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/admin-login");
      } else {
        toast.error(error.response?.data?.error || "Failed to add student.");
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
      { header: "LastName", key: "LastName" },
      { header: "FirstName", key: "FirstName" },
      { header: "MiddleName", key: "MiddleName" },
      { header: "studentType", key: "studentType" },
      { header: "grade", key: "grade" },
    ];

    // Add sample data
    worksheet.addRow({
      LastName: "Doe",
      FirstName: "John",
      MiddleName: "Smith",
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

  // New function to handle archiving a student
  const handleArchive = async (student) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to archive ${student.FirstName} ${student.LastName}?`
    );

    if (isConfirmed) {
      try {
        setArchiving(true);
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `http://localhost:3000/Pages/admin-manage-students/archive/${student.StudentID}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setStudents((prev) =>
            prev.filter((s) => s.StudentID !== student.StudentID)
          );
          toast.success(
            `${student.FirstName} ${student.LastName} has been archived`
          );
        }
      } catch (error) {
        console.error("Error archiving student:", error);
        toast.error(
          error.response?.data?.message || "Failed to archive student"
        );
      } finally {
        setArchiving(false);
      }
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <ToastContainer
          position="top-right"
          autoClose={2000}
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
            <div className="flex flex-col lg:flex-row items-stretch gap-3 mb-4">
              <div className="relative flex-grow w-full">
                <input
                  type="text"
                  placeholder="Search by ID, last name or first name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border border-gray-300 rounded-md px-4 py-2 w-full pl-10"
                />
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>

              {/* Action Buttons Container */}
              <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
                {/* Button 1: Add Student */}
                <button
                  className="btn bg-blue-500 hover:bg-blue-600 text-white flex-1 min-w-[120px] h-10 px-3 md:px-4 text-xs md:text-sm font-medium rounded"
                  onClick={() => document.getElementById("my_modal_5").showModal()}
                >
                  <span className="hidden md:inline">Add Student</span>
                  <span className="md:hidden">Add</span>
                </button>

                {/* Button 2: Download Template */}
                <button
                  className="btn bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[120px] h-10 px-3 md:px-4 text-xs md:text-sm font-medium rounded"
                  onClick={downloadTemplate}
                >
                  <span className="hidden md:inline">Download Template</span>
                  <span className="md:hidden">Template</span>
                </button>

                {/* Button 3: Bulk Upload */}
                <button
                  className="btn bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[120px] h-10 px-3 md:px-4 text-xs md:text-sm font-medium rounded"
                  onClick={() => document.getElementById("bulk_upload_modal").showModal()}
                >
                  <span className="hidden md:inline">Bulk Upload</span>
                  <span className="md:hidden">Upload</span>
                </button>
              </div>
            </div>

            {/* Add Student Modal */}
            <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Add Student Information</h3>
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
                    className="select select-bordered w-full"
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
                      className="select select-bordered w-full"
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
                    <button type="submit" className="btn bg-green-700 text-white">
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => document.getElementById("my_modal_5").close()}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </dialog>

            {/* Bulk Upload Modal */}
            <dialog id="bulk_upload_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Bulk Upload Students</h3>

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

            {/* Edit Student Modal */}
            <dialog id="edit_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Edit Student Information</h3>

                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Student ID</span>
                    </label>
                    <input
                      type="number"
                      name="StudentID"
                      value={selectedStudent.StudentID}
                      onChange={handleEditChange}
                      className="input input-bordered w-full"
                      required
                      disabled // Prevent ID changes
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Last Name</span>
                    </label>
                    <input
                      type="text"
                      name="LastName"
                      value={selectedStudent.LastName}
                      onChange={handleEditChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">First Name</span>
                    </label>
                    <input
                      type="text"
                      name="FirstName"
                      value={selectedStudent.FirstName}
                      onChange={handleEditChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Middle Name</span>
                    </label>
                    <input
                      type="text"
                      name="MiddleName"
                      value={selectedStudent.MiddleName}
                      onChange={handleEditChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div className="modal-action">
                    <button type="submit" className="btn bg-green-700 text-white">
                      Update
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => document.getElementById("edit_modal").close()}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </dialog>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-200">
                    <th className="px-4 py-2">Student No.</th>
                    <th className="px-4 py-2">Last Name</th>
                    <th className="px-4 py-2">First Name</th>
                    <th className="px-4 py-2">Middle Name</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Loading students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((data, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{data.StudentID}</td>
                        <td className="px-4 py-2">{data.LastName}</td>
                        <td className="px-4 py-2">{data.FirstName}</td>
                        <td className="px-4 py-2">{data.MiddleName}</td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            onClick={() => handleArchive(data)}
                            disabled={archiving}
                          >
                            {archiving ? "Archiving..." : "Archive"}
                          </button>
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm ml-2"
                            onClick={() => handleEditClick(data)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination Controls */}
            {!isLoading && filteredStudents.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className="flex items-center mb-4 md:mb-0">
                  <span className="text-sm text-gray-700 mr-2">Show</span>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-gray-700 ml-2">
                    items per page
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-4">
                    Page {currentPage} of {totalPages}
                    ({filteredStudents.length} total items)
                  </span>
                  <div className="flex">
                    <button
                      onClick={() => paginate(1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 border-t border-b ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 border-t border-b ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;

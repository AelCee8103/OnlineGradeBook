import React, { useState, useEffect } from "react";

const ClassAdvisoryTable = ({ classData }) => {
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  useEffect(() => {
    if (classData && classData.classInfo) {
      setClassInfo(classData.classInfo);
      setStudents(classData.students || []);
    }
  }, [classData]);

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const formatStudentName = (lastName, firstName, middleName) => {
    return `${lastName}, ${firstName} ${middleName ? middleName.charAt(0) + '.' : ''}`;
  };

  return (
    <div className="overflow-x-auto w-full">
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-6 rounded shadow-md">
          <h1 className="text-3xl font-bold mb-6">Class Advisory</h1>

          {/* Class Info Card */}
          {classInfo ? (
            <div className="bg-white rounded shadow p-4 mb-6">
              <p className="mb-2"><span className="font-semibold">Section:</span> {classInfo.Section}</p>
              <p className="mb-2"><span className="font-semibold">Number of Students:</span> {students.length}</p>
              <p><span className="font-semibold">Class Advisor:</span> <span className="font-bold">{classInfo.AdvisorName}</span></p>
            </div>
          ) : (
            <p className="text-red-600">No advisory class found.</p>
          )}

          {/* Students Table */}
          <div className="p-8">
            <div className="bg-white shadow rounded-lg p-4 max-w-screen-lg mx-auto">
              <div className="mb-4">
                <button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md ml-4">
                  Request to Validate
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-gray-600">No.</th>
                    <th className="px-4 py-2 text-gray-600">Student Name</th>
                    <th className="px-4 py-2 text-gray-600">Student Number</th>
                    <th className="px-4 py-2 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((student, index) => (
                      <tr key={student.StudentID} className="border-b">
                        <td className="px-4 py-2">{indexOfFirstStudent + index + 1}</td>
                        <td className="px-4 py-2">{formatStudentName(student.LastName, student.FirstName, student.MiddleName)}</td>
                        <td className="px-4 py-2">{student.StudentID}</td>
                        <td className="px-4 py-2">
                          <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">Info</button>
                          <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm ml-2">Grades</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">No students found in this advisory class.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {students.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded ${currentPage === totalPages ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAdvisoryTable;

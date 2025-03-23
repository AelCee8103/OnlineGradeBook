import React from "react";

const ClassAdvisoryTable = ({ data }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="table table-zebra w-full">
        {/* Table Head */}
        <thead className="bg-green-800 text-white">
          <tr>
            <th>#</th>
            <th>Student Name</th>
            <th>Grade</th>
            <th>Section</th>
            <th>Action</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.map((student, index) => (
            <tr key={index}>
              <th>{index + 1}</th>
              <td>{student.name}</td>
              <td>{student.grade}</td>
              <td>{student.section}</td>
              <td>
                <div className="flex space-x-2">
                  <button className="btn btn-sm btn-info">View</button>
                  <button className="btn btn-sm btn-warning">Edit</button>
                  <button className="btn btn-sm btn-error">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassAdvisoryTable;

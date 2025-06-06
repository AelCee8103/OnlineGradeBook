import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./Admin/AdminLogin";
import FacultyLogin from "./Pages/FacultyLogin";
import FacultyDashboard from "./Pages/FacultyDashboard";
import ClassAdvisory from "./Pages/ClassAdvisory";
import Classes from "./Pages/Classes";
import Grades from "./Pages/Grades";
import Attendance from "./Pages/Attendance";
import Register from "./Pages/Register";
import AdminDashboard from "./Admin/AdminDashboard";
import Adminregister from "./Admin/adminregister";
import ManageClass from "./Admin/ManageClass";
import ManageStudent from "./Admin/ManageStudents";
import ManageFaculty from "./Admin/ManageFaculty";
import ManageGrades from "./Admin/ManageGrades";
import ValidationRequest from "./Admin/ValidationRequest";
import ArchiveRecords from "./Admin/ArchiveRecords";
import ManageSubjectList from "./Admin/ManageSubjectList";
import "@fontsource/roboto"; // Defaults to weight 400
import AssignSubject from "./Admin/AssignSubject";
import ViewSubject from "./Pages/ViewSubject";
import ViewStudents from "./Admin/ViewStudents";
import AdvisoryStudents from "./Admin/AdvisoryStudents"; // adjust path if needed
import StudentGrades from "./Admin/StudentGrades";
import SubjectClassStudents from "./Admin/SubjectClassStudents";
import CreateAdvisory from "./Admin/CreateAdvisory";
import ViewStudent from "./Pages/ViewStudents";
import ViewAttendance from "./Pages/ViewAttendance";
import ManageSchoolYear from "./Admin/ManageSchoolYear";
import { Toaster } from "react-hot-toast";
import ArchivedStudentGrades from "./Admin/ArchivedStudentGrades";
function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/admin-login" />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-manage-students" element={<ManageStudent />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-manage-faculty" element={<ManageFaculty />} />
        <Route path="/admin-advisory-classes" element={<ManageClass />} />
        <Route path="admin-create-advisory" element={<CreateAdvisory />} />
        <Route path="/admin-manage-subject" element={<ManageSubjectList />} />
        <Route
          path="/admin/subject-classes/:subjectCode/students"
          element={<SubjectClassStudents />}
        />
        <Route
          path="/admin/advisory/:advisoryID/students/:studentId/grades"
          element={<StudentGrades isFaculty={false} />}
        />
        <Route path="/admin-assign-subject" element={<AssignSubject />} />
        <Route path="/admin-manage-grades" element={<ManageGrades />} />
        <Route
          path="/admin-validation-request"
          element={<ValidationRequest />}
        />
        <Route path="/admin-archive-records" element={<ArchiveRecords />} />
        <Route path="/admin-register" element={<Adminregister />} />
        <Route
          path="/admin-view-students/:advisoryID"
          element={<ViewStudents />}
        />
        <Route
          path="/admin/advisory/:advisoryID/students"
          element={<AdvisoryStudents />}
        />
        <Route
          path="/admin/archived-student/:studentId/grades"
          element={<ArchivedStudentGrades />}
        />
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty-class-advisory" element={<ClassAdvisory />} />
        <Route path="/faculty-classes" element={<Classes />} />
        <Route path="/faculty-view-subject" element={<ViewSubject />} />
        <Route
          path="/faculty-view-students/:subjectCode"
          element={<ViewStudent />}
        />
        <Route
          path="/faculty-view-attendance/:subjectCode"
          element={<ViewAttendance />}
        />
        <Route path="/faculty-grades" element={<Grades />} />
        <Route path="/faculty-attendance" element={<Attendance />} />
        <Route path="/faculty-register" element={<Register />} />
        <Route
          path="/faculty/students/:studentId/grades"
          element={<StudentGrades isFaculty={true} />}
        />
        <Route
          path="/admin/manage-school-year"
          element={<ManageSchoolYear />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

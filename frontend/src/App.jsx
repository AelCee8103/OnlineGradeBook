import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './Admin/AdminLogin'; 
import FacultyLogin from './Pages/FacultyLogin';
import FacultyDashboard from './Pages/FacultyDashboard';
import ClassAdvisory from './Pages/ClassAdvisory';
import Classes from './Pages/Classes';
import Grades from './Pages/Grades';
import Attendance from './Pages/Attendance';
import Register from './Pages/Register';
import AdminDashboard from './Admin/AdminDashboard';
import Adminregister from './Admin/adminregister';
import ManageClass from './Admin/ManageClass';
import ManageStudent from "./Admin/ManageStudents";
import ManageFaculty from "./Admin/ManageFaculty";
import ManageGrades from './Admin/ManageGrades';
import ValidationRequest from './Admin/ValidationRequest';
import ArchiveRecords from './Admin/ArchiveRecords';
import ManageSubjectList from './Admin/ManageSubjectList';
import '@fontsource/roboto'; // Defaults to weight 400
import AssignSubject from './Admin/AssignSubject';
import ViewSubject from './Pages/ViewSubject';
import ViewStudents from './Admin/ViewStudents';



function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <BrowserRouter>
     <Routes>
     <Route path='/' element={<Navigate to="/admin-login" />}></Route>
      <Route path='/admin-login' element={<AdminLogin  />}></Route>
      <Route path='/admin-manage-students' element={<ManageStudent  />}></Route>
      <Route path='/admin-dashboard' element={<AdminDashboard  />}></Route>
      <Route path='/admin-manage-faculty' element={<ManageFaculty />}></Route>
      <Route path='/admin-adivsory-classes' element={<ManageClass />}></Route>
      <Route path='/admin-manage-subject' element={<ManageSubjectList />}></Route>
      <Route path='/admin-assign-subject' element={<AssignSubject />}></Route>
      <Route path='/admin-manage-grades' element={<ManageGrades />}></Route>
      <Route path='/admin-validation-request' element={<ValidationRequest />}></Route>
      <Route path='/admin-archive-records' element={<ArchiveRecords />}></Route>
      <Route path='/admin-register' element={<Adminregister />}></Route>
      <Route path='/admin-view-students' element={<ViewStudents/>}></Route>

    
     
      

      <Route path='/faculty-login' element={<FacultyLogin  />}></Route>
      <Route path='/faculty-dashboard' element={<FacultyDashboard />}></Route>
      <Route path='/faculty-class-advisory' element={<ClassAdvisory />}></Route>
      <Route path='/faculty-classes' element={<Classes />}></Route>
      <Route path='/faculty-view-subject' element={<ViewSubject />}></Route>
      <Route path='/faculty-grades' element={<Grades />}></Route>
      <Route path='/faculty-attendance' element={<Attendance />}></Route>
      <Route path='/faculty-register' element={<Register />}></Route>
     </Routes>
    </BrowserRouter>
    </>
  )
}

export default App

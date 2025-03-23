import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <BrowserRouter>
     <Routes>
      <Route path='/admin-login' element={<AdminLogin  />}></Route>|
      <Route path='/admin-dashboard' element={<AdminDashboard  />}></Route>
      <Route path='/admin-register' element={<Adminregister />}></Route>
      <Route path='/faculty-login' element={<FacultyLogin  />}></Route>
      <Route path='/faculty-dashboard' element={<FacultyDashboard />}></Route>
      <Route path='/class-advisory' element={<ClassAdvisory />}></Route>
      <Route path='/classes' element={<Classes />}></Route>
      <Route path='/grades' element={<Grades />}></Route>
      <Route path='/attendance' element={<Attendance />}></Route>
      <Route path='/register' element={<Register />}></Route>
     </Routes>
    </BrowserRouter>
    </>
  )
}

export default App

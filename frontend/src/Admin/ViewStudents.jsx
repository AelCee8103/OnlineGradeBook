import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import StatCard from "../Admin/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewStudents = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newSchoolYear, setSchoolYear] = useState({
    schoolyearID: "",
    year: "",
  });  
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/Admin-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User Authenticated", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Navigate("/admin-login");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleCreateSchoolYear = async (e) => {
    e.preventDefault();
     
    try {
      const response = await axios.post("http://localhost:3000/Pages/admin-dashboard", { 
        SchoolYear: newSchoolYear.schoolyearID, 
        year: newSchoolYear.year 
      });
  
      if (response.data.exists) {
        toast.error("School Year already exists");
      } else {
        toast.success("School Year added successfully!");
      }
  
      setSchoolYear({ schoolyearID: "", year: "" });
  
      navigate("/admin-dashboard");
  
      // Close modal safely
      const modal = document.getElementById('my_modal_5');
      if (modal) modal.close();
      
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      toast.error("Failed to add school year.");
    }
  };

  const handChanges  = (e) => {
    setSchoolYear({
       ...newSchoolYear, [e.target.name]: e.target.value
    });
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
       
 
         
      </div>
    </div>
  );
};

export default ViewStudents;

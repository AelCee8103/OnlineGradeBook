import React, { useEffect, useState } from "react";
import NavbarAdmin from "../Components/NavbarAdmin";
import AdminSidePanel from "../Components/AdminSidePanel";
import StatCard from "../Admin/StatCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminDashboard = () => {
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
        toast.error("School Year already exists.");
      } else if (response.data.success) {
        // Reset fields
        setSchoolYear({ schoolyearID: "", year: "" });
  
        // Close modal safely
        const modal = document.getElementById("my_modal_5");
        if (modal) modal.close();
  
       
  
        // Optionally wait a moment before navigating (for UX)
      
          navigate("/admin-dashboard");
           // Toast after successful creation
        toast.success("School Year created and status set to Active!");
     
      }
  
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

        <div className="p-6">
          {/* Overview Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Overview</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-lg">School Year:</span>
              <select className="border rounded-lg px-3 py-1 text-lg">
                <option>2024-2025</option>
              </select>
              <button className="btn bg-blue-700 text-white hover:bg-blue-800" onClick={()=>document.getElementById('my_modal_5').showModal()}>add school year</button>
              <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                  <h3 className="font-bold text-lg mb-6">Add School Year</h3>
                  
                  <form onSubmit={handleCreateSchoolYear} method="dialog" className="flex flex-col gap-4">
                    {/* Input Field */}
                    <div className="flex flex-col gap-5">
                      <input 
                        type="text" 
                        placeholder="Enter School Year ID" 
                        className="input input-bordered w-full" 
                        onChange={handChanges}
                        name="schoolyearID"
                        required
                      />
                       <input 
                        type="text" 
                        placeholder="Enter School Year" 
                        className="input input-bordered w-full" 
                        onChange={handChanges}
                        name="year"
                        required
                      />
                      
                    </div>
                    
                    {/* Buttons - Right-aligned */}
                    <div className="modal-action mt-2">
                      <div className="flex gap-2 justify-end">
                        <button type="button"  onClick={() => document.getElementById('my_modal_5').close()}className="btn">Close</button>
                        <button type="submit" className="btn btn-primary">Submit</button>
                      </div>
                    </div>
                  </form>
                </div>
              </dialog>
            </div>
          </div>

          {/* Statistics Grid - Matches the Screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Students" value="282" />
            <StatCard title="Advisories" value="12" />
            <StatCard title="Faculty" value="18" />
            <StatCard title="Subject Classes" value="36" />
            <StatCard title="Unfinished Grades" value="100" subtitle="Unvalidated Grades" textColor="text-yellow-500" />
            <StatCard title="Finished Grades" value="182" subtitle="Validated Grades" textColor="text-green-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

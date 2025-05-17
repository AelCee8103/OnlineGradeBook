import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidePanel from "../Components/AdminSidePanel";
import NavbarAdmin from "../Components/NavbarAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageSchoolYear = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schoolYears, setSchoolYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [nextYear, setNextYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Add new state to track promotion status
  const [isPromoted, setIsPromoted] = useState(false);

  const fetchSchoolYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/Pages/schoolyear",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        // Store all school years
        setSchoolYears(response.data);

        // Find current active year (status = 1)
        const active = response.data.find((year) => year.status === 1);
        if (active) {
          setCurrentYear(active);
          console.log("Active school year:", active);
        } else {
          console.log("No active school year found");
        }

        // Log all years for debugging
        console.log("All school years:", response.data);
      }
    } catch (err) {
      console.error("Error fetching school years:", err);
      setError("Failed to fetch school years");
      toast.error("Failed to fetch school years");
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const handlePromoteYear = async () => {
    if (!currentYear || !nextYear) {
      setError("Please select both current and next school year");
      toast.error("Please select both current and next school year");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to promote to the next school year? This will:\n" +
          "- Move students to their next grade levels\n" +
          "- Create new class assignments\n" +
          "- Change the active school year\n\n" +
          "This action cannot be undone!"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/Pages/admin/promote-school-year",
        {
          currentYearId: currentYear.school_yearID,
          nextYearId: nextYear.school_yearID,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await fetchSchoolYears();
        toast.success("School year promotion completed successfully!");
        // Set promoted status to true after successful promotion
        setIsPromoted(true);
      }
    } catch (err) {
      console.error("Promotion error:", err);
      setError(err.response?.data?.message || "Failed to promote school year");
      toast.error(
        err.response?.data?.message || "Failed to promote school year"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add handler for next year selection
  const handleNextYearChange = (e) => {
    const selected = schoolYears.find(
      (y) => y.school_yearID === parseInt(e.target.value)
    );
    setNextYear(selected);
    // Reset promoted status when selecting a new year
    setIsPromoted(false);
    console.log("Selected year:", selected);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidePanel
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <NavbarAdmin toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <ToastContainer />

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Manage School Year
            </h1>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current School Year
                  </label>
                  <div className="p-3 bg-gray-100 rounded border border-gray-200">
                    <p className="font-medium text-gray-800">
                      {currentYear
                        ? `${currentYear.year} (Active)`
                        : "No active school year"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next School Year
                  </label>
                  <select
                    className="w-full border rounded-md p-2.5"
                    value={nextYear?.school_yearID || ""}
                    onChange={handleNextYearChange}
                  >
                    <option value="">Select school year</option>
                    {schoolYears
                      .filter((year) => year.status === 0 && !year.hasPassed) // Only inactive and not passed
                      .map((year) => (
                        <option
                          key={year.school_yearID}
                          value={year.school_yearID}
                        >
                          {year.year}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-center mb-4">{error}</div>
              )}

              <button
                onClick={handlePromoteYear}
                disabled={loading || !currentYear || !nextYear || isPromoted}
                className={`w-full py-2 px-4 rounded-md transition-colors ${
                  loading || !currentYear || !nextYear || isPromoted
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading
                  ? "Processing..."
                  : isPromoted
                  ? "Promotion Completed"
                  : "Promote to Next School Year"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSchoolYear;

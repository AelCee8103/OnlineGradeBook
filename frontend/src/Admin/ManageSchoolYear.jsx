import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidePanel from "../Components/AdminSidePanel";
import NavbarAdmin from "../Components/NavbarAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageSchoolYear = () => {
  const [allAdvisoriesValidated, setAllAdvisoriesValidated] = useState(true);
  const [advisoryValidationDetails, setAdvisoryValidationDetails] = useState(
    []
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schoolYears, setSchoolYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [nextYear, setNextYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Add new state to track promotion status
  const [isPromoted, setIsPromoted] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(null);

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

  const fetchActiveQuarter = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:3000/Pages/active-quarter",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActiveQuarter(res.data.activeQuarter);
    } catch (err) {
      setActiveQuarter(null);
    }
  };

  const fetchAdvisoryValidationStatus = async (schoolYearID) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3000/Pages/admin/all-advisory-validation-status/${schoolYearID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllAdvisoriesValidated(res.data.allApproved);
      setAdvisoryValidationDetails(res.data.details);
    } catch (err) {
      setAllAdvisoriesValidated(false);
      setAdvisoryValidationDetails([]);
    }
  };

  useEffect(() => {
    fetchSchoolYears();
    fetchActiveQuarter();
  }, []);
  useEffect(() => {
    if (currentYear) {
      fetchAdvisoryValidationStatus(currentYear.school_yearID);
    }
  }, [currentYear]);

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

  const handleAdvanceQuarter = async () => {
    document.getElementById("next_quarter_modal").close(); // Close the modal
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3000/Pages/admin/next-quarter",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Advanced to Quarter ${res.data.nextQuarter}`);
        fetchActiveQuarter(); // Refresh the quarter display
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to advance quarter");
    }
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

              <p className="mb-2 text-sm text-gray-600">
                Current Quarter: {activeQuarter || "Loading..."}
              </p>
              <button
                className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-yellow-600"
                onClick={() =>
                  document.getElementById("next_quarter_modal").showModal()
                }
                disabled={activeQuarter >= 4}
              >
                Set to Next Quarter
              </button>

              <button
                onClick={handlePromoteYear}
                disabled={
                  loading ||
                  !currentYear ||
                  !nextYear ||
                  isPromoted ||
                  activeQuarter !== 4 ||
                  !allAdvisoriesValidated // <-- Add this
                }
                className={`w-full py-2 px-4 rounded-md transition-colors ${
                  loading ||
                  !currentYear ||
                  !nextYear ||
                  isPromoted ||
                  activeQuarter !== 4 ||
                  !allAdvisoriesValidated
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading
                  ? "Processing..."
                  : isPromoted
                  ? "Promotion Completed"
                  : activeQuarter !== 4
                  ? "Promotion only allowed in Quarter 4"
                  : !allAdvisoriesValidated
                  ? "All advisories must be validated (approved) first"
                  : "Promote to Next School Year"}
              </button>
              {!allAdvisoriesValidated &&
                advisoryValidationDetails.length > 0 && (
                  <div className="text-red-600 text-sm mt-2">
                    <strong>Advisories not validated or not approved:</strong>
                    <ul>
                      {advisoryValidationDetails
                        .filter(
                          (d) =>
                            !d.status || d.status.toLowerCase() !== "approved"
                        )
                        .map((d) => (
                          <li key={d.advisoryID}>
                            Advisory ID: {d.advisoryID} - Status:{" "}
                            {d.status || "No request"}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <dialog id="next_quarter_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Advance to Next Quarter</h3>
          <p className="mb-4">
            Are you sure you want to advance to the next quarter?
            <br />
            <br />
            <span className="text-red-600 font-semibold">
              This action cannot be undone.
            </span>
            <br />
            <br />
            Advancing to the next quarter will:
            <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
              <li>
                Move the grading period to the next quarter for all classes
              </li>
              <li>Lock previous quarter grades from editing</li>
              <li>Affect all gradebook and advisory operations</li>
            </ul>
          </p>
          <div className="modal-action flex gap-2">
            <button
              className="btn"
              onClick={() =>
                document.getElementById("next_quarter_modal").close()
              }
            >
              Cancel
            </button>
            <button
              className="btn bg-green-600 text-white hover:bg-green-700"
              onClick={handleAdvanceQuarter}
            >
              Confirm
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ManageSchoolYear;

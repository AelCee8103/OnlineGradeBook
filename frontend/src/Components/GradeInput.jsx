import React, { useState } from "react";
import { validateGradeInput } from "../Components/utils/gradeValidation";

const GradeInput = ({ initialValue, onSave, disabled }) => {
  const [value, setValue] = useState(initialValue || "");
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const newValue = e.target.value;

    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(newValue) && newValue !== "") {
      return;
    }

    setValue(newValue);
    setError(null);
  };

  const handleBlur = () => {
    if (value === "") {
      return;
    }

    const validation = validateGradeInput(value);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // If valid, convert to number with max 2 decimal places
    const formattedValue = Number(parseFloat(value).toFixed(2));
    setValue(formattedValue);
    onSave(formattedValue);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-20 px-2 py-1 border rounded ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100" : "bg-white"}`}
        placeholder="Grade"
      />
      {error && (
        <div className="absolute left-0 top-full mt-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default GradeInput;

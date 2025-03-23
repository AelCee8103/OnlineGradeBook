import React from "react";

const StatCard = ({ title, value, subtitle, textColor }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${textColor || "text-black"}`}>{value}</p>
      {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
    </div>
  );
};

export default StatCard;

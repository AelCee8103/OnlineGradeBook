import React from "react";

const StatCard = ({ title, value, subtitle, textColor = "text-black" }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition duration-300">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${textColor}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};

export default StatCard;

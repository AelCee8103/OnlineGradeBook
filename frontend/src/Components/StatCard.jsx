import React from "react";

const StatCard = ({ title, value, subtitle, textColor = "text-black" }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 w-full text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
};

export default StatCard;

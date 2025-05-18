import React, { useEffect, useState } from "react";

const StatCard = ({ title, value, subtitle, textColor = "text-black", icon }) => {
  const [displayValue, setDisplayValue] = useState("0");
  
  useEffect(() => {
    // If value is a loading indicator or not a number, just display it directly
    if (value === "..." || isNaN(parseInt(value))) {
      setDisplayValue(value);
      return;
    }
    
    // Simple animation for numbers
    const finalValue = parseInt(value);
    let startValue = 0;
    
    // Skip animation for small values
    if (finalValue <= 5) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 800; // ms
    const frameDuration = 16; // ms
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentValue = Math.round(startValue + progress * (finalValue - startValue));
      
      setDisplayValue(currentValue.toString());
      
      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);
    
    return () => clearInterval(counter);
  }, [value]);

  const getIcon = () => {
    switch (icon) {
      case 'students':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'classes':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'pending':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'validated':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition duration-300 relative overflow-hidden border-b-4 border-green-600 transform hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <p className={`text-3xl font-bold mt-2 ${textColor}`}>{displayValue}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="opacity-80">
          {getIcon()}
        </div>
      </div>
      <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-green-100 opacity-20"></div>
    </div>
  );
};

export default StatCard;

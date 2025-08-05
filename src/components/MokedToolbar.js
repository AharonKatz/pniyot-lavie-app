import React, { useState } from "react";

export default function MokedToolbar({ statusFilter, setStatusFilter }) {
  const statusOptions = ["פתוח", "בטיפול", "סגור"];
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8 mb-4 px-2" dir="rtl">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <button className="bg-purple-700 hover:bg-purple-800 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-md transition">
          <span className="material-icons">add</span>
        </button>
        <div className="flex gap-2 ml-2">
          {statusOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`rounded-full px-5 py-2 font-bold text-sm border transition shadow-sm
                ${statusFilter === opt
                  ? "bg-white text-purple-700 border-purple-700"
                  : "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center w-full md:w-72">
        <input
          type="text"
          placeholder="חיפוש"
          className="w-full rounded-full bg-gray-100 border border-gray-200 px-5 py-2 text-right focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
        />
        <span className="material-icons text-gray-400 -ml-8">search</span>
      </div>
    </div>
  );
} 
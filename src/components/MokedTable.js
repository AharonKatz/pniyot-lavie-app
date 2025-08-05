import React from "react";

const columns = [
  "#",
  "יצירה",
  "שם פרטי",
  "שם משפחה",
  "טלפון הפונה",
  "סוג",
  "מקור",
  "סטטוס",
  "נפתח ע" + String.fromCharCode(34) + "י"
];

export default function MokedTable() {
  return (
    <div className="w-full bg-gray-50 min-h-[200px] px-2 pb-8" dir="rtl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-right">
          <thead>
            <tr className="bg-purple-700 text-white text-md font-bold rounded-full">
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className={
                    "py-3 px-4 " +
                    (idx === 0 ? "rounded-r-full" : idx === columns.length - 1 ? "rounded-l-full" : "")
                  }
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* כאן ייכנסו שורות הפניות */}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
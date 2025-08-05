import React from "react";

export default function MokedHeader() {
  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-6 py-2" dir="rtl">
      <div className="flex items-center gap-4">
        <img src="/logo192.png" alt="לביא" className="h-12 w-auto ml-2" />
        <div className="flex flex-col">
          <span className="text-2xl font-extrabold text-yellow-700 leading-tight">לביא</span>
          <span className="text-xs text-yellow-700 -mt-1">העמותה לקידום חינוך ערכי בישראל</span>
        </div>
      </div>
      <nav className="flex items-center gap-10">
        <div className="flex flex-col items-center text-gray-500 hover:text-purple-700 cursor-pointer">
          <span className="material-icons text-3xl">apartment</span>
          <span className="text-xs mt-1">מוסדות</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 hover:text-purple-700 cursor-pointer">
          <span className="material-icons text-3xl">groups</span>
          <span className="text-xs mt-1">עובדים</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 hover:text-purple-700 cursor-pointer">
          <span className="material-icons text-3xl">request_quote</span>
          <span className="text-xs mt-1">בקשות למ"מ</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 hover:text-purple-700 cursor-pointer">
          <span className="material-icons text-3xl">bar_chart</span>
          <span className="text-xs mt-1">דוחות</span>
        </div>
        <div className="flex flex-col items-center text-purple-700 cursor-pointer">
          <span className="material-icons text-3xl">headset_mic</span>
          <span className="text-xs mt-1 font-bold">פניות</span>
        </div>
      </nav>
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-800">אהרון כץ</span>
        <span className="material-icons bg-gray-100 text-gray-700 rounded-full p-2">account_circle</span>
        <span className="material-icons text-gray-400">expand_more</span>
      </div>
    </header>
  );
} 
import React, { useState } from "react";
import "./TicketList.css";

export default function TicketList() {
  const [status, setStatus] = useState("פתוח");
  const filtered = demoTickets.filter(t => status === "פתוח" || t.status === status);
  return (
    <>
      <div className="ticket-toolbar">
        <div className="title">
          מוקד פניות
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="new-btn">+</button>
          <div className="status-filters">
            {['פתוח', 'בטיפול', 'סגור'].map(s => (
              <button
                key={s}
                className={status === s ? "active" : ""}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="search-box">
            <input placeholder="חיפוש" />
          </div>
        </div>
      </div>
      <div className="ticket-table-header">
        <div>#</div>
        <div>יצירה</div>
        <div>שם פרטי</div>
        <div>שם משפחה</div>
        <div>טלפון הפונה</div>
        <div>סוג</div>
        <div>מקור</div>
        <div>סטטוס</div>
        <div>נפתח ע"י</div>
      </div>
      {filtered.map((t) => (
        <div key={t.id} className="ticket-row">
          <div>{t.id}</div>
          <div>{t.createdAt}</div>
          <div>{t.firstName}</div>
          <div>{t.lastName}</div>
          <div>{t.phone}</div>
          <div>{t.type}</div>
          <div>{t.source}</div>
          <div>{t.status}</div>
          <div>{t.openedBy}</div>
        </div>
      ))}
    </>
  );
} 
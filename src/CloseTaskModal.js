import React, { useState } from 'react';
import { serverTimestamp } from "firebase/firestore";

const CloseTaskModal = ({ task, onClose, onCloseTask }) => {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('הושלם');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCloseTask({
      ...task,
      status: 'סגור',
      closeReason: reason,
      closeStatus: status,
      closeNotes: notes,
      closedAt: serverTimestamp()
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>&times;</button>
        <h2>סגירת משימה #{task.taskNumber}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>סטטוס סגירה</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="הושלם">הושלם</option>
              <option value="בוטל">בוטל</option>
              <option value="נדחה">נדחה</option>
              <option value="כפילות">כפילות</option>
            </select>
          </div>
          <div className="form-group">
            <label>סיבת הסגירה</label>
            <input 
              type="text" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="למשל: בוצע בהצלחה, בעיה נפתרה, וכו..."
              required 
            />
          </div>
          <div className="form-group">
            <label>הערות נוספות</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows="3"
              placeholder="הערות נוספות (אופציונלי)"
            ></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-submit">סגור משימה</button>
            <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseTaskModal;
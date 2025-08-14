import React, { useState } from 'react';
import { serverTimestamp } from "firebase/firestore";

const EditTaskModal = ({ task, onClose, onUpdateTask, users }) => {
  const [title, setTitle] = useState(task.title);
  const [assignee, setAssignee] = useState(task.assignee);
  const [priority, setPriority] = useState(task.priority);
  const [description, setDescription] = useState(task.description);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      alert("יש למלא נושא למשימה.");
      return;
    }
    onUpdateTask({ 
      ...task, 
      title, 
      assignee, 
      priority, 
      description,
      updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="modal-overlay"> 
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>&times;</button>
        <h2>עריכת משימה #{task.taskNumber}</h2>
        <form onSubmit={handleSubmit}>
           <div className="form-group">
            <label>נושא המשימה</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>מיועד ל-</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {users.map(user => (
                <option key={user.username} value={user.displayName}>{user.displayName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>עדיפות</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="נמוכה">נמוכה</option>
              <option value="בינונית">בינונית</option>
              <option value="גבוהה">גבוהה</option>
            </select>
          </div>
          <div className="form-group">
            <label>תיאור</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4"></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-submit">עדכן משימה</button>
            <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
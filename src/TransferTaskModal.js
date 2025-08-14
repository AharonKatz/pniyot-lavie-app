import React, { useState } from 'react';

const TransferTaskModal = ({ task, users, onClose, onTransferTask }) => {
    const [newAssignee, setNewAssignee] = useState('');
    const [transferNotes, setTransferNotes] = useState('');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!newAssignee) {
        alert("יש לבחור משתמש להעברת המשימה.");
        return;
      }
      onTransferTask(task, newAssignee, transferNotes);
    };
  
    const filteredUsers = users.filter(user => user.displayName !== task.assignee);
  
    return (
      <div className="modal-overlay">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal-btn" onClick={onClose}>&times;</button>
          <h2>העברת הטיפול</h2>
          <form onSubmit={handleSubmit} className="transfer-form">
            <div className="form-group">
              <label>העברה אל</label>
              <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} required>
                <option value="" disabled>-- בחר משתמש --</option>
                {filteredUsers.map(user => (
                  <option key={user.username} value={user.displayName}>{user.displayName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>טיפול</label>
              <textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows="4"
                placeholder="פה פירוט מה תרצה שיתבצע בהמשך"
              ></textarea>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">אישור</button>
            </div>
          </form>
        </div>
      </div>
    );
};

export default TransferTaskModal;
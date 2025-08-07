import React, { useState, useEffect, useMemo } from "react";
import NavBar from "./NavBar";
import "./MokedApp.css"; 

// --- ייבוא כל מה שצריך מ-Firebase ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "firebase/auth";

// --- רכיב מסך ההתחברות עם שדה שם מלא ---
const LoginScreen = ({ onLogin, users }) => {
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            await onLogin(fullName, password);
        } catch (err) {
            setError("שם המשתמש או הסיסמה שגויים.");
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>כניסה למערכת</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>שם מלא</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="לדוגמה: גד כהנא" />
                    </div>
                    <div className="form-group">
                        <label>סיסמה</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-submit" disabled={isLoggingIn}>
                        {isLoggingIn ? "מתחבר..." : "התחבר"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- רכיב עריכת משימה ---
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
      updatedAt: new Date()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}> 
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

// --- רכיב סגירת משימה עם פירוט ---
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
      closedAt: new Date()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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

// --- רכיב העברת משימה עם פירוט ---
const ReassignTaskModal = ({ task, onClose, onReassignTask, users }) => {
  const [newAssignee, setNewAssignee] = useState(task.assignee);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newAssignee === task.assignee) {
      alert("יש לבחור משתמש אחר");
      return;
    }
    onReassignTask({
      ...task,
      assignee: newAssignee,
      reassignReason: reason,
      reassignMessage: message,
      reassignedAt: new Date()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>&times;</button>
        <h2>העברת משימה #{task.taskNumber}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>העבר ל-</label>
            <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
              {users.map(user => (
                <option key={user.username} value={user.displayName}>{user.displayName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>סיבת ההעברה</label>
            <input 
              type="text" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="למשל: התמחות נדרשת, עומס עבודה, וכו..."
              required 
            />
          </div>
          <div className="form-group">
            <label>הודעה למקבל</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              rows="3"
              placeholder="הודעה למקבל המשימה (אופציונלי)"
            ></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-submit">העבר משימה</button>
            <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- רכיב טופס יצירת משימה ---
const NewTaskForm = ({ onClose, onAddTask, users }) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(''); 
  const [priority, setPriority] = useState('בינונית');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      alert("יש למלא נושא למשימה.");
      return;
    }
    onAddTask({ title, assignee, priority, description });
  };

  return (
    <div className="modal-overlay" onClick={onClose}> 
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>&times;</button>
        <h2>יצירת משימה חדשה</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>נושא המשימה</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>מיועד ל- (אופציונלי)</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">-- הקצה לעצמך --</option>
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
            <button type="submit" className="btn-submit">צור משימה</button>
            <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- רכיב פרטי משימה מעודכן ---
const TaskDetails = ({ task, users, onUpdateTask, onClose, currentUserProfile, onEditTask, onCloseTask, onReassignTask }) => {
    return (
        <div className="details-container">
            <div className="details-header">
                <h2>פרטי משימה #{task.taskNumber}</h2>
                <div className="header-actions">
                    {task.status !== 'סגור' && (
                        <button onClick={() => onEditTask(task)} className="btn-edit">ערוך</button>
                    )}
                    <button onClick={onClose} className="btn-back">חזור לטבלה</button>
                </div>
            </div>
            <div className="details-content">
                <h3>{task.title}</h3>
                <p><strong>מאת:</strong> {task.requester}</p>
                <p><strong>מיועד ל:</strong> {task.assignee}</p>
                <p><strong>סטטוס:</strong> {task.status}</p>
                <p><strong>עדיפות:</strong> {task.priority}</p>
                <p><strong>תאריך יצירה:</strong> {formatDate(task.createdAt)}</p>
                {task.updatedAt && <p><strong>עודכן לאחרונה:</strong> {formatDate(task.updatedAt)}</p>}
                
                <div className="details-description">
                    <strong>תיאור:</strong>
                    <p>{task.description}</p>
                </div>

                {/* מידע על סגירה */}
                {task.status === 'סגור' && (
                    <div className="close-info">
                        <h4>פרטי סגירה:</h4>
                        <p><strong>סטטוס:</strong> {task.closeStatus}</p>
                        <p><strong>סיבה:</strong> {task.closeReason}</p>
                        {task.closeNotes && <p><strong>הערות:</strong> {task.closeNotes}</p>}
                        {task.closedAt && <p><strong>תאריך סגירה:</strong> {formatDate(task.closedAt)}</p>}
                    </div>
                )}

                {/* מידע על העברה */}
                {task.reassignedAt && (
                    <div className="reassign-info">
                        <h4>פרטי העברה אחרונה:</h4>
                        <p><strong>סיבה:</strong> {task.reassignReason}</p>
                        {task.reassignMessage && <p><strong>הודעה:</strong> {task.reassignMessage}</p>}
                        <p><strong>תאריך העברה:</strong> {formatDate(task.reassignedAt)}</p>
                    </div>
                )}
            </div>

            {task.status !== 'סגור' && (
                <div className="details-actions">
                    <button onClick={() => onReassignTask(task)} className="btn-reassign">העבר משימה</button>
                    <button onClick={() => onCloseTask(task)} className="btn-close-ticket">סגור משימה</button>
                </div>
            )}
        </div>
    );
};

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  
  let date;
  if (dateInput.seconds) {
    // Firebase Timestamp
    date = new Date(dateInput.seconds * 1000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    return '';
  }
  
  return date.toLocaleDateString('he-IL');
};

const MokedApp = () => {
  const [statusFilter, setStatusFilter] = useState("פתוח");
  const [isFormVisible, setFormVisible] = useState(false); 
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [closingTask, setClosingTask] = useState(null);
  const [reassigningTask, setReassigningTask] = useState(null);
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  
  useEffect(() => {
    const firebaseConfig = {
      apiKey: "AIzaSyCYGDwSDB2zbyJVRgp7I-VPOvv9ujWGvxA",
      authDomain: "lavy-d35b5.firebaseapp.com",
      projectId: "lavy-d35b5",
      storageBucket: "lavy-d35b5.appspot.com",
      messagingSenderId: "659061505476",
      appId: "1:659061505476:web:710562e0cc0e4c3a8b7891",
      measurementId: "G-57YEVRRW12"
    };

    const app = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(app);
    const firebaseAuth = getAuth(app);
    
    setDb(firestoreDb);
    setAuth(firebaseAuth);

    const usersCollectionRef = collection(firestoreDb, "users");
    onSnapshot(usersCollectionRef, (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data());
        setStaffMembers(usersData);
    });

    let unsubscribe = () => {};
    const setupAuth = async () => {
        try {
            await setPersistence(firebaseAuth, browserSessionPersistence);
            unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
        } catch (error) {
            console.error("Error setting persistence:", error);
            setLoading(false);
        }
    };

    setupAuth();

    return () => {
        unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && staffMembers.length > 0) {
        const username = user.email.split('@')[0];
        const profile = staffMembers.find(member => member.username === username);
        setCurrentUserProfile(profile);
    } else {
        setCurrentUserProfile(null);
    }
  }, [user, staffMembers]);

  useEffect(() => {
    if (!db || !user) {
        setTasks([]);
        return;
    };
    
    const tasksQuery = query(collection(db, "tasks"), orderBy("taskNumber", "desc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setTasks(tasksData);
    });

    return () => unsubscribeTasks();
  }, [db, user]);

  const handleLogin = async (fullName, password) => {
    if (!auth) throw new Error("Auth service not ready");
    
    const userToLogin = staffMembers.find(member => member.displayName === fullName);
    if (!userToLogin) {
        throw new Error("User not found");
    }

    const email = `${userToLogin.username.toLowerCase()}@lavie.system`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleAddTask = async (newTaskData) => {
    if (!db || !currentUserProfile) return;
    const tasksCollectionRef = collection(db, "tasks");

    const counterQuery = query(tasksCollectionRef, orderBy("taskNumber", "desc"), limit(1));
    const lastTaskSnapshot = await getDocs(counterQuery);
    const lastTaskNumber = lastTaskSnapshot.empty ? 0 : lastTaskSnapshot.docs[0].data().taskNumber;
    
    const requesterName = currentUserProfile.displayName;
    const finalAssignee = newTaskData.assignee || requesterName;

    await addDoc(tasksCollectionRef, {
        ...newTaskData,
        assignee: finalAssignee,
        requester: requesterName, 
        status: "פתוח",
        createdAt: serverTimestamp(),
        taskNumber: lastTaskNumber + 1,
        followers: [requesterName]
    });
    setFormVisible(false);
  };

  const handleUpdateTask = async (updatedTask) => {
    if (!db) return;
    const taskDocRef = doc(db, "tasks", updatedTask.id);
    const { id, ...taskData } = updatedTask;
    await updateDoc(taskDocRef, taskData);
    setSelectedTask(null);
    setEditingTask(null);
  };

  const handleCloseTask = async (taskToClose) => {
    if (!db) return;
    const taskDocRef = doc(db, "tasks", taskToClose.id);
    const { id, ...taskData } = taskToClose;
    await updateDoc(taskDocRef, taskData);
    setClosingTask(null);
    setSelectedTask(null);
  };

  const handleReassignTask = async (taskToReassign) => {
    if (!db || !currentUserProfile) return;
    
    const currentUserDisplayName = currentUserProfile.displayName;
    const newFollowers = taskToReassign.followers ? [...taskToReassign.followers] : [taskToReassign.requester];
    if (!newFollowers.includes(currentUserDisplayName)) {
        newFollowers.push(currentUserDisplayName);
    }

    const taskDocRef = doc(db, "tasks", taskToReassign.id);
    const { id, ...taskData } = taskToReassign;
    await updateDoc(taskDocRef, {
        ...taskData,
        status: 'פתוח',
        followers: newFollowers
    });
    setReassigningTask(null);
    setSelectedTask(null);
  };
  
  const filteredTasks = useMemo(() => {
    if (!currentUserProfile) return [];
    const currentUserDisplayName = currentUserProfile.displayName;
    
    if (statusFilter === 'פתוח') {
        return tasks.filter(t => t.assignee === currentUserDisplayName && t.status === 'פתוח');
    }
    if (statusFilter === 'במעקב') {
        return tasks.filter(t => t.assignee !== currentUserDisplayName && t.status !== 'סגור' && t.followers && t.followers.includes(currentUserDisplayName));
    }
    if (statusFilter === 'סגור') {
        return tasks.filter(t => t.status === 'סגור' && (t.assignee === currentUserDisplayName || (t.followers && t.followers.includes(currentUserDisplayName))));
    }
    return [];
  }, [tasks, statusFilter, currentUserProfile]);

  if (loading) {
    return <div className="loading-indicator">טוען...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} users={staffMembers} />;
  }

  return (
    <div className="App" dir="rtl">
      {isFormVisible && <NewTaskForm onClose={() => setFormVisible(false)} onAddTask={handleAddTask} users={staffMembers} />}
      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdateTask={handleUpdateTask} users={staffMembers} />}
      {closingTask && <CloseTaskModal task={closingTask} onClose={() => setClosingTask(null)} onCloseTask={handleCloseTask} />}
      {reassigningTask && <ReassignTaskModal task={reassigningTask} onClose={() => setReassigningTask(null)} onReassignTask={handleReassignTask} users={staffMembers} />}
      
      <NavBar userProfile={currentUserProfile} onLogout={handleLogout} />
      <div className="page-container">
        
        {selectedTask ? (
            <TaskDetails 
                task={selectedTask} 
                users={staffMembers}
                onUpdateTask={handleUpdateTask}
                onClose={() => setSelectedTask(null)}
                currentUserProfile={currentUserProfile}
                onEditTask={setEditingTask}
                onCloseTask={setClosingTask}
                onReassignTask={setReassigningTask}
            />
        ) : (
            <>
                <div className="controls-bar">
                <div className="title-and-search">
                    <h1>ניהול משימות</h1>
                    <button className="add-new-btn" onClick={() => setFormVisible(true)}>+</button>
                    <div className="search-container">
                    <input type="text" placeholder="חפש..." />
                    </div>
                </div>
                <div className="filter-tabs">
                    {["פתוח", "במעקב", "סגור"].map((status) => (
                    <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>
                        {status}
                    </button>
                    ))}
                </div>
                </div>

                <div className="data-table-container">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>נושא המשימה</th>
                        <th>מיועד ל-</th>
                        <th>עדיפות</th>
                        <th>סטטוס</th>
                        <th>תאריך יצירה</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredTasks.map((task) => (
                        <tr key={task.id} onClick={() => setSelectedTask(task)} className="clickable-row">
                        <td>{task.taskNumber}</td>
                        <td>{task.title}</td>
                        <td>{task.assignee}</td>
                        <td className={`priority-${task.priority}`}>{task.priority}</td>
                        <td>{task.status}</td>
                        <td>{formatDate(task.createdAt)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default MokedApp;
import React, { useState, useEffect, useMemo } from "react";
import NavBar from "./NavBar";
import "./MokedApp.css"; 

// --- ייבוא כל מה שצריך מ-Firebase ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy, limit, getDocs, arrayUnion } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "firebase/auth";

// --- רכיב מסך ההתחברות ---
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
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}/>
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
    <div className="modal-overlay"> 
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

// --- רכיב לסגירת משימה עם פירוט ---
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

// --- רכיב חדש להעברת משימה ---
const TransferTaskModal = ({ task, users, onClose, onTransferTask, currentUserProfile }) => {
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
  
    // מסננים את המשתמש הנוכחי מרשימת ההעברה
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

// --- רכיב פרטי משימה ---
const TaskDetails = ({ task, users, onUpdateTask, onClose, currentUserProfile, onEditTask, onCloseTask, onInitiateTransfer }) => {

    const isCurrentUserAssignee = currentUserProfile?.displayName === task.assignee;

    return (
        <div className="details-container">
            <div className="details-header">
                <h2>פרטי משימה #{task.taskNumber}</h2>
                <div className="header-actions">
                    {isCurrentUserAssignee && task.status !== 'סגור' && (
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
                
                {task.status === 'סגור' && (
                    <div className="close-info">
                        <h4>פרטי סגירה</h4>
                        <p><strong>סטטוס סופי:</strong> {task.closeStatus}</p>
                        <p><strong>סיבה:</strong> {task.closeReason}</p>
                        {task.closeNotes && <p><strong>הערות:</strong> {task.closeNotes}</p>}
                        <p><strong>תאריך סגירה:</strong> {formatDate(task.closedAt)}</p>
                    </div>
                )}

                <div className="details-description">
                    <strong>תיאור:</strong>
                    <p>{task.description}</p>
                </div>
            </div>
            {isCurrentUserAssignee && task.status !== 'סגור' && (
                <div className="details-actions">
                     <button onClick={() => onInitiateTransfer(task)} className="btn-reassign">העבר טיפול</button>
                     <button onClick={() => onCloseTask(task)} className="btn-close-ticket">סגור משימה</button>
                </div>
            )}
        </div>
    );
};


const formatDate = (dateString) => {
  if (!dateString || !dateString.seconds) return '';
  const date = new Date(dateString.seconds * 1000);
  return date.toLocaleString('he-IL');
};

const MokedApp = () => {
  const [statusFilter, setStatusFilter] = useState("פתוח");
  const [isFormVisible, setFormVisible] = useState(false); 
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [closingTask, setClosingTask] = useState(null);
  const [transferringTask, setTransferringTask] = useState(null);
  
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
    if (!db) return;

    const usersCollectionRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data());
        setStaffMembers(usersData);
    }, (error) => console.error("Error fetching users:", error));

    if (!user) {
        setTasks([]);
        return () => unsubscribeUsers();
    };
    
    const tasksQuery = query(collection(db, "tasks"), orderBy("taskNumber", "desc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setTasks(tasksData);
    }, (error) => console.error("Error fetching tasks:", error));

    return () => {
        unsubscribeUsers();
        unsubscribeTasks();
    };
  }, [db, user]);

  useEffect(() => {
    if (user && staffMembers.length > 0) {
        const username = user.email.split('@')[0];
        const profile = staffMembers.find(member => member.username === username);
        setCurrentUserProfile(profile);
    } else {
        setCurrentUserProfile(null);
    }
  }, [user, staffMembers]);

  const handleLogin = async (fullName, password) => {
    if (!auth || staffMembers.length === 0) throw new Error("Auth service or staff list not ready");
    
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

 const handleTransferTask = async (task, newAssignee, transferNotes) => {
    if (!db || !currentUserProfile) return;

    const currentUserDisplayName = currentUserProfile.displayName;

    const newFollowers = task.followers ? [...task.followers] : [task.requester];
    if (!newFollowers.includes(currentUserDisplayName)) {
        newFollowers.push(currentUserDisplayName);
    }

    // ----  השינוי המרכזי כאן ----
    const newHistoryEntry = {
        from: currentUserDisplayName,
        to: newAssignee,
        notes: transferNotes,
        date: new Date() // שימוש בזמן מקומי מהדפדפן במקום serverTimestamp()
    };

    const taskDocRef = doc(db, "tasks", task.id);
    
    await updateDoc(taskDocRef, {
        assignee: newAssignee,
        status: 'פתוח',
        followers: newFollowers,
        transferHistory: arrayUnion(newHistoryEntry),
        updatedAt: serverTimestamp() // זה נשאר כמו שהוא - תקין לחלוטין
    });

    setTransferringTask(null);
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

 
  if (loading || !db) {
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
      {transferringTask && <TransferTaskModal 
          task={transferringTask} 
          onClose={() => setTransferringTask(null)}
          onTransferTask={handleTransferTask}
          users={staffMembers}
          currentUserProfile={currentUserProfile}
      />}
      
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
                onInitiateTransfer={setTransferringTask}
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
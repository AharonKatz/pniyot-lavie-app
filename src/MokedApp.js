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

// --- רכיב פרטי משימה ---
const TaskDetails = ({ task, users, onUpdateTask, onClose, currentUserProfile }) => {
    const [newAssignee, setNewAssignee] = useState(task.assignee);

    const handleReassign = () => {
        const currentUserDisplayName = currentUserProfile.displayName;
        
        const newFollowers = task.followers ? [...task.followers] : [task.requester];
        if (!newFollowers.includes(currentUserDisplayName)) {
            newFollowers.push(currentUserDisplayName);
        }

        onUpdateTask({ 
            ...task, 
            assignee: newAssignee,
            status: 'פתוח', 
            followers: newFollowers
        });
    };

    const handleClose = () => {
        onUpdateTask({ ...task, status: 'סגור' });
    };

    return (
        <div className="details-container">
            <div className="details-header">
                <h2>פרטי משימה #{task.taskNumber}</h2>
                <button onClick={onClose} className="btn-back">חזור לטבלה</button>
            </div>
            <div className="details-content">
                <h3>{task.title}</h3>
                <p><strong>מאת:</strong> {task.requester}</p>
                <p><strong>מיועד ל:</strong> {task.assignee}</p>
                <p><strong>סטטוס:</strong> {task.status}</p>
                <p><strong>עדיפות:</strong> {task.priority}</p>
                <p><strong>תאריך יצירה:</strong> {formatDate(task.createdAt)}</p>
                <div className="details-description">
                    <strong>תיאור:</strong>
                    <p>{task.description}</p>
                </div>
            </div>
            {task.status !== 'סגור' && (
                <div className="details-actions">
                    <div className="reassign-action">
                        <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                            {users.map(user => <option key={user.username} value={user.displayName}>{user.displayName}</option>)}
                        </select>
                        <button onClick={handleReassign} className="btn-reassign">העבר</button>
                    </div>
                    <button onClick={handleClose} className="btn-close-ticket">סגור משימה</button>
                </div>
            )}
        </div>
    );
};


const formatDate = (dateString) => {
  if (!dateString || !dateString.seconds) return '';
  const date = new Date(dateString.seconds * 1000);
  return date.toLocaleDateString('he-IL');
};

const MokedApp = () => {
  const [statusFilter, setStatusFilter] = useState("פתוח");
  const [isFormVisible, setFormVisible] = useState(false); 
  const [selectedTask, setSelectedTask] = useState(null);
  
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
  };
  
  const filteredTasks = useMemo(() => {
    if (!currentUserProfile) return [];
    const currentUserDisplayName = currentUserProfile.displayName;
    
    if (statusFilter === 'פתוח') {
        return tasks.filter(t => t.assignee === currentUserDisplayName && t.status === 'פתוח');
    }
    if (statusFilter === 'במעקב') {
        return tasks.filter(t => t.assignee !== currentUserDisplayName && t.status === 'במעקב' && t.followers && t.followers.includes(currentUserDisplayName));
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
      
      <NavBar userProfile={currentUserProfile} onLogout={handleLogout} />
      <div className="page-container">
        
        {selectedTask ? (
            <TaskDetails 
                task={selectedTask} 
                users={staffMembers}
                onUpdateTask={handleUpdateTask}
                onClose={() => setSelectedTask(null)}
                currentUserProfile={currentUserProfile}
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

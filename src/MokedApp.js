import React, { useState, useEffect, Suspense, lazy } from "react";
import NavBar from "./NavBar";
import "./MokedApp.css";

// --- ייבוא כל מה שצריך מ-Firebase (כולל כלים לדפדוף) ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy, limit, getDocs, where, arrayUnion, startAfter } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "firebase/auth";

// --- ייבוא "עצל" של הרכיבים הכבדים ---
const NewTaskForm = lazy(() => import('./NewTaskForm'));
const EditTaskModal = lazy(() => import('./EditTaskModal'));
const CloseTaskModal = lazy(() => import('./CloseTaskModal'));
const TransferTaskModal = lazy(() => import('./TransferTaskModal'));

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
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required/>
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

// --- רכיב פרטי משימה ---
const TaskDetails = ({ task, onClose, currentUserProfile, onEditTask, onCloseTask, onInitiateTransfer }) => {
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

                {task.transferHistory && task.transferHistory.length > 0 && (
                  <div className="transfer-history">
                    <h4>היסטוריית העברות</h4>
                    {[...task.transferHistory].reverse().map((entry, index) => (
                      <div key={index} className="history-entry">
                        <p>
                          <small>
                            <strong>הועבר מאת:</strong> {entry.from}
                            <strong> אל:</strong> {entry.to}
                            <strong> בתאריך:</strong> {formatDate(entry.date)}
                          </small>
                        </p>
                        {entry.notes && (
                          <p className="history-notes">
                            <strong>הערות ההעברה:</strong> {entry.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
  if (!dateString) return '';
  if (dateString.toDate) return dateString.toDate().toLocaleString('he-IL');
  if (dateString.seconds) return new Date(dateString.seconds * 1000).toLocaleString('he-IL');
  return new Date(dateString).toLocaleString('he-IL');
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

  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const TASKS_PER_PAGE = 20;

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

    const setupAuth = async () => {
      try {
        await setPersistence(firebaseAuth, browserSessionPersistence);
        onAuthStateChanged(firebaseAuth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting persistence:", error);
        setLoading(false);
      }
    };
    setupAuth();
  }, []);

  useEffect(() => {
    if (!db) return;
    const usersCollectionRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
        setStaffMembers(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Error fetching users:", error));
    return () => unsubscribeUsers();
  }, [db]);

  useEffect(() => {
    if (user && staffMembers.length > 0) {
        setCurrentUserProfile(staffMembers.find(member => member.username === user.email.split('@')[0]));
    } else {
        setCurrentUserProfile(null);
    }
  }, [user, staffMembers]);

  useEffect(() => {
    if (!db || !user || !currentUserProfile) {
        setTasks([]);
        return;
    }

    setLoading(true);
    setLastVisible(null); 

    let baseQuery;
    const currentUserDisplayName = currentUserProfile.displayName;

    if (statusFilter === 'פתוח') {
        baseQuery = query(collection(db, "tasks"), where("status", "==", "פתוח"), where("assignee", "==", currentUserDisplayName), orderBy("taskNumber", "desc"));
    } else if (statusFilter === 'במעקב') {
        baseQuery = query(collection(db, "tasks"), where("status", "!=", "סגור"), where("followers", "array-contains", currentUserDisplayName), orderBy("status"), orderBy("taskNumber", "desc"));
    } else if (statusFilter === 'סגור') {
        baseQuery = query(collection(db, "tasks"), where("status", "==", "סגור"), where("followers", "array-contains", currentUserDisplayName), orderBy("taskNumber", "desc"));
    } else {
        setLoading(false);
        return;
    }

    const q = query(baseQuery, limit(TASKS_PER_PAGE));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        let tasksData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        if (statusFilter === 'במעקב') {
            tasksData = tasksData.filter(t => t.assignee !== currentUserDisplayName);
        }
        
        setTasks(tasksData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setLoading(false);
    }, (error) => {
        console.error(`Error fetching tasks for filter '${statusFilter}':`, error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [db, user, currentUserProfile, statusFilter]);
  
  const fetchMoreTasks = async () => {
    if (!lastVisible || !currentUserProfile) return;

    setLoadingMore(true);
    const currentUserDisplayName = currentUserProfile.displayName;
    
    let baseQuery;
    if (statusFilter === 'פתוח') {
        baseQuery = query(collection(db, "tasks"), where("status", "==", "פתוח"), where("assignee", "==", currentUserDisplayName), orderBy("taskNumber", "desc"));
    } else if (statusFilter === 'במעקב') {
        baseQuery = query(collection(db, "tasks"), where("status", "!=", "סגור"), where("followers", "array-contains", currentUserDisplayName), orderBy("status"), orderBy("taskNumber", "desc"));
    } else if (statusFilter === 'סגור') {
        baseQuery = query(collection(db, "tasks"), where("status", "==", "סגור"), where("followers", "array-contains", currentUserDisplayName), orderBy("taskNumber", "desc"));
    } else {
        setLoadingMore(false);
        return;
    }

    const nextQuery = query(baseQuery, startAfter(lastVisible), limit(TASKS_PER_PAGE));
    
    try {
        const documentSnapshots = await getDocs(nextQuery);
        let newTasks = documentSnapshots.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        if (statusFilter === 'במעקב') {
            newTasks = newTasks.filter(t => t.assignee !== currentUserDisplayName);
        }

        setTasks(prevTasks => [...prevTasks, ...newTasks]);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    } catch (error) {
        console.error("Error fetching more tasks:", error);
    }
    setLoadingMore(false);
  };
  
  const handleLogin = async (fullName, password) => {
    if (!auth || staffMembers.length === 0) throw new Error("Auth service or staff list not ready");
    const userToLogin = staffMembers.find(member => member.displayName === fullName);
    if (!userToLogin) throw new Error("User not found");
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
        followers: [requesterName],
        transferHistory: []
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
    if (!newFollowers.includes(currentUserDisplayName)) newFollowers.push(currentUserDisplayName);
    const newHistoryEntry = { from: currentUserDisplayName, to: newAssignee, notes: transferNotes, date: new Date() };
    const taskDocRef = doc(db, "tasks", task.id);
    await updateDoc(taskDocRef, {
        assignee: newAssignee,
        status: 'פתוח',
        followers: newFollowers,
        transferHistory: arrayUnion(newHistoryEntry),
        updatedAt: serverTimestamp()
    });
    setTransferringTask(null);
    setSelectedTask(null);
  };
  
  if (loading && tasks.length === 0) {
    return <div className="loading-indicator">טוען...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} users={staffMembers} />;
  }

  return (
    <div className="App" dir="rtl">
      <Suspense fallback={<div className="loading-indicator">טוען...</div>}>
        {isFormVisible && <NewTaskForm onClose={() => setFormVisible(false)} onAddTask={handleAddTask} users={staffMembers} />}
        {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdateTask={handleUpdateTask} users={staffMembers} />}
        {closingTask && <CloseTaskModal task={closingTask} onClose={() => setClosingTask(null)} onCloseTask={handleCloseTask} />}
        {transferringTask && <TransferTaskModal 
            task={transferringTask} 
            onClose={() => setTransferringTask(null)}
            onTransferTask={handleTransferTask}
            users={staffMembers}
        />}
      </Suspense>
      
      <NavBar userProfile={currentUserProfile} onLogout={handleLogout} />
      <div className="page-container">
        
        {selectedTask ? (
            <TaskDetails 
                task={selectedTask} 
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
                  {loading && tasks.length === 0 ? (
                      <div className="loading-indicator" style={{marginTop: '20px'}}>טוען משימות...</div>
                  ) : (
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
                          {tasks.map((task) => (
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
                  )}
                </div>
                {lastVisible && !loadingMore && (
                    <div className="load-more-container">
                        <button onClick={fetchMoreTasks} className="load-more-btn">טען עוד</button>
                    </div>
                )}
                {loadingMore && <div className="loading-indicator">טוען נתונים נוספים...</div>}
            </>
        )}
      </div>
    </div>
  );
};

export default MokedApp;
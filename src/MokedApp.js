import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";
import "./MokedApp.css"; 

// --- ייבוא כל מה שצריך מ-Firebase ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// --- רכיב מסך ההתחברות עם קוד איתור באגים ---
const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            await onLogin(username, password);
        } catch (err) {
            console.error("Caught an error during login:", err); // מדפיס את השגיאה המלאה לקונסולה לצורך איתור באגים
            setError("שם המשתמש או הסיסמה שגויים."); // הצגת הודעה ברורה למשתמש
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>כניסה למערכת</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>שם משתמש</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
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


// --- שאר הרכיבים נשארים ללא שינוי ---
const NewTicketForm = ({ onClose, onAddTicket, users }) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(''); 
  const [priority, setPriority] = useState('בינונית');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !assignee) {
      alert("יש למלא נושא ולבחור למי מיועדת הבקשה.");
      return;
    }
    onAddTicket({ title, assignee, priority, description });
  };

  return (
    <div className="modal-overlay" onClick={onClose}> 
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>&times;</button>
        <h2>יצירת בקשה חדשה</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>נושא הבקשה</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>מיועד ל-</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} required>
              <option value="" disabled>בחר איש צוות</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
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
            <button type="submit" className="btn-submit">צור בקשה</button>
            <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TicketDetails = ({ ticket, users, onUpdateTicket, onClose }) => {
    const [newAssignee, setNewAssignee] = useState(ticket.assignee);

    const handleReassign = () => {
        onUpdateTicket({ ...ticket, assignee: newAssignee });
    };

    const handleClose = () => {
        onUpdateTicket({ ...ticket, status: 'סגור' });
    };

    return (
        <div className="details-container">
            <div className="details-header">
                <h2>פרטי בקשה #{ticket.id.substring(0, 6)}...</h2>
                <button onClick={onClose} className="btn-back">חזור לטבלה</button>
            </div>
            <div className="details-content">
                <h3>{ticket.title}</h3>
                <p><strong>מאת:</strong> {ticket.requester}</p>
                <p><strong>מיועד ל:</strong> {ticket.assignee}</p>
                <p><strong>סטטוס:</strong> {ticket.status}</p>
                <p><strong>עדיפות:</strong> {ticket.priority}</p>
                <p><strong>תאריך יצירה:</strong> {formatDate(ticket.createdAt)}</p>
                <div className="details-description">
                    <strong>תיאור:</strong>
                    <p>{ticket.description}</p>
                </div>
            </div>
            <div className="details-actions">
                <div className="reassign-action">
                    <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                        {users.map(user => <option key={user} value={user}>{user}</option>)}
                    </select>
                    <button onClick={handleReassign} className="btn-reassign">העבר</button>
                </div>
                <button onClick={handleClose} className="btn-close-ticket">סגור בקשה</button>
            </div>
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
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);

  const staffMembers = ["אורלי מנהלת משאבי אנוש", "משה איש IT", "רונית מנהלת משרד", "יוסי כהן", "דנה לוי", "אבי כהן"];
  
  useEffect(() => {
    // eslint-disable-next-line no-undef
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  

    const firebaseConfig = {
      apiKey: "AIzaSyCYGDwSDB2zbyJVRgp7I-VPOvv9ujWGvxA",
      authDomain: "lavy-d35b5.firebaseapp.com",
      projectId: "lavy-d35b5",
      storageBucket: "lavy-d35b5.firebasestorage.app",
      messagingSenderId: "659061505476",
      appId: "1:659061505476:web:710562e0cc0e4c3a8b7891",
      measurementId: "G-57YEVRRW12"
    };

    if (!firebaseConfig) {
        console.error("Firebase config not found");
        setLoading(false);
        return;
    }

    const app = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(app);
    const firebaseAuth = getAuth(app);
    
    setDb(firestoreDb);
    setAuth(firebaseAuth);

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !user) {
        setTickets([]);
        return;
    };

    // eslint-disable-next-line no-undef
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const ticketsCollectionRef = collection(db, `artifacts/${appId}/public/data/tickets`);
    
    const unsubscribe = onSnapshot(ticketsCollectionRef, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setTickets(ticketsData);
    });

    return () => unsubscribe();
  }, [db, user]);

  // --- פונקציית התחברות עם קוד איתור באגים ---
  const handleLogin = async (username, password) => {
    if (!auth) {
        console.error("Auth service is not ready. Aborting login.");
        throw new Error("Auth service is not available.");
    }
    const email = `${username.toLowerCase()}@lavie.system`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleAddTicket = async (newTicketData) => {
    if (!db || !user) return;
    try {
        // eslint-disable-next-line no-undef
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const ticketsCollectionRef = collection(db, `artifacts/${appId}/public/data/tickets`);
        await addDoc(ticketsCollectionRef, {
            ...newTicketData,
            requester: user.displayName || user.email.split('@')[0], 
            status: "פתוח",
            createdAt: serverTimestamp()
        });
        setFormVisible(false);
    } catch (error) {
        console.error("Error adding ticket: ", error);
    }
  };

  const handleUpdateTicket = async (updatedTicket) => {
    if (!db) return;
    try {
        // eslint-disable-next-line no-undef
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const ticketDocRef = doc(db, `artifacts/${appId}/public/data/tickets`, updatedTicket.id);
        const { id, ...ticketData } = updatedTicket;
        await updateDoc(ticketDocRef, ticketData);
        setSelectedTicket(null);
    } catch (error) {
        console.error("Error updating ticket: ", error);
    }
  };
  
  const filteredTickets = tickets.filter((t) => t.status === statusFilter);

  if (loading) {
    return <div className="loading-indicator">טוען...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="App" dir="rtl">
      {isFormVisible && <NewTicketForm onClose={() => setFormVisible(false)} onAddTicket={handleAddTicket} users={staffMembers} />}
      
      <NavBar user={user} onLogout={handleLogout} />
      <div className="page-container">
        
        {selectedTicket ? (
            <TicketDetails 
                ticket={selectedTicket} 
                users={staffMembers}
                onUpdateTicket={handleUpdateTicket}
                onClose={() => setSelectedTicket(null)}
            />
        ) : (
            <>
                <div className="controls-bar">
                <div className="title-and-search">
                    <h1>מוקד פניות</h1>
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
                        <th>נושא הבקשה</th>
                        <th>מיועד ל-</th>
                        <th>עדיפות</th>
                        <th>סטטוס</th>
                        <th>תאריך יצירה</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="clickable-row">
                        <td>{ticket.id.substring(0, 6)}...</td>
                        <td>{ticket.title}</td>
                        <td>{ticket.assignee}</td>
                        <td className={`priority-${ticket.priority}`}>{ticket.priority}</td>
                        <td>{ticket.status}</td>
                        <td>{formatDate(ticket.createdAt)}</td>
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

import React from 'react';
import logo from './lavie-logo.png'; 
import './NavBar.css'; 

const NavBar = ({ user, onLogout }) => {
  // פונקציה קטנה להצגת שם המשתמש
  const getUsername = (user) => {
    if (!user) return '';
    // נותן עדיפות לשם תצוגה אם קיים, אחרת חותך את המייל
    return user.displayName || user.email.split('@')[0];
  }

  return (
    <header className="main-header">
      
      <div className="logo">
        <img src={logo} alt="לוגו עמותת לביא" />
      </div>
      
      <nav className="main-nav">
        <a href="/tickets">פניות</a>
      </nav>
      
      {/* --- תצוגת שם משתמש והתנתקות --- */}
      <div className="user-menu">
        <span className="user-email">{getUsername(user)}</span>
        <button onClick={onLogout} className="logout-btn">התנתק</button>
      </div>

    </header>
  );
};

export default NavBar;

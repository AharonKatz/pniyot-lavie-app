import React from 'react';
import logo from './lavie-logo.png'; 
import './NavBar.css'; 

const NavBar = ({ user, onLogout }) => {
  return (
    <header className="main-header">
      
      <div className="logo">
        <img src={logo} alt="לוגו עמותת לביא" />
      </div>
      
      <nav className="main-nav">
        <a href="/tickets">פניות</a>
      </nav>
      
      {/* --- תצוגת משתמש והתנתקות --- */}
      <div className="user-menu">
        <span className="user-email">{user.email}</span>
        <button onClick={onLogout} className="logout-btn">התנתק</button>
      </div>

    </header>
  );
};

export default NavBar;

import React from 'react';
import logo from './lavie-logo.png'; 
import './NavBar.css'; 

const NavBar = ({ user, onLogout }) => {
  const getUsername = (user) => {
    if (!user) return '';
    return user.displayName || user.email.split('@')[0];
  }

  return (
    <header className="main-header">
      
      <div className="logo">
        <img src={logo} alt="לוגו עמותת לביא" />
      </div>
      
      <nav className="main-nav">
        <a href="#">משימות</a>
      </nav>
      
      <div className="user-menu">
        <span className="user-email">{getUsername(user)}</span>
        <button onClick={onLogout} className="logout-btn">התנתק</button>
      </div>

    </header>
  );
};

export default NavBar;

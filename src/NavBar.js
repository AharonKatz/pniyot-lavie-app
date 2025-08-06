import React from 'react';
import logo from './lavie-logo.png'; 
import './NavBar.css'; 

const NavBar = ({ userProfile, onLogout }) => {
  const getUsername = () => {
    if (!userProfile) return '';
    return userProfile.displayName;
  }

  return (
    <header className="main-header">
      
      <div className="logo">
        <img src={logo} alt="לוגו עמותת לביא" />
      </div>
      
      <nav className="main-nav">
        {/* תיקון: שינוי הקישור כך שיוביל לדף הבית */}
        <a href="/">משימות</a>
      </nav>
      
      <div className="user-menu">
        <span className="user-email">{getUsername()}</span>
        <button onClick={onLogout} className="logout-btn">התנתק</button>
      </div>

    </header>
  );
};

export default NavBar;

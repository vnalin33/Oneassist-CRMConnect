import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Logo.css';
import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';


function Logo({ className = '' }) {
  const { theme } = useTheme();

  // Use logo-light.png (black 'a') for light theme
  // Use logo-dark.png (white 'a') for dark theme
  const currentLogo = theme === 'light' ? logoLight : logoDark;

  return (
    <div className={`app-logo-wrapper ${className}`} data-theme={theme}>
      <div className="app-logo-icon-container">
        <img 
          src={currentLogo} 
          alt="One Assist Logo" 
          className="app-logo-img" 
          key={theme} // Key forces re-render/swap for "no time" transition
        />
      </div>
      <div className="app-logo-text-group">
        <span className="app-logo-brand">ONE ASSIST</span>
        <span className="app-logo-sub">TECHNOLOGIES</span>
      </div>
    </div>
  );
}

export default Logo;

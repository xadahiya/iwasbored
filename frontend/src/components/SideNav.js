import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideNav.css';

const SideNav = () => {
  return (
    <div className="side-nav">
      <NavLink to="/swipe" className="side-nav-link" activeClassName="active">
        Swipe
      </NavLink>
      <NavLink to="/my-bets" className="side-nav-link" activeClassName="active">
        My Bets
      </NavLink>
    </div>
  );
};

export default SideNav;

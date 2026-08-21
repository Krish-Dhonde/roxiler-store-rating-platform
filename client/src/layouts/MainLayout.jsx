import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Left-Aligned Vertical Navigation Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        onCloseMobile={() => setMobileOpen(false)} 
      />

      {/* Main View Area (Header + Routed Page Content) */}
      <div className="app-main-wrapper">
        <Header onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
// import army from '../assets/login/kushal.PNG';
import logo from '../assets/logo/logo1.png';
import logo1 from '../assets/logo/logo2.png';
import { getMenuItems, getCurrentUserRole } from '../lib/roleUtils';

const Layout = ({ children, selectedSection, onSectionChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = getMenuItems();
  const userRole = getCurrentUserRole();

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col min-h-screen md:flex-row bg-[#020B17]">
      {/* Mobile sidebar toggle */}
      <div className="sticky top-0 z-40 md:hidden flex items-center justify-between bg-[#020B17] px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Kushal Logo" className="w-10 h-10 object-contain rounded-full" />
          <span className="text-white text-lg font-bold">STEAG</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white focus:outline-none">
          <span className="text-2xl">☰</span>
        </button>
      </div>
      {/* Sidebar Backdrop for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      {/* Sidebar */}
      <div className={`fixed md:sticky md:top-0 z-40 top-0 left-0 h-full md:h-screen w-64 bg-gradient-to-br from-[#020B17] to-[#0a1a2e] shadow-2xl flex flex-col h-full overflow-y-auto transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex md:relative`}>
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-white/10">
          <img src={logo} alt="Kushal Logo" className="w-16 h-14 object-contain rounded-full shadow-lg border-white/20" />
          <div>
            <h1 className="text-white text-xl font-bold tracking-wide">STEAG</h1>
          </div>
        </div>
        <div className="border-b border-white/20 mb-2 hidden md:block"></div>
        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSectionChange(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left hover:transform hover:translate-x-2 hover:shadow-lg ${
                selectedSection === item.id
                  ? 'bg-white/15 text-white border-l-4 border-blue-400 shadow-md'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl w-6 flex justify-center">{item.icon}</span>
              <span className="font-medium">{item.text}</span>
            </button>
          ))}
        </nav>
        {/* Footer Section - always visible at bottom */}
        <div className="mt-auto p-4 border-t border-white/10 backdrop-blur-sm" style={{background: 'linear-gradient(to right, rgba(2, 11, 23, 0.8), rgba(10, 26, 46, 0.8))'}}>
          <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(to bottom right, #020B17, #0a1a2e)'}}>
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">STEAG</p>
              <p className="text-white/60 text-xs">{userRole || 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl shadow-lg"
            style={{background: 'linear-gradient(to right, #dc2626, #b91c1c)'}}
            onMouseEnter={e => e.target.style.background = 'linear-gradient(to right, #ef4444, #dc2626)'}
            onMouseLeave={e => e.target.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)'}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="z-30 shadow-xl align-middle p-0   md:p-6 lg:p-4  xl:p-10 w-full flex-shrink-0" style={{background: 'linear-gradient(to right, #020B17, #0a1a2e, #1a2e4a)'}}>
          <div className="flex  flex-col sm:flex-row items-center px-2 sm:px-4 py-0 justify-between gap-4 w-full">
            <div className='flex justify-center items-center'>
              <h1 className="text-transparent bg-clip-text text-xl text-center sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide drop-shadow-lg" style={{backgroundImage: 'linear-gradient(to right, #ffffff, #d1d5db, #9ca3af)'}}>
                  WELCOME TO GUEST ROOM MANAGEMENT
              </h1>
            </div>
            <div>
              {/* <img src={logo1} alt="logo" className='w-14 h-10 object-contain' /> */}
            </div>
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-1 p-2 sm:p-6 md:p-8 lg:p-12 bg-black">
          <div className="bg-[#020B17] backdrop-blur-sm rounded-2xl shadow-xl border-white/20 p-2 sm:p-6 md:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 
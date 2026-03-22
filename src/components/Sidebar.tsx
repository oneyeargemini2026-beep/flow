import React, { useState } from 'react';

const Sidebar: React.FC = () => {
  const [activeNav, setActiveNav] = useState('Today');
  const [folders, setFolders] = useState({
    work: true,
    personal: false,
  });

  const toggleFolder = (folder: 'work' | 'personal') => {
    setFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const navItems = [
    { name: 'Today', icon: 'today', badge: '12' },
    { name: 'Upcoming', icon: 'calendar_month' },
    { name: 'Inbox', icon: 'inbox' },
    { name: 'Goals', icon: 'target' },
    { name: 'Matrix', icon: 'grid_view' },
    { name: 'Calendar', icon: 'calendar_today' },
    { name: 'Archive', icon: 'archive' },
    { name: 'Tags', icon: 'sell' },
  ];

  return (
    <aside className="w-72 min-w-[288px] h-screen bg-[#191b24] shadow-[0_40px_40px_-15px_rgba(205,189,255,0.08)] flex flex-col overflow-hidden animate-[slideIn_0.35s_cubic-bezier(0.22,1,0.36,1)_both]">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3">
          <span className="font-['Manrope'] text-[22px] font-extrabold tracking-[-0.5px] text-[#cdbdff] animate-[fadeUp_0.4s_ease_0.1s_both]">Flow</span>
        </div>

        {/* Views */}
        <nav className="flex flex-col gap-0.5">
          <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#919096] mb-4 px-3">Views</p>
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeNav === item.name
                  ? 'bg-[#200060] text-[#8d69ff]'
                  : 'text-[#919096] hover:bg-[#282933] hover:text-[#e1e1ef]'
              }`}
              onClick={(e) => { e.preventDefault(); setActiveNav(item.name); }}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${activeNav === item.name ? 'fill-icon' : ''}`}>{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.badge && <span className="text-[11px] font-bold bg-[#200060]/50 text-[#cdbdff] px-2 py-0.5 rounded-full">{item.badge}</span>}
            </a>
          ))}
        </nav>

        {/* Folders */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#919096]">Folders</p>
            <span className="material-symbols-outlined text-[#919096] cursor-pointer hover:text-[#cdbdff] transition-all hover:rotate-90">add</span>
          </div>
          
          {/* Work Folder */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer hover:bg-[#282933] transition-all" onClick={() => toggleFolder('work')}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6833ea] shadow-[0_0_8px_rgba(104,51,234,0.4)]"></span>
                <span className="text-sm font-medium text-[#c8c5cc] hover:text-[#e1e1ef]">Work</span>
              </div>
              <span className={`material-symbols-outlined text-[#919096] transition-transform duration-300 ${folders.work ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            {folders.work && (
              <div className="ml-8 pl-4 border-l border-[#47464c]/15 flex flex-col gap-0.5 mt-1">
                <a className="text-xs text-[#919096] py-1.5 cursor-pointer hover:text-[#cdbdff] hover:pl-1 transition-all" href="#">Design System</a>
                <a className="text-xs text-[#919096] py-1.5 cursor-pointer hover:text-[#cdbdff] hover:pl-1 transition-all" href="#">Client Onboarding</a>
              </div>
            )}
          </div>

          {/* Personal Folder */}
          <div className="flex flex-col mt-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer hover:bg-[#282933] transition-all" onClick={() => toggleFolder('personal')}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7dffa2] shadow-[0_0_8px_rgba(125,255,162,0.4)]"></span>
                <span className="text-sm font-medium text-[#c8c5cc] hover:text-[#e1e1ef]">Personal</span>
              </div>
              <span className={`material-symbols-outlined text-[#919096] transition-transform duration-300 ${folders.personal ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            {folders.personal && (
              <div className="ml-8 pl-4 border-l border-[#47464c]/15 flex flex-col gap-0.5 mt-1">
                {/* Personal children */}
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex flex-col gap-0.5 pt-4 border-t border-[#47464c]/10">
          <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#919096] hover:bg-[#282933] hover:text-[#e1e1ef] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#919096] hover:bg-[#282933] hover:text-[#e1e1ef] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">history</span>
            <span>History</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#919096] hover:bg-[#282933] hover:text-[#e1e1ef] text-sm font-medium" href="#">
            <span className="material-symbols-outlined">delete</span>
            <span>Trash</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#47464c]/10 flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#919096] hover:bg-[#282933] hover:text-[#e1e1ef] text-sm font-medium w-full">
          <span className="material-symbols-outlined">potted_plant</span>
          <span>Focus Mode</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-[rgba(255,180,171,0.8)] hover:bg-[rgba(147,0,10,0.2)] text-sm font-medium w-full">
          <span className="material-symbols-outlined">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

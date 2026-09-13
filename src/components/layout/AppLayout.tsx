import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, ListTodo, Layers, Moon, Sun, Menu, Trash2, Database, QrCode, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const { isDarkMode, toggleDarkMode, toggleDeletingJobs, toggleDeletingMaterials, injectTestData } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMenuAction = (action: 'tasks' | 'materials') => {
    setShowMenu(false);
    if (action === 'tasks') {
      toggleDeletingJobs(true);
      navigate('/todo');
    } else {
      toggleDeletingMaterials(true);
      navigate('/materials');
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/todo', icon: ListTodo, label: 'Jobs' },
    { to: '/scan', icon: QrCode, label: 'Scan' },
    { to: '/materials', icon: Layers, label: 'Mats' },
    { to: '/equipment', icon: Wrench, label: 'Equip' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Glass Header */}
      <header className="glass-header text-slate-800 p-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/icon.jpg" alt="CheckMate Logo" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">
            CheckMate
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-full glass-panel hover-lift text-slate-600 tap-effect"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors tap-effect"
            >
              <Menu className="w-6 h-6" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => handleMenuAction('tasks')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-bold bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors mb-2 tap-effect">
                    <Trash2 className="w-4 h-4" />
                    Delete Tasks
                  </button>
                  <button onClick={() => handleMenuAction('materials')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-bold bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors tap-effect">
                    <Trash2 className="w-4 h-4" />
                    Delete Materials
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-2"></div>
                  <button onClick={() => { injectTestData(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors tap-effect">
                    <Database className="w-4 h-4" />
                    Load Test Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 relative z-0">
        <Outlet />
      </main>

      {/* Glass Bottom Navigation */}
      <nav className="glass-nav fixed bottom-0 w-full z-20 pb-safe">
        <ul className="flex justify-around items-center h-[72px] px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to} className="w-full h-full">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center justify-center w-full h-full transition-all duration-300 tap-effect',
                    isActive ? 'text-primary-600 scale-110' : 'text-slate-400 hover:text-primary-500'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={clsx("w-6 h-6 mb-1 transition-all", isActive ? "stroke-[2.5px] drop-shadow-sm" : "stroke-2")} />
                    <span className={clsx("text-[10px] transition-all", isActive ? "font-bold" : "font-medium")}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

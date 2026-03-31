import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  Wallet,
  FileText,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Bell,
  ChefHat,
  UtensilsCrossed,
  CalendarOff,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/members', icon: Users, label: 'Members' },
  { path: '/tiffin-entry', icon: UtensilsCrossed, label: 'Tiffin Entry' },
  { path: '/leave-entry', icon: CalendarOff, label: 'Leave Entry' },
  { path: '/bills', icon: Receipt, label: 'Bills' },
  { path: '/payments', icon: CreditCard, label: 'Payments' },
  { path: '/expenses', icon: Wallet, label: 'Expenses' },
  { path: '/reports', icon: FileText, label: 'Reports' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const darkMode = useAuthStore((state) => state.darkMode);
  const toggleDarkMode = useAuthStore((state) => state.toggleDarkMode);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
            </button>
            <div className="flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-emerald-600" />
              <span className="font-bold text-lg text-slate-800 dark:text-white">MessPay</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 z-50"
            >
              <SidebarContent
                user={user}
                logout={logout}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                location={location}
                setSidebarOpen={setSidebarOpen}
                showCloseButton={true}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 z-40">
          <SidebarContent
            user={user}
            logout={logout}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            location={location}
            setSidebarOpen={setSidebarOpen}
            showCloseButton={false}
          />
        </aside>

        {/* Main Content */}
        <main className="lg:ml-[280px] pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  logout,
  darkMode,
  toggleDarkMode,
  location,
  setSidebarOpen,
  showCloseButton,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">MessPay</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mess Management</p>
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-500" />
          </button>
        </div>
        <button
          onClick={toggleDarkMode}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
        >
          {darkMode ? (
            <><Sun className="w-4 h-4" /> Light Mode</>
          ) : (
            <><Moon className="w-4 h-4" /> Dark Mode</>
          )}
        </button>
      </div>
    </div>
  );
}

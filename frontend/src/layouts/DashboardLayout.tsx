import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, X, Bell } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F0DE] flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Mobile Sidebar Modal Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-[#171715]/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 bg-[#F3EBD8] h-full shadow-2xl z-10 flex flex-col">
              <div className="p-4 border-b border-[#D8C9A7] flex items-center justify-between">
                <span className="font-serif font-bold text-lg text-[#373124]">Workspace Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-[#494431] hover:bg-[#D8C9A7]/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar className="w-full h-full border-r-0" onClose={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar for Mobile & Quick Status */}
          <div className="bg-[#F6F0DE] border-b border-[#D8C9A7] px-4 sm:px-6 py-3 flex items-center justify-between md:justify-end gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#373124] hover:bg-[#F3EBD8]"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="p-2 text-[#494431] hover:text-[#171715] hover:bg-[#F3EBD8] rounded-full relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C3A66B] ring-2 ring-[#F6F0DE]" />
              </Link>

              <div className="h-6 w-px bg-[#D8C9A7]" />

              <Link to="/dashboard" className="flex items-center gap-2.5">
                <Avatar name={user?.name || 'User'} size="sm" />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-[#373124] leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#494431]">
                    {user?.roles?.[0] || 'User'}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

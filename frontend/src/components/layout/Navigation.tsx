// src/components/layout/Navigation.tsx

import React from 'react';
import { Settings2, LayoutDashboard, Clock, LogOut } from 'lucide-react';
import { User } from '../../types';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: "dashboard" | "setup" | "history") => void;
  user: User | null;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  setCurrentView,
  user,
  onLogout,
}) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">CSV Transformer</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`${
                  currentView === "dashboard"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Operations Dashboard
              </button>
              <button
                onClick={() => setCurrentView("setup")}
                className={`${
                  currentView === "setup"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Configuration Setup
              </button>
              <button
                onClick={() => setCurrentView("history")}
                className={`${
                  currentView === "history"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <Clock className="w-4 h-4 mr-2" />
                History
              </button>
            </div>
          </div>
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
'use client';

import { useState } from 'react';
import { Settings, Moon, Sun, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function SettingsContent() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">Settings</h1>
              <p className="text-sm text-body">Customize your learning experience</p>
            </div>
          </div>

          {/* Appearance */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Moon className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Appearance</h3>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/20 p-4">
              <div>
                <p className="font-medium text-heading">Dark Mode</p>
                <p className="text-sm text-body">Enable dark theme for the interface</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  darkMode ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/20 p-4">
                <div>
                  <p className="font-medium text-heading">Push Notifications</p>
                  <p className="text-sm text-body">Receive notifications about your learning progress</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/20 p-4">
                <div>
                  <p className="font-medium text-heading">Email Alerts</p>
                  <p className="text-sm text-body">Receive weekly progress reports via email</p>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    emailAlerts ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      emailAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Privacy</h3>
            </div>
            <div className="rounded-xl border border-white/20 p-4">
              <p className="font-medium text-heading">Manage your privacy settings</p>
              <p className="mb-4 text-sm text-body">Control data collection, consent preferences, and data retention.</p>
              <button
                onClick={() => window.location.href = '/student/privacy'}
                className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
              >
                Open Privacy Center
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Save Settings
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <SettingsContent />
    </ProtectedRoute>
  );
}

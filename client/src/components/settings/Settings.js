import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your clinic settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
            </div>
            <p className="text-gray-600">
              Update your clinic information, contact details, and preferences.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
            </div>
            <p className="text-gray-600">
              Configure how you receive notifications about patient responses and system updates.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            </div>
            <p className="text-gray-600">
              Manage your password, two-factor authentication, and security preferences.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <SettingsIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button className="w-full btn-secondary text-left">
                Export Patient Data
              </button>
              <button className="w-full btn-secondary text-left">
                Download Reports
              </button>
              <button className="w-full btn-secondary text-left">
                System Status
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
            <div className="space-y-2">
              <button className="w-full btn-secondary text-left">
                Help Center
              </button>
              <button className="w-full btn-secondary text-left">
                Contact Support
              </button>
              <button className="w-full btn-secondary text-left">
                Feature Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

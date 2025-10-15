import React from 'react';
import { Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Reminders = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-600">Schedule and manage patient follow-up reminders</p>
        </div>
        <Link to="/reminders/new" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Reminder
        </Link>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reminder Management</h3>
          <p className="text-gray-600 mb-6">
            This page will show your scheduled reminders, their status, and allow you to create new follow-up reminders for your patients.
          </p>
          <Link to="/reminders/new" className="btn-primary">
            Schedule Your First Reminder
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Reminders;

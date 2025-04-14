import React from 'react';

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('employees')}
          className={`${activeTab === 'employees' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`${activeTab === 'videos' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Video Tutorials
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Chat
        </button>

      </nav>
    </div>
  );
};

export default NavigationTabs;
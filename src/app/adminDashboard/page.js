"use client";

import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
// ... other imports and code


Chart.register(...registerables);

const adminDashboard = () => {
  // State for form inputs
  const [employee, setEmployee] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    isAdmin: false,
    startDate: new Date()
  });
  
  const [task, setTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date(),
    videoLink: ''
  });
  
  const [video, setVideo] = useState({
    title: '',
    url: '',
    category: '',
    description: ''
  });

  // State for data lists
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [videos, setVideos] = useState([]);

  // State for active tab
  const [activeTab, setActiveTab] = useState('employees');

  // Analytics data
  const [analytics, setAnalytics] = useState({
    activeEmployees: 0,
    completionRate: 0,
    departmentDistribution: {},
    popularVideos: [],
    completedTasks: [],
    progressByDepartment: {},
    commonSuggestions: []
  });

  // Fetch data on component mount
  useEffect(() => {
    // In a real app, these would be API calls
    const mockEmployees = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Developer', department: 'Engineering', isAdmin: false, startDate: '2023-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer', department: 'Design', isAdmin: false, startDate: '2023-02-20' },
      { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', department: 'Management', isAdmin: true, startDate: '2023-03-10' }
    ];

    const mockTasks = [
      { id: 1, title: 'Complete HR paperwork', description: 'Fill out all required HR forms', assignedTo: '1', dueDate: '2023-04-15', videoLink: '', completed: true },
      { id: 2, title: 'Set up development environment', description: 'Install all required software', assignedTo: '1', dueDate: '2023-04-20', videoLink: 'https://example.com/video1', completed: false },
      { id: 3, title: 'Design onboarding flow', description: 'Create wireframes for new onboarding', assignedTo: '2', dueDate: '2023-04-25', videoLink: 'https://example.com/video2', completed: false }
    ];

    const mockVideos = [
      { id: 1, title: 'Company Culture', url: 'https://example.com/video1', category: 'General', description: 'Introduction to our company values', views: 42 },
      { id: 2, title: 'Git Basics', url: 'https://example.com/video2', category: 'Engineering', description: 'Getting started with version control', views: 35 },
      { id: 3, title: 'Design Principles', url: 'https://example.com/video3', category: 'Design', description: 'Our approach to product design', views: 28 }
    ];

    const mockAnalytics = {
      activeEmployees: 24,
      completionRate: 78,
      departmentDistribution: {
        Engineering: 12,
        Design: 5,
        Marketing: 4,
        Management: 3
      },
      popularVideos: [
        { title: 'Company Culture', views: 42 },
        { title: 'Git Basics', views: 35 },
        { title: 'Design Principles', views: 28 }
      ],
      completedTasks: [
        { title: 'HR Paperwork', count: 22 },
        { title: 'Dev Setup', count: 18 },
        { title: 'Team Intro', count: 15 }
      ],
      progressByDepartment: {
        Engineering: 82,
        Design: 75,
        Marketing: 68,
        Management: 90
      },
      commonSuggestions: [
        'More interactive tutorials',
        'Better documentation',
        'Mentorship program'
      ]
    };

    setEmployees(mockEmployees);
    setTasks(mockTasks);
    setVideos(mockVideos);
    setAnalytics(mockAnalytics);
  }, []);

  // Handle form submissions
  const handleAddEmployee = (e) => {
    e.preventDefault();
    const newEmployee = {
      id: employees.length + 1,
      ...employee,
      startDate: employee.startDate.toISOString().split('T')[0]
    };
    setEmployees([...employees, newEmployee]);
    setEmployee({
      name: '',
      email: '',
      role: '',
      department: '',
      isAdmin: false,
      startDate: new Date()
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    const newTask = {
      id: tasks.length + 1,
      ...task,
      dueDate: task.dueDate.toISOString().split('T')[0],
      completed: false
    };
    setTasks([...tasks, newTask]);
    setTask({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: new Date(),
      videoLink: ''
    });
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    const newVideo = {
      id: videos.length + 1,
      ...video,
      views: 0
    };
    setVideos([...videos, newVideo]);
    setVideo({
      title: '',
      url: '',
      category: '',
      description: ''
    });
  };

  // Chart data preparation
  const departmentData = {
    labels: Object.keys(analytics.departmentDistribution),
    datasets: [
      {
        label: 'Employees by Department',
        data: Object.values(analytics.departmentDistribution),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const progressData = {
    labels: Object.keys(analytics.progressByDepartment),
    datasets: [
      {
        label: 'Onboarding Progress %',
        data: Object.values(analytics.progressByDepartment),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const videoData = {
    labels: analytics.popularVideos.map(v => v.title),
    datasets: [
      {
        label: 'Video Views',
        data: analytics.popularVideos.map(v => v.views),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
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
          </nav>
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Employee</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleAddEmployee}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={employee.name}
                        onChange={(e) => setEmployee({...employee, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        id="email"
                        value={employee.email}
                        onChange={(e) => setEmployee({...employee, email: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                      <input
                        type="text"
                        id="role"
                        value={employee.role}
                        onChange={(e) => setEmployee({...employee, role: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                      <select
                        id="department"
                        value={employee.department}
                        onChange={(e) => setEmployee({...employee, department: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Management">Management</option>
                        <option value="HR">Human Resources</option>
                      </select>
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                      <DatePicker
                        selected={employee.startDate}
                        onChange={(date) => setEmployee({...employee, startDate: date})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3 flex items-center">
                      <input
                        type="checkbox"
                        id="isAdmin"
                        checked={employee.isAdmin}
                        onChange={(e) => setEmployee({...employee, isAdmin: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">Admin Privileges</label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Employee
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Employees List */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Current Employees</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.startDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {emp.isAdmin ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Task</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleAddTask}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Task Title</label>
                      <input
                        type="text"
                        id="taskTitle"
                        value={task.title}
                        onChange={(e) => setTask({...task, title: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="taskDescription"
                        rows={3}
                        value={task.description}
                        onChange={(e) => setTask({...task, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
                      <select
                        id="assignedTo"
                        value={task.assignedTo}
                        onChange={(e) => setTask({...task, assignedTo: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                      <DatePicker
                        selected={task.dueDate}
                        onChange={(date) => setTask({...task, dueDate: date})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700">Video Tutorial Link (Optional)</label>
                      <input
                        type="url"
                        id="videoLink"
                        value={task.videoLink}
                        onChange={(e) => setTask({...task, videoLink: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Task
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Tasks List */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Current Tasks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((t) => {
                      const assignedEmployee = employees.find(e => e.id.toString() === t.assignedTo);
                      return (
                        <tr key={t.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{t.title}</div>
                            <div className="text-sm text-gray-500">{t.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignedEmployee ? `${assignedEmployee.name} (${assignedEmployee.department})` : 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.dueDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {t.completed ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {t.videoLink && (
                              <a href={t.videoLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                View
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Video Tutorial</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleAddVideo}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        id="videoTitle"
                        value={video.title}
                        onChange={(e) => setVideo({...video, title: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">URL</label>
                      <input
                        type="url"
                        id="videoUrl"
                        value={video.url}
                        onChange={(e) => setVideo({...video, url: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="videoCategory" className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        id="videoCategory"
                        value={video.category}
                        onChange={(e) => setVideo({...video, category: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select Category</option>
                        <option value="General">General</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="HR">HR</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="videoDescription"
                        rows={3}
                        value={video.description}
                        onChange={(e) => setVideo({...video, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Video
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Videos List */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Video Tutorial Library</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videos.map((v) => (
                      <tr key={v.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.views}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{v.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                            Watch
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Onboarding Analytics</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active Employees */}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-indigo-800">Active Employees</h4>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{analytics.activeEmployees}</p>
                    <p className="text-sm text-indigo-500 mt-1">Currently going through onboarding</p>
                  </div>

                  {/* Completion Rate */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-green-800">Average Completion Rate</h4>
                    <p className="text-3xl font-bold text-green-600 mt-2">{analytics.completionRate}%</p>
                    <p className="text-sm text-green-500 mt-1">Of assigned onboarding tasks</p>
                  </div>

                  {/* Department Distribution */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Employees by Department</h4>
                    <div className="h-64">
                      <Pie data={departmentData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>

                  {/* Progress by Department */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Progress by Department</h4>
                    <div className="h-64">
                      <Bar data={progressData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>

                  {/* Popular Videos */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Most Watched Video Tutorials</h4>
                    <div className="h-64">
                      <Bar data={videoData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>

                  {/* Common Suggestions */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Common Suggestions</h4>
                    <ul className="space-y-2">
                      {analytics.commonSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default adminDashboard;
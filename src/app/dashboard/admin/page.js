"use client";
import { useState, useEffect } from "react";
import NavigationTabs from "../../../../components/Dashboard/admin/NavigationTabs";
import EmployeesTab from "../../../../components/Dashboard/admin/EmployeesTab";
import TasksTab from "../../../../components/Dashboard/admin/TasksTab";
import VideosTab from "../../../../components/Dashboard/admin/VideosTab";
import AnalyticsTab from "../../../../components/Dashboard/admin/AnalyticsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("employees");

  // Initialize with proper structure
  const [employee, setEmployee] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    startDate: new Date()
  });

  const [employees, setEmployees] = useState([]);
  const [task, setTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date(),
    videoLink: ''
  });
  const [tasks, setTasks] = useState([]);
  const [video, setVideo] = useState({
    title: '',
    url: '',
    category: '',
    description: ''
  });
  const [videos, setVideos] = useState([]);
  const [analytics, setAnalytics] = useState({
    activeEmployees: 0,
    completionRate: 0,
    departmentDistribution: {},
    progressByDepartment: {},
    popularVideos: [],
    commonSuggestions: []
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "employees" && (
          <EmployeesTab
            employee={employee}
            employees={employees}
            setEmployee={setEmployee}
            setEmployees={setEmployees}
          />
        )}

        {activeTab === "tasks" && (
          <TasksTab
            task={task}
            tasks={tasks}
            employees={employees}
            setTask={setTask}
            setTasks={setTasks}
          />
        )}

        {activeTab === "videos" && (
          <VideosTab
            video={video}
            videos={videos}
            setVideo={setVideo}
            setVideos={setVideos}
          />
        )}

        {activeTab === "videos" && (
          <VideosTab
            video={video}
            videos={videos}
            setVideo={setVideo}
            setVideos={setVideos}
          />
        )}

        {activeTab === "analytics" && <AnalyticsTab analytics={analytics} />}
      </main>
    </div>
  );
};

export default AdminDashboard;
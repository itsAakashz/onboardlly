"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../../lib/firebase"; // Import your Firebase auth instance
import { onAuthStateChanged } from "firebase/auth";
import NavigationTabs from "../../../../components/Dashboard/admin/NavigationTabs";
import EmployeesTab from "../../../../components/Dashboard/admin/EmployeesTab";
import TasksTab from "../../../../components/Dashboard/admin/TasksTab";
import VideosTab from "../../../../components/Dashboard/admin/VideosTab";
import AnalyticsTab from "../../../../components/Dashboard/admin/AnalyticsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

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

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
        setLoading(false);
      } else {
        // No user is signed in, redirect to login
        router.push('/login');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">You need to be logged in to access this page</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button 
            onClick={() => auth.signOut().then(() => router.push('/'))}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
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

        {activeTab === "analytics" && <AnalyticsTab analytics={analytics} />}
      </main>
    </div>
  );
};

export default AdminDashboard;
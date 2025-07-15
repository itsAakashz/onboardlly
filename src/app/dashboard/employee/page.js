"use client";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../../../lib/firebase";
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  VideoCameraIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowUpCircleIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import TasksTab from '../../../../components/Dashboard/admin/TasksTab'; // Adjust the path as needed

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const GENERAL_ROOM = "general";

export default function EmployeePage() {
  const [employeeData, setEmployeeData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [tasksData, setTasksData] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState(GENERAL_ROOM);
  const [msgInput, setMsgInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bottomRef = useRef(null);
  const [allTasks, setAllTasks] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError("You must be logged in to access this page.");
        setLoading(false);
        return;
      }

      setLoading(true);

      // Real-time employees
      const unsubEmps = onSnapshot(collectionGroup(db, "employees"), (allSnap) => {
        const allEmps = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllEmployees(allEmps);

        const meDoc = allEmps.find((e) => e.uid === user.uid);
        if (!meDoc) {
          setError("Employee profile not found.");
          setLoading(false);
          return;
        }
        setEmployeeData(meDoc);

        // Real-time tasks for this user
        const qTasks = query(collection(db, "tasks"), where("assignedTo", "==", meDoc.id));
        const unsubTasks = onSnapshot(qTasks, (taskSnap) => {
          setTasksData(taskSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // Real-time all tasks (for team average)
        const unsubAllTasks = onSnapshot(collection(db, "tasks"), (tasksSnap) => {
          setAllTasks(tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // Real-time videos
        const unsubVideos = onSnapshot(collection(db, "videos"), (vidSnap) => {
          setVideoData(vidSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        setLoading(false);

        // Cleanup
        return () => {
          unsubTasks();
          unsubAllTasks();
          unsubVideos();
        };
      });

      // Cleanup
      return () => unsubEmps();
    });

    // Cleanup
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chats", roomId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })));
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const sendMsg = async () => {
    if (sending || !msgInput.trim() || !auth.currentUser) return;
    setSending(true);
    await addDoc(collection(db, "chats", roomId, "messages"), {
      text: msgInput.trim(),
      senderUid: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || auth.currentUser.email,
      createdAt: serverTimestamp(),
    });
    setMsgInput("");
    setSending(false);
  };

  const dmId = (uid1, uid2) => [uid1, uid2].sort().join("_").replace(/^/, "dm_");

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      // Update the task status in Firestore
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus
      });
      // Update local state
      setTasksData(tasksData.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Data for charts
  const taskStatusData = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [
      {
        data: [
          tasksData.filter((t) => t.status === "completed").length,
          tasksData.filter((t) => t.status === "in-progress").length,
          tasksData.filter((t) => !t.status || t.status === "not-started").length,
        ],
        backgroundColor: [
          "rgba(74, 222, 128, 0.8)",
          "rgba(250, 204, 21, 0.8)",
          "rgba(248, 113, 113, 0.8)"
        ],
        borderColor: [
          "rgba(74, 222, 128, 1)",
          "rgba(250, 204, 21, 1)",
          "rgba(248, 113, 113, 1)"
        ],
        borderWidth: 1,
      },
    ],
  };

  const videoViewsData = {
    labels: videoData.map((v) => v.title),
    datasets: [
      {
        data: videoData.map((v) => v.views || 0),
        backgroundColor: "rgba(99, 102, 241, 0.6)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1
      }
    ],
  };

  const progressData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Your Progress",
        data: [30, 45, 60, 65, 80, 95],
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.3,
        fill: true
      },
      {
        label: "Team Average",
        data: [20, 35, 50, 60, 70, 85],
        borderColor: "rgba(74, 222, 128, 1)",
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        tension: 0.3,
        fill: true
      }
    ]
  };

  const teamProgress = allEmployees.length
    ? allEmployees.reduce((sum, emp) => sum + (emp.progress || 0), 0) / allEmployees.length
    : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6 bg-white rounded-xl shadow-sm max-w-md">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.href = "/login"}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  if (!employeeData) return null;

  const { name, progress = 0, department, role } = employeeData;
  const otherUsers = employees.filter((e) => e.uid !== auth.currentUser.uid && e.uid);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">WorkHub</span>
              </div>
              // Update your navigation buttons in the EmployeePage component
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`${activeTab === "dashboard" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`${activeTab === "tasks" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => setActiveTab("assigned-tasks")}
                  className={`${activeTab === "assigned-tasks" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Assigned Tasks
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`${activeTab === "videos" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Training
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`${activeTab === "chat" ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Team Chat
                </button>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <span>Sign out</span>
              </button>
            </div>
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
                className={`${activeTab === "dashboard" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab("tasks");
                  setMobileMenuOpen(false);
                }}
                className={`${activeTab === "tasks" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Tasks
              </button>
              <button
                onClick={() => {
                  setActiveTab("videos");
                  setMobileMenuOpen(false);
                }}
                className={`${activeTab === "videos" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Training
              </button>
              <button
                onClick={() => {
                  setActiveTab("chat");
                  setMobileMenuOpen(false);
                }}
                className={`${activeTab === "chat" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Team Chat
              </button>

              // Update your mobile menu buttons
              <button
                onClick={() => {
                  setActiveTab("assigned-tasks");
                  setMobileMenuOpen(false);
                }}
                className={`${activeTab === "assigned-tasks" ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Assigned Tasks
              </button>
              <button
                onClick={handleLogout}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === "dashboard" && (
          <>
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8">
              <div className="p-4 sm:p-6 md:p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome back, {name}!</h1>
                    <p className="mt-1 sm:mt-2 opacity-90 text-sm sm:text-base">{role} • {department}</p>
                    <div className="mt-3 sm:mt-4 w-full bg-white bg-opacity-20 rounded-full h-2.5">
                      <div
                        className="bg-white h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-90">Your progress: {progress}%</p>
                  </div>
                  <div className="mt-3 sm:mt-4 md:mt-0">
                    <button className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-opacity-90 transition text-sm sm:text-base">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
              <StatCard
                title="Total Tasks"
                value={tasksData.length}
                icon={<CheckCircleIcon className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-600" />}
                trend="up"
                change="12%"
                color="indigo"
              />
              <StatCard
                title="Completed"
                value={tasksData.filter(t => t.status === "completed").length}
                icon={<CheckCircleIcon className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />}
                trend="up"
                change="8%"
                color="green"
              />
              <StatCard
                title="In Progress"
                value={tasksData.filter(t => t.status === "in-progress").length}
                icon={<ArrowPathIcon className="h-5 sm:h-6 w-5 sm:w-6 text-amber-600" />}
                trend="down"
                change="3%"
                color="amber"
              />
              <StatCard
                title="Training Videos"
                value={videoData.length}
                icon={<VideoCameraIcon className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />}
                trend="up"
                change="24%"
                color="purple"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8 lg:grid-cols-2">
              <ChartCard title="Task Status Distribution">
                <Pie
                  data={taskStatusData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20
                        }
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </ChartCard>
              <ChartCard title="Your Progress vs Team Average">
                <Line
                  data={progressData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </ChartCard>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 sm:mb-8">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {tasksData.slice(0, 5).map((task) => (
                  <div key={task.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center">
                    <div className={`flex-shrink-0 h-8 sm:h-10 w-8 sm:w-10 rounded-full flex items-center justify-center ${task.status === "completed" ? "bg-green-100" :
                      task.status === "in-progress" ? "bg-amber-100" : "bg-red-100"
                      }`}>
                      {task.status === "completed" ? (
                        <CheckCircleIcon className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />
                      ) : task.status === "in-progress" ? (
                        <ArrowPathIcon className="h-5 sm:h-6 w-5 sm:w-6 text-amber-600" />
                      ) : (
                        <ClockIcon className="h-5 sm:h-6 w-5 sm:w-6 text-red-600" />
                      )}
                    </div>
                    <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-0">
                          Due: {new Date(task.dueDate?.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Tasks</h2>
              <div className="flex space-x-2">
                <button className="px-2 sm:px-3 py-1 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50">
                  Filter
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {tasksData.length > 0 ? (
                tasksData.map((task) => (
                  <div key={task.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <input 
                        type="checkbox" 
                        checked={task.status === "completed"}
                        onChange={() => handleTaskStatusChange(task.id, task.status === "completed" ? "not-started" : "completed")}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p className={`text-sm font-medium truncate ${
                          task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                        }`}>
                          {task.title}
                        </p>
                        <span className={`mt-1 sm:mt-0 px-2 py-1 text-xs rounded-full ${
                          task.status === "completed" ? "bg-green-100 text-green-800" :
                          task.status === "in-progress" ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {task.status === "completed" ? "Completed" :
                           task.status === "in-progress" ? "In Progress" : "Not Started"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{task.description}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span>Due: {new Date(task.dueDate?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 sm:py-12 text-center">
                  <CheckCircleIcon className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">You currently have no assigned tasks.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "videos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoData.length > 0 ? (
              videoData.map((video) => (
                <div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-2xl">
                  {/* Thumbnail or Icon */}
                  {!playingVideo || playingVideo.id !== video.id ? (
                    <div className="relative bg-gradient-to-br from-indigo-100 to-purple-100 h-40 flex items-center justify-center">
                      <VideoCameraIcon className="h-16 w-16 text-indigo-400 opacity-70" />
                      <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded-full px-3 py-1 text-xs text-indigo-700 font-semibold shadow">
                        {video.views || 0} views
                      </div>
                    </div>
                  ) : null}

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-indigo-900 truncate">{video.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{video.description}</p>
                    {/* Watch Button or Video Player */}
                    {!playingVideo || playingVideo.id !== video.id ? (
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-400">{video.platform || "Video"}</span>
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold shadow hover:scale-105 transition"
                          onClick={() => setPlayingVideo(video)}
                        >
                          <VideoCameraIcon className="h-5 w-5 inline-block mr-2" />
                          Watch
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg overflow-hidden bg-black">
                        {video.url ? (
                          video.url.includes("youtube.com") || video.url.includes("youtu.be") ? (
                            <iframe
                              width="100%"
                              height="315"
                              src={
                                video.url.includes("watch?v=")
                                  ? video.url.replace("watch?v=", "embed/")
                                  : video.url.replace("youtu.be/", "youtube.com/embed/")
                              }
                              title={video.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-64"
                            />
                          ) : (
                            <video controls width="100%" className="w-full h-64 bg-black rounded-lg" src={video.url} />
                          )
                        ) : (
                          <div className="text-red-500 text-sm py-8 text-center">No video URL found.</div>
                        )}
                        <button
                          className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                          onClick={() => setPlayingVideo(null)}
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-8 text-center">
                <VideoCameraIcon className="mx-auto h-16 w-16 text-indigo-200" />
                <h3 className="mt-4 text-lg font-bold text-gray-900">No training videos</h3>
                <p className="mt-2 text-sm text-gray-500">There are currently no training videos available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="bg-white rounded-xl shadow-sm flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]">
            <div className="p-3 sm:p-4 border-b flex items-center space-x-2 overflow-x-auto">
              <button
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg flex items-center whitespace-nowrap ${roomId === GENERAL_ROOM ? "bg-indigo-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                onClick={() => setRoomId(GENERAL_ROOM)}
              >
                <UserGroupIcon className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                # General
              </button>
              <select
                value={roomId.startsWith("dm_") ? roomId : ""}
                onChange={(e) => setRoomId(e.target.value)}
                className="border rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 focus:ring-indigo-500 focus:border-indigo-500 text-black whitespace-nowrap"
              >
                <option value="" className="text-black">Direct Message…</option>
                {otherUsers.map((u) => (
                  <option
                    key={u.uid}
                    value={dmId(auth.currentUser.uid, u.uid)}
                    className="text-black truncate"
                  >
                    {u.isAdmin ? "Admin" : u.name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3 bg-gray-50">
              {msgs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ChatBubbleLeftRightIcon className="h-10 sm:h-12 w-10 sm:w-12 text-gray-300 mb-2" />
                  <h3 className="text-sm sm:text-base font-medium text-gray-500">No messages yet</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {roomId === GENERAL_ROOM
                      ? "Send a message to start the conversation!"
                      : "Say hello to your teammate!"}
                  </p>
                </div>
              ) : (
                msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderUid === auth.currentUser.uid ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg max-w-[90%] sm:max-w-[80%] ${m.senderUid === auth.currentUser.uid
                        ? "bg-indigo-600"
                        : "bg-white border border-gray-200"
                        }`}
                    >
                      {m.senderUid !== auth.currentUser.uid && (
                        <p className="text-xs font-medium text-indigo-600 mb-1">
                          {m.senderName}
                        </p>
                      )}
                      <p className={`text-xs sm:text-sm ${m.senderUid === auth.currentUser.uid ? "text-white" : "text-black"
                        }`}>
                        {m.text}
                      </p>
                      <p
                        className={`text-[10px] mt-1 text-right ${m.senderUid === auth.currentUser.uid ? "text-indigo-200" : "text-gray-500"
                          }`}
                      >
                        {m.createdAt?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); sendMsg(); }}
              className="p-3 sm:p-4 border-t flex items-center space-x-2 bg-white"
            >
              <input
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                className="flex-grow border rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                placeholder={
                  roomId === GENERAL_ROOM
                    ? "Message #general"
                    : `Message ${otherUsers.find(u => roomId.includes(u.uid))?.name || ''}`
                }
              />
              <button
                type="submit"
                disabled={!msgInput.trim() || sending}
                className={`p-1.5 sm:p-2 rounded-full ${msgInput.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {sending ? (
                  <ArrowPathIcon className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === "assigned-tasks" && (
          <TasksTab 
            task={{ title: '', description: '', assignedTo: '', dueDate: new Date() }}
            tasks={allTasks}
            employees={allEmployees}
            setTask={() => {}} // You can implement this if needed
            setTasks={setAllTasks}
          />
        )}
      </main>
    </div>
  );
}

const StatCard = ({ title, value, icon, trend, change, color }) => {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center">
          {trend === "up" ? (
            <ArrowUpCircleIcon className="h-4 sm:h-5 w-4 sm:w-5 text-green-500" />
          ) : (
            <ArrowUpCircleIcon className="h-4 sm:h-5 w-4 sm:w-5 text-red-500 transform rotate-180" />
          )}
          <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"
            }`}>
            {change} {trend === "up" ? "increase" : "decrease"} from last month
          </span>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="p-4 sm:p-6 h-64">{children}</div>
  </div>
);
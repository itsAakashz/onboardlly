"use client";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function EmployeePage() {
  const [employeeData, setEmployeeData] = useState(null);
  const [tasksData, setTasksData] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [loading, setLoading] = useState(true);

  const employeeId = "zI4JX62CVhilEofgITfr"; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employee data
        const docRef = doc(db, "employees", employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployeeData(docSnap.data());
        } else {
          console.error("No such employee!");
        }

        // Fetch tasks assigned to this employee
        const tasksQuery = query(
          collection(db, "tasks"),
          where("assignedTo", "==", employeeId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksList = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasksData(tasksList);

        // Fetch videos from Firestore
        const videosSnapshot = await getDocs(collection(db, "videos"));
        const videosList = videosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVideoData(videosList);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      // Optimistic UI update
      const updatedTasks = tasksData.map(task => 
        task.id === taskId 
          ? { ...task, status: currentStatus === 'completed' ? 'in-progress' : 'completed' }
          : task
      );
      setTasksData(updatedTasks);

      // Update in Firestore
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status: currentStatus === 'completed' ? 'in-progress' : 'completed',
        completedAt: currentStatus === 'completed' ? null : new Date().toISOString()
      });

      // Recalculate progress
      const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
      const newProgress = Math.round((completedCount / updatedTasks.length) * 100);
      
      // Update employee progress if changed
      if (employeeData.progress !== newProgress) {
        const employeeRef = doc(db, "employees", employeeId);
        await updateDoc(employeeRef, {
          progress: newProgress
        });
        setEmployeeData(prev => ({ ...prev, progress: newProgress }));
      }

    } catch (error) {
      console.error("Error updating task:", error);
      // Revert on error
      const originalTasks = tasksData.map(task => 
        task.id === taskId 
          ? { ...task, status: currentStatus }
          : task
      );
      setTasksData(originalTasks);
    }
  };

  // Prepare data for charts
  const taskStatusData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          tasksData.filter(task => task.status === 'completed').length,
          tasksData.filter(task => task.status === 'in-progress').length,
          tasksData.filter(task => !task.status || task.status === 'not-started').length
        ],
        backgroundColor: [
          'rgba(74, 222, 128, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(248, 113, 113, 0.8)'
        ],
        borderColor: [
          'rgba(74, 222, 128, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(248, 113, 113, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const videoViewsData = {
    labels: videoData.map(video => video.title),
    datasets: [
      {
        label: 'Views',
        data: videoData.map(video => video.views || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <LoadingSkeleton />;
  if (!employeeData) return <p className="p-6 text-red-500">Employee not found.</p>;

  const { name, progress = 0, department, position } = employeeData;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <header className="mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome back, {name}!</h1>
              <p className="text-gray-600 mt-1">{position} • {department}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 mr-2">Onboarding Progress</span>
                <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tasks Overview</h2>
          <div className="grid grid-cols-3 gap-4 flex-grow">
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{tasksData.length}</p>
              <p className="text-xs text-indigo-500">Total Tasks</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {tasksData.filter(task => task.status === 'completed').length}
              </p>
              <p className="text-xs text-green-500">Completed</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {tasksData.filter(task => task.status === 'in-progress').length}
              </p>
              <p className="text-xs text-amber-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Task Status</h2>
          <div className="h-48">
            <Pie 
              data={taskStatusData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Video Views</h2>
          <div className="h-48">
            <Bar 
              data={videoViewsData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }} 
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">Your Tasks</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {tasksData.length > 0 ? (
              tasksData.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleTaskCompletion(task.id, task.status)}
                        className={`mt-1 flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-600'
                            : 'bg-white border-gray-300'
                        }`}
                        aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.status === 'completed' && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div>
                        <div className={`font-medium flex items-center ${
                          task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'
                        }`}>
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Due: {new Date(task.dueDate.seconds * 1000).toLocaleDateString()}
                          {task.status === 'completed' && task.completedAt && (
                            <span className="ml-2 text-green-600">
                              • Completed on {new Date(task.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {task.videoLink && (
                      <a
                        href={task.videoLink}
                        target="_blank"
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Tutorial →
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No tasks assigned yet
              </div>
            )}
          </div>
        </div>

        {/* Video Tutorials Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">Video Tutorials</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {videoData.length > 0 ? (
              videoData.map((video) => (
                <div key={video.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium  text-gray-800 placeholder-gray-400 bg-gray-50">{video.title}</h3>
                  <p className="text-sm text-black-900 mt-1">{video.description}</p>
                  <div className="mt-3">
                    {video.url.includes("youtube") ? (
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Watch on YouTube
                      </a>
                    ) : (
                      <video 
                        controls 
                        className="w-full rounded-lg mt-2 shadow-sm border border-gray-200"
                        poster={video.thumbnail}
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                  {video.views && (
                    <div className="text-xs text-gray-500 mt-2">
                      {video.views} views • {video.duration || '5 min'}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No video tutorials available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Resources</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-6">
            <h3 className="font-medium text-gray-800 mb-3">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  Employee Handbook
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  {department} Procedures
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  Software Guides
                </a>
              </li>
            </ul>
          </div>
          <div className="p-6">
            <h3 className="font-medium text-gray-800 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Meeting Calendar
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <ChatIcon className="w-4 h-4 mr-2" />
                  Support Chat
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <TrophyIcon className="w-4 h-4 mr-2" />
                  Training Portal
                </a>
              </li>
            </ul>
          </div>
          <div className="p-6">
            <h3 className="font-medium text-gray-800 mb-3">Your Team</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                  Team Directory
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <ChatBubbleIcon className="w-4 h-4 mr-2" />
                  Team Channel
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  Contact Manager
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

// Loading Skeleton Component (same as before)
function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="animate-pulse space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded mt-4"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 w-1/2 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-gray-100 rounded-lg p-3 h-20"></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// Icon components (same as before)
function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function TrophyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function UserGroupIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ChatBubbleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function EnvelopeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../../../lib/firebase";
import { collection, collectionGroup, query, where, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function EmployeePage() {
  const [employeeData, setEmployeeData] = useState(null);
  const [tasksData, setTasksData] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ───────────────────────────────────────────────────────────── fetch data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be logged in to access this page.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(collectionGroup(db, "employees"), where("uid", "==", user.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
          setError("Employee profile not found.");
          setLoading(false);
          return;
        }

        const empDoc = snap.docs[0];
        const emp = { id: empDoc.id, ...empDoc.data() };
        setEmployeeData(emp);

        // tasks
        const taskSnap = await getDocs(query(collection(db, "tasks"), where("assignedTo", "==", empDoc.id)));
        setTasksData(taskSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // videos
        const vidSnap = await getDocs(collection(db, "videos"));
        setVideoData(vidSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setError("Something went wrong while fetching employee data.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ───────────────────────────────────────────────────────────── logout
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  // ───────────────────────────────────────────────────────────── charts
  const taskStatusData = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [
      {
        label: "Tasks",
        data: [
          tasksData.filter((t) => t.status === "completed").length,
          tasksData.filter((t) => t.status === "in-progress").length,
          tasksData.filter((t) => !t.status || t.status === "not-started").length,
        ],
        backgroundColor: ["rgba(74,222,128,0.8)", "rgba(250,204,21,0.8)", "rgba(248,113,113,0.8)"],
        borderWidth: 1,
      },
    ],
  };

  const videoViewsData = {
    labels: videoData.map((v) => v.title),
    datasets: [
      {
        label: "Views",
        data: videoData.map((v) => v.views || 0),
        backgroundColor: "rgba(99,102,241,0.6)",
        borderWidth: 1,
      },
    ],
  };

  // ───────────────────────────────────────────────────────────── ui
  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!employeeData) return null;

  const { name, progress = 0, department, role } = employeeData;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* header */}
      <header className="mb-8 flex items-center justify-between bg-white rounded-xl shadow-sm p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome&nbsp;back, {name}!</h1>
          <p className="text-gray-600 mt-1">{role} • {department}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Log&nbsp;out</button>
      </header>

      {/* progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Onboarding Progress</span>
          <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* stats + charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tasks Overview</h2>
          <div className="grid grid-cols-3 gap-4 flex-grow">
            <Stat label="Total" value={tasksData.length} color="indigo" />
            <Stat label="Completed" value={tasksData.filter((t) => t.status === "completed").length} color="green" />
            <Stat label="In Progress" value={tasksData.filter((t) => t.status === "in-progress").length} color="amber" />
          </div>
        </div>

        <ChartCard title="Task Status">
          <Pie data={taskStatusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
        </ChartCard>

        <ChartCard title="Video Views">
          <Bar data={videoViewsData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </ChartCard>
      </section>

      {/* tasks & videos lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListCard title="Your Tasks">
          {tasksData.length ? (
            tasksData.map((task) => (
              <div key={task.id} className="p-4 border-b last:border-0">
                <p className={`font-medium ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-800"}`}>{task.title}</p>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-500">No tasks assigned.</p>
          )}
        </ListCard>

        <ListCard title="Video Tutorials">
          {videoData.length ? (
            videoData.map((v) => (
              <div key={v.id} className="p-4 border-b last:border-0">
                <p className="font-medium text-gray-800">{v.title}</p>
                {v.url?.includes("youtube") && (
                  <a className="text-indigo-600 text-sm" href={v.url} target="_blank">Watch on YouTube →</a>
                )}
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-500">No videos available.</p>
          )}
        </ListCard>
      </section>
    </main>
  );
}

// ───────────────────────────────────────────────────────────── helpers
const Stat = ({ label, value, color }) => (
  <div className={`bg-${color}-50 rounded-lg p-3 text-center`}>
    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
    <p className={`text-xs text-${color}-500`}>{label}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>
    <div className="h-48">{children}</div>
  </div>
);

const ListCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="p-6 border-b">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
    </div>
    {children}
  </div>
);

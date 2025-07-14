// Employee Dashboard with integrated Chat
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
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be logged in to access this page.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allSnap = await getDocs(collectionGroup(db, "employees"));
        const allEmps = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEmployees(allEmps);

        const meDoc = allEmps.find((e) => e.uid === user.uid);
        if (!meDoc) {
          setError("Employee profile not found.");
          setLoading(false);
          return;
        }
        setEmployeeData(meDoc);

        const taskSnap = await getDocs(query(collection(db, "tasks"), where("assignedTo", "==", meDoc.id)));
        setTasksData(taskSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const vidSnap = await getDocs(collection(db, "videos"));
        setVideoData(vidSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
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

  const taskStatusData = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [
      {
        data: [
          tasksData.filter((t) => t.status === "completed").length,
          tasksData.filter((t) => t.status === "in-progress").length,
          tasksData.filter((t) => !t.status || t.status === "not-started").length,
        ],
        backgroundColor: ["rgba(74,222,128,0.8)", "rgba(250,204,21,0.8)", "rgba(248,113,113,0.8)"],
      },
    ],
  };

  const videoViewsData = {
    labels: videoData.map((v) => v.title),
    datasets: [{ data: videoData.map((v) => v.views || 0), backgroundColor: "rgba(99,102,241,0.6)" }],
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!employeeData) return null;

  const { name, progress = 0, department, role } = employeeData;
  const otherUsers = employees.filter((e) => e.uid !== auth.currentUser.uid);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex flex-col space-y-8">
      <header className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {name}!</h1>
          <p className="text-gray-600 mt-1">{role} • {department}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Log out</button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col">
          <h2 className="font-semibold mb-4">Tasks Overview</h2>
          <div className="grid grid-cols-3 gap-4 mt-auto">
            <Stat label="Total" value={tasksData.length} color="indigo" />
            <Stat label="Completed" value={tasksData.filter((t) => t.status === "completed").length} color="green" />
            <Stat label="In Progress" value={tasksData.filter((t) => t.status === "in-progress").length} color="amber" />
          </div>
        </div>
        <ChartCard title="Task Status"><Pie data={taskStatusData} options={{ plugins: { legend: { position: "bottom" } } }} /></ChartCard>
        <ChartCard title="Video Views"><Bar data={videoViewsData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} /></ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListCard title="Your Tasks">
          {tasksData.length ? tasksData.map((t) => (
            <div key={t.id} className="p-4 border-b last:border-0">
              <p className={`font-medium ${t.status === "completed" ? "line-through text-gray-500" : "text-gray-800"}`}>{t.title}</p>
              <p className="text-sm text-gray-600">{t.description}</p>
            </div>
          )) : <p className="p-4 text-gray-500">No tasks.</p>}
        </ListCard>

        <div className="bg-white rounded-xl shadow-sm flex flex-col h-[28rem]">
          <div className="p-4 border-b flex items-center space-x-2">
            <button className={`px-3 py-1.5 text-sm rounded-lg ${roomId === GENERAL_ROOM ? "bg-indigo-600 text-white" : "bg-gray-200"}`} onClick={() => setRoomId(GENERAL_ROOM)}># General</button>
            <select value={roomId.startsWith("dm_") ? roomId : ""} onChange={(e) => setRoomId(e.target.value)} className="border rounded-lg text-sm px-2 py-1">
              <option value="">Direct Message…</option>
              {otherUsers.map((u, index) => (
                <option key={u.uid || index} value={dmId(auth.currentUser.uid, u.uid)}>{u.name || u.email}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {msgs.length === 0 ? <p className="text-center text-gray-500">No messages.</p> : msgs.map((m) => (
              <div key={m.id} className={`flex ${m.senderUid === auth.currentUser.uid ? "justify-end" : "justify-start"}`}>
                <div className={`${m.senderUid === auth.currentUser.uid ? "bg-indigo-600 text-white" : "bg-gray-100"} px-4 py-2 rounded-lg max-w-xs md:max-w-md text-sm`}>
                  <p>{m.text}</p>
                  <p className="text-[10px] opacity-60 mt-1 text-right">{m.senderUid === auth.currentUser.uid ? "You" : m.senderName} • {m.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMsg(); }} className="p-4 border-t flex items-center space-x-2">
            <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="flex-grow border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Type a message…" />
            <button type="submit" disabled={!msgInput.trim()} className={`p-2 rounded-full ${msgInput.trim() ? "bg-indigo-600 text-white" : "bg-gray-300"}`}> <PaperAirplaneIcon className="h-5 w-5" /> </button>
          </form>
        </div>
      </section>
    </main>
  );
}

const Stat = ({ label, value, color }) => (
  <div className={`bg-${color}-50 rounded-lg p-3 text-center`}>
    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
    <p className={`text-xs text-${color}-500`}>{label}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="font-semibold mb-4 text-gray-700">{title}</h2><div className="h-48">{children}</div></div>
);

const ListCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden"><div className="p-6 border-b"><h2 className="font-semibold text-gray-700">{title}</h2></div>{children}</div>
);

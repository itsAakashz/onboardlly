"use client";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

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

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!employeeData) return <p className="p-6 text-red-500">Employee not found.</p>;

  const { name, progress = 0 } = employeeData;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {name}!</h1>
        <p className="text-gray-600 mt-2">Here's your onboarding dashboard.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
          <ul className="space-y-3">
            {tasksData.map((task) => (
              <li key={task.id} className="border rounded p-3">
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-gray-600">{task.description}</div>
                <div className="text-sm text-gray-500">
                  Due: {new Date(task.dueDate.seconds * 1000).toLocaleString()}
                </div>
                {task.videoLink && (
                  <a
                    href={task.videoLink}
                    target="_blank"
                    className="text-blue-600 text-sm mt-1 inline-block"
                  >
                    Watch Tutorial
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Video Tutorials Section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Video Tutorials</h2>
          <ul className="space-y-4">
            {videoData.map((video) => (
              <li key={video.id}>
                <h3 className="font-medium">{video.title}</h3>
                {video.url.includes("youtube") ? (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline block mt-1"
                  >
                    Watch on YouTube
                  </a>
                ) : (
                  <video controls className="w-full rounded-lg mt-2">
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Progress</h2>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <span className="text-sm font-semibold text-indigo-600">Task Completion</span>
              <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex text-center justify-center bg-indigo-500"
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* More Links */}
      <section className="mt-10 bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Useful Links</h2>
        <ul className="list-disc pl-5 space-y-2 text-blue-600">
          <li><a href="https://company-wiki.com">Company Wiki</a></li>
          <li><a href="https://support.chat">Live Support Chat</a></li>
          <li><a href="https://schedule.calendar">Your Meeting Calendar</a></li>
        </ul>
      </section>
    </main>
  );
}

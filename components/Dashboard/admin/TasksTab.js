import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { db } from '../../../lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

const TasksTab = ({
  task,
  tasks,
  employees,
  handleAddTask,   // (kept for compatibility; you can remove if unused)
  setTask,
  setTasks,
}) => {
  const [loading, setLoading] = useState(false);

  /* ────────────────────────────────────────────────────────────
     ❶ Sync tasks from Firestore in real time
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const taskList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setTasks(taskList);
    });
    return () => unsubscribe();
  }, [setTasks]);

  /* ────────────────────────────────────────────────────────────
     ❷ Submit (add) a new task
  ───────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.title || !task.description || !task.assignedTo || !task.dueDate)
      return;

    setLoading(true);
    try {
      const newTask = {
        ...task,
        // Ensure Firestore receives a JS Date object
        dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
        status: 'pending',
        createdAt: new Date(),
      };

      // Find chosen employee’s email
      const assignedEmployee = employees.find((emp) => emp.id === task.assignedTo);
      const recipientEmail = assignedEmployee?.email;
      if (!recipientEmail) {
        console.error('❌ No email found for assigned employee.');
        return;
      }

      // 1. Add task to Firestore
      await addDoc(collection(db, 'tasks'), newTask);

      // 2. Notify by email (fire‑and‑forget)
      fetch('/api/sendTaskEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail,
          title: task.title,
          description: task.description,
          dueDate: newTask.dueDate.toLocaleDateString(),
          taskLink: 'https://onboardlly.vercel.app/',
        }),
      });

      // 3. Reset local form state
      setTask({ title: '', description: '', assignedTo: '', dueDate: new Date() });
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────────────
     ❸ Delete a task
  ───────────────────────────────────────────────────────────── */
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      // setTasks will auto‑update from the real‑time listener
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  /* ────────────────────────────────────────────────────────────
     ❹ Helper: format due‑date (handles Firestore Timestamp too)
  ───────────────────────────────────────────────────────────── */
  const formatDate = (dateLike) => {
    if (!dateLike) return '—';
    const dateObj =
      dateLike instanceof Date
        ? dateLike
        : dateLike instanceof Timestamp
        ? dateLike.toDate()
        : new Date(dateLike);
    return dateObj.toLocaleDateString();
  };

  /* ──────────────────────────────────────────────────────────── */

  return (
    <div className="mt-6">
      {/* ── Add Task Form ───────────────────────────────────── */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assign New Task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Task Title"
            value={task.title || ''}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
            required
          />
          <textarea
            placeholder="Task Description"
            value={task.description || ''}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
            rows={3}
            required
          />
          <select
            value={task.assignedTo || ''}
            onChange={(e) => setTask({ ...task, assignedTo: e.target.value })}
            className="w-full border px-3 py-2 rounded text-gray-800 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <DatePicker
            selected={task.dueDate || new Date()}
            onChange={(date) => setTask({ ...task, dueDate: date })}
            className="w-full border px-3 py-2 rounded text-gray-800 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Assign Task'}
          </button>
        </form>
      </div>

      {/* ── Tasks List ───────────────────────────────────────── */}
      <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {tasks.map((t) => {
              const assignedEmp = employees.find((emp) => emp.id === t.assignedTo);
              return (
                <li key={t.id} className="py-4 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{t.title}</p>
                    <p className="text-sm text-gray-600 mb-1">{t.description}</p>
                    <p className="text-sm text-gray-500">
                      Assigned To:{' '}
                      <span className="font-medium">
                        {assignedEmp ? assignedEmp.name : 'Unknown'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Due:&nbsp;<span className="font-medium">{formatDate(t.dueDate)}</span>
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm"
                    title="Delete task"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500">No tasks assigned.</p>
        )}
      </div>
    </div>
  );
};

export default TasksTab;

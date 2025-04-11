import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

const TasksTab = ({
  task,
  tasks,
  employees,
  handleAddTask,
  setTask,
  setTasks
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });
    return () => unsubscribe();
  }, [setTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.title || !task.description || !task.assignedTo || !task.dueDate) return;

    setLoading(true);
    try {
      const newTask = {
        ...task,
        dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
      };
      await addDoc(collection(db, 'tasks'), newTask);
      setTask({ title: '', description: '', assignedTo: '', dueDate: new Date() });
    } catch (err) {
      console.error("Error adding task:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Add Task Form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assign New Task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Task Title"
            value={task.title || ''}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            className="w-full border px-3 py-2 rounded  text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 "
            required
          />
          <textarea
            placeholder="Task Description"
            value={task.description || ''}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            className="w-full border px-3 py-2 rounded  text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            required
          />
          <select
            value={task.assignedTo || ''}
            onChange={(e) => setTask({ ...task, assignedTo: e.target.value })}
            className="w-full border px-3 py-2 rounded  text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <DatePicker
            selected={task.dueDate || new Date()}
            onChange={(date) => setTask({ ...task, dueDate: date })}
            className="w-full border px-3 py-2 rounded  text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Tasks List */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {tasks.map((t) => {
              const assignedEmp = employees.find(emp => emp.id === t.assignedTo);
              return (
                <li key={t.id} className="py-4">
                  <p className="font-semibold text-gray-800">{t.title}</p>
                  <p className="text-sm text-gray-600">{t.description}</p>
                  <p className="text-sm text-gray-500">Assigned To: {assignedEmp ? assignedEmp.name : 'Unknown'}</p>
                  <p className="text-sm text-gray-400">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
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

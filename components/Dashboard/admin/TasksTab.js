import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { db, storage } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const TasksTab = ({ task, tasks, employees, setTask, setTasks }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingTask, setCurrentUploadingTask] = useState(null);

  // Sync tasks from Firestore in real time
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

  // Submit (add) a new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.title || !task.description || !task.assignedTo || !task.dueDate) return;

    setLoading(true);
    try {
      const newTask = {
        ...task,
        dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
        status: 'pending',
        createdAt: new Date(),
      };

      const assignedEmployee = employees.find((emp) => emp.id === task.assignedTo);
      const recipientEmail = assignedEmployee?.email;
      if (!recipientEmail) {
        console.error('❌ No email found for assigned employee.');
        return;
      }

      await addDoc(collection(db, 'tasks'), newTask);

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

      setTask({ title: '', description: '', assignedTo: '', dueDate: new Date() });
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleFileUpload = async (taskId) => {
    if (!file) return;
    
    setCurrentUploadingTask(taskId);
    setLoading(true);
    try {
      const storageRef = ref(storage, `task-documents/${taskId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          setLoading(false);
          setCurrentUploadingTask(null);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await updateDoc(doc(db, 'tasks', taskId), {
              documentURL: downloadURL,
              documentName: file.name
            });
          } catch (err) {
            console.error('Error updating document:', err);
          } finally {
            setFile(null);
            setUploadProgress(0);
            setLoading(false);
            setCurrentUploadingTask(null);
          }
        }
      );
    } catch (err) {
      console.error('Error uploading file:', err);
      setLoading(false);
      setCurrentUploadingTask(null);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Format due-date
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

  // Filter tasks based on active tab and search query
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && t.status === 'pending';
    if (activeTab === 'completed') return matchesSearch && t.status === 'completed';
    if (activeTab === 'overdue') {
      const dueDate = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
      return matchesSearch && dueDate < new Date() && t.status !== 'completed';
    }
    return matchesSearch;
  });

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => {
      const dueDate = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
      return dueDate < new Date() && t.status !== 'completed';
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Task Statistics Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-medium">Total Tasks</div>
          <div className="text-2xl font-bold">{taskStats.total}</div>
          <div className="text-xs opacity-80 mt-1">All assigned tasks</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-medium">Pending</div>
          <div className="text-2xl font-bold">{taskStats.pending}</div>
          <div className="text-xs opacity-80 mt-1">Awaiting completion</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-medium">Completed</div>
          <div className="text-2xl font-bold">{taskStats.completed}</div>
          <div className="text-xs opacity-80 mt-1">Finished tasks</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-medium">Overdue</div>
          <div className="text-2xl font-bold">{taskStats.overdue}</div>
          <div className="text-xs opacity-80 mt-1">Past due date</div>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Assign New Task</h3>
            <svg className="h-6 w-6 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Complete project report"
                    value={task.title || ''}
                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <select
                    value={task.assignedTo || ''}
                    onChange={(e) => setTask({ ...task, assignedTo: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900 appearance-none"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  placeholder="Detailed description of the task..."
                  value={task.description || ''}
                  onChange={(e) => setTask({ ...task, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <DatePicker
                    selected={task.dueDate || new Date()}
                    onChange={(date) => setTask({ ...task, dueDate: date })}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900"
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Assign Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h3 className="text-xl font-bold text-white mb-2 md:mb-0">Task Management</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-full ${activeTab === 'all' ? 'bg-white text-indigo-600' : 'text-indigo-200 hover:text-white'}`}
            >
              All ({taskStats.total})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-full ${activeTab === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'text-indigo-200 hover:text-white'}`}
            >
              Pending ({taskStats.pending})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-full ${activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'text-indigo-200 hover:text-white'}`}
            >
              Completed ({taskStats.completed})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 text-sm font-medium rounded-full ${activeTab === 'overdue' ? 'bg-red-100 text-red-800' : 'text-indigo-200 hover:text-white'}`}
            >
              Overdue ({taskStats.overdue})
            </button>
          </div>
        </div>
        <div className="p-6">
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((t) => {
                const assignedEmp = employees.find((emp) => emp.id === t.assignedTo);
                const dueDate = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
                const isOverdue = dueDate < new Date() && t.status !== 'completed';
                
                return (
                  <div key={t.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">{t.title}</h4>
                          {isOverdue && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Overdue
                            </span>
                          )}
                          {t.status === 'completed' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{t.description}</p>
                        
                        {/* PDF Document Section */}
                        <div className="mt-3">
                          {t.documentURL ? (
                            <div className="flex items-center space-x-2">
                              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <a 
                                href={t.documentURL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                {t.documentName || 'View Document'}
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-gray-500">No document attached</span>
                            </div>
                          )}
                        </div>
                        
                        {/* PDF Upload Section */}
                        {currentUploadingTask === t.id ? (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-indigo-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <label className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Upload PDF
                              <input 
                                type="file" 
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                            {file && (
                              <button
                                onClick={() => handleFileUpload(t.id)}
                                className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Submit
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {assignedEmp ? assignedEmp.name : 'Unassigned'}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Due: {formatDate(t.dueDate)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Created: {formatDate(t.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition"
                          title="Delete task"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' 
                  ? 'Get started by assigning a new task.' 
                  : `No ${activeTab} tasks match your search.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
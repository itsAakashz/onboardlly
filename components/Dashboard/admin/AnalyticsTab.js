"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  FiUsers, FiCheckCircle, FiFilm, FiAward, 
  FiTrendingUp, FiMessageSquare, FiRefreshCw 
} from 'react-icons/fi';
import { motion } from 'framer-motion';

Chart.register(...registerables);

const AnalyticsComponent = () => {
  const [rawData, setRawData] = useState({
    employees: [],
    tasks: [],
    videos: [],
    suggestions: [],
    loading: true,
    error: null
  });

  const [refreshCount, setRefreshCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch real-time data from Firestore
  useEffect(() => {
    const unsubscribes = [];

    const subscribeToCollection = (collectionName, setData) => {
      const q = query(collection(db, collectionName));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to Date objects
          ...(doc.data().dueDate && { dueDate: doc.data().dueDate.toDate() }),
          ...(doc.data().completedAt && { completedAt: doc.data().completedAt.toDate() }),
          ...(doc.data().createdAt && { createdAt: doc.data().createdAt.toDate() }),
          ...(doc.data().updatedAt && { updatedAt: doc.data().updatedAt.toDate() }),
          ...(doc.data().hireDate && { hireDate: doc.data().hireDate.toDate() }),
          ...(doc.data().lastActive && { lastActive: doc.data().lastActive.toDate() }),
        }));
        setData(prev => ({ ...prev, [collectionName]: data }));
        setLastUpdated(new Date());
      });
      unsubscribes.push(unsubscribe);
    };

    try {
      setRawData(prev => ({ ...prev, loading: true, error: null }));

      // Subscribe to all collections
      subscribeToCollection('employees', setRawData);
      subscribeToCollection('tasks', setRawData);
      subscribeToCollection('videos', setRawData);
      subscribeToCollection('suggestions', setRawData);

      setRawData(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error("Error setting up subscriptions:", error);
      setRawData(prev => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load data"
      }));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [refreshCount]);

  // Calculate derived data using useMemo for performance
  const processedData = useMemo(() => {
    if (rawData.loading) return null;

    const { month, year } = getCurrentMonthYear();
    
    // Calculate completion rate
    const completionRate = rawData.tasks.length
      ? Math.round((rawData.tasks.filter(t => t.completed).length / rawData.tasks.length) * 100)
      : 0;

    // Calculate engagement data
    const engagementData = rawData.employees.map(emp => {
      const empTasks = rawData.tasks.filter(task => task.assignedTo === emp.id);
      const completedTasks = empTasks.filter(task => task.completed);
      const watchedVideos = rawData.videos.filter(video => 
        video.views?.some(view => view.userId === emp.id)
      );
      
      return {
        employeeId: emp.id,
        taskCompletionRate: empTasks.length ? 
          Math.round((completedTasks.length / empTasks.length) * 100) : 0,
        videosWatched: watchedVideos.length,
        lastActive: emp.lastActive || null
      };
    });

    // Calculate department metrics
    const departmentMetrics = {};
    rawData.employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!departmentMetrics[dept]) {
        departmentMetrics[dept] = {
          employeeCount: 0,
          totalCompletion: 0,
          totalVideosWatched: 0,
          activeEmployees: 0
        };
      }
      
      const engagement = engagementData.find(e => e.employeeId === emp.id) || {};
      departmentMetrics[dept].employeeCount++;
      departmentMetrics[dept].totalCompletion += engagement.taskCompletionRate || 0;
      departmentMetrics[dept].totalVideosWatched += engagement.videosWatched || 0;
      
      if ((engagement.taskCompletionRate > 0 || engagement.videosWatched > 0) && 
          engagement.lastActive && 
          (new Date() - engagement.lastActive) < 30 * 24 * 60 * 60 * 1000) {
        departmentMetrics[dept].activeEmployees++;
      }
    });

    // Calculate averages
    Object.keys(departmentMetrics).forEach(dept => {
      departmentMetrics[dept].avgCompletion = departmentMetrics[dept].employeeCount ?
        Math.round(departmentMetrics[dept].totalCompletion / departmentMetrics[dept].employeeCount) :
        0;
      departmentMetrics[dept].avgVideosWatched = departmentMetrics[dept].employeeCount ?
        Math.round(departmentMetrics[dept].totalVideosWatched / departmentMetrics[dept].employeeCount) :
        0;
      departmentMetrics[dept].engagementRate = departmentMetrics[dept].employeeCount ?
        Math.round((departmentMetrics[dept].activeEmployees / departmentMetrics[dept].employeeCount) * 100) :
        0;
    });

    // Process video data
    const processedVideos = rawData.videos.map(video => ({
      id: video.id,
      title: video.title,
      views: video.views?.length || 0,
      likes: video.likes?.length || 0,
      completionRate: video.views ? 
        completionRate: video.views ? 
  Math.round((video.views.filter(v => v.completed).length / video.views.length) * 100) : 0,
      lastUpdated: video.updatedAt || null
    })).sort((a, b) => b.views - a.views);

    // Process suggestions
    const suggestionCounts = {};
    rawData.suggestions.forEach(suggestion => {
      const text = suggestion.text;
      suggestionCounts[text] = (suggestionCounts[text] || 0) + 1;
    });
    
    const processedSuggestions = Object.entries(suggestionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([text, count]) => ({ text, count }));

    // Get new hires this month
    const newHiresThisMonth = rawData.employees.filter(emp => {
      const hireDate = emp.hireDate;
      return hireDate && hireDate.getMonth() === month && hireDate.getFullYear() === year;
    }).length;

    // Calculate overall engagement
    const overallEngagement = engagementData.length
      ? Math.round(engagementData.filter(e => 
          e.taskCompletionRate > 0 || e.videosWatched > 0
        ).length / engagementData.length * 100)
      : 0;

    return {
      completionRate,
      engagementData,
      departmentMetrics,
      processedVideos,
      processedSuggestions,
      newHiresThisMonth,
      overallEngagement
    };
  }, [rawData]);

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  // Helper function to get current month/year
  function getCurrentMonthYear() {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear(),
      monthName: now.toLocaleString('default', { month: 'long' })
    };
  }

  // Chart data configurations
  const departmentDistributionData = {
    labels: processedData ? Object.keys(processedData.departmentMetrics) : [],
    datasets: [{
      label: 'Employees by Department',
      data: processedData ? Object.values(processedData.departmentMetrics).map(d => d.employeeCount) : [],
      backgroundColor: [
        'rgba(99, 102, 241, 0.7)',
        'rgba(79, 70, 229, 0.7)',
        'rgba(67, 56, 202, 0.7)',
        'rgba(55, 48, 163, 0.7)',
        'rgba(49, 46, 129, 0.7)'
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(79, 70, 229, 1)',
        'rgba(67, 56, 202, 1)',
        'rgba(55, 48, 163, 1)',
        'rgba(49, 46, 129, 1)'
      ],
      borderWidth: 1
    }]
  };

  const departmentProgressData = {
    labels: processedData ? Object.keys(processedData.departmentMetrics) : [],
    datasets: [{
      label: 'Avg. Completion %',
      data: processedData ? Object.values(processedData.departmentMetrics).map(d => d.avgCompletion) : [],
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1
    }]
  };

  const departmentEngagementData = {
    labels: processedData ? Object.keys(processedData.departmentMetrics) : [],
    datasets: [{
      label: 'Engagement Rate %',
      data: processedData ? Object.values(processedData.departmentMetrics).map(d => d.engagementRate) : [],
      backgroundColor: 'rgba(245, 158, 11, 0.7)',
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 1
    }]
  };

  const topVideosData = {
    labels: processedData?.processedVideos?.slice(0, 5).map(v => 
      v.title.length > 20 ? `${v.title.substring(0, 20)}...` : v.title
    ) || [],
    datasets: [{
      label: 'Video Views',
      data: processedData?.processedVideos?.slice(0, 5).map(v => v.views) || [],
      backgroundColor: 'rgba(244, 63, 94, 0.7)',
      borderColor: 'rgba(244, 63, 94, 1)',
      borderWidth: 1
    }]
  };

  const engagementOverviewData = {
    labels: ['Engaged', 'Not Engaged'],
    datasets: [{
      data: processedData ? [processedData.overallEngagement, 100 - processedData.overallEngagement] : [0, 100],
      backgroundColor: [
        'rgba(245, 158, 11, 0.7)',
        'rgba(209, 213, 219, 0.7)'
      ],
      borderColor: [
        'rgba(245, 158, 11, 1)',
        'rgba(209, 213, 219, 1)'
      ],
      borderWidth: 1
    }]
  };

  if (rawData.loading && !lastUpdated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (rawData.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong>Error: </strong> {rawData.error}
          <button 
            onClick={handleRefresh}
            className="mt-2 flex items-center justify-center w-full bg-red-200 hover:bg-red-300 text-red-800 py-2 rounded"
          >
            <FiRefreshCw className="mr-2" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl md:text-3xl font-bold text-gray-800"
        >
          Onboarding Analytics Dashboard
        </motion.h1>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiRefreshCw className={`mr-2 ${rawData.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active Employees</p>
              <p className="text-3xl font-bold mt-2">{rawData.employees.length}</p>
            </div>
            <div className="p-3 rounded-full bg-indigo-400/20">
              <FiUsers size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {processedData?.engagementData.filter(e => e.taskCompletionRate > 0).length} actively completing tasks
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Task Completion</p>
              <p className="text-3xl font-bold mt-2">{processedData?.completionRate || 0}%</p>
            </div>
            <div className="p-3 rounded-full bg-green-400/20">
              <FiCheckCircle size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {rawData.tasks.filter(t => t.completed).length} of {rawData.tasks.length} tasks
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Engagement Rate</p>
              <p className="text-3xl font-bold mt-2">{processedData?.overallEngagement || 0}%</p>
            </div>
            <div className="p-3 rounded-full bg-amber-400/20">
              <FiTrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {processedData?.engagementData.filter(e => e.taskCompletionRate > 0 || e.videosWatched > 0).length} engaged employees
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Hires ({getCurrentMonthYear().monthName})</p>
              <p className="text-3xl font-bold mt-2">{processedData?.newHiresThisMonth || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-rose-400/20">
              <FiAward size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {rawData.employees.filter(e => {
              const hireDate = e.hireDate;
              return hireDate && hireDate.getMonth() === getCurrentMonthYear().month && hireDate.getFullYear() === getCurrentMonthYear().year;
            }).length} currently onboarding
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-1 space-y-6"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Department Distribution</h3>
            </div>
            <div className="h-64">
              {processedData && Object.keys(processedData.departmentMetrics).length > 0 ? (
                <Doughnut 
                  data={departmentDistributionData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No department data available
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Department Engagement</h3>
            </div>
            <div className="h-64">
              {processedData && Object.keys(processedData.departmentMetrics).length > 0 ? (
                <Bar 
                  data={departmentEngagementData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No engagement data available
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Progress and Videos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-2 space-y-6"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Progress by Department</h3>
            </div>
            <div className="h-64">
              {processedData && Object.keys(processedData.departmentMetrics).length > 0 ? (
                <Bar 
                  data={departmentProgressData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No progress data available
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Top Training Videos</h3>
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                <FiFilm size={18} />
              </div>
            </div>
            <div className="h-64">
              {processedData?.processedVideos?.length > 0 ? (
                <Bar 
                  data={topVideosData} 
                  options={{ 
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No video data available
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedData?.processedVideos?.slice(0, 2).map((video, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center">
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">
                    <FiFilm size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{video.title}</p>
                    <p className="text-sm text-gray-500">
                      {video.views} views • {video.completionRate}% completed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Engagement & Suggestions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-1 space-y-6"
        >
          {/* Engagement Widget */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Engagement Overview</h3>
            </div>
            <div className="h-40">
              <Doughnut 
                data={engagementOverviewData} 
                options={{ 
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} 
              />
            </div>
            <div className="text-center mt-2">
              <p className="text-2xl font-bold text-amber-600">{processedData?.overallEngagement || 0}%</p>
              <p className="text-sm text-gray-500">
                {processedData?.engagementData.filter(e => e.taskCompletionRate > 0 || e.videosWatched > 0).length} of {rawData.employees.length} employees engaged
              </p>
            </div>
          </div>

          {/* Suggestions Widget */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Top Suggestions</h3>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <FiMessageSquare size={18} />
              </div>
            </div>
            <ul className="space-y-3">
              {processedData?.processedSuggestions?.slice(0, 3).map((suggestion, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 5 }}
                  className="bg-gray-50 p-3 rounded-lg flex items-start"
                >
                  <div className="bg-green-100 text-green-600 p-1 rounded-full mr-3 mt-0.5">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-700 text-sm">{suggestion.text}</span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Suggested by {suggestion.count} {suggestion.count === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                </motion.li>
              ))}
              {(!processedData?.processedSuggestions || processedData.processedSuggestions.length === 0) && (
                <li className="bg-gray-50 p-3 rounded-lg text-gray-500 text-sm">
                  No suggestions submitted yet
                </li>
              )}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsComponent;
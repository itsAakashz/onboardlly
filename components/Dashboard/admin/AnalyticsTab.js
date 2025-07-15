"use client";

import React, { useEffect, useState } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { 
  FiUsers, FiCheckCircle, FiFilm, FiAward, 
  FiTrendingUp, FiMessageSquare, FiRefreshCw 
} from 'react-icons/fi';
import { motion } from 'framer-motion';

Chart.register(...registerables);

// Utility functions for data processing
const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    monthName: now.toLocaleString('default', { month: 'long' })
  };
};

const calculateEngagement = (employees, tasks, videos) => {
  return employees.map(emp => {
    const empTasks = tasks.filter(task => task.assignedTo === emp.id);
    const completedTasks = empTasks.filter(task => task.completed);
    const watchedVideos = videos.filter(video => 
      video.views?.some(view => view.userId === emp.id)
    );
    
    return {
      employeeId: emp.id,
      taskCompletionRate: empTasks.length ? 
        Math.round((completedTasks.length / empTasks.length) * 100) : 0,
      videosWatched: watchedVideos.length,
      lastActive: emp.lastActive?.toDate() || null
    };
  });
};

const processDepartmentMetrics = (employees, engagementData) => {
  const departmentMetrics = {};
  
  employees.forEach(emp => {
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
    
    // Consider active if completed at least one task or watched one video recently
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
  
  return departmentMetrics;
};

const processVideoData = (videos) => {
  return videos.map(video => ({
    id: video.id,
    title: video.title,
    views: video.views?.length || 0,
    likes: video.likes?.length || 0,
    completionRate: video.views ? 
      Math.round((video.views.filter(v => v.completed).length / video.views.length) * 100) :
      0,
    lastUpdated: video.updatedAt?.toDate() || null
  })).sort((a, b) => b.views - a.views);
};

const processSuggestions = (suggestions) => {
  const suggestionCounts = {};
  suggestions.forEach(suggestion => {
    const text = suggestion.text;
    suggestionCounts[text] = (suggestionCounts[text] || 0) + 1;
  });
  
  return Object.entries(suggestionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([text, count]) => ({ text, count }));
};

const AnalyticsComponent = () => {
  const [analytics, setAnalytics] = useState({
    employees: [],
    tasks: [],
    videos: [],
    suggestions: [],
    departmentMetrics: {},
    engagementData: [],
    loading: true,
    lastUpdated: null,
    error: null
  });
  
  const { month, year, monthName } = getCurrentMonthYear();
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let employeesUnsubscribe, tasksUnsubscribe, videosUnsubscribe, suggestionsUnsubscribe;
    const unsubscribes = [];

    const fetchData = async () => {
      try {
        setAnalytics(prev => ({ ...prev, loading: true, error: null }));
        
        // Employees subscription
        const employeesQuery = query(collection(db, 'employees'));
        employeesUnsubscribe = onSnapshot(employeesQuery, (snapshot) => {
          const employees = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            hireDate: doc.data().hireDate?.toDate()
          }));
          setAnalytics(prev => ({ ...prev, employees }));
        });
        unsubscribes.push(employeesUnsubscribe);

        // Tasks subscription
        const tasksQuery = query(collection(db, 'tasks'));
        tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
          const tasks = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            dueDate: doc.data().dueDate?.toDate(),
            completedAt: doc.data().completedAt?.toDate()
          }));
          setAnalytics(prev => ({ ...prev, tasks }));
        });
        unsubscribes.push(tasksUnsubscribe);

        // Videos subscription
        const videosQuery = query(collection(db, 'videos'));
        videosUnsubscribe = onSnapshot(videosQuery, (snapshot) => {
          const videos = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }));
          setAnalytics(prev => ({ ...prev, videos }));
        });
        unsubscribes.push(videosUnsubscribe);

        // Suggestions subscription
        const suggestionsQuery = query(collection(db, 'suggestions'));
        suggestionsUnsubscribe = onSnapshot(suggestionsQuery, (snapshot) => {
          const suggestions = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }));
          setAnalytics(prev => ({ ...prev, suggestions }));
        });
        unsubscribes.push(suggestionsUnsubscribe);

        // New hires this month (we'll get this once since it's date-based)
        const newHiresQuery = query(
          collection(db, 'employees'),
          where('hireDate', '>=', new Date(year, month, 1)),
          where('hireDate', '<', new Date(year, month + 1, 1))
        );
        const newHiresSnap = await getDocs(newHiresQuery);
        const newHiresThisMonth = newHiresSnap.size;

        setAnalytics(prev => ({
          ...prev,
          newHiresThisMonth,
          loading: false,
          lastUpdated: new Date()
        }));

      } catch (error) {
        console.error("Error fetching data:", error);
        setAnalytics(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to load analytics data"
        }));
      }
    };

    fetchData();

    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
    };
  }, [refreshCount, month, year]);

  // Process all data whenever any of the source data changes
  useEffect(() => {
    if (!analytics.loading && analytics.employees.length > 0) {
      const engagementData = calculateEngagement(
        analytics.employees,
        analytics.tasks,
        analytics.videos
      );
      
      const departmentMetrics = processDepartmentMetrics(
        analytics.employees,
        engagementData
      );
      
      const processedVideos = processVideoData(analytics.videos);
      const processedSuggestions = processSuggestions(analytics.suggestions);
      
      setAnalytics(prev => ({
        ...prev,
        engagementData,
        departmentMetrics,
        processedVideos,
        processedSuggestions
      }));
    }
  }, [analytics.employees, analytics.tasks, analytics.videos, analytics.suggestions]);

  // Calculate derived metrics
  const completionRate = analytics.tasks.length
  ? Math.round((analytics.tasks.filter(t => t.completed).length / analytics.tasks.length) * 100)
  : 0;

const overallEngagement = analytics.engagementData.length
  ? Math.round(analytics.engagementData.filter(e => 
      e.taskCompletionRate > 0 || e.videosWatched > 0
    ).length / analytics.engagementData.length * 100)
  : 0;

  // Chart data configurations
  const departmentDistributionData = {
    labels: Object.keys(analytics.departmentMetrics),
    datasets: [{
      label: 'Employees by Department',
      data: Object.values(analytics.departmentMetrics).map(d => d.employeeCount),
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
    labels: Object.keys(analytics.departmentMetrics),
    datasets: [{
      label: 'Avg. Completion %',
      data: Object.values(analytics.departmentMetrics).map(d => d.avgCompletion),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1
    }]
  };

  const departmentEngagementData = {
    labels: Object.keys(analytics.departmentMetrics),
    datasets: [{
      label: 'Engagement Rate %',
      data: Object.values(analytics.departmentMetrics).map(d => d.engagementRate),
      backgroundColor: 'rgba(245, 158, 11, 0.7)',
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 1
    }]
  };

  const topVideosData = {
    labels: analytics.processedVideos?.slice(0, 5).map(v => 
      v.title.length > 20 ? `${v.title.substring(0, 20)}...` : v.title
    ) || [],
    datasets: [{
      label: 'Video Views',
      data: analytics.processedVideos?.slice(0, 5).map(v => v.views) || [],
      backgroundColor: 'rgba(244, 63, 94, 0.7)',
      borderColor: 'rgba(244, 63, 94, 1)',
      borderWidth: 1
    }]
  };

  const engagementOverviewData = {
    labels: ['Engaged', 'Not Engaged'],
    datasets: [{
      data: [overallEngagement, 100 - overallEngagement],
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

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  if (analytics.loading && !analytics.lastUpdated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong>Error: </strong> {analytics.error}
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
          {analytics.lastUpdated && (
            <p className="text-sm text-gray-500">
              Updated: {analytics.lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiRefreshCw className={`mr-2 ${analytics.loading ? 'animate-spin' : ''}`} />
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
              <p className="text-3xl font-bold mt-2">{analytics.employees.length}</p>
            </div>
            <div className="p-3 rounded-full bg-indigo-400/20">
              <FiUsers size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {analytics.engagementData.filter(e => e.taskCompletionRate > 0).length} actively completing tasks
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Task Completion</p>
              <p className="text-3xl font-bold mt-2">{completionRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-green-400/20">
              <FiCheckCircle size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {analytics.tasks.filter(t => t.completed).length} of {analytics.tasks.length} tasks
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Engagement Rate</p>
              <p className="text-3xl font-bold mt-2">{overallEngagement}%</p>
            </div>
            <div className="p-3 rounded-full bg-amber-400/20">
              <FiTrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {analytics.engagementData.filter(e => e.taskCompletionRate > 0 || e.videosWatched > 0).length} engaged employees
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Hires ({monthName})</p>
              <p className="text-3xl font-bold mt-2">{analytics.newHiresThisMonth}</p>
            </div>
            <div className="p-3 rounded-full bg-rose-400/20">
              <FiAward size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {analytics.employees.filter(e => {
              const hireDate = e.hireDate;
              return hireDate && hireDate.getMonth() === month && hireDate.getFullYear() === year;
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
              {Object.keys(analytics.departmentMetrics).length > 0 ? (
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
              {Object.keys(analytics.departmentMetrics).length > 0 ? (
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
              {Object.keys(analytics.departmentMetrics).length > 0 ? (
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
              {analytics.processedVideos?.length > 0 ? (
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
              {analytics.processedVideos?.slice(0, 2).map((video, index) => (
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
              <p className="text-2xl font-bold text-amber-600">{overallEngagement}%</p>
              <p className="text-sm text-gray-500">
                {analytics.engagementData.filter(e => e.taskCompletionRate > 0 || e.videosWatched > 0).length} of {analytics.employees.length} employees engaged
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
              {analytics.processedSuggestions?.slice(0, 3).map((suggestion, index) => (
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
              {(!analytics.processedSuggestions || analytics.processedSuggestions.length === 0) && (
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
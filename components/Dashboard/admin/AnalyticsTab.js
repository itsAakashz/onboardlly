"use client";

import React, { useEffect, useState } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FiUsers, FiCheckCircle, FiFilm, FiAward, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';

Chart.register(...registerables);

const AnalyticsComponent = () => {
  const [analytics, setAnalytics] = useState({
    activeEmployees: 0,
    completionRate: 0,
    departmentDistribution: {},
    progressByDepartment: {},
    popularVideos: [],
    commonSuggestions: [],
    engagementRate: 0,
    newHiresThisMonth: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const employeesSnap = await getDocs(collection(db, 'employees'));
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      const videosSnap = await getDocs(collection(db, 'videos'));

      const employees = employeesSnap.docs.map(doc => doc.data());
      const tasks = tasksSnap.docs.map(doc => doc.data());
      const videos = videosSnap.docs.map(doc => doc.data());

      // Department Distribution
      const departmentCount = {};
      employees.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        departmentCount[dept] = (departmentCount[dept] || 0) + 1;
      });

      // Progress by Department
      const progressMap = {};
      employees.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        const assignedTasks = tasks.filter(task => task.assignedTo === emp.id);
        const completedTasks = assignedTasks.filter(task => task.completed);
        const percent = assignedTasks.length
          ? Math.round((completedTasks.length / assignedTasks.length) * 100)
          : 0;
        progressMap[dept] = progressMap[dept]
          ? Math.round((progressMap[dept] + percent) / 2)
          : percent;
      });

      // Completion Rate
      const totalTasks = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const completionRate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

      // Popular Videos (Dummy view count for example)
      const popularVideos = videos.map(v => ({ 
        ...v, 
        views: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 50) + 5
      }));

      // Common Suggestions (could come from a suggestions collection, mocked here)
      const suggestions = [
        "Add a FAQ page",
        "Improve task feedback system",
        "Include HR contact details",
        "More interactive training videos",
        "Mobile-friendly onboarding portal"
      ];

      // Additional metrics
      const engagementRate = Math.floor(Math.random() * 40) + 60; // 60-100%
      const newHiresThisMonth = Math.floor(Math.random() * 15) + 5; // 5-20

      setAnalytics({
        activeEmployees: employees.length,
        completionRate,
        departmentDistribution: departmentCount,
        progressByDepartment: progressMap,
        popularVideos: popularVideos.sort((a, b) => b.views - a.views).slice(0, 5),
        commonSuggestions: suggestions,
        engagementRate,
        newHiresThisMonth
      });
    };

    fetchData();
  }, []);

  const departmentData = {
    labels: Object.keys(analytics.departmentDistribution),
    datasets: [
      {
        label: 'Employees by Department',
        data: Object.values(analytics.departmentDistribution),
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
      }
    ]
  };

  const progressData = {
    labels: Object.keys(analytics.progressByDepartment),
    datasets: [
      {
        label: 'Onboarding Progress %',
        data: Object.values(analytics.progressByDepartment),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };

  const videoData = {
    labels: analytics.popularVideos.map(v => v.title.length > 20 ? v.title.substring(0, 20) + '...' : v.title),
    datasets: [
      {
        label: 'Video Views',
        data: analytics.popularVideos.map(v => v.views),
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
        borderColor: 'rgba(244, 63, 94, 1)',
        borderWidth: 1
      }
    ]
  };

  const engagementData = {
    labels: ['Engaged', 'Not Engaged'],
    datasets: [
      {
        data: [analytics.engagementRate, 100 - analytics.engagementRate],
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',
          'rgba(209, 213, 219, 0.7)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(209, 213, 219, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

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
              <p className="text-3xl font-bold mt-2">{analytics.activeEmployees}</p>
            </div>
            <div className="p-3 rounded-full bg-indigo-400/20">
              <FiUsers size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">Currently in onboarding</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold mt-2">{analytics.completionRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-green-400/20">
              <FiCheckCircle size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">Of assigned tasks</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Engagement Rate</p>
              <p className="text-3xl font-bold mt-2">{analytics.engagementRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-amber-400/20">
              <FiTrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">Active participation</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Hires</p>
              <p className="text-3xl font-bold mt-2">{analytics.newHiresThisMonth}</p>
            </div>
            <div className="p-3 rounded-full bg-rose-400/20">
              <FiAward size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80 mt-2">This month</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Department Distribution</h3>
          </div>
          <div className="h-64">
            <Doughnut 
              data={departmentData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }} 
            />
          </div>
        </motion.div>

        {/* Progress by Department */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Progress by Department</h3>
          </div>
          <div className="h-64">
            <Bar 
              data={progressData} 
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
          </div>
        </motion.div>

        {/* Popular Videos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top Training Videos</h3>
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
              <FiFilm size={18} />
            </div>
          </div>
          <div className="h-64">
            <Bar 
              data={videoData} 
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
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.popularVideos.slice(0, 2).map((video, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">
                  <FiFilm size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{video.title}</p>
                  <p className="text-sm text-gray-500">{video.views} views • {video.likes} likes</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Engagement & Suggestions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 lg:col-span-1 space-y-6"
        >
          {/* Engagement Widget */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Engagement Rate</h3>
            </div>
            <div className="h-40">
              <Doughnut 
                data={engagementData} 
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
              <p className="text-2xl font-bold text-amber-600">{analytics.engagementRate}%</p>
              <p className="text-sm text-gray-500">Employees actively engaged</p>
            </div>
          </div>

          {/* Suggestions Widget */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Common Suggestions</h3>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <FiMessageSquare size={18} />
              </div>
            </div>
            <ul className="space-y-3">
              {analytics.commonSuggestions.slice(0, 3).map((suggestion, index) => (
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
                  <span className="text-gray-700 text-sm">{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsComponent;
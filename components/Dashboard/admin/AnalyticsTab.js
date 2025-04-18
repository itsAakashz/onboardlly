"use client";

import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

Chart.register(...registerables);

const AnalyticsComponent = () => {
  const [analytics, setAnalytics] = useState({
    activeEmployees: 0,
    completionRate: 0,
    departmentDistribution: {},
    progressByDepartment: {},
    popularVideos: [],
    commonSuggestions: []
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
      const popularVideos = videos.map(v => ({ ...v, views: Math.floor(Math.random() * 100) + 10 }));

      // Common Suggestions (could come from a suggestions collection, mocked here)
      const suggestions = [
        "Add a FAQ page",
        "Improve task feedback system",
        "Include HR contact details"
      ];

      setAnalytics({
        activeEmployees: employees.length,
        completionRate,
        departmentDistribution: departmentCount,
        progressByDepartment: progressMap,
        popularVideos,
        commonSuggestions: suggestions
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
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)'
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
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const videoData = {
    labels: analytics.popularVideos.map(v => v.title),
    datasets: [
      {
        label: 'Video Views',
        data: analytics.popularVideos.map(v => v.views),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="mt-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Onboarding Analytics</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-indigo-800">Active Employees</h4>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{analytics.activeEmployees}</p>
              <p className="text-sm text-indigo-500 mt-1">Currently going through onboarding</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-green-800">Average Completion Rate</h4>
              <p className="text-3xl font-bold text-green-600 mt-2">{analytics.completionRate}%</p>
              <p className="text-sm text-green-500 mt-1">Of assigned onboarding tasks</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Employees by Department</h4>
              <div className="h-64">
                <Pie data={departmentData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Progress by Department</h4>
              <div className="h-64">
                <Bar data={progressData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Most Watched Video Tutorials</h4>
              <div className="h-64">
                <Bar data={videoData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Common Suggestions</h4>
              <ul className="space-y-2">
                {analytics.commonSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsComponent;
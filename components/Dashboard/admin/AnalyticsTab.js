import React from 'react';
import DepartmentDistributionChart from './charts/DepartmentDistributionChart';
import ProgressByDepartmentChart from './charts/ProgressByDepartmentChart';
import PopularVideosChart from './charts/PopularVideosChart';
import CommonSuggestionsList from './CommonSuggestionsList';

const AnalyticsTab = ({ analytics }) => {
  return (
    <div className="mt-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Onboarding Analytics</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analytics components */}
            <DepartmentDistributionChart data={analytics.departmentDistribution} />
            <ProgressByDepartmentChart data={analytics.progressByDepartment} />
            <PopularVideosChart data={analytics.popularVideos} />
            <CommonSuggestionsList suggestions={analytics.commonSuggestions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
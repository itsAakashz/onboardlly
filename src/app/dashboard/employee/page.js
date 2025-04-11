export default function EmployeePage() {
    const employeeName = "Aakash"; // this can be dynamic in the future
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        {/* Welcome Message */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {employeeName}!</h1>
          <p className="text-gray-600 mt-2">Here's your onboarding dashboard.</p>
        </header>
  
        {/* Dashboard Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tasks Section */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <span>Fill Personal Details</span>
                <input type="checkbox" />
              </li>
              <li className="flex justify-between items-center">
                <span>Read Company Handbook</span>
                <input type="checkbox" />
              </li>
              <li className="flex justify-between items-center">
                <span>Set Up Work Email</span>
                <input type="checkbox" />
              </li>
            </ul>
          </div>
  
          {/* Video Tutorials Section */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Video Tutorials</h2>
            <ul className="space-y-4">
              <li>
                <h3 className="font-medium">Introduction to Company Culture</h3>
                <video controls className="w-full rounded-lg">
                  <source src="/videos/culture.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </li>
              <li>
                <h3 className="font-medium">How to Use Internal Tools</h3>
                <video controls className="w-full rounded-lg">
                  <source src="/videos/tools.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </li>
            </ul>
          </div>
  
          {/* Progress Tracker Section */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Progress</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-sm font-semibold inline-block text-indigo-600">Task Completion</span>
                <span className="text-sm font-semibold inline-block text-indigo-600">60%</span>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                <div style={{ width: '60%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
              </div>
            </div>
          </div>
        </section>
  
        {/* More Features Section */}
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
  
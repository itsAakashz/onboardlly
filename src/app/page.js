export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Onboardly</h1>
        <p className="text-lg md:text-xl max-w-xl mb-6">
          Automate and personalize your startup’s employee onboarding process with task lists, tutorials, and progress tracking.
        </p>
        <a href="#features" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition">Explore Features</a>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 md:px-10 lg:px-32 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-2">Personalized Task Lists</h3>
            <p>Role-based task assignments tailored to each new hire's position.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
            <p>Help employees get started quickly with helpful walkthroughs and recorded guides.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p>Real-time tracking of onboarding progress with checklists and completion status.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-10 lg:px-32">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <ol className="space-y-6 text-lg max-w-3xl mx-auto">
          <li><strong>Step 1:</strong> Admin adds a new employee with their role and start date.</li>
          <li><strong>Step 2:</strong> Onboardly assigns personalized tasks and videos automatically.</li>
          <li><strong>Step 3:</strong> The employee tracks their progress through a clean dashboard.</li>
        </ol>
      </section>

      {/* Call to Action */}
      <section className="text-center py-16 px-4 bg-blue-600 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to streamline your onboarding?</h2>
        <p className="mb-6">Get started with Onboardly in just a few clicks.</p>
        <a href="/admin" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition">Get Started</a>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-6 text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Onboardly. Built by Aakash.
      </footer>
    </main>
  );
}

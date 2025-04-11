"use client"
import { useState } from "react";

import Head from "next/head";
import AdminLogin from "../../components/Login/AdminLogin";
import EmployeeLogin from "../../components/Login/EmployeeLogin";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);

  const features = [
    {
      title: "Personalized Task Lists",
      description: "Automatically generated checklists tailored to each role (engineering, sales, HR, etc.) with progress tracking.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      title: "Interactive Learning",
      description: "Video tutorials, documentation, and AI-powered Q&A to help new hires get up to speed quickly.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Progress Analytics",
      description: "Real-time dashboards for employees and managers to track onboarding completion and identify bottlenecks.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const steps = [
    {
      title: "Admin adds employee",
      description: "HR or manager enters new hire details including role, department, and start date.",
      icon: "1"
    },
    {
      title: "System generates plan",
      description: "Onboardly automatically creates a personalized onboarding journey with tasks and resources.",
      icon: "2"
    },
    {
      title: "Employee completes tasks",
      description: "New hire works through their checklist with guidance from the platform and their manager.",
      icon: "3"
    },
    {
      title: "Manager tracks progress",
      description: "Real-time visibility into onboarding status with alerts for overdue or blocked items.",
      icon: "4"
    }
  ];

  return (
    <>
      <Head>
        <title>Onboardly | Modern Employee Onboarding Platform</title>
        <meta name="description" content="Automate and personalize your startup's employee onboarding process with task lists, tutorials, and progress tracking." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-white text-gray-800 antialiased">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L20 8V16L12 20L4 16V8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 12L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-gray-900">Onboardly</span>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-4">
                  <a href="#features" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                  <a href="#how-it-works" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">How It Works</a>
                  <a href="#pricing" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                </div>
              </div>
              <div className="md:ml-4 flex items-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-indigo-600 to-blue-600 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
                <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                      <span className="block">Modern Employee</span>
                      <span className="block text-indigo-200">Onboarding Platform</span>
                    </h1>
                    <p className="mt-3 text-base text-indigo-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Automate and personalize your startup's employee onboarding with AI-powered task lists, interactive tutorials, and real-time progress tracking.
                    </p>
                    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <button
                          onClick={() => setShowModal(true)}
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                        >
                          Get Started
                        </button>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <a
                          href="#features"
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10"
                        >
                          Learn More
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
              alt="Team collaboration"
            />
          </div>
        </section>

        {/* Logo Cloud */}
        {/* <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold uppercase text-gray-500 tracking-wide">
              Trusted by innovative startups worldwide
            </p>
            <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
              <div className="col-span-1 flex justify-center">
                <img className="h-12" src="https://tailwindui.com/img/logos/tuple-logo-gray-400.svg" alt="Tuple" />
              </div>
              <div className="col-span-1 flex justify-center">
                <img className="h-12" src="https://tailwindui.com/img/logos/mirage-logo-gray-400.svg" alt="Mirage" />
              </div>
              <div className="col-span-1 flex justify-center">
                <img className="h-12" src="https://tailwindui.com/img/logos/statickit-logo-gray-400.svg" alt="StaticKit" />
              </div>
              <div className="col-span-1 flex justify-center">
                <img className="h-12" src="https://tailwindui.com/img/logos/transistor-logo-gray-400.svg" alt="Transistor" />
              </div>
              <div className="col-span-1 flex justify-center">
                <img className="h-12" src="https://tailwindui.com/img/logos/workcation-logo-gray-400.svg" alt="Workcation" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase text-[30px]">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                A better way to onboard employees
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Onboardly provides everything you need to create a seamless onboarding experience for new hires.
              </p>
            </div>

            <div className="mt-20">
              <div className="space-y-16">
                {features.map((feature, index) => (
                  <div key={index} className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
                    <div className={`mt-6 lg:mt-0 lg:col-span-7 ${index % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-6'}`}>
                      <h3 className="text-2xl font-extrabold text-gray-900">{feature.title}</h3>
                      <p className="mt-3 text-lg text-gray-500">
                        {feature.description}
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setShowModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Learn more
                        </button>
                      </div>
                    </div>
                    <div className={`flex justify-center lg:col-span-5 ${index % 2 === 0 ? 'lg:col-start-8' : 'lg:col-start-1'}`}>
                      <div className="flex items-center justify-center w-full h-64 rounded-md bg-indigo-50 text-indigo-600 sm:h-72">
                        {feature.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Process</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                How Onboardly Works
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Simple, automated onboarding that scales with your growing team.
              </p>
            </div>

            <div className="mt-20">
              <div className="space-y-20">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col md:flex-row">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        {step.icon}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6">
                      <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-base text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-24 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Testimonials</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by forward-thinking teams
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((testimonial) => (
                <div key={testimonial} className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                        Game changer for our remote team
                      </h3>
                      <p className="mt-5 text-base text-gray-500">
                        "Onboardly cut our onboarding time in half while improving new hire satisfaction. The automated task lists and progress tracking eliminated so much manual work for our HR team."
                      </p>
                      <div className="mt-6 flex items-center">
                        <div className="flex-shrink-0">
                          <img className="h-10 w-10 rounded-full" src="/adarsh.jpg" alt="" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Adarsh shrivastav
                          </p>
                          {/* <p className="text-sm text-gray-500">
                            HR Director, TechStart Inc.
                          </p> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-indigo-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to revolutionize your onboarding?</span>
              <span className="block">Start using Onboardly today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              Join hundreds of startups who have transformed their employee onboarding experience.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
            >
              Get started for free
            </button>
          </div>
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                {selectedRole === null && (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Access Onboardly
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">Select your role to continue to the appropriate dashboard.</p>
                    </div>
                    <div className="mt-5 sm:mt-6 space-y-3">
                      <button
                        onClick={() => setSelectedRole("admin")}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
                      >
                        Admin Dashboard
                      </button>
                      <button
                        onClick={() => setSelectedRole("employee")}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition"
                      >
                        Employee Portal
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {selectedRole === "admin" && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-4 text-center">Admin Login</h3>
                    <AdminLogin onSuccess={() => setShowModal(false)} />
                  </div>
                )}

                {selectedRole === "employee" && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-4 text-center">Employee Login</h3>
                    <EmployeeLogin onSuccess={() => setShowModal(false)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Footer */}
        <footer className="bg-gray-50">
          <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
            <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
              <div className="px-5 py-2">
                <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                  About
                </a>
              </div>
              <div className="px-5 py-2">
                <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Blog
                </a>
              </div>
              <div className="px-5 py-2">
                <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Jobs
                </a>
              </div>
              <div className="px-5 py-2">
                <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Press
                </a>
              </div>
              <div className="px-5 py-2">
                <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Accessibility
                </a>
              </div>
              <div className="px-5 py-2">
                <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                  Partners
                </a>
              </div>
            </nav>
            <div className="mt-8 flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <p className="mt-8 text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} Onboardly, Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
import React from 'react'
import './index.css'

// Navigation component
const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-20 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16l-4-4 4-4m0 0l4 4-4 4m6 4a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary">ClassRadar</h1>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#overview" className="text-sm font-medium text-on-surface hover:underline">Overview</a>
          <a href="#timetable" className="text-sm font-medium text-on-surface hover:underline">Timetable</a>
          <a href="#attendance" className="text-sm font-medium text-on-surface hover:underline">Attendance</a>
          <a href="#settings" className="text-sm font-medium text-on-surface hover:underline">Settings</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-full p-2 hover:bg-primary/10 transition-colors" aria-label="Dark mode toggle">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}

// Page components based on the 11 consolidated templates

const OverviewPage = () => {
  return (
    <section id="overview" className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-on-surface mb-4">Welcome to ClassRadar</h2>
            <p className="text-on-surface-variant text-lg mb-6">
              Your campus, in sync. Manage timetables, attendance, and faculty operations from a single platform.
            </p>
            <div className="space-y-3">
              <button className="rounded-lg bg-primary text-white px-6 py-3 hover:bg-primary/90 transition-colors">
                Get Started
              </button>
              <button className="rounded-lg border border-outline-variant px-6 py-3 hover:bg-primary/5 transition-colors">
                View Demo
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -right-6 rounded-2xl bg-primary/10 p-6 max-w-sm">
              <h3 className="text-xl font-semibold text-primary mb-2">Features</h3>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>Timetable Management</li>
                <li>Attendance Tracking</li>
                <li>Faculty Operations</li>
                <li>Real-time Updates</li>
                <li>Student Portal</li>
                <li>QR Attendance</li>
              </ul>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-primary/10 p-6 max-w-sm">
              <h3 className="text-xl font-semibold text-primary mb-2">Benefits</h3>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>Real-time synchronization</li>
                <li>Dark mode support</li>
                <li>Responsive design</li>
                <li>Material Design icons</li>
                <li>Inter font typography</li>
                <li>Tailwind CSS v3</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const TimetablePage = () => {
  return (
    <section id="timetable" className="pt-20 pb-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-on-surface mb-4">Timetable Management</h2>
          <p className="text-on-surface-variant">
            Create and manage class schedules across campus
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Timetable Substitutions */}
          <div className="rounded-xl bg-surface p-6 hover:bg-surface/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 002 2h4a2 2 0 002-2v-2m0 0V7a2 2 0 012-2h2a2 2 0 012 2v4.168m-5.658.852A32.15 32.15 0 005.185 9h.01m3.158 6H5m6 4h.01m6.076-3.332a7.963 7.963 0 01-1.828.688 7.958 7.958 0 01-.688-1.827 7.956 7.956 0 01.688-1.826 7.96 7.96 0 011.828.688H19" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">Admin & Academic Dean</h3>
                <p className="text-on-surface-variant text-sm">Substitutions & analytics console</p>
              </div>
            </div>
          </div>

          {/* Campus Timetable */}
          <div className="rounded-xl bg-surface p-6 hover:bg-surface/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16l-4-4 4-4m0 0l4 4-4 4m6 4a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">Campus Timetable</h3>
                <p className="text-on-surface-variant text-sm">Campus-wide scheduling</p>
              </div>
            </div>
          </div>

          {/* Lecture Hall Display */}
          <div className="rounded-xl bg-surface p-6 hover:bg-surface/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10L7 7m3 3L13 13m5 7H3" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">Lecture Hall Display</h3>
                <p className="text-on-surface-variant text-sm">Dark mode classroom display</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const AttendancePage = () => {
  return (
    <section id="attendance" className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-on-surface mb-4">Attendance Tracking</h2>
            <p className="text-on-surface-variant text-lg mb-6">
              Track student attendance with QR codes and real-time updates
            </p>
            <div className="space-y-3">
              <button className="rounded-lg bg-primary text-white px-6 py-3 hover:bg-primary/90 transition-colors">
                QR Scanner
              </button>
              <button className="rounded-lg border border-outline-variant px-6 py-3 hover:bg-primary/5 transition-colors">
                Bulk Import
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -right-6 rounded-2xl bg-primary/10 p-6 max-w-sm">
              <h3 className="text-xl font-semibold text-primary mb-2">Attendance Features</h3>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>QR Code verification</li>
                <li>Real-time sync</li>
                <li>Bunk management</li>
                <li>Mobile PWA support</li>
              </ul>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-primary/10 p-6 max-w-sm">
              <h3 className="text-xl font-semibold text-primary mb-2">Reports</h3>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>Daily attendance</li>
                <li>Bunk patterns</li>
                <li>Faculty reports</li>
                <li>Export data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FacultyPage = () => {
  return (
    <section className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-bold text-on-surface mb-4">Faculty Portal</h2>
            <p className="text-on-surface-variant text-lg mb-6">
              Faculty live QR attendance engine with roster control
            </p>
            <div className="space-y-3">
              <button className="rounded-lg bg-primary text-white px-6 py-3 hover:bg-primary/90 transition-colors">
                Manage Roster
              </button>
              <button className="rounded-lg border border-outline-variant px-6 py-3 hover:bg-primary/5 transition-colors">
                QR Attendance
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -right-6 rounded-2xl bg-primary/10 p-6 max-w-sm">
              <h3 className="text-xl font-semibold text-primary mb-2">Faculty Features</h3>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>Live QR attendance</li>
                <li>Roster control</li>
                <li>Engine operations</li>
                <li>Real-time updates</li>
              </ul>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-primary/10 p-6 max-w-sm">
              <h3 className="text-xl font-semibold text-primary mb-2">Control Panel</h3>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>Lecture operations</li>
                <li>Attendance hub</li>
                <li>Role authentication</li>
                <li>Live engine</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const NotificationsPage = () => {
  return (
    <section className="pt-20 pb-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div>
          <h2 className="text-4xl font-bold text-on-surface mb-4">Real-time Campus Updates</h2>
          <p className="text-on-surface-variant mb-6">
            Stay informed with real-time campus notifications
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-surface p-4 hover:bg-surface/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l4-4m0 0l-4-4m4 4l4-4m0 0l4 4m-4-4l-4 4m4 4l4 4m-4-4l-4-4" />
                  </svg>
                </div>
                <span className="text-on-surface-variant">Exam Schedule</span>
              </div>
              <p className="text-sm text-on-surface-variant">Updated 2 hours ago</p>
            </div>
            <div className="rounded-xl bg-surface p-4 hover:bg-surface/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l4-4m0 0l-4-4m4 4l4-4m0 0l4 4m-4-4l-4 4m4 4l4 4m-4-4l-4-4" />
                  </svg>
                </div>
                <span className="text-on-surface-variant">Holiday</span>
              </div>
              <p className="text-sm text-on-surface-variant">Updated 5 hours ago</p>
            </div>
            <div className="rounded-xl bg-surface p-4 hover:bg-surface/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l4-4m0 0l-4-4m4 4l4-4m0 0l4 4m-4-4l-4 4m4 4l4 4m-4-4l-4-4" />
                  </svg>
                </div>
                <span className="text-on-surface-variant">Result</span>
              </div>
              <p className="text-sm text-on-surface-variant">Updated 1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const StudentPage = () => {
  return (
    <section className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Attendance Bunk Management */}
          <div className="rounded-xl bg-surface p-6 hover:bg-surface/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 002 2h4a2 2 0 002-2v-2m0 0V7a2 2 0 012-2h2a2 2 0 012 2v4.168m-5.658.852A32.15 32.15 0 005.185 9h.01m3.158 6H5m6 4h.01m6.076-3.332a7.963 7.963 0 01-1.828.688 7.958 7.958 0 01-.688-1.827 7.956 7.956 0 01.688-1.826 7.96 7.96 0 011.828.688H19" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">Bunk Management</h3>
                <p className="text-on-surface-variant text-sm">Student attendance tracking</p>
              </div>
            </div>
          </div>

          {/* Student Mobile PWA */}
          <div className="rounded-xl bg-surface p-6 hover:bg-surface/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">Mobile PWA</h3>
                <p className="text-on-surface-variant text-sm">Dashboard timetable</p>
              </div>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="rounded-xl bg-surface p-6 hover:bg-surface/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 002 2h4a2 2 0 002-2v-2m0 0V7a2 2 0 012-2h2a2 2 0 012 2v4.168m-5.658.852A32.15 32.15 0 005.185 9h.01m3.158 6H5m6 4h.01m6.076-3.332a7.963 7.963 0 01-1.828.688 7.958 7.958 0 01-.688-1.827 7.956 7.956 0 01.688-1.826 7.96 7.96 0 011.828.688H19" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-on-surface">QR Scanner</h3>
                <p className="text-on-surface-variant text-sm">Attendance verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const CalculatorPage = () => {
  return (
    <section className="pt-20 pb-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div>
          <h2 className="text-4xl font-bold text-on-surface mb-4">Bunk Calculator</h2>
          <p className="text-on-surface-variant mb-6">
            Calculate attendance requirements and bunk limits
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-xl bg-surface p-4">
              <h3 className="text-sm font-medium text-on-surface-variant mb-2">Remaining</h3>
              <p className="text-3xl font-bold text-on-surface">12 of 45</p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <h3 className="text-sm font-medium text-on-surface-variant mb-2">Percentage</h3>
              <p className="text-3xl font-bold text-on-surface">75%</p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <h3 className="text-sm font-medium text-on-surface-variant mb-2">Needed</h3>
              <p className="text-3xl font-bold text-on-surface">8 of 20</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Main App component
const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12">
        <OverviewPage />
        <TimetablePage />
        <AttendancePage />
        <FacultyPage />
        <NotificationsPage />
        <StudentPage />
        <CalculatorPage />
      </main>
    </div>
  )
}

export default App

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import MacroDashboard from './components/MacroDashboard';
import WorkoutTracker from './components/WorkoutTracker';
import BodyWeightTracker from './components/BodyWeightTracker';
import { Dumbbell, Flame, Scale, LogOut } from 'lucide-react';

function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('macros');

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900/70 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-amber-500" />
            <span className="font-bold tracking-wider uppercase text-sm">Iron Bulk</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('macros')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'macros'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Daily Macros
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'workouts'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Workouts
            </button>
            <button
              onClick={() => setActiveTab('weight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'weight'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Weight
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400 hidden md:inline">
            Athlete: <strong className="text-white">{user.username}</strong> • Target:{' '}
            <strong className="text-amber-400">{user.dailyCalorieTarget} kcal</strong> /{' '}
            <strong className="text-amber-400">{user.dailyProteinTarget}g P</strong>
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {activeTab === 'macros' && <MacroDashboard />}
        {activeTab === 'workouts' && <WorkoutTracker />}
        {activeTab === 'weight' && <BodyWeightTracker />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
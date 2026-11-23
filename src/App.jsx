import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import { Dumbbell, LogOut } from 'lucide-react';

function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900/70 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Dumbbell className="w-5 h-5 text-amber-500" />
          <span className="font-bold tracking-wider uppercase text-sm">Iron Bulk</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400">
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
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h2 className="text-lg font-semibold text-white">JWT Session Verified</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Full-stack handshake complete. Ready for Day 8 (Daily Macro Dashboard) and Day 9 (Workout Volume Tracker).
          </p>
        </div>
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
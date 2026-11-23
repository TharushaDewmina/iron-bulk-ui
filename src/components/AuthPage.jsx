import { useState } from 'react';
import { Dumbbell, Flame, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    dailyCalorieTarget: 2900,
    dailyProteinTarget: 120,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await register({
          username: form.username,
          email: form.email,
          password: form.password,
          dailyCalorieTarget: Number(form.dailyCalorieTarget),
          dailyProteinTarget: Number(form.dailyProteinTarget),
        });
      } else {
        await login(form.username, form.password);
      }
    } catch (err) {
      // Reads clean ErrorResponse JSON from Spring Boot GlobalExceptionHandler
      const apiError = err.response?.data;
      if (apiError?.validationErrors) {
        const firstMsg = Object.values(apiError.validationErrors)[0];
        setError(firstMsg);
      } else {
        setError(apiError?.message || 'Unable to connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Dumbbell className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">Iron Bulk</h1>
            <p className="text-xs text-zinc-400">Hypertrophy & Macro Telemetry</p>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`py-2 text-sm font-medium rounded-lg transition ${
              !isRegister ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`py-2 text-sm font-medium rounded-lg transition ${
              isRegister ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="tharusha"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="tharusha@example.com"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {isRegister && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1.5">Daily Kcal</label>
                <input
                  type="number"
                  name="dailyCalorieTarget"
                  min="1200"
                  max="6000"
                  required
                  value={form.dailyCalorieTarget}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1.5">Protein (g)</label>
                <input
                  type="number"
                  name="dailyProteinTarget"
                  min="50"
                  max="400"
                  required
                  value={form.dailyProteinTarget}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : isRegister ? 'Initialize Profile' : 'Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
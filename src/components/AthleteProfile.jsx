import { useState, useEffect } from 'react';
import { User, Flame, Beef, CheckCircle2, Mail, Calendar, Sliders } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const BULK_PRESETS = [
  { label: 'Lean Bulk (2,900 kcal)', calories: 2900, protein: 120 },
  { label: 'Aggressive Bulk (3,200 kcal)', calories: 3200, protein: 130 },
  { label: 'High Surplus (3,500 kcal)', calories: 3500, protein: 140 },
];

export default function AthleteProfile() {
  const { user, updateUserTargets } = useAuth();

  const [profile, setProfile] = useState(null);
  const [calorieTarget, setCalorieTarget] = useState(user?.dailyCalorieTarget || 3000);
  const [proteinTarget, setProteinTarget] = useState(user?.dailyProteinTarget || 120);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosClient.get('/users/me');
        setProfile(data);
        setCalorieTarget(data.dailyCalorieTarget);
        setProteinTarget(data.dailyProteinTarget);
        updateUserTargets(data.dailyCalorieTarget, data.dailyProteinTarget);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load athlete profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await axiosClient.put('/users/me/targets', {
        dailyCalorieTarget: Number(calorieTarget),
        dailyProteinTarget: Number(proteinTarget),
      });

      setProfile(data);
      updateUserTargets(data.dailyCalorieTarget, data.dailyProteinTarget);
      setSuccessMsg('Daily calorie & protein targets updated!');
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.validationErrors) {
        const [field, msg] = Object.entries(apiError.validationErrors)[0];
        setError(`${field}: ${msg}`);
      } else {
        setError(apiError?.message || 'Failed to update targets');
      }
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    setCalorieTarget(preset.calories);
    setProteinTarget(preset.protein);
    setSuccessMsg('');
  };

  // Protein calorie contribution (% of total daily calories)
  const proteinCalories = (Number(proteinTarget) || 0) * 4;
  const proteinCalorieShare =
    Number(calorieTarget) > 0
      ? Math.round((proteinCalories / Number(calorieTarget)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Athlete Profile & Nutrition Targets</h2>
        <p className="text-xs text-zinc-400">
          Adjust your daily caloric surplus and protein floor as your body weight progresses
        </p>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Overview Card */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-500" />
          Athlete Identity
        </h3>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading profile details...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <p className="text-[11px] uppercase text-zinc-500 mb-1">Username</p>
              <p className="text-sm font-semibold text-white">
                {profile?.username || user?.username}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <p className="text-[11px] uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-500" />
                Email
              </p>
              <p className="text-sm font-semibold text-white truncate">
                {profile?.email || '--'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <p className="text-[11px] uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                Member Since
              </p>
              <p className="text-sm font-semibold text-white">
                {profile?.createdAt ? profile.createdAt.split('T')[0] : '--'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Target Editor Form */}
      <form
        onSubmit={handleSaveTargets}
        className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            Daily Bulking Targets
          </h3>

          {/* Quick Phase Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {BULK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Calorie Target Input */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
            <label className="flex items-center justify-between text-xs text-zinc-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Daily Calorie Target (kcal)
              </span>
              <span className="text-[11px] text-zinc-500">1,000 – 10,000</span>
            </label>
            <input
              type="number"
              min="1000"
              max="10000"
              step="50"
              required
              value={calorieTarget}
              onChange={(e) => {
                setCalorieTarget(e.target.value);
                setSuccessMsg('');
              }}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-500">
              Remaining non-protein calories:{' '}
              <strong className="text-zinc-300">
                {Math.max(0, (Number(calorieTarget) || 0) - proteinCalories).toLocaleString()} kcal
              </strong>{' '}
              for carbs &amp; fats
            </p>
          </div>

          {/* Protein Target Input */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
            <label className="flex items-center justify-between text-xs text-zinc-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Beef className="w-3.5 h-3.5 text-emerald-400" />
                Daily Protein Target (g)
              </span>
              <span className="text-[11px] text-zinc-500">30g – 500g</span>
            </label>
            <input
              type="number"
              min="30"
              max="500"
              step="1"
              required
              value={proteinTarget}
              onChange={(e) => {
                setProteinTarget(e.target.value);
                setSuccessMsg('');
              }}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-500">
              Provides <strong className="text-zinc-300">{proteinCalories} kcal</strong> (
              {proteinCalorieShare}% of daily intake; ~2.0–2.2g/kg at 60kg = 120–132g)
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm rounded-xl flex items-center gap-2 transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{saving ? 'Updating Targets...' : 'Save Nutrition Targets'}</span>
        </button>
      </form>
    </div>
  );
}
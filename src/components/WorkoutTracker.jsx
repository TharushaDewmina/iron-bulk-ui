import { useState, useEffect } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

const SPLIT_OPTIONS = [
  { value: 'UPPER', label: 'Upper' },
  { value: 'LOWER', label: 'Lower' },
  { value: 'PUSH', label: 'Push' },
  { value: 'PULL', label: 'Pull' },
  { value: 'LEGS', label: 'Legs' },
  { value: 'FULL_BODY', label: 'Full Body' },
];

export default function WorkoutTracker() {
  const getTodayLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
  };

  const [workoutDate, setWorkoutDate] = useState(getTodayLocal);
  const [splitType, setSplitType] = useState('UPPER');
  const [notes, setNotes] = useState('');

  // Dynamic list of sets for the current session
  const [sets, setSets] = useState([
    { exerciseName: '', setNumber: 1, weightKg: '', reps: '', isDropSet: false },
  ]);

  // All logged workouts from backend (used for history + progressive overload comparison)
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkouts = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all user workouts so we can compare progressive overload across sessions
      const { data } = await axiosClient.get('/workouts');
      setWorkouts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workout logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Add another set row (copies previous exercise name & increments setNumber automatically)
  const handleAddSetRow = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        exerciseName: lastSet?.exerciseName || '',
        setNumber: lastSet ? Number(lastSet.setNumber) + 1 : 1,
        weightKg: lastSet?.weightKg || '',
        reps: '',
        isDropSet: false,
      },
    ]);
  };

  const handleRemoveSetRow = (index) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, idx) => idx !== index));
  };

  const handleSetChange = (index, field, value) => {
    const updated = sets.map((set, idx) =>
      idx === index ? { ...set, [field]: value } : set
    );
    setSets(updated);
  };

  // Live preview of session volume (weightKg * reps)
  const liveSessionVolume = sets.reduce((sum, s) => {
    const w = Number(s.weightKg) || 0;
    const r = Number(s.reps) || 0;
    return sum + w * r;
  }, 0);

  // Find most recent previous session of the same splitType for progressive overload comparison
  const previousSameSplit = workouts.find((w) => w.splitType === splitType);
  const volumeDiff = previousSameSplit
    ? liveSessionVolume - (previousSameSplit.totalVolumeKg || 0)
    : null;

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axiosClient.post('/workouts', {
        splitType,
        workoutDate,
        notes: notes.trim() || null,
        sets: sets.map((s) => ({
          exerciseName: s.exerciseName.trim(),
          setNumber: Number(s.setNumber),
          weightKg: Number(s.weightKg),
          reps: Number(s.reps),
          isDropSet: Boolean(s.isDropSet),
        })),
      });

      // Reset form & refresh history
      setNotes('');
      setSets([
        { exerciseName: '', setNumber: 1, weightKg: '', reps: '', isDropSet: false },
      ]);
      await fetchWorkouts();
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.validationErrors) {
        const [field, msg] = Object.entries(apiError.validationErrors)[0];
        setError(`${field}: ${msg}`);
      } else {
        setError(apiError?.message || 'Failed to save workout session');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (id) => {
    try {
      await axiosClient.delete(`/workouts/${id}`);
      await fetchWorkouts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete workout');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Live Volume Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Workout & Progressive Overload</h2>
          <p className="text-xs text-zinc-400">
            Log working sets, drop sets, and track total tonnage per split
          </p>
        </div>

        {/* Live Session Volume Badge */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-[11px] uppercase text-zinc-400">Draft Session Volume</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {liveSessionVolume.toLocaleString()} kg
              </span>
              {previousSameSplit && liveSessionVolume > 0 && (
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                    volumeDiff >= 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {volumeDiff >= 0 ? `+${volumeDiff.toFixed(1)} kg` : `${volumeDiff.toFixed(1)} kg`} vs last {splitType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Log Workout Form */}
      <form
        onSubmit={handleSaveWorkout}
        className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-amber-500" />
            Log Training Session
          </h3>
          {previousSameSplit && (
            <span className="text-xs text-zinc-400">
              Last {splitType} baseline:{' '}
              <strong className="text-zinc-200">{previousSameSplit.totalVolumeKg} kg</strong>
            </span>
          )}
        </div>

        {/* Session Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Split Type</label>
            <select
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {SPLIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Workout Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Session Notes (Opt)</label>
            <input
              type="text"
              placeholder="e.g. Strong chest pump, gym session"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Dynamic Exercise Sets Builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
              Working Sets ({sets.length})
            </span>
            <button
              type="button"
              onClick={handleAddSetRow}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Set
            </button>
          </div>

          <div className="space-y-2.5">
            {sets.map((set, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80"
              >
                <div className="col-span-12 sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="Exercise (e.g. Incline Press)"
                    value={set.exerciseName}
                    onChange={(e) => handleSetChange(index, 'exerciseName', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    title="Set Number"
                    placeholder="Set #"
                    value={set.setNumber}
                    onChange={(e) => handleSetChange(index, 'setNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="Kg"
                    value={set.weightKg}
                    onChange={(e) => handleSetChange(index, 'weightKg', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={set.isDropSet}
                      onChange={(e) => handleSetChange(index, 'isDropSet', e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    Drop
                  </label>

                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSetRow(index)}
                      title="Remove set"
                      className="p-1 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{submitting ? 'Saving Workout...' : 'Save Workout Session'}</span>
        </button>
      </form>

      {/* Workout History & Volume Comparison */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          Logged Sessions ({workouts.length})
        </h3>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading workout history...</p>
        ) : workouts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No workouts logged yet. Log your first session above to start tracking progressive overload!
          </p>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout, idx) => {
              // Compare against the next older session of the same splitType
              const olderSameSplit = workouts
                .slice(idx + 1)
                .find((w) => w.splitType === workout.splitType);
              const overloadDelta = olderSameSplit
                ? (workout.totalVolumeKg || 0) - (olderSameSplit.totalVolumeKg || 0)
                : null;

              return (
                <div
                  key={workout.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold tracking-wide">
                        {workout.splitType}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {workout.workoutDate}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        • Total Volume: {(workout.totalVolumeKg || 0).toLocaleString()} kg
                      </span>
                      {overloadDelta !== null && (
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            overloadDelta >= 0
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {overloadDelta >= 0
                            ? `+${overloadDelta.toFixed(1)} kg overload`
                            : `${overloadDelta.toFixed(1)} kg`}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      title="Delete session"
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {workout.notes && (
                    <p className="text-xs text-zinc-400 italic">"{workout.notes}"</p>
                  )}

                  {/* Sets Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {workout.sets?.map((s) => (
                      <div
                        key={s.id}
                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-zinc-200">{s.exerciseName}</span>
                          <span className="text-zinc-500 ml-1.5">Set {s.setNumber}</span>
                          {s.isDropSet && (
                            <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[10px]">
                              DROP
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-white">
                          {s.weightKg}kg × {s.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
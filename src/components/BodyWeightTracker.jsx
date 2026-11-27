import { useState, useEffect } from 'react';
import { Scale, TrendingUp, Calendar, Trash2, CheckCircle2, Activity } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function BodyWeightTracker() {
  const getTodayLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
  };

  const [logDate, setLogDate] = useState(getTodayLocal);
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');

  // Chronological ascending list from backend (oldest -> newest) for chart rendering
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchWeights = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get('/weights');
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load body weight logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const handleSaveWeight = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axiosClient.post('/weights', {
        logDate,
        weightKg: Number(weightKg),
        notes: notes.trim() || null,
      });

      setWeightKg('');
      setNotes('');
      await fetchWeights();
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.validationErrors) {
        const [field, msg] = Object.entries(apiError.validationErrors)[0];
        setError(`${field}: ${msg}`);
      } else {
        setError(apiError?.message || 'Failed to save weight entry');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWeight = async (id) => {
    try {
      await axiosClient.delete(`/weights/${id}`);
      await fetchWeights();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete weight entry');
    }
  };

  // Telemetry metrics
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const firstEntry = entries.length > 0 ? entries[0] : null;
  const totalDelta =
    latestEntry && firstEntry ? latestEntry.weightKg - firstEntry.weightKg : null;

  // Rolling 7-entry average weight (smooths out daily water/glycogen fluctuations)
  const lastSeven = entries.slice(-7);
  const sevenDayAvg =
    lastSeven.length > 0
      ? lastSeven.reduce((acc, item) => acc + item.weightKg, 0) / lastSeven.length
      : null;

  // SVG chart dimensions & coordinate mapping
  const svgWidth = 640;
  const svgHeight = 200;
  const padX = 42;
  const padY = 24;

  const buildChartPoints = () => {
    if (entries.length === 0) return [];
    const weights = entries.map((e) => e.weightKg);
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    // Pad Y range by at least 0.5 kg on each side so flat/small gains stay clearly visible
    const minW = rawMin - 0.5;
    const maxW = rawMax === rawMin ? rawMax + 0.5 : rawMax + 0.5;

    return entries.map((entry, idx) => {
      const x =
        entries.length === 1
          ? svgWidth / 2
          : padX + (idx / (entries.length - 1)) * (svgWidth - padX * 2);
      const ratio = (entry.weightKg - minW) / (maxW - minW);
      const y = svgHeight - padY - ratio * (svgHeight - padY * 2);
      return { ...entry, x, y };
    });
  };

  const chartPoints = buildChartPoints();
  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints =
    chartPoints.length > 1
      ? `${chartPoints[0].x},${svgHeight - padY} ${polylinePoints} ${
          chartPoints[chartPoints.length - 1].x
        },${svgHeight - padY}`
      : '';

  // Display newest entries first in the history table/list
  const reversedEntries = [...entries].reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Body Weight Telemetry & Bulking Trend</h2>
        <p className="text-xs text-zinc-400">
          Log fasted morning weight to monitor real surplus gain and smooth water swings
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>LATEST SCALE WEIGHT</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {latestEntry ? `${latestEntry.weightKg} kg` : '--'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {latestEntry ? `Recorded ${latestEntry.logDate}` : 'No entries logged yet'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>7-LOG ROLLING AVG</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {sevenDayAvg !== null ? `${sevenDayAvg.toFixed(1)} kg` : '--'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Smooths daily glycogen & water shifts
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>NET CHANGE (FIRST → LATEST)</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p
            className={`text-2xl font-bold ${
              totalDelta === null
                ? 'text-white'
                : totalDelta >= 0
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {totalDelta === null
              ? '--'
              : `${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(1)} kg`}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Across {entries.length} logged {entries.length === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Log / Upsert Weight Form */}
      <form
        onSubmit={handleSaveWeight}
        className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Log Morning Weight
          </h3>
          <span className="text-[11px] text-zinc-400">
            Logging the same date updates that day&apos;s entry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Date</label>
            <input
              type="date"
              required
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="350"
              required
              placeholder="60.0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Note (Opt)</label>
            <input
              type="text"
              placeholder="Fasted, post-bathroom"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Weight'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Bulking Trend SVG Chart */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Bulking Trend Line
          </h3>
          {entries.length > 0 && (
            <span className="text-xs text-zinc-400">
              {entries[0].logDate} → {entries[entries.length - 1].logDate}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400 py-8 text-center">Loading chart telemetry...</p>
        ) : entries.length < 2 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">
            Log at least 2 days of body weight entries to render your trend curve.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 bg-zinc-950 rounded-xl border border-zinc-800/80"
            >
              <defs>
                <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal subtle baseline lines */}
              <line
                x1={padX}
                y1={padY}
                x2={svgWidth - padX}
                y2={padY}
                stroke="#27272a"
                strokeDasharray="4 4"
              />
              <line
                x1={padX}
                y1={svgHeight - padY}
                x2={svgWidth - padX}
                y2={svgHeight - padY}
                stroke="#27272a"
                strokeDasharray="4 4"
              />

              {/* Shaded area under curve */}
              {areaPoints && <polygon points={areaPoints} fill="url(#weightAreaGrad)" />}

              {/* Trend line */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Data points & kg labels */}
              {chartPoints.map((pt) => (
                <g key={pt.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="#09090b"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 9}
                    textAnchor="middle"
                    fill="#e4e4e7"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {pt.weightKg}
                  </text>
                  <text
                    x={pt.x}
                    y={svgHeight - 7}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="9"
                  >
                    {pt.logDate.slice(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Logged Weight Entries */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Weight History ({reversedEntries.length})
        </h3>

        {reversedEntries.length === 0 ? (
          <p className="text-sm text-zinc-500">No body weight logs recorded yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {reversedEntries.map((item, idx) => {
              // Compare against previous chronological entry (which is right after in reversedEntries)
              const prevChronological = reversedEntries[idx + 1];
              const diffFromPrev = prevChronological
                ? item.weightKg - prevChronological.weightKg
                : null;

              return (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-white">{item.weightKg} kg</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {item.logDate}
                    </span>
                    {diffFromPrev !== null && (
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          diffFromPrev >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {diffFromPrev >= 0
                          ? `+${diffFromPrev.toFixed(1)} kg`
                          : `${diffFromPrev.toFixed(1)} kg`}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-xs text-zinc-500 italic">— {item.notes}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteWeight(item.id)}
                    title="Delete entry"
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
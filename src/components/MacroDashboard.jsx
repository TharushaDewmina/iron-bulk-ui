import { useState, useEffect } from 'react';
import { Flame, Beef, Calendar, PlusCircle, Trash2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function MacroDashboard() {
  const { user } = useAuth();

  // Default to today's local date in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
  });

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state matching MealLogRequest.java
  const [mealForm, setMealForm] = useState({
    foodName: '',
    grams: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatsG: '',
  });

  const fetchDailyMeals = async (date) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get(`/meals?date=${date}`);
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load daily macros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyMeals(selectedDate);
  }, [selectedDate]);

  const handleInputChange = (e) => {
    setMealForm({ ...mealForm, [e.target.name]: e.target.value });
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axiosClient.post('/meals', {
        logDate: selectedDate,
        foodName: mealForm.foodName,
        grams: Number(mealForm.grams),
        calories: Number(mealForm.calories),
        proteinG: Number(mealForm.proteinG),
        carbsG: Number(mealForm.carbsG || 0),
        fatsG: Number(mealForm.fatsG || 0),
      });

      // Reset form and refresh daily totals
      setMealForm({
        foodName: '',
        grams: '',
        calories: '',
        proteinG: '',
        carbsG: '',
        fatsG: '',
      });
      await fetchDailyMeals(selectedDate);
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.validationErrors) {
        const [field, msg] = Object.entries(apiError.validationErrors)[0];
        setError(`${field}: ${msg}`);
      } else {
        setError(apiError?.message || 'Failed to log meal');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      await axiosClient.delete(`/meals/${mealId}`);
      await fetchDailyMeals(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meal');
    }
  };

  // Calculate progress bar percentages (capped at 100%)
  const calorieGoal = user?.dailyCalorieTarget || 3000;
  const proteinGoal = user?.dailyProteinTarget || 120;

  const consumedCalories = summary?.totalCalories || 0;
  const consumedProtein = summary?.totalProteinG ?? summary?.totalProtein ?? 0;

  const caloriePercent = Math.min(100, Math.round((consumedCalories / calorieGoal) * 100));
  const proteinPercent = Math.min(100, Math.round((consumedProtein / proteinGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Daily Macro Telemetry</h2>
          <p className="text-xs text-zinc-400">Track weighed intake against your bulking target</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl">
          <Calendar className="w-4 h-4 text-amber-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calories Card */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-zinc-300">Calories</span>
            </div>
            <span className="text-xs text-zinc-400">
              {consumedCalories} / {calorieGoal} kcal ({caloriePercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        {/* Protein Card */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-zinc-300">Protein</span>
            </div>
            <span className="text-xs text-zinc-400">
              {consumedProtein}g / {proteinGoal}g ({proteinPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Weighed Meal Form */}
      <form
        onSubmit={handleAddMeal}
        className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
      >
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Log Weighed Food
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Food Name</label>
            <input
              type="text"
              name="foodName"
              required
              placeholder="Cooked White Rice"
              value={mealForm.foodName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Grams (g)</label>
            <input
              type="number"
              name="grams"
              min="1"
              required
              placeholder="300"
              value={mealForm.grams}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Calories</label>
            <input
              type="number"
              name="calories"
              min="0"
              required
              placeholder="390"
              value={mealForm.calories}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Protein (g)</label>
            <input
              type="number"
              step="0.1"
              name="proteinG"
              min="0"
              required
              placeholder="8"
              value={mealForm.proteinG}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Optional Carbs & Fats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Carbs (g) - Opt</label>
            <input
              type="number"
              step="0.1"
              name="carbsG"
              min="0"
              placeholder="84"
              value={mealForm.carbsG}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 uppercase mb-1">Fats (g) - Opt</label>
            <input
              type="number"
              step="0.1"
              name="fatsG"
              min="0"
              placeholder="1"
              value={mealForm.fatsG}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </form>

      {/* Logged Meals List */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Logged Meals ({summary?.meals?.length || 0})
        </h3>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading meals...</p>
        ) : !summary?.meals || summary.meals.length === 0 ? (
          <p className="text-sm text-zinc-500">No meals logged for {selectedDate} yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {summary.meals.map((meal) => (
              <div key={meal.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    {meal.foodName}{' '}
                    <span className="text-xs text-zinc-400">({meal.grams}g)</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {meal.calories} kcal • {meal.proteinG}g P • {meal.carbsG}g C • {meal.fatsG}g F
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  title="Delete meal"
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
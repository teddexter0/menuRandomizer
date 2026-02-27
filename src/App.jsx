/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { RefreshCw, ShoppingCart, Calendar, Sparkles, DollarSign, TrendingUp, Save } from 'lucide-react';

// ─── Meal slot sub-component ────────────────────────────────────────────────
const colorMap = {
  yellow: { bg: 'bg-yellow-50', text: 'text-orange-600', hover: 'hover:text-orange-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  hover: 'hover:text-green-500'  },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   hover: 'hover:text-blue-500'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:text-purple-500' },
};

const MealSlot = ({ label, meal, color, onRegen, last }) => {
  const c = colorMap[color];
  return (
    <div className={`${last ? '' : 'mb-3'} p-3 ${c.bg} rounded-lg`}>
      <div className="flex justify-between items-start mb-1">
        <h4 className={`font-bold ${c.text} text-sm`}>{label}</h4>
        <button onClick={onRegen} className={`text-gray-400 ${c.hover} transition-colors`}>
          <RefreshCw size={14} />
        </button>
      </div>
      <p className="text-gray-700 text-xs mb-1">{meal.description}</p>
      <p className="text-xs text-green-600 font-semibold">KES {meal.cost}</p>
    </div>
  );
};

// ─── Day card sub-component ──────────────────────────────────────────────────
const DayCard = ({ menu, idx, onRegenerate }) => (
  <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-orange-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Calendar className="text-orange-500" size={20} />
        <h3 className="text-xl font-bold text-gray-800">{menu.day}</h3>
      </div>
      <div className="bg-green-100 px-3 py-1 rounded-full">
        <p className="text-xs font-bold text-green-700">KES {menu.totalCost}</p>
      </div>
    </div>
    <MealSlot label="🌅 Breakfast" meal={menu.breakfast} color="yellow" onRegen={() => onRegenerate(idx, 'breakfast')} />
    <MealSlot label="☀️ Lunch"    meal={menu.lunch}     color="green"  onRegen={() => onRegenerate(idx, 'lunch')} />
    <MealSlot label="🌙 Dinner"   meal={menu.dinner}    color="blue"   onRegen={() => onRegenerate(idx, 'dinner')} />
    <MealSlot label="🍿 Snacks"   meal={menu.snacks}    color="purple" onRegen={() => onRegenerate(idx, 'snacks')} last />
  </div>
);

// ─── Main planner ────────────────────────────────────────────────────────────
const MenuPlanner = () => {
  const [menus, setMenus]               = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [mealHistory, setMealHistory]   = useState([]);
  const [planDuration, setPlanDuration] = useState('week');
  const [weeklyBudget, setWeeklyBudget] = useState({ total: 0, breakdown: { meals: 0, snacks: 0, staples: 0 } });
  const [lastSaved, setLastSaved]       = useState(null);

  // ── Food data ──────────────────────────────────────────────────────────────
  const foods = {
    breakfastItems: {
      'tea + bread':   { price: 165, staple: true  },
      'tea + muffins': { price: 138, staple: false },
      'coffee + bread':{ price: 165, staple: true  },
      'porridge':      { price: 50,  staple: true  },
      'milk + cereal': { price: 100, staple: false },
    },
    proteins: {
      fish:         { price: 375, meals: ['lunch', 'dinner'] },
      chicken:      { price: 375, meals: ['lunch', 'dinner'] },
      meat:         { price: 375, meals: ['lunch', 'dinner'] },
      'minced meat':{ price: 300, meals: ['lunch', 'dinner'] },
      omena:        { price: 250, meals: ['lunch', 'dinner'] },
      eggs:         { price: 100, meals: ['breakfast', 'lunch', 'dinner'] },
    },
    legumes: {
      beans:   { price: 100 },
      ndengu:  { price: 100 },
      lentils: { price: 100 },
      peas:    { price: 100 },
    },
    carbs: {
      rice:      { price: 50,  staple: true  },
      ugali:     { price: 50,  staple: true  },
      chapati:   { price: 150, staple: false },
      spaghetti: { price: 150, staple: false },
      pilau:     { price: 200, staple: false },
    },
    vegetables: {
      spinach:    { price: 50 },
      cabbage:    { price: 50 },
      kales:      { price: 50 },
      kachumbari: { price: 30 },
    },
    snacks: {
      soda:         { price: 150 },
      'minute maid':{ price: 280 },
      yogurt:       { price: 225 },
      'queen cake': { price: 276 },
      smokies:      { price: 80  },
      chips:        { price: 300 },
      samosa:       { price: 120 },
    },
    fastFood: {
      'Chicken Run': { price: 1000 },
      KFC:           { price: 1960 },
    },
  };

  // ── Pairing rules: carb → which proteins & vegs make sense ────────────────
  //   Drives the meal generator so combos are always coherent.
  const pairings = {
    rice: {
      proteins: ['fish', 'chicken', 'meat', 'minced meat', 'omena', 'eggs'],
      legumes:  ['beans', 'ndengu', 'lentils', 'peas'],
      vegs:     ['spinach', 'cabbage', 'kales', 'kachumbari'],
    },
    ugali: {
      proteins: ['fish', 'chicken', 'meat', 'minced meat', 'omena', 'eggs'],
      legumes:  ['beans', 'ndengu'],
      vegs:     ['spinach', 'cabbage', 'kales', 'kachumbari'],
    },
    chapati: {
      proteins: ['eggs', 'meat', 'chicken', 'minced meat'],
      legumes:  ['beans', 'ndengu', 'lentils', 'peas'],
      vegs:     ['spinach', 'kales', 'kachumbari'],
    },
    spaghetti: {
      // Spaghetti = no legumes, only meat-based proteins, no kachumbari
      proteins: ['minced meat', 'chicken', 'meat', 'eggs'],
      legumes:  [],
      vegs:     ['spinach', 'cabbage', 'kales'],
    },
    pilau: {
      // Pilau is already a spiced rice dish — just add kachumbari on the side
      proteins: ['chicken', 'meat', 'minced meat'],
      legumes:  [],
      vegs:     ['kachumbari'],
    },
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const pickFromObj = (obj, avoid = []) => {
    const keys = Object.keys(obj).filter(k => !avoid.includes(k));
    return pickRandom(keys.length > 0 ? keys : Object.keys(obj));
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // ── Generators ────────────────────────────────────────────────────────────
  const generateBreakfast = (used) => {
    const item = pickFromObj(foods.breakfastItems, used.slice(-6));
    return {
      items: [item],
      cost: foods.breakfastItems[item].price,
      description: capitalize(item),
    };
  };

  const generateMeal = (mealType, used, usedProteinsToday = [], dayName = '') => {
    const recent = used.slice(-8);

    // Tuesday & Thursday: 50% chance of fast food
    if ((dayName === 'Tuesday' || dayName === 'Thursday') && Math.random() > 0.5) {
      const option = pickFromObj(foods.fastFood);
      return {
        items: [option],
        cost: foods.fastFood[option].price,
        isFastFood: true,
        description: `${option} (Fast Food Day!)`,
      };
    }

    // Pick carb first — this determines what protein & veg are sensible
    const carb     = pickFromObj(foods.carbs, recent);
    const carbCost = foods.carbs[carb].price;
    const pair     = pairings[carb];

    // Legume day only when the carb supports it
    const canUseLegume = pair.legumes.length > 0;
    const isLegumeDay  = canUseLegume && Math.random() > 0.6;

    let protein, proteinCost;

    if (isLegumeDay) {
      const pool = pair.legumes.filter(l => !recent.includes(l));
      protein     = pickRandom(pool.length > 0 ? pool : pair.legumes);
      proteinCost = foods.legumes[protein].price;
    } else {
      // Filter by: compatible with this carb + right meal type + not repeated today + not recently used
      const idealPool = pair.proteins.filter(p =>
        foods.proteins[p] &&
        foods.proteins[p].meals.includes(mealType) &&
        !usedProteinsToday.includes(p) &&
        !recent.includes(p)
      );
      // Fallback: relax the recency constraint
      const fallbackPool = pair.proteins.filter(p =>
        foods.proteins[p] && foods.proteins[p].meals.includes(mealType)
      );
      const pool  = idealPool.length > 0 ? idealPool : (fallbackPool.length > 0 ? fallbackPool : pair.proteins);
      protein     = pickRandom(pool);
      proteinCost = foods.proteins[protein]?.price ?? 300;
    }

    // Veg compatible with this carb, avoiding recently used ones
    const vegPool = pair.vegs.filter(v => !recent.includes(v));
    const veg     = pickRandom(vegPool.length > 0 ? vegPool : pair.vegs);
    const vegCost = foods.vegetables[veg].price;

    return {
      items: [protein, carb, veg],
      cost: proteinCost + carbCost + vegCost,
      isFastFood: false,
      description: `${capitalize(protein)}, ${carb}, ${veg}`,
    };
  };

  const generateDailySnacks = () => {
    // Pick 2–3 distinct snacks (no duplicates within the same day)
    const numSnacks   = Math.random() > 0.5 ? 2 : 3;
    const snackKeys   = Object.keys(foods.snacks);
    const shuffled    = [...snackKeys].sort(() => Math.random() - 0.5);
    const selected    = shuffled.slice(0, numSnacks);
    const totalCost   = selected.reduce((sum, s) => sum + foods.snacks[s].price, 0);
    return { items: selected, cost: totalCost, description: selected.join(', ') };
  };

  // ── Shopping list builder ─────────────────────────────────────────────────
  const buildShoppingList = (menuList) => {
    const items = {};
    let mealsCost = 0, snacksCost = 0, staplesCost = 0;

    menuList.forEach(menu => {
      [...menu.breakfast.items, ...menu.lunch.items, ...menu.dinner.items, ...menu.snacks.items].forEach(item => {
        if (!items[item]) items[item] = { count: 0 };
        items[item].count += 1;
      });
      mealsCost  += menu.breakfast.cost + menu.lunch.cost + menu.dinner.cost;
      snacksCost += menu.snacks.cost;
    });

    const bulkStaples = [
      { name: 'Rice (2kg bulk)',      cost: 400 },
      { name: 'Unga (2kg bulk)',       cost: 300 },
      { name: 'Tea/Coffee (monthly)', cost: 500 },
      { name: 'Cooking oil',          cost: 400 },
    ];
    bulkStaples.forEach(s => { items[s.name] = { count: 1 }; staplesCost += s.cost; });

    const totalBudget = mealsCost + snacksCost + staplesCost;

    const list = [
      {
        category: 'Weekly Staples (Bulk Buy)',
        items: bulkStaples.map(s => `${s.name} - KES ${s.cost}`),
      },
      {
        category: 'Fresh Proteins (Buy as Needed)',
        items: Object.entries(items)
          .filter(([n]) => Object.keys(foods.proteins).includes(n) || Object.keys(foods.legumes).includes(n))
          .map(([n, d]) => `${capitalize(n)} (${d.count}x)`),
      },
      {
        category: 'Vegetables & Carbs',
        items: Object.entries(items)
          .filter(([n]) =>
            Object.keys(foods.vegetables).includes(n) ||
            (Object.keys(foods.carbs).includes(n) && !foods.carbs[n].staple)
          )
          .map(([n, d]) => `${capitalize(n)} (${d.count}x)`),
      },
      {
        category: 'Snacks & Drinks',
        items: Object.entries(items)
          .filter(([n]) => Object.keys(foods.snacks).includes(n))
          .map(([n, d]) => `${capitalize(n)} (${d.count}x)`),
      },
    ];

    setShoppingList(list.filter(s => s.items.length > 0));
    setWeeklyBudget({
      total: Math.round(totalBudget),
      breakdown: {
        meals:   Math.round(mealsCost),
        snacks:  Math.round(snacksCost),
        staples: Math.round(staplesCost),
      },
    });

    return { total: Math.round(totalBudget), breakdown: { meals: Math.round(mealsCost), snacks: Math.round(snacksCost), staples: Math.round(staplesCost) } };
  };

  // ── Core menu generator ───────────────────────────────────────────────────
  const generateMenu = (duration = planDuration) => {
    const days     = duration === 'month' ? 28 : 7;
    const newMenus = [];
    const usedRecently = [...mealHistory];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let day = 0; day < days; day++) {
      const dayName          = dayNames[day % 7];
      const usedProteinsToday = [];

      const breakfast = generateBreakfast(usedRecently);
      const lunch     = generateMeal('lunch',  usedRecently, usedProteinsToday, dayName);

      if (!lunch.isFastFood && foods.proteins[lunch.items[0]]) {
        usedProteinsToday.push(lunch.items[0]);
      }

      const dinner = generateMeal('dinner', usedRecently, usedProteinsToday, dayName);
      const snacks = generateDailySnacks();

      const dayMenu = {
        day: dayName,
        weekNumber: Math.floor(day / 7) + 1,
        breakfast, lunch, dinner, snacks,
        totalCost: breakfast.cost + lunch.cost + dinner.cost + snacks.cost,
      };

      newMenus.push(dayMenu);
      usedRecently.push(...breakfast.items, ...lunch.items, ...dinner.items);
    }

    const newHistory = usedRecently.slice(-30);
    setMenus(newMenus);
    setPlanDuration(duration);
    setMealHistory(newHistory);
    const budget = buildShoppingList(newMenus);

    // Persist to localStorage
    const savedAt = new Date().toISOString();
    localStorage.setItem('menuPlannerState', JSON.stringify({
      menus: newMenus, duration, mealHistory: newHistory, budget, savedAt,
    }));
    setLastSaved(new Date(savedAt));
  };

  // ── Individual meal regeneration ──────────────────────────────────────────
  const regenerateMeal = (dayIndex, mealType) => {
    const newMenus = [...menus];
    const dayName  = newMenus[dayIndex].day;
    const usedProteinsToday = [];

    if (mealType === 'breakfast') {
      newMenus[dayIndex].breakfast = generateBreakfast(mealHistory);
    } else if (mealType === 'snacks') {
      newMenus[dayIndex].snacks = generateDailySnacks();
    } else {
      // Avoid repeating the other meal's protein today
      const other = mealType === 'lunch' ? newMenus[dayIndex].dinner : newMenus[dayIndex].lunch;
      if (!other.isFastFood && foods.proteins[other.items[0]]) {
        usedProteinsToday.push(other.items[0]);
      }
      newMenus[dayIndex][mealType] = generateMeal(mealType, mealHistory, usedProteinsToday, dayName);
    }

    newMenus[dayIndex].totalCost =
      newMenus[dayIndex].breakfast.cost +
      newMenus[dayIndex].lunch.cost +
      newMenus[dayIndex].dinner.cost +
      newMenus[dayIndex].snacks.cost;

    setMenus(newMenus);
    buildShoppingList(newMenus);

    const savedAt = new Date().toISOString();
    localStorage.setItem('menuPlannerState', JSON.stringify({
      menus: newMenus, duration: planDuration, mealHistory, savedAt,
    }));
    setLastSaved(new Date(savedAt));
  };

  // ── Load saved state on mount ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('menuPlannerState');
      if (raw) {
        const { menus: savedMenus, duration, mealHistory: savedHistory, savedAt } = JSON.parse(raw);
        if (savedMenus?.length > 0) {
          setMenus(savedMenus);
          setPlanDuration(duration || 'week');
          if (savedHistory) setMealHistory(savedHistory);
          buildShoppingList(savedMenus);
          setLastSaved(new Date(savedAt));
          return; // skip auto-generate
        }
      }
    } catch (_) { /* ignore corrupt state */ }
    generateMenu('week');
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const isMonth      = menus.length > 7;
  const budgetTarget = isMonth ? 30000 : 7500;
  const budgetLabel  = isMonth ? 'Monthly Budget (Target: 30,000 KES)' : 'Weekly Budget (Target: 7,500 KES)';

  // Group into weeks for month view
  const weekGroups = isMonth
    ? [0, 1, 2, 3].map(w => menus.slice(w * 7, w * 7 + 7))
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-500" />
            Budget Menu Planner
          </h1>
          <p className="text-gray-600">Realistic meals • Snacks included • Budget-aware</p>
          {lastSaved && (
            <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
              <Save size={12} />
              Last saved {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString()} — will reload where you left off
            </p>
          )}
        </div>

        {/* Budget summary */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={32} />
            <h2 className="text-2xl font-bold">{budgetLabel}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm opacity-90">Total Spent</p>
              <p className="text-3xl font-bold">KES {weeklyBudget.total.toLocaleString()}</p>
              <p className="text-xs mt-1">
                {weeklyBudget.total <= budgetTarget ? '✅ Under budget!' : '⚠️ Over budget'}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm opacity-90">Meals</p>
              <p className="text-2xl font-bold">KES {weeklyBudget.breakdown.meals.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm opacity-90">Snacks</p>
              <p className="text-2xl font-bold">KES {weeklyBudget.breakdown.snacks.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm opacity-90">Staples</p>
              <p className="text-2xl font-bold">KES {weeklyBudget.breakdown.staples.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm mt-4 opacity-90">
            <TrendingUp size={16} className="inline mr-1" />
            Monthly budget: 30,000 KES = 7,500 KES/week
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => generateMenu('week')}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <RefreshCw size={20} />
            New Week
          </button>
          <button
            onClick={() => generateMenu('month')}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <Calendar size={20} />
            Generate Full Month
          </button>
        </div>

        {/* Menu cards */}
        {weekGroups ? (
          weekGroups.map((week, wIdx) => (
            <div key={wIdx} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold">
                  Week {wIdx + 1}
                </span>
                <div className="flex-1 border-t border-purple-200" />
                <span className="text-sm text-gray-500">
                  KES {week.reduce((s, m) => s + m.totalCost, 0).toLocaleString()} this week
                </span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {week.map((menu, idx) => (
                  <DayCard key={idx} menu={menu} idx={wIdx * 7 + idx} onRegenerate={regenerateMeal} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {menus.map((menu, idx) => (
              <DayCard key={idx} menu={menu} idx={idx} onRegenerate={regenerateMeal} />
            ))}
          </div>
        )}

        {/* Shopping list */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-green-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Shopping List</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shoppingList.map((section, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-3">{section.category}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-orange-100 rounded-xl p-4">
          <p className="text-gray-700 text-sm">
            💡 <strong>Budget Tips:</strong> Target is ~30,000 KES/month (~1,000 KES/day).
            Staples (rice, unga, tea, oil) are bulk-bought monthly.
            Fast food appears on Tuesdays &amp; Thursdays (bonus days!).
            Snacks are realistic based on your actual spending patterns.
            Fresh items (milk, vegetables, proteins) bought as needed.
            Your plan <strong>auto-saves</strong> — it'll be here next time you open the app.
          </p>
        </div>

      </div>
    </div>
  );
};

export default MenuPlanner;

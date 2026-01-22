/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { RefreshCw, ShoppingCart, Calendar, Sparkles, DollarSign, TrendingUp } from 'lucide-react';

const MenuPlanner = () => {
  const [menus, setMenus] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [planDuration, setPlanDuration] = useState('week');
  const [weeklyBudget, setWeeklyBudget] = useState({
    total: 0,
    breakdown: { meals: 0, snacks: 0, staples: 0 }
  });

  // Realistic food categories with PRICES (+ 250 KES buffer already included)
  // MONTHLY BUDGET ~30,000 KES = ~1,000 KES/day average
  const foods = {
    breakfastItems: {
      'tea + bread': { price: 165, staple: true }, // Just bread, tea is from bulk
      'tea + muffins': { price: 138, staple: false },
      'coffee + bread': { price: 165, staple: true },
      'porridge': { price: 50, staple: true }, // portion of bulk uji flour
      'milk + cereal': { price: 100, staple: false }, // portion of cereal box
    },
    
    // Main proteins with realistic prices
    proteins: {
      fish: { price: 375, meals: ['lunch', 'dinner'] }, // 250-500 average
      chicken: { price: 375, meals: ['lunch', 'dinner'] },
      meat: { price: 375, meals: ['lunch', 'dinner'] },
      'minced meat': { price: 300, meals: ['lunch', 'dinner'] },
      omena: { price: 250, meals: ['lunch', 'dinner'] },
      eggs: { price: 100, meals: ['breakfast', 'lunch', 'dinner'] }, // portion of 1200 tray
    },
    
    legumes: {
      beans: { price: 100 },
      ndengu: { price: 100 },
      lentils: { price: 100 },
      peas: { price: 100 },
    },
    
    carbs: {
      rice: { price: 50, staple: true }, // bulk bought, daily portion
      ugali: { price: 50, staple: true }, // unga bought in bulk, daily portion
      chapati: { price: 150 }, // homemade
      spaghetti: { price: 150 },
      pilau: { price: 200 },
    },
    
    vegetables: {
      spinach: { price: 50 },
      cabbage: { price: 50 },
      kales: { price: 50 },
      kachumbari: { price: 30 }, // daily portion (150/week ÷ 7)
    },
    
    // SNACKS - based on your actual data
    snacks: {
      soda: { price: 150, frequency: 'daily' }, // ~130-265 average
      'minute maid': { price: 280, frequency: 'frequent' },
      yogurt: { price: 225, frequency: 'frequent' },
      'queen cake': { price: 276, frequency: 'occasional' },
      smokies: { price: 80, frequency: 'occasional' },
      chips: { price: 300, frequency: 'occasional' },
      samosa: { price: 120, frequency: 'occasional' },
    },
    
    // Fast food days (Tuesday & Thursday)
    fastFood: {
      'Chicken Run': { price: 1000, days: ['Tuesday', 'Thursday'] },
      KFC: { price: 1960, days: ['Tuesday', 'Thursday'] },
    },
  };

  const pickRandom = (obj, avoid = []) => {
    const keys = Object.keys(obj).filter(k => !avoid.includes(k));
    return keys[Math.floor(Math.random() * keys.length)];
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const generateBreakfast = (used) => {
    const recent = used.slice(-6);
    const item = pickRandom(foods.breakfastItems, recent);
    const cost = foods.breakfastItems[item].price;
    
    return {
      items: [item],
      cost: cost,
      description: capitalize(item),
    };
  };

  const generateMeal = (mealType, used, usedProteinsToday = [], dayName = '') => {
    const recent = used.slice(-8);
    
    // Tuesday & Thursday: 50% chance of fast food
    const isFastFoodDay = (dayName === 'Tuesday' || dayName === 'Thursday') && Math.random() > 0.5;
    
    if (isFastFoodDay) {
      const option = pickRandom(foods.fastFood);
      return {
        items: [option],
        cost: foods.fastFood[option].price,
        isFastFood: true,
        description: `${option} (Fast Food Day!)`,
      };
    }
    
    // Regular meal: protein + carb + veg
    const isLegumeDay = Math.random() > 0.6;
    
    let protein, proteinCost;
    if (isLegumeDay) {
      protein = pickRandom(foods.legumes, recent);
      proteinCost = foods.legumes[protein].price;
    } else {
      const available = Object.entries(foods.proteins)
        .filter(([name, config]) => 
          config.meals.includes(mealType) && !usedProteinsToday.includes(name)
        )
        .map(([name]) => name);
      
      protein = available.length > 0 
        ? pickRandom(Object.fromEntries(available.map(k => [k, foods.proteins[k]])), recent)
        : pickRandom(foods.proteins, recent);
      proteinCost = foods.proteins[protein].price;
    }
    
    const carb = pickRandom(foods.carbs, recent);
    const carbCost = foods.carbs[carb].price;
    
    const veg = pickRandom(foods.vegetables, recent);
    const vegCost = foods.vegetables[veg].price;
    
    const totalCost = proteinCost + carbCost + vegCost;
    
    return {
      items: [protein, carb, veg],
      cost: totalCost,
      isFastFood: false,
      description: `${capitalize(protein)}, ${carb}, ${veg}`,
    };
  };

  const generateDailySnacks = () => {
    // Average 2-3 snacks per day based on your data
    const numSnacks = Math.random() > 0.5 ? 2 : 3;
    const selectedSnacks = [];
    let totalCost = 0;
    
    for (let i = 0; i < numSnacks; i++) {
      const snack = pickRandom(foods.snacks);
      selectedSnacks.push(snack);
      totalCost += foods.snacks[snack].price;
    }
    
    return {
      items: selectedSnacks,
      cost: totalCost,
      description: selectedSnacks.join(', '),
    };
  };

  const generateShoppingList = (menuList) => {
    const items = {};
    let totalBudget = 0;
    let mealsCost = 0;
    let snacksCost = 0;
    let staplesCost = 0;
    
    menuList.forEach(menu => {
      // Track all items
      [...menu.breakfast.items, ...menu.lunch.items, ...menu.dinner.items, ...menu.snacks.items].forEach(item => {
        if (!items[item]) {
          items[item] = { count: 0, cost: 0 };
        }
        items[item].count += 1;
      });
      
      // Calculate costs
      totalBudget += menu.breakfast.cost + menu.lunch.cost + menu.dinner.cost + menu.snacks.cost;
      mealsCost += menu.breakfast.cost + menu.lunch.cost + menu.dinner.cost;
      snacksCost += menu.snacks.cost;
    });
    
    // Staples (bought in bulk, add once)
    const bulkStaples = [
      { name: 'Rice (2kg bulk)', cost: 400 },
      { name: 'Unga (2kg bulk)', cost: 300 },
      { name: 'Tea/Coffee (monthly)', cost: 500 },
      { name: 'Cooking oil', cost: 400 },
    ];
    
    bulkStaples.forEach(staple => {
      items[staple.name] = { count: 1, cost: staple.cost };
      staplesCost += staple.cost;
    });
    
    totalBudget += staplesCost;
    
    const list = [
      { 
        category: 'Weekly Staples (Bulk Buy)', 
        items: bulkStaples.map(s => `${s.name} - KES ${s.cost}`)
      },
      { 
        category: 'Fresh Proteins (Buy as Needed)', 
        items: Object.entries(items)
          .filter(([name]) => 
            Object.keys(foods.proteins).includes(name) || 
            Object.keys(foods.legumes).includes(name)
          )
          .map(([name, data]) => `${capitalize(name)} (${data.count}x)`)
      },
      { 
        category: 'Vegetables & Carbs', 
        items: Object.entries(items)
          .filter(([name]) => 
            Object.keys(foods.vegetables).includes(name) || 
            (Object.keys(foods.carbs).includes(name) && !foods.carbs[name].staple)
          )
          .map(([name, data]) => `${capitalize(name)} (${data.count}x)`)
      },
      { 
        category: 'Snacks & Drinks', 
        items: Object.entries(items)
          .filter(([name]) => Object.keys(foods.snacks).includes(name))
          .map(([name, data]) => `${capitalize(name)} (${data.count}x)`)
      },
    ];

    setShoppingList(list.filter(section => section.items.length > 0));
    setWeeklyBudget({
      total: Math.round(totalBudget),
      breakdown: {
        meals: Math.round(mealsCost),
        snacks: Math.round(snacksCost),
        staples: Math.round(staplesCost),
      }
    });
  };

  const generateMenu = (duration = planDuration) => {
    const days = duration === 'week' ? 7 : 28;
    const newMenus = [];
    const usedRecently = [...mealHistory];

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let day = 0; day < days; day++) {
      const dayName = dayNames[day % 7];
      const usedProteinsToday = [];
      
      const breakfast = generateBreakfast(usedRecently);
      const lunch = generateMeal('lunch', usedRecently, usedProteinsToday, dayName);
      
      if (!lunch.isFastFood && !Object.keys(foods.legumes).includes(lunch.items[0])) {
        usedProteinsToday.push(lunch.items[0]);
      }
      
      const dinner = generateMeal('dinner', usedRecently, usedProteinsToday, dayName);
      const snacks = generateDailySnacks();
      
      const dayMenu = {
        day: dayName,
        weekNumber: Math.floor(day / 7) + 1,
        breakfast,
        lunch,
        dinner,
        snacks,
        totalCost: breakfast.cost + lunch.cost + dinner.cost + snacks.cost,
      };
      
      newMenus.push(dayMenu);
      
      usedRecently.push(
        ...dayMenu.breakfast.items,
        ...dayMenu.lunch.items,
        ...dayMenu.dinner.items
      );
    }

    setMenus(newMenus);
    setMealHistory(usedRecently.slice(-30));
    generateShoppingList(newMenus);
  };

  const regenerateMeal = (dayIndex, mealType) => {
    const newMenus = [...menus];
    const dayName = newMenus[dayIndex].day;
    const usedProteinsToday = [];
    
    if (mealType === 'breakfast') {
      newMenus[dayIndex].breakfast = generateBreakfast(mealHistory);
    } else if (mealType === 'snacks') {
      newMenus[dayIndex].snacks = generateDailySnacks();
    } else {
      if (mealType === 'lunch' && !newMenus[dayIndex].dinner.isFastFood && 
          !Object.keys(foods.legumes).includes(newMenus[dayIndex].dinner.items[0])) {
        usedProteinsToday.push(newMenus[dayIndex].dinner.items[0]);
      }
      if (mealType === 'dinner' && !newMenus[dayIndex].lunch.isFastFood &&
          !Object.keys(foods.legumes).includes(newMenus[dayIndex].lunch.items[0])) {
        usedProteinsToday.push(newMenus[dayIndex].lunch.items[0]);
      }
      
      newMenus[dayIndex][mealType] = generateMeal(mealType, mealHistory, usedProteinsToday, dayName);
    }
    
    newMenus[dayIndex].totalCost = 
      newMenus[dayIndex].breakfast.cost + 
      newMenus[dayIndex].lunch.cost + 
      newMenus[dayIndex].dinner.cost + 
      newMenus[dayIndex].snacks.cost;
    
    setMenus(newMenus);
    generateShoppingList(newMenus);
  };

  if (!initialized) {
    setInitialized(true);
    setTimeout(() => generateMenu('week'), 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-500" />
            Budget Menu Planner
          </h1>
          <p className="text-gray-600">Realistic meals • Snacks included • Budget-aware</p>
        </div>

        {/* Budget Summary */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={32} />
            <h2 className="text-2xl font-bold">Weekly Budget (Target: 7,500 KES)</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm opacity-90">Total Spent</p>
              <p className="text-3xl font-bold">KES {weeklyBudget.total.toLocaleString()}</p>
              <p className="text-xs mt-1">
                {weeklyBudget.total <= 7500 ? '✅ Under budget!' : '⚠️ Over budget'}
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
            <TrendingUp size={16} className="inline" /> Monthly budget: 30,000 KES = 7,500 KES/week
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => generateMenu()}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <RefreshCw size={20} />
            Generate New Week
          </button>
        </div>

        {/* Daily Menu Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {menus.map((menu, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-5 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-orange-500" size={20} />
                  <h3 className="text-xl font-bold text-gray-800">{menu.day}</h3>
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <p className="text-xs font-bold text-green-700">KES {menu.totalCost}</p>
                </div>
              </div>

              {/* Breakfast */}
              <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-orange-600 text-sm">🌅 Breakfast</h4>
                  <button
                    onClick={() => regenerateMeal(idx, 'breakfast')}
                    className="text-gray-500 hover:text-orange-500"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <p className="text-gray-700 text-xs mb-1">{menu.breakfast.description}</p>
                <p className="text-xs text-green-600 font-semibold">KES {menu.breakfast.cost}</p>
              </div>

              {/* Lunch */}
              <div className="mb-3 p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-green-600 text-sm">☀️ Lunch</h4>
                  <button
                    onClick={() => regenerateMeal(idx, 'lunch')}
                    className="text-gray-500 hover:text-green-500"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <p className="text-gray-700 text-xs mb-1">{menu.lunch.description}</p>
                <p className="text-xs text-green-600 font-semibold">KES {menu.lunch.cost}</p>
              </div>

              {/* Dinner */}
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-blue-600 text-sm">🌙 Dinner</h4>
                  <button
                    onClick={() => regenerateMeal(idx, 'dinner')}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <p className="text-gray-700 text-xs mb-1">{menu.dinner.description}</p>
                <p className="text-xs text-green-600 font-semibold">KES {menu.dinner.cost}</p>
              </div>

              {/* Snacks */}
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-purple-600 text-sm">🍿 Snacks</h4>
                  <button
                    onClick={() => regenerateMeal(idx, 'snacks')}
                    className="text-gray-500 hover:text-purple-500"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <p className="text-gray-700 text-xs mb-1">{menu.snacks.description}</p>
                <p className="text-xs text-green-600 font-semibold">KES {menu.snacks.cost}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shopping List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
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

        <div className="mt-6 bg-orange-100 rounded-xl p-4">
          <p className="text-gray-700 text-sm">
            💡 <strong>Budget Tips:</strong> Target is ~30,000 KES/month (~1,000 KES/day). 
            Staples (rice, unga, tea, oil) are bulk-bought monthly. 
            Fast food appears on Tuesdays & Thursdays (bonus days!). 
            Snacks are realistic based on your actual spending patterns. 
            Fresh items (milk, vegetables, proteins) bought as needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuPlanner;
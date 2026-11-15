(() => {
  "use strict";

  const STORAGE = {
    plan: "fitplan-pro-data",
    daily: "fitplan-daily-history",
    habits: "fitplan-habits-history",
    currentWeek: "fitplan-current-week"
  };

  const defaultPlan = [
    { day: "الاثنين", type: "قوة", exercises: ["تمارين القوة A: 3×10-12", "Push-ups أو الجدار: 3×8-12", "Squats: 3×12-15", "Plank: 3×20-30 ثانية"] },
    { day: "الثلاثاء", type: "كارديو", exercises: ["مشي سريع: 30 دقيقة", "تمديد الظهر: 2×30 ثانية", "تمديد الساقين: 2×30 ثانية"] },
    { day: "الأربعاء", type: "راحة", exercises: ["راحة أو مشي خفيف: 20-30 دقيقة", "تمدد خفيف: 10 دقائق", "استرخاء وتحكم في التنفس"] },
    { day: "الخميس", type: "قوة", exercises: ["تمارين القوة B: 3×10-12", "Lunges: 3×8 لكل قدم", "Deadlifts خفيف: 3×10", "Glute bridge: 3×12"] },
    { day: "الجمعة", type: "HIIT", exercises: ["HIIT: 20 دقيقة", "Jumping jacks: 30s / 30s راحة", "Mountain climbers: 30s / 30s راحة", "Squat jumps: 30s / 30s راحة"] },
    { day: "السبت", type: "جسم كامل", exercises: ["تمارين كاملة الجسم: 3 دورات", "Squats: 12", "Push-ups: 8-12", "Lunges: 8/قدم", "Plank: 20-30 ثانية"] },
    { day: "الأحد", type: "استعادة", exercises: ["راحة كاملة", "تمدد خفيف 10 دقائق", "نوم 7-8 ساعات"] }
  ];

  const $ = (id) => document.getElementById(id);
  const parse = (value, fallback) => {
    try { const result = JSON.parse(value); return result ?? fallback; }
    catch { return fallback; }
  };
  const read = (key, fallback) => parse(localStorage.getItem(key), fallback);
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const number = (value, fallback = 0) => {
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
  };
  const dateKey = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  const cloneDefaultPlan = () => defaultPlan.map(day => ({ ...day, exercises: [...day.exercises], done: false }));

  const state = {
    plan: loadPlan(),
    week: Math.min(8, Math.max(1, number(localStorage.getItem(STORAGE.currentWeek), 1)))
  };

  function loadPlan() {
    const saved = read(STORAGE.plan, null);
    if (!Array.isArray(saved) || !saved.length) return cloneDefaultPlan();
    return defaultPlan.map(base => {
      const item = saved.find(day => day.day === base.day);
      return item ? {
        ...base, ...item,
        exercises: Array.isArray(item.exercises) ? item.exercises.filter(x => typeof x === "string") : [...base.exercises],
        done: Boolean(item.done)
      } : { ...base, exercises: [...base.exercises], done: false };
    });
  }

  function dailyHistory() { return read(STORAGE.daily, {}); }
  function habitHistory() { return read(STORAGE.habits, {}); }
  function currentDaily() {
    const key = dateKey();
    return dailyHistory()[key] || { date: key, water: 0, calories: 0, weight: "" };
  }

  function savePlan() { write(STORAGE.plan, state.plan); }

  function showPanel(target) {
    document.querySelectorAll(".nav-item").forEach(button => {
      const active = button.dataset.target === target;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    document.querySelectorAll(".panel").forEach(panel => {
      const active = panel.id === target;
      panel.classList.toggle("hidden-panel", !active);
      panel.classList.toggle("active-panel", active);
    });
    state.selectedTarget = target;
  }

  function updateStats() {
    const total = state.plan.length;
    const done = state.plan.filter(day => day.done).length;
    const percent = total ? Math.round(done / total * 100) : 0;
    const today = currentDaily();

    if ($("completedCount")) $("completedCount").textContent = String(done);
    if ($("commitmentRate")) $("commitmentRate").textContent = percent + "%";
    if ($("waterState")) $("waterState").textContent = number(today.water).toFixed(number(today.water) % 1 ? 1 : 0) + "L";
    if ($("caloriesState")) $("caloriesState").textContent = String(Math.round(number(today.calories)));

    const ring = $("ringProgress");
    if (ring) {
      const circumference = 2 * Math.PI * 48;
      ring.style.strokeDasharray = String(circumference);
      ring.style.strokeDashoffset = String(circumference * (1 - percent / 100));
    }
    if ($("ringPercent")) $("ringPercent").textContent = percent + "%";
  }

  function renderWeekGrid() {
    const mount = $("weekGrid");
    const template = $("dayTemplate");
    if (!mount || !template) return;
    mount.replaceChildren();

    state.plan.forEach(day => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector("h4").textContent = day.day;
      fragment.querySelector(".tag").textContent = day.type;
      const list = fragment.querySelector(".exercise-list");
      day.exercises.forEach(exercise => {
        const li = document.createElement("li");
        li.textContent = exercise;
        list.appendChild(li);
      });

      const checkbox = fragment.querySelector("input[type='checkbox']");
      checkbox.checked = day.done;
      checkbox.addEventListener("change", () => {
        day.done = checkbox.checked;
        savePlan();
        updateStats();
      });
      mount.appendChild(fragment);
    });
  }

  function renderWeekLabel() {
    if ($("weekLabel")) $("weekLabel").textContent = "الأسبوع " + state.week + " من 8";
    if ($("prevWeekBtn")) $("prevWeekBtn").disabled = state.week <= 1;
    if ($("nextWeekBtn")) $("nextWeekBtn").disabled = state.week >= 8;
  }

  function bindNavigation() {
    document.querySelectorAll(".nav-item").forEach(button => {
      button.addEventListener("click", () => showPanel(button.dataset.target));
    });
  }

  function bindWeekNavigation() {
    $("prevWeekBtn")?.addEventListener("click", () => {
      state.week = Math.max(1, state.week - 1);
      localStorage.setItem(STORAGE.currentWeek, String(state.week));
      renderWeekLabel();
    });
    $("nextWeekBtn")?.addEventListener("click", () => {
      state.week = Math.min(8, state.week + 1);
      localStorage.setItem(STORAGE.currentWeek, String(state.week));
      renderWeekLabel();
    });
    renderWeekLabel();
  }

  function bindDailyForm() {
    const dateInput = $("exerciseDate");
    const waterInput = $("waterInput");
    const caloriesInput = $("caloriesInput");
    const weightInput = $("weightInput");
    if (!dateInput || !waterInput || !caloriesInput || !weightInput) return;

    function loadSelectedDate() {
      const record = dailyHistory()[dateInput.value] || { water: "", calories: "", weight: "" };
      waterInput.value = record.water ?? "";
      caloriesInput.value = record.calories ?? "";
      weightInput.value = record.weight ?? "";
    }

    dateInput.value = dateKey();
    loadSelectedDate();
    dateInput.addEventListener("change", loadSelectedDate);

    $("saveDailyBtn")?.addEventListener("click", () => {
      if (!dateInput.value) {
        alert("يرجى اختيار التاريخ.");
        return;
      }
      const values = [waterInput.value, caloriesInput.value, weightInput.value];
      if (values.some(value => value !== "" && number(value, NaN) < 0)) {
        alert("يرجى إدخال قيم صحيحة غير سالبة.");
        return;
      }
      const history = dailyHistory();
      history[dateInput.value] = {
        date: dateInput.value,
        water: number(waterInput.value),
        calories: number(caloriesInput.value),
        weight: weightInput.value === "" ? "" : number(weightInput.value)
      };
      write(STORAGE.daily, history);
      updateStats();
      alert("تم حفظ مؤشرات اليوم بنجاح.");
    });

    $("exportBtn")?.addEventListener("click", exportData);
  }

  function bindHabits() {
    const ids = ["habitSleep", "habitWater", "habitProtein", "habitStretch"];
    const key = dateKey();
    const history = habitHistory();
    const today = history[key] || {};

    ids.forEach(id => {
      const input = $(id);
      if (!input) return;
      input.checked = Boolean(today[id]);
      input.addEventListener("change", () => {
        const updated = habitHistory();
        updated[key] = { ...(updated[key] || {}), [id]: input.checked };
        write(STORAGE.habits, updated);
      });
    });
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      plan: state.plan,
      dailyHistory: dailyHistory(),
      habitHistory: habitHistory(),
      currentWeek: state.week
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fitplan-backup-" + dateKey() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bindReset() {
    $("resetBtn")?.addEventListener("click", () => {
      if (!confirm("سيتم حذف الخطة والسجلات والعادات المحفوظة على هذا الجهاز. هل تريد المتابعة؟")) return;
      Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
      state.plan = cloneDefaultPlan();
      state.week = 1;
      render();
      bindHabits();
      alert("تمت إعادة ضبط البيانات.");
    });
  }

  function render() {
    renderWeekGrid();
    renderWeekLabel();
    updateStats();
  }

  function init() {
    bindNavigation();
    bindWeekNavigation();
    bindDailyForm();
    bindHabits();
    bindReset();
    $("saveAllBtn")?.addEventListener("click", () => {
      savePlan();
      alert("تم حفظ التقدم بنجاح.");
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();

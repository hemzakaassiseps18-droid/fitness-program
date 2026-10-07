const defaultPlan = [
  {
    day: "الاثنين",
    type: "قوة",
    exercises: [
      "تمارين القوة A: 3×10-12",
      "Push-ups أو الجدار: 3×8-12",
      "Squats: 3×12-15",
      "Plank: 3×20-30 ثانية"
    ]
  },
  {
    day: "الثلاثاء",
    type: "كارديو",
    exercises: [
      "مشي سريع: 30 دقيقة",
      "تمديد الظهر: 2×30 ثانية",
      "تمديد الساقين: 2×30 ثانية"
    ]
  },
  {
    day: "الأربعاء",
    type: "راحة",
    exercises: [
      "راحة أو مشي خفيف: 20-30 دقيقة",
      "تمدد خفيف: 10 دقائق",
      "استرخاء وتحكم في التنفس"
    ]
  },
  {
    day: "الخميس",
    type: "قوة",
    exercises: [
      "تمارين القوة B: 3×10-12",
      "Lunges: 3×8 لكل قدم",
      "Deadlifts خفيف: 3×10",
      "Glute bridge: 3×12"
    ]
  },
  {
    day: "الجمعة",
    type: "HIIT",
    exercises: [
      "HIIT: 20 دقيقة",
      "Jumping jacks: 30s / 30s راحة",
      "Mountain climbers: 30s / 30s راحة",
      "Squat jumps: 30s / 30s راحة"
    ]
  },
  {
    day: "السبت",
    type: "جسم كامل",
    exercises: [
      "تمارين كاملة الجسم: 3 دورات",
      "Squats: 12",
      "Push-ups: 8-12",
      "Lunges: 8/قدم",
      "Plank: 20-30 ثانية"
    ]
  },
  {
    day: "الأحد",
    type: "استعادة",
    exercises: [
      "راحة كاملة",
      "تمدد خفيف 10 دقيقة",
      "نوم 7-8 ساعات"
    ]
  }
];

const storageKey = "fitplan-pro-data";

const appState = {
  plan: loadPlan(),
  selectedTarget: "dashboard"
};

function loadPlan() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return defaultPlan.map((day) => ({ ...day, done: false }));
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed.length ? parsed : defaultPlan.map((day) => ({ ...day, done: false }));
  } catch {
    return defaultPlan.map((day) => ({ ...day, done: false }));
  }
}

function savePlan() {
  localStorage.setItem(storageKey, JSON.stringify(appState.plan));
}

function updateStats() {
  const total = appState.plan.length;
  const done = appState.plan.filter((day) => day.done).length;
  const commitment = total ? Math.round((done / total) * 100) : 0;

  const daily = JSON.parse(localStorage.getItem("fitplan-daily") || "{}") || {};
  const water = Number(daily.water || 0);
  const calories = Number(daily.calories || 0);

  document.getElementById("completedCount").textContent = done;
  document.getElementById("commitmentRate").textContent = `${commitment}%`;
  document.getElementById("waterState").textContent = `${water}L`;
  document.getElementById("caloriesState").textContent = calories;

  const ring = document.getElementById("ringProgress");
  const percentText = document.getElementById("ringPercent");
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (commitment / 100) * circumference;

  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = offset;
  ring.style.stroke = "url(#ringGradient)";
  percentText.textContent = `${commitment}%`;
}

function renderWeekGrid() {
  const mount = document.getElementById("weekGrid");
  const template = document.getElementById("dayTemplate");

  mount.innerHTML = "";

  appState.plan.forEach((day) => {
    const copy = template.content.cloneNode(true);
    const card = copy.querySelector(".day-card");
    const title = copy.querySelector("h4");
    const tag = copy.querySelector(".tag");
    const list = copy.querySelector(".exercise-list");
    const checkbox = copy.querySelector("input[type='checkbox']");

    title.textContent = day.day;
    tag.textContent = day.type;
    day.exercises.forEach((exercise) => {
      const li = document.createElement("li");
      li.textContent = exercise;
      list.appendChild(li);
    });

    checkbox.checked = !!day.done;
    checkbox.addEventListener("change", (event) => {
      day.done = event.target.checked;
      savePlan();
      updateStats();
    });

    mount.appendChild(copy);
  });
}

function bindNav() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      document.querySelectorAll(".nav-item").forEach((button) => button.classList.remove("active"));
      item.classList.add("active");

      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.add("hidden-panel");
        panel.classList.remove("active-panel");
      });

      const selected = document.getElementById(target);
      selected.classList.remove("hidden-panel");
      selected.classList.add("active-panel");
    });
  });
}

function bindDailyForm() {
  const dateInput = document.getElementById("exerciseDate");
  const waterInput = document.getElementById("waterInput");
  const caloriesInput = document.getElementById("caloriesInput");
  const weightInput = document.getElementById("weightInput");
  const saveBtn = document.getElementById("saveDailyBtn");
  const exportBtn = document.getElementById("exportBtn");

  dateInput.valueAsDate = new Date();

  const saved = JSON.parse(localStorage.getItem("fitplan-daily") || "{}");
  waterInput.value = saved.water || 2.5;
  caloriesInput.value = saved.calories || 1800;
  weightInput.value = saved.weight || "";

  saveBtn.addEventListener("click", () => {
    const payload = {
      date: dateInput.value,
      water: Number(waterInput.value || 0),
      calories: Number(caloriesInput.value || 0),
      weight: Number(weightInput.value || 0)
    };

    localStorage.setItem("fitplan-daily", JSON.stringify(payload));
    updateStats();
    alert("تم حفظ مؤشرات اليوم بنجاح.");
  });

  exportBtn.addEventListener("click", () => {
    const payload = JSON.parse(localStorage.getItem("fitplan-daily") || "{}");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fitplan-daily-report.json";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function bindHabits() {
  const habits = ["habitSleep", "habitWater", "habitProtein", "habitStretch"];
  habits.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("change", () => {
      const saved = JSON.parse(localStorage.getItem("fitplan-habits") || "{}");
      saved[id] = input.checked;
      localStorage.setItem("fitplan-habits", JSON.stringify(saved));
    });
  });

  const savedHabits = JSON.parse(localStorage.getItem("fitplan-habits") || "{}");
  habits.forEach((id) => {
    const input = document.getElementById(id);
    input.checked = !!savedHabits[id];
  });
}

function bindReset() {
  document.getElementById("resetBtn").addEventListener("click", () => {
    const confirmed = confirm("هل تريد إعادة ضبط كل البيانات؟");
    if (!confirmed) return;

    appState.plan = defaultPlan.map((day) => ({ ...day, done: false }));
    localStorage.removeItem(storageKey);
    localStorage.removeItem("fitplan-daily");
    localStorage.removeItem("fitplan-habits");
    savePlan();
    render();
  });
}

function bindSaveAll() {
  document.getElementById("saveAllBtn").addEventListener("click", () => {
    savePlan();
    alert("تم حفظ التقدم الخاص بك بنجاح.");
  });
}

function render() {
  renderWeekGrid();
  updateStats();
  bindDailyForm();
  bindHabits();
}

function addRingGradient() {
  const svg = document.querySelector(".ring-svg");
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38d39f" />
      <stop offset="100%" stop-color="#7dd3fc" />
    </linearGradient>
  `;
  svg.prepend(defs);
}

function init() {
  addRingGradient();
  render();
  bindNav();
  bindReset();
  bindSaveAll();
  bindHabits();
}

init();

const defaultPlan = [
  {
    day: "الاثنين",
    type: "قوة",
    exercises: [
      "تمارين القوة A: 3×10-12",
      "Push-ups أو الجدار: 3×8-12",
      "Squats: 3×12-15",
      "Plank: 3×20-30 ثانية",
    ],
    done: false,
  },
  {
    day: "الثلاثاء",
    type: "كارديو",
    exercises: [
      "مشي سريع: 30 دقيقة",
      "تمديد الظهر: 2×30 ثانية",
      "تمديد الساقين: 2×30 ثانية",
    ],
    done: false,
  },
  {
    day: "الأربعاء",
    type: "راحة",
    exercises: [
      "راحة أو مشي خفيف: 20-30 دقيقة",
      "تمدد خفيف: 10 دقائق",
      "استرخاء وتحكم في التنفس",
    ],
    done: false,
  },
  {
    day: "الخميس",
    type: "قوة",
    exercises: [
      "تمارين القوة B: 3×10-12",
      "Lunges: 3×8 لكل قدم",
      "Deadlifts خفيف: 3×10",
      "Glute bridge: 3×12",
    ],
    done: false,
  },
  {
    day: "الجمعة",
    type: "HIIT",
    exercises: [
      "HIIT: 20 دقيقة",
      "Jumping jacks: 30s / 30s راحة",
      "Mountain climbers: 30s / 30s راحة",
      "Squat jumps: 30s / 30s راحة",
    ],
    done: false,
  },
  {
    day: "السبت",
    type: "جسم كامل",
    exercises: [
      "تمارين كاملة الجسم: 3 دورات",
      "Squats: 12",
      "Push-ups: 8-12",
      "Lunges: 8/قدم",
      "Plank: 20-30 ثانية",
    ],
    done: false,
  },
  {
    day: "الأحد",
    type: "استعادة",
    exercises: [
      "راحة كاملة",
      "تمدد خفيف 10 دقيقة",
      "نوم 7-8 ساعات",
    ],
    done: false,
  },
];

const STORAGE = {
  users: "fitplan_users",
  currentUser: "fitplan_current_user",
  plan: "fitplan_plan",
  daily: "fitplan_daily",
  habits: "fitplan_habits",
};

const appState = {
  plan: loadPlan(),
};

const authState = {
  mode: "login",
};

function getUsers() {
  const saved = localStorage.getItem(STORAGE.users);
  return saved ? JSON.parse(saved) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

function loadPlan() {
  const saved = localStorage.getItem(STORAGE.plan);
  if (!saved) return [...defaultPlan];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : [...defaultPlan];
  } catch {
    return [...defaultPlan];
  }
}

function savePlan() {
  localStorage.setItem(STORAGE.plan, JSON.stringify(appState.plan));
}

function showAuthMessage(message, isSuccess = false) {
  const element = document.getElementById("authMessage");
  element.textContent = message;
  element.classList.toggle("success", isSuccess);
}

function bindAuthModeToggle() {
  const toggleButton = document.getElementById("toggleAuthMode");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const submitButton = document.getElementById("submitButton");
  const signupFields = document.getElementById("signupFields");
  const rememberRow = document.getElementById("rememberRow");
  const switchText = document.getElementById("switchText");

  toggleButton.addEventListener("click", () => {
    authState.mode = authState.mode === "login" ? "signup" : "login";
    const isSignup = authState.mode === "signup";

    signupFields.classList.toggle("hidden", !isSignup);
    rememberRow.classList.toggle("hidden", isSignup);
    authTitle.textContent = isSignup ? "إنشاء حساب جديد" : "تسجيل الدخول";
    authSubtitle.textContent = isSignup
      ? "ابدأ رحلتك نحو اللياقة مع خطة مخصصة."
      : "مرحباً بعودتك! تابع تقدمك اليومي.";
    submitButton.textContent = isSignup ? "إنشاء الحساب" : "دخول";
    switchText.textContent = isSignup ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟";
    toggleButton.textContent = isSignup ? "تسجيل الدخول" : "إنشاء حساب جديد";
  });
}

function showApp() {
  const authScreen = document.getElementById("authScreen");
  const appScreen = document.getElementById("appScreen");
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  const user = JSON.parse(localStorage.getItem(STORAGE.currentUser) || "null");
  if (user) {
    document.getElementById("welcomeTitle").textContent = `مرحباً، ${user.firstName || user.fullName || "مستخدم"}`;
  }
}

function logout() {
  localStorage.removeItem(STORAGE.currentUser);
  document.getElementById("appScreen").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("authForm").reset();
  showAuthMessage("تم تسجيل الخروج بنجاح.");
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showAuthMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
    return;
  }

  const users = getUsers();

  if (authState.mode === "login") {
    const user = users.find((item) => item.email === email && item.password === password);
    if (!user) {
      showAuthMessage("بيانات الدخول غير صحيحة. حاول مرة أخرى.");
      return;
    }

    localStorage.setItem(STORAGE.currentUser, JSON.stringify(user));
    showAuthMessage("تم تسجيل الدخول بنجاح.", true);
    setTimeout(showApp, 450);
    return;
  }

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();

  if (!firstName || !lastName) {
    showAuthMessage("يرجى إدخال الاسم الأول والأخير.");
    return;
  }

  const exists = users.some((item) => item.email === email);
  if (exists) {
    showAuthMessage("هذا البريد الإلكتروني مسجل بالفعل.");
    return;
  }

  const newUser = {
    email,
    password,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
  };

  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(STORAGE.currentUser, JSON.stringify(newUser));
  showAuthMessage("تم إنشاء الحساب بنجاح.", true);
  setTimeout(showApp, 450);
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
      if (selected) {
        selected.classList.remove("hidden-panel");
        selected.classList.add("active-panel");
      }
    });
  });
}

function updateStats() {
  const total = appState.plan.length;
  const done = appState.plan.filter((day) => day.done).length;
  const commitment = total ? Math.round((done / total) * 100) : 0;

  const daily = JSON.parse(localStorage.getItem(STORAGE.daily) || "{}");
  const water = Number(daily.water || 0);
  const calories = Number(daily.calories || 0);

  document.getElementById("completedCount").textContent = String(done);
  document.getElementById("commitmentRate").textContent = `${commitment}%`;
  document.getElementById("waterState").textContent = `${water}L`;
  document.getElementById("caloriesState").textContent = String(calories);

  const ring = document.getElementById("ringProgress");
  const percentText = document.getElementById("ringPercent");
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (commitment / 100) * circumference;

  ring.style.strokeDasharray = String(circumference);
  ring.style.strokeDashoffset = String(offset);
  percentText.textContent = `${commitment}%`;
}

function renderWeekGrid() {
  const mount = document.getElementById("weekGrid");
  const template = document.getElementById("dayTemplate");
  mount.innerHTML = "";

  appState.plan.forEach((day) => {
    const copy = template.content.cloneNode(true);
    const title = copy.querySelector("h4");
    const tag = copy.querySelector(".tag");
    const list = copy.querySelector(".exercise-list");
    const checkbox = copy.querySelector("input[type='checkbox']");

    title.textContent = day.day;
    tag.textContent = day.type;
    day.exercises.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
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

function bindSaveAll() {
  document.getElementById("saveAllBtn").addEventListener("click", () => {
    savePlan();
    alert("تم حفظ التقدم الخاص بك بنجاح.");
  });
}

function bindReset() {
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("nextWeekBtn").addEventListener("click", () => {
    appState.plan = appState.plan.map((day) => ({ ...day, done: !day.done }));
    savePlan();
    render();
  });
}

function bindHabits() {
  const habits = ["habitSleep", "habitWater", "habitProtein", "habitStretch"];
  habits.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("change", () => {
      const saved = JSON.parse(localStorage.getItem(STORAGE.habits) || "{}");
      saved[id] = input.checked;
      localStorage.setItem(STORAGE.habits, JSON.stringify(saved));
    });
  });

  const savedHabits = JSON.parse(localStorage.getItem(STORAGE.habits) || "{}");
  habits.forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.checked = !!savedHabits[id];
  });
}

function render() {
  renderWeekGrid();
  updateStats();
  bindHabits();
}

function initDefaults() {
  if (!localStorage.getItem(STORAGE.users)) {
    saveUsers([
      {
        email: "admin@fitplan.com",
        password: "123456",
        firstName: "أحمد",
        lastName: "محمد",
        fullName: "أحمد محمد",
      },
    ]);
  }

  const currentUser = JSON.parse(localStorage.getItem(STORAGE.currentUser) || "null");
  if (currentUser) {
    showApp();
  }
}

function init() {
  initDefaults();
  bindAuthModeToggle();
  bindNav();
  bindSaveAll();
  bindReset();
  render();

  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
}

init();

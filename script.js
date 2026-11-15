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


  const EXERCISES = [
    {id:"pushup",name:"تمرين الضغط",muscle:"الصدر",equipment:"وزن الجسم",level:"مبتدئ"},
    {id:"bench",name:"ضغط الصدر بالدمبل",muscle:"الصدر",equipment:"دمبل",level:"متوسط"},
    {id:"row",name:"سحب الدمبل",muscle:"الظهر",equipment:"دمبل",level:"مبتدئ"},
    {id:"latpull",name:"السحب العلوي",muscle:"الظهر",equipment:"آلة",level:"مبتدئ"},
    {id:"squat",name:"القرفصاء",muscle:"الأرجل",equipment:"وزن الجسم",level:"مبتدئ"},
    {id:"lunge",name:"اندفاع أمامي",muscle:"الأرجل",equipment:"وزن الجسم",level:"مبتدئ"},
    {id:"rdl",name:"رفعة رومانية",muscle:"الأرجل",equipment:"دمبل",level:"متوسط"},
    {id:"shoulder",name:"ضغط الكتف",muscle:"الأكتاف",equipment:"دمبل",level:"متوسط"},
    {id:"lateral",name:"رفع جانبي",muscle:"الأكتاف",equipment:"دمبل",level:"مبتدئ"},
    {id:"curl",name:"ثني الذراع",muscle:"الذراعان",equipment:"دمبل",level:"مبتدئ"},
    {id:"triceps",name:"مد الذراع للخلف",muscle:"الذراعان",equipment:"دمبل",level:"مبتدئ"},
    {id:"plank",name:"بلانك",muscle:"البطن",equipment:"وزن الجسم",level:"مبتدئ"},
    {id:"deadbug",name:"Dead Bug",muscle:"البطن",equipment:"وزن الجسم",level:"مبتدئ"},
    {id:"walk",name:"مشي سريع",muscle:"القلب والتنفس",equipment:"بدون معدات",level:"مبتدئ"},
    {id:"bike",name:"دراجة ثابتة",muscle:"القلب والتنفس",equipment:"دراجة",level:"مبتدئ"}
  ];
  const BUILDER_STORAGE = "k6-studio-programs";
  let builderExercises = [];
  let savedPrograms = read(BUILDER_STORAGE, []);
  if (!Array.isArray(savedPrograms)) savedPrograms = [];

  function renderExerciseLibrary() {
    const mount = $("exerciseLibraryGrid");
    if (!mount) return;
    const query = ($("exerciseSearch")?.value || "").trim().toLocaleLowerCase();
    const muscle = $("muscleFilter")?.value || "";
    const matches = EXERCISES.filter(item =>
      (!muscle || item.muscle === muscle) &&
      (!query || (item.name + " " + item.muscle + " " + item.equipment).toLocaleLowerCase().includes(query))
    );
    mount.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "لا توجد تمارين مطابقة لبحثك."; mount.appendChild(empty); return;
    }
    matches.forEach(item => {
      const card = document.createElement("article"); card.className = "exercise-card";
      const title = document.createElement("h4"); title.textContent = item.name;
      const meta = document.createElement("p"); meta.textContent = item.muscle + " · " + item.equipment;
      const level = document.createElement("span"); level.className = "tag"; level.textContent = item.level;
      card.append(title, meta, level); mount.appendChild(card);
    });
  }

  function renderBuilderSelect() {
    const select = $("builderExercise");
    if (!select) return;
    select.replaceChildren();
    EXERCISES.forEach(item => {
      const option = document.createElement("option"); option.value = item.id; option.textContent = item.name + " — " + item.muscle; select.appendChild(option);
    });
  }

  function renderBuilderExercises() {
    const mount = $("builderExerciseList");
    if (!mount) return;
    mount.replaceChildren();
    $("builderExerciseCount").textContent = builderExercises.length + " تمارين";
    if (!builderExercises.length) {
      const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "لم تضف تمارين بعد. اختر تمريناً من القائمة أعلاه."; mount.appendChild(empty); return;
    }
    builderExercises.forEach((item, index) => {
      const row = document.createElement("article"); row.className = "builder-exercise-row";
      const info = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = item.name;
      const detail = document.createElement("p"); detail.textContent = item.sets + " مجموعات × " + item.reps + " · راحة " + item.rest + " ثانية";
      info.append(name, detail);
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "btn btn-ghost remove-exercise"; remove.textContent = "حذف";
      remove.setAttribute("aria-label", "حذف " + item.name);
      remove.addEventListener("click", () => { builderExercises.splice(index, 1); renderBuilderExercises(); });
      row.append(info, remove); mount.appendChild(row);
    });
  }

  function renderSavedPrograms() {
    const mount = $("savedProgramsList");
    if (!mount) return;
    mount.replaceChildren();
    if (!savedPrograms.length) {
      const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "لا توجد برامج محفوظة بعد."; mount.appendChild(empty); return;
    }
    savedPrograms.forEach((program, index) => {
      const row = document.createElement("article"); row.className = "saved-program-row";
      const info = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = program.name;
      const meta = document.createElement("p"); meta.textContent = program.duration + " أسابيع · " + program.sessions + " حصص أسبوعياً · " + program.exercises.length + " تمارين";
      info.append(name, meta);
      const actions = document.createElement("div"); actions.className = "saved-program-actions";
      const loadBtn = document.createElement("button"); loadBtn.type = "button"; loadBtn.className = "btn btn-soft"; loadBtn.textContent = "فتح";
      loadBtn.addEventListener("click", () => {
        $("programName").value = program.name; $("programDuration").value = String(program.duration); $("sessionsPerWeek").value = String(program.sessions);
        builderExercises = program.exercises.map(item => ({...item})); renderBuilderExercises();
      });
      const deleteBtn = document.createElement("button"); deleteBtn.type = "button"; deleteBtn.className = "btn btn-ghost"; deleteBtn.textContent = "حذف";
      deleteBtn.addEventListener("click", () => {
        if (!confirm("هل تريد حذف هذا البرنامج المحفوظ؟")) return;
        savedPrograms.splice(index, 1); write(BUILDER_STORAGE, savedPrograms); renderSavedPrograms();
      });
      actions.append(loadBtn, deleteBtn); row.append(info, actions); mount.appendChild(row);
    });
  }

  function buildProgramPayload() {
    const name = ($("programName")?.value || "").trim();
    if (!name) { alert("يرجى كتابة اسم البرنامج."); return null; }
    if (!builderExercises.length) { alert("أضف تمريناً واحداً على الأقل قبل الحفظ."); return null; }
    return {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      name, duration: number($("programDuration").value, 8),
      sessions: number($("sessionsPerWeek").value, 3),
      exercises: builderExercises.map(item => ({...item})),
      updatedAt: new Date().toISOString()
    };
  }

  function bindProgramBuilder() {
    if (!$("builderExercise")) return;
    renderBuilderSelect(); renderExerciseLibrary(); renderBuilderExercises(); renderSavedPrograms();
    $("exerciseSearch")?.addEventListener("input", renderExerciseLibrary);
    $("muscleFilter")?.addEventListener("change", renderExerciseLibrary);
    $("addBuilderExercise")?.addEventListener("click", () => {
      const exercise = EXERCISES.find(item => item.id === $("builderExercise").value);
      const sets = number($("builderSets").value, NaN);
      const rest = number($("builderRest").value, NaN);
      const reps = ($("builderReps").value || "").trim();
      if (!exercise || !Number.isInteger(sets) || sets < 1 || sets > 20 || !Number.isInteger(rest) || rest < 0 || rest > 900 || !reps) {
        alert("تحقق من التمرين والمجموعات والتكرارات ومدة الراحة."); return;
      }
      builderExercises.push({ ...exercise, sets, reps, rest });
      renderBuilderExercises();
    });
    $("saveProgramBtn")?.addEventListener("click", () => {
      const program = buildProgramPayload(); if (!program) return;
      const existing = savedPrograms.findIndex(item => item.name.toLocaleLowerCase() === program.name.toLocaleLowerCase());
      if (existing >= 0) {
        if (!confirm("يوجد برنامج بالاسم نفسه. هل تريد استبداله؟")) return;
        savedPrograms[existing] = program;
      } else savedPrograms.push(program);
      write(BUILDER_STORAGE, savedPrograms); renderSavedPrograms();
      alert("تم حفظ البرنامج على هذا الجهاز.");
    });
    $("exportProgramBtn")?.addEventListener("click", () => {
      const program = buildProgramPayload(); if (!program) return;
      const blob = new Blob([JSON.stringify(program, null, 2)], {type:"application/json;charset=utf-8"});
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = "k6-program-" + dateKey() + ".json";
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    });
  }


  const CLIENT_STORAGE="k6-studio-clients", COACH_STORAGE="k6-studio-coach";
  let builderSessions=[], clients=read(CLIENT_STORAGE,[]), coachProfile=read(COACH_STORAGE,{}), editingClientId=null;
  if(!Array.isArray(clients))clients=[];
  const safeUrl=v=>{try{const u=new URL(String(v||"").trim());return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}};
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function flatExercises(){return builderSessions.flatMap(s=>s.exercises);}
  function repsPlus(value,n){const m=String(value).match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);if(!m)return value;const a=+m[1]+n,b=+(m[2]||m[1])+n;return a===b?String(a):a+"-"+b;}
  function makeWeeks(duration,sessions){
    return Array.from({length:duration},(_,i)=>{
      const w=i+1;let phase="تأسيس وتعلم الأداء",sd=0,rd=0,deload=false,hint="اختر حملاً يسمح بأداء التكرارات بتقنية سليمة واترك 2-3 تكرارات احتياطية.";
      if(duration===4){if(w===2){phase="زيادة التكرارات";rd=1;}if(w===3){phase="زيادة الحجم التدريبي";rd=1;sd=1;}if(w===4){phase="تخفيف واستشفاء";sd=-1;deload=true;hint="خفّض الحجم بنحو 30% واستعد للمرحلة التالية.";}}
      else if(duration===8){if(w===2){phase="زيادة التكرارات";rd=1;}if(w===3){phase="زيادة الحجم";rd=1;sd=1;}if(w===4){phase="أسبوع تخفيف";sd=-1;deload=true;hint="خفّض الحجم 25-35%."; }if(w===5){phase="بناء المرحلة الثانية";hint="إذا أكملت الحد الأعلى بتقنية جيدة، زد الحمل تدريجياً 2-5%."; }if(w===6){phase="تقدم التكرارات";rd=1;}if(w===7){phase="أسبوع أداء مرتفع";rd=1;hint="اترك 1-2 تكرار احتياطي ولا تتدرب حتى الفشل."; }if(w===8){phase="استشفاء وتقييم";sd=-1;deload=true;hint="خفّض الحجم 30-40% وقيّم التقدم.";}}
      else{if(w===2||w===3){phase="تراكم تدريجي";rd=w-1;}if(w===4||w===8||w===12){phase="أسبوع تخفيف وتقييم";sd=-1;deload=true;hint="خفّض الحجم 30-40% مع المحافظة على التقنية."; }if(w>=5&&w<=7){phase="بناء القوة والحجم";if(w===7)sd=1;hint="عند بلوغ أعلى التكرارات بسهولة، زد الحمل 2-5%."; }if(w>=9&&w<=11){phase="تثبيت الأداء";rd=w-8;hint="حافظ على جودة الحركة واترك 1-2 تكرار احتياطي.";}}
      const loadFactor=duration===4?(w===2?1.02:w===3?1.05:w===4?0.9:1):duration===8?(w===5?1.025:w===6?1.04:w===7?1.06:w===8?0.9:1):(w===5?1.02:w===6?1.04:w===7?1.05:w===9?1.03:w===10?1.05:w===11?1.07:(w===4||w===8||w===12)?0.9:1);return {week:w,phase,deload,hint,sessions:sessions.map(s=>({day:s.day,name:s.name,exercises:s.exercises.map(e=>({...e,sets:Math.max(1,e.sets+sd),reps:repsPlus(e.reps,rd),loadKg:e.loadKg===null||e.loadKg===undefined?null:Math.round(e.loadKg*loadFactor*2)/2,note:deload?"تخفيف":(sd||rd||loadFactor!==1?"تقدم تدريجي":"الحمل المناسب")}))}))};
    });
  }
  function renderProgression(){
    const select=$("progressionWeek"),mount=$("progressionPreview");if(!select||!mount)return;
    const duration=number($("programDuration").value,8),old=number(select.value,1);select.replaceChildren();
    for(let n=1;n<=duration;n++){const o=document.createElement("option");o.value=n;o.textContent="الأسبوع "+n;select.appendChild(o);}select.value=String(Math.min(duration,old));
    const w=makeWeeks(duration,builderSessions)[+select.value-1];mount.replaceChildren();
    if(!builderSessions.length){const p=document.createElement("p");p.className="empty-state";p.textContent="أضف حصصاً وتمارين لعرض التدرج.";mount.appendChild(p);return;}
    const p=document.createElement("p");p.textContent=w.phase+" — "+w.hint;mount.appendChild(p);
    w.sessions.forEach(s=>{const line=document.createElement("p");line.className="progression-line";line.textContent=s.day+" / "+s.name+": "+s.exercises.map(e=>e.name+" ("+e.sets+"×"+e.reps+(e.loadKg!==null&&e.loadKg!==undefined?"، "+e.loadKg+" كغ":"")+")").join("، ");mount.appendChild(line);});
  }
  function renderBuilderExercises(){
    const mount=$("builderExerciseList");if(!mount)return;mount.replaceChildren();
    $("builderExerciseCount").textContent=flatExercises().length+" تمارين · "+builderSessions.length+" حصص";
    if(!builderSessions.length){const p=document.createElement("p");p.className="empty-state";p.textContent="حدد يوم الحصة وأضف التمارين.";mount.appendChild(p);}
    builderSessions.forEach((s,si)=>{
      const box=document.createElement("section");box.className="builder-session";const head=document.createElement("div");head.className="builder-session-head";
      const title=document.createElement("strong");title.textContent=s.day+" — "+s.name;const removeSession=document.createElement("button");removeSession.className="btn btn-ghost";removeSession.type="button";removeSession.textContent="حذف الحصة";removeSession.onclick=()=>{builderSessions.splice(si,1);renderBuilderExercises();};head.append(title,removeSession);box.appendChild(head);
      s.exercises.forEach((e,ei)=>{const row=document.createElement("article");row.className="builder-exercise-row";const info=document.createElement("div");const name=document.createElement("strong");name.textContent=e.name;const details=document.createElement("p");details.textContent=e.sets+" مجموعات × "+e.reps+" · راحة "+e.rest+" ثانية";info.append(name,details);
        if(e.imageUrl){const img=document.createElement("img");img.src=e.imageUrl;img.alt=e.name;img.className="exercise-thumb";img.onerror=()=>img.remove();info.appendChild(img);}
        if(e.videoUrl){const a=document.createElement("a");a.href=e.videoUrl;a.target="_blank";a.rel="noopener noreferrer";a.textContent="مشاهدة الفيديو";a.className="media-link";info.appendChild(a);}
        const del=document.createElement("button");del.className="btn btn-ghost";del.type="button";del.textContent="حذف";del.onclick=()=>{s.exercises.splice(ei,1);if(!s.exercises.length)builderSessions.splice(si,1);renderBuilderExercises();};row.append(info,del);box.appendChild(row);});mount.appendChild(box);
    });renderProgression();
  }
  function payload(){
    const name=$("programName").value.trim();if(!name){alert("يرجى كتابة اسم البرنامج.");return null;}if(!flatExercises().length){alert("أضف تمارين إلى الحصص أولاً.");return null;}
    const duration=number($("programDuration").value,8);return {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,duration,sessionsPerWeek:number($("sessionsPerWeek").value,3),sessions:builderSessions.map(s=>({...s,exercises:s.exercises.map(e=>({...e}))})),weeks:makeWeeks(duration,builderSessions),updatedAt:new Date().toISOString()};
  }
  function downloadJSON(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function printProgram(program,client){
    const win=window.open("","_blank");if(!win){alert("اسمح بالنوافذ المنبثقة لإعداد ملف PDF.");return;}
    const sessions=program.sessions||[{day:"الاثنين",name:"الحصة",exercises:program.exercises||[]}],weeks=program.weeks||makeWeeks(program.duration||8,sessions);
    const weekHtml=weeks.map(w=>'<section class="week"><h2>الأسبوع '+w.week+' — '+esc(w.phase)+'</h2><p>'+esc(w.hint)+'</p>'+w.sessions.map(s=>'<h3>'+esc(s.day)+' · '+esc(s.name)+'</h3><table><tr><th>التمرين</th><th>المجموعات</th><th>التكرارات</th><th>الراحة</th></tr>'+s.exercises.map(e=>'<tr><td>'+esc(e.name)+(e.imageUrl?'<br><img class="eximg" src="'+esc(e.imageUrl)+'">':"")+(e.videoUrl?'<br><a href="'+esc(e.videoUrl)+'">فيديو التمرين</a>':"")+'</td><td>'+e.sets+'</td><td>'+esc(e.reps)+'</td><td>'+e.rest+' ث'+(e.loadKg!==null&&e.loadKg!==undefined?'<br>'+e.loadKg+' كغ':'')+'</td></tr>').join("")+'</table>').join("")+'</section>').join("");
    const logo=coachProfile.logo?'<img class="logo" src="'+coachProfile.logo+'">':"";
    const page='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>'+esc(program.name)+'</title><style>@page{size:A4;margin:13mm}body{font-family:Arial,sans-serif;color:#18252d;line-height:1.55}header{display:flex;align-items:center;gap:15px;border-bottom:3px solid #178b68;padding-bottom:12px;margin-bottom:18px}.logo{max-width:85px;max-height:75px}h1,h2{color:#12684f}h2{font-size:17px;border-bottom:1px solid #bdd8ce;padding-bottom:5px}h3{font-size:14px;margin:14px 0 5px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5dc;padding:6px;text-align:right}th{background:#eaf4f0}.week{page-break-inside:avoid;margin-bottom:20px}.eximg{max-width:65px;max-height:55px}small{color:#586772}@media print{a{color:#12684f}}</style><body><header>'+logo+'<div><h1>'+esc(coachProfile.name||"K6 Trainer Studio")+'</h1><small>'+esc(coachProfile.phone||"")+' · '+esc(coachProfile.email||"")+'</small></div></header><h1>'+esc(program.name)+'</h1><p>المدة: '+program.duration+' أسابيع · الحصص: '+(program.sessionsPerWeek||sessions.length)+' أسبوعياً</p>'+(client?'<p>المتدرب: '+esc(client.name)+' · الهدف: '+esc(client.goal)+'</p>':"")+weekHtml+'<script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>';
    win.document.open();win.document.write(page);win.document.close();
  }
  function renderSavedPrograms(){
    const mount=$("savedProgramsList");if(!mount)return;mount.replaceChildren();
    savedPrograms.forEach((p,i)=>{const row=document.createElement("article");row.className="saved-program-row";const info=document.createElement("div"),name=document.createElement("strong"),meta=document.createElement("p");name.textContent=p.name;const sessionCount=Array.isArray(p.sessions)?p.sessions.length:(p.sessionsPerWeek||p.sessions||3),exerciseCount=Array.isArray(p.sessions)?p.sessions.reduce((n,s)=>n+(s.exercises||[]).length,0):(p.exercises?.length||0);meta.textContent=(p.duration||8)+" أسابيع · "+sessionCount+" حصص · "+exerciseCount+" تمارين";info.append(name,meta);
      const actions=document.createElement("div");actions.className="saved-program-actions";const open=document.createElement("button");open.className="btn btn-soft";open.textContent="فتح";open.onclick=()=>{ $("programName").value=p.name;$("programDuration").value=p.duration||8;$("sessionsPerWeek").value=p.sessionsPerWeek||3;builderSessions=Array.isArray(p.sessions)?p.sessions.map(s=>({...s,exercises:(s.exercises||[]).map(e=>({...e}))})): [{day:"الاثنين",name:"الحصة 1",exercises:(p.exercises||[]).map(e=>({...e}))}];renderBuilderExercises();showPanel("builder");};
      const pdf=document.createElement("button");pdf.className="btn btn-ghost";pdf.textContent="PDF";pdf.onclick=()=>printProgram(p);
      const del=document.createElement("button");del.className="btn btn-ghost";del.textContent="حذف";del.onclick=()=>{if(confirm("حذف البرنامج؟")){savedPrograms.splice(i,1);write(BUILDER_STORAGE,savedPrograms);renderSavedPrograms();renderClientProgramOptions();}};
      actions.append(open,pdf,del);row.append(info,actions);mount.appendChild(row);});
    if(!savedPrograms.length){const p=document.createElement("p");p.className="empty-state";p.textContent="لا توجد برامج محفوظة.";mount.appendChild(p);}renderClientProgramOptions();
  }
  function renderClientProgramOptions(){const sel=$("clientProgram");if(!sel)return;const old=sel.value;sel.replaceChildren();const empty=document.createElement("option");empty.value="";empty.textContent="بدون برنامج";sel.appendChild(empty);savedPrograms.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.name;sel.appendChild(o);});sel.value=old;}
  function resetClient(){editingClientId=null;["clientName","clientAge","clientPhone"].forEach(id=>$(id).value="");$("clientGoal").selectedIndex=0;$("clientProgram").value="";$("saveClientBtn").textContent="حفظ ملف المتدرب";}
  function renderClients(){
    const mount=$("clientsList");if(!mount)return;mount.replaceChildren();$("clientCount").textContent=clients.length+" متدربين";
    clients.forEach((c,i)=>{const row=document.createElement("article");row.className="saved-program-row";const info=document.createElement("div"),name=document.createElement("strong"),meta=document.createElement("p"),program=savedPrograms.find(p=>p.id===c.programId);name.textContent=c.name;meta.textContent="العمر: "+(c.age||"—")+" · "+(c.phone||"بدون هاتف")+" · "+c.goal+" · البرنامج: "+(program?.name||"غير مرتبط");info.append(name,meta);
      const actions=document.createElement("div");actions.className="saved-program-actions";const edit=document.createElement("button");edit.className="btn btn-soft";edit.textContent="تعديل";edit.onclick=()=>{editingClientId=c.id;$("clientName").value=c.name;$("clientAge").value=c.age||"";$("clientPhone").value=c.phone||"";$("clientGoal").value=c.goal;$("clientProgram").value=c.programId||"";$("saveClientBtn").textContent="حفظ التعديلات";};
      const pdf=document.createElement("button");pdf.className="btn btn-ghost";pdf.textContent="PDF";pdf.disabled=!program;pdf.onclick=()=>program&&printProgram(program,c);
      const del=document.createElement("button");del.className="btn btn-ghost";del.textContent="حذف";del.onclick=()=>{if(confirm("حذف ملف المتدرب؟")){clients.splice(i,1);write(CLIENT_STORAGE,clients);renderClients();}};actions.append(edit,pdf,del);row.append(info,actions);mount.appendChild(row);});
    if(!clients.length){const p=document.createElement("p");p.className="empty-state";p.textContent="لا توجد ملفات متدربين بعد.";mount.appendChild(p);}
  }
  function bindClients(){
    renderClientProgramOptions();renderClients();
    $("saveClientBtn")?.addEventListener("click",()=>{const name=$("clientName").value.trim(),age=$("clientAge").value;if(!name){alert("أدخل اسم المتدرب.");return;}if(age&&(number(age,NaN)<1||number(age,NaN)>100)){alert("تحقق من العمر.");return;}
      const c={id:editingClientId||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name,age:age?number(age):"",phone:$("clientPhone").value.trim(),goal:$("clientGoal").value,programId:$("clientProgram").value,updatedAt:new Date().toISOString()};const i=clients.findIndex(x=>x.id===c.id);if(i<0)clients.push(c);else clients[i]=c;write(CLIENT_STORAGE,clients);resetClient();renderClients();alert("تم حفظ ملف المتدرب.");});
    $("cancelClientEdit")?.addEventListener("click",resetClient);
  }
  function bindCoach(){
    $("coachName").value=coachProfile.name||"";$("coachPhone").value=coachProfile.phone||"";$("coachEmail").value=coachProfile.email||"";
    $("coachLogo")?.addEventListener("change",e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>1024*1024){alert("حجم الشعار يجب ألا يتجاوز 1 ميغابايت.");e.target.value="";return;}const reader=new FileReader();reader.onload=()=>{coachProfile.logo=reader.result;write(COACH_STORAGE,coachProfile);alert("تم حفظ الشعار.");};reader.readAsDataURL(file);});
    $("saveCoachProfile")?.addEventListener("click",()=>{coachProfile={...coachProfile,name:$("coachName").value.trim(),phone:$("coachPhone").value.trim(),email:$("coachEmail").value.trim()};write(COACH_STORAGE,coachProfile);alert("تم حفظ بيانات المدرب.");});
  }
  function bindStudioExtensions(){
    renderExerciseLibrary();renderBuilderSelect();renderBuilderExercises();renderSavedPrograms();bindCoach();bindClients();
    $("exerciseSearch")?.addEventListener("input",renderExerciseLibrary);$("muscleFilter")?.addEventListener("change",renderExerciseLibrary);
    $("addBuilderExercise")?.addEventListener("click",()=>{
      const e=EXERCISES.find(x=>x.id===$("builderExercise").value),sets=number($("builderSets").value,NaN),rest=number($("builderRest").value,NaN),reps=$("builderReps").value.trim(),imageUrl=$("builderImageUrl").value.trim(),videoUrl=$("builderVideoUrl").value.trim();
      const loadRaw=$("builderLoad").value,loadKg=loadRaw===""?null:number(loadRaw,NaN);if(!e||!Number.isInteger(sets)||sets<1||sets>20||!Number.isInteger(rest)||rest<0||rest>900||!reps||(loadKg!==null&&(!Number.isFinite(loadKg)||loadKg<0))){alert("تحقق من بيانات التمرين والحمل.");return;}if(imageUrl&&!safeUrl(imageUrl)||videoUrl&&!safeUrl(videoUrl)){alert("يجب أن تبدأ روابط الوسائط بـ http أو https.");return;}
      const day=$("builderDay").value,sessionName=$("builderSessionName").value.trim()||"الحصة "+day;let s=builderSessions.find(x=>x.day===day&&x.name===sessionName);if(!s){s={id:String(Date.now()),day,name:sessionName,exercises:[]};builderSessions.push(s);}s.exercises.push({...e,sets,reps,rest,loadKg,imageUrl:safeUrl(imageUrl),videoUrl:safeUrl(videoUrl)});$("builderLoad").value="";$("builderImageUrl").value="";$("builderVideoUrl").value="";renderBuilderExercises();
    });
    $("programDuration")?.addEventListener("change",renderProgression);$("progressionWeek")?.addEventListener("change",renderProgression);
    $("saveProgramBtn")?.addEventListener("click",()=>{const p=payload();if(!p)return;const i=savedPrograms.findIndex(x=>x.name.toLowerCase()===p.name.toLowerCase());if(i>=0){if(!confirm("استبدال البرنامج الموجود بالاسم نفسه؟"))return;p.id=savedPrograms[i].id;savedPrograms[i]=p;}else savedPrograms.push(p);write(BUILDER_STORAGE,savedPrograms);renderSavedPrograms();alert("تم حفظ البرنامج وتدرجه الأسبوعي.");});
    $("exportProgramBtn")?.addEventListener("click",()=>{const p=payload();if(p)downloadJSON(p,"k6-program-"+dateKey()+".json");});
    $("printProgramBtn")?.addEventListener("click",()=>{const p=payload();if(p)printProgram(p);});
  }

  function init() {
    bindNavigation();
    bindWeekNavigation();
    bindDailyForm();
    bindHabits();
    bindReset();
    bindStudioExtensions();
    $("saveAllBtn")?.addEventListener("click", () => {
      savePlan();
      alert("تم حفظ التقدم بنجاح.");
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();

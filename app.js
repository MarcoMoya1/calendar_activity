const STORAGE_KEY = "activity-calendar-v1";

const PRESET_ACTIVITIES = [
  { name: "GYM/WORKOUT", color: "#c45c26" },
  { name: "RAN", color: "#2f9e62" },
  { name: "WORK", color: "#2f6fbf" },
  { name: "REST DAY", color: "#7b6cc7" },
];

const CUSTOM_PALETTE = [
  "#d4a017",
  "#c23b5a",
  "#1f8a8a",
  "#8a5a2b",
  "#4d7c0f",
  "#7c3aed",
  "#0f766e",
  "#b45309",
];

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const state = {
  view: new Date(),
  selectedKey: null,
  data: loadData(),
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return {
      customActivities: Array.isArray(parsed.customActivities)
        ? parsed.customActivities
        : [],
      days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
    };
  } catch {
    return emptyData();
  }
}

function emptyData() {
  return { customActivities: [], days: {} };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function todayKey() {
  const now = new Date();
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function allActivities() {
  const customs = state.data.customActivities.map((item, index) => ({
    name: item.name,
    color: item.color || CUSTOM_PALETTE[index % CUSTOM_PALETTE.length],
  }));
  return [...PRESET_ACTIVITIES, ...customs];
}

function colorFor(name) {
  const match = allActivities().find((item) => item.name === name);
  return match ? match.color : "#6b746e";
}

function renderLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = allActivities()
    .map(
      (item) => `
        <div class="legend-item">
          <span class="swatch" style="background:${item.color}"></span>
          <span>${escapeHtml(item.name)}</span>
        </div>`
    )
    .join("");
}

function renderCalendar() {
  const year = state.view.getFullYear();
  const month = state.view.getMonth();
  document.getElementById("month-label").textContent = state.view.toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const current = todayKey();
  const cells = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(`<div class="day empty"></div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKey(year, month, day);
    const activities = state.data.days[key] || [];
    const isToday = key === current;
    const stripes = activities
      .map((name) => `<span class="stripe" style="background:${colorFor(name)}"></span>`)
      .join("");
    const chips = activities
      .map(
        (name) =>
          `<span class="chip" style="background:${colorFor(name)}">${escapeHtml(name)}</span>`
      )
      .join("");

    cells.push(`
      <button type="button" class="day${isToday ? " today" : ""}" data-date="${key}">
        <div class="day-num">
          <span>${day}</span>
          ${isToday ? `<span class="today-dot" title="Today"></span>` : ""}
        </div>
        ${activities.length ? `<div class="stripes">${stripes}</div>` : ""}
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </button>
    `);
  }

  document.getElementById("calendar").innerHTML = cells.join("");
}

function openDay(key) {
  state.selectedKey = key;
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  document.getElementById("dialog-title").textContent = `${
    WEEKDAY_LONG[date.getDay()]
  }, ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  renderActivityList();
  document.getElementById("day-dialog").showModal();
  document.getElementById("custom-activity").value = "";
}

function renderActivityList() {
  const selected = new Set(state.data.days[state.selectedKey] || []);
  document.getElementById("activity-list").innerHTML = allActivities()
    .map((item) => {
      const on = selected.has(item.name);
      return `
        <button
          type="button"
          class="activity-toggle${on ? " selected" : ""}"
          data-activity="${escapeAttr(item.name)}"
          style="color:${item.color}"
        >
          <span class="dot" style="background:${item.color}"></span>
          <span>${escapeHtml(item.name)}</span>
        </button>`;
    })
    .join("");
}

function toggleActivity(name) {
  const key = state.selectedKey;
  const current = new Set(state.data.days[key] || []);
  if (current.has(name)) current.delete(name);
  else current.add(name);
  const next = [...current];
  if (next.length) state.data.days[key] = next;
  else delete state.data.days[key];
  saveData();
  renderActivityList();
  renderCalendar();
}

function addCustomActivity() {
  const input = document.getElementById("custom-activity");
  const name = input.value.trim().toUpperCase();
  if (!name) return;
  const exists = allActivities().some((item) => item.name === name);
  if (!exists) {
    state.data.customActivities.push({
      name,
      color: CUSTOM_PALETTE[state.data.customActivities.length % CUSTOM_PALETTE.length],
    });
  }
  const selected = new Set(state.data.days[state.selectedKey] || []);
  selected.add(name);
  state.data.days[state.selectedKey] = [...selected];
  saveData();
  input.value = "";
  renderLegend();
  renderActivityList();
  renderCalendar();
}

function clearDay() {
  if (!state.selectedKey) return;
  delete state.data.days[state.selectedKey];
  saveData();
  renderActivityList();
  renderCalendar();
}

function shiftMonth(delta) {
  state.view = new Date(state.view.getFullYear(), state.view.getMonth() + delta, 1);
  renderCalendar();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function init() {
  renderLegend();
  renderCalendar();

  document.getElementById("prev-month").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("next-month").addEventListener("click", () => shiftMonth(1));
  document.getElementById("jump-today").addEventListener("click", () => {
    state.view = new Date();
    renderCalendar();
  });

  document.getElementById("calendar").addEventListener("click", (event) => {
    const button = event.target.closest(".day[data-date]");
    if (!button) return;
    openDay(button.dataset.date);
  });

  document.getElementById("activity-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-activity]");
    if (!button) return;
    toggleActivity(button.dataset.activity);
  });

  document.getElementById("add-custom").addEventListener("click", addCustomActivity);
  document.getElementById("custom-activity").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomActivity();
    }
  });
  document.getElementById("clear-day").addEventListener("click", clearDay);
}

init();

const CHANNEL_URL = "https://t.me/OrionSolarUA";

const DEVICES = [
    ["Холодильник", 150],
    ["Плита електрична", 2000],
    ["Котел опалення", 1500],
    ["Роутер", 15],
    ["Чайник", 1500],
    ["Телевізор", 100],
    ["Пральна машина", 500],
    ["Праска", 1200],
    ["Зарядна станція для авто", 3500],
    ["Комп'ютер, ноутбук", 300],
    ["Бойлер", 2000],
    ["Зарядний пристрій для телефону", 20],
    ["Кондиціонер", 1000],
    ["Фен", 1500],
    ["Сушарка для одягу", 2000],
    ["Аєрогриль", 1500],
    ["Кавоварка", 1000],
    ["Насос для води", 500],
    ["Насос для опалення", 750],
    ["Міксер", 300],
    ["Блендер", 500],
    ["Ігрова консоль", 200],
    ["Тепла підлога", 200],
];

const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

const tg = window.Telegram ? window.Telegram.WebApp : null;
let selected = new Set();
let hours = {};
let order = [];
let current = 0;

tg.ready();
tg.expand();
if (tg.setHeaderColor) tg.setHeaderColor(tg.themeParams.bg_color || "#ffffff");
if (tg.setBackgroundColor) tg.setBackgroundColor(tg.themeParams.bg_color || "#ffffff");

function tap() {
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function show(id) {
    document.querySelectorAll(".screen").forEach(s => (s.hidden = true));
    document.getElementById("screen-" + id).hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (tg) {
        const back = id === "devices" || id === "hours";
        if (back && !tg.BackButton.isVisible) tg.BackButton.show();
        if (!back && tg.BackButton.isVisible) tg.BackButton.hide();
    }
}

if (tg) {
    tg.BackButton.onClick(() => {
        if (!document.getElementById("screen-hours").hidden) {
            const prev = order[current - 1];
            if (prev !== undefined) {
                hours[prev] = undefined;
                current--;
                renderHours(current);
            }
        } else {
            reset();
        }
    });
}

function reset() {
    selected = new Set();
    hours = {};
    order = [];
    current = 0;
    show("intro");
}

document.getElementById("btn-intro").addEventListener("click", () => {
    tap();
    renderDevices();
    show("devices");
});

function renderDevices() {
    const list = document.getElementById("dev-list");
    list.innerHTML = "";
    DEVICES.forEach((dev, i) => {
        const el = document.createElement("div");
        el.className = "dev-item";
        el.innerHTML = `
            <div class="dev-check"></div>
            <span class="dev-name">${dev[0]}</span>
            <span class="dev-watts">${dev[1]} Вт</span>`;
        el.addEventListener("click", () => {
            tap();
            if (selected.has(i)) selected.delete(i);
            else selected.add(i);
            el.classList.toggle("on", selected.has(i));
            document.getElementById("dev-count").textContent = selected.size;
        });
        list.appendChild(el);
    });
    document.getElementById("dev-count").textContent = "0";
}

document.getElementById("btn-devices").addEventListener("click", () => {
    tap();
    if (selected.size === 0) {
        if (tg) tg.showAlert("Оберіть хоча б один пристрій.");
        return;
    }
    order = [...selected].sort((a, b) => a - b);
    hours = {};
    current = 0;
    renderHours(0);
    show("hours");
});

function renderHours(i) {
    const deviceIdx = order[i];
    const total = order.length;
    document.getElementById("hr-step").textContent = `Питання ${i + 1} з ${total}`;
    document.getElementById("hr-title").textContent = DEVICES[deviceIdx][0] + ` (${DEVICES[deviceIdx][1]} Вт)`;

    const grid = document.getElementById("hr-options");
    grid.innerHTML = "";
    HOURS_OPTIONS.forEach(h => {
        const el = document.createElement("div");
        el.className = "hour-chip";
        el.innerHTML = `<span class="num">${h}</span><span class="unit">год</span>`;
        el.addEventListener("click", () => {
            tap();
            hours[deviceIdx] = h;
            if (i + 1 < total) renderHours(i + 1);
            else renderResult();
        });
        grid.appendChild(el);
    });
}

function renderResult() {
    let totalWh = 0;
    const list = document.getElementById("result-list");
    list.innerHTML = "";

    order.forEach(idx => {
        const [name, watts] = DEVICES[idx];
        const h = hours[idx];
        const wh = watts * h;
        totalWh += wh;

        const el = document.createElement("div");
        el.className = "dev-item";
        el.innerHTML = `
            <div class="dev-check">✓</div>
            <span class="dev-name">${name}</span>
            <span class="dev-watts">${watts} Вт × ${h} год = ${wh} Вт·год</span>`;
        el.style.cursor = "default";
        list.appendChild(el);
    });

    document.getElementById("result-total").innerHTML =
        `<b>Загальна потреба: ${(totalWh / 1000).toFixed(2)} кВт·год</b><br>
         <span style="color:var(--hint)">Розрахунок виконано за середніми показниками приладів. Для точного підбору зверніться до наших менеджерів.</span>`;

    show("result");
}

document.getElementById("btn-channel").addEventListener("click", () => {
    tap();
    if (tg) tg.openTelegramLink(CHANNEL_URL);
});

document.getElementById("btn-again").addEventListener("click", () => {
    tap();
    reset();
});
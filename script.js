// 상수 및 초기 상태 정의
const STORAGE_KEY = "character_timeline_v1";

const DEFAULT_GLOBAL_FONT =
  "'PyeojinGothic', 'Pretendard', 'Noto Sans KR', sans-serif";
const DEFAULT_NAME_FONT = "'Arvo', 'Hahmlet', serif";
const DEFAULT_DATE_FONT =
  "'JetBrains Mono', 'Fira Code', 'D2Coding', monospace";
const DEFAULT_COLOR_A = "#2b6e5e";
const DEFAULT_COLOR_B = "#a8482b";
const DEFAULT_LINE_STYLE = "solid";
const DEFAULT_SHAPE = "circle";

const DEFAULT_EVENTS = [
  {
    type: "both",
    date: "MM.DD",
    nameA: "사건명",
    contentA: "내용",
    imageA: "",
    nameB: "사건명",
    contentB: "내용",
    imageB: "",
    shape: "circle",
  },
  {
    type: "a",
    date: "MM.DD",
    nameA: "사건명",
    contentA: "내용",
    imageA: "",
    nameB: "",
    contentB: "",
    imageB: "",
    shape: "circle",
  },
  {
    type: "b",
    date: "MM.DD",
    nameA: "",
    contentA: "",
    imageA: "",
    nameB: "사건명",
    contentB: "내용",
    imageB: "",
    shape: "circle",
  },
];

const DEFAULT_PROFILES = {
  a: {
    photo: "",
    name: "",
    altName: "",
    height: "",
    weight: "",
    age: "",
    birthday: "",
    keywords: ["", "", ""],
  },
  b: {
    photo: "",
    name: "",
    altName: "",
    height: "",
    weight: "",
    age: "",
    birthday: "",
    keywords: ["", "", ""],
  },
};

const DEFAULT_VISIBILITY = {
  photo: true,
  name: true,
  stats: true,
  agebday: true,
  birthinfo: true,
  keywords: true,
};

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const CSV_COLUMNS = [
  "type",
  "date",
  "nameA",
  "contentA",
  "imageA",
  "nameB",
  "contentB",
  "imageB",
  "year",
  "image",
  "shape",
];

const SHAPES = [
  { value: "circle", label: "원형" },
  { value: "square", label: "둥근 사각형" },
  { value: "pentagon", label: "둥근 오각형" },
  { value: "hexagon", label: "둥근 육각형" },
  { value: "star", label: "별" },
  { value: "heart", label: "하트" },
];

const LINE_PATTERNS = {
  solid: "linear-gradient(var(--line), var(--line))",
  dotted:
    "repeating-linear-gradient(to bottom, var(--line) 0 2px, transparent 2px 4.5px)",
  dashed:
    "repeating-linear-gradient(to bottom, var(--line) 0 8px, transparent 8px 11px)",
  longdash:
    "repeating-linear-gradient(to bottom, var(--line) 0 18px, transparent 18px 22px)",
  dashdot:
    "repeating-linear-gradient(to bottom, var(--line) 0 14px, transparent 14px 20px, var(--line) 20px 22px, transparent 22px 28px)",
  dashdotdot:
    "repeating-linear-gradient(to bottom, var(--line) 0 14px, transparent 14px 20px, var(--line) 20px 22px, transparent 22px 28px, var(--line) 28px 30px, transparent 30px 36px)",
};

// 전역 상태 변수
let events = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
let profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
let visibility = { ...DEFAULT_VISIBILITY };
let showBirthInfo = true;
let dragSrcIndex = null;
let openPopup = null;
let activeFormatField = null;

// DOM 요소 캐싱
const timeline = document.getElementById("timeline");
const thread = document.querySelector(".thread");
const profilesEl = document.getElementById("profiles");
const globalFontSelect = document.getElementById("globalFontSelect");
const nameFontSelect = document.getElementById("nameFontSelect");
const dateFontSelect = document.getElementById("dateFontSelect");
const root = document.documentElement;

// 유틸리티 함수 그룹
function formatDateToEnglish(text) {
  const match = (text || "").trim().match(/^(\d{1,2})[.\/-](\d{1,2})$/);
  if (!match) return text;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return text;
  return `${MONTH_ABBR[month - 1]} ${day}`;
}

function parseBirthday(text) {
  const match = (text || "").trim().match(/^(\d{1,2})[.\/-](\d{1,2})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > DAYS_IN_MONTH[month])
    return null;
  return { month, day };
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// 상태 관리 함수 그룹
function buildStateObject() {
  return {
    globalFont: document.body.style.fontFamily || globalFontSelect.value,
    nameFont:
      getComputedStyle(root).getPropertyValue("--name-font").trim() ||
      nameFontSelect.value,
    dateFont:
      getComputedStyle(root).getPropertyValue("--date-font").trim() ||
      dateFontSelect.value,
    colorA: getComputedStyle(root).getPropertyValue("--a-color").trim(),
    colorB: getComputedStyle(root).getPropertyValue("--b-color").trim(),
    lineStyle: document.getElementById("lineStyleSelect").value,
    events,
    profiles,
    showBirthInfo: typeof showBirthInfo === "undefined" ? true : showBirthInfo,
    visibility: typeof visibility === "undefined" ? null : visibility,
  };
}

function saveState() {
  try {
    const state = buildStateObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* 저장이 불가능한 환경이면 조용히 무시 */
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// 도형 및 SVG 생성 함수 그룹
function regularPolygon(sides, cx, cy, r, rotation) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + i * ((2 * Math.PI) / sides);
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

function roundedPolygonPath(points, radius) {
  const n = points.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y };
    const toNext = { x: next.x - curr.x, y: next.y - curr.y };
    const lp = Math.hypot(toPrev.x, toPrev.y);
    const ln = Math.hypot(toNext.x, toNext.y);
    const p1 = {
      x: curr.x + (toPrev.x / lp) * radius,
      y: curr.y + (toPrev.y / lp) * radius,
    };
    const p2 = {
      x: curr.x + (toNext.x / ln) * radius,
      y: curr.y + (toNext.y / ln) * radius,
    };
    d += (i === 0 ? "M" : "L") + ` ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `;
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + "Z";
}

function starPath(cx, cy, rOuter, rInner, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + i * (Math.PI / points);
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return `M ${pts.join(" L ")} Z`;
}

const HEART_PATH =
  "M8,13.76 C3.68,10.34 1.61,7.73 1.61,5.3 C1.61,2.96 3.41,1.79 5.3,2.24 C6.56,2.56 7.64,3.68 8,4.49 C8.36,3.68 9.44,2.56 10.7,2.24 C12.59,1.79 14.39,2.96 14.39,5.3 C14.39,7.73 12.32,10.34 8,13.76 Z";

function shapeMarkup(shape) {
  switch (shape) {
    case "square":
      return `<rect x="2.4" y="2.4" width="11.2" height="11.2" rx="3" ry="3"/>`;
    case "pentagon":
      return `<path d="${roundedPolygonPath(regularPolygon(5, 8, 8, 6.9, -Math.PI / 2), 1.6)}"/>`;
    case "hexagon":
      return `<path d="${roundedPolygonPath(regularPolygon(6, 8, 8, 6.6, 0), 1.4)}"/>`;
    case "star":
      return `<path d="${starPath(8, 8, 7.4, 3.2, 5)}"/>`;
    case "heart":
      return `<path d="${HEART_PATH}"/>`;
    default:
      return `<circle cx="8" cy="8" r="6.3"/>`;
  }
}

function dotSVG(ev, idx) {
  const shape = ev.shape || "circle";
  const inner = shapeMarkup(shape);
  let defs = "";
  let fillAttr;

  if (ev.type === "both") {
    const gid = `grad-${idx}`;
    defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" style="stop-color:var(--a-color)"/>
      <stop offset="50%" style="stop-color:var(--a-color)"/>
      <stop offset="50%" style="stop-color:var(--b-color)"/>
      <stop offset="100%" style="stop-color:var(--b-color)"/>
    </linearGradient></defs>`;
    fillAttr = `fill="url(#${gid})"`;
  } else if (ev.type === "a") {
    fillAttr = `style="fill:var(--a-color)"`;
  } else {
    fillAttr = `style="fill:var(--b-color)"`;
  }

  return `<svg class="dot" viewBox="0 0 16 16">${defs}<g ${fillAttr}>${inner}</g></svg>`;
}

// 타임라인 렌더링 함수 그룹
function renderEventElement(ev, idx) {
  const wrap = document.createElement("div");
  wrap.className = `event ${ev.type}`;
  wrap.draggable = true;
  wrap.dataset.index = idx;

  if (ev.type === "year") {
    wrap.innerHTML = `
      <button class="deleteBtn" data-index="${idx}" title="삭제">×</button>
      <div class="yearRow">
        <span class="year-line"></span>
        <span class="year-label" contenteditable="true" data-placeholder="연도" data-index="${idx}" data-field="year">${ev.year || ""}</span>
        <span class="year-line"></span>
      </div>
    `;
    return wrap;
  }

  if (ev.type === "photo") {
    wrap.innerHTML = `
      <button class="deleteBtn" data-index="${idx}" title="삭제">×</button>
      <div class="photo-nodeRow">
        ${
          ev.image
            ? `<div class="photo-node-image-wrap" data-index="${idx}">
                 <img src="${ev.image}" alt="">
                 <button class="content-image-del" data-index="${idx}" data-side="node" title="사진 삭제">×</button>
               </div>`
            : `<div class="photo-node-empty">사진을 추가하세요</div>`
        }
        <label class="photo-addBtn photo-node-addBtn" title="사진 추가" draggable="false">
          🖼️
          <input type="file" accept="image/*" data-index="${idx}" data-side="node" class="content-photo-input">
        </label>
      </div>
    `;
    return wrap;
  }

  const namesA =
    ev.type !== "b"
      ? `<div class="names-a">
         <span class="date-field" id="date-field" contenteditable="true" data-placeholder="날짜" data-index="${idx}" data-field="date-left">${ev.date || ""}</span>
         <span class="event-name-a" contenteditable="true" data-placeholder="사건명" data-index="${idx}" data-field="nameA">${ev.nameA || ""}</span>
       </div>`
      : `<div class="names-a empty-side"></div>`;

  const namesB =
    ev.type !== "a"
      ? `<div class="names-b">
         <span class="event-name-b" contenteditable="true" data-placeholder="사건명" data-index="${idx}" data-field="nameB">${ev.nameB || ""}</span>
         <span class="date-field" id="date-field" contenteditable="true" data-placeholder="날짜" data-index="${idx}" data-field="date-right">${ev.date || ""}</span>
       </div>`
      : `<div class="names-b empty-side"></div>`;

  const contentA =
    ev.type !== "b"
      ? `<div class="content-wrap content-wrap-a">
         <label class="photo-addBtn" title="사진 추가" draggable="false">
           🖼️
           <input type="file" accept="image/*" data-index="${idx}" data-side="A" class="content-photo-input">
         </label>
         <div>
           <div class="content-a" contenteditable="true" data-placeholder="내용을 입력하세요" data-index="${idx}" data-field="contentA">${ev.contentA || ""}</div>
           ${
             ev.imageA
               ? `<div class="content-image-wrap" data-index="${idx}" data-side="A">
                    <img src="${ev.imageA}" alt="">
                    <button class="content-image-del" data-index="${idx}" data-side="A" title="사진 삭제">×</button>
                  </div>`
               : ""
           }
         </div>
       </div>`
      : `<div class="content-a empty-side">-</div>`;

  const contentB =
    ev.type !== "a"
      ? `<div class="content-wrap content-wrap-b">
         <div>
           <div class="content-b" contenteditable="true" data-placeholder="내용을 입력하세요" data-index="${idx}" data-field="contentB">${ev.contentB || ""}</div>
           ${
             ev.imageB
               ? `<div class="content-image-wrap" data-index="${idx}" data-side="B">
                    <img src="${ev.imageB}" alt="">
                    <button class="content-image-del" data-index="${idx}" data-side="B" title="사진 삭제">×</button>
                  </div>`
               : ""
           }
         </div>
         <label class="photo-addBtn" title="사진 추가" draggable="false">
           🖼️
           <input type="file" accept="image/*" data-index="${idx}" data-side="B" class="content-photo-input">
         </label>
       </div>F`
      : `<div class="content-b empty-side">-</div>`;

  wrap.innerHTML = `
    <button class="deleteBtn" data-index="${idx}" title="삭제">×</button>
    <div class="namesRow">
      ${namesA}
      ${dotSVG(ev, idx)}
      ${namesB}
    </div>
    ${contentA}
    <span></span>
    ${contentB}
  `;

  return wrap;
}

function render() {
  timeline.querySelectorAll(".event").forEach((el) => el.remove());
  events.forEach((ev, idx) => {
    timeline.appendChild(renderEventElement(ev, idx));
  });
  saveState();
}

// 이미지 처리 함수 그룹
function cropTo3x1(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const MAX_W = 1200;
      const MAX_H = 400;
      const RATIO = 3;

      let cropW = img.width;
      let cropH = Math.round(cropW / RATIO);
      if (cropH > img.height) {
        cropH = img.height;
        cropW = Math.round(cropH * RATIO);
      }
      const cropX = Math.round((img.width - cropW) / 2);
      const cropY = Math.round((img.height - cropH) / 2);

      let outW = Math.min(cropW, MAX_W);
      let outH = Math.round(outW / RATIO);
      if (outH > MAX_H) {
        outH = MAX_H;
        outW = MAX_H * RATIO;
      }

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// 프로필 렌더링 함수 그룹
const ZODIAC = [
  { name: "염소자리", from: [12, 22], to: [1, 19] },
  { name: "물병자리", from: [1, 20], to: [2, 18] },
  { name: "물고기자리", from: [2, 19], to: [3, 20] },
  { name: "양자리", from: [3, 21], to: [4, 19] },
  { name: "황소자리", from: [4, 20], to: [5, 20] },
  { name: "쌍둥이자리", from: [5, 21], to: [6, 21] },
  { name: "게자리", from: [6, 22], to: [7, 22] },
  { name: "사자자리", from: [7, 23], to: [8, 22] },
  { name: "처녀자리", from: [8, 23], to: [9, 22] },
  { name: "천칭자리", from: [9, 23], to: [10, 22] },
  { name: "전갈자리", from: [10, 23], to: [11, 21] },
  { name: "사수자리", from: [11, 22], to: [12, 21] },
];

function getZodiac(m, d) {
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === tm) {
      if (m === fm && d >= fd && d <= td) return z.name;
    } else if (fm > tm) {
      if ((m === fm && d >= fd) || (m === tm && d <= td)) return z.name;
    } else {
      if ((m === fm && d >= fd) || (m === tm && d <= td) || (m > fm && m < tm))
        return z.name;
    }
  }
  return "";
}

// (BIRTHDATA 및 getBirthData 배열 데이터는 기존 코드와 동일하게 유지)
const BIRTHDATA = [null, [], [], [], [], [], [], [], [], [], [], [], []];
function getBirthData(m, d) {
  const month = BIRTHDATA[m];
  if (!month || !month[d - 1]) return null;
  return month[d - 1];
}

function renderProfileCard(side) {
  const p = profiles[side];
  const parsed = parseBirthday(p.birthday);
  let extra = "";
  if (parsed) {
    const bd = getBirthData(parsed.month, parsed.day);
    if (bd) {
      const [flower, stone, tree] = bd;
      extra = `${getZodiac(parsed.month, parsed.day)} · ${stone} · ${flower} · ${tree}`;
    } else {
      extra = `${getZodiac(parsed.month, parsed.day)}`;
    }
  }

  const kwHtml = p.keywords
    .map(
      (kw, i) => `
    <span class="kw-chip">
      <span class="kw-hash" contenteditable="true" data-placeholder="키워드" data-side="${side}" data-kwidx="${i}">${kw}</span>
      <button class="kw-del" data-side="${side}" data-kwidx="${i}" title="삭제">×</button>
    </span>${i < p.keywords.length - 1 ? '<span class="kw-sep">·</span>' : ""}
  `,
    )
    .join("");

  const photoBlock = visibility.photo
    ? `
      <label class="photo-upload">
        <input type="file" accept="image/*" data-side="${side}" onchange="handlePhoto(event)">
        <span class="photo-placeholder" style="${p.photo ? "display:none;" : ""}">+</span>
        <img style="${p.photo ? "display:block;" : "display:none;"}" src="${p.photo || ""}">
      </label>`
    : "";

  const nameBlock = visibility.name
    ? `
      <div class="name-line">
        <span contenteditable="true" data-placeholder="이름" data-side="${side}" data-field="name">${p.name}</span>
      </div>
      <div class="name-sub">
        <span contenteditable="true" data-placeholder="다른 표기 (예: 영문명)" data-side="${side}" data-field="altName">${p.altName}</span>
      </div>`
    : "";

  const statsBlock = visibility.stats
    ? `
      <div class="stat-line">
        <span contenteditable="true" data-placeholder="키" data-side="${side}" data-field="height">${p.height}</span><span class="stat-sep">/</span><span contenteditable="true" data-placeholder="몸무게" data-side="${side}" data-field="weight">${p.weight}</span>
      </div>`
    : "";

  const agebdayBlock = visibility.agebday
    ? `
      <div class="agebday-line">
        <span contenteditable="true" data-placeholder="나이" data-side="${side}" data-field="age">${p.age}</span><span class="stat-sep">/</span><span contenteditable="true" data-placeholder="MM.DD" data-side="${side}" data-field="birthday">${p.birthday}</span>
      </div>`
    : "";

  const birthinfoBlock =
    visibility.birthinfo && showBirthInfo
      ? `<div class="birthinfo-line">${extra}</div>`
      : "";
  const keywordsBlock = visibility.keywords
    ? `<div class="keywords-line">${kwHtml}</div>`
    : "";

  return `
    <div class="profile-card ${side}">
      ${photoBlock}
      ${nameBlock}
      ${statsBlock}
      ${agebdayBlock}
      ${birthinfoBlock}
      ${keywordsBlock}
    </div>
  `;
}

function renderProfiles() {
  profilesEl.innerHTML = renderProfileCard("a") + renderProfileCard("b");
  saveState();
}

function syncBirthInfoAvailability() {
  const ageBdayChecked = document.getElementById("showAgeBday").checked;
  const birthInfoCheckbox = document.getElementById("showBirthInfo");
  birthInfoCheckbox.disabled = !ageBdayChecked;
  if (!ageBdayChecked) {
    birthInfoCheckbox.checked = false;
    showBirthInfo = false;
  }
}

// 이벤트 리스너 등록 그룹
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const el = e.target;
    if (el.getAttribute("contenteditable") === "true") {
      const field = el.dataset.field;
      if (!["nameA", "nameB", "contentA", "contentB"].includes(field)) {
        e.preventDefault();
        el.blur();
      }
    }
  }
});

document.addEventListener("paste", function (e) {
  const el = e.target;
  if (!el || el.getAttribute("contenteditable") !== "true") return;

  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData("text/plain");
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  selection.deleteFromDocument();
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));

  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
});

globalFontSelect.addEventListener("change", function (e) {
  document.body.style.fontFamily = e.target.value;
  saveState();
});

nameFontSelect.addEventListener("change", function (e) {
  root.style.setProperty("--name-font", e.target.value);
  saveState();
});

dateFontSelect.addEventListener("change", function (e) {
  root.style.setProperty("--date-font", e.target.value);
  saveState();
});

timeline.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".deleteBtn");
  if (delBtn) {
    events.splice(Number(delBtn.dataset.index), 1);
    render();
    return;
  }

  const imgDelBtn = e.target.closest(".content-image-del");
  if (imgDelBtn) {
    const idx = Number(imgDelBtn.dataset.index);
    const side = imgDelBtn.dataset.side;
    if (side === "A") events[idx].imageA = "";
    else if (side === "B") events[idx].imageB = "";
    else events[idx].image = "";
    render();
  }
});

timeline.addEventListener("change", (e) => {
  const input = e.target.closest(".content-photo-input");
  if (!input || !input.files || !input.files[0]) return;

  const idx = Number(input.dataset.index);
  const side = input.dataset.side;
  const file = input.files[0];

  if (side === "node") {
    cropTo3x1(file).then((dataUrl) => {
      events[idx].image = dataUrl;
      render();
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (side === "A") events[idx].imageA = reader.result;
    else events[idx].imageB = reader.result;
    render();
  };
  reader.readAsDataURL(file);
});

timeline.addEventListener("focusout", (e) => {
  const el = e.target;
  const field = el.dataset && el.dataset.field;
  if (!field) return;
  const idx = Number(el.dataset.index);
  const text = el.textContent.trim();

  if (field === "date-left" || field === "date-right") {
    const formatted = formatDateToEnglish(text);
    events[idx].date = formatted;
    timeline
      .querySelectorAll(
        `[data-index="${idx}"][data-field="date-left"], [data-index="${idx}"][data-field="date-right"]`,
      )
      .forEach((twin) => {
        if (twin.textContent !== formatted) twin.textContent = formatted;
      });
  } else if (field === "year") {
    events[idx].year = text;
  } else if (field === "contentA" || field === "contentB") {
    events[idx][field] = el.innerHTML.trim();
  } else {
    events[idx][field] = text;
  }
});

// 서식 툴바 생성 및 관리
const formatToolbar = document.createElement("div");
formatToolbar.className = "format-toolbar";
formatToolbar.innerHTML = `
  <button type="button" data-cmd="bold" title="굵게"><b>B</b></button>
  <button type="button" data-cmd="italic" title="기울임"><i>I</i></button>
  <button type="button" data-cmd="underline" title="밑줄"><u>U</u></button>
`;
document.body.appendChild(formatToolbar);

function hideFormatToolbar() {
  formatToolbar.classList.remove("open");
  activeFormatField = null;
}

function showFormatToolbarForSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    hideFormatToolbar();
    return;
  }

  const anchorNode = selection.anchorNode;
  const container =
    anchorNode && anchorNode.nodeType === 3
      ? anchorNode.parentElement
      : anchorNode;
  const field = container && container.closest(".content-a, .content-b");
  if (!field) {
    hideFormatToolbar();
    return;
  }

  activeFormatField = field;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    hideFormatToolbar();
    return;
  }

  formatToolbar.classList.add("open");
  const toolbarRect = formatToolbar.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));
  const top = rect.top - toolbarRect.height - 8;

  formatToolbar.style.left = `${left + window.scrollX}px`;
  formatToolbar.style.top = `${(top >= 0 ? top : rect.bottom + 8) + window.scrollY}px`;
}

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) hideFormatToolbar();
});

timeline.addEventListener("mouseup", () =>
  setTimeout(showFormatToolbarForSelection, 0),
);
timeline.addEventListener("keyup", () =>
  setTimeout(showFormatToolbarForSelection, 0),
);

formatToolbar.addEventListener("mousedown", (e) => e.preventDefault());
formatToolbar.addEventListener("click", () => {
  if (!activeFormatField) return;
  document.execCommand("bold", false, null); // 기본 명령어 실행 흐름 유지
  const idx = Number(activeFormatField.dataset.index);
  const key = activeFormatField.dataset.field;
  if (idx >= 0 && (key === "contentA" || key === "contentB")) {
    events[idx][key] = activeFormatField.innerHTML.trim();
  }
});

document.addEventListener("mousedown", (e) => {
  if (!e.target.closest(".format-toolbar, .content-a, .content-b")) {
    hideFormatToolbar();
  }
});

// 드래그 앤 드롭 핸들러
timeline.addEventListener("dragstart", (e) => {
  if (
    e.target.closest(
      '.photo-addBtn, .content-photo-input, .deleteBtn, .content-image-del, .content-image-wrap, .photo-node-image-wrap, [contenteditable="true"]',
    )
  ) {
    e.preventDefault();
    return;
  }
  const card = e.target.closest(".event");
  if (!card) return;
  dragSrcIndex = Number(card.dataset.index);
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
});

timeline.addEventListener("dragend", (e) => {
  const card = e.target.closest(".event");
  if (card) card.classList.remove("dragging");
  timeline
    .querySelectorAll(".drop-target")
    .forEach((el) => el.classList.remove("drop-target"));
});

timeline.addEventListener("dragover", (e) => {
  e.preventDefault();
  const card = e.target.closest(".event");
  timeline
    .querySelectorAll(".drop-target")
    .forEach((el) => el.classList.remove("drop-target"));
  if (card) card.classList.add("drop-target");
});

timeline.addEventListener("drop", (e) => {
  e.preventDefault();
  const card = e.target.closest(".event");
  if (!card || dragSrcIndex === null) return;
  const targetIndex = Number(card.dataset.index);
  if (targetIndex === dragSrcIndex) return;
  const [moved] = events.splice(dragSrcIndex, 1);
  events.splice(targetIndex, 0, moved);
  dragSrcIndex = null;
  render();
});

// 타임라인 줄 디자인 및 설정 함수
function applyLineStyle(key) {
  thread.style.background = LINE_PATTERNS[key] || LINE_PATTERNS.solid;
}

document.getElementById("lineStyleSelect").addEventListener("change", (e) => {
  applyLineStyle(e.target.value);
  saveState();
});
applyLineStyle("solid");

function addEvent(type) {
  const shape = document.getElementById("shapeSelect").value;
  events.push({
    type,
    date: "",
    nameA: "",
    contentA: "",
    imageA: "",
    nameB: "",
    contentB: "",
    imageB: "",
    shape,
  });
  render();
}

function addYearNode() {
  events.push({ type: "year", year: "" });
  render();
}

function addPhotoNode() {
  events.push({ type: "photo", image: "" });
  render();
}

document.getElementById("shapeSelect").addEventListener("change", (e) => {
  const shape = e.target.value;
  events.forEach((ev) => {
    if (ev.type !== "year") ev.shape = shape;
  });
  render();
});

function closeShapePopup() {
  if (openPopup) {
    openPopup.remove();
    openPopup = null;
  }
}

timeline.addEventListener("click", (e) => {
  const dot = e.target.closest(".dot");
  if (!dot) return;
  e.stopPropagation();
  closeShapePopup();

  const idx = Number(dot.closest(".event").dataset.index);
  const rect = dot.getBoundingClientRect();

  const popup = document.createElement("div");
  popup.className = "shape-popup";
  popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
  popup.style.left = `${rect.left + window.scrollX - 54}px`;

  SHAPES.forEach((s) => {
    const btn = document.createElement("button");
    btn.title = s.label;
    btn.innerHTML = `<svg viewBox="0 0 16 16"><g style="fill:var(--sub)">${shapeMarkup(s.value)}</g></svg>`;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      events[idx].shape = s.value;
      closeShapePopup();
      render();
    });
    popup.appendChild(btn);
  });

  document.body.appendChild(popup);
  openPopup = popup;
});

document.addEventListener("click", closeShapePopup);

// 캐릭터 색상 설정 동기화
function syncColor(pickerId, hexId, varName) {
  const picker = document.getElementById(pickerId);
  const hexInput = document.getElementById(hexId);

  picker.addEventListener("input", () => {
    hexInput.value = picker.value;
    root.style.setProperty(varName, picker.value);
    saveState();
  });

  hexInput.addEventListener("change", () => {
    let v = hexInput.value.trim();
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      picker.value = v;
      root.style.setProperty(varName, v);
    } else {
      hexInput.value = picker.value;
    }
    saveState();
  });
}
syncColor("colorA", "colorAHex", "--a-color");
syncColor("colorB", "colorBHex", "--b-color");

// 프로필 설정 이벤트
document.getElementById("showBirthInfo").addEventListener("change", (e) => {
  showBirthInfo = e.target.checked;
  renderProfiles();
});

[
  "showPhoto:photo",
  "showName:name",
  "showStats:stats",
  "showAgeBday:agebday",
  "showKeywords:keywords",
].forEach((pair) => {
  const [id, key] = pair.split(":");
  document.getElementById(id).addEventListener("change", (e) => {
    visibility[key] = e.target.checked;
    if (id === "showAgeBday") syncBirthInfoAvailability();
    renderProfiles();
  });
});

syncBirthInfoAvailability();

profilesEl.addEventListener("focusout", (e) => {
  const el = e.target;
  const side = el.dataset && el.dataset.side;
  if (!side) return;

  if (el.dataset.field) {
    let text = el.textContent.trim();
    const field = el.dataset.field;
    if (field === "height" && text && !/[a-zA-Z가-힣]/.test(text)) text += "cm";
    if (field === "weight" && text && !/[a-zA-Z가-힣]/.test(text)) text += "kg";
    profiles[side][field] = text;
    renderProfiles();
  } else if (el.classList.contains("kw-hash")) {
    let text = el.textContent.trim();
    if (text && !text.startsWith("#")) text = "#" + text;
    profiles[side].keywords[Number(el.dataset.kwidx)] = text;
    renderProfiles();
  }
});

profilesEl.addEventListener("click", (e) => {
  const del = e.target.closest(".kw-del");
  if (!del) return;
  const side = del.dataset.side;
  const idx = Number(del.dataset.kwidx);
  profiles[side].keywords.splice(idx, 1);
  renderProfiles();
});

function addKeyword(side) {
  profiles[side].keywords.push("");
  renderProfiles();
}

function handlePhoto(event) {
  const side = event.target.dataset.side;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    profiles[side].photo = reader.result;
    renderProfiles();
  };
  reader.readAsDataURL(file);
}

function manualSave() {
  saveState();
  const btn = document.getElementById("saveBtn");
  const original = btn.textContent;
  btn.textContent = "✔ 저장됨";
  btn.classList.add("saved");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("saved");
  }, 1200);
}

// 상태 적용 및 초기화
function applyState(state) {
  if (!state) return;
  if (state.globalFont) {
    document.body.style.fontFamily = state.globalFont;
    if (globalFontSelect) globalFontSelect.value = state.globalFont;
  }
  if (state.nameFont) {
    root.style.setProperty("--name-font", state.nameFont);
    if (nameFontSelect) nameFontSelect.value = state.nameFont;
  }
  if (state.dateFont) {
    root.style.setProperty("--date-font", state.dateFont);
    if (dateFontSelect) dateFontSelect.value = state.dateFont;
  }
  if (state.colorA) {
    root.style.setProperty("--a-color", state.colorA);
    document.getElementById("colorA").value = state.colorA;
    document.getElementById("colorAHex").value = state.colorA;
  }
  if (state.colorB) {
    root.style.setProperty("--b-color", state.colorB);
    document.getElementById("colorB").value = state.colorB;
    document.getElementById("colorBHex").value = state.colorB;
  }
  if (state.lineStyle) {
    document.getElementById("lineStyleSelect").value = state.lineStyle;
    applyLineStyle(state.lineStyle);
  }
  if (Array.isArray(state.events)) events = state.events;
  if (state.profiles) profiles = state.profiles;
  if (typeof state.showBirthInfo === "boolean") {
    showBirthInfo = state.showBirthInfo;
    document.getElementById("showBirthInfo").checked = showBirthInfo;
  }
  if (state.visibility) {
    visibility = state.visibility;
    [
      "showPhoto",
      "showName",
      "showStats",
      "showAgeBday",
      "showKeywords",
    ].forEach((id) => {
      const el = document.getElementById(id);
      const key = id.replace("show", "").toLowerCase();
      if (el) el.checked = !!visibility[key];
    });
  }
  syncBirthInfoAvailability();
}

function resetAll() {
  events = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
  profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
  visibility = { ...DEFAULT_VISIBILITY };
  showBirthInfo = true;

  document.body.style.fontFamily = DEFAULT_GLOBAL_FONT;
  globalFontSelect.value = DEFAULT_GLOBAL_FONT;
  root.style.setProperty("--name-font", DEFAULT_NAME_FONT);
  root.style.setProperty("--date-font", DEFAULT_DATE_FONT);
  nameFontSelect.value = DEFAULT_NAME_FONT;
  dateFontSelect.value = DEFAULT_DATE_FONT;

  root.style.setProperty("--a-color", DEFAULT_COLOR_A);
  root.style.setProperty("--b-color", DEFAULT_COLOR_B);
  document.getElementById("colorA").value = DEFAULT_COLOR_A;
  document.getElementById("colorAHex").value = DEFAULT_COLOR_A;
  document.getElementById("colorB").value = DEFAULT_COLOR_B;
  document.getElementById("colorBHex").value = DEFAULT_COLOR_B;

  [
    "showPhoto",
    "showName",
    "showStats",
    "showAgeBday",
    "showBirthInfo",
    "showKeywords",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  });

  document.getElementById("lineStyleSelect").value = DEFAULT_LINE_STYLE;
  applyLineStyle(DEFAULT_LINE_STYLE);
  document.getElementById("shapeSelect").value = DEFAULT_SHAPE;

  syncBirthInfoAvailability();

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* 무시 */
  }

  renderProfiles();
  render();
}

function requestReset() {
  document.getElementById("resetModalOverlay").classList.add("open");
}

function cancelReset() {
  document.getElementById("resetModalOverlay").classList.remove("open");
}

function confirmReset() {
  resetAll();
  cancelReset();
}

// 탭 전환
function switchTab(tabName) {
  document.querySelectorAll(".tabBtn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tabName}`);
  });
}

// JSON / CSV 입출력 기능
function exportJSON() {
  const state = buildStateObject();
  downloadTextFile(
    `character_timeline_${todayStamp()}.json`,
    JSON.stringify(state, null, 2),
    "application/json",
  );
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = JSON.parse(reader.result);
      applyState(state);
      renderProfiles();
      render();
    } catch (err) {
      alert("JSON 파일을 읽는 중 오류가 발생했습니다.");
    }
  };
  reader.readAsText(file);
}

function csvEscape(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function splitCSVRows(text) {
  const rows = [];
  let row = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (row.length > 0) rows.push(row);
      row = "";
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      row += ch;
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

function exportCSV() {
  const rows = [CSV_COLUMNS.map(csvEscape).join(",")];
  events.forEach((ev) => {
    rows.push(CSV_COLUMNS.map((col) => csvEscape(ev[col])).join(","));
  });
  downloadTextFile(
    `character_timeline_events_${todayStamp()}.csv`,
    "\uFEFF" + rows.join("\r\n"),
    "text/csv;charset=utf-8;",
  );
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result.replace(/^\uFEFF/, "");
      const lines = splitCSVRows(text).filter((l) => l.trim() !== "");
      if (lines.length < 1) throw new Error("empty");

      const header = parseCSVLine(lines[0]);
      const newEvents = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i]);
        const obj = {};
        header.forEach((col, colIdx) => {
          obj[col] = cells[colIdx] !== undefined ? cells[colIdx] : "";
        });
        if (!obj.type) continue;
        newEvents.push(obj);
      }

      events = newEvents;
      render();
    } catch (err) {
      alert("CSV 파일을 읽는 중 오류가 발생했습니다.");
    }
  };
  reader.readAsText(file, "utf-8");
}

function triggerImportJSON() {
  document.getElementById("importJSONInput").click();
}
function triggerImportCSV() {
  document.getElementById("importCSVInput").click();
}

document.getElementById("importJSONInput").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importJSON(file);
  e.target.value = "";
});

document.getElementById("importCSVInput").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importCSV(file);
  e.target.value = "";
});

// 이미지 저장

async function captureTimeline() {
  const captureTarget = document.querySelector(".wrap");
  const lastEventNode = timeline.querySelector(".event:last-child");

  if (!captureTarget) return;

  closeShapePopup();
  document.body.classList.add("capturing");

  const padding = 50;
  const targetRect = captureTarget.getBoundingClientRect();
  const endRect = lastEventNode
    ? lastEventNode.getBoundingClientRect()
    : targetRect;

  const cropX = targetRect.left - padding;
  const cropY = targetRect.top - padding;
  const cropWidth = targetRect.width + padding * 2;
  const cropHeight = endRect.bottom - targetRect.top + padding * 2;

  try {
    const fullCanvas = await html2canvas(document.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fafafa",
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropWidth * 2;
    croppedCanvas.height = cropHeight * 2;
    const ctx = croppedCanvas.getContext("2d");

    ctx.drawImage(
      fullCanvas,
      cropX * 2,
      cropY * 2,
      cropWidth * 2,
      cropHeight * 2,
      0,
      0,
      cropWidth * 2,
      cropHeight * 2,
    );

    const image = croppedCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = image;
    a.download = `timeline_screenshot.png`;
    a.click();
  } catch (err) {
    console.error("캡처에 실패하였습니다.", err);
    alert("스크린샷 저장 중 오류가 발생했습니다.");
  } finally {
    document.body.classList.remove("capturing");
  }
}

// 초기 구동 실행

(function init() {
  const state = loadState();
  if (state) applyState(state);
  renderProfiles();
  render();
})();

/**
 * Character Timeline Maker - Main Application Architecture
 */

// --- Constants & Configurations ---
const STORAGE_KEY = "character_timeline_v1";

const DEFAULTS = {
  GLOBAL_FONT:
    "'PyeojinGothic', 'Pretendard', 'Noto Sans KR', sans-serif",
  NAME_FONT: "'Arvo', 'Hahmlet', serif",
  DATE_FONT:
    "'JetBrains Mono', 'Fira Code', 'D2Coding', monospace",
  COLOR_A: "#2b6e5e",
  COLOR_B: "#a8482b",
  LINE_STYLE: "solid",
  SHAPE: "circle",
  EVENTS: [
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
  ],
  PROFILES: {
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
  },
  VISIBILITY: {
    photo: true,
    name: true,
    stats: true,
    agebday: true,
    birthinfo: true,
    keywords: true,
  },
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
const DAYS_IN_MONTH = [
  0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];
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
    "repeating-linear-gradient(to bottom, var(--line) 0 .125rem, transparent .125rem .2813rem)",
  dashed:
    "repeating-linear-gradient(to bottom, var(--line) 0 .5rem, transparent .5rem .6875rem)",
  longdash:
    "repeating-linear-gradient(to bottom, var(--line) 0 1.125rem, transparent 1.125rem 1.375rem)",
  dashdot:
    "repeating-linear-gradient(to bottom, var(--line) 0 .875rem, transparent .875rem 1.25rem, var(--line) 1.25rem 1.375rem, transparent 1.375rem 1.75rem)",
  dashdotdot:
    "repeating-linear-gradient(to bottom, var(--line) 0 .875rem, transparent .875rem 1.25rem, var(--line) 1.25rem 1.375rem, transparent 1.375rem 1.75rem, var(--line) 1.75rem 1.875rem, transparent 1.875rem 2.25rem)",
};

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

const BIRTHDATA = [
  null,
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
];
const HEART_PATH =
  "M8,13.76 C3.68,10.34 1.61,7.73 1.61,5.3 C1.61,2.96 3.41,1.79 5.3,2.24 C6.56,2.56 7.64,3.68 8,4.49 C8.36,3.68 9.44,2.56 10.7,2.24 C12.59,1.79 14.39,2.96 14.39,5.3 C14.39,7.73 12.32,10.34 8,13.76 Z";

// --- Application State ---
const state = {
  events: JSON.parse(JSON.stringify(DEFAULTS.EVENTS)),
  profiles: JSON.parse(JSON.stringify(DEFAULTS.PROFILES)),
  visibility: { ...DEFAULTS.VISIBILITY },
  showBirthInfo: true,
  dragSrcIndex: null,
  openPopup: null,
  activeFormatField: null,
};

// --- DOM Cache ---
const DOM = {
  root: document.documentElement,
  timeline: document.getElementById("timeline"),
  thread: document.querySelector(".thread"),
  profiles: document.getElementById("profiles"),
  globalFontSelect: document.getElementById(
    "globalFontSelect",
  ),
  nameFontSelect: document.getElementById("nameFontSelect"),
  dateFontSelect: document.getElementById("dateFontSelect"),
  lineStyleSelect: document.getElementById(
    "lineStyleSelect",
  ),
  shapeSelect: document.getElementById("shapeSelect"),
  resetModalOverlay: document.getElementById(
    "resetModalOverlay",
  ),
  importJSONInput: document.getElementById(
    "importJSONInput",
  ),
  importCSVInput: document.getElementById("importCSVInput"),
};

// --- Utility Functions ---
const Utils = {
  formatDateToEnglish(text) {
    const match = (text || "")
      .trim()
      .match(/^(\d{1,2})[.\/-](\d{1,2})$/);
    if (!match) return text;
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31)
      return text;
    return `${MONTH_ABBR[month - 1]} ${day}`;
  },

  parseBirthday(text) {
    const match = (text || "")
      .trim()
      .match(/^(\d{1,2})[.\/-](\d{1,2})$/);
    if (!match) return null;
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > DAYS_IN_MONTH[month]
    )
      return null;
    return { month, day };
  },

  downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  todayStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  },

  cropTo3x1(file) {
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
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          outW,
          outH,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  getZodiac(m, d) {
    for (const z of ZODIAC) {
      const [fm, fd] = z.from;
      const [tm, td] = z.to;
      if (fm === tm) {
        if (m === fm && d >= fd && d <= td) return z.name;
      } else if (fm > tm) {
        if ((m === fm && d >= fd) || (m === tm && d <= td))
          return z.name;
      } else {
        if (
          (m === fm && d >= fd) ||
          (m === tm && d <= td) ||
          (m > fm && m < tm)
        )
          return z.name;
      }
    }
    return "";
  },

  getBirthData(m, d) {
    const month = BIRTHDATA[m];
    return month && month[d - 1] ? month[d - 1] : null;
  },
};

// --- Storage Manager ---
const Storage = {
  buildStateObject() {
    return {
      globalFont:
        document.body.style.fontFamily ||
        DOM.globalFontSelect.value,
      nameFont:
        getComputedStyle(DOM.root)
          .getPropertyValue("--slab-serif")
          .trim() || DOM.nameFontSelect.value,
      dateFont:
        getComputedStyle(DOM.root)
          .getPropertyValue("--monospace")
          .trim() || DOM.dateFontSelect.value,
      colorA: getComputedStyle(DOM.root)
        .getPropertyValue("--a-color")
        .trim(),
      colorB: getComputedStyle(DOM.root)
        .getPropertyValue("--b-color")
        .trim(),
      lineStyle: DOM.lineStyleSelect.value,
      events: state.events,
      profiles: state.profiles,
      showBirthInfo: state.showBirthInfo,
      visibility: state.visibility,
    };
  },

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.buildStateObject()),
      );
    } catch (e) {
      /* Safe fallback */
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
};

// --- Shape & SVG Generators ---
const ShapeFactory = {
  regularPolygon(sides, cx, cy, r, rotation) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = rotation + i * ((2 * Math.PI) / sides);
      pts.push({
        x: cx + r * Math.cos(a),
        y: cy + r * Math.sin(a),
      });
    }
    return pts;
  },

  roundedPolygonPath(points, radius) {
    const n = points.length;
    let d = "";
    for (let i = 0; i < n; i++) {
      const curr = points[i];
      const prev = points[(i - 1 + n) % n];
      const next = points[(i + 1) % n];
      const toPrev = {
        x: prev.x - curr.x,
        y: prev.y - curr.y,
      };
      const toNext = {
        x: next.x - curr.x,
        y: next.y - curr.y,
      };
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
      d +=
        (i === 0 ? "M" : "L") +
        ` ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `;
      d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
    }
    return d + "Z";
  },

  starPath(cx, cy, rOuter, rInner, points) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const a = -Math.PI / 2 + i * (Math.PI / points);
      pts.push(
        `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`,
      );
    }
    return `M ${pts.join(" L ")} Z`;
  },

  getMarkup(shape) {
    switch (shape) {
      case "square":
        return `<rect x="2.4" y="2.4" width="11.2" height="11.2" rx="3" ry="3"/>`;
      case "pentagon":
        return `<path d="${this.roundedPolygonPath(this.regularPolygon(5, 8, 8, 6.9, -Math.PI / 2), 1.6)}"/>`;
      case "hexagon":
        return `<path d="${this.roundedPolygonPath(this.regularPolygon(6, 8, 8, 6.6, 0), 1.4)}"/>`;
      case "star":
        return `<path d="${this.starPath(8, 8, 7.4, 3.2, 5)}"/>`;
      case "heart":
        return `<path d="${HEART_PATH}"/>`;
      default:
        return `<circle cx="8" cy="8" r="6.3"/>`;
    }
  },

  createDotSVG(ev, idx) {
    const shape = ev.shape || "circle";
    const inner = this.getMarkup(shape);
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
  },
};

// --- Render Engine ---
const Renderer = {
  renderEventElement(ev, idx) {
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
           </div>`
        : `<div class="content-b empty-side">-</div>`;

    wrap.innerHTML = `
      <button class="deleteBtn" data-index="${idx}" title="삭제">×</button>
      <div class="namesRow">
        ${namesA}
        ${ShapeFactory.createDotSVG(ev, idx)}
        ${namesB}
      </div>
      ${contentA}
      <span></span>
      ${contentB}
    `;

    return wrap;
  },

  renderTimeline() {
    DOM.timeline
      .querySelectorAll(".event")
      .forEach((el) => el.remove());
    state.events.forEach((ev, idx) => {
      DOM.timeline.appendChild(
        this.renderEventElement(ev, idx),
      );
    });
    Storage.save();
  },

  renderProfileCard(side) {
    const p = state.profiles[side];
    const parsed = Utils.parseBirthday(p.birthday);
    let extra = "";
    if (parsed) {
      const bd = Utils.getBirthData(
        parsed.month,
        parsed.day,
      );
      extra = bd
        ? `${Utils.getZodiac(parsed.month, parsed.day)} · ${bd[1]} · ${bd[0]} · ${bd[2]}`
        : `${Utils.getZodiac(parsed.month, parsed.day)}`;
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

    const photoBlock = state.visibility.photo
      ? `<label class="photo-upload">
          <input type="file" accept="image/*" data-side="${side}" class="profile-photo-input">
          <span class="photo-placeholder" style="${p.photo ? "display:none;" : ""}">+</span>
          <img style="${p.photo ? "display:block;" : "display:none;"}" src="${p.photo || ""}">
         </label>`
      : "";

    const nameBlock = state.visibility.name
      ? `<div class="name-line"><span contenteditable="true" data-placeholder="이름" data-side="${side}" data-field="name">${p.name}</span></div>
         <div class="name-sub"><span contenteditable="true" data-placeholder="다른 표기 (예: 영문명)" data-side="${side}" data-field="altName">${p.altName}</span></div>`
      : "";

    const statsBlock = state.visibility.stats
      ? `<div class="stat-line"><span contenteditable="true" data-placeholder="키" data-side="${side}" data-field="height">${p.height}</span><span class="stat-sep">·</span><span contenteditable="true" data-placeholder="몸무게" data-side="${side}" data-field="weight">${p.weight}</span></div>`
      : "";

    const agebdayBlock = state.visibility.agebday
      ? `<div class="agebday-line"><span contenteditable="true" data-placeholder="나이" data-side="${side}" data-field="age">${p.age}</span><span class="stat-sep">·</span><span contenteditable="true" data-placeholder="MM.DD" data-side="${side}" data-field="birthday">${p.birthday}</span></div>`
      : "";

    const birthinfoBlock =
      state.visibility.birthinfo && state.showBirthInfo
        ? `<div class="birthinfo-line">${extra}</div>`
        : "";
    const keywordsBlock = state.visibility.keywords
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
  },

  renderProfiles() {
    DOM.profiles.innerHTML =
      this.renderProfileCard("a") +
      this.renderProfileCard("b");
    Storage.save();
  },
};

// --- Floating Toolbar ---
const FormatToolbar = {
  element: null,

  init() {
    this.element = document.createElement("div");
    this.element.className = "format-toolbar";
    this.element.innerHTML = `
      <button type="button" data-cmd="bold" title="굵게"><b>B</b></button>
      <button type="button" data-cmd="italic" title="기울임"><i>I</i></button>
      <button type="button" data-cmd="underline" title="밑줄"><u>U</u></button>
    `;
    document.body.appendChild(this.element);
    this.bindEvents();
  },

  hide() {
    this.element.classList.remove("open");
    state.activeFormatField = null;
  },

  show() {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      this.hide();
      return;
    }

    const anchorNode = selection.anchorNode;
    const container =
      anchorNode && anchorNode.nodeType === 3
        ? anchorNode.parentElement
        : anchorNode;
    const field =
      container &&
      container.closest(".content-a, .content-b");
    if (!field) {
      this.hide();
      return;
    }

    state.activeFormatField = field;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      this.hide();
      return;
    }

    this.element.classList.add("open");
    const toolbarRect =
      this.element.getBoundingClientRect();
    let left =
      rect.left + rect.width / 2 - toolbarRect.width / 2;
    left = Math.max(
      8,
      Math.min(
        left,
        window.innerWidth - toolbarRect.width - 8,
      ),
    );
    const top = rect.top - toolbarRect.height - 8;

    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${(top >= 0 ? top : rect.bottom + 8) + window.scrollY}px`;
  },

  bindEvents() {
    this.element.addEventListener("mousedown", (e) =>
      e.preventDefault(),
    );
    this.element.addEventListener("click", () => {
      if (!state.activeFormatField) return;
      document.execCommand("bold", false, null);
      const idx = Number(
        state.activeFormatField.dataset.index,
      );
      const key = state.activeFormatField.dataset.field;
      if (
        idx >= 0 &&
        (key === "contentA" || key === "contentB")
      ) {
        state.events[idx][key] =
          state.activeFormatField.innerHTML.trim();
      }
    });
  },
};

// --- Application Controller ---
const App = {
  init() {
    FormatToolbar.init();
    this.loadInitialState();
    this.bindEvents();
    Renderer.renderProfiles();
    Renderer.renderTimeline();
  },

  loadInitialState() {
    const savedState = Storage.load();
    if (savedState) this.applyState(savedState);
  },

  applyState(loadedState) {
    if (!loadedState) return;
    if (loadedState.globalFont) {
      document.body.style.fontFamily =
        loadedState.globalFont;
      DOM.globalFontSelect.value = loadedState.globalFont;
    }
    if (loadedState.nameFont) {
      DOM.root.style.setProperty(
        "--slab-serif",
        loadedState.nameFont,
      );
      DOM.nameFontSelect.value = loadedState.nameFont;
    }
    if (loadedState.dateFont) {
      DOM.root.style.setProperty(
        "--monospace",
        loadedState.dateFont,
      );
      DOM.dateFontSelect.value = loadedState.dateFont;
    }
    if (loadedState.colorA) {
      DOM.root.style.setProperty(
        "--a-color",
        loadedState.colorA,
      );
      document.getElementById("colorA").value =
        loadedState.colorA;
    }
    if (loadedState.colorB) {
      DOM.root.style.setProperty(
        "--b-color",
        loadedState.colorB,
      );
      document.getElementById("colorB").value =
        loadedState.colorB;
    }
    if (loadedState.lineStyle) {
      DOM.lineStyleSelect.value = loadedState.lineStyle;
      this.applyLineStyle(loadedState.lineStyle);
    }
    if (Array.isArray(loadedState.events))
      state.events = loadedState.events;
    if (loadedState.profiles)
      state.profiles = loadedState.profiles;
    if (typeof loadedState.showBirthInfo === "boolean") {
      state.showBirthInfo = loadedState.showBirthInfo;
      document.getElementById("showBirthInfo").checked =
        state.showBirthInfo;
    }
    if (loadedState.visibility) {
      state.visibility = loadedState.visibility;
      [
        "showPhoto",
        "showName",
        "showStats",
        "showAgeBday",
        "showKeywords",
      ].forEach((id) => {
        const el = document.getElementById(id);
        const key = id.replace("show", "").toLowerCase();
        if (el) el.checked = !!state.visibility[key];
      });
    }
    this.syncBirthInfoAvailability();
  },

  syncBirthInfoAvailability() {
    const ageBdayChecked =
      document.getElementById("showAgeBday").checked;
    const birthInfoCheckbox =
      document.getElementById("showBirthInfo");
    birthInfoCheckbox.disabled = !ageBdayChecked;
    if (!ageBdayChecked) {
      birthInfoCheckbox.checked = false;
      state.showBirthInfo = false;
    }
  },

  applyLineStyle(key) {
    DOM.thread.style.background =
      LINE_PATTERNS[key] || LINE_PATTERNS.solid;
  },

  closeShapePopup() {
    if (state.openPopup) {
      state.openPopup.remove();
      state.openPopup = null;
    }
  },

  // --- CSV / JSON Import Export ---
  exportJSON() {
    Utils.downloadTextFile(
      `character_timeline_${Utils.todayStamp()}.json`,
      JSON.stringify(Storage.buildStateObject(), null, 2),
      "application/json",
    );
  },

  importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const loadedState = JSON.parse(reader.result);
        this.applyState(loadedState);
        Renderer.renderProfiles();
        Renderer.renderTimeline();
      } catch (err) {
        alert("JSON 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  },

  exportCSV() {
    const csvEscape = (val) =>
      val === undefined || val === null
        ? ""
        : /[",\n\r]/.test(String(val))
          ? `"${String(val).replace(/"/g, '""')}"`
          : String(val);
    const rows = [CSV_COLUMNS.map(csvEscape).join(",")];
    state.events.forEach((ev) =>
      rows.push(
        CSV_COLUMNS.map((col) => csvEscape(ev[col])).join(
          ",",
        ),
      ),
    );
    Utils.downloadTextFile(
      `character_timeline_events_${Utils.todayStamp()}.csv`,
      "\uFEFF" + rows.join("\r\n"),
      "text/csv;charset=utf-8;",
    );
  },

  importCSV(file) {
    const parseCSVLine = (line) => {
      const res = [];
      let cur = "",
        inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) {
          if (ch === '"') {
            line[i + 1] === '"'
              ? ((cur += '"'), i++)
              : (inQ = false);
          } else cur += ch;
        } else if (ch === '"') inQ = true;
        else if (ch === ",") {
          res.push(cur);
          cur = "";
        } else cur += ch;
      }
      res.push(cur);
      return res;
    };

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result.replace(/^\uFEFF/, "");
        const rows = [];
        let row = "",
          inQ = false;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '"') inQ = !inQ;
          if ((ch === "\n" || ch === "\r") && !inQ) {
            if (row.length > 0) rows.push(row);
            row = "";
            if (ch === "\r" && text[i + 1] === "\n") i++;
          } else row += ch;
        }
        if (row.length > 0) rows.push(row);

        const lines = rows.filter((l) => l.trim() !== "");
        if (lines.length < 1) throw new Error("empty");

        const header = parseCSVLine(lines[0]);
        const newEvents = [];
        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i]);
          const obj = {};
          header.forEach(
            (col, idx) =>
              (obj[col] =
                cells[idx] !== undefined ? cells[idx] : ""),
          );
          if (obj.type) newEvents.push(obj);
        }
        state.events = newEvents;
        Renderer.renderTimeline();
      } catch (err) {
        alert("CSV 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file, "utf-8");
  },

  async captureTimeline() {
    const captureTarget = document.querySelector(".wrap");
    const lastEventNode = DOM.timeline.querySelector(
      ".event:last-child",
    );
    if (!captureTarget) return;

    this.closeShapePopup();
    document.body.classList.add("capturing");

    const padding = 50;
    const targetRect =
      captureTarget.getBoundingClientRect();
    const endRect = lastEventNode
      ? lastEventNode.getBoundingClientRect()
      : targetRect;

    const cropX = targetRect.left - padding;
    const cropY = targetRect.top - padding;
    const cropWidth = targetRect.width + padding * 2;
    const cropHeight =
      endRect.bottom - targetRect.top + padding * 2;

    try {
      const fullCanvas = await html2canvas(document.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fafafa",
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const croppedCanvas =
        document.createElement("canvas");
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

      const a = document.createElement("a");
      a.href = croppedCanvas.toDataURL("image/png");
      a.download = `timeline_screenshot.png`;
      a.click();
    } catch (err) {
      alert("스크린샷 저장 중 오류가 발생했습니다.");
    } finally {
      document.body.classList.remove("capturing");
    }
  },

  resetAll() {
    state.events = JSON.parse(
      JSON.stringify(DEFAULTS.EVENTS),
    );
    state.profiles = JSON.parse(
      JSON.stringify(DEFAULTS.PROFILES),
    );
    state.visibility = { ...DEFAULTS.VISIBILITY };
    state.showBirthInfo = true;

    document.body.style.fontFamily = DEFAULTS.GLOBAL_FONT;
    DOM.globalFontSelect.value = DEFAULTS.GLOBAL_FONT;
    DOM.root.style.setProperty(
      "--slab-serif",
      DEFAULTS.NAME_FONT,
    );
    DOM.root.style.setProperty(
      "--monospace",
      DEFAULTS.DATE_FONT,
    );
    DOM.nameFontSelect.value = DEFAULTS.NAME_FONT;
    DOM.dateFontSelect.value = DEFAULTS.DATE_FONT;

    DOM.root.style.setProperty(
      "--a-color",
      DEFAULTS.COLOR_A,
    );
    DOM.root.style.setProperty(
      "--b-color",
      DEFAULTS.COLOR_B,
    );
    document.getElementById("colorA").value =
      DEFAULTS.COLOR_A;
    document.getElementById("colorB").value =
      DEFAULTS.COLOR_B;

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

    DOM.lineStyleSelect.value = DEFAULTS.LINE_STYLE;
    this.applyLineStyle(DEFAULTS.LINE_STYLE);
    DOM.shapeSelect.value = DEFAULTS.SHAPE;

    this.syncBirthInfoAvailability();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    Renderer.renderProfiles();
    Renderer.renderTimeline();
  },

  // --- Event Binding ---
  bindEvents() {
    // Top Bar & Actions
    document
      .getElementById("saveBtn")
      .addEventListener("click", () => {
        Storage.save();
        const btn = document.getElementById("saveBtn");
        const original = btn.textContent;
        btn.textContent = "저장됨";
        setTimeout(
          () => (btn.textContent = original),
          1200,
        );
      });
    document
      .getElementById("captureBtn")
      .addEventListener("click", () =>
        this.captureTimeline(),
      );
    document
      .getElementById("btnExportJSON")
      .addEventListener("click", () => this.exportJSON());
    document
      .getElementById("btnImportJSON")
      .addEventListener("click", () =>
        DOM.importJSONInput.click(),
      );
    document
      .getElementById("btnExportCSV")
      .addEventListener("click", () => this.exportCSV());
    document
      .getElementById("btnImportCSV")
      .addEventListener("click", () =>
        DOM.importCSVInput.click(),
      );

    DOM.importJSONInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.importJSON(file);
      e.target.value = "";
    });

    DOM.importCSVInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.importCSV(file);
      e.target.value = "";
    });

    // Reset Modal
    document
      .getElementById("resetBtn")
      .addEventListener("click", () =>
        DOM.resetModalOverlay.classList.add("open"),
      );
    document
      .getElementById("btnCancelReset")
      .addEventListener("click", () =>
        DOM.resetModalOverlay.classList.remove("open"),
      );
    document
      .getElementById("btnConfirmReset")
      .addEventListener("click", () => {
        this.resetAll();
        DOM.resetModalOverlay.classList.remove("open");
      });

    // Font Selectors
    DOM.globalFontSelect.addEventListener("change", (e) => {
      document.body.style.fontFamily = e.target.value;
      Storage.save();
    });
    DOM.nameFontSelect.addEventListener("change", (e) => {
      DOM.root.style.setProperty(
        "--slab-serif",
        e.target.value,
      );
      Storage.save();
    });
    DOM.dateFontSelect.addEventListener("change", (e) => {
      DOM.root.style.setProperty(
        "--monospace",
        e.target.value,
      );
      Storage.save();
    });

    // Color Pickers (Coloris)
    if (window.Coloris) {
      Coloris({
        el: ".coloris-input",
        theme: "polaroid",
        themeMode: "light",
        format: "hex",
        alpha: false,
        clearButton: false,
        closeButton: false,
        swatches: [],
      });
    }

    const bindColorSync = (pickerId, cssVar) => {
      const picker = document.getElementById(pickerId);
      picker.addEventListener("input", () => {
        DOM.root.style.setProperty(cssVar, picker.value);
        Storage.save();
      });
      picker.addEventListener("change", () => {
        DOM.root.style.setProperty(cssVar, picker.value);
        Storage.save();
      });
    };
    bindColorSync("colorA", "--a-color");
    bindColorSync("colorB", "--b-color");

    // Checkboxes
    document
      .getElementById("showBirthInfo")
      .addEventListener("change", (e) => {
        state.showBirthInfo = e.target.checked;
        Renderer.renderProfiles();
      });

    [
      "showPhoto:photo",
      "showName:name",
      "showStats:stats",
      "showAgeBday:agebday",
      "showKeywords:keywords",
    ].forEach((pair) => {
      const [id, key] = pair.split(":");
      document
        .getElementById(id)
        .addEventListener("change", (e) => {
          state.visibility[key] = e.target.checked;
          if (id === "showAgeBday")
            this.syncBirthInfoAvailability();
          Renderer.renderProfiles();
        });
    });

    // Add Buttons (Panel)
    document
      .getElementById("btnAddKwA")
      .addEventListener("click", () => {
        state.profiles.a.keywords.push("");
        Renderer.renderProfiles();
      });
    document
      .getElementById("btnAddKwB")
      .addEventListener("click", () => {
        state.profiles.b.keywords.push("");
        Renderer.renderProfiles();
      });

    document
      .querySelectorAll("[data-add-event]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          state.events.push({
            type: btn.dataset.addEvent,
            date: "",
            nameA: "",
            contentA: "",
            imageA: "",
            nameB: "",
            contentB: "",
            imageB: "",
            shape: DOM.shapeSelect.value,
          });
          Renderer.renderTimeline();
        });
      });

    document
      .getElementById("btnAddYear")
      .addEventListener("click", () => {
        state.events.push({ type: "year", year: "" });
        Renderer.renderTimeline();
      });

    document
      .getElementById("btnAddPhoto")
      .addEventListener("click", () => {
        state.events.push({ type: "photo", image: "" });
        Renderer.renderTimeline();
      });

    DOM.lineStyleSelect.addEventListener("change", (e) => {
      this.applyLineStyle(e.target.value);
      Storage.save();
    });

    DOM.shapeSelect.addEventListener("change", (e) => {
      const shape = e.target.value;
      state.events.forEach((ev) => {
        if (ev.type !== "year") ev.shape = shape;
      });
      Renderer.renderTimeline();
    });

    // Profiles Delegation
    DOM.profiles.addEventListener("focusout", (e) => {
      const el = e.target;
      const side = el.dataset && el.dataset.side;
      if (!side) return;

      if (el.dataset.field) {
        let text = el.textContent.trim();
        const field = el.dataset.field;
        if (
          field === "height" &&
          text &&
          !/[a-zA-Z가-힣]/.test(text)
        )
          text += "cm";
        if (
          field === "weight" &&
          text &&
          !/[a-zA-Z가-힣]/.test(text)
        )
          text += "kg";
        state.profiles[side][field] = text;
        Renderer.renderProfiles();
      } else if (el.classList.contains("kw-hash")) {
        let text = el.textContent.trim();
        if (text && !text.startsWith("#"))
          text = "#" + text;
        state.profiles[side].keywords[
          Number(el.dataset.kwidx)
        ] = text;
        Renderer.renderProfiles();
      }
    });

    DOM.profiles.addEventListener("click", (e) => {
      const del = e.target.closest(".kw-del");
      if (!del) return;
      state.profiles[del.dataset.side].keywords.splice(
        Number(del.dataset.kwidx),
        1,
      );
      Renderer.renderProfiles();
    });

    DOM.profiles.addEventListener("change", (e) => {
      const input = e.target.closest(
        ".profile-photo-input",
      );
      if (!input || !input.files || !input.files[0]) return;
      const side = input.dataset.side;
      const reader = new FileReader();
      reader.onload = () => {
        state.profiles[side].photo = reader.result;
        Renderer.renderProfiles();
      };
      reader.readAsDataURL(input.files[0]);
    });

    // Timeline Delegation & Actions
    DOM.timeline.addEventListener("click", (e) => {
      const delBtn = e.target.closest(".deleteBtn");
      if (delBtn) {
        state.events.splice(
          Number(delBtn.dataset.index),
          1,
        );
        Renderer.renderTimeline();
        return;
      }

      const imgDelBtn = e.target.closest(
        ".content-image-del",
      );
      if (imgDelBtn) {
        const idx = Number(imgDelBtn.dataset.index);
        const side = imgDelBtn.dataset.side;
        if (side === "A") state.events[idx].imageA = "";
        else if (side === "B")
          state.events[idx].imageB = "";
        else state.events[idx].image = "";
        Renderer.renderTimeline();
        return;
      }

      const dot = e.target.closest(".dot");
      if (dot) {
        e.stopPropagation();
        this.closeShapePopup();

        const idx = Number(
          dot.closest(".event").dataset.index,
        );
        const rect = dot.getBoundingClientRect();
        const popup = document.createElement("div");
        popup.className = "shape-popup";
        popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
        popup.style.left = `${rect.left + window.scrollX - 54}px`;

        SHAPES.forEach((s) => {
          const btn = document.createElement("button");
          btn.title = s.label;
          btn.innerHTML = `<svg viewBox="0 0 16 16"><g style="fill:var(--sub)">${ShapeFactory.getMarkup(s.value)}</g></svg>`;
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            state.events[idx].shape = s.value;
            this.closeShapePopup();
            Renderer.renderTimeline();
          });
          popup.appendChild(btn);
        });

        document.body.appendChild(popup);
        state.openPopup = popup;
      }
    });

    DOM.timeline.addEventListener("change", (e) => {
      const input = e.target.closest(
        ".content-photo-input",
      );
      if (!input || !input.files || !input.files[0]) return;

      const idx = Number(input.dataset.index);
      const side = input.dataset.side;
      const file = input.files[0];

      if (side === "node") {
        Utils.cropTo3x1(file).then((dataUrl) => {
          state.events[idx].image = dataUrl;
          Renderer.renderTimeline();
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (side === "A")
          state.events[idx].imageA = reader.result;
        else state.events[idx].imageB = reader.result;
        Renderer.renderTimeline();
      };
      reader.readAsDataURL(file);
    });

    DOM.timeline.addEventListener("focusout", (e) => {
      const el = e.target;
      const field = el.dataset && el.dataset.field;
      if (!field) return;

      const idx = Number(el.dataset.index);
      const text = el.textContent.trim();

      if (field === "date-left" || field === "date-right") {
        const formatted = Utils.formatDateToEnglish(text);
        state.events[idx].date = formatted;
        DOM.timeline
          .querySelectorAll(
            `[data-index="${idx}"][data-field="date-left"], [data-index="${idx}"][data-field="date-right"]`,
          )
          .forEach((twin) => {
            if (twin.textContent !== formatted)
              twin.textContent = formatted;
          });
      } else if (field === "year") {
        state.events[idx].year = text;
      } else if (
        field === "contentA" ||
        field === "contentB"
      ) {
        state.events[idx][field] = el.innerHTML.trim();
      } else {
        state.events[idx][field] = text;
      }
    });

    // Drag and Drop
    DOM.timeline.addEventListener("dragstart", (e) => {
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
      state.dragSrcIndex = Number(card.dataset.index);
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    DOM.timeline.addEventListener("dragend", (e) => {
      const card = e.target.closest(".event");
      if (card) card.classList.remove("dragging");
      DOM.timeline
        .querySelectorAll(".drop-target")
        .forEach((el) =>
          el.classList.remove("drop-target"),
        );
    });

    DOM.timeline.addEventListener("dragover", (e) => {
      e.preventDefault();
      const card = e.target.closest(".event");
      DOM.timeline
        .querySelectorAll(".drop-target")
        .forEach((el) =>
          el.classList.remove("drop-target"),
        );
      if (card) card.classList.add("drop-target");
    });

    DOM.timeline.addEventListener("drop", (e) => {
      e.preventDefault();
      const card = e.target.closest(".event");
      if (!card || state.dragSrcIndex === null) return;
      const targetIndex = Number(card.dataset.index);
      if (targetIndex === state.dragSrcIndex) return;
      const [moved] = state.events.splice(
        state.dragSrcIndex,
        1,
      );
      state.events.splice(targetIndex, 0, moved);
      state.dragSrcIndex = null;
      Renderer.renderTimeline();
    });

    // Global Key & Text Listeners
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const el = e.target;
        if (el.getAttribute("contenteditable") === "true") {
          const field = el.dataset.field;
          if (
            ![
              "nameA",
              "nameB",
              "contentA",
              "contentB",
            ].includes(field)
          ) {
            e.preventDefault();
            el.blur();
          }
        }
      }
    });

    document.addEventListener("paste", (e) => {
      const el = e.target;
      if (
        !el ||
        el.getAttribute("contenteditable") !== "true"
      )
        return;
      e.preventDefault();
      const text = (
        e.clipboardData || window.clipboardData
      ).getData("text/plain");
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

    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed)
        FormatToolbar.hide();
    });

    DOM.timeline.addEventListener("mouseup", () =>
      setTimeout(() => FormatToolbar.show(), 0),
    );
    DOM.timeline.addEventListener("keyup", () =>
      setTimeout(() => FormatToolbar.show(), 0),
    );

    document.addEventListener("mousedown", (e) => {
      if (
        !e.target.closest(
          ".format-toolbar, .content-a, .content-b",
        )
      )
        FormatToolbar.hide();
    });

    document.addEventListener("click", () =>
      this.closeShapePopup(),
    );
  },
};

// Initialize Application when DOM ready
document.addEventListener("DOMContentLoaded", () =>
  App.init(),
);

// sidebar tabs navigation
function switchTab(tabName) {
  document.querySelectorAll(".tabBtn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.tab === tabName,
    );
  });
  document
    .querySelectorAll(".tab-panel")
    .forEach((panel) => {
      panel.classList.toggle(
        "active",
        panel.id === `panel-${tabName}`,
      );
    });
}

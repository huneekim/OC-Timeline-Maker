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

let events = JSON.parse(JSON.stringify(DEFAULT_EVENTS));

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
function formatDateToEnglish(text) {
  const m = (text || "").trim().match(/^(\d{1,2})[.\/-](\d{1,2})$/);
  if (!m) return text;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return text;
  return `${MONTH_ABBR[month - 1]} ${day}`;
}

const timeline = document.getElementById("timeline");
let dragSrcIndex = null;
const STORAGE_KEY = "character_timeline_v1";

// === 특정 필드 제외하고 contenteditable Enter 줄바꿈 방지 기능 ===
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const el = e.target;
    if (el.getAttribute("contenteditable") === "true") {
      const field = el.dataset.field;
      // 허용되는 항목: 사건명(nameA, nameB), 내용(contentA, contentB)
      if (!["nameA", "nameB", "contentA", "contentB"].includes(field)) {
        e.preventDefault();
        el.blur();
      }
    }
  }
});

// === contenteditable 붙여넣기 시 서식 제거하고 텍스트만 삽입 ===
document.addEventListener("paste", function (e) {
  const el = e.target;
  if (!el || el.getAttribute("contenteditable") !== "true") return;

  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData(
    "text/plain",
  );

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  selection.deleteFromDocument();
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));

  // 커서를 붙여넣은 텍스트 끝으로 이동
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
});

// === 전체 글꼴 변경 기능 ===
const globalFontSelect = document.getElementById("globalFontSelect");
globalFontSelect.addEventListener("change", function (e) {
  document.body.style.fontFamily = e.target.value;
  saveState();
});

// === 이름 글꼴 변경 기능 ===
const nameFontSelect = document.getElementById("nameFontSelect");
nameFontSelect.addEventListener("change", function (e) {
  document.documentElement.style.setProperty("--name-font", e.target.value);
  saveState();
});

// === 날짜(MM.DD) 글꼴 변경 기능 ===
const dateFontSelect = document.getElementById("dateFontSelect");
dateFontSelect.addEventListener("change", function (e) {
  document.documentElement.style.setProperty("--date-font", e.target.value);
  saveState();
});

function buildStateObject() {
  const root = document.documentElement;
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
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/* ── 모양(shape) → SVG 경로 생성 ── */
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
    const curr = points[i],
      prev = points[(i - 1 + n) % n],
      next = points[(i + 1) % n];
    const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y };
    const toNext = { x: next.x - curr.x, y: next.y - curr.y };
    const lp = Math.hypot(toPrev.x, toPrev.y),
      ln = Math.hypot(toNext.x, toNext.y);
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
  let defs = "",
    fillAttr;

  if (ev.type === "both") {
    const gid = `grad-${idx}`;
    defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   style="stop-color:var(--a-color)"/>
      <stop offset="50%"  style="stop-color:var(--a-color)"/>
      <stop offset="50%"  style="stop-color:var(--b-color)"/>
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

function render() {
  timeline.querySelectorAll(".event").forEach((el) => el.remove());

  events.forEach((ev, idx) => {
    const wrap = document.createElement("div");
    wrap.className = `event ${ev.type}`;
    wrap.draggable = true;
    wrap.dataset.index = idx;

    if (ev.type === "year") {
      wrap.innerHTML = `
        <button class="delete-btn" data-index="${idx}" title="삭제">×</button>
        <div class="year-row">
          <span class="year-line"></span>
          <span class="year-label" contenteditable="true" data-placeholder="연도" data-index="${idx}" data-field="year">${ev.year || ""}</span>
          <span class="year-line"></span>
        </div>
      `;
      timeline.appendChild(wrap);
      return;
    }

    if (ev.type === "photo") {
      wrap.innerHTML = `
        <button class="delete-btn" data-index="${idx}" title="삭제">×</button>
        <div class="photo-node-row">
          ${
            ev.image
              ? `<div class="photo-node-image-wrap" data-index="${idx}">
                   <img src="${ev.image}" alt="">
                   <button class="content-image-del" data-index="${idx}" data-side="node" title="사진 삭제">×</button>
                 </div>`
              : `<div class="photo-node-empty">사진을 추가하세요</div>`
          }
          <label class="photo-add-btn photo-node-add-btn" title="사진 추가" draggable="false">
            🖼️
            <input type="file" accept="image/*" data-index="${idx}" data-side="node" class="content-photo-input">
          </label>
        </div>
      `;
      timeline.appendChild(wrap);
      return;
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
             <label class="photo-add-btn" title="사진 추가" draggable="false">
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
             <label class="photo-add-btn" title="사진 추가" draggable="false">
               🖼️
               <input type="file" accept="image/*" data-index="${idx}" data-side="B" class="content-photo-input">
             </label>
           </div>`
        : `<div class="content-b empty-side">-</div>`;

    wrap.innerHTML = `
      <button class="delete-btn" data-index="${idx}" title="삭제">×</button>
      <div class="names-row">
        ${namesA}
        ${dotSVG(ev, idx)}
        ${namesB}
      </div>
      ${contentA}
      <span></span>
      ${contentB}
    `;

    timeline.appendChild(wrap);
  });

  saveState();
}

timeline.addEventListener("click", (e) => {
  const delBtn = e.target.closest(".delete-btn");
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

/* 3:1 비율로 중앙 크롭하고 최대 1200x400px로 리사이즈 */
function cropTo3x1(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const MAX_W = 1200;
      const MAX_H = 400;
      const RATIO = 3; // width / height

      // 원본에서 3:1 비율로 중앙 크롭할 영역 계산
      let cropW = img.width;
      let cropH = Math.round(cropW / RATIO);
      if (cropH > img.height) {
        cropH = img.height;
        cropW = Math.round(cropH * RATIO);
      }
      const cropX = Math.round((img.width - cropW) / 2);
      const cropY = Math.round((img.height - cropH) / 2);

      // 최대 1200x400px로 제한
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

/* 내용 칸 / 노드 사진 추가 */
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

/* 인라인 수정 */
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
    // 볼드/이탤릭/밑줄 서식을 보존하기 위해 HTML로 저장
    events[idx][field] = el.innerHTML.trim();
  } else {
    events[idx][field] = text;
  }
});

/* ── 내용 텍스트 서식 툴바 (볼드/이탤릭/밑줄) ── */
const formatToolbar = document.createElement("div");
formatToolbar.className = "format-toolbar";
formatToolbar.innerHTML = `
  <button type="button" data-cmd="bold" title="굵게"><b>B</b></button>
  <button type="button" data-cmd="italic" title="기울임"><i>I</i></button>
  <button type="button" data-cmd="underline" title="밑줄"><u>U</u></button>
`;
document.body.appendChild(formatToolbar);

let activeFormatField = null;

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
  // 마우스 버튼을 누르고 있는 동안(드래그 중)에는 selectionchange가 계속 발생하므로
  // mouseup/keyup 이후에 최종 위치로 툴바를 띄운다.
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    hideFormatToolbar();
  }
});

timeline.addEventListener("mouseup", (e) => {
  if (e.target.closest(".content-a, .content-b")) {
    setTimeout(showFormatToolbarForSelection, 0);
  }
});

timeline.addEventListener("keyup", (e) => {
  if (e.target.closest(".content-a, .content-b")) {
    setTimeout(showFormatToolbarForSelection, 0);
  }
});

// 툴바 버튼 클릭 시 selection이 사라지지 않도록 mousedown에서 preventDefault
formatToolbar.addEventListener("mousedown", (e) => {
  e.preventDefault();
});

formatToolbar.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cmd]");
  if (!btn || !activeFormatField) return;

  const cmd = btn.dataset.cmd;
  document.execCommand(cmd, false, null);

  // 서식 변경 즉시 데이터에 반영
  const field = activeFormatField;
  const idx = Number(field.dataset.index);
  const key = field.dataset.field;
  if (idx >= 0 && (key === "contentA" || key === "contentB")) {
    events[idx][key] = field.innerHTML.trim();
  }
});

// 다른 곳 클릭 시 툴바 숨김
document.addEventListener("mousedown", (e) => {
  if (!e.target.closest(".format-toolbar, .content-a, .content-b")) {
    hideFormatToolbar();
  }
});

/* 드래그 앤 드롭 */
timeline.addEventListener("dragstart", (e) => {
  if (
    e.target.closest(
      '.photo-add-btn, .content-photo-input, .delete-btn, .content-image-del, .content-image-wrap, .photo-node-image-wrap, [contenteditable="true"]',
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

/* 타임라인 줄 디자인 */
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
const thread = document.querySelector(".thread");
function applyLineStyle(key) {
  thread.style.background = LINE_PATTERNS[key] || LINE_PATTERNS.solid;
}
document.getElementById("lineStyleSelect").addEventListener("change", (e) => {
  applyLineStyle(e.target.value);
  saveState();
});
applyLineStyle("solid");

/* 노드 추가 */
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

/* 노드 클릭 팝업 */
const SHAPES = [
  { value: "circle", label: "원형" },
  { value: "square", label: "둥근 사각형" },
  { value: "pentagon", label: "둥근 오각형" },
  { value: "hexagon", label: "둥근 육각형" },
  { value: "star", label: "별" },
  { value: "heart", label: "하트" },
];

let openPopup = null;
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

/* 캐릭터 색상 선택기 */
const root = document.documentElement;
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

/* ── 캐릭터 프로필 카드 ── */
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

let profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));

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
    const [fm, fd] = z.from,
      [tm, td] = z.to;
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

const BIRTHDATA = [
  null,
  [
    ["스노드롭", "임페리얼 제이드", "사과나무"],
    ["노랑 수선화", "랜드스케이프 아게이트", "전나무"],
    ["사프란", "토패저라이트", "전나무"],
    ["히아신스", "크리소콜라", "전나무"],
    ["노루귀", "골든 지르콘", "전나무"],
    ["흰제비꽃", "스타 가넷", "전나무"],
    ["튤립", "암모라이트", "전나무"],
    ["보랏빛 제비꽃", "크롬 토르마린", "전나무"],
    ["노랑 제비꽃", "하이드로 그로슐라라이트", "전나무"],
    ["회양목", "골드", "전나무"],
    ["측백나무", "스페큘러 라이트", "전나무"],
    ["스위트 알리섬", "옵시디언", "느릅나무"],
    ["수선화", "파울러라이트", "느릅나무"],
    ["시클라멘", "프레쉬 워터 펄", "느릅나무"],
    ["식물", "피죤 블러드", "느릅나무"],
    ["노랑 히아신스", "블루문 스톤", "느릅나무"],
    ["수영", "안티몬", "느릅나무"],
    ["어저귀", "로제라이트", "느릅나무"],
    ["소나무", "암블리고나이트", "느릅나무"],
    ["미나리아재비", "스노우프레이크 옵시디언", "느릅나무"],
    ["당쟁이덩굴", "피콕 컬러 오팔", "느릅나무"],
    ["이끼", "스타베릴", "느릅나무"],
    ["부들", "알렉잰드라이프 가넷", "느릅나무"],
    ["사프란", "밀키 쿼츠", "느릅나무"],
    ["점나도나물", "사도닉스", "편백나무"],
    ["미모사", "파이롭", "편백나무"],
    ["마가목", "알만다인", "편백나무"],
    ["검은미루나무", "핑크 토파즈", "편백나무"],
    ["이끼", "팬텀 크리스털", "편백나무"],
    ["매쉬메리골드", "파티컬러드 플로라이트", "편백나무"],
    ["노란 사프란", "알렉산드라이트 캣츠 아이", "편백나무"],
  ],
  [
    ["앵초", "유렉사이트", "편백나무"],
    ["모과", "콩크 펄", "편백나무"],
    ["황새냉이", "메라나이트", "편백나무"],
    ["빨간 앵초", "바이컬러 아메시스트", "미루나무"],
    ["양치", "프람 스톤", "미루나무"],
    ["바위솔", "그레이 스타 사파이어", "미루나무"],
    ["물망초", "컨곰", "미루나무"],
    ["범의귀", "루틸 레이티드 쿼츠", "미루나무"],
    ["은매화", "레드 재스퍼", "삼나무"],
    ["서향", "레드 타이거 아이", "삼나무"],
    ["멜리사", "워터원", "삼나무"],
    ["쥐꼬리망초", "옐로우 스피넬", "삼나무"],
    ["갈풀", "바이컬러 플로라이트", "삼나무"],
    ["카모밀레", "핑크 오팔", "삼나무"],
    ["삼나무", "핑크 지르콘", "삼나무"],
    ["월계수", "드라바이트", "삼나무"],
    ["야생화", "타이거 아이언", "삼나무"],
    ["미나리아재비", "오렌지 토파즈", "삼나무"],
    ["떡갈나무", "워터 드롭 쿼츠", "소나무"],
    ["칼미아", "브라운 오닉스", "소나무"],
    ["네모필라", "혼", "소나무"],
    ["무궁화", "캣츠 아이 쿼츠", "소나무"],
    ["살구꽃", "체리 핑크 루비", "소나무"],
    ["빙카", "화이트 펄", "소나무"],
    ["사향장미", "팬텀 아메시스트", "소나무"],
    ["아도니스", "골드 쿼츠", "소나무"],
    ["아라비아의 별", "큐프라이트", "소나무"],
    ["보리", "카모라트 코랄", "소나무"],
    ["아르메리아", "패러사이트", "소나무"],
  ],
  [
    ["수선화", "플로라이트", "수양버들"],
    ["미나리아재비", "쉘 오팔", "수양버들"],
    ["자운영", "핑크 베릴", "수양버들"],
    ["나무딸기", "실버", "수양버들"],
    ["수레국화", "로얄 블루 사파이어", "수양버들"],
    ["데이지", "코펄", "수양버들"],
    ["황새냉이", "아크로아이트", "수양버들"],
    ["밤꽃", "스미스소나이트", "수양버들"],
    ["낙엽송", "실버 펄", "수양버들"],
    ["느릅나무", "하울라이트", "수양버들"],
    ["씀바귀", "이네사이트", "라임나무"],
    ["수양버들", "카야사이트", "라임나무"],
    ["산옥잠화", "옐로우 다이아몬드", "라임나무"],
    ["아몬드", "컬러리스 스피넬", "라임나무"],
    ["독당근", "오렌지 문스톤", "라임나무"],
    ["박하", "로즈 쿼츠", "라임나무"],
    ["콩꽃", "다이옵테이스", "라임나무"],
    ["아스파라거스", "카올리나이트", "라임나무"],
    ["치자나무", "바이컬러 쿼츠", "라임나무"],
    ["보라색 튤립", "유클레이스", "라임나무"],
    ["벚꽃난", "아이언", "떡갈나무"],
    ["당아욱", "소그디어나이트", "개암나무"],
    ["글라디올어스", "필춰드 재스퍼", "개암나무"],
    ["금영화", "그린 쿼츠", "개암나무"],
    ["덩굴성 식물", "피치 지르콘", "개암나무"],
    ["흰앵초", "플래티넘", "개암나무"],
    ["칼세올라리아", "퍼플 지르콘", "개암나무"],
    ["꽃아카시아나무", "펑크 다이아몬드", "개암나무"],
    ["우엉", "그린 다이아몬드", "개암나무"],
    ["금작화", "엔젤 스킨 코랄", "개암나무"],
    ["흑종초", "아서클레이스", "개암나무"],
  ],
  [
    ["아몬드", "히키마 다이아몬드", "마가목"],
    ["어네모네", "셀리스타이트", "마가목"],
    ["나팔수선화", "제오라이트", "마가목"],
    ["빨강 아네모네", "젬실리카", "마가목"],
    ["무화과", "컬러리스 사파이어", "마가목"],
    ["아도니스", "블루 다이아몬드", "마가목"],
    ["공작고사리", "블라질리아나이트", "마가목"],
    ["금작화", "파파라치아 사파이어", "마가목"],
    ["벚나무", "세라사이트", "마가목"],
    ["빙카", "화이트 지르콘", "마가목"],
    ["꽃고비", "블루나이트", "단풍나무"],
    ["복사꽃", "핑크 플로라이트", "단풍나무"],
    ["페르시아 국화", "바이올렛 펄", "단풍나무"],
    ["흰나팔꽃", "컬러리스 토파즈", "단풍나무"],
    ["펜 오키드", "피콕 그린 펄", "단풍나무"],
    ["튤립", "히데나이트", "단풍나무"],
    ["독일창포", "그린 스피넬", "단풍나무"],
    ["자운영", "액서나이트", "단풍나무"],
    ["참제비고깔", "바이올렛 지르콘", "단풍나무"],
    ["배나무", "클로러멜라나이트", "단풍나무"],
    ["수양버들", "맨덜루사이트", "호두나무"],
    ["과꽃", "애스트로핖라이트", "호두나무"],
    ["도라지", "디저트 로즈", "호두나무"],
    ["제라늄", "쿤차이트", "호두나무"],
    ["중국 패모", "플라즈마", "호두나무"],
    ["논냉이", "스기라이트", "호두나무"],
    ["수련", "카넬리안", "호두나무"],
    ["빨간 앵초", "킴버라이트", "호두나무"],
    ["동백나무", "로드스톤", "호두나무"],
    ["금사슬나무", "실리마나이트", "호두나무"],
  ],
  [
    ["카우슬립 앵초", "아마조나이트", "미루나무"],
    ["미나리아재비", "옐로우 베릴", "미루나무"],
    ["민들레", "그린 지르콘", "미루나무"],
    ["딸기", "포스테라이트", "미루나무"],
    ["은방울꽃", "레드 크랄", "미루나무"],
    ["비단향나무 꽃", "아이드크레이스", "미루나무"],
    ["딸기(잎)", "클리다이트", "미루나무"],
    ["수련", "에메랄드 캣츠 아이", "미루나무"],
    ["겹벚꽃", "블랙 펄", "미루나무"],
    ["꽃창포", "로빈스 에그 블루", "미루나무"],
    ["사과", "레이스 아게이트", "미루나무"],
    ["라일락", "카콕서나이트", "미루나무"],
    ["산사나무", "아이보리", "미루나무"],
    ["매발톱꽃", "블루 그린 지르콘", "미루나무"],
    ["물망초", "레드 제나이트", "밤나무"],
    ["조팝나물", "텍타이트", "밤나무"],
    ["노랑 튤립", "퍼플 사파이어", "밤나무"],
    ["옥슬립 앵초", "고제나이트", "밤나무"],
    ["아리스타타", "노제라이트", "밤나무"],
    ["괭이밥", "자라타이트", "밤나무"],
    ["담홍색 참제비고깔", "오퍼라이즈드 우드", "밤나무"],
    ["귀고리꽃", "덴드리틱 쿼츠", "밤나무"],
    ["풀의 싹", "앤드라다이트", "밤나무"],
    ["헬리오토로프", "아듀라리아", "밤나무"],
    ["삼색제비꽃", "블루 앰버", "사시나무"],
    ["올리브나무", "코퍼", "사시나무"],
    ["데이지", "바데라이트", "사시나무"],
    ["박하", "화이트 칼세도니", "사시나무"],
    ["토끼풀", "잘로스톡", "사시나무"],
    ["보라빛 라일락", "차보라이트", "사시나무"],
    ["무룻", "스모키 쿼츠", "사시나무"],
  ],
  [
    ["장미", "컬러 체인지 사파이어", "사시나무"],
    ["빨강 매발톱꽃", "클리어 앰버", "사시나무"],
    ["아마", "페나사이트", "사시나무"],
    ["장미", "오돈라이트", "자작나무"],
    ["메리골드", "알렉산드라이트", "자작나무"],
    ["노랑 붓꽃", "실리시피어드우드", "자작나무"],
    ["슈미트티아나", "펑크 펄", "자작나무"],
    ["제스민", "새니딘", "자작나무"],
    ["스위트피", "우렉사이트", "자작나무"],
    ["수명패랭이꽃", "쿼츠", "자작나무"],
    ["중국패모", "화이트 래브라도라이트", "자작나무"],
    ["레제다 오도라타", "마베 펄", "자작나무"],
    ["디기탈리스", "우바로바이트", "자작나무"],
    ["뚜껑별꽃", "시프린", "삼나무"],
    ["카네이션", "옐로우 재스퍼", "삼나무"],
    ["튜베로즈", "블루 오팔", "삼나무"],
    ["토끼풀", "넵튜나이트", "삼나무"],
    ["백리향", "아르젠타이트", "삼나무"],
    ["장미", "블랙스타 사파이어", "삼나무"],
    ["꼬리풀", "그린 플로라이트", "삼나무"],
    ["달맞이꽃", "서펀틴", "삼나무"],
    ["가막살 나무", "선스톤", "삼나무"],
    ["접시꽃", "안욜라이트", "삼나무"],
    ["바베나", "워터 오팔", "자작나무"],
    ["나팔꽃", "말라카이트", "사과나무"],
    ["흰 라일락", "스페샤르타이트", "사과나무"],
    ["시계꽃", "리디코타이트", "사과나무"],
    ["제라늄", "블루 지르콘", "사과나무"],
    ["빨강 제라늄", "재스퍼", "사과나무"],
    ["인동", "유렉사이트 캣츠 아이", "사과나무"],
  ],
  [
    ["단양쑥부쟁이", "블러드샷 아이오라이트", "사과나무"],
    ["금어초", "배리사이트", "사과나무"],
    ["흰색 양귀비", "록 크리스탈", "사과나무"],
    ["자목련", "다이옵사이트", "사과나무"],
    ["라벤더", "아나테스", "전나무"],
    ["해바라기", "아파치 티어", "전나무"],
    ["서양까치밥나무", "스타로즈 쿼츠", "전나무"],
    ["버드푸트", "밀키 오팔", "전나무"],
    ["아이비 제라늄", "브라운 다이아몬드", "전나무"],
    ["초롱꽃", "스포듀언", "전나무"],
    ["아스포델", "크림 펄", "전나무"],
    ["좁은입배풍등", "레드 베릴", "전나무"],
    ["잡초의 꽃", "크리스 베릴", "전나무"],
    ["프록스", "쓰리컬러 플로라이트", "전나무"],
    ["들장미", "거사이트", "느릅나무"],
    ["비단향꽃무", "아이즈라이트", "느릅나무"],
    ["흰색장미", "어벤춰린", "느릅나무"],
    ["이끼 장미", "래브라도라이트 펠드스퍼", "느릅나무"],
    ["백부자", "하이드로 로드크로사이트", "느릅나무"],
    ["가지", "아쿠아마린 캣츠 아이", "느릅나무"],
    ["노랑장미", "블루 재스퍼", "느릅나무"],
    ["패랭이꽃", "블라워 옵시디언", "느릅나무"],
    ["장미", "워터메론 토르마린", "느릅나무"],
    ["연령초", "워터라이트", "느릅나무"],
    ["말오줌나무", "쉘", "느릅나무"],
    ["향쑥", "퍼실 로랄", "편백나무"],
    ["제라늄", "그레이 다이아몬드", "편백나무"],
    ["패랭이꽃", "알만다인 스피넬", "편백나무"],
    ["선인장", "블랙 오팔", "편백나무"],
    ["서양종 보리수", "에피도르", "편백나무"],
    ["호박", "레드 지르콘", "편백나무"],
  ],
  [
    ["빨간 양귀비", "시트린", "편백나무"],
    ["수레국호", "블루 쿼츠", "편백나무"],
    ["수박풀", "크리스베릴 캣츠 아이", "편백나무"],
    ["옥수수", "마카사이트", "편백나무"],
    ["앨리카", "캣츠 아이 문스톤", "미루나무"],
    ["능소화", "다크그린 지르콘", "미루나무"],
    ["석류", "옐로우 애퍼타이트", "미루나무"],
    ["진달래", "루틸", "미루나무"],
    ["시스터스", "캐커파이라이트", "미루나무"],
    ["이끼", "아이오라이트", "미루나무"],
    ["빨강무늬제라늄", "옐로우 사파이어", "미루나무"],
    ["협죽도", "칸커 아게이트", "미루나무"],
    ["골든 로드", "옐로우 지르콘", "미루나무"],
    ["저먼더", "파이어 오팔", "삼나무"],
    ["해바라기", "블루레스 아게이트", "삼나무"],
    ["타마린드", "래브라도라이트", "삼나무"],
    ["튤립나무", "파이라이트", "삼나무"],
    ["접시", "오렌지 펄", "삼나무"],
    ["로사 캠피온", "캘사이트", "삼나무"],
    ["프리지아", "스타루비", "삼나무"],
    ["짚신나불", "제트", "삼나무"],
    ["스피리아", "화이트 코랄", "삼나무"],
    ["서양종 보리수", "이오스포라이트", "삼나무"],
    ["금잔화", "러버", "소나무"],
    ["안스륨", "파이어 아게이트", "소나무"],
    ["하이포시스 오리어", "터콰이즈 블루", "소나무"],
    ["고비", "아파타이트", "소나무"],
    ["에린지움", "핑크 코랄", "소나무"],
    ["꽃담배", "캑터스 아메시스트", "소나무"],
    ["저먼더", "레인보우 옵시디언", "소나무"],
    ["토끼풀", "모스 아게이트", "소나무"],
  ],
  [
    ["호랑이꽃", "덴더나이트", "소나무"],
    ["멕시칸 아이비", "그레이 펄", "소나무"],
    ["마거리트", "레드 다이아몬드", "수양버들"],
    ["뱀무", "스핀", "수양버들"],
    ["느릅나무", "골든 펄", "수양버들"],
    ["한련", "조아사이트", "수양버들"],
    ["오렌지", "히아신스", "수양버들"],
    ["갓", "아쿠아 펄", "수양버들"],
    ["갓개매취", "아라고나이트", "수양버들"],
    ["흰색 과꽃", "댄버라이트", "수양버들"],
    ["알로에", "레인보우 플로라이트", "수양버들"],
    ["클레마티스", "파이어라이트", "수양버들"],
    ["버드나무", "골든 베릴", "라임나무"],
    ["마르멜로", "아이언 로즈", "라임나무"],
    ["다알리아", "파라이바 토르마린", "라임나무"],
    ["용담", "프레나이트", "라임나무"],
    ["에리카", "다이옵테이스", "라임나무"],
    ["엉겅퀴", "만다린 가넷", "라임나무"],
    ["사초", "래쥴라이트", "라임나무"],
    ["로즈메리", "블루 스피넬", "라임나무"],
    ["사프란", "세레나이트", "라임나무"],
    ["퀘이킹 그라스", "지르콘", "라임나무"],
    ["주목", "아메트린", "올리브나무"],
    ["오렌지", "디매토이드", "개암나무"],
    ["메귀리", "바이컬러 토르마린", "개암나무"],
    ["감", "오렌지 다이아몬드", "개암나무"],
    ["떡갈나무", "트라피체 사파이어", "개암나무"],
    ["색비름", "아메시스트 쿼츠", "개암나무"],
    ["사과", "임페리얼 토파즈", "개암나무"],
    ["삼나무", "블루스타 사파이어", "개암나무"],
  ],
  [
    ["빨강 국화", "엘바이트", "개암나무"],
    ["살구", "하이 쿼츠", "개암나무"],
    ["단풍나무", "바이올렛 다이아몬드", "개암나무"],
    ["홉", "오팔 재스퍼", "마가목"],
    ["종려나무", "라리마", "마가목"],
    ["개암나무", "크리소프레이즈", "마가목"],
    ["전나무", "로드나이트", "마가목"],
    ["파슬리", "블루 칼세도니", "마가목"],
    ["희향", "블루 오닉스", "마가목"],
    ["멜론", "토르마린 캣츠 아이", "마가목"],
    ["부처꽃", "로드 라이트", "마가목"],
    ["월귤", "파티컬러드 사파이어", "마가목"],
    ["조팝나무", "헤마타이트", "단풍나무"],
    ["흰색 국화", "트리피체 에메랄드", "단풍나무"],
    ["스위트 바즐", "어벤춰린 쿼츠", "단풍나무"],
    ["이끼장미", "화이트 오닉스", "단풍나무"],
    ["포도", "마그네타이트", "단풍나무"],
    ["넌출월귤", "블루 아게이트", "단풍나무"],
    ["빨강 봉선화", "스키라베", "단풍나무"],
    ["마", "캘커시더라이트", "단풍나무"],
    ["엉겅퀴", "쇼울", "단풍나무"],
    ["벗풀", "레피도라이트", "단풍나무"],
    ["흰독말풀", "튤라이트", "단풍나무"],
    ["매화", "인디고라이트", "호두나무"],
    ["단풍나무", "레드 스피넬", "호두나무"],
    ["수영", "타이거 아이 쿼츠", "호두나무"],
    ["들장미", "오우원", "호두나무"],
    ["무궁화", "콘플라워 블루 사파이어", "호두나무"],
    ["해당화", "메이트릭스 더콰이즈", "호두나무"],
    ["로벨리아", "핀파이어 오팔", "호두나무"],
    ["칼라", "호크아이", "호두나무"],
  ],
  [
    ["서양모과", "시나몬 스톤", "호두나무"],
    ["루피너스", "블랙 오닉스", "호두나무"],
    ["브리오니아", "골든 사파이어", "호두나무"],
    ["골고사리", "셉터 쿼츠", "호두나무"],
    ["단양쑥부쟁이", "네프라이트", "호두나무"],
    ["등골나물", "스패러라이트", "호두나무"],
    ["메리골드", "피트 앰버", "호두나무"],
    ["가는동자꽃", "레드 토파즈", "호두나무"],
    ["물약의 꽃", "토터스 쉘", "호두나무"],
    ["부용", "퍼실", "호두나무"],
    ["흰동백", "블랙 다이아몬드", "호두나무"],
    ["레몬", "바이올렛 사파이어", "밤나무"],
    ["레몬 버베나", "크리스털 오팔", "밤나무"],
    ["소나무", "라벤더 제이드", "밤나무"],
    ["황금싸리", "크림슨 코랄", "밤나무"],
    ["크리스마스 로즈", "암모나이트", "밤나무"],
    ["머위", "그린 루틸 쿼츠", "밤나무"],
    ["산나리", "암소피라이트", "밤나무"],
    ["범의귀", "블루 토파즈", "밤나무"],
    ["뷰글라스", "헤소나이트", "밤나무"],
    ["초롱꽃", "화이트 제다이트", "밤나무"],
    ["매자나무", "옐로우 오팔", "사시나무"],
    ["양치", "케시 펄", "사시나무"],
    ["가막살나무", "코발트 캘사이트", "사시나무"],
    ["개옻나무", "레드 앰버", "사시나무"],
    ["서양톱풀", "스캐포라이트", "사시나무"],
    ["붉나무", "페트리라이드 우드", "사시나무"],
    ["과꽃", "오렌지슈 브랑누 토파즈", "사시나무"],
    ["바카리스", "알랙잰드라이프 토르마린", "사시나무"],
    ["낙엽,마른풀", "스타 엔스테타이트", "사시나무"],
  ],
  [
    ["쑥국화", "아이언 오팔", "사시나무"],
    ["이끼", "블랙 코랄", "자작나무"],
    ["라벤더", "메테오라이트", "자작나무"],
    ["수영", "소더라이트", "자작나무"],
    ["앰브로시아", "엔젤라이트", "자작나무"],
    ["바위취", "엔스테타이트", "자작나무"],
    ["양치", "짚섬", "자작나무"],
    ["갈대", "루벨라이트", "자작나무"],
    ["국화", "애러배스터", "자작나무"],
    ["빨강 동백", "블루 존 플로라이트", "자작나무"],
    ["단양쑥부쟁이", "캐시터라이트", "자작나무"],
    ["목화", "소프트핑크 지르콘", "무화과나무"],
    ["자홍색 국화", "애퍼피라이트", "무화과나무"],
    ["소나무", "핑크 사파이어", "무화과나무"],
    ["서향", "트라피체 루비", "무화과나무"],
    ["오리나무", "아쥬르말라카이트", "무화과나무"],
    ["벚꽃난", "스펙트로파이트", "무화과나무"],
    ["세이지", "토르마린 레이티드 쿼츠", "무화과나무"],
    ["스노 플레이크", "화이트 오팔", "무화과나무"],
    ["파인애플", "헤미몰파이트", "무화과나무"],
    ["박하", "블랙 문스톤", "무화과나무"],
    ["백일홍", "우바이트", "호두나무"],
    ["플라타너스", "오렌지 제이드", "호두나무"],
    ["겨우살이", "스토러라이트", "호두나무"],
    ["사양호랑가시나무", "크로스스톤", "호두나무"],
    ["크리스마스 로즈", "퍼플 다이아몬드", "호두나무"],
    ["매화", "몰다바이트", "호두나무"],
    ["석류", "로드크로사이트", "호두나무"],
    ["꽈리", "파우스타이트", "호두나무"],
    ["납매", "커스머클러", "호두나무"],
    ["노송나무", "야호이트", "호두나무"],
  ],
];

function getBirthData(m, d) {
  const month = BIRTHDATA[m];
  if (!month || !month[d - 1]) return null;
  return month[d - 1];
}

const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function parseBirthday(text) {
  const m = (text || "").trim().match(/^(\d{1,2})[.\/-](\d{1,2})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10),
    day = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > DAYS_IN_MONTH[month])
    return null;
  return { month, day };
}

const profilesEl = document.getElementById("profiles");

const DEFAULT_VISIBILITY = {
  photo: true,
  name: true,
  stats: true,
  agebday: true,
  birthinfo: true,
  keywords: true,
};

let showBirthInfo = true;
let visibility = { ...DEFAULT_VISIBILITY };

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

    // 나이/생일이 꺼지면 별자리·탄생석·탄생화·탄생목도 함께 끄고, 다시 켜기 전까지 선택 불가
    if (id === "showAgeBday") {
      syncBirthInfoAvailability();
    }

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
  const side = del.dataset.side,
    idx = Number(del.dataset.kwidx);
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

function applyState(state) {
  if (!state) return;
  if (state.globalFont) {
    document.body.style.fontFamily = state.globalFont;
    const fontSelect = document.getElementById("globalFontSelect");
    if (fontSelect) fontSelect.value = state.globalFont;
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
    if (document.getElementById("showPhoto"))
      document.getElementById("showPhoto").checked = !!visibility.photo;
    if (document.getElementById("showName"))
      document.getElementById("showName").checked = !!visibility.name;
    if (document.getElementById("showStats"))
      document.getElementById("showStats").checked = !!visibility.stats;
    if (document.getElementById("showAgeBday"))
      document.getElementById("showAgeBday").checked = !!visibility.agebday;
    if (document.getElementById("showKeywords"))
      document.getElementById("showKeywords").checked = !!visibility.keywords;
  }
  syncBirthInfoAvailability();
}

(function restoreState() {
  const state = loadState();
  if (!state) return;
  applyState(state);
})();

/* ── 초기화 기능 ── */
const DEFAULT_GLOBAL_FONT =
  "'PyeojinGothic', 'Pretendard', 'Noto Sans KR', sans-serif";
const DEFAULT_NAME_FONT = "'Arvo', 'Hahmlet', serif";
const DEFAULT_DATE_FONT =
  "'JetBrains Mono', 'Fira Code', 'D2Coding', monospace";
const DEFAULT_COLOR_A = "#2b6e5e";
const DEFAULT_COLOR_B = "#a8482b";
const DEFAULT_LINE_STYLE = "solid";
const DEFAULT_SHAPE = "circle";

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

function resetAll() {
  // 1. 데이터 초기화
  events = JSON.parse(JSON.stringify(DEFAULT_EVENTS));
  profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
  visibility = { ...DEFAULT_VISIBILITY };
  showBirthInfo = true;

  // 2. 전체 글꼴
  document.body.style.fontFamily = DEFAULT_GLOBAL_FONT;
  globalFontSelect.value = DEFAULT_GLOBAL_FONT;

  // 2-1. 이름 글꼴 / 날짜 글꼴
  root.style.setProperty("--name-font", DEFAULT_NAME_FONT);
  root.style.setProperty("--date-font", DEFAULT_DATE_FONT);
  nameFontSelect.value = DEFAULT_NAME_FONT;
  dateFontSelect.value = DEFAULT_DATE_FONT;

  // 3. 캐릭터 색상
  root.style.setProperty("--a-color", DEFAULT_COLOR_A);
  root.style.setProperty("--b-color", DEFAULT_COLOR_B);
  document.getElementById("colorA").value = DEFAULT_COLOR_A;
  document.getElementById("colorAHex").value = DEFAULT_COLOR_A;
  document.getElementById("colorB").value = DEFAULT_COLOR_B;
  document.getElementById("colorBHex").value = DEFAULT_COLOR_B;

  // 4. 프로필 표시 항목 체크박스
  document.getElementById("showPhoto").checked = true;
  document.getElementById("showName").checked = true;
  document.getElementById("showStats").checked = true;
  document.getElementById("showAgeBday").checked = true;
  document.getElementById("showBirthInfo").checked = true;
  document.getElementById("showKeywords").checked = true;

  // 5. 타임라인 줄 디자인
  document.getElementById("lineStyleSelect").value = DEFAULT_LINE_STYLE;
  applyLineStyle(DEFAULT_LINE_STYLE);

  // 6. 노드 모양
  document.getElementById("shapeSelect").value = DEFAULT_SHAPE;

  // 7. 나이/생일 - 별자리 등 체크박스 활성화 상태 동기화
  syncBirthInfoAvailability();

  // 8. 저장소 비우고 다시 렌더
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* 무시 */
  }

  renderProfiles();
  render();
}

renderProfiles();
render();

/* ── 사이드바 탭 전환 ── */
function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tabName}`);
  });
}

/* ══════════════════════════════════════════
   JSON / CSV 내보내기 · 불러오기
   ══════════════════════════════════════════ */

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

/* ---- JSON 내보내기 (전체 상태: 이벤트, 프로필, 글꼴, 색상 등) ---- */
function exportJSON() {
  const state = buildStateObject();
  const json = JSON.stringify(state, null, 2);
  downloadTextFile(
    `character_timeline_${todayStamp()}.json`,
    json,
    "application/json",
  );
}

/* ---- JSON 불러오기 ---- */
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = JSON.parse(reader.result);
      applyState(state);
      renderProfiles();
      render();
    } catch (err) {
      alert("JSON 파일을 읽는 중 오류가 발생했습니다. 올바른 파일인지 확인해 주세요.");
    }
  };
  reader.readAsText(file);
}

/* ---- CSV 관련 유틸 ---- */
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

function csvEscape(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

/* 따옴표 안의 개행까지 고려해 CSV 텍스트를 행 단위로 분리 */
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

/* ---- CSV 내보내기 (타임라인 이벤트만) ---- */
function exportCSV() {
  const rows = [CSV_COLUMNS.map(csvEscape).join(",")];
  events.forEach((ev) => {
    const row = CSV_COLUMNS.map((col) => csvEscape(ev[col]));
    rows.push(row.join(","));
  });
  const csv = "\uFEFF" + rows.join("\r\n"); // BOM 포함 (엑셀 한글 깨짐 방지)
  downloadTextFile(
    `character_timeline_events_${todayStamp()}.csv`,
    csv,
    "text/csv;charset=utf-8;",
  );
}

/* ---- CSV 불러오기 (타임라인 이벤트만 교체) ---- */
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
        // 빈 문자열 필드는 제거하지 않고 그대로 두되, type만 확인
        if (!obj.type) continue;
        newEvents.push(obj);
      }

      events = newEvents;
      render();
    } catch (err) {
      alert("CSV 파일을 읽는 중 오류가 발생했습니다. 올바른 파일인지 확인해 주세요.");
    }
  };
  reader.readAsText(file, "utf-8");
}

/* ---- 파일 선택 트리거 ---- */
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

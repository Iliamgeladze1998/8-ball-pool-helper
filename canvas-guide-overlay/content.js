/*
 * Canvas Guide Overlay v2 — improved UI/UX for manual practice
 * All manual. No game data reading. Keyboard-first interaction.
 */
(() => {
  "use strict";
  if (window.__canvasGuideOverlayLoaded) return;
  window.__canvasGuideOverlayLoaded = true;

  let enabled = false;
  let mode = "idle"; // idle | table | aim
  let maxBounces = 3;
  let snapAngle = false;
  let snapEdge = true; // snap table rectangle to nearest edges

  // Geometry state
  let table = null;
  let dragStart = null;
  let origin = null;
  let aimPoint = null;
  const lockedRays = [];

  // Colors optimized for dark pool table visibility
  const C = {
    aim: "#00f0ff",      // bright cyan
    aimGlow: "rgba(0,240,255,0.45)",
    locked: "#ffeb3b",   // bright yellow
    lockedGlow: "rgba(255,235,59,0.45)",
    table: "#00ff88",    // neon green
    tableGlow: "rgba(0,255,136,0.3)",
    angleArc: "rgba(255,255,255,0.3)",
    text: "#ffffff",
    textShadow: "rgba(0,0,0,0.9)",
    bg: "rgba(12,12,18,0.92)"
  };

  // ---- Overlay -----------------------------------------------------------
  const root = document.createElement("div");
  root.id = "cgo-root";
  root.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;pointer-events:none;display:none;";

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
  root.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ---- Compact floating toolbar ------------------------------------------
  const bar = document.createElement("div");
  bar.id = "cgo-bar";
  bar.style.cssText =
    "position:fixed;top:10px;left:10px;z-index:1000000;pointer-events:auto;" +
    "font:12px/1 system-ui,-apple-system,sans-serif;" +
    "background:" + C.bg + ";color:#f0f0f5;border:1px solid #2a2a35;" +
    "border-radius:12px;padding:8px 10px;display:none;user-select:none;" +
    "box-shadow:0 8px 30px rgba(0,0,0,.6);backdrop-filter:blur(6px);" +
    "min-width:210px;";

  bar.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">
      <span style="font-weight:700;font-size:13px;letter-spacing:.3px;">8 Ball Pool Helper</span>
      <div style="display:flex;gap:4px;">
        <button data-act="help" title="Show/hide instructions" style="background:#1a1a24;border:1px solid #3a3a48;color:#a0a0b0;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;">?</button>
        <span style="font-size:10px;opacity:.5;background:#1a1a24;border-radius:4px;padding:2px 5px;">Alt+G</span>
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:7px;">
      <button data-act="table" title="Define table rectangle [T]">Table [T]</button>
      <button data-act="aim" title="Draw aim line [A]">Aim [A]</button>
      <button data-act="undo" title="Undo last line [U]">&larr; [U]</button>
      <button data-act="clear" title="Clear all [C]">Clr [C]</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:5px;">
      <label style="font-size:11px;display:flex;align-items:center;gap:4px;flex:1;">
        Bounces
        <input data-act="bounces" type="range" min="0" max="10" value="3" style="width:60px;cursor:pointer;">
        <span data-act="bnum" style="min-width:16px;text-align:right;font-variant-numeric:tabular-nums;">3</span>
      </label>
      <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;" title="Snap aim to 15° increments">
        <input data-act="snap" type="checkbox" style="cursor:pointer;"> Snap
      </label>
    </div>
    <label style="font-size:11px;display:flex;align-items:center;gap:4px;margin-bottom:4px;">
      Opacity
      <input data-act="opacity" type="range" min="20" max="100" value="100" style="flex:1;cursor:pointer;">
      <span data-act="onum" style="min-width:28px;text-align:right;font-variant-numeric:tabular-nums;">100%</span>
    </label>
    <div data-act="readout" style="font-size:11px;color:#a0a0b0;min-height:32px;line-height:1.4;"></div>
    <!-- Help Panel -->
    <div data-act="help-panel" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid #2a2a35;font-size:11px;line-height:1.5;color:#c0c0d0;">
      <div style="font-weight:700;color:#8ec5ff;margin-bottom:4px;">Quick Guide</div>
      <div><b style="color:#00f0ff;">1.</b> Press <b>T</b>, then drag to draw the <b>table rectangle</b> around the pool table.</div>
      <div><b style="color:#00f0ff;">2.</b> Press <b>A</b>, click on the <b>cue ball</b> to set origin.</div>
      <div><b style="color:#00f0ff;">3.</b> Move mouse to aim — the line reflects off cushions.</div>
      <div><b style="color:#00f0ff;">4.</b> Click again to <b>lock</b> the line. Press <b>L</b> also locks.</div>
      <div><b style="color:#00f0ff;">5.</b> Hold <b>Shift</b> to snap angle to 15° increments.</div>
      <div style="margin-top:4px;opacity:.7;font-size:10px;">Shortcuts: T=Table | A=Aim | L=Lock | U=Undo | C=Clear | Esc=Exit mode</div>
    </div>`;

  const readout = () => bar.querySelector('[data-act="readout"]');

  function btnStyle() {
    bar.querySelectorAll("button").forEach((b) => {
      const isActive = b.dataset.act === mode;
      b.style.cssText =
        "cursor:pointer;background:" + (isActive ? "#2a4060" : "#1e1e28") +
        ";color:" + (isActive ? "#8ec5ff" : "#c0c0d0") +
        ";border:1px solid " + (isActive ? "#4a7ac0" : "#3a3a48") +
        ";border-radius:6px;padding:4px 8px;font:inherit;font-size:11px;transition:all .12s;";
    });
  }

  // ---- sizing ------------------------------------------------------------
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  // ---- geometry ----------------------------------------------------------
  function castRay(o, d, rect, bounces) {
    const pts = [{ x: o.x, y: o.y }];
    let cur = { x: o.x, y: o.y };
    let dir = norm(d);
    const eps = 1e-6;
    for (let i = 0; i <= bounces; i++) {
      let tx = Infinity, ty = Infinity;
      if (dir.x > eps) tx = (rect.maxX - cur.x) / dir.x;
      else if (dir.x < -eps) tx = (rect.minX - cur.x) / dir.x;
      if (dir.y > eps) ty = (rect.maxY - cur.y) / dir.y;
      else if (dir.y < -eps) ty = (rect.minY - cur.y) / dir.y;
      const t = Math.min(tx, ty);
      if (!isFinite(t) || t <= eps) break;
      const hit = { x: cur.x + dir.x * t, y: cur.y + dir.y * t };
      pts.push(hit);
      if (i === bounces) break;
      if (tx < ty) dir = { x: -dir.x, y: dir.y };
      else dir = { x: dir.x, y: -dir.y };
      cur = { x: hit.x + dir.x * 1e-3, y: hit.y + dir.y * 1e-3 };
    }
    return pts;
  }

  const norm = (v) => {
    const m = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / m, y: v.y / m };
  };

  function snapDir(d) {
    if (!snapAngle) return d;
    const snap = 15 * (Math.PI / 180);
    let a = Math.atan2(d.y, d.x);
    a = Math.round(a / snap) * snap;
    return { x: Math.cos(a), y: Math.sin(a) };
  }

  function angleDeg(d) {
    let a = (Math.atan2(-d.y, d.x) * 180) / Math.PI;
    if (a < 0) a += 360;
    return a.toFixed(1);
  }

  function dist(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y).toFixed(0);
  }

  // ---- rendering ---------------------------------------------------------
  function drawTable(r) {
    if (!r) return;
    ctx.save();
    ctx.strokeStyle = C.table;
    ctx.setLineDash([10, 6]);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = C.tableGlow;
    ctx.shadowBlur = 12;
    ctx.strokeRect(r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY);
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(0,255,136,0.12)";
    ctx.fillRect(r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY);
    // corner markers
    ctx.fillStyle = C.table;
    const s = 5;
    [[r.minX, r.minY], [r.maxX, r.minY], [r.minX, r.maxY], [r.maxX, r.maxY]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPolyline(pts, color, glowColor, width) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // bounce diamonds
    ctx.fillStyle = "#fff";
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y - 5);
      ctx.lineTo(pts[i].x + 5, pts[i].y);
      ctx.lineTo(pts[i].x, pts[i].y + 5);
      ctx.lineTo(pts[i].x - 5, pts[i].y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAngleArc(o, target) {
    let a1 = 0;
    let a2 = Math.atan2(target.y - o.y, target.x - o.x);
    ctx.save();
    ctx.strokeStyle = C.angleArc;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(o.x, o.y, 28, a1, a2, a2 < a1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function dot(p, color, r = 6) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    // inner hole
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function crosshair(p, color, size = 16) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(p.x - size, p.y); ctx.lineTo(p.x + size, p.y);
    ctx.moveTo(p.x, p.y - size); ctx.lineTo(p.x, p.y + size);
    ctx.stroke();
    // circle ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLabel(text, x, y, align = "left") {
    ctx.save();
    ctx.font = "bold 12px system-ui,sans-serif";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.textShadow;
    ctx.fillText(text, x + 1, y + 1);
    ctx.fillStyle = C.text;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function rayPoints(o, target) {
    let dir = norm({ x: target.x - o.x, y: target.y - o.y });
    dir = snapDir(dir);
    if (table) return { pts: castRay(o, dir, table, maxBounces), dir };
    const far = { x: o.x + dir.x * 9999, y: o.y + dir.y * 9999 };
    return { pts: [o, far], dir };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTable(table);
    if (dragStart && aimPoint && mode === "table") {
      drawTable(rectFrom(dragStart, aimPoint));
    }
    // locked rays
    for (const r of lockedRays) {
      const { pts } = rayPoints(r.origin, { x: r.origin.x + r.dir.x, y: r.origin.y + r.dir.y });
      drawPolyline(pts, C.locked, C.lockedGlow, 3);
      dot(r.origin, C.locked, 7);
      crosshair(r.origin, "rgba(255,235,59,0.5)", 10);
    }
    // active aim
    if (mode === "aim" && origin && aimPoint) {
      const { pts, dir } = rayPoints(origin, aimPoint);
      drawPolyline(pts, C.aim, C.aimGlow, 3);
      dot(origin, C.aim, 7);
      crosshair(origin, "rgba(0,240,255,0.5)", 10);
      drawAngleArc(origin, aimPoint);
      // labels near origin
      const sn = snapAngle ? " [SNAP]" : "";
      const dPx = dist(origin, aimPoint);
      readout().innerHTML =
        `<span style="color:#00f0ff;font-weight:700;">${angleDeg(dir)}&deg;</span>${sn}` +
        `<br><span style="opacity:.7;">distance ${dPx}px &bull; ${pts.length - 1} segment${pts.length - 1 !== 1 ? "s" : ""}</span>`;
    } else if (mode === "idle") {
      readout().innerHTML = `<span style="opacity:.6;">${lockedRays.length} line${lockedRays.length !== 1 ? "s" : ""} locked</span>`;
    }
  }

  function rectFrom(a, b) {
    return {
      minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y),
      maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y),
    };
  }

  // ---- pointer-events toggle ---------------------------------------------
  function setPointerEvents(active) {
    root.style.pointerEvents = active ? "auto" : "none";
    // visual cursor feedback
    canvas.style.cursor = active ? "crosshair" : "default";
  }

  // ---- interaction -------------------------------------------------------
  function pos(e) { return { x: e.clientX, y: e.clientY }; }

  function setMode(m) {
    mode = mode === m ? "idle" : m;
    dragStart = null;
    if (mode === "aim") origin = null;
    setPointerEvents(mode !== "idle");
    btnStyle();
    if (mode === "idle") {
      readout().innerHTML = `<span style="opacity:.6;">${lockedRays.length} line${lockedRays.length !== 1 ? "s" : ""} locked</span>`;
    }
    draw();
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) return;
    const p = pos(e);
    if (mode === "table") { dragStart = p; aimPoint = p; }
    else if (mode === "aim") {
      if (!origin) { origin = p; aimPoint = p; }
      else {
        const dir = norm({ x: p.x - origin.x, y: p.y - origin.y });
        lockedRays.push({ origin: { ...origin }, dir });
        origin = null;
        // stay in aim mode for rapid-fire multiple lines
        readout().innerHTML = `<span style="opacity:.6;">${lockedRays.length} line${lockedRays.length !== 1 ? "s" : ""} locked &bull; click to draw next</span>`;
      }
    }
    draw();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (mode === "idle") return;
    aimPoint = pos(e);
    draw();
  });

  canvas.addEventListener("mouseup", (e) => {
    if (mode === "table" && dragStart) {
      table = rectFrom(dragStart, pos(e));
      dragStart = null;
      setMode("idle");
      readout().innerHTML = `<span style="color:#00ff88;">Table set!</span>`;
    }
  });

  canvas.addEventListener("contextmenu", (e) => {
    if (mode === "idle") return;
    e.preventDefault();
    if (mode === "aim" && origin) { origin = null; draw(); }
    else { setMode("idle"); }
  });

  // ---- help panel --------------------------------------------------------
  const helpPanel = () => bar.querySelector('[data-act="help-panel"]');
  let helpVisible = false;
  function toggleHelp() {
    helpVisible = !helpVisible;
    helpPanel().style.display = helpVisible ? "block" : "none";
    localStorage.setItem("cgo_help_seen", "1");
  }

  // ---- keyboard shortcuts ------------------------------------------------
  window.addEventListener("keydown", (e) => {
    if (!enabled) return;
    const k = e.key.toLowerCase();
    if (e.key === "Shift") { snapAngle = true; draw(); return; }
    if (e.key === "Escape") { setMode("idle"); return; }
    if (k === "t") { e.preventDefault(); setMode("table"); return; }
    if (k === "a") { e.preventDefault(); setMode("aim"); return; }
    if (k === "c") { e.preventDefault(); table = null; origin = null; lockedRays.length = 0; setMode("idle"); return; }
    if (k === "u") { e.preventDefault(); if (lockedRays.length) { lockedRays.pop(); draw(); } return; }
    if (k === "h") { e.preventDefault(); toggleHelp(); return; }
    if (k === "l" && mode === "aim" && origin && aimPoint) {
      e.preventDefault();
      const dir = norm({ x: aimPoint.x - origin.x, y: aimPoint.y - origin.y });
      lockedRays.push({ origin: { ...origin }, dir });
      origin = null;
      draw();
      return;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") { snapAngle = false; draw(); }
  });

  // ---- toolbar wiring ----------------------------------------------------
  bar.addEventListener("click", (e) => {
    const act = e.target?.dataset?.act;
    if (act === "table") setMode("table");
    else if (act === "aim") setMode("aim");
    else if (act === "clear") { table = null; origin = null; lockedRays.length = 0; setMode("idle"); }
    else if (act === "undo") { if (lockedRays.length) { lockedRays.pop(); draw(); } }
    else if (act === "help") toggleHelp();
  });
  bar.addEventListener("input", (e) => {
    const act = e.target?.dataset?.act;
    if (act === "bounces") {
      maxBounces = +e.target.value;
      bar.querySelector('[data-act="bnum"]').textContent = maxBounces;
      draw();
    } else if (act === "opacity") {
      const v = e.target.value;
      root.style.opacity = v / 100;
      bar.querySelector('[data-act="onum"]').textContent = v + "%";
    } else if (act === "snap") {
      snapAngle = e.target.checked;
      draw();
    }
  });

  // ---- enable / disable --------------------------------------------------
  function setEnabled(on) {
    enabled = on;
    root.style.display = on ? "block" : "none";
    bar.style.display = on ? "block" : "none";
    if (on) {
      resize(); btnStyle();
      // Auto-show help on first use
      if (!localStorage.getItem("cgo_help_seen")) {
        helpVisible = true;
        helpPanel().style.display = "block";
      }
    } else { setMode("idle"); }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === "toggle") setEnabled(!enabled);
  });

  window.addEventListener("resize", () => { if (enabled) resize(); });

  // ---- mount into body ---------------------------------------------------
  function mount() {
    if (document.body) {
      document.body.appendChild(root);
      document.body.appendChild(bar);
    } else {
      setTimeout(mount, 50);
    }
  }
  mount();
})();

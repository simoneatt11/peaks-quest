/* Peaks Quest · game logic. Copy lives in content.js. */
(function () {
  "use strict";

  var CFG = window.CONFIG;
  var TXT = window.CONTENT;
  var M = TXT.missions;
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = { avatar: "founderM", type: "spinoff", done: [], skipped: [], screen: "start", missionOpen: -1 };

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (html != null) n.innerHTML = html;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    return n;
  }
  /* Resolve flavour text: string or {spinoff, sme}, with {place}/{product}/{company} tokens. */
  function t(x, vars) {
    if (x && typeof x === "object" && !Array.isArray(x)) x = x[state.type];
    var f = TXT.FLAVOUR[state.type];
    return String(x).replace(/\{(\w+)\}/g, function (m, k) {
      if (vars && k in vars) return vars[k];
      return k in f ? f[k] : m;
    });
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function shake(node) {
    node.classList.remove("shake"); void node.offsetWidth; node.classList.add("shake");
  }
  function lines() { return TXT.lines[TXT.avatars[state.avatar].lines]; }
  function doneCount() { return state.done.filter(Boolean).length; }
  function activeIndex() { for (var i = 0; i < 8; i++) if (!state.done[i]) return i; return 8; }

  /* ---------- avatars (procedural SVG, 80x80 viewBox, feet at y≈74) ---------- */
  function avatarSVG(kind, opts) {
    opts = opts || {};
    var legs = '<g class="leg leg-l"><line class="ln" x1="35" y1="58" x2="35" y2="74"/></g>' +
               '<g class="leg leg-r"><line class="ln" x1="45" y1="58" x2="45" y2="74"/></g>';
    var body = "";
    if (kind === "founderM") {
      body = '<rect class="acc-green" x="27" y="34" width="26" height="26" rx="5"/>' +
             '<line class="ln" x1="40" y1="35" x2="40" y2="46"/>' +
             '<circle class="face" cx="40" cy="22" r="11"/>' +
             '<path class="hair" d="M29 21 Q29 9.5 40 10 Q51 9.5 51 21 Q47 15 40 16 Q33 15 29 21Z"/>' +
             '<circle class="ink" cx="36" cy="23" r="1.3"/><circle class="ink" cx="44" cy="23" r="1.3"/>' +
             '<path class="ln" d="M37 28 Q40 29.5 43 28"/>';
    } else if (kind === "founderF") {
      body = '<path class="hair" d="M27.5 25 Q26 9 40 9 Q54 9 52.5 25 L54 36 L26 36Z"/>' +
             '<path class="acc-pink" d="M33 34 L47 34 L53 60 L27 60Z"/>' +
             '<circle class="face" cx="40" cy="22" r="10.5"/>' +
             '<path class="hair" d="M29.5 20 Q32 11 40 11.5 Q48 11 50.5 20 Q44 16 40 13.5 Q36 17 29.5 20Z"/>' +
             '<circle class="ink" cx="36" cy="23" r="1.3"/><circle class="ink" cx="44" cy="23" r="1.3"/>' +
             '<path class="ln" d="M37 28 Q40 29.5 43 28"/>';
    } else {
      body = '<g class="antenna"><line class="ln" x1="40" y1="13" x2="40" y2="4"/><circle class="acc-orange" cx="40" cy="3.5" r="2.6"/></g>' +
             '<rect class="acc-orange" x="30" y="36" width="20" height="23" rx="2"/>' +
             '<rect class="ln" x="35" y="41" width="10" height="8" rx="1" style="stroke-width:1.4"/>' +
             '<rect class="face" x="26" y="13" width="28" height="22" rx="3"/>' +
             '<circle class="ink" cx="34" cy="23.5" r="3"/><circle class="face" cx="46" cy="22.5" r="2.2" style="stroke-width:1.6"/>' +
             '<line class="ln" x1="34" y1="30" x2="45" y2="29" style="stroke-width:1.6"/>';
      if (!opts.noThink) {
        body += '<g class="think"><circle class="think" cx="57" cy="13" r="1.6"/><circle class="think" cx="61" cy="9" r="2.4"/>' +
                '<ellipse class="think" cx="70" cy="4" rx="9" ry="6"/><text class="dots" x="70" y="6" text-anchor="middle">…</text></g>';
      }
    }
    return '<g class="figure">' + legs + '<g class="torso">' + body + "</g></g>";
  }
  function avatarSVGEl(kind, cls, opts) {
    return '<svg class="av ' + (cls || "") + '" viewBox="0 -4 80 84" aria-hidden="true">' +
      '<g class="' + (reduceMotion ? "" : "bob") + '">' + avatarSVG(kind, opts) + "</g></svg>";
  }

  /* ---------- screens ---------- */
  function show(name) {
    ["start", "avatar", "map", "finish"].forEach(function (s) { $("screen-" + s).hidden = s !== name; });
    state.screen = name;
    $("health").hidden = name !== "map";
    if (name === "map") startLoop(); else stopLoop();
    window.scrollTo(0, 0);
  }

  function initStatic() {
    var s = TXT.start;
    $("start-h").textContent = s.headline;
    $("start-sub").textContent = s.subline;
    $("btn-start").textContent = s.button;
    $("start-link").textContent = s.footer;
    $("start-link").href = CFG.SITE_URL;
    $("btn-start").addEventListener("click", function () { show("avatar"); $("avatar-grid").querySelector("[aria-checked=true]").focus(); });

    var a = TXT.avatarScreen;
    $("avatar-label").textContent = a.label;
    $("avatar-h").textContent = a.headline;
    $("type-label").textContent = a.typeQuestion;
    $("btn-go").textContent = a.button;
    buildAvatarPicker();
    buildTypePicker();
    $("btn-go").addEventListener("click", startGame);

    $("health-label").textContent = TXT.map.health;
    $("map-hint").textContent = TXT.map.hint;
    $("btn-next").addEventListener("click", walkToNext);

    var mm = TXT.mission;
    $("m-close").textContent = mm.close;
    $("m-skip").textContent = mm.skip;
    $("m-continue").textContent = mm.continue;
    $("m-irl-label").textContent = mm.irlLabel;
    $("m-close").addEventListener("click", closeMission);
    $("backdrop").addEventListener("click", closeMission);
    $("m-skip").addEventListener("click", skipMission);
    $("m-continue").addEventListener("click", continueMission);

    var f = TXT.finish;
    $("finish-label").textContent = f.label;
    $("finish-h").textContent = f.headline;
    $("finish-summary").textContent = f.summary;
    $("btn-book").textContent = f.book;
    $("btn-book").href = "mailto:" + CFG.CONTACT_EMAIL + "?subject=" + encodeURIComponent(CFG.MAILTO_SUBJECT);
    $("btn-visit").textContent = f.visit;
    $("btn-visit").href = CFG.SITE_URL;
    $("btn-follow").textContent = f.follow;
    $("btn-follow").href = CFG.LINKEDIN_URL;
    $("qr-label").textContent = f.qrLabel;
    $("qr-url").textContent = CFG.SITE_URL.replace(/^https?:\/\//, "");
    $("btn-again").textContent = f.again;
    $("finish-legal").textContent = f.legal;
    $("btn-again").addEventListener("click", function () { show("avatar"); });
  }

  /* Radio-group pattern: click or arrow keys */
  function radioGroup(container, items, getVal, setVal) {
    container.innerHTML = "";
    items.forEach(function (it) {
      var b = it.node;
      b.setAttribute("role", "radio");
      b.addEventListener("click", function () { setVal(it.value); sync(); });
      container.appendChild(b);
    });
    container.addEventListener("keydown", function (e) {
      var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      var idx = items.findIndex(function (it) { return it.value === getVal(); });
      var next = items[(idx + keys[e.key] + items.length) % items.length];
      setVal(next.value); sync(); next.node.focus();
    });
    function sync() {
      items.forEach(function (it) {
        var on = it.value === getVal();
        it.node.setAttribute("aria-checked", on ? "true" : "false");
        it.node.tabIndex = on ? 0 : -1;
      });
    }
    sync();
  }

  function buildAvatarPicker() {
    var items = Object.keys(TXT.avatars).map(function (k) {
      var a = TXT.avatars[k];
      var b = el("button", { class: "avatar-card", type: "button", "data-avatar": k, "aria-label": a.name + ", " + a.tag + ". " + a.blurb });
      b.innerHTML = avatarSVGEl(k) + '<span><span class="name">' + a.name + '</span><span class="label tag">' + a.tag +
        '</span><span class="blurb">' + a.blurb + "</span></span>";
      return { node: b, value: k };
    });
    radioGroup($("avatar-grid"), items, function () { return state.avatar; }, function (v) { state.avatar = v; });
  }
  function buildTypePicker() {
    var types = TXT.avatarScreen.types;
    var items = Object.keys(types).map(function (k) {
      return { node: el("button", { type: "button", "data-type": k, text: types[k] }), value: k };
    });
    radioGroup($("type-seg"), items, function () { return state.type; }, function (v) { state.type = v; });
  }

  /* ---------- map ---------- */
  var W = 360, H = 730;
  var START = { x: 180, y: 708 };
  var GATE = { x: 180, y: 50 };
  var STATIONS = [];
  for (var i = 0; i < 8; i++) STATIONS.push({ x: i % 2 === 0 ? 62 : 298, y: 642 - i * 76 });
  var COLORS = { green: "var(--green)", orange: "var(--orange)", pink: "var(--pink)", purple: "var(--purple)" };

  var player = { x: START.x, y: START.y, target: null, onArrive: null, moving: false, phase: 0 };
  var mapEls = {};
  var armed = true; /* station trigger re-arms once the player leaves its radius */

  function curve(a, b) {
    var my = (a.y + b.y) / 2;
    return "M" + a.x + " " + a.y + " C" + a.x + " " + my + " " + b.x + " " + my + " " + b.x + " " + b.y;
  }

  function buildMap() {
    var map = $("map");
    map.innerHTML = "";
    /* faint texture: outline circles and squares, plus a big two-peak line */
    var tex = svg("g", { "aria-hidden": "true" });
    [["circle", { cx: 300, cy: 690, r: 46 }], ["circle", { cx: 40, cy: 250, r: 30 }], ["rect", { x: 150, y: 300, width: 56, height: 56 }],
     ["circle", { cx: 180, cy: 520, r: 18 }], ["rect", { x: 300, y: 180, width: 26, height: 26 }],
     ["path", { d: "M0 300 L95 140 L170 240 L250 90 L360 300" }]].forEach(function (s) {
      var n = svg(s[0], s[1]); n.setAttribute("class", "tex"); tex.appendChild(n);
    });
    map.appendChild(tex);

    /* trail segments: into station i (0..7) and into the gate (8) */
    mapEls.trails = [];
    var pts = [START].concat(STATIONS, [GATE]);
    for (var s = 0; s < 9; s++) {
      var p = svg("path", { d: curve(pts[s], pts[s + 1]), class: "trail" });
      map.appendChild(p); mapEls.trails.push(p);
    }
    map.appendChild(svg("circle", { cx: START.x, cy: START.y, r: 6, class: "start-dot" }));

    /* gate */
    var g = svg("g", { class: "gate", role: "button", tabindex: "0", "aria-label": TXT.map.finishLabel });
    g.appendChild(svg("circle", { cx: GATE.x, cy: GATE.y, r: 22, class: "pulse" }));
    g.appendChild(svg("path", { class: "post", d: "M156 64 L156 36 M204 64 L204 36 M152 36 L166 20 L176 30 L188 14 L208 36" }));
    var gl = svg("text", { x: GATE.x, y: 78, class: "glabel" }); gl.textContent = TXT.map.finishLabel;
    g.appendChild(gl);
    g.addEventListener("click", function (e) { e.stopPropagation(); tapGate(); });
    g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapGate(); } });
    map.appendChild(g); mapEls.gate = g;

    /* stations */
    mapEls.stations = STATIONS.map(function (st, idx) {
      var m = M[idx], left = st.x < W / 2;
      var grp = svg("g", { class: "station", role: "button", tabindex: "0", "data-station": idx, style: "--c:" + COLORS[m.color] });
      grp.appendChild(svg("rect", { class: "hit", x: left ? st.x - 26 : st.x - 200, y: st.y - 26, width: 226, height: 52 }));
      grp.appendChild(svg("circle", { class: "pulse", cx: st.x, cy: st.y, r: 17 }));
      grp.appendChild(svg("circle", { class: "focus", cx: st.x, cy: st.y, r: 23 }));
      grp.appendChild(svg("circle", { class: "dot", cx: st.x, cy: st.y, r: 17 }));
      var n = svg("text", { class: "num", x: st.x, y: st.y + 0.5 }); n.textContent = pad2(idx + 1); grp.appendChild(n);
      grp.appendChild(svg("path", { class: "check", d: "M" + (st.x - 6) + " " + st.y + " l4 4.5 l8 -9" }));
      var lx = left ? st.x + 28 : st.x - 28, anchor = left ? "start" : "end";
      var tg = svg("text", { class: "tag", x: lx, y: st.y - 5, "text-anchor": anchor }); tg.textContent = m.tag; grp.appendChild(tg);
      var ac = svg("text", { class: "act", x: lx, y: st.y + 11, "text-anchor": anchor }); ac.textContent = m.action; grp.appendChild(ac);
      grp.addEventListener("click", function (e) { e.stopPropagation(); tapStation(idx); });
      grp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapStation(idx); } });
      map.appendChild(grp);
      return grp;
    });

    /* player */
    var pl = svg("g", { id: "player", "aria-hidden": "true" });
    pl.innerHTML = '<ellipse cx="0" cy="1" rx="9" ry="2.6" fill="rgba(20,20,15,.12)"/>' +
      '<g class="av" transform="translate(-24,-44.4) scale(0.6)">' + avatarSVG(state.avatar) + "</g>";
    map.appendChild(pl);
    mapEls.player = pl;
    mapEls.legL = pl.querySelector(".leg-l");
    mapEls.legR = pl.querySelector(".leg-r");
    mapEls.torso = pl.querySelector(".torso");

    map.onpointerdown = onPointerDown;
  }

  function refreshMap() {
    var act = activeIndex(), n = doneCount();
    mapEls.stations.forEach(function (g, idx) {
      var m = M[idx], status;
      g.classList.toggle("done", !!state.done[idx]);
      g.classList.toggle("skipped", state.skipped[idx] === true);
      g.classList.toggle("active", idx === act);
      status = state.done[idx] ? "done" : idx === act ? "next, tap to walk there" : "locked";
      g.setAttribute("aria-label", "Station " + pad2(idx + 1) + ", " + m.module + ": " + m.action + ". " + status + ".");
    });
    mapEls.trails.forEach(function (p, s) {
      p.setAttribute("class", "trail" + (s < act ? " done" : s === act ? " next" : ""));
    });
    mapEls.gate.classList.toggle("open", act === 8);
    var stage = TXT.map.stages[n];
    $("health-stage").textContent = stage;
    $("health-bar").setAttribute("aria-valuenow", n);
    $("health-bar").setAttribute("aria-valuetext", n + " of 8, " + stage);
    $("health-bar").firstElementChild.style.width = (n / 8 * 100) + "%";
    $("btn-next").textContent = act < 8 ? TXT.map.goNext.replace("{n}", pad2(act + 1)) : TXT.map.goFinish;
  }

  /* keep the speech bubble just above the avatar, inside the map */
  function placeBubble() {
    var b = $("map-say");
    if (!b.classList.contains("on")) return;
    var map = $("map"), wrap = $("map-wrap"), pt = map.createSVGPoint();
    pt.x = player.x; pt.y = player.y - 40;
    var s = pt.matrixTransform(map.getScreenCTM()), r = wrap.getBoundingClientRect();
    var half = b.offsetWidth / 2, x = s.x - r.left, y = s.y - r.top;
    x = Math.max(half + 8, Math.min(r.width - half - 8, x));
    y = Math.max(b.offsetHeight + 4, y);
    b.style.left = x + "px"; b.style.top = y + "px";
  }

  var sayTimer, toastTimer;
  function mapSay(text, ms) {
    var n = $("map-say");
    n.textContent = text; n.classList.add("on"); placeBubble();
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { n.classList.remove("on"); }, ms || 3200);
  }
  function toast(text) {
    var n = $("toast");
    n.textContent = text; n.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { n.classList.remove("on"); }, 2200);
  }

  function walkTo(pt, cb) { player.target = { x: pt.x, y: pt.y }; player.onArrive = cb || null; }
  function walkToNext() {
    var act = activeIndex();
    if (act < 8) tapStation(act); else tapGate();
  }
  function tapStation(idx) {
    if (state.missionOpen >= 0) return;
    var act = activeIndex();
    if (idx === act) walkTo(STATIONS[idx], function () { openMission(idx); });
    else if (state.done[idx]) toast(TXT.map.alreadyDone);
    else toast(TXT.map.locked.replace("{n}", pad2(act + 1)));
  }
  function tapGate() {
    if (state.missionOpen >= 0) return;
    if (activeIndex() === 8) walkTo(GATE, finishGame);
    else toast(TXT.map.finishLocked);
  }

  /* drag-to-move / tap-to-walk anywhere */
  function toWorld(e) {
    var m = $("map"), pt = m.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(m.getScreenCTM().inverse());
  }
  function onPointerDown(e) {
    if (e.target.closest && (e.target.closest(".station") || e.target.closest(".gate"))) return;
    var map = $("map");
    walkTo(toWorld(e));
    function move(ev) { walkTo(toWorld(ev)); }
    function up() {
      map.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    }
    map.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  /* keyboard movement */
  var keys = {};
  var KEYMAP = { ArrowUp: "u", w: "u", W: "u", ArrowDown: "d", s: "d", S: "d", ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r" };
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.missionOpen >= 0) { closeMission(); return; }
    if (state.screen !== "map" || state.missionOpen >= 0) return;
    if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; player.target = null; player.onArrive = null; e.preventDefault(); }
  });
  window.addEventListener("keyup", function (e) { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
  window.addEventListener("blur", function () { keys = {}; });

  /* ---------- game loop ---------- */
  var raf = 0, last = 0, clock = 0;
  var SPEED = 150; /* world units per second */
  function startLoop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function stopLoop() { cancelAnimationFrame(raf); raf = 0; }
  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;
    var vx = 0, vy = 0;
    if (state.missionOpen < 0) {
      if (keys.u) vy -= 1; if (keys.d) vy += 1; if (keys.l) vx -= 1; if (keys.r) vx += 1;
      if (vx || vy) {
        var len = Math.hypot(vx, vy); vx /= len; vy /= len;
      } else if (player.target) {
        var dx = player.target.x - player.x, dy = player.target.y - player.y, d = Math.hypot(dx, dy);
        if (d < 2) {
          player.x = player.target.x; player.y = player.target.y; player.target = null;
          var cb = player.onArrive; player.onArrive = null;
          if (cb) cb();
        } else { vx = dx / d; vy = dy / d; if (d < SPEED * dt) { vx *= d / (SPEED * dt); vy *= d / (SPEED * dt); } }
      }
    }
    player.moving = !!(vx || vy);
    if (player.moving) {
      player.x = Math.max(14, Math.min(W - 14, player.x + vx * SPEED * dt));
      player.y = Math.max(40, Math.min(H - 6, player.y + vy * SPEED * dt));
      player.phase += dt * 12;
    }
    drawPlayer();
    placeBubble();
    checkProximity();
    raf = requestAnimationFrame(tick);
  }
  function drawPlayer() {
    mapEls.player.setAttribute("transform", "translate(" + player.x.toFixed(1) + "," + player.y.toFixed(1) + ")");
    var swing = 0, bob = 0;
    if (player.moving && !reduceMotion) { swing = Math.sin(player.phase) * 22; bob = -Math.abs(Math.sin(player.phase)) * 2; }
    else if (!reduceMotion) bob = Math.sin(clock * 2.4) * 0.9;
    mapEls.legL.setAttribute("transform", "rotate(" + swing.toFixed(1) + " 35 58)");
    mapEls.legR.setAttribute("transform", "rotate(" + (-swing).toFixed(1) + " 45 58)");
    mapEls.torso.setAttribute("transform", "translate(0," + bob.toFixed(2) + ")");
  }
  function checkProximity() {
    if (state.missionOpen >= 0) return;
    var act = activeIndex();
    var tgt = act < 8 ? STATIONS[act] : GATE;
    var d = Math.hypot(player.x - tgt.x, player.y - tgt.y);
    if (d > 34) armed = true;
    if (armed && d < 20) {
      armed = false;
      player.target = null; player.onArrive = null; keys = {};
      if (act < 8) openMission(act); else finishGame();
    }
  }

  /* ---------- flow ---------- */
  function startGame() {
    state.done = []; state.skipped = [];
    player.x = START.x; player.y = START.y; player.target = null; player.onArrive = null; armed = true;
    buildMap(); refreshMap(); show("map");
    mapSay(t(TXT.map.greet[lines() === TXT.lines.robot ? "robot" : "founder"]), 3800);
    $("btn-next").focus({ preventScroll: true });
  }

  function finishGame() {
    var ul = $("finish-chips"); ul.innerHTML = "";
    M.forEach(function (m) {
      var li = el("li"); li.innerHTML = '<i class="c-' + m.color + '"></i>' + m.module; ul.appendChild(li);
    });
    show("finish");
    /* restart the one-time celebration */
    var c = document.querySelector(".celebrate"), clone = c.cloneNode(true); c.parentNode.replaceChild(clone, c);
    $("finish-h").setAttribute("tabindex", "-1"); $("finish-h").focus({ preventScroll: true });
  }

  /* ---------- mission overlay ---------- */
  var lastFocus = null;
  function say(text) {
    var b = $("m-say"); b.textContent = text;
    b.classList.remove("fresh"); void b.offsetWidth; b.classList.add("fresh");
  }
  function feedback(text, bad) {
    var f = $("m-feedback"); f.textContent = text || ""; f.classList.toggle("bad", !!bad);
  }

  function openMission(idx) {
    var m = M[idx];
    state.missionOpen = idx;
    lastFocus = document.activeElement;
    $("m-label").innerHTML = '<i class="c-' + m.color + '"></i>' + pad2(idx + 1) + " · " + m.module;
    $("m-title").textContent = m.title;
    $("m-mini").innerHTML = avatarSVGEl(state.avatar, "", { noThink: true });
    say(lines().intro[idx]);
    $("m-setup").textContent = t(m.setup);
    feedback("");
    $("m-success").hidden = true;
    $("m-skip").hidden = false;
    $("m-irl").textContent = " " + m.irl;
    var body = $("m-body"); body.innerHTML = "";
    BUILDERS[m.id](body, m, function () { succeed(idx); });
    $("overlay").hidden = false;
    $("sheet").scrollTop = 0;
    setTimeout(function () { $("m-title").setAttribute("tabindex", "-1"); $("m-title").focus({ preventScroll: true }); }, 30);
  }
  function succeed(idx) {
    var m = M[idx];
    say(lines().outro[idx]);
    feedback(m.success);
    $("m-success").hidden = false;
    $("m-skip").hidden = true;
    state.done[idx] = true;
    setTimeout(function () {
      $("m-continue").focus({ preventScroll: true });
      $("m-success").scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }, 60);
  }
  function hideOverlay() {
    state.missionOpen = -1;
    $("overlay").hidden = true;
    refreshMap();
    var btn = $("btn-next");
    (lastFocus && document.contains(lastFocus) ? lastFocus : btn).focus({ preventScroll: true });
  }
  function closeMission() {
    var idx = state.missionOpen;
    if (idx < 0) return;
    if (state.done[idx]) { continueMission(); return; }
    hideOverlay();
  }
  function continueMission() {
    var idx = state.missionOpen;
    hideOverlay();
    if (idx >= 0) mapSay(lines().outro[idx]);
  }
  function skipMission() {
    var idx = state.missionOpen;
    state.done[idx] = true; state.skipped[idx] = true;
    hideOverlay();
    mapSay(lines().skip);
  }

  /* ---------- the 8 mission mechanics ---------- */
  var BUILDERS = {
    /* 1. pick a positioning */
    strategy: function (body, m, win) {
      var wrap = el("div", { class: "opts" });
      m.options.forEach(function (o) {
        var b = el("button", { class: "opt", type: "button", "data-id": o.id, text: t(o.text) });
        b.addEventListener("click", function () {
          if (wrap.dataset.won) return;
          if (o.correct) { b.classList.add("right"); wrap.dataset.won = "1"; disableAll(wrap); win(); }
          else { shake(b); feedback(o.reply, true); }
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    },

    /* 2. pipeline: tap leads to advance; three to Won */
    sales: function (body, m, win) {
      var stagesRow = el("div", { class: "stages", "aria-hidden": "true" });
      m.stages.forEach(function (s) { stagesRow.appendChild(el("span", { text: s })); });
      body.appendChild(stagesRow);
      var wrap = el("div", { class: "opts" }), stage = [0, 0, 0, 0], marcoN = 0, won = false;
      m.leads[state.type].forEach(function (name, i) {
        var b = el("button", { class: "opt lead" + (i === m.notLeadIndex ? " marco" : ""), type: "button", "data-lead": i });
        b.innerHTML = '<span class="row"><span class="nm"></span><span class="st"></span></span><span class="track"><i></i><i></i><i></i><i></i></span>';
        b.querySelector(".nm").textContent = name;
        function draw() {
          b.querySelector(".st").textContent = m.stages[stage[i]];
          b.querySelectorAll(".track i").forEach(function (seg, k) { seg.classList.toggle("on", k <= stage[i]); });
          b.classList.toggle("won", stage[i] === 3);
          b.setAttribute("aria-label", name + ", stage " + m.stages[stage[i]]);
        }
        draw();
        b.addEventListener("click", function () {
          if (won) return;
          if (i === m.notLeadIndex) { shake(b); feedback(m.marco[marcoN++ % m.marco.length], true); return; }
          if (stage[i] === 3) { feedback(m.alreadyWon, true); return; }
          stage[i]++; draw(); feedback(m.advance[stage[i] - 1]);
          if (stage.filter(function (s) { return s === 3; }).length >= 3) { won = true; disableAll(wrap); win(); }
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    },

    /* 3. cut the jargon */
    marketing: function (body, m, win) {
      var box = el("p", { class: "draft" }), cut = 0, total = 0;
      var counter = el("p", { class: "label counter", "aria-live": "polite" });
      m.draft.forEach(function (tok, k) {
        var isBuzz = typeof tok === "object", word = isBuzz ? tok.buzz : t(tok);
        if (isBuzz) total++;
        var b = el("button", { class: "w", type: "button", text: word });
        if (isBuzz) b.setAttribute("data-buzz", "1");
        b.addEventListener("click", function () {
          if (b.classList.contains("cut") || box.classList.contains("clean")) return;
          if (isBuzz) {
            b.classList.add("cut"); b.setAttribute("aria-label", word + ", cut"); cut++;
            counter.textContent = m.counter.replace("{n}", cut);
            feedback("");
            if (cut === total) {
              box.classList.add("clean");
              var c = el("p", { class: "cleaned" });
              c.innerHTML = '<span class="label"></span>';
              c.firstChild.textContent = m.cleanLabel;
              c.appendChild(document.createTextNode(t(m.clean)));
              counter.after(c);
              win();
            }
          } else { shake(b); feedback(pick(m.normal), true); }
        });
        box.appendChild(b);
        if (k < m.draft.length - 1) box.appendChild(document.createTextNode(" "));
      });
      counter.textContent = m.counter.replace("{n}", 0);
      body.appendChild(box); body.appendChild(counter);
    },

    /* 4. complete the puzzle */
    bd: function (body, m, win) {
      var pz = el("div", { class: "puzzle" });
      pz.appendChild(el("span", { class: "label", text: "Your " + TXT.FLAVOUR[state.type].company }));
      m.have[state.type].forEach(function (h) { pz.appendChild(el("span", { class: "piece", text: h + " ✓" })); });
      var gap = el("span", { class: "piece gap", text: m.gap[state.type] + " ?" });
      pz.appendChild(gap);
      body.appendChild(pz);
      var wrap = el("div", { class: "opts" });
      m.partners[state.type].forEach(function (p) {
        var b = el("button", { class: "opt", type: "button", "data-id": p.id });
        b.innerHTML = "<strong></strong><small></small>";
        b.firstChild.textContent = p.name; b.lastChild.textContent = p.offer;
        b.addEventListener("click", function () {
          if (wrap.dataset.won) return;
          if (p.correct) {
            b.classList.add("right"); wrap.dataset.won = "1"; disableAll(wrap);
            gap.textContent = m.gap[state.type] + " ✓"; gap.classList.add("filled"); win();
          } else { shake(b); feedback(p.reply, true); }
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    },

    /* 5. automate or keep human */
    ops: function (body, m, win) {
      var wrap = el("div", { class: "tasks" }), ok = 0;
      m.tasks.forEach(function (task, i) {
        var card = el("div", { class: "task", "data-task": i });
        card.appendChild(el("p", { text: task.text }));
        var pair = el("div", { class: "pair" }), res = el("p", { class: "res", "aria-live": "polite" });
        [["auto", m.automateLabel], ["human", m.humanLabel]].forEach(function (c) {
          var b = el("button", { type: "button", "data-choice": c[0], text: c[1] });
          b.addEventListener("click", function () {
            if (card.classList.contains("ok")) return;
            if (c[0] === task.answer) {
              card.classList.add("ok"); b.classList.add("chosen");
              pair.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
              res.textContent = m.right[task.answer]; ok++;
              feedback("");
              if (ok === m.tasks.length) win();
            } else { shake(card); res.textContent = m.wrong[c[0]]; }
          });
          pair.appendChild(b);
        });
        card.appendChild(pair); card.appendChild(res);
        wrap.appendChild(card);
      });
      body.appendChild(wrap);
    },

    /* 6. spot the risk on a tiny SVG bar chart */
    finance: function (body, m, win) {
      var cw = 320, ch = 170, base = 140, top = 22, max = 450, bw = 28, gapX = (cw - 16) / m.cash.length;
      var c = svg("svg", { class: "chart", viewBox: "0 0 " + cw + " " + ch, role: "group", "aria-label": "Cash at month end, January to August" });
      c.appendChild(svg("line", { class: "axis", x1: 4, y1: base, x2: cw - 4, y2: base }));
      var flagged = false, bars = [];
      m.cash.forEach(function (v, i) {
        var x = 8 + i * gapX + (gapX - bw) / 2, h = (v / max) * (base - top), y = base - h;
        var g = svg("g", { class: "bar-g", tabindex: "0", role: "button", "data-month": i, "aria-label": m.months[i] + ": " + v + " thousand" });
        g.appendChild(svg("rect", { class: "b", x: x, y: y, width: bw, height: h, rx: 3 }));
        g.appendChild(svg("rect", { x: x - 4, y: top - 10, width: bw + 8, height: base - top + 30, fill: "transparent" }));
        var tv = svg("text", { class: "v", x: x + bw / 2, y: y - 5 }); tv.textContent = v; g.appendChild(tv);
        var tm = svg("text", { class: "m", x: x + bw / 2, y: base + 15 }); tm.textContent = m.months[i]; g.appendChild(tm);
        function act() {
          if (flagged) return;
          if (i >= m.riskFrom) {
            flagged = true;
            bars.forEach(function (r, k) { if (k >= m.riskFrom) r.classList.add("risk"); });
            var x0 = 8 + m.riskFrom * gapX + 2, x1 = 8 + m.cash.length * gapX - 2;
            c.appendChild(svg("rect", { class: "flag", x: x0, y: top - 14, width: x1 - x0, height: base - top + 32, rx: 6 }));
            var ft = svg("text", { class: "flag-t", x: (x0 + x1) / 2, y: top - 18 }); ft.textContent = "Runway ≈ 2 months";
            c.appendChild(ft);
            c.setAttribute("viewBox", "0 -12 " + cw + " " + (ch + 12));
            feedback(m.flagged);
            body.appendChild(el("p", { class: "tie", text: m.tieIn }));
            win();
          } else { shake(g.firstChild); feedback(m.fine[i % m.fine.length], true); }
        }
        g.addEventListener("click", act);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
        bars.push(g.firstChild);
        c.appendChild(g);
      });
      body.appendChild(c);
    },

    /* 7. tap sections in the right order */
    public: function (body, m, win) {
      var stack = el("div", { class: "stack", "aria-live": "polite" });
      stack.appendChild(el("span", { class: "label", text: m.stackLabel }));
      body.appendChild(stack);
      var order = m.order.map(function (_, i) { return i; });
      do { order.sort(function () { return Math.random() - 0.5; }); } while (order[0] === 0);
      var wrap = el("div", { class: "sections" }), next = 0;
      order.forEach(function (i) {
        var b = el("button", { class: "opt", type: "button", "data-section": m.order[i] });
        b.innerHTML = "<strong></strong><small></small>";
        b.firstChild.textContent = m.order[i]; b.lastChild.textContent = m.blurbs[i];
        b.addEventListener("click", function () {
          if (next >= m.order.length || b.classList.contains("used")) return;
          if (i === next) {
            b.classList.add("used"); b.setAttribute("aria-hidden", "true"); b.tabIndex = -1;
            stack.appendChild(el("div", { class: "sheet-item", text: pad2(next + 1) + "  " + m.order[i] }));
            next++; feedback("");
            if (next === m.order.length) { wrap.hidden = true; win(); }
          } else { shake(b); feedback(m.hints[next], true); }
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    },

    /* 8. choose 3 slides */
    private: function (body, m, win) {
      var wrap = el("div", { class: "slides" }), chosen = [], done = false;
      var row = el("div", { class: "pitch-row" });
      var count = el("span", { class: "label" });
      var go = el("button", { class: "btn primary small", type: "button", text: m.pitchButton });
      function sync() {
        count.textContent = m.picked.replace("{n}", chosen.length);
        go.disabled = chosen.length !== 3 || done;
      }
      m.slides.forEach(function (s) {
        var b = el("button", { class: "slide" + (s.joke ? " joke" : ""), type: "button", "data-slide": s.id, "aria-pressed": "false" });
        b.textContent = s.text;
        b.addEventListener("click", function () {
          if (done) return;
          if (s.joke) {
            if (!b.classList.contains("roasted")) { b.classList.add("roasted"); shake(b); }
            feedback(m.roast, true); return;
          }
          var at = chosen.indexOf(s.id);
          if (at >= 0) chosen.splice(at, 1);
          else if (chosen.length < 3) chosen.push(s.id);
          else { shake(b); return; }
          b.setAttribute("aria-pressed", at >= 0 ? "false" : "true");
          feedback(""); sync();
        });
        wrap.appendChild(b);
      });
      go.addEventListener("click", function () {
        if (chosen.indexOf("problem") < 0) { feedback(m.noProblem, true); shake(wrap); return; }
        if (chosen.indexOf("ask") < 0) { feedback(m.noAsk, true); shake(wrap); return; }
        done = true; sync(); disableAll(wrap); win();
      });
      row.appendChild(count); row.appendChild(go);
      body.appendChild(wrap); body.appendChild(row);
      sync();
    }
  };
  function disableAll(wrap) { wrap.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-disabled", "true"); }); }

  /* Keep keyboard focus inside the open mission sheet */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || state.missionOpen < 0) return;
    var f = Array.prototype.filter.call(
      $("sheet").querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
      function (n) { return !n.disabled && n.offsetParent !== null && n.getAttribute("aria-hidden") !== "true"; });
    if (!f.length) return;
    var first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !$("sheet").contains(document.activeElement))) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });

  initStatic();
  show("start");
})();

const CUT = 0.65;
let META = null;
let CURRENT = null;
let PAYLOAD = null;

const $ = (id) => document.getElementById(id);

function nearest(curve, score) {
  let best = 0;
  let d = Infinity;
  const xs = curve.score || [];
  for (let i = 0; i < xs.length; i++) {
    const dd = Math.abs(xs[i] - score);
    if (dd < d) {
      d = dd;
      best = i;
    }
  }
  return best;
}

function fmt(x, d) {
  if (x == null || Number.isNaN(x)) return "—";
  return Number(x).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function phrase(curve, score, conf) {
  const i = nearest(curve, score);
  const y = curve.y[i];
  const lo = curve.lo && curve.lo[conf] ? curve.lo[conf][i] : null;
  const hi = curve.hi && curve.hi[conf] ? curve.hi[conf][i] : null;
  if (lo == null || hi == null) return `${fmt(y, 2)}`;
  const moe = (hi - lo) / 2;
  return `${fmt(y, 2)} (${fmt(lo, 2)}–${fmt(hi, 2)}; ±${fmt(moe, 2)} at ${conf}%)`;
}

function ciFill(x, lo, hi, color, name) {
  if (!lo || !hi) return null;
  const xs = [];
  const ys = [];
  for (let i = 0; i < x.length; i++) {
    if (x[i] == null || lo[i] == null || hi[i] == null) continue;
    xs.push(x[i]);
    ys.push(hi[i]);
  }
  const x2 = [];
  const y2 = [];
  for (let i = x.length - 1; i >= 0; i--) {
    if (x[i] == null || lo[i] == null || hi[i] == null) continue;
    x2.push(x[i]);
    y2.push(lo[i]);
  }
  if (!xs.length) return null;
  return {
    x: xs.concat(x2),
    y: ys.concat(y2),
    fill: "toself",
    fillcolor: color,
    line: { width: 0, color: "rgba(0,0,0,0)" },
    name,
    hoverinfo: "skip",
    showlegend: true,
    type: "scatter",
    mode: "lines",
  };
}

function scoreChart(el, base, neu, opts) {
  const conf = $("conf").value;
  const band = $("band").checked;
  const traces = [];
  if (band && base) {
    const t = ciFill(base.score, base.lo[conf], base.hi[conf], "rgba(0, 90, 200, 0.18)", `${opts.prev} range`);
    if (t) traces.push(t);
  }
  if (band && neu) {
    const t = ciFill(neu.score, neu.lo[conf], neu.hi[conf], "rgba(230, 120, 0, 0.18)", `${opts.challenger} range`);
    if (t) traces.push(t);
  }
  if (base) {
    traces.push({
      x: base.score,
      y: base.y,
      name: opts.prev,
      mode: "lines",
      line: { color: "blue", width: 3 },
      hovertemplate: "cutoff %{x:.3f}<br>" + opts.yHover + " %{y:.2f}<extra>" + opts.prev + "</extra>",
    });
  }
  if (neu) {
    traces.push({
      x: neu.score,
      y: neu.y,
      name: opts.challenger,
      mode: "lines",
      line: { color: "orange", width: 3, dash: "dash" },
      hovertemplate: "cutoff %{x:.3f}<br>" + opts.yHover + " %{y:.2f}<extra>" + opts.challenger + "</extra>",
    });
  }
  const shapes = [{ type: "line", x0: CUT, x1: CUT, y0: 0, y1: 1, yref: "paper", line: { dash: "dot", color: "gray", width: 1 } }];
  const annotations = [{ x: CUT, y: 1, yref: "paper", text: "0.65", showarrow: false, yshift: 10, font: { size: 11, color: "#64748b" } }];
  if (opts.accCut != null) {
    shapes.push({ type: "line", x0: opts.accCut, x1: opts.accCut, y0: 0, y1: 1, yref: "paper", line: { dash: "dash", color: "orange", width: 1 } });
    annotations.push({ x: opts.accCut, y: 1, yref: "paper", text: "yes-match " + Number(opts.accCut).toFixed(3), showarrow: false, yshift: 10, font: { size: 11, color: "darkorange" } });
  }
  if (opts.delCut != null) {
    shapes.push({ type: "line", x0: opts.delCut, x1: opts.delCut, y0: 0, y1: 1, yref: "paper", line: { dash: "dash", color: "purple", width: 1 } });
    annotations.push({ x: opts.delCut, y: 1, yref: "paper", text: "delinq-match " + Number(opts.delCut).toFixed(3), showarrow: false, yshift: 10, font: { size: 11, color: "purple" } });
  }
  if (opts.yBase065 != null) {
    traces.push({ x: [CUT], y: [opts.yBase065], name: `${opts.prev} @ 0.65`, mode: "markers", marker: { size: 11, color: "blue" }, hovertemplate: "cutoff 0.650<br>" + opts.yHover + " %{y:.2f}<extra>%{fullData.name}</extra>" });
  }
  if (opts.yNew065 != null) {
    traces.push({ x: [CUT], y: [opts.yNew065], name: `${opts.challenger} @ 0.65`, mode: "markers", marker: { symbol: "x", size: 10, color: "red" }, hovertemplate: "cutoff 0.650<br>" + opts.yHover + " %{y:.2f}<extra>%{fullData.name}</extra>" });
  }
  if (opts.accCut != null && opts.yNewAcc != null) {
    traces.push({ x: [opts.accCut], y: [opts.yNewAcc], name: "Challenger yes-match", mode: "markers", marker: { size: 11, color: "orange" }, hovertemplate: "yes-match %{x:.3f}<br>" + opts.yHover + " %{y:.2f}<extra>%{fullData.name}</extra>" });
  }
  if (opts.delCut != null && opts.yNewDel != null) {
    traces.push({ x: [opts.delCut], y: [opts.yNewDel], name: "Challenger delinq-match", mode: "markers", marker: { size: 11, color: "purple" }, hovertemplate: "delinq-match %{x:.3f}<br>" + opts.yHover + " %{y:.2f}<extra>%{fullData.name}</extra>" });
  }
  const layout = {
    title: opts.title,
    xaxis: { title: "Cutoff score" },
    yaxis: { title: opts.yaxis },
    hovermode: "x unified",
    height: 560,
    legend: { orientation: "h" },
    margin: { t: 48, r: 16, b: 48, l: 64 },
    shapes,
    annotations,
  };
  Plotly.react(el, traces, layout, { responsive: true });
}

function frontierPt(fr, cutoff) {
  if (!fr || !fr.score || !fr.score.length || cutoff == null) return null;
  const i = nearest(fr, cutoff);
  return { acc: fr.acc[i], delinq: fr.delinq[i], score: fr.score[i] };
}

function frontierChart(el, base, neu, opts) {
  const conf = $("conf").value;
  const band = $("band").checked;
  const traces = [];
  const hover = opts.hoverAcc + " %{x:.1f}%<br>" + opts.hoverDel + " %{y:.1f}%<br>cutoff %{customdata:.3f}<extra>%{fullData.name}</extra>";
  if (band && base && base.band && base.band[conf] && base.band[conf].delinq_lo) {
    const t = ciFill(base.acc, base.band[conf].delinq_lo, base.band[conf].delinq_hi, "rgba(0, 90, 200, 0.16)", `${opts.prev} range`);
    if (t) traces.push(t);
  }
  if (band && neu && neu.band && neu.band[conf] && neu.band[conf].delinq_lo) {
    const t = ciFill(neu.acc, neu.band[conf].delinq_lo, neu.band[conf].delinq_hi, "rgba(230, 120, 0, 0.16)", `${opts.challenger} range`);
    if (t) traces.push(t);
  }
  traces.push({
    x: base.acc,
    y: base.delinq,
    name: opts.prev,
    mode: "lines",
    line: { color: "blue", width: 3 },
    customdata: base.score,
    hovertemplate: hover,
  });
  if (neu) {
    traces.push({
      x: neu.acc,
      y: neu.delinq,
      name: opts.challenger,
      mode: "lines",
      line: { color: "orange", width: 3, dash: "dash" },
      customdata: neu.score,
      hovertemplate: hover,
    });
  }
  function mark(pt, name, marker) {
    if (!pt) return;
    traces.push({
      x: [pt.acc],
      y: [pt.delinq],
      name,
      mode: "markers",
      marker,
      customdata: [pt.score],
      hovertemplate: hover,
    });
  }
  mark(frontierPt(base, CUT), `${opts.prev} @ 0.65`, { color: "blue", size: 12 });
  if (neu) {
    mark(frontierPt(neu, CUT), `${opts.challenger} @ 0.65`, { color: "red", size: 11, symbol: "x" });
    if (opts.accCut != null) mark(frontierPt(neu, opts.accCut), "Same yes-share", { color: "orange", size: 11 });
    if (opts.delCut != null) mark(frontierPt(neu, opts.delCut), opts.delCutName || "Same CaaS delinquency", { color: "purple", size: 11 });
  }
  const shapes = [];
  const cross = frontierPt(base, CUT);
  if (cross) {
    shapes.push({
      type: "line",
      x0: cross.acc,
      x1: cross.acc,
      y0: 0,
      y1: 1,
      yref: "paper",
      line: { dash: "dot", color: "gray", width: 1 },
    });
    shapes.push({
      type: "line",
      y0: cross.delinq,
      y1: cross.delinq,
      x0: 0,
      x1: 1,
      xref: "paper",
      line: { dash: "dot", color: "gray", width: 1 },
    });
  }
  const layout = {
    title: opts.title,
    xaxis: { title: opts.xaxis },
    yaxis: { title: opts.yaxis },
    hovermode: "closest",
    height: 560,
    legend: { orientation: "h" },
    margin: { t: 48, r: 16, b: 48, l: 64 },
    shapes,
  };
  Plotly.react(el, traces, layout, { responsive: true });
}

function localNotes(p, conf) {
  const L = p.local;
  return `<p><strong>Local baseline MSE @ 0.65 (${conf}% CI):</strong> yes ${phrase(L.acc_base, CUT, conf)}; past-due/principal ${phrase(L.del_base, CUT, conf)}.</p>
<p><strong>This model @ 0.65 (${conf}% CI):</strong> yes ${phrase(L.acc_new, CUT, conf)}; past-due/principal ${phrase(L.del_new, CUT, conf)}.</p>
<p><strong>Same live yes-share:</strong> bar <strong>${fmt(L.acc_cut, 4)}</strong> → yes <strong>${fmt(L.y_new_acc_match, 2)}%</strong>, CaaS past-due/principal <strong>${fmt(L.y_new_del_at_acc, 2)}%</strong>.</p>
<p><strong>Same CaaS delinquency:</strong> bar <strong>${fmt(L.del_cut, 4)}</strong> → past-due/principal <strong>${fmt(L.y_new_del_match, 2)}%</strong>, live yes <strong>${fmt(L.y_new_acc_at_del, 2)}%</strong>.</p>`;
}

function storedNotes(p, conf) {
  const S = p.stored;
  if (!S) return "<p>No stored <code>autogluon_v25</code> curves for this package.</p>";
  if (!S.has_challenger) {
    return `<p><strong>Stored production v25 @ 0.65 (${conf}% CI):</strong> yes ${phrase(S.acc_base, CUT, conf)}; past-due/principal ${phrase(S.del_base, CUT, conf)}.</p>
<p>Challenger scores are not on the Fritz 4k samples yet.</p>`;
  }
  return `<p><strong>Stored production v25 @ 0.65 (${conf}% CI):</strong> yes ${phrase(S.acc_base, CUT, conf)}; past-due/principal ${phrase(S.del_base, CUT, conf)}.</p>
<p><strong>This model @ 0.65 on the same users (${conf}% CI):</strong> yes ${phrase(S.acc_new, CUT, conf)}; past-due/principal ${phrase(S.del_new, CUT, conf)}.</p>
<p><strong>Same live yes-share:</strong> bar <strong>${fmt(S.acc_cut, 4)}</strong> → yes <strong>${fmt(S.y_new_acc_match, 2)}%</strong>, CaaS past-due/principal <strong>${fmt(S.y_new_del_at_acc, 2)}%</strong>.</p>
<p><strong>Same CaaS delinquency:</strong> bar <strong>${fmt(S.del_cut, 4)}</strong> → past-due/principal <strong>${fmt(S.y_new_del_match, 2)}%</strong>, live yes <strong>${fmt(S.y_new_acc_at_del, 2)}%</strong>.</p>`;
}

function draw() {
  if (!PAYLOAD) return;
  const p = PAYLOAD;
  const conf = $("conf").value;
  const L = p.local;
  $("local-h").textContent = `Local MSE baseline vs challenger · ${p.title}`;
  $("status").textContent =
    `Acceptance: ${L.acc_n} users (${L.source}); gates ${fmt(L.gate_pct, 1)}%. ` +
    `Delinquency: ${L.del_n} Fritz CaaS users, ${L.del_n_booked} booked. Top blue: ${L.previous_name}. Bottom blue: stored autogluon_v25.`;
  scoreChart("local-acc", L.acc_base, L.acc_new, {
    title: L.acc_title,
    yaxis: "Yes-share of the live v25 file (%)",
    yHover: "yes %",
    prev: L.previous_name,
    challenger: p.id,
    accCut: L.acc_cut,
    delCut: L.del_cut,
    yBase065: L.y_base_acc_065,
    yNew065: L.y_new_acc_065,
    yNewAcc: L.y_new_acc_match,
    yNewDel: L.y_new_acc_at_del,
  });
  scoreChart("local-del", L.del_base, L.del_new, {
    title: L.del_title,
    yaxis: L.del_axis,
    yHover: "past-due/principal %",
    prev: L.previous_name,
    challenger: p.id,
    accCut: L.acc_cut,
    delCut: L.del_cut,
    yBase065: L.y_base_del_065,
    yNew065: L.y_new_del_065,
    yNewAcc: L.y_new_del_at_acc,
    yNewDel: L.y_new_del_match,
  });
  frontierChart("local-fr", L.fr_base, L.fr_new, {
    title: L.fr_title,
    xaxis: L.fr_x,
    yaxis: L.del_axis,
    hoverAcc: "Yes",
    hoverDel: "Past-due / principal",
    prev: L.previous_name,
    challenger: p.id,
    accCut: L.acc_cut,
    delCut: L.del_cut,
  });
  $("local-notes").innerHTML = localNotes(p, conf);
  const S = p.stored;
  if (!S) {
    Plotly.purge("stored-acc");
    Plotly.purge("stored-del");
    Plotly.purge("stored-fr");
    $("stored-notes").innerHTML = "<p>No stored production curves.</p>";
    return;
  }
  scoreChart("stored-acc", S.acc_base, S.acc_new || null, {
    title: S.acc_title,
    yaxis: "Yes-share of the live v25 file (%)",
    yHover: "yes %",
    prev: S.previous_name,
    challenger: p.id,
    accCut: S.acc_cut,
    delCut: S.del_cut,
    yBase065: S.y_base_acc_065,
    yNew065: S.y_new_acc_065,
    yNewAcc: S.y_new_acc_match,
    yNewDel: S.y_new_acc_at_del,
  });
  scoreChart("stored-del", S.del_base, S.del_new || null, {
    title: S.del_title,
    yaxis: S.del_axis,
    yHover: "past-due/principal %",
    prev: S.previous_name,
    challenger: p.id,
    accCut: S.acc_cut,
    delCut: S.del_cut,
    yBase065: S.y_base_del_065,
    yNew065: S.y_new_del_065,
    yNewAcc: S.y_new_del_at_acc,
    yNewDel: S.y_new_del_match,
  });
  frontierChart("stored-fr", S.fr_base, S.fr_new || null, {
    title: S.fr_title,
    xaxis: S.fr_x,
    yaxis: S.del_axis,
    hoverAcc: "Yes",
    hoverDel: "Past-due / principal",
    prev: S.previous_name,
    challenger: p.id,
    accCut: S.acc_cut,
    delCut: S.del_cut,
  });
  $("stored-notes").innerHTML = storedNotes(p, conf);
}

async function loadId(id) {
  CURRENT = id;
  $("now").innerHTML = "Now: <strong>" + (META.variants.find((v) => v.id === id) || {}).label + "</strong>";
  document.querySelectorAll(".pick").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  const res = await fetch("data/" + id + ".json");
  PAYLOAD = await res.json();
  location.hash = id;
  draw();
}

function buildPicker() {
  const groups = {};
  META.variants.forEach((v) => {
    (groups[v.pkg_num] ||= []).push(v);
  });
  const host = $("picker");
  host.innerHTML = "";
  Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((num) => {
      const box = document.createElement("div");
      box.className = "pkg-group";
      const vs = groups[num];
      box.dataset.hay = vs.map((v) => v.hay).join(" ");
      const head = document.createElement("div");
      head.className = "pkg-head";
      head.textContent = vs[0].pkg || "package " + num;
      const btns = document.createElement("div");
      btns.className = "pkg-btns";
      vs.forEach((v) => {
        const b = document.createElement("button");
        b.className = "pick";
        b.dataset.id = v.id;
        b.textContent = v.label;
        b.onclick = () => loadId(v.id);
        btns.appendChild(b);
      });
      box.appendChild(head);
      box.appendChild(btns);
      host.appendChild(box);
    });
  $("filter").addEventListener("input", () => {
    const q = $("filter").value.trim().toLowerCase();
    host.querySelectorAll(".pkg-group").forEach((box) => {
      box.classList.toggle("hidden", Boolean(q) && !(box.dataset.hay || "").includes(q));
    });
  });
}

async function boot() {
  META = await (await fetch("data/meta.json")).json();
  $("page-title").textContent = META.title;
  $("caption").textContent = META.caption;
  $("note-html").innerHTML = META.note_html;
  buildPicker();
  $("conf").addEventListener("change", draw);
  $("band").addEventListener("change", draw);
  const fromHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const first = META.variants.some((v) => v.id === fromHash) ? fromHash : META.variants[0].id;
  await loadId(first);
}

boot().catch((e) => {
  $("status").textContent = "Failed to load dashboard data: " + e;
});

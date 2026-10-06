const CUT = 0.65;
let META = null;
let ERRORS = null;
let ERR_SCORES = null;
let CURRENT = null;
let PAYLOAD = null;
let TAB = "acc";
let CMP_READY = false;
const ERR_BLUE = "#93c5fd";
const ERR_MEAN = "#dc2626";
const ERR_MED = "#334155";
const ERR_Q1 = "#2563eb";
const ERR_Q3 = "#7c3aed";
const CS_SE = [
  [0, "#f8fafc"],
  [1, "#1e3a8a"],
];
const CS_AE = [
  [0, "#f8fafc"],
  [1, "#6b21a8"],
];
const CS_XY = [
  [0, "#f1f5f9"],
  [0.5, "#64748b"],
  [1, "#0f172a"],
];

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
    const t = ciFill(neu.score, neu.lo[conf], neu.hi[conf], "rgba(51, 65, 85, 0.18)", `${opts.challenger} range`);
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
      line: { color: "#334155", width: 3, dash: "dash" },
      hovertemplate: "cutoff %{x:.3f}<br>" + opts.yHover + " %{y:.2f}<extra>" + opts.challenger + "</extra>",
    });
  }
  const shapes = [{ type: "line", x0: CUT, x1: CUT, y0: 0, y1: 1, yref: "paper", line: { dash: "dot", color: "gray", width: 1 } }];
  const annotations = [{ x: CUT, y: 1, yref: "paper", text: "0.65", showarrow: false, yshift: 10, font: { size: 11, color: "#64748b" } }];
  if (opts.accCut != null) {
    shapes.push({ type: "line", x0: opts.accCut, x1: opts.accCut, y0: 0, y1: 1, yref: "paper", line: { dash: "dash", color: "#334155", width: 1 } });
    annotations.push({ x: opts.accCut, y: 1, yref: "paper", text: "yes-match " + Number(opts.accCut).toFixed(3), showarrow: false, yshift: 10, font: { size: 11, color: "#334155" } });
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
    traces.push({ x: [opts.accCut], y: [opts.yNewAcc], name: "Challenger yes-match", mode: "markers", marker: { size: 11, color: "#334155" }, hovertemplate: "yes-match %{x:.3f}<br>" + opts.yHover + " %{y:.2f}<extra>%{fullData.name}</extra>" });
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
    const t = ciFill(neu.acc, neu.band[conf].delinq_lo, neu.band[conf].delinq_hi, "rgba(51, 65, 85, 0.16)", `${opts.challenger} range`);
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
      line: { color: "#334155", width: 3, dash: "dash" },
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
    if (opts.accCut != null) mark(frontierPt(neu, opts.accCut), "Same yes-share", { color: "#334155", size: 11 });
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
<p>Challenger scores are not on this stored-production sample yet.</p>`;
  }
  return `<p><strong>Stored production v25 @ 0.65 (${conf}% CI):</strong> yes ${phrase(S.acc_base, CUT, conf)}; past-due/principal ${phrase(S.del_base, CUT, conf)}.</p>
<p><strong>This model @ 0.65 on the same users (${conf}% CI):</strong> yes ${phrase(S.acc_new, CUT, conf)}; past-due/principal ${phrase(S.del_new, CUT, conf)}.</p>
<p><strong>Same live yes-share:</strong> bar <strong>${fmt(S.acc_cut, 4)}</strong> → yes <strong>${fmt(S.y_new_acc_match, 2)}%</strong>, CaaS past-due/principal <strong>${fmt(S.y_new_del_at_acc, 2)}%</strong>.</p>
<p><strong>Same CaaS delinquency:</strong> bar <strong>${fmt(S.del_cut, 4)}</strong> → past-due/principal <strong>${fmt(S.y_new_del_match, 2)}%</strong>, live yes <strong>${fmt(S.y_new_acc_at_del, 2)}%</strong>.</p>`;
}

function pairFinite(yt, yp) {
  const t = [];
  const p = [];
  const n = Math.min(yt.length, yp.length);
  for (let i = 0; i < n; i++) {
    const a = yt[i];
    const b = yp[i];
    if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) continue;
    t.push(a);
    p.push(b);
  }
  return { t, p };
}

function quantile(sorted, pct) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * pct;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function summary(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return { mean, q1: quantile(s, 0.25), median: quantile(s, 0.5), q3: quantile(s, 0.75) };
}

function axisName(i) {
  return i === 1 ? "" : String(i);
}

function gridDomains(rows, cols) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c + 1;
      cells.push({
        k,
        x: [c / cols + 0.03, (c + 1) / cols - 0.02],
        y: [1 - (r + 1) / rows + 0.04, 1 - r / rows - 0.07],
      });
    }
  }
  return cells;
}

function applyGrid(layout, cells, xlabels, ylabels) {
  cells.forEach((cell, i) => {
    const xa = "xaxis" + axisName(cell.k);
    const ya = "yaxis" + axisName(cell.k);
    layout[xa] = {
      domain: cell.x,
      anchor: "y" + axisName(cell.k),
      title: { text: xlabels[i] || "", font: { size: 11 } },
      zeroline: false,
    };
    layout[ya] = {
      domain: cell.y,
      anchor: "x" + axisName(cell.k),
      title: { text: ylabels[i] || "", font: { size: 11 } },
      zeroline: false,
    };
  });
}

function titleNotes(cells, titles) {
  return cells.map((cell, i) => ({
    text: titles[i] || "",
    x: (cell.x[0] + cell.x[1]) / 2,
    y: cell.y[1] + 0.015,
    xref: "paper",
    yref: "paper",
    showarrow: false,
    font: { size: 12, color: "#0f172a" },
  }));
}

function vlineShapes(xref, stats) {
  if (!stats) return [];
  return [
    { type: "line", xref, yref: xref.replace("x", "y") + " domain", x0: stats.mean, x1: stats.mean, y0: 0, y1: 1, line: { color: ERR_MEAN, dash: "dash", width: 2 } },
    { type: "line", xref, yref: xref.replace("x", "y") + " domain", x0: stats.median, x1: stats.median, y0: 0, y1: 1, line: { color: ERR_MED, width: 2 } },
    { type: "line", xref, yref: xref.replace("x", "y") + " domain", x0: stats.q1, x1: stats.q1, y0: 0, y1: 1, line: { color: ERR_Q1, dash: "dot", width: 2 } },
    { type: "line", xref, yref: xref.replace("x", "y") + " domain", x0: stats.q3, x1: stats.q3, y0: 0, y1: 1, line: { color: ERR_Q3, dash: "dot", width: 2 } },
  ];
}

function guideLegend() {
  return [
    { x: [null], y: [null], mode: "lines", line: { color: ERR_MEAN, dash: "dash", width: 2 }, name: "Mean", hoverinfo: "skip" },
    { x: [null], y: [null], mode: "lines", line: { color: ERR_MED, width: 2 }, name: "Median", hoverinfo: "skip" },
    { x: [null], y: [null], mode: "lines", line: { color: ERR_Q1, dash: "dot", width: 2 }, name: "Q1", hoverinfo: "skip" },
    { x: [null], y: [null], mode: "lines", line: { color: ERR_Q3, dash: "dot", width: 2 }, name: "Q3", hoverinfo: "skip" },
  ];
}

function histCell(arr, k, name) {
  const xref = "x" + axisName(k);
  const yref = "y" + axisName(k);
  const st = summary(arr);
  const traces = [];
  if (arr.length) {
    traces.push({
      type: "histogram",
      x: arr,
      nbinsx: 40,
      marker: { color: ERR_BLUE },
      name,
      xaxis: xref,
      yaxis: yref,
      showlegend: false,
      hovertemplate: "value %{x:.3f}<br>count %{y}<extra>" + name + "</extra>",
    });
  }
  return { traces, shapes: vlineShapes(xref, st), empty: !arr.length, xref, yref };
}

function plotlyCfg() {
  return { responsive: true, displaylogo: false };
}

function drawDist(el, yt, yp) {
  const se = yt.map((a, i) => (a - yp[i]) * (a - yp[i]));
  const ae = yt.map((a, i) => Math.abs(a - yp[i]));
  const cells = gridDomains(2, 2);
  const series = [
    { arr: yt, title: "Target Variable Distribution", xlab: "True Target Value" },
    { arr: yp, title: "Model Prediction Distribution", xlab: "Predicted Value" },
    { arr: se, title: "Squared Error Distribution", xlab: "Squared Error" },
    { arr: ae, title: "Absolute Error Distribution", xlab: "Absolute Error" },
  ];
  const traces = guideLegend();
  const shapes = [];
  const annotations = titleNotes(cells, series.map((s) => s.title));
  series.forEach((s, i) => {
    const cell = histCell(s.arr, cells[i].k, s.title);
    traces.push(...cell.traces);
    shapes.push(...cell.shapes);
    if (cell.empty) {
      annotations.push({ text: "No Data", x: (cells[i].x[0] + cells[i].x[1]) / 2, y: (cells[i].y[0] + cells[i].y[1]) / 2, xref: "paper", yref: "paper", showarrow: false });
    }
  });
  const layout = {
    margin: { t: 56, r: 16, l: 48, b: 48 },
    showlegend: true,
    legend: { orientation: "h", y: 1.14, font: { size: 11 } },
    hovermode: "closest",
    shapes,
    annotations,
  };
  applyGrid(layout, cells, series.map((s) => s.xlab), ["Count", "Count", "Count", "Count"]);
  Plotly.react(el, traces, layout, plotlyCfg());
}

function heatCell(x, y, k, colorscale, showscale) {
  const h = hist2d(x, y, 50, 50);
  return {
    type: "heatmap",
    x: h.x,
    y: h.y,
    z: h.z,
    zmin: 0,
    zmax: h.zmax,
    colorscale,
    showscale,
    colorbar: showscale ? { len: 0.28, thickness: 10, outlinewidth: 0 } : undefined,
    xaxis: "x" + axisName(k),
    yaxis: "y" + axisName(k),
    hovertemplate: "x %{x:.3f}<br>y %{y:.3f}<br>count %{z}<extra></extra>",
  };
}

function hist2d(x, y, nx, ny) {
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;
  for (let i = 0; i < x.length; i++) {
    if (x[i] < xmin) xmin = x[i];
    if (x[i] > xmax) xmax = x[i];
    if (y[i] < ymin) ymin = y[i];
    if (y[i] > ymax) ymax = y[i];
  }
  if (!(xmax > xmin)) xmax = xmin + 1e-6;
  if (!(ymax > ymin)) ymax = ymin + 1e-6;
  const z = Array.from({ length: ny }, () => Array(nx).fill(0));
  for (let i = 0; i < x.length; i++) {
    let ix = Math.floor(((x[i] - xmin) / (xmax - xmin)) * nx);
    let iy = Math.floor(((y[i] - ymin) / (ymax - ymin)) * ny);
    if (ix === nx) ix = nx - 1;
    if (iy === ny) iy = ny - 1;
    if (ix >= 0 && iy >= 0 && ix < nx && iy < ny) z[iy][ix] += 1;
  }
  const pos = [];
  for (let r = 0; r < ny; r++) {
    for (let c = 0; c < nx; c++) {
      if (z[r][c] > 0) pos.push(z[r][c]);
    }
  }
  pos.sort((a, b) => a - b);
  const p80 = pos.length ? pos[Math.min(pos.length - 1, Math.floor(pos.length * 0.8))] : 1;
  return {
    x: Array.from({ length: nx }, (_, i) => xmin + ((i + 0.5) * (xmax - xmin)) / nx),
    y: Array.from({ length: ny }, (_, i) => ymin + ((i + 0.5) * (ymax - ymin)) / ny),
    z,
    zmax: Math.max(1, p80),
  };
}

function drawHeat(el, yt, yp) {
  const se = yt.map((a, i) => (a - yp[i]) * (a - yp[i]));
  const ae = yt.map((a, i) => Math.abs(a - yp[i]));
  const cells = gridDomains(3, 2);
  const titles = [
    "Squared Error vs Target Variable",
    "Squared Error vs Prediction",
    "Absolute Error vs Target Variable",
    "Absolute Error vs Prediction",
    "Prediction vs Target Variable",
    "",
  ];
  const xlabels = ["True Target Value", "Predicted Value", "True Target Value", "Predicted Value", "True Target Value", ""];
  const ylabels = ["Squared Error", "Squared Error", "Absolute Error", "Absolute Error", "Predicted Value", ""];
  const traces = [
    heatCell(yt, se, 1, CS_SE, true),
    heatCell(yp, se, 2, CS_SE, false),
    heatCell(yt, ae, 3, CS_AE, true),
    heatCell(yp, ae, 4, CS_AE, false),
    heatCell(yt, yp, 5, CS_XY, true),
  ];
  const layout = {
    margin: { t: 48, r: 36, l: 56, b: 48 },
    showlegend: false,
    hovermode: "closest",
    annotations: titleNotes(cells, titles),
  };
  applyGrid(layout, cells, xlabels, ylabels);
  layout.xaxis6 = { domain: cells[5].x, visible: false };
  layout.yaxis6 = { domain: cells[5].y, visible: false };
  Plotly.react(el, traces, layout, plotlyCfg());
}

function scatterCell(x, y, k, color, name) {
  return {
    x,
    y,
    mode: "markers",
    type: "scatter",
    marker: { size: 6, color, opacity: 0.35 },
    name,
    showlegend: false,
    xaxis: "x" + axisName(k),
    yaxis: "y" + axisName(k),
    hovertemplate: "x %{x:.3f}<br>y %{y:.3f}<extra>" + name + "</extra>",
  };
}

function drawResid(el, yt, yp) {
  const resid = yt.map((a, i) => a - yp[i]);
  const lo = Math.min(...yt, ...yp);
  const hi = Math.max(...yt, ...yp);
  const cells = gridDomains(1, 3);
  const traces = [
    scatterCell(yt, yp, 1, "#2563eb", "Predicted vs Actual"),
    {
      x: [lo, hi],
      y: [lo, hi],
      mode: "lines",
      line: { color: ERR_MEAN, dash: "dash", width: 2 },
      hoverinfo: "skip",
      showlegend: false,
      xaxis: "x",
      yaxis: "y",
    },
    scatterCell(yp, resid, 2, "#7c3aed", "Residuals vs Predicted"),
    scatterCell(yt, resid, 3, "#334155", "Residuals vs Actual Target"),
  ];
  const layout = {
    margin: { t: 48, r: 16, l: 52, b: 48 },
    showlegend: false,
    hovermode: "closest",
    annotations: titleNotes(cells, ["Predicted vs Actual", "Residuals vs Predicted", "Residuals vs Actual Target"]),
    shapes: [
      { type: "line", xref: "x2", yref: "y2", x0: Math.min(...yp), x1: Math.max(...yp), y0: 0, y1: 0, line: { color: ERR_MEAN, dash: "dash", width: 2 } },
      { type: "line", xref: "x3", yref: "y3", x0: Math.min(...yt), x1: Math.max(...yt), y0: 0, y1: 0, line: { color: ERR_MEAN, dash: "dash", width: 2 } },
    ],
  };
  applyGrid(layout, cells, ["Actual Target", "Predicted Value", "Actual Target"], ["Predicted", "Residual", "Residual"]);
  Plotly.react(el, traces, layout, plotlyCfg());
}

function quadReport(yt, yp) {
  const n = yt.length || 1;
  let ul = 0;
  let lr = 0;
  let ulSe = 0;
  let ulRse = 0;
  let lrSe = 0;
  let lrRse = 0;
  const ulSeA = [];
  const ulRseA = [];
  const lrSeA = [];
  const lrRseA = [];
  for (let i = 0; i < yt.length; i++) {
    const se = (yt[i] - yp[i]) * (yt[i] - yp[i]);
    const rse = Math.sqrt(se);
    if (yp[i] > 0.6 && yt[i] < 0.3) {
      ul += 1;
      ulSe += se;
      ulRse += rse;
      ulSeA.push(se);
      ulRseA.push(rse);
    }
    if (yp[i] < 0.3 && yt[i] > 0.7) {
      lr += 1;
      lrSe += se;
      lrRse += rse;
      lrSeA.push(se);
      lrRseA.push(rse);
    }
  }
  return {
    html:
      `<p><strong>Upper-Left (false positives: predicted &gt; 0.6, target &lt; 0.3)</strong> — ${((ul / n) * 100).toFixed(2)}% (${ul} samples). Mean SE = ${ul ? (ulSe / ul).toFixed(4) : "0.0000"} | Mean RSE = ${ul ? (ulRse / ul).toFixed(4) : "0.0000"}</p>` +
      `<p><strong>Lower-Right (false negatives: predicted &lt; 0.3, target &gt; 0.7)</strong> — ${((lr / n) * 100).toFixed(2)}% (${lr} samples). Mean SE = ${lr ? (lrSe / lr).toFixed(4) : "0.0000"} | Mean RSE = ${lr ? (lrRse / lr).toFixed(4) : "0.0000"}</p>`,
    panels: [
      { arr: ulSeA, title: "Upper-Left Quadrant: Squared Error", xlab: "Squared Error" },
      { arr: ulRseA, title: "Upper-Left Quadrant: Root Squared Error", xlab: "Root Squared Error" },
      { arr: lrSeA, title: "Lower-Right Quadrant: Squared Error", xlab: "Squared Error" },
      { arr: lrRseA, title: "Lower-Right Quadrant: Root Squared Error", xlab: "Root Squared Error" },
    ],
  };
}

function drawQuad(el, noteEl, yt, yp) {
  const q = quadReport(yt, yp);
  noteEl.innerHTML = q.html;
  const cells = gridDomains(2, 2);
  const traces = guideLegend();
  const shapes = [];
  const annotations = titleNotes(cells, q.panels.map((p) => p.title));
  q.panels.forEach((p, i) => {
    const cell = histCell(p.arr, cells[i].k, p.title);
    traces.push(...cell.traces);
    shapes.push(...cell.shapes);
    if (cell.empty) {
      annotations.push({
        text: "No Data",
        x: (cells[i].x[0] + cells[i].x[1]) / 2,
        y: (cells[i].y[0] + cells[i].y[1]) / 2,
        xref: "paper",
        yref: "paper",
        showarrow: false,
      });
    }
  });
  const layout = {
    margin: { t: 56, r: 16, l: 48, b: 48 },
    showlegend: true,
    legend: { orientation: "h", y: 1.14, font: { size: 11 } },
    hovermode: "closest",
    shapes,
    annotations,
  };
  applyGrid(layout, cells, q.panels.map((p) => p.xlab), ["Count", "Count", "Count", "Count"]);
  Plotly.react(el, traces, layout, plotlyCfg());
}

function mountErr(host, prefix) {
  host.innerHTML = "";
  const ids = [
    ["dist", "Metric Distributions", ""],
    ["heat", "Error Density Heatmaps", "heat"],
    ["resid", "Diagnostic & Residual Scatters", "resid"],
    ["quad", "Catastrophic Quadrant Report", ""],
  ];
  const out = {};
  ids.forEach(([key, title, cls]) => {
    const card = document.createElement("article");
    card.className = "err-card";
    const h = document.createElement("h3");
    h.textContent = title;
    card.appendChild(h);
    if (key === "quad") {
      const note = document.createElement("div");
      note.id = prefix + "-quad-note";
      note.className = "err-quad-note";
      card.appendChild(note);
      out.note = note;
    }
    const div = document.createElement("div");
    div.id = prefix + "-" + key;
    div.className = "err-plot" + (cls ? " " + cls : "");
    card.appendChild(div);
    host.appendChild(card);
    out[key] = div;
  });
  return out;
}

function errPanels(host, block) {
  host.innerHTML = "";
  if (!block || !block.panels || !block.panels.length) {
    host.innerHTML = '<p class="err-empty">No almost_full plots for this package.</p>';
    return;
  }
  block.panels.forEach((p) => {
    const card = document.createElement("article");
    card.className = "err-card";
    const h = document.createElement("h3");
    h.textContent = p.alt || p.src;
    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.alt || "";
    card.appendChild(h);
    card.appendChild(img);
    host.appendChild(card);
  });
}

function drawErrColumn(host, prefix, pred, fallback) {
  if (!ERR_SCORES || !pred) {
    errPanels(host, fallback);
    return;
  }
  const { t, p } = pairFinite(ERR_SCORES.y_true, pred);
  if (!t.length) {
    host.innerHTML = '<p class="err-empty">No finite predictions for this package on test_v25.</p>';
    return;
  }
  const els = mountErr(host, prefix);
  drawDist(els.dist, t, p);
  drawHeat(els.heat, t, p);
  drawResid(els.resid, t, p);
  drawQuad(els.quad, els.note, t, p);
}

function drawErrors() {
  if (!$("err-base")) return;
  $("err-base-meta").textContent = ERRORS && ERRORS.baseline
    ? (ERRORS.baseline.title || "") + (ERRORS.baseline.note ? " — " + ERRORS.baseline.note : "")
    : "Local MSE baseline on test_v25";
  const basePred = ERR_SCORES && ERR_SCORES.pred ? ERR_SCORES.pred[ERR_SCORES.baseline_key] : null;
  drawErrColumn($("err-base"), "err-base", basePred, ERRORS && ERRORS.baseline);
  const block = CURRENT && ERRORS && ERRORS.by_id ? ERRORS.by_id[CURRENT] : null;
  $("err-h").textContent = block && block.title ? "Challenger · " + block.title : "Challenger";
  $("err-new-meta").textContent = block && block.note ? block.note : (block && block.doc ? block.doc : "");
  const newPred = ERR_SCORES && ERR_SCORES.pred ? ERR_SCORES.pred[CURRENT] : null;
  if (!newPred) {
    $("err-new").innerHTML = '<p class="err-empty">No cached test_v25 scores for this package (18 and 19 were never trained).</p>';
    return;
  }
  drawErrColumn($("err-new"), "err-new", newPred, block);
}

function scoreLabel(id) {
  if (id === "baseline_mse") return "pkg01 · MSE baseline";
  const v = META && META.variants ? META.variants.find((x) => x.id === id) : null;
  return v && v.label ? v.label : id;
}

function scoreNote(id) {
  if (id === "baseline_mse" && ERRORS && ERRORS.baseline) {
    return ERRORS.baseline.note || ERRORS.baseline.title || "";
  }
  const block = ERRORS && ERRORS.by_id ? ERRORS.by_id[id] : null;
  return block && block.note ? block.note : "";
}

function cmpOptions() {
  const keys = ERR_SCORES && ERR_SCORES.pred ? Object.keys(ERR_SCORES.pred) : [];
  const rank = (id) => {
    if (id === "baseline_mse") return 0;
    const m = id.match(/^pkg(\d+)/);
    return m ? Number(m[1]) : 99;
  };
  return keys.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

function fillCmpSelect(sel, preferred) {
  const opts = cmpOptions();
  const keep = opts.includes(sel.value) ? sel.value : (opts.includes(preferred) ? preferred : opts[0]);
  sel.innerHTML = "";
  opts.forEach((id) => {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = scoreLabel(id);
    sel.appendChild(o);
  });
  if (keep) sel.value = keep;
}

function clearCmpSide(side) {
  ["dist", "heat", "resid", "quad"].forEach((key) => {
    const el = $("cmp-" + side + "-" + key);
    if (!el) return;
    try {
      Plotly.purge(el);
    } catch (e) {}
    el.innerHTML = '<p class="err-empty">No cached test_v25 scores for this head.</p>';
  });
  const note = $("cmp-" + side + "-quad-note");
  if (note) note.textContent = "";
}

function drawCmpSide(side) {
  const id = $("cmp-" + side).value;
  const nameEl = $("cmp-" + side + "-name");
  if (nameEl) nameEl.textContent = scoreLabel(id);
  const pred = ERR_SCORES && ERR_SCORES.pred ? ERR_SCORES.pred[id] : null;
  if (!pred) {
    clearCmpSide(side);
    return;
  }
  const pair = pairFinite(ERR_SCORES.y_true, pred);
  if (!pair.t.length) {
    clearCmpSide(side);
    return;
  }
  drawDist($("cmp-" + side + "-dist"), pair.t, pair.p);
  drawHeat($("cmp-" + side + "-heat"), pair.t, pair.p);
  drawResid($("cmp-" + side + "-resid"), pair.t, pair.p);
  drawQuad($("cmp-" + side + "-quad"), $("cmp-" + side + "-quad-note"), pair.t, pair.p);
}

function resizeCmp() {
  ["a", "b"].forEach((side) => {
    ["dist", "heat", "resid", "quad"].forEach((key) => {
      const el = $("cmp-" + side + "-" + key);
      if (!el) return;
      try {
        Plotly.Plots.resize(el);
      } catch (e) {}
    });
  });
}

function drawCompare() {
  if (!$("cmp-a") || !ERR_SCORES) return;
  if (!CMP_READY) {
    fillCmpSelect($("cmp-a"), "baseline_mse");
    fillCmpSelect($("cmp-b"), CURRENT || "pkg02");
    CMP_READY = true;
  }
  const a = $("cmp-a").value;
  const b = $("cmp-b").value;
  $("cmp-status").textContent =
    `Comparing ${scoreLabel(a)} vs ${scoreLabel(b)} on test_v25 (n=${ERR_SCORES.n || ERR_SCORES.y_true.length}).`;
  drawCmpSide("a");
  drawCmpSide("b");
  requestAnimationFrame(resizeCmp);
}

function refreshTab() {
  if (TAB === "acc") draw();
  else if (TAB === "err") drawErrors();
  else if (TAB === "cmp") drawCompare();
}

function setTab(name) {
  TAB = name;
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  $("tab-acc").hidden = name !== "acc";
  $("tab-err").hidden = name !== "err";
  $("tab-cmp").hidden = name !== "cmp";
  $("ci-controls").hidden = name !== "acc";
  $("status").hidden = name !== "acc";
  document.body.classList.toggle("cmp-mode", name === "cmp");
  refreshTab();
}

function draw() {
  if (TAB !== "acc") return;
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
  refreshTab();
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
  try {
    ERRORS = await (await fetch("data/errors.json")).json();
  } catch (e) {
    ERRORS = { by_id: {} };
  }
  try {
    ERR_SCORES = await (await fetch("data/err_scores.json")).json();
  } catch (e) {
    ERR_SCORES = null;
  }
  $("page-title").textContent = META.title;
  $("caption").textContent = META.caption;
  $("note-html").innerHTML = META.note_html;
  buildPicker();
  $("conf").addEventListener("change", draw);
  $("band").addEventListener("change", draw);
  $("cmp-a").addEventListener("change", drawCompare);
  $("cmp-b").addEventListener("change", drawCompare);
  document.querySelectorAll(".tab").forEach((b) => {
    b.addEventListener("click", () => setTab(b.dataset.tab));
  });
  const fromHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const first = META.variants.some((v) => v.id === fromHash) ? fromHash : META.variants[0].id;
  await loadId(first);
}

boot().catch((e) => {
  $("status").textContent = "Failed to load dashboard data: " + e;
});

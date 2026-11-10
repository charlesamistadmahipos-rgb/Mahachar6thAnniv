// Diamond Ring – browser port of the pygame artwork by JIN2 (@jin_22ee), 2026.
// Personal use only: keep the credit, don't sell it or claim it as your own.

const CFG = { LOOP: 20, BUILD: 3.2, TURN: 12, FLOOR: -.78, DRAW0: .3, DRAW1: 5.6, TRAIL: .5 };
const CW = 6, CH = 9, AR = innerWidth / innerHeight, WIDE = AR > 2.375;   // the canvas is sized to your window so it covers the whole page
const W = WIDE ? Math.round(960 * AR / CW) * CW : 2280, H = WIDE ? 960 : Math.round(2280 / AR / CH) * CH;
const COLS = W / CW | 0, ROWS = H / CH | 0, RC = 180, ASPECT = RC * CW / (ROWS * CH); // ring lives in the left RC columns, text in the right free space
const TAU = Math.PI * 2, F = 2.9;
const { LOOP, BUILD, TURN, FLOOR, DRAW0, DRAW1 } = CFG;

const POOLS = ["1il!;:", "rtfjcvxz=+", "aeoun0{}[]<>", "08B$#&%Q"];
const CHARS = " .,:~+*^01|/\\-_#()x" + POOLS.join(""), AT = c => CHARS.indexOf(c);
const FILL = POOLS.map(p => Array.from({ length: 12 }, (_, k) => AT(p[k % p.length])));
const [BAND, PRONG, GEM, GLINT, FIRE_R, FIRE_B, FIRE_G, DUST, REFL, STAR] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const COLORS = [[214,220,232],[232,236,244],[226,238,255],[255,255,255],[255,170,200],[160,210,255],[255,230,160],[255,214,140],[150,150,165],[120,120,140],[255,105,180],[255,200,225]]; // 10 = text pink, 11 = light pink shine
const ST = COLORS.map(c => Array.from({ length: 21 }, (_, q) => `rgb(${c.map(v => v * q / 20 | 0)})`));
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x) };
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const rand = (seed, n, m) => { const r = rng(seed), a = new Float32Array(n * m); for (let i = 0; i < a.length; i++) a[i] = r(); return a };
const X = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l) };

/* ---------- ring geometry ---------- */
const R_BAND = .55, TUBE = .065, GIRDLE_Y = .88, GIRDLE_R = .25, TABLE_Y = 1, TABLE_R = .135, CULET_Y = .66;
const P = [], N = [], KD = [], PT = [], GF = [];
const add = (x, y, z, nx, ny, nz, k, part, gf) => { const l = Math.hypot(nx, ny, nz) || 1; P.push(x, y, z); N.push(nx / l, ny / l, nz / l); KD.push(k); PT.push(part); GF.push(gf) };

for (let i = 0; i < 520; i++) { const a = i / 520 * TAU, rr = TUBE * (1 - .35 * Math.pow(clamp(Math.sin(a)), 6));
  for (let j = 0; j < 44; j++) { const b = j / 44 * TAU, nx = Math.cos(a) * Math.cos(b), ny = Math.sin(a) * Math.cos(b), nz = Math.sin(b);
    add(Math.cos(a) * R_BAND + nx * rr, Math.sin(a) * R_BAND + ny * rr, nz * rr * 1.5, nx, ny, nz, BAND, 0, 0) } }

for (let i = 0; i < 4; i++) {
  const a = TAU * (i + .5) / 4, bx = .08 * Math.cos(a), by = R_BAND + .02, bz = .08 * Math.sin(a);
  const tx = (GIRDLE_R + .015) * Math.cos(a), ty = TABLE_Y - .03, tz = (GIRDLE_R + .015) * Math.sin(a);
  const dx = tx - bx, dy = ty - by, dz = tz - bz, d = norm([dx, dy, dz]), s = norm(X(d, [0, 0, 1])), w = X(s, d);
  for (let u = 0; u < 40; u++) for (let j = 0; j < 12; j++) {
    const ph = j / 12 * TAU, c = Math.cos(ph), sn = Math.sin(ph), f = u / 39;
    const nx = c * s[0] + sn * w[0], ny = c * s[1] + sn * w[1], nz = c * s[2] + sn * w[2];
    add(bx + f * dx + nx * .022, by + f * dy + ny * .022, bz + f * dz + nz * .022, nx, ny, nz, PRONG, 1, 0) } }

let fk = 0;
function facet(a, b, c, n) {
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const u = i / 15, v = j / 15; if (u + v > 1 + 1e-9) continue;
    add(a[0] + (b[0]-a[0]) * u + (c[0]-a[0]) * v, a[1] + (b[1]-a[1]) * u + (c[1]-a[1]) * v, a[2] + (b[2]-a[2]) * u + (c[2]-a[2]) * v, n[0], n[1], n[2], GEM, 10 + fk, fk) }
  fk++ }
for (let i = 0; i < 16; i++) {
  const a0 = TAU * i / 16, a1 = TAU * (i + 1) / 16;
  const g0 = [GIRDLE_R * Math.cos(a0), GIRDLE_Y, GIRDLE_R * Math.sin(a0)], g1 = [GIRDLE_R * Math.cos(a1), GIRDLE_Y, GIRDLE_R * Math.sin(a1)];
  const t0 = [TABLE_R * Math.cos(a0), TABLE_Y, TABLE_R * Math.sin(a0)], t1 = [TABLE_R * Math.cos(a1), TABLE_Y, TABLE_R * Math.sin(a1)], culet = [0, CULET_Y, 0];
  let crown = X(sub(g1, g0), sub(t0, g0)); const sg = Math.sign(crown[1]) || 1; crown = crown.map(v => v * sg);
  facet(g0, g1, t0, crown); facet(g1, t1, t0, [crown[0], crown[1] * 1.15, crown[2]]);
  const pv = X(sub(culet, g0), sub(g1, g0)), sp = -Math.sign(pv[1]) || 1;
  facet(g0, g1, culet, pv.map(v => v * sp)); facet([0, TABLE_Y, 0], t0, t1, [0, 1, 0]) }

const NPTS = P.length / 3, RP = Float32Array.from(P), RN = Float32Array.from(N), KD_ = Uint8Array.from(KD), PT_ = Int16Array.from(PT), GF_ = Uint8Array.from(GF);
const ORD = new Float32Array(NPTS);
for (let i = 0; i < NPTS; i++) { const x = RP[i*3], y = RP[i*3+1], k = KD_[i];
  if (k === BAND) { const a = Math.atan2(y, x) + Math.PI / 2; ORD[i] = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) / Math.PI }
  else if (k === PRONG) ORD[i] = 1 + (y - R_BAND) / (TABLE_Y - R_BAND) * .25;
  else ORD[i] = 1.25 + (y - CULET_Y) / (TABLE_Y - CULET_Y) * .45 }
let ORDMAX = 0; for (const v of ORD) if (v > ORDMAX) ORDMAX = v;

/* ---------- camera ---------- */
const EYE = [0, .85, 4.7], FWD = norm(sub([0, .22, 0], EYE)), RIGHT = norm(X(FWD, [0, 1, 0])), UP = X(RIGHT, FWD), VIEW = FWD.map(v => -v);
let PX, PY, PZ;
function project(x, y, z) {
  const rx = x - EYE[0], ry = y - EYE[1], rz = z - EYE[2];
  const cx = rx * RIGHT[0] + ry * RIGHT[1] + rz * RIGHT[2], cy = rx * UP[0] + ry * UP[1] + rz * UP[2];
  PZ = rx * FWD[0] + ry * FWD[1] + rz * FWD[2]; const zz = Math.max(PZ, .2);
  PX = Math.floor((.5 + cx / zz * F * .5) * RC); PY = Math.floor((.5 - cy / zz * F * .5 * ASPECT) * ROWS);
  return PZ > .2 && PX >= 0 && PX < COLS && PY >= 0 && PY < ROWS }

/* ---------- particles ---------- */
const SPK = rand(13, 2600, 5), SPK_IDX = Array.from({ length: 2600 }, (_, i) => Math.floor(SPK[i*5] * NPTS));
const BUR = rand(14, 700, 3), HAL = rand(15, 900, 2), DST = rand(5, 520, 4), STR = rand(2, 90, 3);
const CAP = NPTS * 2 + 6000, LI = new Int16Array(CAP), LJ = new Int16Array(CAP), LS = new Float32Array(CAP), LT = new Uint8Array(CAP); let LN = 0;
const addP = (x, y, z, sh, tg) => { if (sh > .02 && project(x, y, z)) { LI[LN] = PY; LJ[LN] = PX; LS[LN] = sh; LT[LN] = tg; LN++ } };

/* ---------- grids ---------- */
const part = new Int16Array(COLS * ROWS), depth = new Float32Array(COLS * ROWS), lum = new Float32Array(COLS * ROWS), tag = new Uint8Array(COLS * ROWS), chr = new Uint8Array(COLS * ROWS);
const outlineLetter = (gx, gy) => { const ax = Math.abs(gx), ay = Math.abs(gy);
  if (ax + ay === 0) return AT("+"); return AT(ax > 2 * ay ? "|" : ay > 2 * ax ? (gy > 0 ? "_" : "-") : gx * gy > 0 ? "/" : "\\") };
const KEY = norm([0, .8, .6]);

/* ---------- your text: edit the lines, timings (t0/t1 = seconds it takes to draw) and size here ---------- */
const TEXT = [
  { s: "haii, streak?",      cap: 120, y: 370, t0: .8,  t1: 3.0 },
  { s: "MAY 11, 7:23PM",     cap: 76,  y: 500, t0: 3.0, t1: 4.6 },
  { s: "6 MONTHS TOGETHER!", cap: 76,  y: 590, t0: 4.6, t1: 6.6 }
];
const TCOLS = COLS - RC, TR = [], TRW = [], TCL = [], TL = [], TXN = [], TPH = [], tr_ = rng(77);
(function () {
  const o = document.createElement("canvas"); o.width = TCOLS * CW; o.height = ROWS * CH; const x = o.getContext("2d");
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff";
  TEXT.forEach((L, li) => {
    const fam = '"Arial Black","Segoe UI Black",Impact,sans-serif'; let px = L.cap;
    x.font = `900 ${px}px ${fam}`; const w = x.measureText(L.s).width, maxW = o.width * .92;
    if (w > maxW) { px *= maxW / w; x.font = `900 ${px}px ${fam}`; }
    x.clearRect(0, 0, o.width, o.height); x.fillText(L.s, o.width / 2, L.y + (o.height - 960) / 2);
    const d = x.getImageData(0, 0, o.width, o.height).data, pts = []; let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < TCOLS; c++) {
      let a = 0; for (let yy = 0; yy < CH; yy += 3) for (let xx = 0; xx < CW; xx += 2) a += d[((r * CH + yy) * o.width + c * CW + xx) * 4 + 3];
      if (a / (9 * 255) > .4) { pts.push([r, c]); x0 = Math.min(x0, c); x1 = Math.max(x1, c); y0 = Math.min(y0, r); y1 = Math.max(y1, r) } }
    pts.forEach(([r, c]) => { const xn = (c - x0) / (x1 - x0 || 1), yn = (r - y0) / (y1 - y0 || 1);
      TR.push(L.t0 + (L.t1 - L.t0) * (.9 * xn + .1 * yn)); TRW.push(r); TCL.push(RC + c); TL.push(li); TXN.push(c / TCOLS); TPH.push(tr_()) }) });
})();
const TN = TR.length, TSP = rand(21, 1400, 5);
const BGD = rand(41, 900, 4), BST = rand(42, 180, 3), BBU = rand(44, 2400, 3);
const BGS = rand(31, 170, 5); // background sparkles: more = 170 -> bigger number
const addS = (r, c, sh, tg) => { r = Math.floor(r); c = Math.floor(c); if (sh > .02 && r >= 0 && r < ROWS && c >= 0 && c < COLS) { LI[LN] = r; LJ[LN] = c; LS[LN] = sh; LT[LN] = tg; LN++ } };

function frame(t) {
  const yaw = TAU * Math.max(t - DRAW1 - .6, 0) / TURN, cy = Math.cos(yaw), sy = Math.sin(yaw);
  part.fill(-1); depth.fill(99); lum.fill(0); tag.fill(0); chr.fill(0); LN = 0;
  const head = (t - DRAW0) / (DRAW1 - DRAW0) * ORDMAX, rim = norm([Math.cos(t * .9), .5, Math.sin(t * .9)]);
  const hk = norm(KEY.map((v, i) => v + VIEW[i])), hr = norm(rim.map((v, i) => v + VIEW[i]));
  const flash = Math.exp(-(((t - DRAW1 - .15) / .18) ** 2)), fl = 1 + .8 * flash; let glints = 0;

  for (let i = 0; i < NPTS; i++) {
    const o = i * 3, px = RP[o], py = RP[o+1], pz = RP[o+2], x = cy * px + sy * pz, z = -sy * px + cy * pz;
    const k = smooth((head - ORD[i]) / .06);
    if (k < .96) { if (Math.abs(head - ORD[i]) < .035) addP(x, py, z, 1.2 * fl, GLINT); continue }
    const n0 = RN[o], n1 = RN[o+1], n2 = RN[o+2], nx = cy * n0 + sy * n2, nz = -sy * n0 + cy * n2;
    const diff = clamp(nx * KEY[0] + n1 * KEY[1] + nz * KEY[2]);
    const spec = Math.pow(clamp(nx * hk[0] + n1 * hk[1] + nz * hk[2]), 30) + .9 * Math.pow(clamp(nx * hr[0] + n1 * hr[1] + nz * hr[2]), 24);
    let sh, kind = KD_[i];
    if (kind === GEM) { sh = .8 + .2 * diff + 1.4 * spec;
      if (spec > .18) { glints++; const f = (GF_[i] + Math.floor(t * 7)) % 4; kind = f === 0 ? GLINT : f === 1 ? FIRE_R : f === 2 ? FIRE_B : FIRE_G } }
    else { sh = .5 + .35 * diff + .9 * spec; if (spec > .5) kind = GLINT }
    if (project(x, py, z)) { const c = PY * COLS + PX; if (PZ < depth[c]) { depth[c] = PZ; part[c] = PT_[i]; lum[c] = sh * fl; tag[c] = kind } }
    addP(x, 2 * FLOOR - py - .06, z, .22 * clamp(sh, 0, 1.2), REFL);
  }

  const on = smooth((t - BUILD + .5) / 1.5);
  for (let i = 0; i < 520; i++) { const d = i * 4, a = DST[d] * TAU + t * (.3 + .5 * DST[d+1]), r = .9 + .8 * DST[d+2];
    const y = ((DST[d+3] * 2.4 + t * .08) % 2.4) - .8, tw = .25 + .75 * Math.pow(clamp(Math.sin(t * (2 + 3 * DST[d+1]) + DST[d] * 40)), 4);
    addP(Math.cos(a) * r, y, Math.sin(a) * r * .7, tw * on, DUST) }
  for (let i = 0; i < 90; i++) addP(STR[i*3] * 10 - 5, STR[i*3+1] * 6 - 1.5, -6, .1 + .1 * Math.sin(t * 2 + STR[i*3+2] * TAU), STAR);
  for (let i = 0; i < 2600; i++) { const s = i * 5, idx = SPK_IDX[i], born = DRAW0 + ORD[idx] / ORDMAX * (DRAW1 - DRAW0), age = t - born, life = .9 + .9 * SPK[s+1];
    if (age <= 0 || age >= life) continue;
    const a = SPK[s+2] * TAU, m = .4 + .6 * SPK[s+3], g = .5 * 2.2 * age * age, glow = Math.pow(clamp(1 - age / life), 1.3) * (.6 + .4 * Math.sin(age * 30 + a));
    addP(RP[idx*3] + Math.cos(a) * m * age, RP[idx*3+1] + (.5 + .9 * SPK[s+4]) * age - g, RP[idx*3+2] + Math.sin(a) * m * age, glow, SPK[s+3] > .7 ? GLINT : DUST) }
  const kb = t - DRAW1 - .1;
  if (kb >= 0 && kb <= 2.2) for (let i = 0; i < 700; i++) { const a = BUR[i*3] * TAU, r = .85 + 2.4 * (1 - Math.exp(-kb * 2)) * (.97 + .06 * BUR[i*3+1]), b1 = BUR[i*3+1];
    addP(Math.cos(a) * r, .42 + Math.sin(a) * r, (BUR[i*3+2] - .5) * .05 - .4, Math.pow(clamp(1 - kb / 2.2), 1.5), b1 < .25 ? FIRE_R : b1 < .45 ? FIRE_B : b1 < .6 ? FIRE_G : GLINT) }
  const hon = smooth((t - DRAW1 - .3) / 1.5);
  if (hon > 0) for (let i = 0; i < 900; i++) { const orb = i < 450 ? 0 : 1, tilt = orb ? -.55 : .55, a = HAL[i*2] * TAU + t * (orb ? -.7 : .9);
    const hx = Math.cos(a) * 1.05, hy = Math.sin(a) * .32, hz = Math.sin(a) * .95, c = Math.cos(tilt), s = Math.sin(tilt), hd = (HAL[i*2] * 37 + t * 1.3) % 1;
    addP(hx * c - hy * s, hx * s + hy * c + .42, hz, hon * (.15 + .85 * clamp(1 - hd * 3)) * (.6 + .4 * Math.sin(t * 6 + HAL[i*2+1] * TAU)), HAL[i*2+1] > .5 ? DUST : GLINT) }

  /* your text: drawn out like the ring, then shimmers */
  const sw = (t * .25) % 1.6 - .3;
  for (let i = 0; i < TN; i++) {
    const dt = t - TR[i], k = smooth(dt / .12);
    if (k < .96) { if (Math.abs(dt) < .07) addS(TRW[i], TCL[i], 1.2 * fl, 11); continue }
    let sh = .95, kind = 10; const b = Math.exp(-((((TXN[i] + TRW[i] / ROWS * .15) - sw) / .05) ** 2));
    if (b > .02) { sh += b * .9; if (b > .35) kind = 11 }
    if (Math.sin(t * 4 + TPH[i] * 43) > .992) { kind = FIRE_R; sh = 1.4 }
    const c = TRW[i] * COLS + TCL[i]; if (1 < depth[c]) { depth[c] = 1; part[c] = 30 + TL[i]; lum[c] = sh * fl; tag[c] = kind } }
  for (let i = 0; i < 1400; i++) { const s = i * 5, j = Math.floor(TSP[s] * TN), age = t - TR[j], life = .8 + .8 * TSP[s+1];
    if (!(age > 0 && age < life)) continue;
    const a = TSP[s+2] * TAU, m = .4 + .6 * TSP[s+3];
    addS(TRW[j] - (.5 + .9 * TSP[s+4]) * 10 * age + 17 * age * age, TCL[j] + Math.cos(a) * m * 14 * age, Math.pow(clamp(1 - age / life), 1.3) * (.6 + .4 * Math.sin(age * 30 + a)), TSP[s+3] > .7 ? 11 : 10) }

  /* background effects now cover the entire screen, including the open spaces around the text */
  const wide = smooth((t - BUILD + .5) / 1.5);
  for (let i = 0; i < 900; i++) { const d = i * 4, sp = BGD[d+3];
    const r = (((BGD[d+1] * ROWS - t * (.8 + 2 * sp)) % ROWS) + ROWS) % ROWS, c = BGD[d] * COLS + Math.sin(t * .5 + BGD[d+2] * TAU) * 3;
    addS(r, c, (.25 + .75 * Math.pow(clamp(Math.sin(t * (2 + 3 * sp) + BGD[d+2] * 40)), 4)) * wide * fl * .8, DUST) }
  for (let i = 0; i < 180; i++) { const c = BST[i*3] * COLS, r = BST[i*3+1] * ROWS;
    addS(r, c, .1 + .1 * Math.sin(t * 2 + BST[i*3+2] * TAU), STAR) }
  const kb2 = t - DRAW1 - .1;     // a ring of light that sweeps out across the whole screen
  if (kb2 >= 0 && kb2 <= 3.4) for (let i = 0; i < 2400; i++) { const a = BBU[i*3] * TAU, b1 = BBU[i*3+1], R = (1 - Math.exp(-kb2 * 1.1)) * 330 * (.97 + .06 * b1);
    addS(ROWS * .5 + Math.sin(a) * R * .667, COLS / 2 + Math.cos(a) * R, Math.pow(clamp(1 - kb2 / 3.4), 1.2), b1 < .25 ? FIRE_R : b1 < .45 ? FIRE_B : b1 < .6 ? FIRE_G : GLINT) }

  /* outlines + fill characters */
  const spark = []; let count = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const idx = r * COLS + c, pa = part[idx]; if (pa < 0) continue; count++;
    let edge = false, gx = 0, gy = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue;
      const rr = r + dy, cc = c + dx, inb = rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS, ni = rr * COLS + cc;
      const nb = inb ? part[ni] : -1, nz = inb ? depth[ni] : 99;
      if (nb < 0 || (nb !== pa && nz > depth[idx] + .02)) { gx += dx; gy += dy; if (!dx || !dy) edge = true } }
    const h = (r * 7919 + c * 104729) % 9973, lv = clamp(Math.floor(lum[idx] * 3.2), 0, 3);
    const tg = tag[idx], sp = tg >= GLINT && tg <= FIRE_G;
    chr[idx] = sp ? AT("*") : edge ? outlineLetter(gx, gy) : FILL[lv][(h + Math.floor(t * 4 + h % 11)) % 12];
    lum[idx] = edge ? Math.max(.75, lum[idx]) : clamp(lum[idx], .3, 1);
    if (sp) spark.push([lum[idx] + (h % 7) * .01, r, c]) }

  for (let n = 0; n < LN; n++) { const r = LI[n], c = LJ[n], idx = r * COLS + c; if (part[idx] >= 0) continue;
    const fs = LS[n], tg = LT[n]; let ch;
    if (tg === REFL) ch = FILL[clamp(Math.floor(fs * 6), 0, 1)][(r * 31 + c) % 12];
    else if (tg === DUST) ch = AT(fs > .7 ? "*" : fs > .35 ? "+" : ".");
    else if (tg === STAR) ch = AT(".");
    else ch = AT("&8%"[(r + c) % 3]);
    chr[idx] = ch; lum[idx] = clamp(fs); tag[idx] = tg }

  /* rays from the six brightest glints */
  spark.sort((a, b) => b[0] - a[0]);
  spark.slice(0, 6).forEach(([, cy0, cx0], n) => {
    const reach = Math.floor(5 + 9 * (.5 + .5 * Math.sin(t * 7 + n * 1.7)));
    const put = (yy, xx, ch, v) => { if (yy >= 0 && yy < ROWS && xx >= 0 && xx < COLS) { const i = yy * COLS + xx; if (lum[i] < v) { chr[i] = AT(ch); lum[i] = v; tag[i] = GLINT } } };
    for (let d = 1; d <= reach; d++) { const fade = 1 - d / (reach + 1);
      put(cy0, cx0 + d * 2, "-", fade); put(cy0, cx0 - d * 2, "-", fade); put(cy0 + d, cx0, "|", fade); put(cy0 - d, cx0, "|", fade);
      if (d <= reach >> 1) { put(cy0 + d, cx0 + d, "\\", fade * .7); put(cy0 - d, cx0 - d, "\\", fade * .7); put(cy0 + d, cx0 - d, "/", fade * .7); put(cy0 - d, cx0 + d, "/", fade * .7) } }
    chr[cy0 * COLS + cx0] = AT("*"); lum[cy0 * COLS + cx0] = 1 });
  /* sparkles with rays, swept across the entire screen, including the text area */
  const putS = (yy, xx, ch, v, tg) => { if (yy < 0 || yy >= ROWS || xx < 0 || xx >= COLS) return; const j = yy * COLS + xx; if (part[j] >= 0 || lum[j] >= v) return; chr[j] = AT(ch); lum[j] = v; tag[j] = tg };
  for (let i = 0; i < 170; i++) {
    const s5 = i * 5, rt = 3.5 + BGS[s5] * 4;     // 3.5 = when it starts, 4 = seconds to cross the screen
    if (t < rt) continue;
    const sp = BGS[s5+3], p = Math.pow(Math.max(0, Math.sin(t * (1.2 + 2 * sp) + BGS[s5+2] * TAU)), 6) * fl;
    const r = Math.floor((((BGS[s5+1] * ROWS - t * (.6 + 1.4 * sp)) % ROWS) + ROWS) % ROWS), c = Math.floor(BGS[s5] * COLS);
    const tg = i % 2 ? (i % 4 === 1 ? DUST : 11) : [GLINT, FIRE_R, FIRE_B, FIRE_G][(i + Math.floor(t * 7)) % 4];
    if (t - rt < .15) { putS(r, c, "*", 1, GLINT); for (let d = 1; d <= 6; d++) { putS(r, c + d * 2, "-", 1 - d / 7, GLINT); putS(r, c - d * 2, "-", 1 - d / 7, GLINT) } continue }
    if (p < .05) continue;
    putS(r, c, p > .6 ? "*" : p > .3 ? "+" : ".", .3 + .7 * p, tg);
    if (i % 3 === 0 && p > .45) { const reach = 2 + Math.floor(8 * Math.min(p, 1));
      for (let d = 1; d <= reach; d++) { const fade = p * (1 - d / (reach + 1));
        putS(r, c + d * 2, "-", fade, tg); putS(r, c - d * 2, "-", fade, tg); putS(r + d, c, "|", fade, tg); putS(r - d, c, "|", fade, tg);
        if (d <= reach >> 1) { putS(r + d, c + d, "\\", fade * .7, tg); putS(r - d, c - d, "\\", fade * .7, tg); putS(r + d, c - d, "/", fade * .7, tg); putS(r - d, c + d, "/", fade * .7, tg) } } } }
  return { deg: (yaw * 180 / Math.PI) % 360, glints, count };
}

/* ---------- draw + loop ---------- */
const cv = document.getElementById("c"), ctx = cv.getContext("2d"), hud = document.getElementById("hud"), clk = document.getElementById("clk");
cv.width = W; cv.height = H;
ctx.font = '10px Consolas,Menlo,"DejaVu Sans Mono",monospace'; ctx.textBaseline = "middle"; ctx.textAlign = "center";

// ADD YOUR THINGS HERE: runs every frame after the ring is drawn (ctx = the 2280x960 canvas, t = seconds into the loop)
function onFrame(ctx, t) {}

function render(t) {
  const info = frame(t);
  ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = `rgba(0,0,0,${CFG.TRAIL})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over";
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c, ch = chr[i]; if (!ch) continue;
    ctx.fillStyle = ST[tag[i]][Math.round(clamp(lum[i]) * 20)]; ctx.fillText(CHARS[ch], c * CW + CW / 2, r * CH + CH / 2) }
  onFrame(ctx, t);
  hud.textContent = `rotation ${info.deg.toFixed(2).padStart(6, "0")}°   glints ${String(info.glints).padStart(4)}\nletters ${String(info.count).padStart(5, "0")}`;
  clk.textContent = `${Math.floor(t * 2) % 2 ? " " : "●"} t ${t.toFixed(2).padStart(5, "0")}s`;
}

let t = 0, paused = false, last = performance.now();
const wipe = () => ctx.clearRect(0, 0, W, H);
function tick(now) {
  requestAnimationFrame(tick); const dt = now - last; if (dt < 33) return; last = now;
  if (paused) return; t += Math.min(dt / 1000, 1 / 15); if (t > LOOP) { t = 0; wipe() } render(t) }
addEventListener("keydown", e => {
  if (e.code === "Space") { e.preventDefault(); paused = !paused }
  if (e.key === "r" || e.key === "R") { t = 0; wipe() }
  if (e.key === "s" || e.key === "S") { const s = document.createElement("canvas"); s.width = W; s.height = H; const x = s.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H); x.drawImage(cv, 0, 0);
    s.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `diamond_ring_${Date.now()}.png`; a.click() }) } });
// always fit the whole 2280x960 picture inside the window
const stage = document.getElementById("stage");
function fit() { const k = Math.max(innerWidth / W, innerHeight / H); stage.style.width = W * k + "px"; stage.style.height = H * k + "px" }
let rz; addEventListener("resize", () => { fit(); clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(innerWidth / innerHeight - AR) / AR > .03) location.reload() }, 400) }); fit();
render(0); requestAnimationFrame(tick);

/* ---------- music: song2.mp3 plays from 1:24 to the end, then repeats from 1:24 ---------- */
(() => {
const S2_START = 84, FILE = "song2.mp3";                       // 84 s = 1:24 (change here)
const song2 = document.getElementById("song2") || Object.assign(new Audio(), { preload: "auto" });   // works even if ring.html has no <audio> tag
if (!song2.getAttribute("src")) song2.src = FILE;
const msg = document.createElement("div");                           // small on-screen note so you can see what's happening
msg.style.cssText = "position:fixed;left:0;right:0;bottom:28px;text-align:center;font:12px Consolas,monospace;letter-spacing:.2em;color:#ff7ab6;pointer-events:none;transition:opacity 1s;opacity:0";
document.body.appendChild(msg);
const say = (t, ms) => { msg.textContent = t; msg.style.opacity = t ? 1 : 0; if (ms) setTimeout(() => { msg.style.opacity = 0 }, ms) };
let playing = false;
const seek = () => { try { song2.currentTime = S2_START } catch (e) {} };
song2.addEventListener("loadedmetadata", () => { if (!playing) seek() });
song2.addEventListener("ended", () => { seek(); song2.play().catch(() => {}) });   // too long on this page? it starts over at 1:24
song2.addEventListener("error", () => say("can't load " + FILE + " - is it in the same folder as ring.html?"));
function begin() {
  if (playing || window.parent !== window) return; seek(); song2.volume = 0;
  const p = song2.play(); if (!p) return;
  p.then(() => { playing = true; say(""); let v = 0; const iv = setInterval(() => { v = Math.min(1, v + .04); song2.volume = v; if (v >= 1) clearInterval(iv) }, 80) })
   .catch(err => { if (err && err.name === "NotAllowedError") say("tap anywhere for sound") });
}
if (window.parent === window) begin();                                // (inside index.html the main page plays the music) starts by itself when the browser allows it...
["pointerdown", "keydown", "touchstart", "click"].forEach(ev => addEventListener(ev, begin));   // ...otherwise on the first tap / key
})();
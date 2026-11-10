/* ---------- SETTINGS ---------- */
const CFG = {
  FROM: 0,      // video.mp4 is now pre-trimmed (old 0:48 -> end), so it starts at 0
  TO: 291,      // length of the trimmed clip; it loops back to FROM
  DRAW: 10,
  TRAIL: .4,
  NEXT: "ring.html",
  S2_START: 84
};

/* ---------- MEDIA AND PAGES ---------- */
const video = document.getElementById("bg");
const song = document.getElementById("song");
const nav = document.getElementById("nav");
const cap = document.getElementById("cap");
const pages = [...document.querySelectorAll(".page")];

let page = 1;
let started = false;
let t0 = 0;
let ready = false;

video.preload = "auto";
video.muted = true;
video.loop = CFG.FROM === 0;   // native seamless loop when the clip is already trimmed

function playVideoFromStart() {
  if (!video) return;

  const playWhenReady = () => video.play().catch(() => {});

  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    video.addEventListener("loadedmetadata", () => {
      if (video.currentTime < CFG.FROM) {
        video.addEventListener("seeked", playWhenReady, { once: true });
        video.currentTime = CFG.FROM;
      } else {
        playWhenReady();
      }
    }, { once: true });
    return;
  }

  if (video.currentTime < CFG.FROM) {
    video.addEventListener("seeked", playWhenReady, { once: true });
    video.currentTime = CFG.FROM;
  } else {
    playWhenReady();
  }
}

document.getElementById("start").addEventListener("click", e => {
  if (started) return;

  started = true;
  e.currentTarget.classList.add("gone");

  song.currentTime = 0;
  song.play().catch(() => {});

  const s2 = document.getElementById("song2");
  s2.volume = 0;
  s2.play().then(() => s2.pause()).catch(() => {});

  // start the video right away (muted, behind page 1) so it is already
  // playing smoothly by the time page 2 fades it in
  playVideoFromStart();

  document.body.classList.add("on");
  t0 = performance.now() + 1500;
});

function go(n) {
  if (!ready || n < 1) return;
  if (n > pages.length) return leave();

  page = n;

  pages.forEach((p, i) =>
    p.classList.toggle("show", i === n - 1)
  );

  video.classList.toggle("show", n >= 2);

  if (n === 2) {
    fitLetter();
    if (window.startPendantDrop) window.startPendantDrop();
    startLetter();
  }

  if (window.faceShow) window.faceShow(n === 3);

  if (n >= 2 && video.paused) {
    playVideoFromStart();
  }
}

function leave() {
  ready = false;
  document.body.classList.add("out");

  const iv = setInterval(() => {
    song.volume = Math.max(0, song.volume - .06);
    if (song.volume <= 0) clearInterval(iv);
  }, 90);

  setTimeout(() => {
    song.pause();
    video.pause();
    openRing();
  }, 1700);
}

function openRing() {
  const song2 = document.getElementById("song2");

  const seek = () => {
    try {
      song2.currentTime = CFG.S2_START;
    } catch (e) {}
  };

  const f = document.createElement("iframe");
  f.src = CFG.NEXT;
  f.setAttribute("allow", "autoplay");

  f.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;border:0;background:#000;z-index:50;opacity:0;transition:opacity 1.5s ease";

  document.documentElement.appendChild(f);

  f.addEventListener("load", () => {
    f.style.opacity = 1;
    try {
      f.contentWindow.focus();
    } catch (e) {}
  });

  setTimeout(() => {
    f.style.opacity = 1;
  }, 2500);

  song2.addEventListener("playing", () => {
    if (song2.currentTime < CFG.S2_START - 2) seek();
  }, { once: true });

  seek();
  song2.volume = 0;

  song2.addEventListener("ended", () => {
    seek();
    song2.play().catch(() => {});
  });

  song2.play().then(() => {
    let v = 0;

    const iv = setInterval(() => {
      v = Math.min(1, v + .04);
      song2.volume = v;

      if (v >= 1) clearInterval(iv);
    }, 80);
  }).catch(() => {});
}

document.getElementById("next").onclick = () => go(page + 1);
document.getElementById("prev").onclick = () => go(page - 1);

addEventListener("keydown", e => {
  if (e.key === "ArrowRight") go(page + 1);
  if (e.key === "ArrowLeft") go(page - 1);
});


/* ---------- PAGE 2: LOVE LETTER ---------- */
const LETTER = "We’ve been through so much together. We’ve had countless misunderstandings, arguments, difficult conversations, and moments when we questioned whether we could overcome everything in front of us. There were times when we struggled to understand each other, times when our feelings got hurt, and moments when the thought of losing one another became a fear we couldn’t easily ignore. But through every argument, every disagreement, and every challenge, we’ve also had beautiful moments that reminded us why we started in the first place. I know we aren’t perfect, and I know loving each other hasn’t always been easy. We’ve both had our shortcomings, made mistakes, and faced days when things felt heavier than they should. But one thing I never want you to question is how much you mean to me. I don’t expect us to have a perfect love story. I just hope we continue learning, growing, forgiving, and understanding each other along the way. We’ve come this far, and every challenge has become another part of our story. If there’s one thing I want you to remember, it’s that I never wanted a love that only stayed during the easy days. I wanted a love that would keep growing even when things got difficult. I love you so much, Maha, and I hope to keep loving you until the very end of our story.";

const letter = document.getElementById("letter");
const lt = document.getElementById("lt");
const LEAD = 3.2;
const WORD = 150;

LETTER.split(/\s+/).forEach(w => {
  const sp = document.createElement("span");
  sp.className = "w";
  sp.textContent = w;
  lt.appendChild(sp);
  lt.appendChild(document.createTextNode(" "));
});

let typed = false;

function startLetter() {
  if (typed) return;
  typed = true;

  const ws = [...lt.querySelectorAll(".w")];
  let i = 0;

  const next = () => {
    if (i >= ws.length) return;

    const w = ws[i++];
    w.classList.add("on");

    const x = w.textContent.trim();

    setTimeout(
      next,
      WORD + (/[.!?]$/.test(x) ? 400 : /,$/.test(x) ? 170 : 0)
    );
  };

  setTimeout(next, LEAD * 1000);
}

function fitLetter() {
  let fs = Math.min(46, innerWidth / 26);
  lt.style.fontSize = fs + "px";

  while (lt.offsetHeight > letter.clientHeight && fs > 11) {
    fs -= .5;
    lt.style.fontSize = fs + "px";
  }
}

fitLetter();
addEventListener("resize", fitLetter);

if (document.fonts) {
  document.fonts.ready.then(fitLetter);
}


/* ---------- PAGE 1: BOUQUET ---------- */
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) =>
  x < a ? a : x > b ? b : x;

const rng = s => () => {
  s |= 0;
  s = s + 0x6D2B79F5 | 0;
  let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

const X = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

const norm = v => {
  const l = Math.hypot(...v) || 1;
  return v.map(x => x / l);
};

const R = rng(11);

const COLORS = [
  [120,215,140],[70,190,110],[255,95,150],
  [225,45,95],[255,185,212],[245,232,220],
  [255,120,175],[255,255,255],[255,214,140],
  [255,255,255]
];

const [STEM,LEAF,ROSE,DEEP,PALE,PAPER,RIBBON,WHITE,GOLD,GLINT] =
  [0,1,2,3,4,5,6,7,8,9];

const POOLS = ["1il!;:", "rtfjcvxz=+", "aeoun0{}[]<>", "08B$#&%Q"];
const ALL = " .,:~+*^01|/\\-_#()x" + POOLS.join("");
const AT = c => ALL.indexOf(c);

const P = [], N = [], C = [], O = [], M = [], PT = [];

const add = (x,y,z,n,c,o,m,pt) => {
  n = norm(n);
  P.push(x,y,z);
  N.push(n[0],n[1],n[2]);
  C.push(c);
  O.push(o);
  M.push(m);
  PT.push(pt);
};

const heads = [[0,.72,0,.25]];

for (let k = 0; k < 6; k++) {
  const a = k / 6 * TAU + .3;
  heads.push([
    Math.cos(a) * .52,
    .5 + .05 * R(),
    Math.sin(a) * .52,
    .21
  ]);
}

for (let k = 0; k < 6; k++) {
  const a = k / 6 * TAU + .8;
  heads.push([
    Math.cos(a) * .86,
    .1 + .06 * R(),
    Math.sin(a) * .86,
    .18
  ]);
}

const coneR = y => .06 + (y + .95) / .75 * .62;

for (let j = 0; j < 40; j++)
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * TAU;
    const y = -.95 + j / 39 * (.75 + .04 * Math.sin(a * 5) * (j / 39));
    const r = coneR(y);

    add(
      Math.cos(a) * r,y,Math.sin(a) * r,
      [Math.cos(a),.4,Math.sin(a)],
      PAPER,j / 39 * .3,
      .62 + .38 * Math.abs(Math.sin(a * 6)),1
    );
  }

for (let j = 0; j < 5; j++)
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * TAU;
    const y = -.62 + j * .018;
    const r = coneR(y) + .015;

    add(
      Math.cos(a) * r,y,Math.sin(a) * r,
      [Math.cos(a),.2,Math.sin(a)],
      RIBBON,.33,1,2
    );
  }

const bz = coneR(-.58) + .05;

[-1,1].forEach((s,q) => {
  for (let l = 0; l < 3; l++)
    for (let i = 0; i < 44; i++) {
      const a = i / 44 * TAU;

      add(
        s * (.15 + .11 * Math.cos(a)),
        -.56 + .075 * Math.sin(a) + l * .004,
        bz + l * .01,
        [s * .3,0,1],
        RIBBON,.35,.8 + .3 * (l / 2),3 + q
      );
    }

  for (let i = 0; i < 24; i++) {
    const f = i / 23;

    add(
      s * (.03 + .1 * f),
      -.58 - .3 * f,
      bz - .01,
      [s * .4,0,1],
      RIBBON,.36,.9,5 + q
    );
  }
});

for (let i = 0; i < 18; i++) {
  const a = i / 18 * TAU;

  add(
    .035 * Math.cos(a),
    -.56 + .035 * Math.sin(a),
    bz + .02,
    [0,0,1],
    PALE,.37,1,7
  );
}

for (let k = 0; k < 14; k++) {
  const a = k / 14 * TAU + .2;
  const tR = .85 + .15 * R();
  const ty = .0 + .22 * R();

  for (let u = 0; u < 26; u++)
    for (let v = -4; v <= 4; v++) {
      const f = u / 25;
      const w = .095 * Math.sin(f * Math.PI) * v / 4;
      const rr = .2 + (tR - .2) * f;
      const y = -.2 + (ty + .2) * f + .05 * Math.sin(f * Math.PI);

      add(
        Math.cos(a) * rr - Math.sin(a) * w,
        y,
        Math.sin(a) * rr + Math.cos(a) * w,
        [Math.cos(a) * .4,1,Math.sin(a) * .4],
        LEAF,.4 + f * .2,
        v === 0 ? 1.25 : .7 + .3 * (1 - Math.abs(v) / 4),
        20 + k
      );
    }
}

heads.forEach(([hx,hy,hz,sc],k) => {
  const hc = [hx,hy,hz];
  const a = norm([hx,hy + .4,hz]);
  const u = norm(X(a,Math.abs(a[2]) > .95 ? [1,0,0] : [0,0,1]));
  const v = X(a,u);

  for (let f = 0; f < 18; f++) {
    const t = f / 17;

    add(
      hx * (1 - t) * .98,
      -.2 + (hy - .08 + .2) * t,
      hz * (1 - t),
      [1,0,0],
      STEM,.12 + t * .2,.8,60
    );
  }

  for (let i = 0; i < 760; i++) {
    const t = i / 760;
    const ang = t * TAU * 5.5 + k;
    const r = sc * (.08 + .92 * Math.sqrt(t));
    const rr = r / sc;
    const h = sc * (.05 + .8 * Math.pow(rr,1.8));
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const rim = (t * 5.5) % 1 < .14;
    const col = rim ? PALE : t < .3 ? DEEP : (k % 2 ? ROSE : DEEP);

    add(
      hc[0] + (u[0] * c + v[0] * s) * r + a[0] * h,
      hc[1] + (u[1] * c + v[1] * s) * r + a[1] * h,
      hc[2] + (u[2] * c + v[2] * s) * r + a[2] * h,
      [
        (u[0] * c + v[0] * s) * rr * .9 + a[0] * (1 - rr * .5),
        (u[1] * c + v[1] * s) * rr * .9 + a[1] * (1 - rr * .5),
        (u[2] * c + v[2] * s) * rr * .9 + a[2] * (1 - rr * .5)
      ],
      col,.5 + k * .04 + t * .35,
      .85 + .15 * Math.sin(t * 60),100 + k
    );
  }
});

for (let i = 0; i < 90; i++) {
  const a = R() * TAU;
  const h = .05 + R() * .95;
  const r = .45 + .5 * R();
  const o = 1 + R() * .5;

  for (let j = 0; j < 5; j++)
    add(
      Math.cos(a) * r + (R() - .5) * .08,
      h + (R() - .5) * .08,
      Math.sin(a) * r + (R() - .5) * .08,
      [R() - .5,1,R() - .5],
      WHITE,o,1,200 + i
    );
}

const NPTS = P.length / 3;
let ORDMAX = 0;

for (const v of O) {
  if (v > ORDMAX) ORDMAX = v;
}

const KEY = norm([.3,.55,.8]);
const HK = norm(KEY.map((v,i) => v + [0,0,1][i]));
const PIT = .4;
const cp = Math.cos(PIT);
const sp = Math.sin(PIT);

const DUST = Array.from({length:260}, () =>
  [R() * TAU,.8 + 1.4 * R(),R() * 3,R(),R()]
);


/* ---------- BOUQUET CANVAS ---------- */
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const CW = 7;
const CH = 11;

let W,H,COLS,ROWS,depth,lum,tag,chr,part;

function setup() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;

  COLS = W / CW | 0;
  ROWS = H / CH | 0;

  depth = new Float32Array(COLS * ROWS);
  lum = new Float32Array(COLS * ROWS);
  tag = new Uint8Array(COLS * ROWS);
  chr = new Uint8Array(COLS * ROWS);
  part = new Int16Array(COLS * ROWS);

  ctx.font = `${CH - 1}px Consolas,Menlo,"DejaVu Sans Mono",monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
}

setup();
addEventListener("resize",setup);

const cache = new Map();

const colr = (k,l) => {
  const q = Math.round(clamp(l) * 20);
  const key = k * 21 + q;
  let s = cache.get(key);

  if (!s) {
    s = `rgb(${COLORS[k].map(v => v * q / 20 | 0)})`;
    cache.set(key,s);
  }

  return s;
};

const outline = (gx,gy) => {
  const ax = Math.abs(gx);
  const ay = Math.abs(gy);

  if (ax + ay === 0) return AT("+");

  return AT(
    ax > 2 * ay ? "|" :
    ay > 2 * ax ? (gy > 0 ? "_" : "-") :
    gx * gy > 0 ? "/" : "\\"
  );
};

function put(x,y,z,sh,k,c,pt) {
  const D = 4.6;
  const d = D - z;

  if (d < .5) return;

  const f = H * .35 * D / d;
  const col = Math.floor((W / 2 + x * f) / CW);
  const row = Math.floor((H * .47 - y * f) / CH);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

  const i = row * COLS + col;

  if (d < depth[i]) {
    depth[i] = d;
    lum[i] = sh;
    tag[i] = k;
    chr[i] = c;
    part[i] = pt;
  }
}

function frame(t) {
  depth.fill(99);
  lum.fill(0);
  tag.fill(0);
  chr.fill(0);
  part.fill(-1);

  const head = t / CFG.DRAW * (ORDMAX + .1);
  const yaw = .45 * Math.sin(t * .4);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const fl = 1 + .7 * Math.exp(-(((t - CFG.DRAW - .1) / .3) ** 2));

  for (let i = 0; i < NPTS; i++) {
    const dd = head - O[i];

    if (dd < 0) continue;

    const o = i * 3;

    let x = cy * P[o] + sy * P[o + 2];
    let z = -sy * P[o] + cy * P[o + 2];
    let y = P[o + 1];

    const y2 = y * cp - z * sp;
    const z2 = y * sp + z * cp;

    if (dd < .03) {
      put(x,y2,z2,1.2 * fl,GLINT,AT("*"),-1);
      continue;
    }

    let nx = cy * N[o] + sy * N[o + 2];
    let nz = -sy * N[o] + cy * N[o + 2];
    let ny = N[o + 1];

    const ny2 = ny * cp - nz * sp;
    const nz2 = ny * sp + nz * cp;

    const diff = clamp(nx * KEY[0] + ny2 * KEY[1] + nz2 * KEY[2]);
    const spec = Math.pow(
      clamp(nx * HK[0] + ny2 * HK[1] + nz2 * HK[2]),
      26
    );

    const sh = clamp(
      (.4 + .6 * diff) * M[i] + .7 * spec,
      .32,1
    ) * fl;

    let k = C[i];

    if (spec > .6 || (k === WHITE && Math.sin(t * 5 + i) > .75)) {
      k = GLINT;
    }

    put(x,y2,z2,sh,k,0,PT[i]);
  }

  const on = clamp((t - CFG.DRAW * .5) / 3);

  DUST.forEach(([a,r,ph,s,y0]) => {
    const aa = a + t * (.2 + .4 * s);
    const yy = ((y0 * 2.8 + t * .1) % 2.8) - 1.2;
    const tw = .25 + .75 * Math.pow(
      clamp(Math.sin(t * (2 + 3 * s) + ph * 20)),4
    );

    put(
      Math.cos(aa) * r,
      yy * cp,
      Math.sin(aa) * r * .6 + .5,
      tw * on,
      GOLD,
      AT(tw > .7 ? "*" : tw > .35 ? "+" : "."),
      -1
    );
  });

  const kb = t - CFG.DRAW - .1;

  if (kb > 0 && kb < 2.6) {
    for (let i = 0; i < 500; i++) {
      const a = i / 500 * TAU;
      const r = (1 - Math.exp(-kb * 1.6)) *
        2.6 * (.96 + .08 * ((i * 37) % 10) / 10);

      put(
        Math.cos(a) * r,
        Math.sin(a) * r * .75,
        1.2,
        Math.pow(1 - kb / 2.6,1.3),
        i % 3 ? GOLD : GLINT,
        AT("*"),
        -1
      );
    }
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const pa = part[idx];

      if (pa < 0) continue;

      let edge = false;
      let gx = 0;
      let gy = 0;

      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;

          const rr = r + dy;
          const cc = c + dx;
          const inb = rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS;
          const ni = rr * COLS + cc;
          const nb = inb ? part[ni] : -1;
          const nz = inb ? depth[ni] : 99;

          if (nb < 0 || (nb !== pa && nz > depth[idx] + .05)) {
            gx += dx;
            gy += dy;

            if (!dx || !dy) edge = true;
          }
        }

      const h = (r * 7919 + c * 104729) % 9973;
      const lv = clamp(Math.floor(lum[idx] * 3.2),0,3);
      const pool = POOLS[lv];

      chr[idx] = tag[idx] === GLINT
        ? AT("*")
        : edge
          ? outline(gx,gy)
          : AT(pool[(h + Math.floor(t * 3 + h % 11)) % pool.length]);

      lum[idx] = edge
        ? Math.max(.85,lum[idx])
        : clamp(lum[idx],.4,1);
    }
}

function render(t) {
  frame(t);

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0,0,0,${CFG.TRAIL})`;
  ctx.fillRect(0,0,W,H);

  ctx.globalCompositeOperation = "source-over";

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;

      if (!chr[i]) continue;

      ctx.fillStyle = colr(tag[i],lum[i]);
      ctx.fillText(
        ALL[chr[i]],
        c * CW + CW / 2,
        r * CH + CH / 2
      );
    }
}


/* ---------- MAIN ANIMATION LOOP ---------- */
let last = 0;

function tick(now) {
  requestAnimationFrame(tick);

  if (CFG.FROM > 0 && video.currentTime >= CFG.TO) {
    video.currentTime = CFG.FROM;
  }

  if (!started || now < t0 || now - last < 33) return;

  last = now;

  const t = (now - t0) / 1000;

  render(t);

  if (t > CFG.DRAW - 1) {
    cap.classList.add("in");
  }

  if (!ready && t > CFG.DRAW + 1.5) {
    ready = true;
    nav.classList.remove("hide");
  }
}

requestAnimationFrame(tick);


/* ---------- PAGE 2: ANIMATED GOLD HEART PENDANT ---------- */
(() => {
  const cv = document.getElementById("pendantCanvas");
  const ctx = cv.getContext("2d");
  const TAU = Math.PI * 2;

  const N = 140;
  const M = N >> 1;
  const S = 54;
  const LPD = .88 * S + 24;
  const XH = -.75 * S;

  const imgs = [null,null];

  ["photo1.png","photo2.png"].forEach((src,i) => {
    const photo = new Image();
    photo.onload = () => { imgs[i] = photo; };
    photo.src = src;
  });

  let W,H,u,dpr,pts,ay,vy,t,span,ayT,Lr,Lp,ang,angv;
  let pendantActive = false;

  const clamp = (x,a = 0,b = 1) =>
    x < a ? a : x > b ? b : x;

  const mix = (a,b,k) =>
    a.map((v,i) => v + (b[i] - v) * k | 0);

  function reset() {
    span = 330 * u;

    const cx = W / 2;

    ayT = -40 * u;
    ay = -1000 * u;
    vy = 0;
    t = 0;
    ang = .05;
    angv = 0;

    Lr = 1190 * u / (N - 1);
    Lp = LPD * u;
    pts = [];

    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const x = cx - span / 2 + span * k;
      const y = ay + Math.sin(k * Math.PI) * 560 * u;

      pts.push({
        x,y,px:x,py:y,
        w: (i === 0 || i === N - 1) ? 0 : i === M ? .5 : 1
      });
    }

    const m = pts[M];

    pts.push({
      x:m.x,
      y:m.y + Lp,
      px:m.x,
      py:m.y + Lp,
      w:.2
    });
  }

  function setup() {
    dpr = Math.min(devicePixelRatio || 1,2);
    W = innerWidth * .5;
    H = innerHeight;

    cv.width = W * dpr;
    cv.height = H * dpr;

    u = Math.min(W,H * 1.05) / 1000;

    reset();
  }

  function con(a,b,r) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx,dy) || 1e-6;
    const w = a.w + b.w;

    if (!w) return;

    const f = (d - r) / d / w;

    a.x += dx * f * a.w;
    a.y += dy * f * a.w;
    b.x -= dx * f * b.w;
    b.y -= dy * f * b.w;
  }

  function step(dt) {
    const g = 2300 * u * dt * dt;
    const cx = W / 2;
    const sway = Math.sin(t * .9) * 26 * u * dt * dt;

    vy += ((ayT - ay) * 75 - vy * 8.5) * dt;
    ay += vy * dt;

    const a = pts[0];
    const b = pts[N - 1];

    a.x = a.px = cx - span / 2;
    b.x = b.px = cx + span / 2;
    a.y = a.py = b.y = b.py = ay;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      if (!p.w) continue;

      const vx = (p.x - p.px) * .994;
      const vyy = (p.y - p.py) * .994;

      p.px = p.x;
      p.py = p.y;

      p.x += vx + (i === N ? sway : 0);
      p.y += vyy + g;
    }

    for (let k = 0; k < 26; k++) {
      for (let i = 0; i < N - 1; i++) {
        con(pts[i],pts[i + 1],Lr);
      }

      con(pts[M],pts[N],Lp);
    }

    if (t < 1.35) {
      ang = .05;
      angv = 0;
    } else {
      const tgt = 1.05 + .025 * Math.sin(t * 1.1);

      angv += (-(ang - tgt) * 32 - angv * 3) * dt;
      ang += angv * dt;

      if (ang > 1.12) {
        ang = 1.12;
        angv *= -.35;
      }
    }
  }

  function link(x,y,a,face,s) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(a);

    ctx.beginPath();
    ctx.ellipse(0,0,6 * u,(face ? 2.9 : 1.2) * u,0,0,TAU);
    ctx.lineWidth = 2.3 * u;
    ctx.strokeStyle = `rgb(${mix([105,68,14],[230,178,66],s)})`;
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.lineWidth = .9 * u;
    ctx.strokeStyle = `rgb(${mix([200,140,45],[255,246,210],s)})`;
    ctx.stroke();

    ctx.restore();
  }

  function heart(k) {
    ctx.beginPath();
    ctx.moveTo(0,.9 * k);
    ctx.bezierCurveTo(-1.1 * k,.1 * k,-1.15 * k,-.75 * k,-.5 * k,-.85 * k);
    ctx.bezierCurveTo(-.2 * k,-.9 * k,0,-.65 * k,0,-.5 * k);
    ctx.bezierCurveTo(0,-.65 * k,.2 * k,-.9 * k,.5 * k,-.85 * k);
    ctx.bezierCurveTo(1.15 * k,-.75 * k,1.1 * k,.1 * k,0,.9 * k);
    ctx.closePath();
  }

  function gold(x0,y0,x1,y1,rev) {
    const g = ctx.createLinearGradient(x0,y0,x1,y1);

    const c = rev
      ? ["#7a4f12","#c8923a","#f6dc8a","#e9bd5c"]
      : ["#fff1b8","#e3b04b","#9c6a1c","#f0c862"];

    c.forEach((v,i) => g.addColorStop(i / 3,v));

    return g;
  }

  function person(x,tilt,long) {
    ctx.save();
    ctx.translate(x,-.1);
    ctx.rotate(tilt);

    ctx.fillStyle = "#241711";
    ctx.beginPath();
    ctx.ellipse(0,long ? .06 : -.02,long ? .27 : .215,long ? .36 : .25,0,0,TAU);
    ctx.fill();

    ctx.fillStyle = "#5b4034";
    ctx.beginPath();
    ctx.ellipse(0,.02,.175,.215,0,0,TAU);
    ctx.fill();
    ctx.fillRect(-.06,.15,.12,.3);

    ctx.restore();

    ctx.fillStyle = "#241711";
    ctx.beginPath();
    ctx.ellipse(x * 1.12,.78,.4,.36,0,0,TAU);
    ctx.fill();
  }

  function panel(img,dark,ph) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(XH,-2 * S,3 * S,4 * S);
    ctx.clip();

    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 16 * u;
    ctx.shadowOffsetX = 7 * u;
    ctx.shadowOffsetY = 12 * u;

    heart(S);
    ctx.fillStyle = gold(-S,-S,S,S);
    ctx.fill();

    ctx.shadowColor = "transparent";

    heart(S * .9);
    ctx.fillStyle = gold(S,S,-S,-S,true);
    ctx.fill();

    ctx.save();

    heart(S * .8);
    ctx.clip();

    ctx.beginPath();
    ctx.rect(XH + .1 * S,-2 * S,3 * S,4 * S);
    ctx.clip();

    const bg = ctx.createRadialGradient(0,-.1 * S,.1 * S,0,0,S);

    bg.addColorStop(0,"#f8edd6");
    bg.addColorStop(.6,"#e2cfa5");
    bg.addColorStop(1,"#b79a68");

    ctx.fillStyle = bg;
    ctx.fillRect(-2 * S,-2 * S,4 * S,4 * S);

    if (img) {
      const rw = 1.45 * S;
      const rh = 1.4 * S;
      const cx = .05 * S;
      const cy = .02 * S;
      const k = Math.max(rw / img.width,rh / img.height);

      ctx.drawImage(
        img,
        cx - img.width * k / 2,
        cy - img.height * k / 2,
        img.width * k,
        img.height * k
      );
    } else {
      ctx.save();
      ctx.scale(S,S);
      person(-.26 + ph * .05,.14,true);
      person(.26 + ph * .05,-.14,false);
      ctx.restore();
    }

    const vg = ctx.createRadialGradient(0,0,.35 * S,0,0,.95 * S);

    vg.addColorStop(0,"rgba(70,40,15,0)");
    vg.addColorStop(1,"rgba(70,40,15,.4)");

    ctx.fillStyle = vg;
    ctx.fillRect(-2 * S,-2 * S,4 * S,4 * S);

    ctx.save();
    ctx.rotate(-.7);
    ctx.beginPath();
    ctx.ellipse(-.08 * S,-.5 * S,.55 * S,.15 * S,0,0,TAU);
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fill();
    ctx.restore();

    ctx.restore();

    heart(S * .8);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(90,55,10,.8)";
    ctx.stroke();

    heart(S);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255,245,200,.7)";
    ctx.stroke();

    if (dark > 0) {
      heart(S);
      ctx.fillStyle = `rgba(0,0,0,${dark})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(XH,-.6 * S);
    ctx.lineTo(XH,.6 * S);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,245,200,.8)";
    ctx.stroke();

    ctx.restore();
  }

  function pendant() {
    const m = pts[M];
    const p = pts[N];

    const th = Math.atan2(p.y - m.y,p.x - m.x) - Math.PI / 2 - .05;

    ctx.save();
    ctx.translate(m.x,m.y);
    ctx.rotate(th);
    ctx.scale(u,u);

    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 10 * u;
    ctx.shadowOffsetX = 5 * u;
    ctx.shadowOffsetY = 8 * u;

    ctx.beginPath();
    ctx.ellipse(0,11,6.5,12,0,0,TAU);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = "#c8923a";
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = "#fff0b0";
    ctx.stroke();

    ctx.translate(0,LPD);

    const c = Math.cos(ang);

    ctx.save();
    ctx.translate(XH,0);
    ctx.scale(-c,1);
    ctx.translate(-XH,0);
    panel(imgs[0],(1 - c) * .5,0);
    ctx.restore();

    panel(imgs[1],0,1);

    for (const y0 of [-.42 * S,.16 * S]) {
      const w = 6;
      const h = .27 * S;

      ctx.beginPath();

      if (ctx.roundRect) {
        ctx.roundRect(XH - w / 2,y0,w,h,3);
      } else {
        ctx.rect(XH - w / 2,y0,w,h);
      }

      ctx.fillStyle = gold(XH - 3,0,XH + 3,0);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(90,55,10,.9)";
      ctx.stroke();
    }

    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);

    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 7 * u;
    ctx.shadowOffsetX = 4 * u;
    ctx.shadowOffsetY = 7 * u;

    for (let i = 1; i < N - 1; i++) {
      const q = pts[i - 1];
      const p = pts[i];
      const n = pts[i + 1];
      const a = Math.atan2(n.y - q.y,n.x - q.x);

      link(
        p.x,p.y,a,i % 2,
        clamp(.4 + .6 * Math.pow(
          Math.abs(Math.sin(a) * .6 - Math.cos(a) * .8),.7
        ))
      );
    }

    pendant();
    ctx.shadowColor = "transparent";
  }

  let last = 0;

  window.startPendantDrop = () => {
    if (pendantActive) return;

    reset();
    pendantActive = true;
  };

  function tick(now) {
    requestAnimationFrame(tick);

    const dt = Math.min((now - last) / 1000 || 0,.05);
    last = now;

    if (pendantActive) {
      for (let k = 0; k < 2; k++) {
        t += dt / 2;
        step(dt / 2);
      }
    }

    draw();
  }

  addEventListener("resize",setup);
  setup();
  requestAnimationFrame(tick);
})();


/* ---------- PAGE 3: HER PORTRAIT ---------- */
(() => {
  const cv = document.getElementById("faceCanvas");
  const ctx = cv.getContext("2d");

  const CW = 5;
  const CH = 8;

  const SRC = "photo1.png";
  const DRAW = 14;
  const TRAIL = .35;
  const LEAD = 1200;

  const RAMP = " .,:;i1tfLCG08@";

  const clamp = (x,a = 0,b = 1) =>
    x < a ? a : x > b ? b : x;

  const FONT = `${CH}px Consolas,Menlo,"DejaVu Sans Mono",monospace`;

  let img = null;
  let W,H,COLS,ROWS,ox,oy,N = 0;
  let kind,ri,ech,ord,col;
  let active = false;
  let t0 = 0;
  let began = false;
  let last = 0;

  const hash = (r,c) =>
    ((r * 7919 + c * 104729) % 9973) / 9973;

  function blur(src,rad) {
    let a = src;
    let b = new Float32Array(N);

    for (let pass = 0; pass < 2; pass++) {
      for (let r = 0; r < ROWS; r++) {
        let sum = 0;

        for (let c = -rad; c <= rad; c++) {
          sum += a[r * COLS + clamp(c,0,COLS - 1)];
        }

        for (let c = 0; c < COLS; c++) {
          b[r * COLS + c] = sum / (2 * rad + 1);

          sum +=
            a[r * COLS + clamp(c + rad + 1,0,COLS - 1)] -
            a[r * COLS + clamp(c - rad,0,COLS - 1)];
        }
      }

      a = b;
      b = new Float32Array(N);

      for (let c = 0; c < COLS; c++) {
        let sum = 0;

        for (let r = -rad; r <= rad; r++) {
          sum += a[clamp(r,0,ROWS - 1) * COLS + c];
        }

        for (let r = 0; r < ROWS; r++) {
          b[r * COLS + c] = sum / (2 * rad + 1);

          sum +=
            a[clamp(r + rad + 1,0,ROWS - 1) * COLS + c] -
            a[clamp(r - rad,0,ROWS - 1) * COLS + c];
        }
      }

      a = b;
      b = new Float32Array(N);
    }

    return a;
  }

  function build() {
    if (!img) return;

    W = cv.width = innerWidth;
    H = cv.height = innerHeight;

    const ar = img.width / img.height;
    const dw = Math.min(W * .94,H * .94 * ar);
    const dh = dw / ar;

    COLS = dw / CW | 0;
    ROWS = dh / CH | 0;

    ox = (W - COLS * CW) / 2;
    oy = (H - ROWS * CH) / 2;
    N = COLS * ROWS;

    ctx.font = FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const S = 3;
    const off = document.createElement("canvas");

    off.width = COLS * S;
    off.height = ROWS * S;

    const oc = off.getContext("2d",{willReadFrequently:true});

    oc.imageSmoothingQuality = "high";
    oc.drawImage(img,0,0,off.width,off.height);

    const px = oc.getImageData(0,0,off.width,off.height).data;

    const R = new Float32Array(N);
    const G = new Float32Array(N);
    const B = new Float32Array(N);
    const L = new Float32Array(N);

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        let sr = 0;
        let sg = 0;
        let sb = 0;

        for (let y = 0; y < S; y++)
          for (let x = 0; x < S; x++) {
            const p = ((r * S + y) * off.width + c * S + x) * 4;

            sr += px[p];
            sg += px[p + 1];
            sb += px[p + 2];
          }

        const i = r * COLS + c;

        R[i] = sr / S / S;
        G[i] = sg / S / S;
        B[i] = sb / S / S;
        L[i] = (.299 * R[i] + .587 * G[i] + .114 * B[i]) / 255;
      }

    const sorted = Float32Array.from(L).sort();
    const lo = sorted[N * .02 | 0];
    const hi = sorted[N * .98 | 0];

    for (let i = 0; i < N; i++) {
      L[i] = clamp((L[i] - lo) / (hi - lo || 1));
    }

    const Lb = blur(L,5);
    const L2 = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      L2[i] = Math.pow(
        clamp(.75 * L[i] + 1.5 * (L[i] - Lb[i]) + .03),
        .9
      );
    }

    const GX = new Float32Array(N);
    const GY = new Float32Array(N);
    const E = new Float32Array(N);

    const l = (r,c) =>
      L2[clamp(r,0,ROWS - 1) * COLS + clamp(c,0,COLS - 1)];

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;

        GX[i] =
          (l(r-1,c+1) + 2*l(r,c+1) + l(r+1,c+1)) -
          (l(r-1,c-1) + 2*l(r,c-1) + l(r+1,c-1));

        GY[i] =
          (l(r+1,c-1) + 2*l(r+1,c) + l(r+1,c+1)) -
          (l(r-1,c-1) + 2*l(r-1,c) + l(r-1,c+1));

        E[i] = Math.hypot(GX[i],GY[i]);
      }

    const thr = Float32Array.from(E).sort()[N * .93 | 0] || .1;

    kind = new Uint8Array(N);
    ri = new Uint8Array(N);
    ech = new Array(N);
    ord = new Float32Array(N);
    col = new Array(N);

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;

        const dx = (c / COLS - .47) / .42;
        const dy = (r / ROWS - .5) / .55;
        const v = clamp((1.2 - Math.hypot(dx,dy)) / .5);

        const l2 = L2[i] * v;

        if (l2 < .06) continue;

        const mx = Math.max(R[i],G[i],B[i],1);

        const cr = R[i] / mx * 255 * .85 + 38;
        const cg = G[i] / mx * 255 * .8 + 30;
        const cb = B[i] / mx * 255 * .8 + 38;

        const s = .72 * (r / ROWS) + .28 * hash(r,c);

        if (E[i] > thr && v > .5) {
          kind[i] = 2;
          ord[i] = s * .55;

          const ax = Math.abs(-GY[i] * CW);
          const ay = Math.abs(GX[i] * CH);
          const a = Math.atan2(ay,ax);
          const sg = (-GY[i] * CW) * (GX[i] * CH);

          ech[i] =
            a < .39 ? "-" :
            a > 1.18 ? "|" :
            sg > 0 ? "\\" : "/";

          col[i] = [
            cr * .5 + 128,
            cg * .5 + 100,
            cb * .5 + 112
          ].map(x => Math.min(255,x * (.6 + .4 * v)) | 0).join(",");
        } else {
          kind[i] = 1;
          ord[i] = .2 + s * .8;

          ri[i] = Math.min(
            RAMP.length - 1,
            l2 * RAMP.length | 0
          );

          const k = .35 + .65 * l2;

          col[i] = [cr,cg,cb]
            .map(x => Math.min(255,x * k) | 0)
            .join(",");
        }
      }
  }

  const img0 = new Image();

  img0.onload = () => {
    img = img0;
    build();
  };

  img0.src = SRC;

  addEventListener("resize",build);

  window.faceShow = on => {
    active = on;

    if (on && !began) {
      began = true;
      t0 = performance.now() + LEAD;
    }

    if (window.loveStart) window.loveStart(on);
  };

  function tick(now) {
    requestAnimationFrame(tick);

    if (!active || !N || now < t0 || now - last < 33) return;

    last = now;

    const t = (now - t0) / 1000;
    const head = clamp(t / DRAW) * 1.07;

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${TRAIL})`;
    ctx.fillRect(0,0,W,H);

    ctx.globalCompositeOperation = "source-over";

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const k = kind[i];

        if (!k) continue;

        const dd = head - ord[i];

        if (dd < 0) continue;

        let ch;
        let cl;

        if (dd < .015) {
          ch = "*";
          cl = "255,255,255";
        } else if (k === 2) {
          ch = ech[i];
          cl = col[i];
        } else {
          let q = ri[i];

          if (
            q > 1 &&
            ((r * 31 + c * 17 + Math.floor(t * 2.5)) % 11 === 0)
          ) {
            q += (r + c) % 2 ? 1 : -1;
          }

          ch = RAMP[clamp(q,0,RAMP.length - 1)];
          cl = col[i];
        }

        if (
          t > DRAW &&
          k === 1 &&
          ri[i] > 7 &&
          ((r * 13 + c * 7 + Math.floor(t * 2)) % 97 === 0)
        ) {
          ch = "*";
          cl = "255,235,200";
        }

        ctx.globalAlpha = clamp(dd / .05);
        ctx.fillStyle = `rgb(${cl})`;

        ctx.fillText(
          ch,
          ox + c * CW + CW / 2,
          oy + r * CH + CH / 2
        );
      }

    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(tick);
})();


/* ---------- PAGE 3: I LOVE YOU WORDS ---------- */
(() => {
  const love = document.getElementById("love");
  const WORD = 35;
  const LEAD = 1800;

  const GOOGLE = [
    "Great Vibes","Pacifico","Dancing Script","Satisfy","Sacramento","Allura",
    "Parisienne","Lobster","Caveat","Indie Flower","Shadows Into Light",
    "Yellowtail","Playfair Display","Cinzel","Abril Fatface","Bungee",
    "Press Start 2P","Orbitron","Monoton","Righteous","Permanent Marker",
    "Amatic SC","Courgette","Kaushan Script","Cookie","Tangerine","Alex Brush",
    "Bangers","Special Elite","Rock Salt","Gloria Hallelujah","Oswald","Anton",
    "Bebas Neue","Comfortaa","Fredericka the Great","Homemade Apple","Zeyada",
    "Fascinate","Megrim","Lobster Two","Marck Script","Rouge Script","Mr Dafoe",
    "Gochi Hand","Reenie Beanie","Nothing You Could Do","Cinzel Decorative",
    "UnifrakturCook","Shrikhand","Rubik Mono One","Audiowide","Bad Script",
    "Kristi","Over the Rainbow","La Belle Aurore","Italianno","Pinyon Script",
    "Petit Formal Script","Playball","Norican","Merienda","Niconne","Damion",
    "Arizonia","Euphoria Script","Engagement","Condiment","Berkshire Swash",
    "Fondamento","Almendra","Chewy","VT323","Silkscreen","Major Mono Display",
    "Federo","Julius Sans One","Mansalva","Covered By Your Grace",
    "Waiting for the Sunrise","Sue Ellen Francisco","Qwigley","Meddon",
    "Emilys Candy","Faster One","Unica One","Londrina Solid","Spirax",
    "Metamorphous"
  ];

  const SYSTEM = [
    "Priestacy","Georgia","Impact","Comic Sans MS","Courier New",
    "Brush Script MT","Papyrus","Lucida Handwriting","Segoe Script",
    "Trebuchet MS","Times New Roman","Verdana","Palatino Linotype",
    "Copperplate","Chalkduster","Bradley Hand","Snell Roundhand","Zapfino",
    "Luminari","Marker Felt","Optima","Didot","Futura","Rockwell","Cambria",
    "Consolas","cursive","fantasy","serif","monospace"
  ];

  GOOGLE.forEach(n => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=" +
      n.replace(/ /g,"+") +
      "&display=swap";

    document.head.appendChild(l);
  });

  const FONTS = GOOGLE.concat(SYSTEM);

  const PINKS = [
    "#ffc2dc","#ff7ab6","#ffa6cf","#ffe3ef","#ff5d9e",
    "#f6c1ff","#ffd6a5","#ffffff","#ff8fb8"
  ];

  const WORDS = ["I","LOVE","YOU"];

  const rnd = a => a[Math.random() * a.length | 0];

  let wi = 0;
  let started = false;

  function addWord() {
    const sp = document.createElement("span");
    const w = WORDS[wi++ % 3];
    const up = Math.random() < .6;

    sp.className = "w";
    sp.textContent = up ? w : w[0] + w.slice(1).toLowerCase();

    const f = rnd(FONTS);

    sp.style.fontFamily = `"${f}",cursive`;

    sp.style.fontSize =
      (w === "I" ? 24 + Math.random() * 30 : 16 + Math.random() * 30)
      .toFixed(0) + "px";

    sp.style.color = rnd(PINKS);

    sp.style.setProperty(
      "--r",
      (Math.random() * 12 - 6).toFixed(1) + "deg"
    );

    sp.style.setProperty(
      "--o",
      (.5 + Math.random() * .45).toFixed(2)
    );

    if (Math.random() < .25) sp.style.fontWeight = "700";
    if (Math.random() < .2) sp.style.fontStyle = "italic";

    love.appendChild(sp);
  }

  function fill() {
    for (let g = 0; g < 1500; g++) {
      const last = love.lastElementChild;

      if (last && last.offsetTop > innerHeight + 40) break;

      for (let k = 0; k < 3; k++) addWord();
    }
  }

  function mask() {
    const W = innerWidth;
    const H = innerHeight;
    const ar = 2048 / 1536;

    const dw = Math.min(W * .94,H * .94 * ar);
    const dh = dw / ar;

    const cx = W / 2 - dw / 2 + .47 * dw;
    const cy = H / 2;

    const m =
      `radial-gradient(ellipse ${(.5 * dw).toFixed(0)}px ${(.66 * dh).toFixed(0)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px, transparent 64%, #000 100%)`;

    love.style.webkitMaskImage = m;
    love.style.maskImage = m;
  }

  fill();
  mask();

  addEventListener("resize",() => {
    fill();
    mask();
  });

  if (document.fonts) {
    document.fonts.addEventListener("loadingdone",fill);
    document.fonts.ready.then(fill);
  }

  setTimeout(fill,3000);

  window.loveStart = on => {
    if (!on || started) return;

    started = true;

    let i = 0;

    const next = () => {
      const kids = love.children;

      if (i < kids.length) {
        kids[i++].classList.add("on");
        setTimeout(next,WORD);
      } else {
        setTimeout(next,300);
      }
    };

    setTimeout(next,LEAD);
  };
})();
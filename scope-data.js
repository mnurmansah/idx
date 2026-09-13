var SQ=[];
function bangunCaption(o) {
  var f1 = function (v) { return v == null ? '-' : Number(v).toFixed(1); };
  var kita = [
    o.sym + ' · ' + o.close + ' · ' + o.regime.aktif + ' (' + Number(o.regime.skor).toFixed(2) + ')',
    '',
    'Struktur: R2 ' + o.level.R2 + ' · R1 ' + o.level.R1 + ' · harga ' + o.close + ' · S1 ' + o.level.S1 + ' · S2 ' + o.level.S2,
    'Pemicu: tembus ' + o.level.trigger + ' bervolume · SL ' + o.level.SL + ' · R/R 1:' + Number(o.level.rr).toFixed(1),
    'Mesin: ADX ' + f1(o.indikator.adx) + ' · StochRSI ' + (o.indikator.stochRsiK == null ? '-' : Math.round(o.indikator.stochRsiK)) + ' · BB ' + (o.indikator.bbPctl == null ? '-' : Math.round(o.indikator.bbPctl)) + ' pctl · vol ' + Number(o.indikator.volRatio).toFixed(2) + 'x',
    o.konteksBursa && o.konteksBursa.length ? 'Bursa: ' + o.konteksBursa.join(' · ') : null,
    '',
    'Regime = pembaca struktur, bukan sinyal. Yang tervalidasi di sistem ini cuma breakout bervolume + stop ~2,2xATR.',
  ].filter(function (v) { return v !== null; }).join('\n');

  var ref = ['*#TechnicalReview #ClientRequest*', ''];
  ref.push('*' + o.sym + '* > ' + o.interpretasi[0]);
  for (var i = 1; i < o.interpretasi.length; i++) { ref.push(''); ref.push(o.interpretasi[i]); }
  ref.push('', '*Strategi*');
  for (var j = 0; j < o.strategi.length; j++) ref.push('- ' + o.strategi[j]);
  ref.push('', '*Disclaimer On*');
  return { kita: kita, referensi: ref.join('\n') };
}
function chartSVG(o, bars, opt) {
  opt = opt || {};
  var AMBIL = opt.bars || 170;
  var W = opt.W || 1060, PADL = 54, PADR = 78, PADT = 16;
  var Hp = opt.Hp || 360, Hv = 84, Hs = 96, GAP = 26;

  var N = bars.length;
  var T = [], O = [], H = [], L = [], C = [], V = [];
  for (var i = 0; i < N; i++) { T.push(bars[i][0]); O.push(bars[i][1]); H.push(bars[i][2]); L.push(bars[i][3]); C.push(bars[i][4]); V.push(bars[i][5]); }

  // ── indikator (dihitung ulang di sini, bukan ditanam) ──
  function smaSeri(arr, p) {
    var out = [], s = 0;
    for (var i = 0; i < arr.length; i++) {
      s += arr[i]; if (i >= p) s -= arr[i - p];
      out.push(i + 1 >= p ? s / p : null);
    }
    return out;
  }
  function sdAt(arr, p, i) {
    if (i + 1 < p) return null;
    var m = 0, k; for (k = i - p + 1; k <= i; k++) m += arr[k]; m /= p;
    var s = 0; for (k = i - p + 1; k <= i; k++) s += (arr[k] - m) * (arr[k] - m);
    return Math.sqrt(s / p);
  }
  var MA20 = smaSeri(C, 20), MA50 = smaSeri(C, 50), MA200 = smaSeri(C, 200);
  // RSI(14) -> Stochastic RSI(14,3,3)
  var rsi = [], ag = 0, al = 0;
  rsi.push(null);
  for (var i2 = 1; i2 < N; i2++) {
    var d = C[i2] - C[i2 - 1], g = d > 0 ? d : 0, l2 = d < 0 ? -d : 0;
    if (i2 <= 14) { ag += g / 14; al += l2 / 14; rsi.push(i2 === 14 ? (al === 0 ? 100 : 100 - 100 / (1 + ag / al)) : null); continue; }
    ag = (ag * 13 + g) / 14; al = (al * 13 + l2) / 14;
    rsi.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  }
  var raw = [];
  for (var i3 = 0; i3 < N; i3++) {
    if (rsi[i3] == null || i3 < 28) { raw.push(null); continue; }
    var mn = Infinity, mx = -Infinity, ok = true;
    for (var k3 = i3 - 13; k3 <= i3; k3++) { if (rsi[k3] == null) { ok = false; break; } if (rsi[k3] < mn) mn = rsi[k3]; if (rsi[k3] > mx) mx = rsi[k3]; }
    raw.push(ok ? (mx === mn ? 50 : 100 * (rsi[i3] - mn) / (mx - mn)) : null);
  }
  function smaNull(arr, p) {
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var s = 0, ok = true;
      for (var k = i - p + 1; k <= i; k++) { if (k < 0 || arr[k] == null) { ok = false; break; } s += arr[k]; }
      out.push(ok ? s / p : null);
    }
    return out;
  }
  var SK = smaNull(raw, 3), SD = smaNull(SK, 3);

  // ── geometri ──
  // opt.end = indeks eksklusif bar terakhir yang tampil (default N). Bersama opt.bars ini jendela
  // yang digeser/di-zoom scope_zoom.mjs; indikator tetap dihitung di seluruh riwayat di atas.
  var END = Math.min(N, opt.end || N);
  var i0 = Math.max(0, END - AMBIL), n = END - i0;
  var innerW = W - PADL - PADR, bw = innerW / n;
  var x = function (i) { return PADL + (i - i0) * bw + bw / 2; };
  var pMin = Infinity, pMax = -Infinity, i4;
  for (i4 = i0; i4 < END; i4++) { if (L[i4] < pMin) pMin = L[i4]; if (H[i4] > pMax) pMax = H[i4]; }
  var lvArr = [o.level.R2, o.level.R1, o.level.S1, o.level.S2, o.level.SL, o.level.trigger];
  for (i4 = 0; i4 < lvArr.length; i4++) { var v4 = lvArr[i4]; if (v4 > 0) { if (v4 < pMin) pMin = v4; if (v4 > pMax) pMax = v4; } }
  var padP = (pMax - pMin) * 0.08 || 1; pMin -= padP; pMax += padP;
  var yP = function (v) { return PADT + Hp - (v - pMin) / (pMax - pMin) * Hp; };
  var vMax = 0; for (i4 = i0; i4 < END; i4++) if (V[i4] > vMax) vMax = V[i4];
  if (!vMax) vMax = 1;
  var vTop = PADT + Hp + GAP, yV = function (v) { return vTop + Hv - (v / vMax) * Hv; };
  var sTop = vTop + Hv + GAP, yS = function (v) { return sTop + Hs - (v / 100) * Hs; };
  var totalH = sTop + Hs + 26;
  var f = function (v) { return v.toFixed(1); };

  // ── lilin + volume ──
  var candles = '', vols = '';
  for (i4 = i0; i4 < END; i4++) {
    var cls = C[i4] >= O[i4] ? 'up' : 'dn';
    var yo = yP(O[i4]), yc = yP(C[i4]);
    var top = yo < yc ? yo : yc, hh = Math.abs(yo - yc); if (hh < 1) hh = 1;
    candles += '<line class="wick ' + cls + '" x1="' + f(x(i4)) + '" x2="' + f(x(i4)) + '" y1="' + f(yP(H[i4])) + '" y2="' + f(yP(L[i4])) + '"/>'
      + '<rect class="body ' + cls + '" x="' + f(x(i4) - bw * 0.32) + '" y="' + f(top) + '" width="' + f(bw * 0.64) + '" height="' + f(hh) + '"/>';
    vols += '<rect class="vol ' + cls + '" x="' + f(x(i4) - bw * 0.32) + '" y="' + f(yV(V[i4])) + '" width="' + f(bw * 0.64) + '" height="' + f(vTop + Hv - yV(V[i4])) + '"/>';
  }
  var path = function (ser, yf) {
    var d2 = '', mulai = true;
    for (var i = i0; i < END; i++) {
      var v = ser[i];
      if (v == null || !isFinite(v)) { mulai = true; continue; }
      d2 += (mulai ? 'M' : 'L') + f(x(i)) + ',' + f(yf(v)); mulai = false;
    }
    return d2;
  };
  // pita Bollinger
  var up = [], lo = [];
  for (i4 = i0; i4 < END; i4++) {
    var m4 = MA20[i4], s4 = sdAt(C, 20, i4);
    if (m4 == null || s4 == null) continue;
    up.push([x(i4), yP(m4 + 2 * s4)]); lo.push([x(i4), yP(m4 - 2 * s4)]);
  }
  var bbArea = '';
  if (up.length > 2) {
    var a1 = [], a2 = [];
    for (i4 = 0; i4 < up.length; i4++) a1.push(f(up[i4][0]) + ',' + f(up[i4][1]));
    for (i4 = lo.length - 1; i4 >= 0; i4--) a2.push(f(lo[i4][0]) + ',' + f(lo[i4][1]));
    bbArea = '<path class="bb" d="M' + a1.join('L') + 'L' + a2.join('L') + 'Z"/>';
  }

  // ── garis level, teks dipisah vertikal supaya tidak bertumpuk ──
  var garis = [
    { v: o.level.R2, t: 'R2 ' + o.level.R2, c: 'lv-res' },
    { v: o.level.R1, t: 'R1 ' + o.level.R1, c: 'lv-res' },
    { v: o.level.trigger, t: 'Tembus ' + o.level.trigger, c: 'lv-trig' },
    { v: o.level.SL, t: 'Stop ' + o.level.SL, c: 'lv-sl' },
    { v: o.level.S1, t: 'S1 ' + o.level.S1, c: 'lv-sup' },
    { v: o.level.S2, t: 'S2 ' + o.level.S2, c: 'lv-sup' },
  ].filter(function (g) { return g.v >= pMin && g.v <= pMax; })
    .map(function (g) { g.y = yP(g.v); g.ty = g.y; return g; })
    .sort(function (a, b) { return a.y - b.y; });
  var MIN = 11.5;
  for (i4 = 1; i4 < garis.length; i4++) if (garis[i4].ty - garis[i4 - 1].ty < MIN) garis[i4].ty = garis[i4 - 1].ty + MIN;
  var luber = garis.length ? garis[garis.length - 1].ty - (PADT + Hp) : 0;
  if (luber > 0) for (i4 = 0; i4 < garis.length; i4++) garis[i4].ty -= luber;
  var levels = '';
  for (i4 = 0; i4 < garis.length; i4++) {
    var g4 = garis[i4];
    levels += '<line class="lv ' + g4.c + '" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(g4.y) + '" y2="' + f(g4.y) + '"/>';
    if (Math.abs(g4.ty - g4.y) > 1.5) levels += '<line class="lvc ' + g4.c + '" x1="' + (W - PADR) + '" x2="' + (W - PADR + 4) + '" y1="' + f(g4.y) + '" y2="' + f(g4.ty) + '"/>';
    levels += '<text class="lvt ' + g4.c + '" x="' + (W - PADR + 6) + '" y="' + f(g4.ty + 3.2) + '">' + g4.t + '</text>';
  }

  // ── sumbu + legenda ──
  var gridY = '', langkah = (pMax - pMin) / 4;
  for (i4 = 0; i4 <= 4; i4++) {
    var vv = pMin + langkah * i4, yy = yP(vv);
    gridY += '<line class="grid" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(yy) + '" y2="' + f(yy) + '"/>'
      + '<text class="ax" x="' + (PADL - 8) + '" y="' + f(yy + 3.2) + '" text-anchor="end">' + Math.round(vv) + '</text>';
  }
  var bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var gridX = '', lastM = -1;
  for (i4 = i0; i4 < END; i4++) {
    var dt = new Date(T[i4] * 1000), mo = dt.getUTCMonth();
    if (mo !== lastM) {
      lastM = mo;
      gridX += '<text class="ax" x="' + f(x(i4)) + '" y="' + (totalH - 8) + '" text-anchor="middle">' + bln[mo] + ' ' + String(dt.getUTCFullYear()).slice(2) + '</text>';
    }
  }
  var leg = [['ma20', 'MA20'], ['ma50', 'MA50'], ['ma200', 'MA200']], legend = '', lx = PADL + 4;
  for (i4 = 0; i4 < leg.length; i4++) {
    legend += '<line class="ma ' + leg[i4][0] + '" x1="' + lx + '" x2="' + (lx + 16) + '" y1="' + (PADT + 8) + '" y2="' + (PADT + 8) + '"/>'
      + '<text class="ax" x="' + (lx + 20) + '" y="' + (PADT + 11.5) + '">' + leg[i4][1] + '</text>';
    lx += 20 + leg[i4][1].length * 6.4 + 12;
  }
  legend += '<rect class="bb" x="' + lx + '" y="' + (PADT + 3) + '" width="16" height="10"/>'
    + '<text class="ax" x="' + (lx + 20) + '" y="' + (PADT + 11.5) + '">Bollinger 20,2</text>';

  return '<svg class="sc-svg" viewBox="0 0 ' + W + ' ' + totalH + '" width="100%" role="img" aria-label="Grafik harga ' + o.sym + '">'
    + gridY + bbArea
    + '<path class="ma ma200" d="' + path(MA200, yP) + '"/>'
    + '<path class="ma ma50" d="' + path(MA50, yP) + '"/>'
    + '<path class="ma ma20" d="' + path(MA20, yP) + '"/>'
    + candles + levels + legend
    + '<text class="panel-t" x="' + PADL + '" y="' + (vTop - 6) + '">Volume</text>' + vols
    + '<line class="grid" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + (sTop + Hs) + '" y2="' + (sTop + Hs) + '"/>'
    + '<line class="grid dash" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(yS(80)) + '" y2="' + f(yS(80)) + '"/>'
    + '<line class="grid dash" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(yS(20)) + '" y2="' + f(yS(20)) + '"/>'
    + '<text class="panel-t" x="' + PADL + '" y="' + (sTop - 6) + '">Stochastic RSI (14, 3, 3)</text>'
    + '<path class="srsi k" d="' + path(SK, yS) + '"/>'
    + '<path class="srsi d" d="' + path(SD, yS) + '"/>'
    + '<text class="ax" x="' + (PADL - 8) + '" y="' + f(yS(100) + 3) + '" text-anchor="end">100</text>'
    + '<text class="ax" x="' + (PADL - 8) + '" y="' + f(yS(0) + 3) + '" text-anchor="end">0</text>'
    + gridX + '</svg>';
}
function intradaySVG(sym, bars, opt) {
  opt = opt || {};
  // PADL lebih lebar dari chart harian: sumbu kiri panel deret memuat label spt "−194 jt" yang di
  // 54 px terpotong tanda minusnya (terlihat di uji 10 Sep).
  var W = opt.W || 1060, PADL = 72, PADR = 78, PADT = 16, GAP = 24;
  var Hp = opt.Hp || 200, Hev = 104, Hlp = 124, Hb = 92;
  var lv = opt.lv || null;
  var N = bars.length;
  if (N < 3) return '<div class="sq-empty">bar intraday tidak cukup</div>';
  var T = [], O = [], H = [], L = [], C = [], V = [];
  for (var i = 0; i < N; i++) { T.push(bars[i][0]); O.push(bars[i][1]); H.push(bars[i][2]); L.push(bars[i][3]); C.push(bars[i][4]); V.push(bars[i][5] || 0); }
  var tick = function (p) { return p < 200 ? 1 : p < 500 ? 2 : p < 2000 ? 5 : p < 5000 ? 10 : 25; };

  // ── effective volume per bar ──
  var ev = [0], bud = [0];
  for (i = 1; i < N; i++) {
    var pc = C[i - 1], hi = H[i] > pc ? H[i] : pc, lo = L[i] < pc ? L[i] : pc;
    var spread = hi - lo + tick(C[i]);
    ev.push(spread > 0 ? V[i] * (C[i] - pc) / spread : 0);
    bud.push(C[i] > pc ? V[i] : C[i] < pc ? -V[i] : 0);
  }
  // pemisah besar/kecil: bar diurutkan volume turun, ambil volume bar di titik 50% total
  var urut = V.slice().sort(function (a, b) { return b - a; }), tot = 0, k;
  for (k = 0; k < urut.length; k++) tot += urut[k];
  var akum = 0, sep = 0;
  for (k = 0; k < urut.length; k++) { akum += urut[k]; if (akum >= tot / 2) { sep = urut[k]; break; } }
  var EVF = [], LP = [], SP = [], BUD = [], ce = 0, cl = 0, cs = 0, cb = 0;
  for (i = 0; i < N; i++) {
    ce += ev[i]; EVF.push(ce);
    if (V[i] >= sep) cl += ev[i]; else cs += ev[i];
    LP.push(cl); SP.push(cs);
    cb += bud[i]; BUD.push(cb);
  }

  // ── geometri ── deret dihitung di SELURUH bar (pemisah besar/kecil & kumulatif tidak berubah saat
  // di-zoom); yang berubah hanya jendela [i0, END) yang digambar — dipakai scope_zoom.mjs.
  var END = Math.min(N, opt.end || N), AMBIL = opt.bars || N;
  var i0 = Math.max(0, END - AMBIL), n = END - i0;
  var innerW = W - PADL - PADR, bw = innerW / n;
  var x = function (i) { return PADL + (i - i0) * bw + bw / 2; };
  var f = function (v) { return v.toFixed(1); };
  var pMin = Infinity, pMax = -Infinity;
  for (i = i0; i < END; i++) { if (L[i] < pMin) pMin = L[i]; if (H[i] > pMax) pMax = H[i]; }
  var garisLv = [];
  if (lv) {
    var kand = [[lv.trigger, 'Tembus ' + lv.trigger, 'lv-trig'], [lv.SL, 'Stop ' + lv.SL, 'lv-sl'], [lv.S1, 'S1 ' + lv.S1, 'lv-sup'], [lv.R1, 'R1 ' + lv.R1, 'lv-res']];
    var rng = pMax - pMin || 1;
    for (k = 0; k < kand.length; k++) { var v = kand[k][0]; if (v > 0 && v >= pMin - rng * 0.25 && v <= pMax + rng * 0.25) { garisLv.push(kand[k]); if (v < pMin) pMin = v; if (v > pMax) pMax = v; } }
  }
  var padP = (pMax - pMin) * 0.08 || 1; pMin -= padP; pMax += padP;
  var yP = function (v) { return PADT + Hp - (v - pMin) / (pMax - pMin) * Hp; };
  // skala panel deret. Garis kumulatif diskalakan ke rentang JENDELA yang tampil — TIDAK dipaksa
  // memuat 0. Kalau dipaksa, garis 300 jt yang bergerak 15 jt terlihat datar begitu di-zoom (keluhan
  // user 10 Sep 2026: "disini nya kurang jelas"). Batang per-bar punya skala sendiri, simetris di
  // sekitar 0, di pita bawah panel — supaya tidak berebut skala dengan garis kumulatifnya.
  function skala(top, h, sers) {
    var mn = Infinity, mx = -Infinity, s, j;
    for (s = 0; s < sers.length; s++) for (j = i0; j < END; j++) { if (sers[s][j] < mn) mn = sers[s][j]; if (sers[s][j] > mx) mx = sers[s][j]; }
    if (!isFinite(mn)) { mn = 0; mx = 1; }
    if (mx === mn) { mn -= 1; mx += 1; }
    var pad = (mx - mn) * 0.1; mn -= pad; mx += pad;
    return { y: function (v) { return top + h - (v - mn) / (mx - mn) * h; }, mn: mn, mx: mx, top: top, h: h };
  }
  function skalaBatang(top, h, ser) {
    var m = 0, j; for (j = i0; j < END; j++) if (Math.abs(ser[j]) > m) m = Math.abs(ser[j]);
    if (!m) m = 1;
    return { y: function (v) { return top + h / 2 - v / m * (h / 2); }, mn: -m, mx: m, top: top, h: h };
  }
  var evTop = PADT + Hp + GAP, lpTop = evTop + Hev + GAP, bTop = lpTop + Hlp + GAP;
  var totalH = bTop + Hb + 26;
  var PITA = 0.34;   // porsi tinggi panel untuk pita batang per-bar
  var sEV = skala(evTop, Hev * (1 - PITA) - 4, [EVF]), sEVb = skalaBatang(evTop + Hev * (1 - PITA), Hev * PITA, ev);
  var sLP = skala(lpTop, Hlp, [LP, SP]);
  var sB = skala(bTop, Hb * (1 - PITA) - 4, [BUD]), sBb = skalaBatang(bTop + Hb * (1 - PITA), Hb * PITA, bud);

  var path = function (ser, yf) {
    var d = '';
    for (var j = i0; j < END; j++) d += (j > i0 ? 'L' : 'M') + f(x(j)) + ',' + f(yf(ser[j]));
    return d;
  };
  var batang = function (ser, sk, cls) {
    var out = '', y0 = sk.y(0);
    for (var j = i0; j < END; j++) {
      if (!ser[j]) continue;
      var yy = sk.y(ser[j]), top = yy < y0 ? yy : y0, hh = Math.abs(yy - y0); if (hh < 0.6) hh = 0.6;
      out += '<rect class="' + cls + ' ' + (ser[j] >= 0 ? 'up' : 'dn') + '" x="' + f(x(j) - bw * 0.35) + '" y="' + f(top) + '" width="' + f(bw * 0.7) + '" height="' + f(hh) + '"/>';
    }
    return out;
  };
  // garis nol hanya kalau 0 memang ada di dalam rentang skala
  var nol = function (sk) {
    var y0 = sk.y(0); if (y0 < sk.top - 0.5 || y0 > sk.top + sk.h + 0.5) return '';
    return '<line class="grid dash" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(y0) + '" y2="' + f(y0) + '"/>';
  };
  // sumbu kiri panel deret: batas atas/bawah rentang jendela, supaya besaran gerak garis terbaca
  var sumbuKiri = function (sk) {
    var yT = sk.top + 2, yB = sk.top + sk.h - 2;
    return '<line class="grid" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(sk.top) + '" y2="' + f(sk.top) + '"/>'
      + '<line class="grid" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(sk.top + sk.h) + '" y2="' + f(sk.top + sk.h) + '"/>'
      + '<text class="ax" x="' + (PADL - 8) + '" y="' + f(yT + 3.2) + '" text-anchor="end">' + ringkas(sk.mx) + '</text>'
      + '<text class="ax" x="' + (PADL - 8) + '" y="' + f(yB + 3.2) + '" text-anchor="end">' + ringkas(sk.mn) + '</text>';
  };
  var delta = function (ser) { var d = ser[END - 1] - ser[i0]; return (d >= 0 ? '+' : '') + ringkas(d); };
  var ringkas = function (v) {
    var a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1e9) return s + (a / 1e9).toFixed(2) + ' M';
    if (a >= 1e8) return s + (a / 1e6).toFixed(0) + ' jt';
    if (a >= 1e6) return s + (a / 1e6).toFixed(1) + ' jt';
    if (a >= 1e3) return s + (a / 1e3).toFixed(0) + ' rb';
    return s + a.toFixed(0);
  };
  var nilaiAkhir = function (sk, v, cls) { return '<text class="lvt ' + cls + '" x="' + (W - PADR + 6) + '" y="' + f(sk.y(v) + 3.2) + '">' + ringkas(v) + '</text>'; };

  // ── lilin ──
  var candles = '';
  for (i = i0; i < END; i++) {
    var cls = C[i] >= O[i] ? 'up' : 'dn', yo = yP(O[i]), yc = yP(C[i]);
    var top2 = yo < yc ? yo : yc, hh2 = Math.abs(yo - yc); if (hh2 < 0.8) hh2 = 0.8;
    candles += '<line class="wick ' + cls + '" x1="' + f(x(i)) + '" x2="' + f(x(i)) + '" y1="' + f(yP(H[i])) + '" y2="' + f(yP(L[i])) + '"/>'
      + '<rect class="body ' + cls + '" x="' + f(x(i) - bw * 0.34) + '" y="' + f(top2) + '" width="' + f(bw * 0.68) + '" height="' + f(hh2) + '"/>';
  }
  // level Scope di panel harga
  var levels = '';
  for (k = 0; k < garisLv.length; k++) {
    var g = garisLv[k], yg = yP(g[0]);
    levels += '<line class="lv ' + g[2] + '" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(yg) + '" y2="' + f(yg) + '"/>'
      + '<text class="lvt ' + g[2] + '" x="' + (W - PADR + 6) + '" y="' + f(yg + 3.2) + '">' + g[1] + '</text>';
  }
  // sumbu harga
  var gridY = '', langkah = (pMax - pMin) / 4;
  for (k = 0; k <= 4; k++) {
    var vv = pMin + langkah * k, yy2 = yP(vv);
    gridY += '<line class="grid" x1="' + PADL + '" x2="' + (W - PADR) + '" y1="' + f(yy2) + '" y2="' + f(yy2) + '"/>'
      + '<text class="ax" x="' + (PADL - 8) + '" y="' + f(yy2 + 3.2) + '" text-anchor="end">' + Math.round(vv) + '</text>';
  }
  // batas sesi (ganti hari, WIB = UTC+7) — garis putus vertikal menembus semua panel + label tanggal
  var bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var sesi = '', lastD = -1;
  for (i = i0; i < END; i++) {
    var dt = new Date((T[i] + 7 * 3600) * 1000), dd = dt.getUTCDate();
    if (dd !== lastD) {
      lastD = dd;
      if (i > i0) sesi += '<line class="grid dash sesi" x1="' + f(x(i) - bw / 2) + '" x2="' + f(x(i) - bw / 2) + '" y1="' + PADT + '" y2="' + (bTop + Hb) + '"/>';
      sesi += '<text class="ax" x="' + f(x(i)) + '" y="' + (totalH - 8) + '" text-anchor="start">' + dd + ' ' + bln[dt.getUTCMonth()] + '</text>';
    }
  }
  var judul = function (top, t) { return '<text class="panel-t" x="' + PADL + '" y="' + (top - 7) + '">' + t + '</text>'; };
  // Di lebar ponsel judul panjang keluar dari bingkai SVG lalu terpotong (svg memangkas isi di luar viewBox).
  // Jadi di bawah 620px judulnya dipendekkan, bukan dibiarkan hilang separuh. Diukur 11 Sep 2026.
  var kecil = W < 620;
  var pilih = function (panjang, pendek) { return kecil ? pendek : panjang; };
  var jamAkhir = new Date((T[END - 1] + 7 * 3600) * 1000);
  var jam = ('0' + jamAkhir.getUTCHours()).slice(-2) + ':' + ('0' + jamAkhir.getUTCMinutes()).slice(-2);
  var akhir = C[END - 1], awal = C[i0], chg = awal ? (akhir - awal) / awal * 100 : 0;
  var Z = END - 1;   // indeks bar terakhir yang tampil, utk label nilai di kanan

  return '<svg class="sc-svg" viewBox="0 0 ' + W + ' ' + totalH + '" width="100%" role="img" aria-label="Effective volume intraday ' + sym + '">'
    + gridY + sesi + candles + levels
    + '<text class="panel-t" x="' + PADL + '" y="' + (PADT - 4) + '">' + pilih(sym + ' · ' + (opt.res || 5) + ' menit · ' + n + ' bar · terakhir ' + jam + ' WIB · ' + akhir + ' (' + (chg >= 0 ? '+' : '') + chg.toFixed(1) + '% sejak awal jendela)', sym + ' · ' + n + ' bar · ' + akhir + ' (' + (chg >= 0 ? '+' : '') + chg.toFixed(1) + '%)') + '</text>'
    // panel 2: effective volume flow — garis di atas (skala jendela), batang per-bar di pita bawah
    + judul(evTop, pilih('Volume yang menggeser harga — total berjalan (garis) · di tampilan ini ' + delta(EVF) + ' · per bar (pita bawah)', 'Volume yang menggeser harga · ' + delta(EVF)))
    + sumbuKiri(sEV) + nol(sEV) + '<path class="evf" d="' + path(EVF, sEV.y) + '"/>' + nilaiAkhir(sEV, EVF[Z], 'evf-t')
    + nol(sEVb) + batang(ev, sEVb, 'evbar')
    // panel 3: besar vs kecil
    + judul(lpTop, pilih('Pemain besar (garis emas) vs kecil (garis hijau) · besar ' + delta(LP) + ' · kecil ' + delta(SP) + ' · bar disebut besar kalau volumenya ≥ ' + ringkas(sep) + ' lembar', 'Pemain besar (emas) vs kecil (hijau) · besar ' + delta(LP)))
    + sumbuKiri(sLP) + nol(sLP) + '<path class="sp" d="' + path(SP, sLP.y) + '"/>' + '<path class="lp" d="' + path(LP, sLP.y) + '"/>'
    + nilaiAkhir(sLP, LP[Z], 'lp-t') + (Math.abs(sLP.y(LP[Z]) - sLP.y(SP[Z])) < 11 ? '' : nilaiAkhir(sLP, SP[Z], 'sp-t'))
    // panel 4: buyup - selldown
    + judul(bTop, pilih('Beli agresif − jual agresif — total berjalan (garis) · di tampilan ini ' + delta(BUD) + ' · per bar (pita bawah)', 'Beli − jual agresif · ' + delta(BUD)))
    + sumbuKiri(sB) + nol(sB) + '<path class="bud" d="' + path(BUD, sB.y) + '"/>' + nilaiAkhir(sB, BUD[Z], 'bud-t')
    + nol(sBb) + batang(bud, sBb, 'budbar')
    + '</svg>';
}
function bacaIntraday(bars) {
  var N = bars.length; if (N < 12) return null;
  var tick = function (p) { return p < 200 ? 1 : p < 500 ? 2 : p < 2000 ? 5 : p < 5000 ? 10 : 25; };
  var V = [], ev = [0], i;
  for (i = 0; i < N; i++) V.push(bars[i][5] || 0);
  for (i = 1; i < N; i++) { var pc = bars[i - 1][4], hi = Math.max(bars[i][2], pc), lo = Math.min(bars[i][3], pc), sp = hi - lo + tick(bars[i][4]); ev.push(sp > 0 ? V[i] * (bars[i][4] - pc) / sp : 0); }
  var urut = V.slice().sort(function (a, b) { return b - a; }), tot = 0, akum = 0, sep = 0, k;
  for (k = 0; k < urut.length; k++) tot += urut[k];
  for (k = 0; k < urut.length; k++) { akum += urut[k]; if (akum >= tot / 2) { sep = urut[k]; break; } }
  var dari = Math.floor(N * 2 / 3), lp = 0, hargaAwal = bars[dari][4], hargaAkhir = bars[N - 1][4];
  for (i = dari; i < N; i++) if (V[i] >= sep) lp += ev[i];
  var dHarga = hargaAwal ? (hargaAkhir - hargaAwal) / hargaAwal * 100 : 0;
  var arahLP = lp > 0 ? 'naik' : lp < 0 ? 'turun' : 'datar';
  var arahPx = dHarga > 0.5 ? 'naik' : dHarga < -0.5 ? 'turun' : 'datar';
  var vonis;
  if (arahPx === 'turun' && arahLP === 'naik') vonis = 'HARGA TURUN TAPI DISERAP — pemain besar mengumpulkan saat harga lemah. Kandidat beli di koreksi; tunggu bar berikutnya sebagai konfirmasi.';
  else if (arahPx === 'naik' && arahLP !== 'naik') vonis = 'NAIK TANPA UANG BESAR — pemain besar tidak ikut. Jangan dikejar.';
  else if (arahPx === 'turun' && arahLP === 'turun') vonis = 'PEMAIN BESAR KELUAR — harga dan uang besar turun bersama. Menyingkir; penurunan ini pintu keluar, bukan diskon.';
  else if (arahPx === 'naik' && arahLP === 'naik') vonis = 'UANG BESAR IKUT NAIK — bukan sinyal beli baru, tapi tidak ada alasan keluar.';
  else vonis = 'BELUM JELAS — belum ada perbedaan arah yang bisa dibaca di sepertiga terakhir.';
  return { sepertigaAkhir: N - dari, dHarga: +dHarga.toFixed(2), evBesar: Math.round(lp), arahLP: arahLP, arahPx: arahPx, vonis: vonis };
}
function penjelasanIntraday(b) {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var baris = [
    ['turun', 'naik', 'Diserap pemain besar', 'Pemain besar mengumpulkan saat harga lemah. Kandidat beli di koreksi — tunggu bar berikutnya, jangan langsung.'],
    ['naik', 'naik', 'Uang besar ikut naik', 'Bukan sinyal beli baru; kalau sudah pegang, tidak ada alasan keluar.'],
    ['naik', 'datar/turun', 'Naik tanpa uang besar', 'Harga naik tapi pemain besar tidak ikut — biasanya ritel yang mengejar. Jangan dikejar; kalau pegang, siapkan jual.'],
    ['turun', 'turun', 'Pemain besar keluar', 'Harga dan uang besar turun bersama. Menyingkir. Penurunan seperti ini pintu keluar, bukan diskon.'],
  ];
  var aktif = -1;
  if (b) {
    if (b.arahPx === 'turun' && b.arahLP === 'naik') aktif = 0;
    else if (b.arahPx === 'naik' && b.arahLP === 'naik') aktif = 1;
    else if (b.arahPx === 'naik') aktif = 2;
    else if (b.arahPx === 'turun' && b.arahLP === 'turun') aktif = 3;
  }
  var tr = '';
  for (var i = 0; i < baris.length; i++) {
    tr += '<tr' + (i === aktif ? ' class="on"' : '') + '><td>' + esc(baris[i][0]) + '</td><td>' + esc(baris[i][1]) + '</td><td><b>' + esc(baris[i][2]) + '</b>' + (i === aktif ? ' <span class="iw-now">← sekarang</span>' : '') + '</td><td>' + esc(baris[i][3]) + '</td></tr>';
  }
  return '<div class="iw">'
    + '<h4>Cara membaca panel ini</h4>'
    + '<p>Dari seluruh volume, yang dihitung di sini hanya bagian yang <b>benar-benar menggeser harga</b> — volume yang lewat tanpa memindahkan harga dianggap derau. Volume itu lalu dipisah jadi <b>pemain besar</b> (bar bervolume besar) dan <b>pemain kecil</b>, karena keduanya jarang bergerak bersamaan: pemain besar mengumpulkan pelan dan biasanya <b>bergerak lebih dulu</b>, pemain kecil mengikuti harga. Yang dicari bukan angkanya, tapi <b>arah garis emas dibanding arah harga</b>. (Metodenya dari Pascal Willain, <i>Value in Time</i>.)</p>'
    + '<ul>'
    + '<li><b>Candle 5 menit + level harian</b> — di mana harga sekarang dibanding level tembus, support, dan stop.</li>'
    + '<li><b>Volume yang menggeser harga</b> — arah uang keseluruhan. Datar padahal harga bergerak = gerakan tanpa uang.</li>'
    + '<li><b>Pemain besar vs kecil</b> — panel yang menentukan. Baca garis emas saja; hijau cuma pembanding.</li>'
    + '<li><b>Beli agresif − jual agresif</b> — siapa yang menyerang: pembeli mengangkat, atau penjual menekan.</li>'
    + '</ul>'
    + '<table class="iw-t"><thead><tr><th>Harga</th><th>Pemain besar</th><th>Bacaan</th><th>Tindakan</th></tr></thead><tbody>' + tr + '</tbody></table>'
    + '<p class="iw-fit"><b>Dipakai untuk apa:</b> menentukan <b>waktu masuk</b> pada saham yang sudah lolos saringan harian — bukan untuk mencari saham. Aturannya tetap: <i>harga menentukan beli atau tidak, uang menentukan seberapa besar.</i> Pemain besar keluar saat harga turun → kecilkan atau lewati. Pemain besar menyerap saat harga turun → boleh masuk di koreksi, dengan stop yang sama (2,2×ATR).</p>'
    + '<p class="iw-lim"><b>Batasnya:</b> "pemain besar" di sini berarti <b>bar dengan volume besar</b>, bukan ukuran order yang sebenarnya — TradingView tidak menyediakan itu. Jumlah transaksi per bar juga tidak ada, jadi frekuensi hanya tersedia harian. Dan yang terpenting: cara baca ini <b>belum diuji</b> di sistem kita — untuk membaca, bukan menyaring. Kalau dipakai untuk masuk atau keluar, catat di Jurnal supaya suatu hari bisa dibuktikan atau dibantah.</p>'
    + '</div>';
}
function pasangZoom(box, total, awalN, gambar, ket) {
  var MINN = 12, end = total, n = Math.min(awalN || total, total);
  if (!total || total < 3) { box.innerHTML = gambar(0, total); return; }
  var tb = document.createElement('div'); tb.className = 'zb';
  tb.innerHTML = '<button type="button" data-z="in" title="perbesar">+</button>'
    + '<button type="button" data-z="out" title="perkecil">−</button>'
    + '<button type="button" data-z="left" title="geser ke kiri">◀</button>'
    + '<button type="button" data-z="right" title="geser ke kanan">▶</button>'
    + '<button type="button" data-z="reset" title="kembali ke tampilan awal">⟲</button>'
    + '<span class="zb-k"></span><span class="zb-h">' + (('ontouchstart' in window) ? 'cubit = zoom · seret = geser' : 'roda mouse = zoom · seret = geser') + '</span>';
  var isi = document.createElement('div'); isi.className = 'zb-isi';
  box.innerHTML = ''; box.appendChild(tb); box.appendChild(isi);
  var lbl = tb.querySelector('.zb-k');
  function render() {
    var i0 = Math.max(0, end - n);
    isi.innerHTML = gambar(i0, end);
    lbl.textContent = (end - i0) + ' dari ' + total + ' bar' + (ket ? ' · ' + ket(i0, end - 1) : '');
  }
  function jepit() { if (n < MINN) n = MINN; if (n > total) n = total; if (end > total) end = total; if (end < n) end = n; }
  // zoom dgn jangkar: bar di bawah kursor (fraksi a, 0..1) tetap di tempatnya
  function zoom(f, a) {
    var i0 = Math.max(0, end - n), pivot = i0 + a * (end - i0);
    n = Math.round(n * f); jepit();
    end = Math.round(pivot + (1 - a) * n); jepit(); render();
  }
  function geser(d) { end += d; jepit(); render(); }
  tb.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null; if (!b) return;
    var z = b.getAttribute('data-z'), langkah = Math.max(1, Math.round(n * 0.25));
    if (z === 'in') zoom(0.7, 1); else if (z === 'out') zoom(1 / 0.7, 1);
    else if (z === 'left') geser(-langkah); else if (z === 'right') geser(langkah);
    else { n = Math.min(awalN || total, total); end = total; render(); }
  });
  isi.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var r = isi.getBoundingClientRect(), a = (ev.clientX - r.left) / r.width;
    zoom(ev.deltaY > 0 ? 1.25 : 0.8, Math.min(1, Math.max(0, a)));
  }, { passive: false });
  // seret = geser
  var drag = null;
  isi.addEventListener('mousedown', function (ev) { if (ev.button !== 0) return; drag = { x: ev.clientX, end: end }; isi.classList.add('seret'); ev.preventDefault(); });
  window.addEventListener('mousemove', function (ev) {
    if (!drag) return;
    var r = isi.getBoundingClientRect(), perBar = r.width / n;
    var e = drag.end + Math.round((drag.x - ev.clientX) / perBar);
    if (e > total) e = total; if (e < n) e = n;
    if (e !== end) { end = e; render(); }
  });
  window.addEventListener('mouseup', function () { if (drag) { drag = null; isi.classList.remove('seret'); } });
  // layar sentuh: satu jari geser, dua jari pinch
  var t0 = null;
  isi.addEventListener('touchstart', function (ev) {
    if (ev.touches.length === 1) t0 = { x: ev.touches[0].clientX, end: end, jarak: null };
    else if (ev.touches.length === 2) t0 = { jarak: Math.abs(ev.touches[0].clientX - ev.touches[1].clientX), n: n };
  }, { passive: true });
  isi.addEventListener('touchmove', function (ev) {
    if (!t0) return;
    var r = isi.getBoundingClientRect();
    if (ev.touches.length === 2 && t0.jarak) {
      var j = Math.abs(ev.touches[0].clientX - ev.touches[1].clientX);
      n = Math.round(t0.n * (t0.jarak / (j || 1))); jepit(); render();
    } else if (ev.touches.length === 1 && t0.jarak === null) {
      var e = t0.end + Math.round((t0.x - ev.touches[0].clientX) / (r.width / n));
      if (e > total) e = total; if (e < n) e = n;
      if (e !== end) { end = e; render(); }
    }
  }, { passive: true });
  isi.addEventListener('touchend', function () { t0 = null; }, { passive: true });
  render();
}
function ketRentang(bars, intraday) {
  var bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var f = function (t) {
    var d = new Date((t + 7 * 3600) * 1000), s = d.getUTCDate() + ' ' + bln[d.getUTCMonth()];
    if (intraday) s += ' ' + ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
    else s += ' ' + String(d.getUTCFullYear()).slice(2);
    return s;
  };
  return function (i0, i1) { return f(bars[i0][0]) + ' → ' + f(bars[i1][0]); };
}
function bacaOwner(rec, months) {
  if (!rec) return null;
  const o = (rec.o || []).map((v, i) => v ? { i, m: months[i], ritel: v[0], inst: v[1], asing: v[2], rd: v[3], n: v[4] } : null).filter(Boolean);
  const kini = o.length ? o[o.length - 1] : null, lalu = o.length > 1 ? o[o.length - 2] : null;
  const d = (a, b) => (a != null && b != null) ? +(a - b).toFixed(2) : null;
  const dAsing = kini && lalu ? d(kini.asing, lalu.asing) : null, dInst = kini && lalu ? d(kini.inst, lalu.inst) : null, dRitel = kini && lalu ? d(kini.ritel, lalu.ritel) : null;
  // 3 bulan
  const l3 = o.length > 3 ? o[o.length - 4] : null;
  const dAsing3 = kini && l3 ? d(kini.asing, l3.asing) : null, dInst3 = kini && l3 ? d(kini.inst, l3.inst) : null;
  // transaksi orang dalam 90 hari terakhir (hanya direksi/komisaris)
  const t = rec.t || [];
  const batas = kini ? new Date(new Date(kini.m).getTime() - 90 * 864e5) : new Date(Date.now() - 90 * 864e5);
  const ins = t.filter(x => x[2] && new Date(x[0]) >= batas);
  const beli = ins.filter(x => /Pembelian|Purchase/i.test(x[4])), jual = ins.filter(x => /Penjualan|Sale/i.test(x[4]));
  const nilai = arr => arr.reduce((s, x) => s + (x[5] || 0) * (x[6] || 0), 0);
  const besar = t.filter(x => !x[2] && new Date(x[0]) >= batas);           // pemegang ≥5% (institusi/holding)
  const besarBeli = besar.filter(x => /Pembelian|Purchase/i.test(x[4])).length, besarJual = besar.filter(x => /Penjualan|Sale/i.test(x[4])).length;
  // vonis polos
  let vonis = 'BELUM ADA BACAAN', tone = '', alasan = [];
  const uangBesarMasuk = (dAsing != null && dAsing >= 0.3) || (dInst != null && dInst >= 0.3);
  const uangBesarKeluar = (dAsing != null && dAsing <= -0.3) || (dInst != null && dInst <= -0.3);
  if (beli.length && !jual.length) { vonis = 'ORANG DALAM BELI'; tone = 'good'; alasan.push(`${beli.length} laporan beli dari direksi/komisaris dalam 90 hari, tanpa jual`); }
  else if (jual.length && !beli.length) { vonis = 'ORANG DALAM JUAL'; tone = 'bad'; alasan.push(`${jual.length} laporan jual dari direksi/komisaris dalam 90 hari, tanpa beli`); }
  else if (beli.length && jual.length) { vonis = nilai(beli) > nilai(jual) ? 'ORANG DALAM LEBIH BANYAK BELI' : 'ORANG DALAM LEBIH BANYAK JUAL'; tone = nilai(beli) > nilai(jual) ? 'good' : 'warn'; alasan.push(`${beli.length} beli vs ${jual.length} jual dari direksi/komisaris dalam 90 hari`); }
  if (uangBesarMasuk) { alasan.push(`porsi ${dAsing != null && dAsing >= 0.3 ? 'asing' : 'institusi lokal'} naik ${(Math.max(dAsing || 0, dInst || 0)).toFixed(2)} poin sebulan`); if (!tone) { vonis = 'UANG BESAR MASUK'; tone = 'good'; } }
  if (uangBesarKeluar) { alasan.push(`porsi ${dAsing != null && dAsing <= -0.3 ? 'asing' : 'institusi lokal'} turun ${Math.abs(Math.min(dAsing || 0, dInst || 0)).toFixed(2)} poin sebulan`); if (!tone) { vonis = 'UANG BESAR KELUAR'; tone = 'bad'; } }
  if (dRitel != null && dRitel >= 0.5 && !tone) { vonis = 'RITEL MENAMPUNG'; tone = 'warn'; alasan.push(`porsi ritel lokal naik ${dRitel.toFixed(2)} poin: yang beli kebanyakan perorangan`); }
  return { kini, lalu, dAsing, dInst, dRitel, dAsing3, dInst3, beli: beli.length, jual: jual.length, nilaiBeli: nilai(beli), nilaiJual: nilai(jual), besarBeli, besarJual, vonis, tone, alasan, nBulan: o.length };
}
function ownerSVG(rec, months, opt) {
  opt = opt || {}; const W = opt.W || 1060, H = opt.H || 220, PADL = 44, PADR = 12, PADT = 14, PADB = 30;
  const o = (rec.o || []).map((v, i) => v ? { m: months[i], ritel: v[0], inst: v[1], asing: v[2], rd: v[3] } : null).filter(Boolean);
  if (!o.length) return '<div class="sq-cload">belum ada data kepemilikan KSEI untuk nama ini</div>';
  const n = o.length, iw = (W - PADL - PADR) / n, bw = Math.max(6, Math.min(46, iw * 0.62));
  const y = v => PADT + (H - PADT - PADB) * (1 - v / 100);
  // Di lebar ponsel 8 label "Jan 26" berdempetan jadi satu blok tak terbaca; di bawah 700px tahunnya
  // dibuang dan hanya bulan ganjil yang diberi label (diukur 11 Sep 2026).
  const kecil = W < 700;
  const fmt = m => { const d = new Date(m); return isNaN(d) ? m : d.toLocaleDateString('id-ID', kecil ? { month: 'short' } : { month: 'short', year: '2-digit' }); };
  let s = `<svg class="sc-svg ow-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Kepemilikan per bulan">`;
  for (const g of [0, 25, 50, 75, 100]) s += `<line class="grid" x1="${PADL}" x2="${W - PADR}" y1="${y(g).toFixed(1)}" y2="${y(g).toFixed(1)}"/><text class="ax" x="${PADL - 6}" y="${(y(g) + 3.5).toFixed(1)}" text-anchor="end">${g}%</text>`;
  o.forEach((v, i) => {
    const x = PADL + i * iw + (iw - bw) / 2;
    let top = 0;
    for (const [k, cls] of [['ritel', 'ow-ritel'], ['inst', 'ow-inst'], ['asing', 'ow-asing']]) {
      const h = (H - PADT - PADB) * v[k] / 100; const yy = y(top + v[k]);
      s += `<rect class="${cls}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, h - 1).toFixed(1)}"><title>${fmt(v.m)} · ${k === 'ritel' ? 'ritel lokal' : k === 'inst' ? 'institusi lokal' : 'asing'} ${v[k].toFixed(1)}%</title></rect>`;
      top += v[k];
    }
    const labelBulan = kecil ? (i === n - 1 || i % 2 === 0) : (i === n - 1 || n <= 14 || i % Math.ceil(n / 14) === 0);
    if (labelBulan) s += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${fmt(v.m)}</text>`;
  });
  // garis reksa dana lokal (bagian dari institusi) — diskalakan 0..100 sama
  const pts = o.map((v, i) => `${(PADL + i * iw + iw / 2).toFixed(1)},${y(v.rd).toFixed(1)}`).join(' ');
  s += `<polyline class="ow-rd" points="${pts}"/>`;
  const last = o[n - 1];
  s += `<text class="ax ow-rd-t" x="${W - PADR}" y="${(y(last.rd) - 4).toFixed(1)}" text-anchor="end">reksa dana ${last.rd.toFixed(1)}%</text>`;
  s += '</svg>';
  // PANEL PERUBAHAN — tumpukan 100% menyembunyikan gerak 0,3 poin yang justru jadi sinyal; di sini
  // selisih bulan-ke-bulan (poin persen) asing & institusi lokal digambar sebagai batang berpasangan.
  if (n >= 2) {
    const H2 = opt.H2 || (kecil ? 124 : 110), PT = 16, PB = kecil ? 16 : 6;
    const dl = o.slice(1).map((v, i) => ({ m: v.m, a: +(v.asing - o[i].asing).toFixed(2), s: +(v.inst - o[i].inst).toFixed(2) }));
    const mx = Math.max(0.5, ...dl.map(d => Math.max(Math.abs(d.a), Math.abs(d.s))));
    const y2 = v => PT + (H2 - PT - PB) / 2 * (1 - v / mx), y0 = y2(0);
    const bw2 = Math.max(4, Math.min(20, iw * 0.28));
    s += `<svg class="sc-svg ow-svg ow-svg2" viewBox="0 0 ${W} ${H2}" preserveAspectRatio="none" role="img" aria-label="Perubahan porsi per bulan">`;
    s += `<text class="panel-t" x="${PADL}" y="11">${kecil ? `Perubahan porsi (pp) · asing &amp; institusi · ±${mx.toFixed(1)}` : `Perubahan porsi bulan ke bulan (poin persen) — asing · institusi lokal · skala ±${mx.toFixed(1)}`}</text>`;
    s += `<line class="grid" x1="${PADL}" x2="${W - PADR}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}"/>`;
    s += `<text class="ax" x="${PADL - 6}" y="${(y2(mx) + 8).toFixed(1)}" text-anchor="end">+${mx.toFixed(1)}</text><text class="ax" x="${PADL - 6}" y="${(y2(-mx) - 1).toFixed(1)}" text-anchor="end">−${mx.toFixed(1)}</text>`;
    dl.forEach((d, i) => {
      const cx = PADL + (i + 1) * iw + iw / 2;
      for (const [k, cls, off] of [['a', 'ow-asing', -bw2 - 1], ['s', 'ow-inst', 1]]) {
        const v = d[k], yy = Math.min(y0, y2(v)), h = Math.abs(y2(v) - y0);
        s += `<rect class="${cls}${v < 0 ? ' neg' : ''}" x="${(cx + off).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw2.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}"><title>${fmt(d.m)} · ${k === 'a' ? 'asing' : 'institusi lokal'} ${v > 0 ? '+' : ''}${v.toFixed(2)} pp</title></rect>`;
        if (Math.abs(v) >= mx * (kecil ? 0.6 : 0.35)) s += `<text class="ax" x="${(cx + off + bw2 / 2).toFixed(1)}" y="${(v >= 0 ? yy - 3 : yy + h + 10).toFixed(1)}" text-anchor="middle">${v > 0 ? '+' : ''}${v.toFixed(2)}</text>`;
      }
    });
    s += '</svg>';
  }
  return s;
}
function ownerHTML(sym, rec, months) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  if (!rec) return '<div class="sq-cload">belum ada data kepemilikan / orang dalam untuk ' + esc(sym) + '</div>';
  const b = bacaOwner(rec, months) || {};
  const pp = v => v == null ? '–' : `<span class="${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}">${v > 0 ? '+' : ''}${v.toFixed(2)} pp</span>`;
  const rp = v => v == null || !isFinite(v) ? '–' : (v >= 1e12 ? (v / 1e12).toFixed(2) + ' T' : v >= 1e9 ? (v / 1e9).toFixed(1) + ' M' : v >= 1e6 ? (v / 1e6).toFixed(0) + ' jt' : Math.round(v).toLocaleString('id-ID'));
  const lembar = v => v == null ? '–' : v >= 1e9 ? (v / 1e9).toFixed(2) + ' M' : v >= 1e6 ? (v / 1e6).toFixed(1) + ' jt' : Math.round(v).toLocaleString('id-ID');
  const tgl = s => { const d = new Date(s); return isNaN(d) ? esc(s) : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }); };
  const k = b.kini;
  let h = '<div class="ow">';
  h += '<h4>Orang dalam &amp; kepemilikan</h4>';
  // ubin ringkas
  h += '<div class="ow-kpis">'
    + `<div><span>Asing</span><b>${k ? k.asing.toFixed(1) + '%' : '–'}</b><i>${pp(b.dAsing)} sebulan · ${pp(b.dAsing3)} 3 bln</i></div>`
    + `<div><span>Institusi lokal</span><b>${k ? k.inst.toFixed(1) + '%' : '–'}</b><i>${pp(b.dInst)} sebulan · ${pp(b.dInst3)} 3 bln</i></div>`
    + `<div><span>Ritel lokal</span><b>${k ? k.ritel.toFixed(1) + '%' : '–'}</b><i>${pp(b.dRitel)} sebulan</i></div>`
    + `<div><span>Direksi/komisaris 90 hari</span><b>${b.beli || 0} beli · ${b.jual || 0} jual</b><i>Rp ${rp(b.nilaiBeli)} vs Rp ${rp(b.nilaiJual)}</i></div>`
    + `<div><span>Pemegang ≥5% 90 hari</span><b>${b.besarBeli || 0} beli · ${b.besarJual || 0} jual</b><i>institusi / holding yang wajib lapor</i></div>`
    + '</div>';
  if (b.vonis && b.vonis !== 'BELUM ADA BACAAN') h += `<div class="sq-vonis${b.tone === 'bad' ? ' bad' : b.tone === 'warn' ? ' warn' : ''}"><b>${esc(b.vonis)}.</b> ${esc(b.alasan.join('; '))}.</div>`;
  // grafik
  const lebarOw = (typeof innerWidth !== 'undefined' && innerWidth < 700) ? Math.max(320, innerWidth - 44) : 1060;
  h += `<div class="ow-chart">${ownerSVG(rec, months, { W: lebarOw, H: lebarOw < 700 ? 200 : 220 })}</div>`;
  h += '<div class="ow-legend"><i class="ow-ritel"></i>ritel lokal <i class="ow-inst"></i>institusi lokal (asuransi, dana pensiun, bank, reksa dana, korporasi, sekuritas, yayasan) <i class="ow-asing"></i>asing <i class="ow-rd-l"></i>reksa dana lokal · KSEI, akhir bulan' + (k ? ` · terakhir ${tgl(k.m)}` : '') + '</div>';
  // tabel transaksi
  const t = (rec.t || []).slice(0, 14);
  if (t.length) {
    h += '<table class="iw-t ow-t"><thead><tr><th>Lapor</th><th>Siapa</th><th>Jenis</th><th class="r">Lembar</th><th class="r">Harga</th><th class="r">Nilai</th><th class="r">Sebelum → sesudah</th><th>Tgl transaksi</th></tr></thead><tbody>';
    for (const x of t) {
      const jenis = x[4] || '–', beli = /Pembelian|Purchase/i.test(jenis), jual = /Penjualan|Sale/i.test(jenis);
      h += `<tr class="${x[2] ? 'ow-ins' : ''}"><td class="mono muted">${tgl(x[0])}</td><td><b>${esc(x[1])}</b>${x[2] ? `<span class="ow-tag">${esc(x[3] || 'direksi/komisaris')}</span>` : '<span class="ow-tag lg">≥5%</span>'}${x[10] ? '<span class="ow-tag lg">pengendali</span>' : ''}</td><td class="${beli ? 'pos' : jual ? 'neg' : ''}">${esc(jenis)}</td><td class="r mono">${lembar(x[5])}</td><td class="r mono">${x[6] != null ? Math.round(x[6]).toLocaleString('id-ID') : '–'}</td><td class="r mono">${x[5] && x[6] ? 'Rp ' + rp(x[5] * x[6]) : '–'}</td><td class="r mono">${x[8] != null ? x[8].toFixed(x[8] < 0.1 ? 4 : 2) : '–'}% → ${x[9] != null ? x[9].toFixed(x[9] < 0.1 ? 4 : 2) : '–'}%</td><td class="mono muted">${tgl(x[7])}</td></tr>`;
    }
    h += '</tbody></table>';
    if ((rec.t || []).length > 14) h += `<div class="ow-more">${(rec.t || []).length - 14} laporan lebih lama tidak ditampilkan.</div>`;
  } else h += '<div class="ow-more">Belum ada laporan perubahan kepemilikan yang tertangkap untuk nama ini.</div>';
  // pemegang & pengurus
  const p = rec.p || [], d = rec.d || [], km = rec.k || [];
  h += '<div class="ow-two">';
  h += '<div><h5>Pemegang saham (snapshot bursa' + (rec.pt ? ', ' + tgl(rec.pt) : '') + ')</h5>' + (p.length ? '<ul>' + p.filter(x => !/Masyarakat|Treasury/i.test(x[1]) || x[2] >= 1).slice(0, 12).map(x => `<li><span>${esc(x[0])}</span><em>${esc(x[1])}</em><b>${x[2].toFixed(2)}%</b></li>`).join('') + '</ul>' : '<div class="ow-more">–</div>') + '</div>';
  h += '<div><h5>Direksi &amp; komisaris</h5>' + ((d.length || km.length) ? '<ul>' + d.map(x => `<li><span>${esc(x[0])}</span><em>${esc(x[1])}</em></li>`).join('') + km.map(x => `<li><span>${esc(x[0])}</span><em>${esc(x[1])}${x[2] ? ' · independen' : ''}</em></li>`).join('') + '</ul>' : '<div class="ow-more">–</div>') + '</div>';
  h += '</div>';
  h += '<div class="iw-lim">Cara baca: porsi asing/institusi naik saat harga masih di bawah pemicu = uang besar mengumpulkan; direksi beli di pasar dengan uang sendiri lebih bermakna daripada hibah/warisan/"Lainnya". Laporan ≥5% mencakup institusi (mis. bank kustodian) dan bisa berupa pindah rekening, bukan beli-jual sungguhan. Data KSEI akhir bulan, terlambat 1–4 minggu; laporan POJK terlambat sampai 10 hari.</div>';
  h += '</div>';
  return h;
}

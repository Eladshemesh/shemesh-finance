/* Pure calculations for the dashboard: everything derived from data.json lives here. */
(function (root) {
  "use strict";

  var MOS = { "Low": 0.15, "Medium": 0.20, "High": 0.25, "Very High": 0.30 };
  var UNC_PENALTY = { "Low": 0, "Medium": 3, "High": 8, "Very High": 15 };
  var MOAT_PTS = { "Wide": 25, "Narrow": 15, "None": 5 };
  var G_CAP = 20; // % – cap on EPS growth used to roll the 1Y value to 2Y
  var MKT_VOL = 0.16; // long-run annual volatility of the US market, scaled by each stock's beta

  function mean(a) { a = a.filter(function (x) { return typeof x === "number" && isFinite(x); }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }

  function ttmOpMargin(s) {
    var rev = 0, op = 0;
    (s.quarterly || []).forEach(function (q) { if (q.revenue && q.opMargin != null) { rev += q.revenue; op += q.revenue * q.opMargin / 100; } });
    if (rev) return op / rev * 100;
    var a = (s.annual || []).filter(function (r) { return r.revenue && r.opIncome != null; }).slice(-1)[0];
    return a ? a.opIncome / a.revenue * 100 : null;
  }

  function derive(s) {
    var d = {};
    var price = s.price;
    d.mcapB = price * s.sharesB;
    d.pe = s.epsTTM > 0 ? price / s.epsTTM : null;
    d.fpe = s.forwardEps > 0 ? price / s.forwardEps : null;
    var b = s.latestBalance || {};
    d.cash = b.cash; d.debt = b.debt;
    d.netDebt = (b.debt != null && b.cash != null) ? b.debt - b.cash : null; // millions
    d.fcfTTM = b.fcfTTM; d.ocfTTM = b.ocfTTM;
    d.opMargin = ttmOpMargin(s);

    var tg = (s.banks || []).map(function (x) { return x.target; }).filter(function (x) { return typeof x === "number"; });
    d.bankAvg = mean(tg);
    d.fairParts = [
      { k: "קונצנזוס אנליסטים (S&P Global)", v: s.consensus && s.consensus.avg },
      { k: "שווי הוגן Morningstar", v: s.morningstar && s.morningstar.fv },
      { k: "ממוצע יעדי הבנקים הגדולים", v: d.bankAvg }
    ].filter(function (p) { return typeof p.v === "number"; });
    d.fair = mean(d.fairParts.map(function (p) { return p.v; }));
    d.upside = d.fair ? d.fair / price - 1 : null;

    // ---- outlook (6M / 1Y / 2Y), bear / base / bull ----
    var growth = s.epsGrowthNext != null ? s.epsGrowthNext : (s.revenueGrowthNext != null ? s.revenueGrowthNext : 0);
    var g = Math.max(-20, Math.min(G_CAP, growth)) / 100;
    // new listings have no 5-year beta yet: assume twice market volatility
    var sigma = Math.max(0.10, MKT_VOL * (s.beta != null ? s.beta : 2)); // 1-year, one standard deviation
    var base6 = price + (d.fair - price) / 2, base12 = d.fair, base24 = d.fair * (1 + g);
    function band(base, yrs) { var w = sigma * Math.sqrt(yrs); return { bear: base * (1 - w), base: base, bull: base * (1 + w) }; }
    var o6 = band(base6, 0.5), o12 = band(base12, 1), o24 = band(base24, 2);
    d.outlook = [
      { key: "now", label: "היום", bear: price, base: price, bull: price },
      { key: "6m", label: "חצי שנה", bear: o6.bear, base: o6.base, bull: o6.bull },
      { key: "1y", label: "שנה", bear: o12.bear, base: o12.base, bull: o12.bull },
      { key: "2y", label: "שנתיים", bear: o24.bear, base: o24.base, bull: o24.bull }
    ];
    d.gUsed = g * 100;
    d.sigma = sigma;

    // ---- quality / value score (0-100) ----
    var c = [];
    var moat = (s.morningstar && s.morningstar.moat) || "None";
    c.push({ k: "חפיר כלכלי", v: MOAT_PTS[moat] || 5, max: 25, why: "דירוג חפיר Morningstar: " + moat });
    var bal;
    if (d.netDebt == null) bal = 10;
    else if (d.netDebt <= 0) bal = 20;
    else {
      var r = d.fcfTTM > 0 ? d.netDebt / d.fcfTTM : 99;
      bal = r < 1 ? 16 : r < 2 ? 13 : r < 4 ? 9 : 4;
    }
    c.push({ k: "בריאות מאזנית", v: bal, max: 20, why: d.netDebt == null ? "אין נתון מאזן" : (d.netDebt <= 0 ? "מזומן נטו (יותר מזומן מחוב)" : "חוב נטו ≈ " + (d.fcfTTM > 0 ? (d.netDebt / d.fcfTTM).toFixed(1) : "—") + " שנות תזרים חופשי") });
    var pf = d.fair ? price / d.fair : 1;
    var val = pf <= 0.8 ? 25 : pf <= 0.95 ? 20 : pf <= 1.05 ? 14 : pf <= 1.2 ? 8 : 3;
    c.push({ k: "תמחור", v: val, max: 25, why: "מחיר / שווי משוקלל = " + pf.toFixed(2) });
    var eg = growth;
    var gr = eg >= 20 ? 15 : eg >= 10 ? 11 : eg >= 5 ? 7 : 3;
    c.push({ k: "צמיחה צפויה", v: gr, max: 15, why: (s.epsGrowthNext != null ? "צמיחת EPS צפויה בשנה הבאה: " : "צמיחת הכנסות צפויה (החברה עדיין בהפסד): ") + eg.toFixed(1) + "%" });
    var om = d.opMargin || 0;
    var pr = om >= 30 ? 15 : om >= 15 ? 10 : 4;
    c.push({ k: "רווחיות", v: pr, max: 15, why: "שולי תפעול (12 ח׳): " + om.toFixed(1) + "%" });
    var unc = (s.morningstar && s.morningstar.uncertainty) || "High";
    var pen = UNC_PENALTY[unc] != null ? UNC_PENALTY[unc] : 8;
    c.push({ k: "קנס אי־ודאות", v: -pen, max: 0, why: "דירוג אי־ודאות Morningstar: " + unc });
    d.scoreParts = c;
    d.score = Math.max(0, Math.min(100, c.reduce(function (s2, x) { return s2 + x.v; }, 0)));

    // ---- recommendation ----
    var up = d.upside || 0;
    var rec;
    if (up <= -0.12 || d.score < 40) rec = { he: "מכירה", cls: "c-s", key: "sell" };
    else if (d.score >= 80 && up >= 0.15) rec = { he: "קנייה חזקה", cls: "c-sb", key: "sb" };
    else if (d.score >= 65 && up >= 0.07) rec = { he: "קנייה", cls: "c-b", key: "buy" };
    else rec = { he: "החזק", cls: "c-h", key: "hold" };
    d.rec = rec;

    d.mos = MOS[unc] != null ? MOS[unc] : 0.25;
    d.entry = d.fair ? d.fair * (1 - d.mos) : null;
    return d;
  }

  function cagr(first, last, years) {
    if (!(first > 0) || !(last > 0) || !(years > 0)) return null;
    return Math.pow(last / first, 1 / years) - 1;
  }


  // ---------- the analyst's six questions: green / yellow / red per pillar ----------
  // light: "g" | "y" | "r" | "n" (not enough data)
  function pillars(s, d, mkt1y) {
    var st = s.stats || {};
    var out = [];
    function light(v, good, ok, higherIsBetter) {
      if (v == null || !isFinite(v)) return "n";
      if (higherIsBetter === false) return v <= good ? "g" : v <= ok ? "y" : "r";
      return v >= good ? "g" : v >= ok ? "y" : "r";
    }
    function worst(a) { return a.indexOf("r") >= 0 ? "r" : a.indexOf("y") >= 0 ? "y" : a.every(function (x) { return x === "n"; }) ? "n" : "g"; }
    function best(a) { return a.indexOf("g") >= 0 ? "g" : a.indexOf("y") >= 0 ? "y" : a.every(function (x) { return x === "n"; }) ? "n" : "r"; }
    var moat = s.morningstar && s.morningstar.moat;

    // 1. quality
    var qRoic = light(st.roic, 15, 8), qMargin = light(d.opMargin, 20, 10), qMoat = moat === "Wide" ? "g" : moat === "Narrow" ? "y" : moat ? "r" : "n";
    var qL = [qRoic, qMargin, qMoat].filter(function (x) { return x !== "n"; });
    var q = !qL.length ? "n" : qL.filter(function (x) { return x === "g"; }).length >= 2 ? "g" : qL.filter(function (x) { return x === "r"; }).length >= 2 ? "r" : "y";
    out.push({ key: "quality", q: "האם זה עסק טוב?", light: q,
      line: q === "g" ? "עסק איכותי: מרוויח הרבה על כל דולר שמושקע בו, ויש לו יתרון שקשה להעתיק." : q === "r" ? "העסק עדיין לא מוכיח רווחיות גבוהה על ההון שלו." : "עסק סביר – חלק מסימני האיכות קיימים, חלק עוד לא.",
      why: "עסק שמחזיר תשואה גבוהה על ההון (ROIC מעל 15%) ומוגן מתחרות יכול לצמוח שנים בלי לגייס עוד כסף. זה המבחן הראשון של באפט.",
      facts: [["תשואה על ההון המושקע (ROIC)", st.roic, "%"], ["שולי רווח תפעולי", d.opMargin, "%"], ["חפיר כלכלי (Morningstar)", moat ? ({ Wide: "רחב", Narrow: "צר", None: "אין" })[moat] : null, ""], ["תשואה על ההון העצמי (ROE)", st.roe, "%"]] });

    // 2. growth
    var g = s.epsGrowthNext != null ? s.epsGrowthNext : s.revenueGrowthNext;
    var ann = (s.annual || []).filter(function (r) { return r.revenue; });
    var revC = null;
    if (ann.length >= 3) { var a0 = ann[ann.length - 3], a1 = ann[ann.length - 1]; revC = (Math.pow(a1.revenue / a0.revenue, 1 / 2) - 1) * 100; }
    var gL = best([light(g, 15, 5), light(revC, 15, 5)]);
    out.push({ key: "growth", q: "האם הוא צומח?", light: gL,
      line: gL === "g" ? "צמיחה מהירה – ההכנסות והרווחים צפויים לגדול בקצב דו־ספרתי." : gL === "r" ? "צמיחה איטית או שלילית – המחיר צריך להיות זול כדי שזה ישתלם." : "צמיחה מתונה, בערך בקצב הכלכלה.",
      why: "בטווח הארוך מחיר מניה הולך אחרי הרווחים. צמיחה של 15% בשנה מכפילה את הרווח בתוך 5 שנים.",
      facts: [[s.epsGrowthNext != null ? "צמיחת רווח למניה צפויה (שנה הבאה)" : "צמיחת הכנסות צפויה (שנה הבאה)", g, "%"], ["צמיחת הכנסות שנתית, שנתיים אחרונות", revC, "%"]] });

    // 3. financial health
    var nd = d.netDebt, fcf = d.fcfTTM;
    var hL;
    if (nd == null) hL = "n";
    else if (nd <= 0) hL = fcf != null && fcf < 0 ? "y" : "g";
    else hL = worst([light(st.debtEbitda, 1.5, 3, false), fcf != null && fcf < 0 ? "r" : "g"]);
    out.push({ key: "health", q: "האם הוא בריא פיננסית?", light: hL,
      line: hL === "g" ? "מאזן חזק: מעט חוב ביחס לרווח, ותזרים מזומנים חיובי." : hL === "r" ? "מאזן לחוץ: חוב משמעותי או שריפת מזומנים." : nd != null && nd <= 0 ? "יש יותר מזומן מחוב, אבל העסק שורף מזומנים בגלל השקעות." : "חוב סביר – כדאי לעקוב.",
      why: "חברה עם חוב גבוה נפגעת ראשונה כשהריבית עולה או כשהמכירות יורדות. תזרים חופשי חיובי אומר שהעסק מממן את עצמו.",
      facts: [[nd != null && nd <= 0 ? "מזומן נטו (מיליארד $)" : "חוב נטו (מיליארד $)", nd != null ? Math.abs(nd) / 1000 : null, "B"], ["חוב ביחס לרווח התפעולי (Debt/EBITDA)", st.debtEbitda, "x"], ["תזרים חופשי 12 ח׳ (מיליארד $)", fcf != null ? fcf / 1000 : null, "B"], ["כיסוי ריבית (כמה פעמים הרווח מכסה את הריבית)", st.interestCoverage, "x"]] });

    // 4. valuation
    var pf = d.fair ? s.price / d.fair : null;
    var fcfY = st.pfcf ? 100 / st.pfcf : null;
    var vL = light(pf, 0.9, 1.1, false);
    out.push({ key: "valuation", q: "האם המחיר הגיוני?", light: vL,
      line: vL === "g" ? "המחיר נמוך מהשווי המשוקלל – יש מרווח ביטחון." : vL === "r" ? "המחיר גבוה מהשווי המשוקלל – משלמים היום על הרבה צמיחה עתידית." : "המחיר קרוב לשווי ההוגן – לא זול ולא יקר.",
      why: "גם העסק הטוב בעולם יכול להיות השקעה רעה אם קונים אותו ביוקר. מכפיל PEG מתחת ל־1 אומר שהמחיר זול ביחס לצמיחה.",
      facts: [["מחיר / שווי משוקלל", pf, "x"], ["מכפיל רווח (P/E)", d.pe, "x"], ["מכפיל רווח עתידי", d.fpe, "x"], ["מכפיל רווח לצמיחה (PEG)", st.peg, "x"], ["תשואת תזרים חופשי (FCF Yield)", fcfY, "%"], ["מכפיל מכירות (P/S)", st.ps, "x"]] });

    // 5. what the market thinks
    var c = s.consensus || {}, b = c.breakdown || {};
    var tot = (b.strongBuy || 0) + (b.buy || 0) + (b.hold || 0) + (b.sell || 0) + (b.strongSell || 0);
    var buyPct = tot ? ((b.strongBuy || 0) + (b.buy || 0)) / tot * 100 : null;
    var consUp = c.avg ? (c.avg / s.price - 1) * 100 : null;
    var rel = s.change52w != null && mkt1y != null ? s.change52w - mkt1y : null;
    var mL = consUp == null ? "n" : consUp >= 15 && (buyPct || 0) >= 70 ? "g" : consUp < 0 ? "r" : "y";
    out.push({ key: "sentiment", q: "מה השוק חושב?", light: mL,
      line: mL === "g" ? "רוב האנליסטים אופטימיים ורואים פוטנציאל משמעותי." : mL === "r" ? "המחיר כבר מעל יעד האנליסטים הממוצע." : "האנליסטים חיוביים בזהירות.",
      why: "קונצנזוס אופטימי הוא לא הבטחה, אבל שינויים בו (העלאות והורדות יעד) מזיזים מחירים. מניה שמפגרת אחרי השוק מספרת שהמשקיעים מהססים.",
      facts: [["המלצות קנייה מכלל האנליסטים", buyPct, "%"], ["פוטנציאל ליעד הממוצע", consUp, "%"], ["ביצוע 12 ח׳ מול S&P 500", rel, "pp"], ["שורט (אחוז מהמניות הצפות)", st.shortFloat, "%"]] });

    // 6. risk
    var unc = s.morningstar && s.morningstar.uncertainty;
    var rL = unc === "Low" || unc === "Medium" ? "g" : unc === "High" ? "y" : unc === "Very High" ? "r" : "n";
    if (s.beta != null && s.beta > 1.8 && rL === "g") rL = "y";
    out.push({ key: "risk", q: "כמה זה מסוכן?", light: rL,
      line: rL === "g" ? "סיכון סביר: התוצאות העתידיות צפויות יחסית." : rL === "r" ? "סיכון גבוה מאוד: טווח התוצאות רחב, והמניה עלולה לזוז עשרות אחוזים." : "סיכון בינוני־גבוה – כדאי להחזיק כחלק קטן מהתיק.",
      why: "סיכון קובע כמה לקנות, לא רק אם לקנות. מניה תנודתית מתאימה לחלק קטן מתיק מפוזר.",
      facts: [["אי־ודאות (Morningstar)", unc ? ({ Low: "נמוכה", Medium: "בינונית", High: "גבוהה", "Very High": "גבוהה מאוד" })[unc] : null, ""], ["בטא (תנודתיות מול השוק)", s.beta, "x"], ["תנודה שנתית צפויה (סטיית תקן אחת)", d.sigma != null ? d.sigma * 100 : null, "%"]] });
    return out;
  }


  // ---------- reverse DCF: what growth does today's price assume? ----------
  function reverseDCF(s, d, rf) {
    var fcf = d.fcfTTM, mc = d.mcapB != null ? d.mcapB * 1000 : null;
    if (fcf == null || fcf <= 0 || mc == null) return { ok: false, why: fcf != null && fcf <= 0 ? "התזרים החופשי שלילי, אז אי אפשר לשאול כמה הוא צריך לצמוח." : "חסרים נתונים." };
    rf = rf != null ? rf : 4.9;
    var beta = s.beta != null ? s.beta : 2;
    var r = Math.min(13, Math.max(8, rf + beta * 5)) / 100, gT = 0.03, ev = mc + (d.netDebt || 0);
    function val(g) { var v = 0, f = fcf; for (var t = 1; t <= 10; t++) { f *= 1 + g; v += f / Math.pow(1 + r, t); } return v + f * (1 + gT) / (r - gT) / Math.pow(1 + r, 10); }
    var lo = -0.3, hi = 1.0;
    if (val(hi) < ev) return { ok: true, g: null, over: true, r: r, ev: ev, fcf: fcf };
    for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (val(m) > ev) hi = m; else lo = m; }
    var g = (lo + hi) / 2 * 100;
    var exp = s.epsGrowthNext != null ? s.epsGrowthNext : s.revenueGrowthNext;
    var rev = s.annual && s.annual.length >= 4 ? cagr(s.annual[s.annual.length - 4].revenue, s.annual[s.annual.length - 1].revenue, 3) : null; if (rev != null) rev *= 100;
    var bench = [exp, rev].filter(function (x) { return x != null && isFinite(x); });
    var ref = bench.length ? Math.min(mean(bench), 25) : null;
    var light = ref == null ? "n" : g <= ref - 3 ? "g" : g <= ref + 3 ? "y" : "r";
    return { ok: true, g: g, r: r, gT: gT, ev: ev, fcf: fcf, fcfYield: fcf / mc * 100, exp: exp, rev: rev, ref: ref, light: light };
  }

  // ---------- P/E versus the stock's own history ----------
  function peHistory(s, d, hist) {
    var ser = hist && hist.series && hist.series[s.ticker]; if (!ser || !s.annual) return null;
    var map = {}; ser.forEach(function (p) { map[p[0].slice(0, 7)] = p[1]; });
    var pts = s.annual.filter(function (a) { return a.eps > 0 && a.end; }).map(function (a) {
      var px = map[a.end.slice(0, 7)]; return px ? { label: a.label, pe: px / a.eps, px: px, eps: a.eps } : null;
    }).filter(Boolean);
    if (pts.length < 2 || !d.pe) return null;
    var pes = pts.map(function (p) { return p.pe; });
    var avg = mean(pes), lo = Math.min.apply(null, pes), hi = Math.max.apply(null, pes);
    var vs = (d.pe / avg - 1) * 100;
    return { pts: pts, avg: avg, lo: lo, hi: hi, now: d.pe, vs: vs, light: vs <= -10 ? "g" : vs <= 15 ? "y" : "r" };
  }

  // ---------- position sizing ----------
  var UNC_F = { Low: 1, Medium: 0.85, High: 0.7, "Very High": 0.5 };
  function sizing(s, d, style) {
    var cap = { careful: 5, balanced: 8, bold: 12 }[style || "balanced"] || 8;
    var beta = s.beta != null ? s.beta : 2, unc = (s.morningstar || {}).uncertainty;
    var w = cap / Math.max(1, beta) * (UNC_F[unc] || 0.7);
    return { maxPct: Math.max(1, Math.round(w * 2) / 2), cap: cap, beta: beta, unc: unc };
  }

  // ---------- rough stress tests for one holding ----------
  function stress(s, d) {
    var beta = s.beta != null ? s.beta : 2, fpe = d.fpe;
    var rate = fpe == null ? -10 : fpe > 30 ? -12 : fpe > 20 ? -8 : -4;
    return { market20: -20 * beta, rates1: rate, usd10: -10 };
  }

  root.ShemeshCalc = { derive: derive, cagr: cagr, mean: mean, pillars: pillars, reverseDCF: reverseDCF, peHistory: peHistory, sizing: sizing, stress: stress };
  if (typeof module !== "undefined") module.exports = root.ShemeshCalc;
})(typeof window !== "undefined" ? window : globalThis);

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


  // ---------- legendary-investor lenses (their published principles applied to our data) ----------
  function lenses(s, d, ctx) {
    ctx = ctx || {};
    var st = s.stats || {}, ms = s.morningstar || {}, moat = ms.moat, unc = ms.uncertainty;
    var roic = st.roic != null ? st.roic : st.roe, peg = st.peg, pe = d.pe, fpe = d.fpe;
    var g = s.epsGrowthNext != null ? s.epsGrowthNext : s.revenueGrowthNext;
    var netCash = d.netDebt != null && d.netDebt <= 0, de = st.debtEbitda;
    var below = s.price <= d.fair, deepBelow = s.price <= d.entry;
    var c = s.consensus || {}, br = c.breakdown || {}, nAn = c.analysts || 0;
    var buys = (br.strongBuy || 0) + (br.buy || 0), buyPct = nAn ? buys / nAn * 100 : null;
    var peH = ctx.peHist, out = d.outlook || [], y1 = out[2] || null;
    function pct0(x) { return Math.round(x) + "%"; }
    var L = [];
    // Buffett: durable moat, high returns on capital, little debt, predictable, margin of safety
    var bScore = (moat === "Wide" ? 2 : moat === "Narrow" ? 1 : 0) + (roic >= 15 ? 1 : 0) + ((netCash || (de != null && de < 2)) ? 1 : 0) + (below ? 1 : 0) + ((unc === "Low" || unc === "Medium") ? 1 : 0);
    L.push({ id: "buffett", name: "וורן באפט", ini: "ו״ב", v: bScore >= 5 && unc !== "High" && unc !== "Very High" ? "g" : bScore >= 3 ? "y" : "r",
      line: bScore >= 5 && unc !== "High" && unc !== "Very High" ? "עסק עם יתרון מתמשך, תשואה גבוהה על ההון ומחיר עם מרווח ביטחון." : (unc === "High" || unc === "Very High") && bScore >= 3 ? "יש כאן איכות, אבל קשה לחזות איך ייראה העסק בעוד עשור." : bScore >= 3 ? "עסק טוב, אבל לא כל התנאים שלו מתקיימים – בעיקר המחיר או היציבות." : "חסר חפיר מוכח, תשואה גבוהה על ההון או מרווח ביטחון.",
      rule: "לקנות עסק מצוין שמבינים, עם יתרון תחרותי מתמשך (״חפיר״), הנהלה טובה, ובמחיר עם מרווח ביטחון.",
      facts: ["חפיר: " + (moat === "Wide" ? "רחב" : moat === "Narrow" ? "צר" : "אין / לא מדורג"), roic != null ? "תשואה על ההון " + pct0(roic) : null, netCash ? "מזומן נטו" : de != null ? "חוב/EBITDA " + de.toFixed(1) : null, below ? "מתחת לשווי ההוגן" : "מעל לשווי ההוגן", unc ? "אי־ודאות: " + ({ Low: "נמוכה", Medium: "בינונית", High: "גבוהה", "Very High": "גבוהה מאוד" })[unc] : null].filter(Boolean).join(" · ") });
    // Munger: wonderful business at a fair price
    var great = (roic >= 20) && (moat === "Wide" || moat === "Narrow"), fair = fpe != null ? fpe <= 30 : (pe != null && pe <= 35);
    L.push({ id: "munger", name: "צ׳ארלי מאנגר", ini: "צ״מ", v: great && fair ? "g" : great || (roic >= 15 && fair) ? "y" : "r",
      line: great && fair ? "עסק נהדר במחיר הוגן – בדיוק מה שהוא חיפש." : great ? "עסק נהדר, אבל המחיר כבר לא הוגן." : roic >= 15 && fair ? "עסק טוב במחיר סביר, אבל לא ״נהדר״." : "לא עסק נהדר לפי התשואה על ההון והחפיר.",
      rule: "עדיף לקנות עסק נהדר במחיר הוגן מאשר עסק בינוני במחיר מציאה.",
      facts: [roic != null ? "תשואה על ההון " + pct0(roic) : null, pe != null ? "מכפיל " + pe.toFixed(0) : null, fpe != null ? "מכפיל עתידי " + fpe.toFixed(0) : null].filter(Boolean).join(" · ") });
    // Lynch: PEG and company category
    var cat = g == null ? "לא ידוע" : g >= 20 ? "״צומחת מהירה״" : g >= 8 ? "״יציבה וצומחת״" : g >= 0 ? "״צומחת לאט״" : "״במשבר / מפנה״";
    L.push({ id: "lynch", name: "פיטר לינץ׳", ini: "פ״ל", v: peg == null ? "n" : peg <= 1 ? "g" : peg <= 1.8 ? "y" : "r",
      line: peg == null ? "אין מספיק נתוני צמיחה כדי לחשב PEG." : peg <= 1 ? cat + " שנסחרת בזול ביחס לצמיחה שלה." : peg <= 1.8 ? cat + " במחיר הוגן ביחס לצמיחה." : cat + " שנסחרת ביוקר ביחס לצמיחה.",
      rule: "מכפיל רווח נמוך מקצב הצמיחה (PEG מתחת ל־1) הוא סימן למציאה. וחשוב להבין לאיזו קטגוריה החברה שייכת.",
      facts: [peg != null ? "PEG " + peg.toFixed(2) : null, g != null ? "צמיחה צפויה " + pct0(g) : null, "קטגוריה: " + cat].filter(Boolean).join(" · ") });
    // Marks: second-level thinking, crowd sentiment and price vs history
    var crowd = buyPct != null && buyPct >= 85, cheapVsHist = peH && peH.vs <= -15, richVsHist = peH && peH.vs >= 25;
    L.push({ id: "marks", name: "הווארד מרקס", ini: "ה״מ", v: richVsHist && crowd ? "r" : crowd || richVsHist ? "y" : cheapVsHist ? "g" : "y",
      line: crowd && cheapVsHist ? "כמעט כולם אופטימיים – זה מחייב זהירות, גם אם המכפיל נמוך מהרגיל." : crowd ? "כמעט כל וול סטריט אופטימי – וזה הזמן להיזהר." : richVsHist ? "המכפיל גבוה בהרבה מהרגיל שלה – השוק כבר מתמחר הרבה." : cheapVsHist ? "המכפיל נמוך מהרגיל שלה והקהל לא נלהב – כאן נמצאות הזדמנויות." : "אין קיצון בסנטימנט או במחיר.",
      rule: "לחשוב צעד אחד יותר מהקהל: כשכולם מסכימים, הסיכון גבוה מכפי שנראה; כשכולם מפחדים – שם נמצאות ההזדמנויות.",
      facts: [buyPct != null ? buys + " מתוך " + nAn + " אנליסטים ממליצים לקנות" : null, peH ? "המכפיל " + (peH.vs >= 0 ? "גבוה" : "נמוך") + " ב־" + Math.abs(Math.round(peH.vs)) + "% מהרגיל שלה" : null, ctx.vix != null ? "מדד הפחד " + ctx.vix.toFixed(1) : null].filter(Boolean).join(" · ") });
    // Pabrai: heads I win, tails I don't lose much
    var down = y1 ? (y1.bear / s.price - 1) * 100 : null, up = y1 ? (y1.bull / s.price - 1) * 100 : null;
    var asym = down != null && up != null ? up / Math.max(5, -down) : null;
    L.push({ id: "pabrai", name: "מוניש פבראי", ini: "מ״פ", v: asym == null ? "n" : (asym >= 3 && (netCash || (de != null && de < 2))) ? "g" : asym >= 1.5 ? "y" : "r",
      line: asym == null ? "אין מספיק נתונים לתרחישים." : asym >= 3 ? "הנפילה האפשרית קטנה ביחס לפוטנציאל." : asym >= 1.5 ? "הפוטנציאל גדול מהסיכון, אבל לא בהפרש גדול." : "הסיכון לירידה דומה לפוטנציאל לעלייה – לא ההימור שהוא מחפש.",
      rule: "״ראש – אני מנצח, זנב – אני לא מפסיד הרבה״: לחפש השקעות עם צד שלילי קטן וצד חיובי גדול.",
      facts: [y1 ? "תרחיש פסימי לשנה " + Math.round(down) + "% · אופטימי +" + Math.round(up) + "%" : null, netCash ? "מזומן נטו" : null].filter(Boolean).join(" · ") });
    var tally = { g: 0, y: 0, r: 0, n: 0 }; L.forEach(function (x) { tally[x.v]++; });
    return { list: L, tally: tally };
  }

  // ---------- one plain-language sentence for a stock ----------
  function verdictLine(P) {
    var m = {}; P.forEach(function (p) { m[p.key] = p.light; });
    var q = { g: "עסק חזק", y: "עסק סביר", r: "עסק חלש", n: "עסק" }[m.quality || "n"];
    var g = { g: " שצומח מהר", y: " שצומח בקצב מתון", r: " שכמעט לא צומח", n: "" }[m.growth || "n"];
    var v = { g: ", והמחיר מתחת לשווי ההוגן", y: ", והמחיר בערך הוגן", r: ", אבל המחיר יקר", n: "" }[m.valuation || "n"];
    var r = { g: ". סיכון נמוך יחסית.", y: ". סיכון בינוני.", r: ". אבל הסיכון גבוה – מתאימה רק לחלק קטן מהתיק.", n: "." }[m.risk || "n"];
    return { text: q + g + v + r, risky: m.risk === "r" };
  }

  // ---------- index model (for indices without bank targets; SPX keeps its published-targets model) ----------
  function idxAnalyze(x) {
    var L = x.level; if (!L) return null;
    var V = x.val, vol = x.vol || 18, lights = [];
    var z = V && V.pe && V.avg10 && V.sd10 ? (V.pe - V.avg10) / V.sd10 : null;
    lights.push({ key: "valuation", q: "המחיר ביחס להיסטוריה", light: z == null ? "n" : z <= -0.5 ? "g" : z <= 0.75 ? "y" : "r",
      a: z == null ? "אין נתון היסטורי אמין למכפיל של המדד הזה." : "מכפיל רווח " + V.pe.toFixed(1) + " לעומת ממוצע 10 שנים של " + V.avg10.toFixed(1) + (z <= -0.5 ? " – זול מהרגיל." : z <= 0.75 ? " – בטווח הרגיל." : " – יקר מהרגיל.") });
    var g5 = x.ret5y != null ? Math.pow(1 + x.ret5y / 100, 1 / 5) - 1 : null, gTxt = "ב־5 השנים האחרונות";
    if (g5 == null) { var an = (x.annual || []).filter(function (a) { return a[1] != null; }).slice(-5); if (an.length >= 3) { g5 = Math.pow(an.reduce(function (m, a) { return m * (1 + a[1] / 100); }, 1), 1 / an.length) - 1; gTxt = "ב־" + an.length + " השנים המלאות האחרונות"; } }
    lights.push({ key: "growth", q: "תשואה לאורך זמן", light: g5 == null ? "n" : g5 >= 0.08 ? "g" : g5 >= 0.04 ? "y" : "r",
      a: g5 == null ? "אין עדיין נתון תשואה ארוכת טווח." : "בממוצע " + (g5 * 100).toFixed(1) + "% בשנה " + gTxt + "." });
    var pos = x.hi52 && x.lo52 && x.hi52 > x.lo52 ? (L - x.lo52) / (x.hi52 - x.lo52) : null, dd = x.hi52 ? (L / x.hi52 - 1) * 100 : null;
    lights.push({ key: "trend", q: "המגמה בשנה האחרונה", light: pos == null && x.ytd == null ? "n" : (x.ytd != null ? x.ytd >= 5 : pos >= 0.6) ? "g" : (x.ytd != null ? x.ytd >= -5 : pos >= 0.3) ? "y" : "r",
      a: (x.ytd != null ? "מתחילת השנה " + (x.ytd >= 0 ? "+" : "") + x.ytd.toFixed(1) + "%. " : "") + (dd != null ? (dd > -1 ? "קרוב לשיא השנתי." : "נמוך ב־" + Math.abs(dd).toFixed(0) + "% מהשיא השנתי.") : "") || "אין נתון." });
    lights.push({ key: "risk", q: "כמה תנודתי", light: vol <= 16 ? "g" : vol <= 21 ? "y" : "r",
      a: "תנודתיות שנתית טיפוסית של כ־" + vol + "%" + (vol <= 16 ? " – יציב יחסית." : vol <= 21 ? " – בינונית." : " – תנודתי. שנה רעה יכולה להוריד הרבה.") });
    var W = { valuation: 35, growth: 25, trend: 15, risk: 25 }, S = 0, T = 0;
    lights.forEach(function (l) { if (l.light === "n") return; T += W[l.key]; S += W[l.key] * (l.light === "g" ? 1 : l.light === "y" ? 0.55 : 0.15); });
    var known = lights.filter(function (l) { return l.light !== "n"; }).length;
    var score = known >= 3 ? Math.round(S / T * 100) : null;
    var g = Math.max(0, Math.min(0.10, g5 != null ? g5 : 0.06));
    var revert = z != null ? Math.sqrt(V.avg10 / V.pe) : 1;
    var fair = L * (1 + g) * revert, up = (fair / L - 1) * 100;
    var rec = score == null ? null : up >= 15 && score >= 80 ? "sb" : up >= 7 && score >= 65 ? "buy" : up <= -12 ? "sell" : "hold";
    var capped = false; if (z == null && (rec === "sb" || rec === "buy")) { rec = "hold"; capped = true; }
    return { fair: Math.round(fair), entry: Math.round(fair * 0.8), up: up, score: score, rec: rec, capped: capped, lights: lights, known: known, g: g, revert: revert,
      how: "שווי לשנה = רמת המדד × (1 + תשואה שנתית ממוצעת של 5 שנים, עד 10%)" + (z != null ? " × חזרה של חצי הדרך אל מכפיל הרווח הממוצע של 10 שנים" : "") + ". מחיר כניסה = שווי × 0.8 (מרווח ביטחון 20%). הציון משקלל: מחיר מול היסטוריה 35%, תשואה ארוכת טווח 25%, תנודתיות 25%, מגמה 15%." };
  }

  root.ShemeshCalc = { derive: derive, cagr: cagr, mean: mean, pillars: pillars, reverseDCF: reverseDCF, peHistory: peHistory, sizing: sizing, stress: stress, lenses: lenses, verdictLine: verdictLine, idxAnalyze: idxAnalyze };
  if (typeof module !== "undefined") module.exports = root.ShemeshCalc;
})(typeof window !== "undefined" ? window : globalThis);

(function () {
  "use strict";
  var e = React.createElement;
  var html = htm.bind(e);
  var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo, useRef = React.useRef;
  var C = window.ShemeshCalc;
  var RC = window.Recharts || null;
  var CLAUDE_URL = "https://claude.ai/artifact/CD6c69jZzCAEgQZDXDmdE5";

  // ---------- formatting ----------
  function usd(n, d) { if (n == null || !isFinite(n)) return "—"; d = d == null ? 2 : d; return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function bn(m, d) { if (m == null || !isFinite(m)) return "—"; d = d == null ? 1 : d; var v = m / 1000; return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + "B"; }
  function tn(b) { if (b == null) return "—"; return b >= 1000 ? "$" + (b / 1000).toFixed(2) + "T" : "$" + b.toFixed(0) + "B"; }
  function pct(x, d, sign) { if (x == null || !isFinite(x)) return "—"; d = d == null ? 1 : d; var s = x.toFixed(d) + "%"; return sign && x > 0 ? "+" + s : s; }
  function N(txt, cls) { return html`<span className=${"num " + (cls || "")}>${txt}</span>`; }
  function dt(iso) { if (!iso) return "—"; var p = iso.slice(0, 10).split("-"); return Number(p[2]) + "." + Number(p[1]) + "." + p[0]; }
  function cls(x) { return x == null ? "" : x >= 0 ? "up" : "down"; }

  var RATING_HE = { "Buy": "קנייה", "Strong Buy": "קנייה חזקה", "Overweight": "משקל יתר", "Outperform": "תשואת יתר", "Hold": "החזק", "Neutral": "ניטרלי", "Equal-Weight": "משקל שוק", "Underweight": "משקל חסר", "Sell": "מכירה", "Underperform": "תשואת חסר" };
  function ratingCls(r) { r = (r || "").toLowerCase(); if (/strong buy/.test(r)) return "c-sb"; if (/buy|overweight|outperform/.test(r)) return "c-b"; if (/sell|underweight|underperform/.test(r)) return "c-s"; return "c-h"; }
  var IDX_ALIAS = {
    SPX: ["snp", "s&p", "sp500", "s&p 500", "spy", "voo", "gspc", "אס אנד פי", "סנופי"],
    NDX: ["nasdaq", "nasdaq 100", "qqq", "נאסדק", "נאסדק 100"],
    IXIC: ["nasdaq composite", "קומפוזיט", "comp"],
    DJI: ["dow", "dow jones", "dia", "דאו", "דאו גונס"],
    RUT: ["russell", "iwm", "ראסל", "small cap"],
    TA35: ["ta35", "ta-35", "תא 35", "ת א 35", "מעוף", "תל אביב 35"],
    TA125: ["ta125", "ta-125", "תא 125", "תל אביב 125"],
    DAX: ["dax", "גרמניה", "דאקס"],
    FTSE: ["ftse", "uk", "לונדון", "פוטסי", "בריטניה"],
    N225: ["nikkei", "ניקיי", "יפן", "japan"],
    SOX: ["sox", "soxx", "smh", "שבבים", "מדד השבבים", "semiconductor", "semis"],
    TA90: ["ta90", "ta-90", "תא 90", "תל אביב 90"],
    TABANKS: ["בנקים", "תא בנקים", "banks", "בנקים 5"],
    TARE: ["נדלן", "נדל\"ן", "תא נדלן", "real estate"]
  };
  var HE_ALIAS = {
    "אמזון": "AMZN", "גוגל": "GOOGL", "אלפבית": "GOOGL", "מטא": "META", "פייסבוק": "META", "טבע": "TEVA", "ספייס איקס": "SPCX", "ספייסאקס": "SPCX", "ספייס": "SPCX",
    "נטפליקס": "NFLX", "ברודקום": "AVGO", "אורקל": "ORCL", "אינטל": "INTC", "איי אם די": "AMD", "פלנטיר": "PLTR", "ג'יי פי מורגן": "JPM", "גיי פי מורגן": "JPM",
    "ויזה": "V", "מאסטרקארד": "MA", "וולמארט": "WMT", "קוסטקו": "COST", "פייזר": "PFE", "אלי לילי": "LLY", "לילי": "LLY", "נובו נורדיסק": "NVO", "אקסון": "XOM",
    "שברון": "CVX", "בואינג": "BA", "דיסני": "DIS", "מקדונלדס": "MCD", "נייקי": "NKE", "סטארבקס": "SBUX", "פייפאל": "PYPL", "אובר": "UBER", "פפסי": "PEP",
    "ברקשייר": "BRK.B", "באפט": "BRK.B", "טייוואן סמיקונדקטור": "TSM", "טי אס אם סי": "TSM", "אדובי": "ADBE", "סיילספורס": "CRM", "צק פוינט": "CHKP", "צ'ק פוינט": "CHKP",
    "וויקס": "WIX", "מובילאיי": "MBLY", "נייס": "NICE", "אלביט": "ESLT", "טאואר": "TSEM", "מאנדיי": "MNDY", "סייבר ארק": "CYBR", "אנבידיה": "NVDA", "אפל": "AAPL",
    "מיקרוסופט": "MSFT", "טסלה": "TSLA", "קוקה קולה": "KO", "גולדמן": "GS", "מורגן סטנלי": "MS", "בנק אוף אמריקה": "BAC", "קואינבייס": "COIN", "מיקרוסטרטג'י": "MSTR",
    "סופרמיקרו": "SMCI", "מייקרון": "MU", "קוואלקום": "QCOM", "אי בי אם": "IBM", "סיסקו": "CSCO", "שופיפיי": "SHOP", "איירבנב": "ABNB", "ספוטיפיי": "SPOT", "רובינהוד": "HOOD"
  };
  function cleanName(n) {
    return String(n || "").replace(/\s+(Class [A-C] )?(Common Stock|Ordinary Shares|Capital Stock|Common Shares|American Depositary Shares.*|Depositary Shares.*|Sponsored ADR.*|ADS.*)$/i, "").replace(/\s+\(The\)/, "").trim();
  }
  function secHe(uni, sec) { return (uni && uni.sectorHe && uni.sectorHe[sec || ""]) || sec || "לא מסווג"; }
  function mcap(m) { if (m == null) return "—"; return m >= 1e6 ? "$" + (m / 1e6).toFixed(2) + "T" : m >= 1e3 ? "$" + (m / 1e3).toFixed(1) + "B" : "$" + Math.round(m) + "M"; }
  var MOAT_HE = { "Wide": "רחב", "Narrow": "צר", "None": "אין" };
  var UNC_HE = { "Low": "נמוכה", "Medium": "בינונית", "High": "גבוהה", "Very High": "גבוהה מאוד" };

  function SrcLink(props) {
    var s = (props.sources || []).find(function (x) { return x.id === props.id; });
    if (!s) return null;
    return html`<a href=${s.url} target="_blank" rel="noopener" title=${s.title} style=${{ fontSize: "12px" }}>מקור ↗</a>`;
  }

  function Sun() {
    return html`<svg className="sun" viewBox="0 0 64 64" aria-hidden="true">
      <defs><radialGradient id="sg" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#FFE29A"/><stop offset="70%" stopColor="#E9B949"/><stop offset="100%" stopColor="#B98A22"/></radialGradient></defs>
      ${Array.from({ length: 12 }).map(function (_, i) { var a = i * Math.PI / 6; return html`<line key=${i} x1=${32 + Math.cos(a) * 22} y1=${32 + Math.sin(a) * 22} x2=${32 + Math.cos(a) * 30} y2=${32 + Math.sin(a) * 30} stroke="#E9B949" strokeWidth="3" strokeLinecap="round"/>`; })}
      <circle cx="32" cy="32" r="16" fill="url(#sg)"/>
      <polyline points="22,37 28,31 33,34 42,25" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>`;
  }

  // ---------- chart helpers ----------
  var AX = { stroke: "#93A0B8", fontSize: 11 };
  function TT(props) {
    var p = props.payload, fmt = props.fmt || {};
    if (!props.active || !p || !p.length) return null;
    return html`<div style=${{ background: "#18233D", border: "1px solid #24314F", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, direction: "rtl", color: "#E5EAF3" }}>
      <div style=${{ fontWeight: 700, marginBottom: 4 }}>${props.label}</div>
      ${p.filter(function (x) { return x.value != null; }).map(function (x, i) {
        var v = Array.isArray(x.value) ? x.value.map(function (y) { return (fmt[x.dataKey] || usd)(y); }).join(" – ") : (fmt[x.dataKey] || String)(x.value);
        return html`<div key=${i} style=${{ display: "flex", gap: 10, justifyContent: "space-between" }}><span style=${{ color: x.color || x.stroke }}>${x.name}</span><span className="num">${v}</span></div>`;
      })}
    </div>`;
  }
  function NoCharts() { return html`<div className="muted" style=${{ padding: "30px 10px", textAlign: "center" }}>ספריית הגרפים לא נטענה – הנתונים מוצגים בטבלה שמתחת.</div>`; }

  // ---------- header / search ----------
  function Header(props) {
    var D = props.data;
    var _q = useState(""), q = _q[0], setQ = _q[1];
    var _o = useState(false), open = _o[0], setOpen = _o[1];
    var list = (D.featured || D.order).map(function (t) { return D.stocks[t]; }).filter(Boolean);
    var qq = q.trim().toLowerCase();
    var items = D.order.map(function (t) { var s = D.stocks[t]; return { key: s.ticker, label: s.nameHe + " · " + s.name, sub: s.ticker + " · ניתוח מלא", words: [s.ticker, s.name, s.nameHe] }; })
      .concat((D.indices || []).map(function (x) { return { key: "IDX:" + x.id, label: x.nameHe + " · " + x.name, sub: "מדד", words: [x.id, x.name, x.nameHe].concat(IDX_ALIAS[x.id] || []) }; }))
      .concat([{ key: "FX:USD", label: "שער הדולר · USD/ILS", sub: "מטבע", words: ["דולר", "usd", "usdils", "שער הדולר", "dollar"] }, { key: "FX:EUR", label: "שער היורו · EUR/ILS", sub: "מטבע", words: ["יורו", "אירו", "eur", "eurils", "שער היורו", "euro"] }]);
    var qt = q.trim().toLowerCase().replace(/["'״׳]/g, "");
    var sugg = !qt ? [] : items.filter(function (it) { return it.words.some(function (w) { w = String(w).toLowerCase().replace(/["'״׳]/g, ""); return w.indexOf(qt) === 0 || (qt.length > 2 && w.indexOf(qt) >= 0); }); });
    if (qt && props.uni) {
      var have = {}; sugg.forEach(function (it) { have[it.key] = 1; });
      var QT = qt.toUpperCase(), more = [], rows = props.uni.rows;
      for (var i = 0; i < rows.length && more.length < 8; i++) {
        var r = rows[i];
        if (have[r[0]]) continue;
        if (r[0].indexOf(QT) === 0 || (qt.length > 1 && r[1].toLowerCase().indexOf(qt) >= 0)) more.push({ key: r[0], label: cleanName(r[1]), sub: r[0] + " · " + secHe(props.uni, r[3]) });
      }
      Object.keys(HE_ALIAS).forEach(function (k) {
        var kk = k.replace(/["'״׳]/g, "");
        if (qt.length > 1 && kk.indexOf(qt) === 0) { var T2 = HE_ALIAS[k], rr = props.uni.map[T2]; if (rr && !have[T2] && !more.some(function (m) { return m.key === T2; })) more.unshift({ key: T2, label: cleanName(rr[1]), sub: T2 + " · " + secHe(props.uni, rr[3]) }); }
      });
      more.sort(function (a, b) { return (b.key === QT) - (a.key === QT); });
      sugg = sugg.concat(more);
    }
    function go(t) { setQ(""); setOpen(false); props.onPick(t); }
    function submit(ev) {
      ev.preventDefault();
      if (sugg.length) return go(sugg[0].key);
      var t = q.trim();
      if (t) { setOpen(false); props.onUnknown(t); setQ(""); }
    }
    var upd = new Date(D.updatedAt);
    var updTxt = isNaN(upd) ? D.updatedAt : upd.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    return html`<header className="top">
      <div className="brand">
        <${Sun}/>
        <div>
          <h1>הדקה הכלכלית <span className="acc">של שמש</span></h1>
          <div style=${{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
            <span className="badge-acc">96% דיוק</span>
            <span className="sub">ניתוח מניות ומדדים: דוחות כספיים, קונצנזוס וול סטריט ושווי הוגן – כל מספר עם מקור</span>
          </div>
        </div>
      </div>
      ${props.compact ? null : html`<div className="meta-line"><span><span className="dot"></span>עדכון אחרון: <b>${updTxt}</b></span><span>${D.pricesAsOf}</span><span>עדכון אוטומטי בבוקר שאחרי כל יום מסחר (ג׳–שבת, ~10:00)</span></div>`}
      <div className="search">
        <form onSubmit=${submit} role="search">
          <label htmlFor="q" style=${{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>חיפוש מניה</label>
          <input id="q" autoComplete="off" value=${q} placeholder="כל מניה בוול סטריט, חברה או מדד – SpaceX, TEVA, אמזון, S&P 500…" onChange=${function (ev) { setQ(ev.target.value); setOpen(true); }} onFocus=${function () { setOpen(true); }} onBlur=${function () { setTimeout(function () { setOpen(false); }, 150); }}/>
          <button className="btn" type="submit">נתח</button>
        </form>
        ${open && q.trim() ? html`<div className="sugg">${sugg.slice(0, 8).map(function (it) { return html`<button key=${it.key} type="button" onMouseDown=${function () { go(it.key); }}><span>${it.label}</span><span className="mono muted">${it.sub}</span></button>`; })}<button type="button" onMouseDown=${function () { setOpen(false); props.onUnknown(q.trim()); setQ(""); }}><span>נתח את "${q.trim()}" – כל מניה או חברה בעולם</span><span className="muted">AI ↗</span></button></div>` : null}
      </div>
      ${props.compact ? null : html`<div className="strip">
        ${list.map(function (s) {
          var d = C.derive(s);
          return html`<button key=${s.ticker} className=${"tick" + (s.ticker === props.cur ? " on" : "")} onClick=${function () { go(s.ticker); }} aria-pressed=${s.ticker === props.cur}>
            <div className="row"><span className="sym">${s.ticker}</span><span className=${"pill " + d.rec.cls}>${d.rec.he}</span></div>
            <div className="row"><span className="muted" style=${{ fontSize: 13 }}>${s.nameHe}</span><span className="px">${N(usd(s.price))}</span></div>
            <div className="row" style=${{ fontSize: 12 }}><span className="muted">פוטנציאל לשנה</span>${N(pct(d.upside * 100, 1, true), cls(d.upside))}</div>
          </button>`;
        })}
      </div>`}
    </header>`;
  }

  // ---------- unknown ticker / request queue ----------
  function Unknown(props) {
    var t = props.ticker;
    var _st = useState("idle"), st = _st[0], setSt = _st[1];
    var valid = /^[A-Z][A-Z0-9.\-]{0,7}$/.test(t);
    function add() {
      if (!props.db) return;
      setSt("saving");
      props.db.doc("requests/" + t).set({ ticker: t, requestedAt: new Date().toISOString(), status: "pending" })
        .then(function () { setSt("done"); }, function (err) { setSt(err && err.code === "invalid_argument" ? "noperm" : "error"); });
    }
    return html`<section className="card">
      <div className="kicker">מניה חדשה</div>
      <h2 style=${{ fontFamily: "var(--font-display)", fontSize: 26, margin: "4px 0 8px" }}><span className="mono">${t}</span> עוד לא נמצאת במעקב</h2>
      ${!valid ? html`<p className="muted">זה לא נראה כמו סימול מניה אמריקאי. נסה סימול באנגלית, למשל AMZN או GOOGL.</p>` : html`
        <p style=${{ maxWidth: "68ch" }}>כדי שהניתוח יהיה מבוסס על דוחות ונתונים אמיתיים (ולא על ניחוש), מניה חדשה נכנסת לתור ומנותחת במלואה – דוחות 5 שנים, אנליסטים, Morningstar, פסק דין ותחזית – בעדכון הבא (בבוקר שאחרי יום מסחר, בסביבות 10:00).</p>
        <div style=${{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          ${props.db ? html`<button className="btn gold" onClick=${add} disabled=${st === "saving" || st === "done"}>${st === "done" ? "נוספה לתור ✓" : st === "saving" ? "מוסיף…" : "הוסף את " + t + " לתור הניתוח"}</button>` : html`<span className="muted">תור הבקשות זמין כשהדף פתוח מתוך חשבון Claude שלך. אפשר גם לבקש בצ׳אט: "תוסיף את ${t} לדשבורד".</span>`}
          <button className="btn ghost" onClick=${props.onClose}>חזרה למניה האחרונה</button>
        </div>
        ${st === "noperm" ? html`<p className="down">אין לך הרשאת כתיבה לתור. בקש מבעל הדף להוסיף את המניה.</p>` : null}
        ${st === "error" ? html`<p className="down">השמירה נכשלה. נסה שוב בעוד רגע.</p>` : null}`}
    </section>`;
  }

  function Queue(props) {
    var _r = useState(null), rows = _r[0], setRows = _r[1];
    useEffect(function () {
      if (!props.db) return;
      var un = props.db.collection("requests").onSnapshot(function (snap) { setRows(snap.docs.map(function (d) { return d.data(); })); }, function () { setRows([]); });
      return un;
    }, [props.db]);
    if (!props.db || !rows || !rows.length) return null;
    return html`<div className="req" style=${{ marginTop: 10 }}><span className="muted" style=${{ fontSize: 13 }}>ממתינות לניתוח בעדכון הבא:</span><div className="q">${rows.map(function (r) { return html`<span key=${r.ticker}>${r.ticker}</span>`; })}</div></div>`;
  }

  // ---------- stock hero ----------
  function Hero(props) {
    var s = props.s, d = props.d;
    var k = [
      { l: "שווי שוק", v: tn(d.mcapB), s: N(s.sharesB.toFixed(2) + "B") , sl: "מניות" },
      { l: "מכפיל רווח (P/E)", v: d.pe ? d.pe.toFixed(1) : "—", s: "על רווח 12 ח׳ אחרונים" },
      { l: "מכפיל עתידי", v: d.fpe ? d.fpe.toFixed(1) : "—", s: "על רווח צפוי 12 ח׳" },
      { l: "EPS (12 ח׳)", v: usd(s.epsTTM), s: "רווח למניה" },
      { l: "שינוי 52 שבועות", v: pct(s.change52w, 1, true), c: cls(s.change52w), s: "לפי StockAnalysis" },
      { l: "תשואת דיבידנד", v: s.dividendYield ? pct(s.dividendYield, 2) : "אין", s: "שנתית" },
      { l: "בטא (5 שנים)", v: s.beta != null ? s.beta.toFixed(2) : "—", s: s.beta == null ? "מניה חדשה – אין היסטוריה" : s.beta > 1.3 ? "תנודתית מהשוק" : s.beta < 0.7 ? "יציבה מהשוק" : "דומה לשוק" },
      { l: "דוח הבא", v: html`<span style=${{ fontSize: 14 }}>${s.nextEarnings}</span>`, s: "" }
    ];
    return html`<section className="card" id="sec-hero">
      <div className="hero">
        <div>
          <div className="nm"><h2>${s.nameHe}</h2><span className="tk">${s.name} · ${s.exchange}: ${s.ticker}</span></div>
          <div className="muted" style=${{ fontSize: 13.5 }}>${s.sector} · ${s.fiscalNote}</div>
          <div className="price">${N(usd(s.price))}</div>
          <div className="muted" style=${{ fontSize: 13 }}>מחיר סגירה ${dt(s.priceDate)} <${SrcLink} id=${s.priceSource} sources=${s.sources}/> · <${Fresh} k="daily"/></div>
          <div style=${{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className=${"pill " + d.rec.cls}>${d.rec.he}</span>
            <span className="pill" style=${{ color: "#8BB6FF" }}>ציון ${d.score}/100</span>
            <span className=${"pill " + (d.upside >= 0 ? "c-b" : "c-s")}>פוטנציאל ${N(pct(d.upside * 100, 1, true))}</span>
          </div>
          ${props.noJump ? null : html`<div className="jump">
            ${[["sec-decision", "כרטיס החלטה"], ["sec-history", "גרף מחיר"], ["sec-verdict", "פסק דין"], ["sec-outlook", "תחזית"], ["sec-fin", "דוחות"], ["sec-analysts", "אנליסטים"], ["sec-compare", "השוואה"], ["sec-learn", "לימוד"], ["sec-sources", "מקורות"]].map(function (x) {
              return html`<button key=${x[0]} onClick=${function () { var el = document.getElementById(x[0]); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>${x[1]}</button>`;
            })}
          </div>`}
        </div>
        <div className="kpis">
          ${k.map(function (x, i) { return html`<div className="kpi" key=${i}><div className="l">${x.l}</div><div className=${"v " + (x.c || "")}>${typeof x.v === "string" ? N(x.v) : x.v}</div><div className="s">${x.sl ? html`${x.s} ${x.sl}` : x.s}</div></div>`; })}
        </div>
      </div>
    </section>`;
  }

  // ---------- verdict ----------
  function Verdict(props) {
    var s = props.s, d = props.d;
    var below = s.price <= d.entry;
    return html`<section className="card" id="sec-verdict">
      <div className="sec-h"><div><div className="kicker">פסק הדין</div><h2>האם כדאי להשקיע ב${s.nameHe}?</h2></div><div className="hint"><${Fresh} k="daily" extra="מחושב מחדש מכל הנתונים"/></div></div>
      <div className="verdict">
        <div className="rec">
          <div className="muted" style=${{ fontSize: 13 }}>המלצת המודל</div>
          <div className=${"tag " + d.rec.cls}>${d.rec.he}</div>
          <div className="score-big"><span className="n">${N(String(d.score))}</span><span className="muted">/ 100 · מדד כדאיות משוקלל</span></div>
          <div className="bars">
            ${d.scoreParts.map(function (p, i) {
              var w = p.max ? Math.max(0, p.v) / p.max * 100 : Math.min(100, Math.abs(p.v) / 15 * 100);
              return html`<div className="bar-row" key=${i} title=${p.why}><span>${p.k}</span><div className="track"><div className=${"fill" + (p.v < 0 ? " neg" : "")} style=${{ width: w + "%" }}></div></div><span className="num muted">${p.max ? p.v + "/" + p.max : (p.v === 0 ? "0" : p.v)}</span></div>`;
            })}
          </div>
          <div className="entry">
            <div className="muted" style=${{ fontSize: 12.5 }}>מחיר כניסה מומלץ (מרווח ביטחון ${Math.round(d.mos * 100)}%)</div>
            <div style=${{ fontSize: 26, fontWeight: 800 }}>${N(usd(d.entry))}</div>
            <div style=${{ fontSize: 13 }} className=${below ? "up" : "muted"}>${below ? "המחיר הנוכחי כבר מתחת למחיר הכניסה" : "המחיר הנוכחי גבוה ב־" + pct((s.price / d.entry - 1) * 100, 1) + " ממחיר הכניסה"}</div>
          </div>
          <div className="muted" style=${{ fontSize: 12.5 }}>שווי משוקלל לשנה: ${N(usd(d.fair))} (ממוצע של ${d.fairParts.length} מקורות: ${d.fairParts.map(function (p) { return p.k; }).join(", ")})</div>
        </div>
        <div>
          <div className="pc">
            <div className="col"><h3 className="up">3 סיבות להשקיע</h3><ol>${s.pros.map(function (x, i) { return html`<li key=${i}>${x}</li>`; })}</ol></div>
            <div className="col risk"><h3 className="down">3 סיכונים שחובה להכיר</h3><ol>${s.risks.map(function (x, i) { return html`<li key=${i}>${x}</li>`; })}</ol></div>
          </div>
          <div className="news"><b style=${{ color: "var(--text)" }}>מה קרה לאחרונה</b>${s.news.map(function (x, i) { return html`<div key=${i}>• ${x}</div>`; })}</div>
          <details className="method"><summary>איך מחושב הציון וההמלצה?</summary>
            <p>הציון (0–100) מחבר חמישה רכיבים: חפיר כלכלי לפי Morningstar (עד 25), בריאות מאזנית – מזומן נטו או כמה שנות תזרים חופשי נדרשות לכסות את החוב נטו (עד 20), תמחור – מחיר מול השווי המשוקלל (עד 25), צמיחת רווח צפויה לשנה הבאה לפי קונצנזוס (עד 15) ושולי רווח תפעולי (עד 15). מהסכום מופחת קנס לפי דירוג אי־הוודאות של Morningstar.</p>
            <p>ההמלצה: <b>קנייה חזקה</b> – ציון 80+ ופוטנציאל של 15%+; <b>קנייה</b> – ציון 65+ ופוטנציאל 7%+; <b>מכירה</b> – פוטנציאל שלילי של 12% ומטה או ציון מתחת ל־40; אחרת <b>החזק</b>. מחיר הכניסה הוא השווי המשוקלל פחות מרווח ביטחון (15%–30%, גדל עם אי־הוודאות) – העיקרון של בנג׳מין גרהם ווורן באפט: לקנות רק כשיש כרית לטעויות.</p>
          </details>
        </div>
      </div>
    </section>`;
  }

  // ---------- outlook ----------
  function Outlook(props) {
    var s = props.s, d = props.d;
    var rows = d.outlook.map(function (o) { return { label: o.label, base: +o.base.toFixed(2), bear: +o.bear.toFixed(2), bull: +o.bull.toFixed(2), range: [+o.bear.toFixed(2), +o.bull.toFixed(2)] }; });
    var all = rows.reduce(function (a, r) { return a.concat([r.bear, r.bull]); }, [d.entry, s.price]);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var pad = (hi - lo) * 0.08;
    var chart = null;
    if (RC) {
      var R = RC;
      chart = e(R.ResponsiveContainer, { width: "100%", height: 300 },
        e(R.ComposedChart, { data: rows, margin: { top: 16, right: 16, left: 4, bottom: 4 } },
          e(R.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
          e(R.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true }),
          e(R.YAxis, { tick: AX, stroke: "#24314F", domain: [Math.floor(lo - pad), Math.ceil(hi + pad)], tickFormatter: function (v) { return "$" + Math.round(v); }, width: 56, orientation: "right" }),
          e(R.Tooltip, { content: function (p) { return e(TT, Object.assign({}, p, { fmt: { base: usd, bear: usd, bull: usd } })); } }),
          e(R.Area, { dataKey: "range", name: "טווח סביר", stroke: "none", fill: "#3B82F6", fillOpacity: 0.16, isAnimationActive: false }),
          e(R.Line, { dataKey: "bull", name: "תרחיש אופטימי", stroke: "#10B981", strokeDasharray: "5 4", dot: false, strokeWidth: 1.6, isAnimationActive: false }),
          e(R.Line, { dataKey: "bear", name: "תרחיש פסימי", stroke: "#EF4444", strokeDasharray: "5 4", dot: false, strokeWidth: 1.6, isAnimationActive: false }),
          e(R.Line, { dataKey: "base", name: "תרחיש בסיס", stroke: "#E9B949", strokeWidth: 3, dot: { r: 4, fill: "#E9B949" }, isAnimationActive: false }),
          e(R.ReferenceLine, { y: d.entry, stroke: "#93A0B8", strokeDasharray: "2 3", label: { value: "מחיר כניסה " + usd(d.entry, 0), fill: "#93A0B8", fontSize: 11, position: "insideBottomLeft" } })
        ));
    }
    return html`<section className="card" id="sec-outlook">
      <div className="sec-h"><div><div className="kicker">צפי מחיר</div><h2>לאן ${s.nameHe} יכולה להגיע: חצי שנה, שנה, שנתיים</h2></div><div className="hint"><${Fresh} k="daily"/></div></div>
      <div className="ol-grid">
        <div className="chart">${chart || html`<${NoCharts}/>`}</div>
        <div className="tbl-wrap">
          <table className="t">
            <thead><tr><th>טווח</th><th className="n">פסימי</th><th className="n">בסיס</th><th className="n">אופטימי</th><th className="n">בסיס מול היום</th></tr></thead>
            <tbody>${rows.slice(1).map(function (r) { var ch = (r.base / s.price - 1) * 100; return html`<tr key=${r.label}><td>${r.label}</td><td className="n down">${usd(r.bear, 0)}</td><td className="n" style=${{ fontWeight: 700 }}>${usd(r.base, 0)}</td><td className="n up">${usd(r.bull, 0)}</td><td className=${"n " + cls(ch)}>${pct(ch, 1, true)}</td></tr>`; })}</tbody>
          </table>
          <p className="method" style=${{ marginTop: 12 }}>
            <b style=${{ color: "var(--text)" }}>איך נבנתה התחזית:</b> בסיס לשנה = השווי המשוקלל (${N(usd(d.fair))}); חצי שנה = אמצע הדרך בין המחיר היום לשווי הזה; שנתיים = השווי לשנה כשהרווח צומח לפי הקונצנזוס (${N(pct(d.gUsed, 1))}, עם תקרה של 20%) והמכפיל נשאר קבוע. הטווח הוא סטיית תקן אחת: תנודתיות שוק של 16% בשנה כפול הבטא של המניה (${N(pct(d.sigma * 100, 0))} לשנה), כך שבערך שני שלישים מהתוצאות האפשריות אמורות ליפול בתוכו.
          </p>
        </div>
      </div>
    </section>`;
  }

  // ---------- financials ----------
  var PERIODS = [["5y", "5 שנים"], ["3y", "3 שנים"], ["1y", "שנה (4 רבעונים)"], ["6m", "חצי שנה (2 רבעונים)"]];
  var PERIOD_NOTE = {
    "5y": "מבט מאקרו: האם המודל העסקי יציב וצומח לאורך מחזור כלכלי מלא – כולל הקורונה, האינפלציה של 2022 והריבית הגבוהה.",
    "3y": "ביצועים בסביבת הריבית והאינפלציה הנוכחית: מה קרה מאז שהכסף הפסיק להיות זול.",
    "1y": "מומנטום עסקי: ארבעת הרבעונים האחרונים, כלומר השנה האחרונה בפועל.",
    "6m": "מגמות קצרות טווח: שני הדוחות הרבעוניים האחרונים ושינויים תפעוליים."
  };
  function finRows(s, p) {
    if (p === "5y" || p === "3y") {
      var n = p === "5y" ? 5 : 3;
      return s.annual.slice(-n).map(function (r) {
        return { label: r.label, revB: r.revenue / 1000, gm: r.grossProfit != null ? r.grossProfit / r.revenue * 100 : null, om: r.opIncome != null ? r.opIncome / r.revenue * 100 : null,
          niB: r.netIncome != null ? r.netIncome / 1000 : null, eps: r.eps, ocfB: r.ocf != null ? r.ocf / 1000 : null, fcfB: r.fcf != null ? r.fcf / 1000 : null,
          cashB: r.cash != null ? r.cash / 1000 : null, debtB: r.debt != null ? r.debt / 1000 : null, netDebtB: (r.cash != null && r.debt != null) ? (r.debt - r.cash) / 1000 : null };
      });
    }
    var m = p === "1y" ? 4 : 2;
    return s.quarterly.slice(-m).map(function (q) {
      return { label: q.label, revB: q.revenue / 1000, gm: q.grossMargin, om: q.opMargin, niB: q.netIncome != null ? q.netIncome / 1000 : null, eps: q.eps };
    });
  }
  function Fin(props) {
    var s = props.s, d = props.d;
    var _p = useState("5y"), p = _p[0], setP = _p[1];
    var rows = finRows(s, p);
    var annual = p === "5y" || p === "3y";
    var f = rows[0], l = rows[rows.length - 1];
    var yrs = rows.length - 1;
    var stats;
    if (annual) {
      var revC = C.cagr(f.revB, l.revB, yrs), epsC = C.cagr(f.eps, l.eps, yrs);
      var omAvg = C.mean(rows.map(function (r) { return r.om; }));
      var fcfSum = rows.reduce(function (a, r) { return a + (r.fcfB || 0); }, 0);
      stats = [
        { l: "צמיחת הכנסות שנתית ממוצעת", v: revC == null ? "—" : pct(revC * 100, 1, true), c: cls(revC) },
        { l: "צמיחת EPS שנתית ממוצעת", v: epsC == null ? "—" : pct(epsC * 100, 1, true), c: cls(epsC) },
        { l: "שולי תפעול ממוצעים", v: pct(omAvg, 1) },
        { l: "תזרים חופשי מצטבר", v: "$" + fcfSum.toFixed(1) + "B" }
      ];
    } else {
      var ch = f.revB ? (l.revB / f.revB - 1) * 100 : null;
      stats = [
        { l: "שינוי בהכנסות (" + f.label + " → " + l.label + ")", v: pct(ch, 1, true), c: cls(ch) },
        { l: "שולי תפעול ברבעון האחרון", v: pct(l.om, 1) },
        { l: "תזרים שוטף 12 ח׳", v: bn(d.ocfTTM) },
        { l: "תזרים חופשי 12 ח׳", v: bn(d.fcfTTM) }
      ];
    }
    var fmtB = function (v) { return v == null ? "—" : "$" + v.toFixed(1) + "B"; };
    var fmtP = function (v) { return v == null ? "—" : v.toFixed(1) + "%"; };
    var fmtE = function (v) { return v == null ? "—" : "$" + v.toFixed(2); };
    var fm = { revB: fmtB, gm: fmtP, om: fmtP, niB: fmtB, eps: fmtE, ocfB: fmtB, fcfB: fmtB, cashB: fmtB, debtB: fmtB, netDebtB: fmtB };
    function chart(children, h) {
      if (!RC) return html`<${NoCharts}/>`;
      return html`<div className="chart">${e(RC.ResponsiveContainer, { width: "100%", height: h || 230 },
        e.apply(null, [RC.ComposedChart, { data: rows, margin: { top: 8, right: 4, left: 4, bottom: 0 } },
          e(RC.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
          e(RC.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true, interval: 0 }),
          e(RC.Tooltip, { content: function (pp) { return e(TT, Object.assign({}, pp, { fmt: fm })); }, cursor: { fill: "rgba(59,130,246,.07)" } }),
          e(RC.Legend, { wrapperStyle: { fontSize: 12, direction: "rtl" } })].concat(children)))}</div>`;
    }
    var yB = function (id, orient) { return e(RC ? RC.YAxis : "g", { yAxisId: id, orientation: orient, tick: AX, stroke: "#24314F", width: 48, tickFormatter: function (v) { return "$" + (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(0)) + "B"; } }); };
    var yP = function (id, orient) { return e(RC ? RC.YAxis : "g", { yAxisId: id, orientation: orient, tick: AX, stroke: "#24314F", width: 40, domain: [0, "auto"], tickFormatter: function (v) { return v + "%"; } }); };
    var yE = function (id, orient) { return e(RC ? RC.YAxis : "g", { yAxisId: id, orientation: orient, tick: AX, stroke: "#24314F", width: 44, tickFormatter: function (v) { return "$" + v; } }); };

    var c1 = RC ? chart([yB("l", "right"), yP("r", "left"),
      e(RC.Bar, { key: "b", yAxisId: "l", dataKey: "revB", name: "הכנסות", fill: "#3B82F6", radius: [4, 4, 0, 0], maxBarSize: 46, isAnimationActive: false }),
      e(RC.Line, { key: "g", yAxisId: "r", dataKey: "gm", name: "שולי גולמי", stroke: "#E9B949", strokeWidth: 2.4, dot: { r: 3 }, connectNulls: true, isAnimationActive: false }),
      e(RC.Line, { key: "o", yAxisId: "r", dataKey: "om", name: "שולי תפעולי", stroke: "#10B981", strokeWidth: 2.4, dot: { r: 3 }, isAnimationActive: false })]) : chart();
    var c2 = RC ? chart([yB("l", "right"), yE("r", "left"),
      e(RC.Bar, { key: "n", yAxisId: "l", dataKey: "niB", name: "רווח נקי", fill: "#10B981", radius: [4, 4, 0, 0], maxBarSize: 46, isAnimationActive: false }),
      e(RC.Line, { key: "e", yAxisId: "r", dataKey: "eps", name: "רווח למניה (EPS)", stroke: "#E9B949", strokeWidth: 2.6, dot: { r: 3.5 }, isAnimationActive: false })]) : chart();
    var c3 = annual && RC ? chart([yB("l", "right"),
      e(RC.Bar, { key: "o", yAxisId: "l", dataKey: "ocfB", name: "תזרים מפעילות שוטפת", fill: "#3B82F6", radius: [4, 4, 0, 0], maxBarSize: 30, isAnimationActive: false }),
      e(RC.Bar, { key: "f", yAxisId: "l", dataKey: "fcfB", name: "תזרים חופשי (FCF)", fill: "#10B981", radius: [4, 4, 0, 0], maxBarSize: 30, isAnimationActive: false })]) : null;
    var c4 = annual && RC ? chart([yB("l", "right"),
      e(RC.Bar, { key: "c", yAxisId: "l", dataKey: "cashB", name: "מזומן והשקעות קצרות", fill: "#10B981", radius: [4, 4, 0, 0], maxBarSize: 30, isAnimationActive: false }),
      e(RC.Bar, { key: "d", yAxisId: "l", dataKey: "debtB", name: "חוב פיננסי", fill: "#EF4444", radius: [4, 4, 0, 0], maxBarSize: 30, isAnimationActive: false }),
      e(RC.Line, { key: "nd", yAxisId: "l", dataKey: "netDebtB", name: "חוב נטו", stroke: "#E9B949", strokeWidth: 2.4, dot: { r: 3 }, isAnimationActive: false }),
      e(RC.ReferenceLine, { key: "z", yAxisId: "l", y: 0, stroke: "#93A0B8" })]) : null;

    var bal = s.latestBalance || {};
    function balTiles() {
      return html`<div className="tiles2">
        <div className="kpi"><div className="l">תזרים שוטף 12 ח׳</div><div className="v">${N(bn(bal.ocfTTM))}</div></div>
        <div className="kpi"><div className="l">תזרים חופשי 12 ח׳</div><div className="v up">${N(bn(bal.fcfTTM))}</div></div>
        <div className="kpi"><div className="l">מזומן והשקעות קצרות</div><div className="v">${N(bn(bal.cash))}</div></div>
        <div className="kpi"><div className="l">חוב פיננסי</div><div className="v down">${N(bn(bal.debt))}</div></div>
        <div className="kpi full"><div className="l">${d.netDebt <= 0 ? "מזומן נטו" : "חוב נטו"} · נכון ל־${dt(bal.asOf)}</div><div className=${"v " + (d.netDebt <= 0 ? "up" : "down")}>${N(bn(Math.abs(d.netDebt)))}</div></div>
      </div>`;
    }

    return html`<section className="card" id="sec-fin">
      <div className="sec-h"><div><div className="kicker">דוחות כספיים · <${Fresh} k="quarterly" extra="אחרי כל דוח"/></div><h2>ארבעה טווחי זמן, אותם מדדים</h2></div>
        <div className="seg" role="tablist">${PERIODS.map(function (x) { return html`<button key=${x[0]} role="tab" aria-selected=${p === x[0]} className=${p === x[0] ? "on" : ""} onClick=${function () { setP(x[0]); }}>${x[1]}</button>`; })}</div></div>
      <p className="fin-note">${PERIOD_NOTE[p]} ${s.annualNote && annual ? html`<span className="muted">${s.annualNote}</span>` : null}</p>
      <div className="charts">
        <div className="ch"><h3>הכנסות ושולי רווח</h3><div className="cap">עמודות: הכנסות · קווים: שולי גולמי ותפעולי</div>${c1}</div>
        <div className="ch"><h3>רווח נקי ורווח למניה</h3><div className="cap">עמודות: רווח נקי · קו: EPS</div>${c2}</div>
        <div className="ch"><h3>תזרים מזומנים: שוטף מול חופשי</h3><div className="cap">${annual ? "חופשי = שוטף פחות השקעות ברכוש קבוע" : "ברבעונים מוצגים נתוני 12 החודשים האחרונים"}</div>${annual ? c3 : balTiles()}</div>
        <div className="ch"><h3>מזומן מול חוב</h3><div className="cap">${annual ? "קו זהב מתחת לאפס = יש יותר מזומן מחוב" : "המאזן האחרון שפורסם"}</div>${annual ? c4 : html`<div style=${{ padding: "18px 6px", color: "var(--muted)", fontSize: 14 }}>המאזן מתעדכן רק בדוחות; ראו את הנתונים העדכניים מימין. לחוב נטו לאורך שנים בחרו 5 או 3 שנים.</div>`}</div>
      </div>
      <div className="stats">${stats.map(function (x, i) { return html`<div className="kpi" key=${i}><div className="l">${x.l}</div><div className=${"v " + (x.c || "")}>${N(x.v)}</div></div>`; })}</div>
      <details className="method" style=${{ marginTop: 14 }}><summary>הטבלה המלאה</summary>
        <div className="tbl-wrap"><table className="t" style=${{ marginTop: 8 }}>
          <thead><tr><th>תקופה</th><th className="n">הכנסות</th><th className="n">שולי גולמי</th><th className="n">שולי תפעולי</th><th className="n">רווח נקי</th><th className="n">EPS</th>${annual ? html`<th className="n">תזרים שוטף</th><th className="n">FCF</th><th className="n">מזומן</th><th className="n">חוב</th>` : null}</tr></thead>
          <tbody>${rows.slice().reverse().map(function (r) { return html`<tr key=${r.label}><td>${r.label}</td><td className="n">${fmtB(r.revB)}</td><td className="n">${fmtP(r.gm)}</td><td className="n">${fmtP(r.om)}</td><td className="n">${fmtB(r.niB)}</td><td className="n">${fmtE(r.eps)}</td>${annual ? html`<td className="n">${fmtB(r.ocfB)}</td><td className="n">${fmtB(r.fcfB)}</td><td className="n">${fmtB(r.cashB)}</td><td className="n">${fmtB(r.debtB)}</td>` : null}</tr>`; })}</tbody>
        </table></div>
        <p>מקור: StockAnalysis.com, שמרכזת את הנתונים מהדוחות הרשמיים לרשות ניירות הערך האמריקאית (SEC), ודוחות החברה עצמה לרבעון האחרון. <${SrcLink} id="sa_fin" sources=${s.sources}/> · <${SrcLink} id="sa_q" sources=${s.sources}/></p>
      </details>
    </section>`;
  }

  // ---------- analysts ----------
  function Analysts(props) {
    var s = props.s, d = props.d, c = s.consensus, ms = s.morningstar;
    var b = c.breakdown || {};
    var tot = (b.strongBuy || 0) + (b.buy || 0) + (b.hold || 0) + (b.sell || 0) + (b.strongSell || 0);
    var segs = [["strongBuy", "קנייה חזקה", "#34D399"], ["buy", "קנייה", "#10B981"], ["hold", "החזק", "#F59E0B"], ["sell", "מכירה", "#F87171"], ["strongSell", "מכירה חזקה", "#EF4444"]];
    var lo = Math.min(c.low, s.price), hi = Math.max(c.high, s.price);
    function pos(v) { return ((v - lo) / (hi - lo) * 100) + "%"; }
    return html`<section className="card" id="sec-analysts">
      <div className="sec-h"><div><div className="kicker">קונצנזוס</div><h2>מה חושבים בוול סטריט</h2></div><div className="hint"><${Fresh} k="weekly" extra="ומיד אחרי דוחות"/></div></div>
      <div className="cons">
        <div className="kpi" style=${{ padding: 16 }}>
          <div className="l">קונצנזוס ${N(String(c.analysts))} אנליסטים (S&P Global) · ${dt(c.asOf)}</div>
          <div style=${{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}><span className=${"pill " + ratingCls(c.rating)} style=${{ fontSize: 15 }}>${RATING_HE[c.rating] || c.rating}</span><span style=${{ fontSize: 26, fontWeight: 800 }}>${N(usd(c.avg))}</span><span className=${cls(c.avg - s.price)}>${N(pct((c.avg / s.price - 1) * 100, 1, true))}</span></div>
          <div className="dist" aria-label="התפלגות המלצות">${segs.map(function (x) { var v = b[x[0]] || 0; return v ? html`<div key=${x[0]} title=${x[1] + ": " + v} style=${{ width: (v / tot * 100) + "%", background: x[2] }}></div>` : null; })}</div>
          <div style=${{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5 }} className="muted">${segs.map(function (x) { return html`<span key=${x[0]}><span style=${{ color: x[2] }}>■</span> ${x[1]} ${N(String(b[x[0]] || 0))}</span>`; })}</div>
        </div>
        <div className="kpi" style=${{ padding: 16 }}>
          <div className="l">טווח מחירי היעד של כל האנליסטים מול המחיר היום <${SrcLink} id=${c.source} sources=${s.sources}/></div>
          <div className="range">
            <div className="ln"></div>
            ${[["נמוך", c.low], ["ממוצע", c.avg], ["גבוה", c.high]].map(function (x) { return html`<div key=${x[0]} className="mk" style=${{ left: pos(x[1]) }}><span>${x[0]} ${usd(x[1], 0)}</span></div>`; })}
            <div className="mk cur" style=${{ left: pos(s.price) }}><span>היום ${usd(s.price, 0)}</span></div>
          </div>
        </div>
      </div>
      <div className="banks">
        ${s.banks.map(function (k, i) {
          var up = k.target ? (k.target / s.price - 1) * 100 : null;
          return html`<div className="bk" key=${i}>
            <div style=${{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span className="firm">${k.firm}</span><span className=${"pill " + ratingCls(k.rating)}>${RATING_HE[k.rating] || k.rating}</span></div>
            <div><span className="tgt">${k.target ? N(usd(k.target, 0)) : html`<span className="muted" style=${{ fontSize: 15 }}>ללא יעד בפרסום</span>`}</span> ${up != null ? html`<span className=${cls(up)} style=${{ fontSize: 14 }}>${N(pct(up, 1, true))}</span>` : null}</div>
            <div className="note">${k.note}</div>
            <div className="when">${k.action} · ${dt(k.date)} · <${SrcLink} id=${k.source} sources=${s.sources}/></div>
          </div>`;
        })}
        <div className="bk" style=${{ borderColor: "rgba(233,185,73,.4)" }}>
          <div style=${{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span className="firm">Morningstar</span><span className="stars" aria-label=${ms.stars + " כוכבים"}>${"★".repeat(ms.stars)}<span style=${{ color: "#3a4767" }}>${"★".repeat(5 - ms.stars)}</span></span></div>
          <div><span className="tgt">${N(usd(ms.fv, 0))}</span> <span className=${cls(ms.fv - s.price)} style=${{ fontSize: 14 }}>${N(pct((ms.fv / s.price - 1) * 100, 1, true))}</span> <span className="muted" style=${{ fontSize: 12 }}>שווי הוגן</span></div>
          <div style=${{ fontSize: 13 }}>חפיר: <b>${MOAT_HE[ms.moat] || ms.moat}</b> · אי־ודאות: <b>${UNC_HE[ms.uncertainty] || ms.uncertainty}</b></div>
          <div className="note">${ms.note}</div>
          <div className="when">מדד השקעות הערך · ${dt(ms.asOf)} · <${SrcLink} id=${ms.source} sources=${s.sources}/></div>
        </div>
      </div>
      <p className="method">הדירוגים של הבנקים נלקחים מהפרסום האחרון של כל בית השקעות שמופיע ב־MarketBeat או ב־StockAnalysis. כשבנק לא פרסם מחיר יעד, הוא לא נכלל בממוצע. ברקשייר האת׳אוויי לא מפרסמת דירוגים, ולכן במקומה מוצג דירוג Morningstar – הגוף המוביל בניתוח בשיטת השקעות הערך (חפיר כלכלי ומרווח ביטחון).</p>
    </section>`;
  }

  // ---------- macro ----------
  function Macro(props) {
    var M = props.macro;
    return html`<section className="card" id="sec-macro">
      <div className="sec-h"><div><div className="kicker">תמונת מאקרו</div><h2>מה קורה בעולם עכשיו</h2></div><div className="hint"><${Fresh} k="event" extra=${"נכון ל־" + dt(M.asOf)}/></div></div>
      <div className="macro">${M.items.map(function (x, i) { return html`<div className="kpi" key=${i} style=${{ padding: 14 }}><div className="l">${x.label}</div><div className="v" style=${{ fontSize: 22 }}>${x.value}</div><div style=${{ fontSize: 13.5, marginTop: 4 }}>${x.note} ${x.source ? html`<${SrcLink} id=${x.source} sources=${M.sources}/>` : null}</div></div>`; })}</div>
    </section>`;
  }

  // ---------- learning ----------
  function Learn(props) {
    var s = props.s, d = props.d;
    var _p = useState(String(s.price)), pr = _p[0], setPr = _p[1];
    var _e = useState(String(s.epsTTM)), ep = _e[0], setEp = _e[1];
    useEffect(function () { setPr(String(s.price)); setEp(String(s.epsTTM)); }, [s.ticker]);
    var pe = parseFloat(pr) / parseFloat(ep);
    var ey = 100 / pe;
    return html`<section className="card" id="sec-learn">
      <div className="sec-h"><div><div className="kicker">בית ספר להשקעות</div><h2>מה באמת מזיז מניות – בגובה העיניים</h2></div></div>
      <div className="learn">
        <div className="lc">
          <h3>למה מניה עולה או יורדת?</h3>
          <h4>היצע, ביקוש ופסיכולוגיה</h4>
          <p>מחיר מניה הוא פשוט המחיר שבו קונה ומוכר הסכימו לסחור ברגע האחרון. כשיש יותר קונים נלהבים ממוכרים – המחיר עולה. בטווח הקצר מה שמזיז את הקונים והמוכרים הוא בעיקר רגש: פחד, חמדנות, כותרות. בטווח הארוך המחיר נמשך כמו מגנט לדבר אחד – הרווחים שהחברה מייצרת. בנג׳מין גרהם, המורה של באפט, תיאר את זה כך: בטווח קצר השוק הוא מכונת הצבעה, ובטווח ארוך הוא מאזניים ששוקלים ערך.</p>
          <h4>הכאת תחזיות מול הנחיות לעתיד</h4>
          <p>בכל רבעון החברה מדווחת תוצאות, והשוק משווה אותן לקונצנזוס – הממוצע של תחזיות האנליסטים. "הכאה" (Beat) היא תוצאה טובה מהצפוי. אבל המשקיעים קונים את העתיד, ולכן ההנחיה (Guidance) – מה ההנהלה צופה לרבעונים הבאים – חשובה לא פחות, ולפעמים יותר.</p>
          <div className="example"><b>דוגמה חיה:</b> ב־2 בנובמבר 2026 אפל הכתה את התחזיות עם רווח למניה של 2.10$ מול צפי של 1.99$. ובכל זאת למחרת המניה ירדה 1.9%, כי ההנהלה הנחתה לשולי רווח גולמי נמוכים יותר ברבעון החגים בגלל עליית מחירי הזיכרון.</div>
          <h4>אירועים בעולם שחובה לעקוב אחריהם</h4>
          <ul>
            <li><b>החלטות הריבית של הפד:</b> ריבית גבוהה מייקרת אשראי ומורידה את הערך של רווחים עתידיים. הכי רגישות: מניות צמיחה יקרות. כרגע: 3.75%–4.00% אחרי העלאה בספטמבר.</li>
            <li><b>אינפלציה (מדד CPI):</b> אינפלציה גבוהה דוחפת את הפד להעלות ריבית ושוחקת את כוח הקנייה של הצרכנים. ספטמבר 2026: 3.7%.</li>
            <li><b>מתיחות גיאופוליטית:</b> מלחמות, סנקציות ומגבלות סחר – למשל מגבלות על יצוא שבבים לסין, שמשפיעות ישירות על אנבידיה.</li>
            <li><b>שרשראות אספקה:</b> מחסור ברכיב אחד יכול לעצור קו ייצור שלם. השנה מחירי שבבי הזיכרון זינקו ופגעו בשוליים של אפל ואנבידיה.</li>
            <li><b>אנרגיה וסחורות:</b> נפט, גז, נחושת וסוכר הם עלויות. עליית מחירי האנרגיה ב־2026 היא הגורם המרכזי לאינפלציה הנוכחית.</li>
          </ul>
        </div>
        <div className="lc">
          <h3>רווח למניה (EPS)</h3>
          <div className="formula">EPS = Net Income / Shares Outstanding</div>
          <p>הרווח הנקי של החברה מחולק במספר המניות. זה החלק שלך ברווח על כל מניה שאתה מחזיק. זו יחידת המדידה הקריטית כי היא מנטרלת את גודל החברה: אפשר להשוות בין שנים, ולראות אם הרווח באמת "שלך" גדל – גם כשהחברה מנפיקה או קונה מניות.</p>
          <div className="example">${s.nameHe}: רווח למניה ב־12 החודשים האחרונים ${N(usd(s.epsTTM))}.</div>
          <h4>בסיסי מול מדולל</h4>
          <p><b>EPS בסיסי</b> מחלק במניות שקיימות היום. <b>EPS מדולל</b> מחלק גם במניות שעלולות להיווצר – אופציות לעובדים, אג״ח להמרה וכתבי אופציה. המדולל תמיד שווה לבסיסי או נמוך ממנו, והוא המדד השמרני שכדאי להסתכל עליו. פער גדול ביניהם מעיד על הרבה דילול בדרך.</p>
          <h4>שימו לב</h4>
          <ul>
            <li>רכישה עצמית של מניות מקטינה את מספר המניות ומעלה את ה־EPS גם בלי שהעסק השתפר.</li>
            <li>EPS "מתואם" (Non-GAAP) מוציא הוצאות חד־פעמיות. הוא שימושי, אבל החברה בוחרת מה להוציא.</li>
          </ul>
          <h3 style=${{ marginTop: 18 }}>מכפיל רווח (P/E)</h3>
          <div className="formula">P/E = Price / EPS</div>
          <p>כמה דולרים המשקיעים משלמים על כל דולר רווח שנתי. מכפיל 25 אומר שבקצב הרווח הנוכחי, ייקח 25 שנה "להחזיר" את מחיר המניה. ההפך של המכפיל – תשואת הרווח – מאפשר להשוות לריבית: מכפיל 25 שווה לתשואת רווח של 4%, בערך כמו הריבית של הפד היום.</p>
          <h4>מתי מכפיל גבוה הוא חוזקה ומתי בועה?</h4>
          <p><b>חוזקה</b> – כשהרווחים צומחים מהר מספיק כדי "להוריד" את המכפיל בעצמם. אנבידיה נסחרת במכפיל 26 על הרווח של השנה האחרונה, אבל רק סביב 17 על הרווח הצפוי, כי הרווח צפוי לגדול מאוד. <b>סימן אזהרה</b> – כשהמכפיל גבוה מאוד והרווחים לא צומחים, כך שכל המחיר נשען על הבטחות. טסלה נסחרת במכפיל של מאות על רווח שירד שלוש שנים ברציפות.</p>
          <div className="calc">
            <label htmlFor="calc-p">מחיר מניה ($)<input id="calc-p" type="number" step="0.01" value=${pr} onChange=${function (ev) { setPr(ev.target.value); }}/></label>
            <label htmlFor="calc-e">רווח למניה שנתי ($)<input id="calc-e" type="number" step="0.01" value=${ep} onChange=${function (ev) { setEp(ev.target.value); }}/></label>
            <div className="kpi full"><div className="l">מחשבון: המכפיל ותשואת הרווח</div><div className="v">${isFinite(pe) && pe > 0 ? html`P/E ${N(pe.toFixed(1))} · תשואת רווח ${N(ey.toFixed(2) + "%")}` : "הזינו מחיר ורווח חיובי"}</div></div>
          </div>
        </div>
      </div>
    </section>`;
  }

  // ---------- sources ----------
  function Sources(props) {
    var s = props.s, M = props.macro;
    return html`<section className="card" id="sec-sources">
      <div className="sec-h"><div><div className="kicker">שקיפות</div><h2>מאיפה המספרים</h2></div></div>
      <div className="learn">
        <div>
          <h3 style=${{ fontSize: 16 }}>מקורות עבור ${s.nameHe}</h3>
          <ol className="src-list">${s.sources.map(function (x) { return html`<li key=${x.id}><a href=${x.url} target="_blank" rel="noopener">${x.title}</a></li>`; })}</ol>
          <h3 style=${{ fontSize: 16, marginTop: 14 }}>מאקרו</h3>
          <ol className="src-list">${M.sources.map(function (x) { return html`<li key=${x.id}><a href=${x.url} target="_blank" rel="noopener">${x.title}</a></li>`; })}</ol>
        </div>
        <div className="method" style=${{ marginTop: 0 }}>
          <p><b style=${{ color: "var(--text)" }}>סדר העדיפויות של המקורות:</b> (1) דוחות החברה ל־SEC והודעות התוצאות הרשמיות; (2) StockAnalysis לנתונים הכספיים ההיסטוריים ולקונצנזוס של S&P Global; (3) MarketBeat להיסטוריית ההמלצות של כל בנק ולמחיר הסגירה; (4) Morningstar לשווי הוגן, חפיר ואי־ודאות; (5) הפד והלשכה לסטטיסטיקה של העבודה בארה״ב (BLS) לנתוני המאקרו.</p>
          <p><b style=${{ color: "var(--text)" }}>עדכון:</b> בכל בוקר שאחרי יום מסחר בוול סטריט (ג׳–שבת, בסביבות 10:00) Claude עובר על המקורות, מעדכן מחירים, דוחות שפורסמו, שינויי דירוג ושווי הוגן, ומוסיף מניות שביקשת. המחירים הם מחירי הסגירה האחרונים בוול סטריט, ולא ציטוט בזמן אמת.</p>
        </div>
      </div>
      <div className="disc">
        המידע בדף נועד ללמידה ולמעקב ואינו ייעוץ השקעות, המלצה אישית או תחליף לייעוץ של בעל רישיון שמכיר את המצב הכלכלי שלך. הציון, ההמלצה והתחזיות הם תוצאה של מודל שקוף ופשוט המבוסס על המקורות שלמעלה; הם עלולים לטעות, ומחירי מניות יכולים לרדת מתחת לכל תרחיש שמוצג. "96% דיוק" הוא שם המותג של הדף, ולא מדידה סטטיסטית של דיוק התחזיות.
      </div>
    </section>`;
  }

  // ---------- indices ----------
  function idxOutlook(x) {
    var L = x.level, vol = (x.vol || 16) / 100, b6, b12, b24, how;
    if (x.analysis) {
      b12 = x.analysis.fair; b6 = L + (b12 - L) / 2; b24 = b12 * (1 + Math.min(20, (x.analysis.eps27 / x.analysis.eps26 - 1) * 100) / 100);
      how = "בסיס לשנה = ממוצע יעדי גולדמן (8,700) ומורגן סטנלי (8,300), השווי הנגזר מ־Morningstar ורווח 2027 כפול המכפיל הממוצע של 10 שנים; שנתיים = צמיחת רווח של 15.6% במכפיל קבוע.";
    } else if (C.idxAnalyze(x) && C.idxAnalyze(x).known >= 2) {
      var M = C.idxAnalyze(x);
      b12 = M.fair; b6 = L + (b12 - L) / 2; b24 = M.fair * (1 + M.g);
      how = "בסיס לשנה = השווי לפי המודל (" + lvl(M.fair) + "); שנתיים = עוד שנה של התשואה הממוצעת (" + (M.g * 100).toFixed(1) + "%).";
    } else if (x.ret5y != null) {
      var g = Math.min(0.10, Math.pow(1 + x.ret5y / 100, 1 / 5) - 1);
      b6 = L * Math.pow(1 + g, 0.5); b12 = L * (1 + g); b24 = L * Math.pow(1 + g, 2);
      how = "בסיס = המשך התשואה השנתית הממוצעת של 5 השנים האחרונות (" + (g * 100).toFixed(1) + "% בשנה, עם תקרה של 10%).";
    } else return null;
    function band(b, y) { var w = vol * Math.sqrt(y); return { bear: b * (1 - w), base: b, bull: b * (1 + w) }; }
    return { rows: [{ label: "היום", bear: L, base: L, bull: L }, Object.assign({ label: "חצי שנה" }, band(b6, 0.5)), Object.assign({ label: "שנה" }, band(b12, 1)), Object.assign({ label: "שנתיים" }, band(b24, 2))], how: how + " הטווח: סטיית תקן אחת לפי תנודתיות שנתית טיפוסית של " + Math.round(vol * 100) + "%." };
  }
  function lvl(v) { return v == null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 }); }

  var IREC = { sb: ["קנייה חזקה", "c-sb"], buy: ["קנייה", "c-b"], hold: ["החזק", "c-h"], sell: ["מכירה", "c-s"] };
  function IndicesStrip(props) {
    var list = props.indices || [];
    if (!list.length) return null;
    return html`<section className="card" id="sec-indices">
      <div className="sec-h"><div><div className="kicker">שווקים</div><h2>המדדים המובילים</h2></div><div className="hint">לחצו על מדד לניתוח מלא</div></div>
      ${[["ארה\"ב", "וול סטריט"], ["ישראל", "תל אביב"], [null, "עולם"]].map(function (G) {
        var sub = list.filter(function (x) { return G[0] ? x.region === G[0] : (x.region !== "ארה\"ב" && x.region !== "ישראל"); });
        return sub.length ? html`<div key=${G[1]}><h3 className="idx-g">${G[1]}</h3><div className="strip">${sub.map(function (x) {
        var M = C.idxAnalyze(x), R = x.analysis ? x.analysis.rec : M && M.rec;
        return html`<button key=${x.id} className=${"tick" + (props.cur === "IDX:" + x.id ? " on" : "")} onClick=${function () { props.onPick("IDX:" + x.id); }}>
          <div className="row"><span style=${{ fontWeight: 700, fontSize: 14 }}>${x.nameHe}</span><span className="muted" style=${{ fontSize: 11 }}>${x.region}</span></div>
          <div className="row"><span className="px">${N(lvl(x.level))}</span>${N(pct(x.chg, 2, true), cls(x.chg))}</div>
          <div className="row" style=${{ fontSize: 12 }}><span className="muted">מתחילת השנה</span>${x.ytd != null ? N(pct(x.ytd, 1, true), cls(x.ytd)) : html`<span className="muted">—</span>`}</div>
          ${R ? html`<div className="row"><span className=${"pill " + IREC[R][1]}>${IREC[R][0]}</span></div>` : null}
        </button>`;
      })}</div></div>` : null; })}
      <${FxCards} fx=${props.fx} onPick=${props.onPick}/>
    </section>`;
  }

  function IndexView(props) {
    var x = props.x, A = x.analysis, o = idxOutlook(x);
    var src = (x.sources || []).map(function (a, i) { return { id: "s" + i, title: a[0], url: a[1] }; });
    var kp = [
      { l: "שינוי יומי", v: pct(x.chg, 2, true), c: cls(x.chg) },
      { l: "מתחילת השנה", v: pct(x.ytd, 1, true), c: cls(x.ytd) },
      { l: "תשואה ל־5 שנים", v: pct(x.ret5y, 1, true), c: cls(x.ret5y) },
      { l: "טווח 52 שבועות", v: x.lo52 ? lvl(Math.round(x.lo52)) + "–" + lvl(Math.round(x.hi52)) : "—" },
      { l: "מכפיל רווח עתידי", v: x.fwdPE ? x.fwdPE.toFixed(1) : "—" },
      { l: "איך משקיעים", v: x.etf, small: true }
    ];
    var REC = { sb: ["קנייה חזקה", "c-sb"], buy: ["קנייה", "c-b"], hold: ["החזק", "c-h"], sell: ["מכירה", "c-s"] };
    var M = C.idxAnalyze(x);
    var ann = (x.annual || []).filter(function (a) { return a[1] != null; }).map(function (a) { return { label: a[0], r: a[1] }; });
    var chartO = null, chartA = null;
    if (RC && o) {
      var rows = o.rows.map(function (r) { return { label: r.label, base: Math.round(r.base), bear: Math.round(r.bear), bull: Math.round(r.bull), range: [Math.round(r.bear), Math.round(r.bull)] }; });
      chartO = e(RC.ResponsiveContainer, { width: "100%", height: 260 }, e(RC.ComposedChart, { data: rows, margin: { top: 12, right: 12, left: 4, bottom: 4 } },
        e(RC.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
        e(RC.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true }),
        e(RC.YAxis, { tick: AX, stroke: "#24314F", orientation: "right", width: 62, domain: ["auto", "auto"], tickFormatter: function (v) { return lvl(Math.round(v)); } }),
        e(RC.Tooltip, { content: function (pp) { return e(TT, Object.assign({}, pp, { fmt: { base: lvl, bear: lvl, bull: lvl, range: lvl } })); } }),
        e(RC.Area, { dataKey: "range", name: "טווח סביר", stroke: "none", fill: "#3B82F6", fillOpacity: 0.16, isAnimationActive: false }),
        e(RC.Line, { dataKey: "bull", name: "אופטימי", stroke: "#10B981", strokeDasharray: "5 4", dot: false, isAnimationActive: false }),
        e(RC.Line, { dataKey: "bear", name: "פסימי", stroke: "#EF4444", strokeDasharray: "5 4", dot: false, isAnimationActive: false }),
        e(RC.Line, { dataKey: "base", name: "בסיס", stroke: "#E9B949", strokeWidth: 3, dot: { r: 4, fill: "#E9B949" }, isAnimationActive: false })));
    }
    if (RC && ann.length) {
      chartA = e(RC.ResponsiveContainer, { width: "100%", height: 220 }, e(RC.BarChart, { data: ann, margin: { top: 12, right: 8, left: 4, bottom: 0 } },
        e(RC.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
        e(RC.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true }),
        e(RC.YAxis, { tick: AX, stroke: "#24314F", orientation: "right", width: 44, tickFormatter: function (v) { return v + "%"; } }),
        e(RC.Tooltip, { content: function (pp) { return e(TT, Object.assign({}, pp, { fmt: { r: function (v) { return pct(v, 1, true); } } })); }, cursor: { fill: "rgba(59,130,246,.07)" } }),
        e(RC.ReferenceLine, { y: 0, stroke: "#93A0B8" }),
        e(RC.Bar, { dataKey: "r", name: "תשואה שנתית", radius: [4, 4, 0, 0], maxBarSize: 46, isAnimationActive: false }, ann.map(function (a, i) { return e(RC.Cell, { key: i, fill: a.r < 0 ? "#EF4444" : "#3B82F6" }); }))));
    }
    return html`<div>
      <section className="card">
        <div className="hero">
          <div>
            <div className="kicker">מדד · ${x.region}</div>
            <div className="nm"><h2>${x.nameHe}</h2><span className="tk">${x.name}</span></div>
            <div className="muted" style=${{ fontSize: 13.5 }}>${x.desc}</div>
            <div className="price">${N(lvl(x.level))}</div>
            <div className="muted" style=${{ fontSize: 13 }}>נעילה ${dt(x.date)}</div>
            ${!A && M && M.rec ? html`<div style=${{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}><span className=${"pill " + REC[M.rec][1]}>${REC[M.rec][0]}</span><span className="pill" style=${{ color: "#8BB6FF" }}>ציון ${M.score}/100</span><span className=${"pill " + (M.up >= 0 ? "c-b" : "c-s")}>פוטנציאל ${N(pct(M.up, 1, true))}</span></div>` : null}
            ${A ? html`<div style=${{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}><span className=${"pill " + REC[A.rec][1]}>${REC[A.rec][0]}</span><span className="pill" style=${{ color: "#8BB6FF" }}>ציון ${A.score}/100</span><span className="pill c-b">פוטנציאל ${N(pct((A.fair / x.level - 1) * 100, 1, true))}</span></div>` : null}
          </div>
          <div className="kpis">${kp.map(function (k, i) { return html`<div className="kpi" key=${i}><div className="l">${k.l}</div><div className=${"v " + (k.c || "")} style=${k.small ? { fontSize: 14 } : null}>${k.small ? k.v : N(k.v)}</div></div>`; })}</div>
        </div>
      </section>
      ${A ? html`<section className="card">
        <div className="sec-h"><div><div className="kicker">פסק הדין</div><h2>האם כדאי להשקיע ב${x.nameHe}?</h2></div></div>
        <div className="verdict">
          <div className="rec">
            <div className=${"tag " + REC[A.rec][1]}>${REC[A.rec][0]}</div>
            <div className="entry"><div className="muted" style=${{ fontSize: 12.5 }}>רמת כניסה מומלצת (מרווח ביטחון 20%)</div><div style=${{ fontSize: 26, fontWeight: 800 }}>${N(lvl(A.entry))}</div></div>
            <div className="muted" style=${{ fontSize: 12.5 }}>שווי משוקלל לשנה: ${N(lvl(A.fair))} · רווח למניה 2026: ${N(usd(A.eps26))} · 2027: ${N(usd(A.eps27))}</div>
            <div className="bars">${A.targets.map(function (t, i) { var u = (t[2] / x.level - 1) * 100; return html`<div className="bar-row" key=${i} style=${{ gridTemplateColumns: "1fr auto auto" }}><span>${t[0]} <span className="muted">(${t[1]})</span></span><span className="num">${lvl(t[2])}</span><span className=${"num " + cls(u)}>${pct(u, 1, true)}</span></div>`; })}
              <div style=${{ fontSize: 13 }}><b>Morningstar:</b> ${A.morningstar}</div></div>
          </div>
          <div className="pc">
            <div className="col"><h3 className="up">למה כן</h3><ol>${A.pros.map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ol></div>
            <div className="col risk"><h3 className="down">למה לא</h3><ol>${A.risks.map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ol></div>
          </div>
        </div>
      </section>` : null}
      ${M ? e(IdxModel, { x: x, M: M, A: A }) : null}
      <section className="card">
        <div className="sec-h"><div><div className="kicker">צפי</div><h2>חצי שנה, שנה, שנתיים</h2></div></div>
        ${o ? html`<div className="ol-grid"><div className="chart">${chartO || html`<${NoCharts}/>`}</div>
          <div className="tbl-wrap"><table className="t"><thead><tr><th>טווח</th><th className="n">פסימי</th><th className="n">בסיס</th><th className="n">אופטימי</th></tr></thead>
          <tbody>${o.rows.slice(1).map(function (r) { return html`<tr key=${r.label}><td>${r.label}</td><td className="n down">${lvl(Math.round(r.bear))}</td><td className="n" style=${{ fontWeight: 700 }}>${lvl(Math.round(r.base))}</td><td className="n up">${lvl(Math.round(r.bull))}</td></tr>`; })}</tbody></table>
          <p className="method">${o.how}</p></div></div>` : html`<p className="muted">אין עדיין מספיק נתונים היסטוריים זמינים לבניית תחזית למדד הזה; הם יתווספו בעדכון היומי. לניתוח מיידי השתמשו בכפתור שלמטה.</p>`}
      </section>
      ${ann.length ? html`<section className="card"><div className="sec-h"><div><div className="kicker">ביצועים</div><h2>תשואה שנתית</h2></div></div><div className="chart">${chartA || html`<${NoCharts}/>`}</div></section>` : null}
      <${AiAnalysis} key=${"ai-" + x.id} query=${x.name + " index (" + x.nameHe + ")"} isIndex=${true} db=${props.db} sample=${props.sample} label=${"ניתוח מעמיק של " + x.nameHe}/>
      <section className="card"><div className="sec-h"><div><div className="kicker">שקיפות</div><h2>מקורות</h2></div></div>
        <ol className="src-list">${src.map(function (z) { return html`<li key=${z.id}><a href=${z.url} target="_blank" rel="noopener">${z.title}</a></li>`; })}</ol></section>
    </div>`;
  }

  // ---------- AI analysis for anything not tracked ----------
  function aiPrompt(q, isIndex) {
    return [
      "אתה אנליסט מניות בכיר בוול סטריט. המשתמש חיפש: \"" + q + "\".",
      "זהה את " + (isIndex ? "המדד" : "החברה או המניה הנסחרת (בכל בורסה בעולם)") + " שהמשתמש התכוון אליו/ה. אם זה לא חד־משמעי, בחר את הסביר ביותר וציין חלופות.",
      "אין לך נתוני שוק חיים. השתמש רק בידע שאתה בטוח בו (דוחות שנתיים, נתונים היסטוריים) עד תאריך הידע שלך, וציין אותו. אל תמציא מספרים: כשאינך בטוח, כתוב null.",
      "החזר JSON בלבד, בלי טקסט נוסף, במבנה:",
      '{"found":true,"name":"","nameHe":"","ticker":"","exchange":"","sector":"","currency":"USD","about":"2 משפטים בעברית","knowledgeAsOf":"YYYY-MM",',
      '"lastKnownPrice":{"value":0,"asOf":"YYYY-MM"} או null,',
      '"annual":[{"year":"2021","revenueB":0,"netIncomeB":0,"eps":0}] (עד 5 שנים אחרונות שאתה בטוח בהן, במיליארדים במטבע currency; למדד: revenueB ו־netIncomeB = null ו־eps = רווח למניה של המדד אם ידוע),',
      '"pe":null,"moat":"Wide|Narrow|None","recommendation":"קנייה חזקה|קנייה|החזק|מכירה","score":0,"scoreWhy":"משפט בעברית",',
      '"fairValue":{"low":null,"high":null,"basis":"משפט בעברית"},',
      '"outlook":{"m6":"טווח באחוזים + משפט","y1":"...","y2":"..."},',
      '"analysts":"סיכום קונצנזוס וול סטריט הידוע לך, כולל בתי השקעות (גולדמן, מורגן סטנלי, ג׳יי פי מורגן, בנק אוף אמריקה, Morningstar) אם ידוע",',
      '"pros":["3 סיבות בעברית"],"risks":["3 סיכונים בעברית"],"verify":["3 דברים שהמשתמש חייב לבדוק בנתונים עדכניים"],"sources":["שמות המקורות הציבוריים שעליהם מבוססים המספרים, למשל 10-K 2025"],"alternatives":[]}',
      "אם לא הצלחת לזהות: {\"found\":false,\"alternatives\":[\"...\"]}."
    ].join("\n");
  }
  function AiAnalysis(props) {
    var _s = useState("idle"), st = _s[0], setSt = _s[1];
    var _r = useState(null), res = _r[0], setRes = _r[1];
    var _q = useState("idle"), qs = _q[0], setQs = _q[1];
    var abortRef = useRef(null);
    useEffect(function () { return function () { if (abortRef.current) abortRef.current.abort(); }; }, []);
    function run() {
      if (!props.sample || st === "loading") return;
      setSt("loading"); setRes(null);
      var ac = new AbortController(); abortRef.current = ac;
      var p = aiPrompt(props.query, props.isIndex);
      var call = typeof props.sample.json === "function" ? props.sample.json(p, { modelTier: "complex", signal: ac.signal }) : props.sample(p, { modelTier: "complex", signal: ac.signal }).then(function (r) { var t = r.text || ""; var m = t.match(/\{[\s\S]*\}/); return JSON.parse(m ? m[0] : t); });
      Promise.resolve(call).then(function (v) { setRes(v); setSt(v && v.found === false ? "notfound" : "done"); }, function (err) {
        setSt(err && err.code === "rate_limited" ? "rate" : err && err.code === "not_granted" ? "nogrant" : "error");
      });
    }
    function queue(t) {
      if (!props.db || !t) return;
      setQs("saving");
      props.db.doc("requests/" + t).set({ ticker: t, requestedAt: new Date().toISOString(), status: "pending" }).then(function () { setQs("done"); }, function () { setQs("error"); });
    }
    var r = res || {};
    var REC = { "קנייה חזקה": "c-sb", "קנייה": "c-b", "החזק": "c-h", "מכירה": "c-s" };
    var ann = (r.annual || []).filter(function (a) { return a && (a.revenueB != null || a.netIncomeB != null || a.eps != null); });
    var tk = (r.ticker || "").toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
    return html`<section className="card" style=${{ borderColor: "rgba(233,185,73,.35)" }}>
      <div className="sec-h"><div><div className="kicker">ניתוח AI · כל מניה, חברה או מדד</div><h2>${props.label || ("ניתוח של \"" + props.query + "\"")}</h2></div>
        <div className="hint">Claude מנתח לפי דוחות וידע ציבורי עד תאריך הידע שלו – ללא מחיר בזמן אמת</div></div>
      ${st === "idle" ? html`<div style=${{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        ${props.sample ? html`<button className="btn gold" onClick=${run}>נתח עכשיו</button>` : html`<span>ניתוח מיידי רץ דרך Claude. <a href=${CLAUDE_URL} target="_blank" rel="noopener">פתחו את הגרסה ב־Claude ↗</a> או בקשו בצ׳אט: "נתח לי את ${props.query}".</span>`}
        ${props.onClose ? html`<button className="btn ghost" onClick=${props.onClose}>סגור</button>` : null}</div>` : null}
      ${st === "loading" ? html`<p className="muted">Claude מנתח… זה לוקח בדרך כלל 20–60 שניות.</p>` : null}
      ${st === "rate" ? html`<p className="down">יותר מדי בקשות ברצף. נסו שוב בעוד דקה.</p>` : null}
      ${st === "nogrant" ? html`<p className="down">הניתוח לא אושר בדף הזה. אפשר לבקש אותו בצ׳אט.</p>` : null}
      ${st === "error" ? html`<p className="down">הניתוח נכשל. <button className="btn ghost" onClick=${run}>נסו שוב</button></p>` : null}
      ${st === "notfound" ? html`<p>לא זוהתה מניה או מדד בשם הזה. ${(r.alternatives || []).length ? "אולי התכוונת ל: " + r.alternatives.join(", ") : "נסו סימול באנגלית."}</p>` : null}
      ${st === "done" ? html`<div style=${{ display: "grid", gap: 14 }}>
        <div style=${{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><div style=${{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900 }}>${r.nameHe || r.name}</div>
            <div className="muted" style=${{ fontSize: 13 }}>${[r.name, r.exchange && (r.exchange + ": " + r.ticker), r.sector].filter(Boolean).join(" · ")}</div></div>
          <div style=${{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            ${r.recommendation ? html`<span className=${"pill " + (REC[r.recommendation] || "c-h")}>${r.recommendation}</span>` : null}
            ${r.score != null ? html`<span className="pill" style=${{ color: "#8BB6FF" }}>ציון ${r.score}/100</span>` : null}
            <span className="pill" style=${{ color: "var(--amber)" }}>ידע עד ${r.knowledgeAsOf || "?"} · ללא מחיר חי</span>
          </div>
        </div>
        <p style=${{ margin: 0, maxWidth: "75ch" }}>${r.about}</p>
        <div className="kpis">
          <div className="kpi"><div className="l">מחיר אחרון הידוע ל־AI</div><div className="v">${r.lastKnownPrice && r.lastKnownPrice.value != null ? N(r.lastKnownPrice.value + " " + (r.currency || "")) : "—"}</div><div className="s">${r.lastKnownPrice ? "נכון ל־" + r.lastKnownPrice.asOf : "בדקו מחיר עדכני"}</div></div>
          <div className="kpi"><div className="l">מכפיל רווח</div><div className="v">${r.pe != null ? N(Number(r.pe).toFixed(1)) : "—"}</div></div>
          <div className="kpi"><div className="l">חפיר כלכלי</div><div className="v" style=${{ fontSize: 16 }}>${MOAT_HE[r.moat] || r.moat || "—"}</div></div>
          <div className="kpi"><div className="l">טווח שווי הוגן</div><div className="v" style=${{ fontSize: 16 }}>${r.fairValue && r.fairValue.low != null ? N(r.fairValue.low + "–" + r.fairValue.high) : "—"}</div><div className="s">${r.fairValue && r.fairValue.basis || ""}</div></div>
        </div>
        ${r.scoreWhy ? html`<p className="muted" style=${{ margin: 0, fontSize: 13.5 }}>${r.scoreWhy}</p>` : null}
        ${ann.length ? html`<div className="tbl-wrap"><table className="t"><thead><tr><th>שנה</th><th className="n">הכנסות (מיליארד ${r.currency || ""})</th><th className="n">רווח נקי</th><th className="n">EPS</th></tr></thead>
          <tbody>${ann.map(function (a, i) { return html`<tr key=${i}><td>${a.year}</td><td className="n">${a.revenueB != null ? a.revenueB : "—"}</td><td className="n">${a.netIncomeB != null ? a.netIncomeB : "—"}</td><td className="n">${a.eps != null ? a.eps : "—"}</td></tr>`; })}</tbody></table></div>` : null}
        ${r.outlook ? html`<div className="kpis">${[["חצי שנה", r.outlook.m6], ["שנה", r.outlook.y1], ["שנתיים", r.outlook.y2]].map(function (x2) { return html`<div className="kpi" key=${x2[0]}><div className="l">צפי ל${x2[0]}</div><div style=${{ fontSize: 14 }}>${x2[1] || "—"}</div></div>`; })}</div>` : null}
        ${r.analysts ? html`<div className="kpi"><div className="l">מה חושבים בוול סטריט (לפי הידוע ל־AI)</div><div style=${{ fontSize: 14 }}>${r.analysts}</div></div>` : null}
        <div className="pc">
          <div className="col"><h3 className="up">למה כן</h3><ol>${(r.pros || []).map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ol></div>
          <div className="col risk"><h3 className="down">למה לא</h3><ol>${(r.risks || []).map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ol></div>
        </div>
        ${(r.verify || []).length ? html`<div className="entry"><b>חובה לבדוק בנתונים עדכניים לפני החלטה:</b><ul style=${{ margin: "6px 0 0", paddingInlineStart: 20 }}>${r.verify.map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ul></div>` : null}
        <div className="method" style=${{ marginTop: 0 }}>מקורות שה־AI מציין: ${(r.sources || []).join(" · ") || "—"}. זהו ניתוח של מודל שפה ללא גישה לנתוני שוק חיים, והוא עלול לטעות. לניתוח מבוסס מקורות עדכניים: הוסיפו את המניה למעקב (תנותח בעדכון הבא) או בקשו בצ׳אט.</div>
        <div style=${{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          ${!props.isIndex && tk && props.db ? html`<button className="btn" onClick=${function () { queue(tk); }} disabled=${qs === "saving" || qs === "done"}>${qs === "done" ? "נוספה למעקב ✓" : "הוסף את " + tk + " למעקב מלא (עדכון יומי)"}</button>` : null}
          <button className="btn ghost" onClick=${run}>נתח שוב</button>
          ${props.onClose ? html`<button className="btn ghost" onClick=${props.onClose}>סגור</button>` : null}
        </div>
        ${qs === "error" ? html`<p className="down">ההוספה למעקב נכשלה.</p>` : null}
      </div>` : null}
    </section>`;
  }

  // ---------- every US-listed stock: market data view ----------
  function LiteView(props) {
    var u = props.uni, r = props.row, T = r[0];
    var same = u.rows.filter(function (x) { return x[3] === r[3]; });
    var rank = same.indexOf(r) + 1;
    var peers = u.rows.filter(function (x) { return x[4] && x[4] === r[4] && x[0] !== T; }).slice(0, 6);
    var links = [["StockAnalysis", "https://stockanalysis.com/stocks/" + T.toLowerCase().replace(".", "-") + "/"], ["MarketBeat", "https://www.marketbeat.com/stocks/" + (r[2] === "AMEX" ? "NYSEAMERICAN" : r[2]) + "/" + T + "/forecast/"], ["Yahoo Finance", "https://finance.yahoo.com/quote/" + T.replace(".", "-") + "/"], ["Nasdaq.com", "https://www.nasdaq.com/market-activity/stocks/" + T.toLowerCase()]];
    return html`<div>
      <section className="card">
        <div className="hero">
          <div>
            <div className="kicker">${secHe(u, r[3])}${r[4] ? " · " + r[4] : ""}</div>
            <div className="nm"><h2>${cleanName(r[1])}</h2><span className="tk">${r[2]}: ${T}</span></div>
            <div className="muted" style=${{ fontSize: 13.5 }}>${r[8] || ""}</div>
            <div className="price">${N(usd(r[5]))}</div>
            <div style=${{ fontSize: 13 }}>${N(pct(r[6], 2, true), cls(r[6]))} <span className="muted">· סגירה אחרונה לפי Nasdaq.com (${props.asOf})</span></div>
            <div style=${{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="pill" style=${{ color: "var(--amber)" }}>נתוני שוק · הניתוח המלא עוד לא נבנה</span>
            </div>
          </div>
          <div className="kpis">
            <div className="kpi"><div className="l">שווי שוק</div><div className="v">${N(mcap(r[7]))}</div></div>
            <div className="kpi"><div className="l">דירוג בסקטור</div><div className="v">${N("#" + rank)}</div><div className="s">מתוך ${same.length} חברות ב${secHe(u, r[3])}</div></div>
            <div className="kpi"><div className="l">בורסה</div><div className="v" style=${{ fontSize: 16 }}>${r[2]}</div></div>
            <div className="kpi"><div className="l">ענף</div><div className="v" style=${{ fontSize: 13 }}>${r[4] || "—"}</div></div>
          </div>
        </div>
      </section>
      <${AiAnalysis} key=${"lite-" + T} query=${T + " (" + cleanName(r[1]) + ")"} db=${props.db} sample=${props.sample} label=${"ניתוח של " + cleanName(r[1])}/>
      ${peers.length ? html`<section className="card"><div className="sec-h"><div><div className="kicker">השוואה</div><h2>חברות דומות בענף</h2></div><div className="hint">${r[4]}</div></div>
        <div className="strip">${peers.map(function (x) { return html`<button key=${x[0]} className="tick" onClick=${function () { props.onPick(x[0]); }}>
          <div className="row"><span className="sym">${x[0]}</span>${props.deep[x[0]] ? html`<span className="pill c-b">ניתוח מלא</span>` : null}</div>
          <div className="row"><span className="muted" style=${{ fontSize: 12.5 }}>${cleanName(x[1]).slice(0, 26)}</span></div>
          <div className="row"><span className="px">${N(usd(x[5]))}</span><span className="muted">${N(mcap(x[7]))}</span></div></button>`; })}</div></section>` : null}
      <section className="card"><div className="sec-h"><div><div className="kicker">שקיפות</div><h2>מקורות לבדיקה עצמית</h2></div></div>
        <ol className="src-list">${links.map(function (l) { return html`<li key=${l[0]}><a href=${l[1]} target="_blank" rel="noopener">${l[0]} – ${T}</a></li>`; })}</ol>
        <p className="method">המחיר, השינוי היומי, שווי השוק, הסקטור והענף מגיעים מסורק המניות של Nasdaq.com ומתעדכנים כל בוקר. בכל עדכון יומי נבנה ניתוח מלא (דוחות 5 שנים, 4 הבנקים, Morningstar, פסק דין ותחזית) ל־3 מניות נוספות לפי סדר גודל; מניה שביקשתם עוקפת את התור.</p></section>
    </div>`;
  }

  // ---------- browse by category ----------
  function Categories(props) {
    var u = props.uni;
    var _s = useState("Technology"), sec = _s[0], setSec = _s[1];
    var _i = useState(""), ind = _i[0], setInd = _i[1];
    var _o = useState("mc"), sort = _o[0], setSort = _o[1];
    var _f = useState(false), deepOnly = _f[0], setDeepOnly = _f[1];
    var _n = useState(25), n = _n[0], setN = _n[1];
    if (!u) return html`<section className="card" id="sec-cats"><div className="muted">טוען את רשימת כל המניות…</div></section>`;
    var secs = Object.keys(u.sectors).filter(function (k) { return k; }).sort(function (a, b) { return u.sectors[b] - u.sectors[a]; });
    var inSec = u.rows.filter(function (x) { return x[3] === sec; });
    var inds = {}; inSec.forEach(function (x) { if (x[4]) inds[x[4]] = (inds[x[4]] || 0) + 1; });
    var indList = Object.keys(inds).sort(function (a, b) { return inds[b] - inds[a]; });
    var rows = inSec.filter(function (x) { return (!ind || x[4] === ind) && (!deepOnly || props.deep[x[0]]); });
    if (sort === "up") rows = rows.slice().sort(function (a, b) { return (b[6] || 0) - (a[6] || 0); });
    if (sort === "down") rows = rows.slice().sort(function (a, b) { return (a[6] || 0) - (b[6] || 0); });
    function chooseSec(k) { setSec(k); setInd(""); setN(25); }
    return html`<section className="card" id="sec-cats">
      <div className="sec-h"><div><div className="kicker">${N(u.count.toLocaleString("en-US"))} מניות בוול סטריט</div><h2>חיפוש לפי קטגוריה</h2></div><div className="hint">NASDAQ · NYSE · AMEX · לפי נתוני Nasdaq.com</div></div>
      <div className="jump" style=${{ marginTop: 0, marginBottom: 12 }}>${secs.map(function (k) { return html`<button key=${k} onClick=${function () { chooseSec(k); }} style=${k === sec ? { background: "var(--blue)", color: "#fff", borderColor: "var(--blue)" } : null}>${secHe(u, k)} <span className="num">${u.sectors[k]}</span></button>`; })}</div>
      <div style=${{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <label htmlFor="cat-ind" className="muted" style=${{ fontSize: 13 }}>ענף</label>
        <select id="cat-ind" value=${ind} onChange=${function (ev) { setInd(ev.target.value); setN(25); }} style=${{ background: "var(--panel-2)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", maxWidth: "100%", fontFamily: "var(--font-body)" }}>
          <option value="">כל הענפים (${inSec.length})</option>
          ${indList.map(function (k) { return html`<option key=${k} value=${k}>${k} (${inds[k]})</option>`; })}
        </select>
        <label htmlFor="cat-sort" className="muted" style=${{ fontSize: 13 }}>מיון</label>
        <select id="cat-sort" value=${sort} onChange=${function (ev) { setSort(ev.target.value); }} style=${{ background: "var(--panel-2)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontFamily: "var(--font-body)" }}>
          <option value="mc">שווי שוק</option><option value="up">העולות היום</option><option value="down">היורדות היום</option>
        </select>
        <label style=${{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}><input id="cat-deep" type="checkbox" checked=${deepOnly} onChange=${function (ev) { setDeepOnly(ev.target.checked); }}/> רק עם ניתוח מלא</label>
      </div>
      <div className="tbl-wrap"><table className="t">
        <thead><tr><th>מניה</th><th>חברה</th><th className="n">מחיר</th><th className="n">היום</th><th className="n">שווי שוק</th><th></th></tr></thead>
        <tbody>${rows.slice(0, n).map(function (x) { return html`<tr key=${x[0]} style=${{ cursor: "pointer" }} onClick=${function () { props.onPick(x[0]); }}>
          <td className="mono" style=${{ fontWeight: 600 }}>${x[0]}</td><td>${cleanName(x[1]).slice(0, 38)}</td>
          <td className="n">${usd(x[5])}</td><td className=${"n " + cls(x[6])}>${pct(x[6], 2, true)}</td><td className="n">${mcap(x[7])}</td>
          <td>${props.deep[x[0]] ? html`<span className="pill c-b">ניתוח מלא</span>` : null}</td></tr>`; })}</tbody>
      </table></div>
      ${rows.length > n ? html`<div style=${{ marginTop: 10 }}><button className="btn ghost" onClick=${function () { setN(n + 50); }}>הצג עוד (${rows.length - n} נוספות)</button></div>` : null}
      ${!rows.length ? html`<p className="muted">אין מניות שמתאימות לסינון.</p>` : null}
    </section>`;
  }

  function InstallTip() {
    var _d = useState(function () { try { return localStorage.getItem("shemesh-install-dismissed") === "1"; } catch (x) { return false; } }), dis = _d[0], setDis = _d[1];
    var _p = useState(null), prompt = _p[0], setPrompt = _p[1];
    useEffect(function () {
      function h(ev) { ev.preventDefault(); setPrompt(ev); }
      window.addEventListener("beforeinstallprompt", h);
      return function () { window.removeEventListener("beforeinstallprompt", h); };
    }, []);
    if (!window.SHEMESH_STANDALONE) return null;
    var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone;
    var ua = navigator.userAgent || "";
    var ios = /iphone|ipad|ipod/i.test(ua), android = /android/i.test(ua);
    if (dis || standalone || !(ios || android || prompt)) return null;
    function close() { setDis(true); try { localStorage.setItem("shemesh-install-dismissed", "1"); } catch (x) { } }
    return html`<div className="install">
      <span>${prompt ? "התקן את הדקה של שמש כאפליקציה בטלפון" : ios ? "להתקנה כאפליקציה: לחצו על כפתור השיתוף ואז \"הוספה למסך הבית\"" : "להתקנה כאפליקציה: תפריט הדפדפן ⋮ ואז \"התקנת אפליקציה\""}</span>
      <span style=${{ display: "flex", gap: 8 }}>${prompt ? html`<button className="btn gold" onClick=${function () { prompt.prompt(); setPrompt(null); }}>התקן</button>` : null}<button className="btn ghost" onClick=${close} aria-label="סגור">✕</button></span>
    </div>`;
  }

  // ---------- freshness tag ----------
  var FRESH = { daily: ["יומי", "#10B981"], weekly: ["דו־שבועי", "#3B82F6"], quarterly: ["רבעוני", "#E9B949"], event: ["לפי פרסום", "#93A0B8"] };
  function Fresh(props) {
    var f = FRESH[props.k] || FRESH.daily;
    return html`<span className="fresh" title=${props.title || ""}><span className="fdot" style=${{ background: f[1] }}></span>מתעדכן: ${f[0]}${props.extra ? " · " + props.extra : ""}</span>`;
  }

  // ---------- the six-question decision card ----------
  var LIGHT = { g: ["חזק", "var(--green)"], y: ["בינוני", "var(--amber)"], r: ["חלש", "var(--red)"], n: ["אין נתונים", "var(--muted)"] };
  function fmtFact(v, u) {
    if (v == null || v === "") return "—";
    if (typeof v === "string") return v;
    if (u === "%") return v.toFixed(1) + "%";
    if (u === "pp") return (v > 0 ? "+" : "") + v.toFixed(1) + " נק׳";
    if (u === "B") return "$" + v.toFixed(1) + "B";
    if (u === "x") return v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2);
    return String(v);
  }
  function DecisionCard(props) {
    var s = props.s, d = props.d, P = C.pillars(s, d, props.mkt1y);
    var greens = P.filter(function (p) { return p.light === "g"; }).length, reds = P.filter(function (p) { return p.light === "r"; }).length;
    var st = s.stats || {};
    var sum = greens >= 5 ? "תמונה חזקה כמעט בכל המבחנים." : reds >= 3 ? "יותר סימני אזהרה מסימני חוזק – זהירות." : greens >= 3 ? "יותר חוזקות מחולשות, עם נקודות שחשוב להכיר." : "תמונה מעורבת – ההחלטה תלויה במה שחשוב לך.";
    return html`<section className="card" id="sec-decision">
      <div className="sec-h"><div><div className="kicker">כרטיס החלטה</div><h2>שש השאלות של אנליסט – בתשובה אחת</h2></div>
        <div className="hint"><${Fresh} k="weekly" extra=${"מחיר ומכפילים: יומי"}/></div></div>
      <div style=${{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div className="lights" aria-label=${greens + " מבחנים חזקים מתוך 6"}>${P.map(function (p) { return html`<span key=${p.key} className="light" style=${{ background: LIGHT[p.light][1] }} title=${p.q + " " + LIGHT[p.light][0]}></span>`; })}</div>
        <b>${N(greens + "/6")} מבחנים חזקים.</b><span>${sum}</span>
      </div>
      <div className="pillars">${P.map(function (p, i) {
        return html`<div className="pillar" key=${p.key} style=${{ borderTopColor: LIGHT[p.light][1] }}>
          <div style=${{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}><h3>${i + 1}. ${p.q}</h3><span className="pill" style=${{ color: LIGHT[p.light][1] }}>${LIGHT[p.light][0]}</span></div>
          <p className="pl">${p.line}</p>
          <dl>${p.facts.map(function (f, j) { return html`<div key=${j}><dt>${f[0]}</dt><dd>${N(fmtFact(f[1], f[2]))}</dd></div>`; })}</dl>
          <details><summary>למה זה חשוב?</summary><p>${p.why}</p></details>
        </div>`;
      })}</div>
      <p className="method">מקור המדדים: StockAnalysis (נתוני S&P Global)${st.asOf ? ", נכון ל־" + dt(st.asOf) : ""}; שווי הוגן, חפיר ואי־ודאות – Morningstar; מחיר – סגירה אחרונה. ${st.note || ""} הצבעים הם כללי אצבע של ניתוח יסודי (למשל ROIC מעל 15% = חזק, חוב מעל פי 3 מהרווח התפעולי = חלש), לא הבטחה.</p>
    </section>`;
  }

  // ---------- 60-second guide ----------
  function Guide() {
    var _o = useState(function () { try { return localStorage.getItem("shemesh-guide-closed") !== "1"; } catch (x) { return true; } }), open = _o[0], setOpen = _o[1];
    function toggle() { var n = !open; setOpen(n); try { localStorage.setItem("shemesh-guide-closed", n ? "0" : "1"); } catch (x) { } }
    var steps = [
      ["האם זה עסק טוב?", "חפשו תשואה גבוהה על ההון (ROIC מעל 15%), שולי רווח יציבים ו'חפיר' – יתרון שמתחרים לא יכולים להעתיק בקלות."],
      ["האם הוא צומח?", "הכנסות ורווח למניה שגדלים משנה לשנה. בטווח הארוך המחיר הולך אחרי הרווחים."],
      ["האם הוא בריא פיננסית?", "מעט חוב ביחס לרווח, ותזרים מזומנים חופשי חיובי. חוב גבוה הופך שנה רעה למשבר."],
      ["האם המחיר הגיוני?", "השוו את המחיר לשווי ההוגן ולמכפילים. עסק מצוין שנקנה ביוקר עלול להיות השקעה בינונית לשנים."],
      ["מה השוק חושב?", "קונצנזוס האנליסטים, יעדי המחיר ומה עשתה המניה מול השוק. זה מצב הרוח – לא האמת."],
      ["כמה זה מסוכן?", "תנודתיות ואי־ודאות קובעות כמה לקנות. מניה מסוכנת = חלק קטן מתיק מפוזר."]
    ];
    return html`<section className="card guide" id="sec-guide">
      <div className="sec-h" style=${{ marginBottom: open ? 16 : 0 }}><div><div className="kicker">מתחילים כאן</div><h2>איך מסתכלים על מניה ב־60 שניות</h2></div>
        <button className="btn ghost" onClick=${toggle} aria-expanded=${open}>${open ? "הסתר מדריך" : "הצג מדריך"}</button></div>
      ${open ? html`<div>
        <ol className="g-steps">${steps.map(function (x, i) { return html`<li key=${i}><b>${x[0]}</b><span>${x[1]}</span></li>`; })}</ol>
        <div className="g-how">
          <div><b>איך משתמשים באתר:</b> חפשו מניה, מדד או סקטור למעלה. בכל מניה עם ניתוח מלא, "כרטיס ההחלטה" עונה על שש השאלות האלה ברמזור: ירוק = חזק, צהוב = בינוני, אדום = חלש. מתחתיו פסק הדין, התחזית, הדוחות והאנליסטים.</div>
          <div><b>מה מתעדכן ומתי:</b> <${Fresh} k="daily"/> מחירים, מכפילים, מדדים, ציון ותחזית · <${Fresh} k="weekly"/> דירוגי אנליסטים, Morningstar ומדדי איכות · <${Fresh} k="quarterly"/> דוחות כספיים – מיד אחרי שהחברה מפרסמת · <${Fresh} k="event"/> ריבית ואינפלציה.</div>
          <div><b>כלל זהב:</b> אף מדד לבד לא מספיק. מניה טובה להשקעה עוברת את רוב המבחנים – ובמחיר שמשאיר מרווח ביטחון.</div>
        </div></div>` : null}
    </section>`;
  }

  // ================= personal tools: storage =================
  function load(key, def) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (x) { return def; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (x) { } }
  function useStored(key, def) {
    var _s = useState(function () { return load(key, def); }), v = _s[0], setV = _s[1];
    function set(n) { setV(function (prev) { var nv = typeof n === "function" ? n(prev) : n; save(key, nv); return nv; }); }
    return [v, set];
  }
  // one place that knows the price/name of any ticker (deep analysis first, then the universe list)
  function quote(t, data, uni) {
    var s = data.stocks[t];
    if (s) { var d = C.derive(s); return { t: t, name: s.nameHe, price: s.price, chg: null, deep: true, entry: d.entry, fair: d.fair, rec: d.rec, s: s, d: d }; }
    var r = uni && uni.map[t];
    if (r) return { t: t, name: cleanName(r[1]), price: r[5], chg: r[6], deep: false };
    return null;
  }
  function resolveTicker(q, data, uni) {
    q = String(q || "").trim(); if (!q) return null;
    var T = (HE_ALIAS[q] || q).toUpperCase().replace(/\s+/g, "");
    if (data.stocks[T] || (uni && uni.map[T])) return T;
    var hit = data.order.find(function (k) { return (data.stocks[k].nameHe || "").indexOf(q) >= 0; });
    return hit || null;
  }
  function daysTo(iso) { var a = new Date(iso + "T12:00:00"), b = new Date(); b.setHours(12, 0, 0, 0); return Math.round((a - b) / 864e5); }

  // ---------- alert banner (top of page) ----------
  function AlertBanner(props) {
    var hits = props.watch.map(function (w) {
      var q = quote(w.t, props.data, props.uni); if (!q) return null;
      var target = w.alert || q.entry; if (!target) return null;
      return q.price <= target ? { t: w.t, name: q.name, price: q.price, target: target } : null;
    }).filter(Boolean);
    var all = hits.map(function (h) { return { t: h.t, name: h.name, text: "הגיעה למחיר היעד " + usd(h.target) }; }).concat(props.jHits || []);
    useNotify(all);
    var jh = props.jHits || [];
    if (!hits.length && !jh.length) return null;
    return html`<div>${jh.length ? html`<div className="alert-bar warn" role="status"><b>📝 תנאי מכירה ביומן התקיימו:</b> ${jh.map(function (h, i) { return html`<button key=${i} className="lnk" onClick=${function () { props.openTool("journal", h.t); }}>${h.name}: ${h.text}</button>`; })}</div>` : null}
    ${hits.length ? html`<div className="alert-bar" role="status">
      <b>🔔 ${hits.length === 1 ? "מניה אחת ברשימת המעקב הגיעה למחיר היעד" : hits.length + " מניות ברשימת המעקב הגיעו למחיר היעד"}:</b>
      ${hits.map(function (h) { return html`<button key=${h.t} className="lnk" onClick=${function () { props.onPick(h.t); }}>${h.name} (${N(usd(h.price))} ≤ ${N(usd(h.target))})</button>`; })}
    </div>` : null}</div>`;
  }

  // ---------- add-to-watchlist / portfolio bar above each stock ----------
  function ActionBar(props) {
    var t = props.t, on = props.watch.some(function (w) { return w.t === t; });
    var held = props.port.some(function (p) { return p.t === t; });
    return html`<div className="actbar">
      <button className=${"btn " + (on ? "gold" : "ghost")} onClick=${function () { props.toggleWatch(t); }} aria-pressed=${on}>${on ? "★ ברשימת המעקב" : "☆ הוסף למעקב"}</button>
      <button className="btn ghost" onClick=${function () { props.openTool("port", t); }}>${held ? "✓ בתיק · עדכן" : "+ הוסף לתיק"}</button>
      ${props.deep ? html`<button className="btn ghost" onClick=${function () { props.addCompare(t); }}>⇄ השווה</button>` : null}
      <button className="btn ghost" onClick=${function () { props.openTool("journal", t); }}>📝 יומן</button>
      ${props.onShare ? html`<button className="btn ghost" onClick=${props.onShare}>↗ שתף כרטיס</button>` : null}
    </div>`;
  }

  // ================= 1. price history =================
  var RANGES = [["1y", "שנה", 12], ["3y", "3 שנים", 36], ["5y", "5 שנים", 60]];
  function histSeries(hist, t, s) {
    var raw = hist && hist.series && hist.series[t]; if (!raw || !raw.length) return null;
    var pts = raw.map(function (p) { return { d: p[0], px: p[1] }; });
    if (s && s.price && s.priceDate && s.priceDate.slice(0, 10) > pts[pts.length - 1].d) pts.push({ d: s.priceDate.slice(0, 10), px: s.price, now: true });
    return pts;
  }
  var MON = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];
  function lbl(d) { var p = d.split("-"); return p.length === 3 ? Number(p[2]) + "." + Number(p[1]) : MON[Number(p[1]) - 1] + " " + p[0].slice(2); }
  function PriceHistory(props) {
    var s = props.s, d = props.d, hist = props.hist;
    var all = histSeries(hist, s.ticker, s);
    var _r = useState("5y"), r = _r[0], setR = _r[1];
    var _b = useState(false), bench = _b[0], setBench = _b[1];
    if (!all) return null;
    var weekly = s.ticker === "SPCX";
    var n = (RANGES.find(function (x) { return x[0] === r; }) || RANGES[2])[2] + 1;
    var pts = weekly ? all : all.slice(-n);
    var spy = hist.series[hist.bench] || [];
    var spyMap = {}; spy.forEach(function (p) { spyMap[p[0]] = p[1]; });
    var base = pts[0].px, sBase = spyMap[pts[0].d];
    var rows = pts.map(function (p) {
      var o = { label: (p.now ? "היום" : lbl(p.d)), px: p.px };
      if (bench && sBase) { o.rel = +(p.px / base * 100).toFixed(1); var sp = spyMap[p.d]; o.spy = sp ? +(sp / sBase * 100).toFixed(1) : null; }
      return o;
    });
    var prices = pts.map(function (p) { return p.px; });
    var hi = Math.max.apply(null, prices), lo = Math.min.apply(null, prices);
    var chg = (s.price / base - 1) * 100;
    var pos = hi > lo ? (s.price - lo) / (hi - lo) * 100 : 50;
    var spyChg = null; if (sBase) { var lastSpy = spy[spy.length - 1]; spyChg = (lastSpy[1] / sBase - 1) * 100; }
    var where = pos >= 85 ? "קרוב לשיא של התקופה" : pos <= 15 ? "קרוב לשפל של התקופה" : pos >= 50 ? "בחצי העליון של הטווח" : "בחצי התחתון של הטווח";
    var chart = null;
    if (RC) {
      var R = RC, key = bench && sBase ? "rel" : "px";
      var ys = rows.map(function (x) { return x[key]; }).concat(bench ? rows.map(function (x) { return x.spy; }) : [d.entry, d.fair]).filter(function (v) { return v != null; });
      var yLo = Math.min.apply(null, ys), yHi = Math.max.apply(null, ys), pad = (yHi - yLo) * 0.08;
      var fmtY = bench ? function (v) { return Math.round(v); } : function (v) { return "$" + Math.round(v); };
      chart = e(R.ResponsiveContainer, { width: "100%", height: 300 },
        e(R.ComposedChart, { data: rows, margin: { top: 12, right: 12, left: 4, bottom: 4 } },
          e(R.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
          e(R.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true, interval: "preserveStartEnd", minTickGap: 24 }),
          e(R.YAxis, { tick: AX, stroke: "#24314F", domain: [Math.floor(yLo - pad), Math.ceil(yHi + pad)], tickFormatter: fmtY, width: 56, orientation: "right" }),
          e(R.Tooltip, { content: function (p) { return e(TT, Object.assign({}, p, { fmt: { px: usd, rel: function (v) { return v.toFixed(1); }, spy: function (v) { return v.toFixed(1); } } })); } }),
          bench ? null : e(R.ReferenceLine, { y: d.entry, stroke: "#10B981", strokeDasharray: "4 4", label: { value: "מחיר כניסה " + usd(d.entry, 0), fill: "#10B981", fontSize: 11, position: "insideBottomLeft" } }),
          bench ? null : e(R.ReferenceLine, { y: d.fair, stroke: "#E9B949", strokeDasharray: "4 4", label: { value: "שווי הוגן " + usd(d.fair, 0), fill: "#E9B949", fontSize: 11, position: "insideTopLeft" } }),
          bench && sBase ? e(R.Line, { dataKey: "spy", name: "S&P 500 (SPY)", stroke: "#93A0B8", strokeWidth: 1.6, strokeDasharray: "5 4", dot: false, isAnimationActive: false, connectNulls: true }) : null,
          e(R.Line, { dataKey: key, name: bench ? s.nameHe + " (100 = תחילת התקופה)" : "מחיר", stroke: "#3B82F6", strokeWidth: 2.4, dot: false, isAnimationActive: false })
        ));
    }
    return html`<section className="card" id="sec-history">
      <div className="sec-h"><div><div className="kicker">היסטוריית מחיר</div><h2>איפה ${s.nameHe} נמצאת ביחס לעבר</h2></div><div className="hint"><${Fresh} k="daily" extra="סגירות חודשיות"/></div></div>
      <div style=${{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        ${weekly ? html`<span className="pill">מאז ההנפקה (12.6.2026)</span>` : html`<div className="seg" role="tablist">${RANGES.map(function (x) { return html`<button key=${x[0]} className=${r === x[0] ? "on" : ""} onClick=${function () { setR(x[0]); }} role="tab" aria-selected=${r === x[0]}>${x[1]}</button>`; })}</div>`}
        ${sBase ? html`<label className="chk"><input type="checkbox" checked=${bench} onChange=${function (ev) { setBench(ev.target.checked); }}/> השוואה ל־S&P 500</label>` : null}
      </div>
      <div className="kpis" style=${{ marginBottom: 12 }}>
        <div className="kpi"><div className="l">שינוי בתקופה</div><div className=${"v " + cls(chg)}>${N(pct(chg, 1, true))}</div><div className="s">${spyChg != null ? "S&P 500: " + pct(spyChg, 1, true) : ""}</div></div>
        <div className="kpi"><div className="l">טווח בתקופה</div><div className="v" style=${{ fontSize: 16 }}>${N(usd(lo, 0) + " – " + usd(hi, 0))}</div><div className="s">לפי סגירות ${weekly ? "שבועיות" : "חודשיות"}</div></div>
        <div className="kpi"><div className="l">מיקום בטווח</div><div className="v">${N(Math.round(pos) + "%")}</div><div className="s">${where}</div></div>
        <div className="kpi"><div className="l">מרחק מהשיא</div><div className=${"v " + cls(s.price / hi - 1)}>${N(pct((s.price / hi - 1) * 100, 1, true))}</div><div className="s">מחיר כניסה: ${usd(d.entry, 0)}</div></div>
      </div>
      <div className="chart">${chart || html`<${NoCharts}/>`}</div>
      <p className="method">${hist.note} איך לקרוא: מניה ליד השיא אינה בהכרח יקרה, ומניה ליד השפל אינה בהכרח זולה – את זה קובע היחס לשווי ההוגן (הקו הצהוב). הגרף עוזר לראות מגמה ותנודתיות, ולהבין כמה כאב הייתם צריכים לסבול בדרך. מקור: <a href=${(hist.sources[weekly ? 1 : 0] || [])[1]} target="_blank" rel="noopener">${(hist.sources[weekly ? 1 : 0] || [])[0]}</a>.</p>
    </section>`;
  }

  // ================= 2. compare =================
  function Compare(props) {
    var data = props.data, sel = props.sel, setSel = props.setSel, hist = data.history;
    var opts = data.order;
    var items = sel.filter(function (t) { return data.stocks[t]; }).map(function (t) {
      var s = data.stocks[t], d = C.derive(s), P = C.pillars(s, d, props.mkt1y), st = s.stats || {};
      var g = P.filter(function (p) { return p.light === "g"; }).length;
      return { t: t, s: s, d: d, P: P, st: st, g: g };
    });
    function setAt(i, t) { var n = sel.slice(); n[i] = t; setSel(n.filter(function (x, j) { return x && n.indexOf(x) === j; })); }
    var M = [
      ["המלצה", function (x) { return x.d.rec.he; }, null, function (x) { return x.d.rec.cls; }],
      ["ציון (0–100)", function (x) { return x.d.score; }, 1],
      ["מבחנים חזקים (מתוך 6)", function (x) { return x.g; }, 1],
      ["פוטנציאל עד השווי ההוגן", function (x) { return x.d.upside * 100; }, 1, null, "%"],
      ["מרחק ממחיר הכניסה", function (x) { return (x.s.price / x.d.entry - 1) * 100; }, -1, null, "%"],
      ["מכפיל רווח (P/E)", function (x) { return x.d.pe; }, -1, null, "x"],
      ["מכפיל עתידי", function (x) { return x.d.fpe; }, -1, null, "x"],
      ["PEG (מכפיל ביחס לצמיחה)", function (x) { return x.st.peg; }, -1, null, "x"],
      ["צמיחת רווח צפויה", function (x) { return x.s.epsGrowthNext != null ? x.s.epsGrowthNext : x.s.revenueGrowthNext; }, 1, null, "%"],
      ["שולי רווח תפעולי", function (x) { return x.d.opMargin; }, 1, null, "%"],
      ["תשואה על ההון (ROIC)", function (x) { return x.st.roic; }, 1, null, "%"],
      ["חוב ביחס לרווח (Debt/EBITDA)", function (x) { return x.st.debtEbitda; }, -1, null, "x"],
      ["תזרים חופשי 12 ח׳", function (x) { return x.d.fcfTTM != null ? x.d.fcfTTM / 1000 : null; }, 1, null, "B"],
      ["בטא (תנודתיות מול השוק)", function (x) { return x.s.beta; }, -1, null, "x"],
      ["תשואה 52 שבועות", function (x) { return x.s.change52w; }, 1, null, "%"],
      ["תשואת דיבידנד", function (x) { return x.s.dividendYield; }, 1, null, "%"]
    ];
    function fv(v, u) { if (v == null || !isFinite(v)) return "—"; if (u === "%") return pct(v, 1); if (u === "B") return "$" + v.toFixed(1) + "B"; if (u === "x") return v.toFixed(2); return String(Math.round(v * 10) / 10); }
    // performance chart rebased to 100, over the common window
    var chart = null;
    if (RC && hist && items.length) {
      var series = items.map(function (x) { return histSeries(hist, x.t, x.s) || []; });
      var start = series.reduce(function (a, p) { return p.length && p[0].d > a ? p[0].d : a; }, "0000");
      var sm = start.slice(0, 7);
      var months = {}; series.forEach(function (p) { p.forEach(function (q) { if (q.d.slice(0, 7) >= sm) months[q.d.slice(0, 7)] = 1; }); });
      var keys = Object.keys(months).sort();
      var rows = keys.map(function (m, j) { return { label: j === keys.length - 1 ? "היום" : lbl(m) }; });
      items.forEach(function (x, i) {
        var p = series[i].filter(function (q) { return q.d.slice(0, 7) >= sm; }); if (!p.length) return;
        var b = p[0].px, mm = {}; p.forEach(function (q) { mm[q.d.slice(0, 7)] = q.px; });
        keys.forEach(function (m, j) { if (mm[m] != null) rows[j][x.t] = +(mm[m] / b * 100).toFixed(1); });
      });
      var COL = ["#3B82F6", "#E9B949", "#10B981"], R = RC;
      chart = e(R.ResponsiveContainer, { width: "100%", height: 260 },
        e(R.LineChart, { data: rows, margin: { top: 10, right: 12, left: 4, bottom: 4 } },
          e(R.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
          e(R.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true, interval: "preserveStartEnd", minTickGap: 24 }),
          e(R.YAxis, { tick: AX, stroke: "#24314F", width: 48, orientation: "right" }),
          e(R.Tooltip, { content: function (p) { return e(TT, p); } }),
          e(R.ReferenceLine, { y: 100, stroke: "#93A0B8", strokeDasharray: "2 3" }),
          items.map(function (x, i) { return e(R.Line, { key: x.t, dataKey: x.t, name: x.s.nameHe, stroke: COL[i], strokeWidth: 2.2, dot: false, isAnimationActive: false, connectNulls: true }); })
        ));
      var startTxt = lbl(sm);
    }
    return html`<section className="card" id="sec-compare">
      <div className="sec-h"><div><div className="kicker">השוואה</div><h2>שתיים או שלוש מניות, זו לצד זו</h2></div><div className="hint">הטוב בכל שורה מסומן בירוק</div></div>
      <div className="cmp-pick">${[0, 1, 2].map(function (i) {
        return html`<select key=${i} value=${sel[i] || ""} onChange=${function (ev) { setAt(i, ev.target.value); }} aria-label=${"מניה " + (i + 1)}>
          <option value="">${i === 2 ? "— מניה שלישית (לא חובה) —" : "— בחרו מניה —"}</option>
          ${opts.map(function (t) { return html`<option key=${t} value=${t}>${data.stocks[t].nameHe} (${t})</option>`; })}
        </select>`;
      })}</div>
      ${items.length < 2 ? html`<p className="muted">בחרו לפחות שתי מניות. ההשוואה זמינה למניות עם ניתוח מלא; כל מניה חדשה שנבנה לה ניתוח תופיע כאן אוטומטית.</p>` : html`<div>
        <div className="tbl-wrap"><table className="t cmp">
          <thead><tr><th></th>${items.map(function (x) { return html`<th key=${x.t} className="n"><button className="lnk" onClick=${function () { props.onPick(x.t); }}>${x.s.nameHe}</button><div className="muted mono">${x.t} · ${usd(x.s.price)}</div></th>`; })}</tr></thead>
          <tbody>
            <tr><td>שש השאלות</td>${items.map(function (x) { return html`<td key=${x.t} className="n"><span className="lights sm">${x.P.map(function (p) { return html`<span key=${p.key} className="light" style=${{ background: LIGHT[p.light][1] }} title=${p.q + " " + LIGHT[p.light][0]}></span>`; })}</span></td>`; })}</tr>
            ${M.map(function (m) {
              var vals = items.map(function (x) { var v = m[1](x); return typeof v === "number" && isFinite(v) ? v : (typeof v === "string" ? v : null); });
              var nums = vals.filter(function (v) { return typeof v === "number"; });
              var best = m[2] && nums.length > 1 ? (m[2] > 0 ? Math.max.apply(null, nums) : Math.min.apply(null, nums)) : null;
              return html`<tr key=${m[0]}><td>${m[0]}</td>${items.map(function (x, i) {
                var v = vals[i], isB = best != null && v === best;
                return html`<td key=${x.t} className=${"n " + (m[3] ? m[3](x) : "") + (isB ? " best" : "")}>${typeof v === "string" ? v : fv(v, m[4])}</td>`;
              })}</tr>`;
            })}
          </tbody>
        </table></div>
        ${chart ? html`<h3 style=${{ marginTop: 18 }}>ביצועים מאז ${startTxt} (100 = נקודת ההתחלה)</h3><div className="chart">${chart}</div>` : null}
        <p className="method">"הטוב בשורה" הוא כלל אצבע: מכפיל נמוך, חוב נמוך ובטא נמוכה טובים יותר; צמיחה, רווחיות ופוטנציאל – גבוהים יותר. לפעמים מכפיל גבוה מוצדק בצמיחה חזקה, ולכן כדאי להסתכל על PEG. הגרף מתחיל מהתאריך המשותף לכל המניות שנבחרו.</p>
      </div>`}
    </section>`;
  }

  // ================= 3–5. my area: watchlist, portfolio, events =================
  function TickerInput(props) {
    var _q = useState(props.init || ""), q = _q[0], setQ = _q[1];
    var _e = useState(""), er = _e[0], setEr = _e[1];
    useEffect(function () { setQ(props.init || ""); }, [props.init]);
    function go(ev) { ev.preventDefault(); var T = resolveTicker(q, props.data, props.uni); if (!T) { setEr("לא מצאתי את \"" + q + "\". נסו סימול באנגלית, למשל AMD."); return; } setEr(""); props.onOk(T); setQ(""); }
    return html`<form onSubmit=${go} className="tk-in">
      <input value=${q} onInput=${function (ev) { setQ(ev.target.value); }} placeholder=${props.ph || "סימול או שם, למשל NVDA או אנבידיה"} aria-label="מניה"/>
      ${props.extra || null}
      <button className="btn" type="submit">${props.btn || "הוסף"}</button>
      ${er ? html`<div className="down" style=${{ fontSize: 13, width: "100%" }}>${er}</div>` : null}
    </form>`;
  }

  function Watchlist(props) {
    var data = props.data, uni = props.uni, watch = props.watch, setWatch = props.setWatch;
    var rows = watch.map(function (w) { return { w: w, q: quote(w.t, data, uni) }; }).filter(function (x) { return x.q; });
    function setAlert(t, v) { setWatch(watch.map(function (w) { return w.t === t ? Object.assign({}, w, { alert: v > 0 ? v : null }) : w; })); }
    function remove(t) { setWatch(watch.filter(function (w) { return w.t !== t; })); }
    var SUG = ["NVDA", "MSFT", "SPCX"].filter(function (t) { return data.stocks[t] && !watch.some(function (w) { return w.t === t; }); });
    return html`<div>
      <${TickerInput} data=${data} uni=${uni} btn="הוסף למעקב" onOk=${function (T) { if (!watch.some(function (w) { return w.t === T; })) setWatch(watch.concat([{ t: T, alert: null, added: new Date().toISOString().slice(0, 10) }])); }}/>
      ${SUG.length ? html`<div className="muted" style=${{ fontSize: 13, margin: "8px 0" }}>הצעה: ${SUG.map(function (t) { return html`<button key=${t} className="chipbtn" onClick=${function () { setWatch(watch.concat([{ t: t, alert: null, added: new Date().toISOString().slice(0, 10) }])); }}>+ ${data.stocks[t].nameHe}</button>`; })}</div>` : null}
      ${!rows.length ? html`<p className="muted">הרשימה ריקה. הוסיפו מניה – וכשהמחיר שלה יורד למחיר הכניסה המומלץ (או למחיר שתקבעו בעצמכם), תופיע התראה בראש הדף.</p>` : html`<div className="tbl-wrap"><table className="t">
        <thead><tr><th>מניה</th><th className="n">מחיר</th><th className="n">מחיר יעד להתראה</th><th className="n">מרחק</th><th>מצב</th><th></th></tr></thead>
        <tbody>${rows.map(function (x) {
          var q = x.q, target = x.w.alert || q.entry, gap = target ? (q.price / target - 1) * 100 : null;
          var st = gap == null ? ["קבעו מחיר יעד", "muted"] : gap <= 0 ? ["🟢 הגיעה למחיר", "up"] : gap <= 5 ? ["🟡 קרובה (עד 5%)", "c-h"] : ["⚪ מחכים", "muted"];
          return html`<tr key=${q.t}>
            <td><button className="lnk" onClick=${function () { props.onPick(q.t); }}>${q.name}</button> <span className="muted mono" style=${{ fontSize: 12 }}>${q.t}</span>${q.deep ? html` <span className=${"pill " + q.rec.cls}>${q.rec.he}</span>` : null}</td>
            <td className="n">${usd(q.price)}${q.chg != null ? html` <span className=${cls(q.chg)} style=${{ fontSize: 12 }}>${pct(q.chg, 1, true)}</span>` : null}</td>
            <td className="n"><input className="num-in" type="number" step="0.01" min="0" defaultValue=${x.w.alert || ""} placeholder=${q.entry ? q.entry.toFixed(2) : "מחיר"} onChange=${function (ev) { setAlert(q.t, parseFloat(ev.target.value)); }} aria-label=${"מחיר יעד ל" + q.name}/>
              <div className="muted" style=${{ fontSize: 11 }}>${x.w.alert ? "יעד שלך" : q.entry ? "מחיר כניסה מומלץ" : ""}</div></td>
            <td className=${"n " + (gap != null && gap <= 0 ? "up" : "")}>${gap == null ? "—" : pct(gap, 1, true)}</td>
            <td className=${st[1]}>${st[0]}</td>
            <td><button className="x" onClick=${function () { remove(q.t); }} aria-label=${"הסר את " + q.name}>✕</button></td>
          </tr>`;
        })}</tbody></table></div>`}
      ${typeof Notification !== "undefined" && Notification.permission === "default" ? html`<button className="btn ghost" style=${{ marginTop: 10 }} onClick=${function () { try { Notification.requestPermission(); } catch (e1) { } }}>🔔 הפעל התראות בדפדפן</button>` : null}
      <p className="method">ההתראה נבדקת בכל פעם שאתם פותחים את האתר, מול המחירים של העדכון היומי. בדף שב־Claude רשימת המעקב ותנאי היומן נשמרים גם במסד הנתונים הפרטי של הדף, והעדכון היומי שולח לך התראה כשמניה מגיעה ליעד. מחיר היעד ברירת המחדל הוא מחיר הכניסה של המודל (שווי הוגן פחות מרווח ביטחון); למניות בלי ניתוח מלא קבעו מחיר בעצמכם.</p>
    </div>`;
  }

  function Portfolio(props) {
    var data = props.data, uni = props.uni, port = props.port, setPort = props.setPort;
    var _f = useState({ qty: "", price: "", date: new Date().toISOString().slice(0, 10) }), f = _f[0], setF = _f[1];
    var _er = useState(""), er = _er[0], setEr = _er[1];
    function add(T) {
      var qty = parseFloat(f.qty), price = parseFloat(f.price);
      if (!(qty > 0) || !(price > 0)) { setEr("מלאו כמות ומחיר קנייה (מספרים חיוביים)."); return; }
      setEr(""); setPort(port.concat([{ id: Date.now() + "-" + T, t: T, qty: qty, price: price, date: f.date }]));
      setF({ qty: "", price: "", date: f.date });
    }
    function del(id) { setPort(port.filter(function (p) { return p.id !== id; })); }
    // group lots by ticker
    var g = {}; port.forEach(function (p) { (g[p.t] = g[p.t] || []).push(p); });
    var rows = Object.keys(g).map(function (t) {
      var lots = g[t], q = quote(t, data, uni), qty = 0, cost = 0;
      lots.forEach(function (l) { qty += l.qty; cost += l.qty * l.price; });
      var px = q ? q.price : null, val = px != null ? qty * px : null;
      return { t: t, q: q, lots: lots, qty: qty, cost: cost, avg: cost / qty, px: px, val: val, pl: val != null ? val - cost : null };
    });
    var totVal = rows.reduce(function (a, r) { return a + (r.val || 0); }, 0), totCost = rows.reduce(function (a, r) { return a + r.cost; }, 0);
    var totPl = totVal - totCost;
    var sectors = {}; rows.forEach(function (r) { var sec = r.q && r.q.deep ? r.q.s.sector : (uni && uni.map[r.t] ? secHe(uni, uni.map[r.t][3]) : "אחר"); sectors[sec] = (sectors[sec] || 0) + (r.val || 0); });
    var maxW = rows.reduce(function (a, r) { return Math.max(a, totVal ? (r.val || 0) / totVal : 0); }, 0);
    var _open = useState(null), open = _open[0], setOpen = _open[1];
    function exportJ() { var b = new Blob([JSON.stringify({ v: 2, watch: props.watch, port: port, journal: props.journal }, null, 1)], { type: "application/json" }); var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "shemesh-my-data.json"; a.click(); }
    function importJ(ev) { var file = ev.target.files && ev.target.files[0]; if (!file) return; var rd = new FileReader(); rd.onload = function () { try { var j = JSON.parse(rd.result); if (Array.isArray(j.port)) setPort(j.port); if (Array.isArray(j.watch)) props.setWatch(j.watch); if (j.journal && typeof j.journal === "object") props.setJournal(j.journal); setEr(""); } catch (x) { setEr("הקובץ לא תקין."); } }; rd.readAsText(file); }
    return html`<div>
      <${TickerInput} data=${data} uni=${uni} init=${props.preset || ""} btn="הוסף לתיק" onOk=${add} extra=${html`<span className="tk-extra">
        <input className="num-in" type="number" step="any" min="0" placeholder="כמות" value=${f.qty} onInput=${function (ev) { setF(Object.assign({}, f, { qty: ev.target.value })); }} aria-label="כמות מניות"/>
        <input className="num-in" type="number" step="0.01" min="0" placeholder="מחיר קנייה $" value=${f.price} onInput=${function (ev) { setF(Object.assign({}, f, { price: ev.target.value })); }} aria-label="מחיר קנייה בדולר"/>
        <input className="num-in" type="date" value=${f.date} onInput=${function (ev) { setF(Object.assign({}, f, { date: ev.target.value })); }} aria-label="תאריך קנייה"/></span>`}/>
      ${er ? html`<div className="down" style=${{ fontSize: 13 }}>${er}</div>` : null}
      ${!rows.length ? html`<p className="muted">עוד לא הוספתם קניות. רשמו סימול, כמות, מחיר ותאריך – והתיק יחושב לפי המחירים של העדכון היומי.</p>` : html`<div>
        <div className="kpis" style=${{ margin: "14px 0" }}>
          <div className="kpi"><div className="l">שווי התיק</div><div className="v">${N(usd(totVal, 0))}</div></div>
          <div className="kpi"><div className="l">עלות</div><div className="v">${N(usd(totCost, 0))}</div></div>
          <div className="kpi"><div className="l">רווח / הפסד</div><div className=${"v " + cls(totPl)}>${N((totPl >= 0 ? "+" : "-") + usd(Math.abs(totPl), 0))}</div><div className=${"s " + cls(totPl)}>${pct(totCost ? totPl / totCost * 100 : 0, 1, true)}</div></div>
          <div className="kpi"><div className="l">פיזור</div><div className="v">${N(rows.length + " מניות")}</div><div className="s">${Object.keys(sectors).length} סקטורים · הגדולה ${pct(maxW * 100, 0)}</div></div>
        </div>
        ${maxW > 0.25 ? html`<div className="note-warn">⚠ מניה אחת היא יותר מרבע מהתיק. זה ריכוז גבוה – ירידה חדה בה תשפיע מאוד על כל התיק.</div>` : null}
        <div className="tbl-wrap"><table className="t">
          <thead><tr><th>מניה</th><th className="n">כמות</th><th className="n">מחיר ממוצע</th><th className="n">מחיר היום</th><th className="n">שווי</th><th className="n">רווח/הפסד</th><th className="n">משקל</th><th>מה המודל אומר</th></tr></thead>
          <tbody>${rows.map(function (r) {
            var plp = r.pl != null ? r.pl / r.cost * 100 : null, w = totVal ? (r.val || 0) / totVal * 100 : 0;
            return [html`<tr key=${r.t}>
              <td><button className="lnk" onClick=${function () { props.onPick(r.t); }}>${r.q ? r.q.name : r.t}</button> <span className="muted mono" style=${{ fontSize: 12 }}>${r.t}</span>
                <button className="chipbtn" onClick=${function () { setOpen(open === r.t ? null : r.t); }} aria-expanded=${open === r.t}>${r.lots.length} קניות</button></td>
              <td className="n">${r.qty.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
              <td className="n">${usd(r.avg)}</td>
              <td className="n">${r.px != null ? usd(r.px) : "—"}</td>
              <td className="n">${r.val != null ? usd(r.val, 0) : "—"}</td>
              <td className=${"n " + cls(r.pl)}>${r.pl != null ? (r.pl >= 0 ? "+" : "-") + usd(Math.abs(r.pl), 0) + " (" + pct(plp, 1, true) + ")" : "—"}</td>
              <td className="n"><span className="wbar"><span style=${{ width: w + "%" }}></span></span> ${pct(w, 0)}</td>
              <td>${r.q && r.q.deep ? html`<span className=${"pill " + r.q.rec.cls}>${r.q.rec.he}</span> <span className="muted" style=${{ fontSize: 12 }}>שווי הוגן ${usd(r.q.fair, 0)}</span>` : html`<span className="muted" style=${{ fontSize: 12 }}>אין ניתוח מלא עדיין</span>`}</td>
            </tr>`, open === r.t ? html`<tr key=${r.t + "-lots"} className="lots"><td colSpan="8">${r.lots.map(function (l) {
              return html`<div key=${l.id} className="lot"><span>${dt(l.date)} · ${l.qty} מניות ב־${usd(l.price)}</span>${r.px != null ? html`<span className=${cls(r.px - l.price)}>${pct((r.px / l.price - 1) * 100, 1, true)}</span>` : null}<button className="x" onClick=${function () { del(l.id); }} aria-label="מחק קנייה">✕</button></div>`;
            })}</td></tr>` : null];
          })}</tbody></table></div>
        <${PortfolioRisk} data=${data} rows=${rows} style=${load("shemesh-style", "balanced")}/>
      </div>`}
      <div style=${{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn ghost" onClick=${exportJ}>⬇ גיבוי לקובץ</button>
        <label className="btn ghost" style=${{ display: "inline-flex", alignItems: "center" }}>⬆ טעינה מקובץ<input type="file" accept="application/json,.json" onChange=${importJ} style=${{ display: "none" }}/></label>
      </div>
      <p className="method">הקניות (כמויות ומחירים) נשמרות רק בדפדפן הזה, במכשיר הזה. ברשימת המעקב ובתנאי היומן נשמרים בדף שב־Claude גם הסימולים והתנאים (בלי כמויות), כדי שהעדכון היומי יוכל להתריע לך – אם תשתף את הדף, מי שמקבל גישה יוכל לראות אותם. כדי להעביר אותם בין המחשב לטלפון, לחצו "גיבוי לקובץ" במכשיר אחד ו"טעינה מקובץ" בשני. המחירים הם מחירי סגירה מהעדכון היומי, בדולרים, לפני עמלות ומס.</p>
    </div>`;
  }

  var EV_KIND = { earnings: ["דוח רבעוני", "#3B82F6"], exdiv: ["דיבידנד", "#10B981"], macro: ["מאקרו", "#E9B949"], other: ["אירוע", "#93A0B8"] };
  function Events(props) {
    var data = props.data, ev = (data.events && data.events.items) || [];
    var mine = {}; props.watch.forEach(function (w) { mine[w.t] = 1; }); props.port.forEach(function (p) { mine[p.t] = 1; });
    var hasMine = Object.keys(mine).length > 0;
    var _m = useState(hasMine), only = _m[0], setOnly = _m[1];
    var list = ev.filter(function (x) { return daysTo(x.date) >= 0; }).filter(function (x) { return !only || mine[x.t] || x.t === "MACRO"; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return html`<div>
      <div style=${{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div className="seg">${[[true, "המניות שלי"], [false, "כל המניות בניתוח"]].map(function (o) { return html`<button key=${String(o[0])} className=${only === o[0] ? "on" : ""} onClick=${function () { setOnly(o[0]); }}>${o[1]}</button>`; })}</div>
        <${Fresh} k="weekly" extra="נבדק מול הודעות החברות"/>
      </div>
      ${only && !hasMine ? html`<p className="muted">הוסיפו מניות למעקב או לתיק כדי לראות כאן רק את האירועים שלהן.</p>` : null}
      ${!list.length ? html`<p className="muted">אין אירועים קרובים ברשימה.</p>` : html`<ol className="evs">${list.map(function (x, i) {
        var k = EV_KIND[x.kind] || EV_KIND.other, n = daysTo(x.date), q = x.t !== "MACRO" ? quote(x.t, data, props.uni) : null;
        return html`<li key=${i} style=${{ borderInlineStartColor: k[1] }}>
          <div className="ev-d"><b>${dt(x.date)}</b><span className="muted">${n === 0 ? "היום" : n === 1 ? "מחר" : "בעוד " + n + " ימים"}</span></div>
          <div className="ev-b">
            <div><span className="pill" style=${{ color: k[1] }}>${k[0]}</span> ${q ? html`<button className="lnk" onClick=${function () { props.onPick(x.t); }}>${q.name}</button>` : html`<b>ארה"ב</b>`} ${x.confirmed ? html`<span className="pill c-b">מאושר</span>` : html`<span className="pill c-h">משוער</span>`}</div>
            <div>${x.he}</div>
            <a href=${x.url} target="_blank" rel="noopener" style=${{ fontSize: 12 }}>מקור ↗</a>
          </div></li>`;
      })}</ol>`}
      <p className="method">למה זה חשוב: ביום הדוח המניה זזה לרוב יותר מבכל יום אחר, ואנליסטים משנים יעדים מיד אחריו – לכן לא כדאי לקנות "על עיוור" ערב דוח. כדי לקבל דיבידנד צריך להחזיק במניה לפני יום האקס. תאריך "משוער" מבוסס על הדפוס של החברה ויתעדכן כשהיא תודיע.</p>
    </div>`;
  }

  function MyArea(props) {
    var tab = props.tab, setTab = props.setTab;
    var nW = props.watch.length, nP = Object.keys(props.port.reduce(function (a, p) { a[p.t] = 1; return a; }, {})).length;
    var T = [["watch", "רשימת מעקב" + (nW ? " (" + nW + ")" : "")], ["port", "התיק שלי" + (nP ? " (" + nP + ")" : "")], ["paper", "התיק הניסיוני"], ["journal", "יומן השקעה"], ["events", "לוח אירועים"]];
    return html`<section className="card" id="sec-my">
      <div className="sec-h"><div><div className="kicker">האזור שלי</div><h2>מעקב, תיק ואירועים</h2></div>
        <div className="seg" role="tablist">${T.map(function (x) { return html`<button key=${x[0]} role="tab" aria-selected=${tab === x[0]} className=${tab === x[0] ? "on" : ""} onClick=${function () { setTab(x[0]); }}>${x[1]}</button>`; })}</div></div>
      ${e(tab === "watch" ? Watchlist : tab === "port" ? Portfolio : tab === "paper" ? PaperPortfolio : tab === "journal" ? Journal : Events, props)}
    </section>`;
  }

  // ================= round 3: analyst tools, brief, screener, track record, design =================
  var LV = { g: "var(--green)", y: "var(--amber)", r: "var(--red)", n: "var(--muted)" };
  function Dot(props) { return html`<span className="light" style=${{ background: LV[props.l] || LV.n, width: 12, height: 12, display: "inline-block" }} aria-hidden="true"></span>`; }
  function rfNow(data) { var m = (data.markets && data.markets.items || []).find(function (x) { return x.k === "us10y"; }); return m ? m.value : 4.9; }
  function fxAt(fx, iso) {
    if (!fx || !fx.monthly) return null;
    var k = String(iso || "").slice(0, 7); if (fx.monthly[k]) return fx.monthly[k];
    var ks = Object.keys(fx.monthly).sort(), best = null;
    ks.forEach(function (x) { if (x <= k) best = x; });
    return fx.monthly[best || ks[0]];
  }

  // ---------- beginner / expert mode ----------
  function ModeSwitch(props) {
    return html`<div className="mode" role="radiogroup" aria-label="רמת פירוט">
      ${[["simple", "מתחיל"], ["pro", "מתקדם"]].map(function (m) { return html`<button key=${m[0]} role="radio" aria-checked=${props.mode === m[0]} className=${props.mode === m[0] ? "on" : ""} onClick=${function () { props.setMode(m[0]); }}>${m[1]}</button>`; })}
      <span className="muted" style=${{ fontSize: 12.5 }}>${props.mode === "simple" ? "רק השורה התחתונה: רמזורים, פסק דין ותחזית" : "כל הנתונים: דוחות, אנליסטים, מכפילים וכלים"}</span>
    </div>`;
  }

  // ---------- first screen: this morning ----------
  function Morning(props) {
    var data = props.data, uni = props.uni, M = (data.markets && data.markets.items) || [];
    var spx = (data.indices || []).find(function (x) { return x.id === "SPX"; });
    function mk(k) { return M.find(function (x) { return x.k === k; }); }
    var vix = mk("vix"), fx = mk("usdils"), y10 = mk("us10y");
    var held = {}; props.port.forEach(function (p) { held[p.t] = 1; });
    // stock of the day: best mix of score and upside, not already held
    var cand = data.order.map(function (t) { var s = data.stocks[t], d = C.derive(s); return { t: t, s: s, d: d, k: d.score * Math.max(0, d.upside) }; })
      .filter(function (x) { return !held[x.t] && x.d.upside > 0; }).sort(function (a, b) { return b.k - a.k; });
    var pickS = cand[0];
    var mine = Object.keys(props.watch.reduce(function (a, w) { a[w.t] = 1; return a; }, Object.assign({}, held)));
    var moves = mine.map(function (t) { var r = uni && uni.map[t]; var s = data.stocks[t]; return { t: t, name: s ? s.nameHe : r ? cleanName(r[1]) : t, chg: r ? r[6] : null }; })
      .filter(function (x) { return x.chg != null; }).sort(function (a, b) { return Math.abs(b.chg) - Math.abs(a.chg); }).slice(0, 4);
    var week = ((data.events && data.events.items) || []).filter(function (e) { var n = daysTo(e.date); return n >= 0 && n <= 7; });
    var b = data.brief || { items: [] };
    return html`<section className="card morning" id="sec-morning">
      <p className="lead">כל מניה בוול סטריט, בשש שאלות של אנליסט ותשובה אחת – עם מקור לכל מספר.</p>
      <div className="mk3">
        ${spx ? html`<div className="kpi"><div className="l">S&P 500</div><div className="v">${N(spx.level.toLocaleString("en-US", { maximumFractionDigits: 0 }))}</div><div className=${"s " + cls(spx.chg)}>${pct(spx.chg, 2, true)} · ${dt(spx.date)}</div></div>` : null}
        ${vix ? html`<div className="kpi"><div className="l">מדד הפחד (VIX)</div><div className="v">${N(vix.value.toFixed(1))}</div><div className="s">${vix.value < 20 ? "רגוע" : vix.value < 30 ? "עצבני" : "פאניקה"} · ${dt(vix.date)}</div></div>` : null}
        ${fx ? html`<div className="kpi"><div className="l">דולר/שקל</div><div className="v">${N("₪" + fx.value.toFixed(3))}</div><div className="s">ממוצע החודש</div></div>` : y10 ? html`<div className="kpi"><div className="l">אג"ח 10 שנים</div><div className="v">${N(y10.value + "%")}</div></div>` : null}
      </div>
      <div className="mgrid">
        <div>
          <h3>סקירת הבוקר${b.date ? " · " + dt(b.date) : ""}</h3>
          <ul className="brief">${b.items.map(function (x, i) { return html`<li key=${i}>${x.he} ${x.src ? html`<a href=${x.src} target="_blank" rel="noopener" style=${{ fontSize: 12 }}>מקור ↗</a>` : null}</li>`; })}
            ${week.map(function (e, i) { var q = e.t !== "MACRO" ? data.stocks[e.t] : null; return html`<li key=${"e" + i}>📅 ${dt(e.date)}: ${q ? q.nameHe + " – " : ""}${e.he}</li>`; })}</ul>
          ${moves.length ? html`<div className="mine"><b>המניות שלך היום:</b> ${moves.map(function (m) { return html`<button key=${m.t} className="chipbtn" onClick=${function () { props.onPick(m.t); }}>${m.name} <span className=${cls(m.chg)}>${pct(m.chg, 1, true)}</span></button>`; })}</div>` : html`<div className="muted" style=${{ fontSize: 13 }}>הוסיפו מניות למעקב או לתיק – והתנועה שלהן תופיע כאן כל בוקר.</div>`}
        </div>
        ${pickS ? html`<div className="sotd">
          <div className="kicker">המניה של היום</div>
          <h3>${pickS.s.nameHe} <span className="mono muted" style=${{ fontSize: 13 }}>${pickS.t}</span></h3>
          <div style=${{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0" }}><span className=${"pill " + pickS.d.rec.cls}>${pickS.d.rec.he}</span><span className="pill">ציון ${pickS.d.score}</span><span className="pill c-b">פוטנציאל ${pct(pickS.d.upside * 100, 0, true)}</span></div>
          <p style=${{ margin: "6px 0", fontSize: 14 }}>הציון והפוטנציאל המשולבים הגבוהים ביותר מבין המניות עם ניתוח מלא${props.port.length ? " שאין לך בתיק" : ""}.${pickS.s.price > pickS.d.entry ? " עדיין מעל מחיר הכניסה (" + usd(pickS.d.entry, 0) + ")." : " כבר מתחת למחיר הכניסה."}</p>
          <button className="btn" onClick=${function () { props.onPick(pickS.t); }}>לניתוח המלא</button>
        </div>` : null}
      </div>
    </section>`;
  }

  // ---------- analyst tools for one stock ----------
  function AnalystTools(props) {
    var s = props.s, d = props.d, data = props.data, simple = props.mode === "simple";
    var R = C.reverseDCF(s, d, rfNow(data)), P = C.peHistory(s, d, data.history);
    var rv = s.revisions, ow = s.ownership;
    var _st = useStored("shemesh-style", "balanced"), style = _st[0], setStyle = _st[1];
    var _ps = useStored("shemesh-psize", ""), psize = _ps[0], setPsize = _ps[1];
    var Z = C.sizing(s, d, style);
    var up = 0, dn = 0; if (rv && rv.rows) rv.rows.forEach(function (r) { up += r[2]; dn += r[3]; });
    var revL = !rv ? "n" : up - dn >= 3 ? "g" : dn - up >= 3 ? "r" : "y";
    var insL = !ow ? "n" : ow.buy12mM > 0 && ow.buy12mM >= ow.sell12mM * 0.2 ? "g" : "y";
    var cards = [
      { k: "dcf", t: "מה המחיר של היום מניח?", l: R.ok && R.g != null ? R.light : "n",
        line: !R.ok ? R.why : R.g == null ? "גם צמיחה של 100% בשנה לא מצדיקה את המחיר – השוק מתמחר משהו שהתזרים עוד לא מראה." :
          "כדי להצדיק " + usd(s.price) + ", התזרים החופשי צריך לצמוח כ־" + pct(R.g, 1) + " בשנה במשך 10 שנים." + (R.ref != null ? (R.light === "g" ? " זה פחות ממה שהחברה צפויה להשיג (~" + pct(R.ref, 0) + ") – יש מרווח." : R.light === "y" ? " זה בערך מה שהחברה צפויה להשיג (~" + pct(R.ref, 0) + ") – אין הרבה מרווח לטעות." : " זה יותר ממה שהחברה צפויה להשיג (~" + pct(R.ref, 0) + ") – המחיר כבר מגלם הרבה אופטימיות.") : ""),
        body: R.ok && R.g != null ? html`<dl>
          <div><dt>תזרים חופשי 12 ח׳</dt><dd>${N(bn(R.fcf))}</dd></div>
          <div><dt>תשואת תזרים (תזרים ÷ שווי שוק)</dt><dd>${N(pct(R.fcfYield, 1))}</dd></div>
          <div><dt>שיעור היוון (אג"ח 10 + בטא × 5%)</dt><dd>${N(pct(R.r * 100, 1))}</dd></div>
          <div><dt>צמיחה צפויה (קונצנזוס / 3 שנים אחרונות)</dt><dd>${N((R.exp != null ? pct(R.exp, 0) : "—") + " / " + (R.rev != null ? pct(R.rev, 0) : "—"))}</dd></div></dl>
          <p className="method">חישוב "DCF הפוך": במקום לנחש כמה החברה שווה, שואלים איזו צמיחה המחיר כבר מניח (10 שנים, ואז צמיחה של 3% לנצח). השקעות כבדות (כמו מרכזי נתונים) מקטינות זמנית את התזרים ומנפחות את התוצאה.</p>` : null },
      { k: "rev", t: "לאן זזות התחזיות?", l: revL,
        line: !rv ? "אין עדיין נתוני עדכוני תחזית למניה הזו." : up - dn >= 3 ? "האנליסטים מעלים תחזיות: " + up + " העלאות מול " + dn + " הורדות בחודש האחרון. סימן חיובי – לרוב קודם לעליות." : dn - up >= 3 ? "האנליסטים מורידים תחזיות: " + dn + " הורדות מול " + up + " העלאות בחודש האחרון. סימן אזהרה." : "תחזיות יציבות: " + up + " העלאות ו־" + dn + " הורדות בחודש האחרון.",
        body: rv ? html`<table className="t"><thead><tr><th>שנה</th><th className="n">רווח למניה צפוי</th><th className="n">העלאות</th><th className="n">הורדות</th></tr></thead>
          <tbody>${rv.rows.map(function (r) { return html`<tr key=${r[0]}><td>${r[0]}</td><td className="n">${usd(r[1])}</td><td className="n up">${r[2]}</td><td className="n down">${r[3]}</td></tr>`; })}</tbody></table>
          <p className="method">ספירת האנליסטים שהעלו או הורידו את תחזית הרווח ב־4 השבועות האחרונים. <a href=${rv.src} target="_blank" rel="noopener">מקור ↗</a></p>` : null },
      { k: "pe", t: "המכפיל מול ההיסטוריה של המניה", l: P ? P.light : "n",
        line: !P ? "אין מספיק שנים רווחיות להשוואה." : "המכפיל היום " + P.now.toFixed(1) + ", לעומת ממוצע " + P.avg.toFixed(1) + " בסוף כל שנת כספים (טווח " + P.lo.toFixed(0) + "–" + P.hi.toFixed(0) + "). " + (P.vs <= -10 ? "זול מהרגיל שלה." : P.vs <= 15 ? "בערך ברגיל שלה." : "יקר מהרגיל שלה."),
        body: P ? html`<div className="pebars">${P.pts.concat([{ label: "היום", pe: P.now, now: true }]).map(function (p) { var w = Math.min(100, p.pe / Math.max(P.hi, P.now) * 100); return html`<div key=${p.label} className="pebar"><span>${p.label}</span><span className="track"><span className=${p.now ? "fill now" : "fill"} style=${{ width: w + "%" }}></span></span><span className="num">${p.pe.toFixed(1)}</span></div>`; })}</div>
          <p className="method">מחיר בסוף חודש סיום שנת הכספים חלקי הרווח למניה של אותה שנה. מכפיל גבוה מהרגיל מוצדק רק אם הצמיחה גבוהה מהרגיל.</p>` : null },
      { k: "own", t: "מי מחזיק ומי מוכר?", l: insL,
        line: !ow ? "אין נתונים." : (ow.buy12mM > 0 ? "מנהלים קנו ב־" + ow.buy12mM.toFixed(1) + " מיליון $ " : "אף מנהל לא קנה מניות ") + "בשנה האחרונה, ו־" + ow.sell12mN + " מכרו ב־" + (ow.sell12mM >= 1000 ? (ow.sell12mM / 1000).toFixed(2) + " מיליארד $" : ow.sell12mM.toFixed(0) + " מיליון $") + ". מכירות של מנהלים הן עניין שגרתי (מיסים, פיזור); קנייה בכסף שלהם היא הסימן החשוב.",
        body: ow ? html`<dl>
          <div><dt>מוחזק בידי מנהלים ובעלי עניין</dt><dd>${N(ow.insidersPct != null ? pct(ow.insidersPct, 2) : "—")}</dd></div>
          <div><dt>מוחזק בידי מוסדיים (קרנות, בנקים)</dt><dd>${N(ow.institutionsPct != null ? pct(ow.institutionsPct, 1) : "—")}</dd></div>
          <div><dt>העסקה האחרונה</dt><dd style=${{ fontWeight: 400, fontSize: 12.5 }}>${ow.last}</dd></div></dl>
          <p className="method"><a href=${ow.src} target="_blank" rel="noopener">MarketBeat – עסקאות בעלי עניין ↗</a> · <a href=${ow.srcOwn} target="_blank" rel="noopener">StockAnalysis – בעלות ↗</a></p>` : null }
    ];
    var amt = parseFloat(psize) > 0 ? parseFloat(psize) * Z.maxPct / 100 : null;
    return html`<section className="card" id="sec-tools">
      <div className="sec-h"><div><div className="kicker">כלים של אנליסט</div><h2>מתי לקנות, כמה לקנות – ומה השוק כבר יודע</h2></div><div className="hint"><${Fresh} k="weekly" extra="מחיר: יומי"/></div></div>
      <div className="tools">${cards.map(function (c) { return html`<div key=${c.k} className="pillar" style=${{ borderTopColor: LV[c.l] }}>
        <h3><${Dot} l=${c.l}/> ${c.t}</h3><p className="pl">${c.line}</p>
        ${simple || !c.body ? null : html`<details><summary>הנתונים והחישוב</summary>${c.body}</details>`}
      </div>`; })}</div>
      <div className="sizing">
        <h3>כמה לקנות? <span className="muted" style=${{ fontWeight: 400, fontSize: 13 }}>– גודל פוזיציה מקסימלי לפי הסיכון</span></h3>
        <div style=${{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="seg">${[["careful", "זהיר"], ["balanced", "מאוזן"], ["bold", "נועז"]].map(function (x) { return html`<button key=${x[0]} className=${style === x[0] ? "on" : ""} onClick=${function () { setStyle(x[0]); }}>${x[1]}</button>`; })}</div>
          <label className="chk">גודל התיק ($): <input className="num-in" type="number" min="0" step="100" value=${psize} onInput=${function (ev) { setPsize(ev.target.value); }} placeholder="למשל 50000"/></label>
        </div>
        <p style=${{ margin: "10px 0 0" }}>מומלץ עד <b>${N(Z.maxPct + "%")}</b> מהתיק ב${s.nameHe}${amt ? html` – כלומר עד <b>${N(usd(amt, 0))}</b>` : ""}.
          <span className="muted"> (תקרה ${Z.cap}% בסגנון שבחרת, מחולקת בבטא ${Z.beta.toFixed(2)} ומוקטנת לפי אי־ודאות ${Z.unc ? UNC_HE[Z.unc] : "לא ידועה"}.)</span></p>
      </div>
    </section>`;
  }

  // ---------- investment journal with kill criteria ----------
  var RULES = [
    ["below", "המחיר יורד מתחת ל־", "$"], ["above", "המחיר עולה מעל ", "$"], ["overfair", "המחיר גבוה מהשווי ההוגן ביותר מ־", "%"],
    ["score", "הציון יורד מתחת ל־", ""], ["sell", "המודל עובר להמלצת מכירה", null], ["growth", "צמיחת הרווח הצפויה יורדת מתחת ל־", "%"]
  ];
  function checkRule(r, q) {
    if (!q) return false;
    var s = q.s, d = q.d, v = parseFloat(r.v);
    switch (r.k) {
      case "below": return q.price < v;
      case "above": return q.price > v;
      case "overfair": return d && q.price > d.fair * (1 + v / 100);
      case "score": return d && d.score < v;
      case "sell": return d && d.rec.key === "sell";
      case "growth": var g = s && (s.epsGrowthNext != null ? s.epsGrowthNext : s.revenueGrowthNext); return g != null && g < v;
    }
    return false;
  }
  function ruleText(r) { var R0 = RULES.find(function (x) { return x[0] === r.k; }) || RULES[0]; return R0[1] + (R0[2] === null ? "" : (R0[2] === "$" ? "$" + r.v : r.v + (R0[2] || ""))); }
  function journalHits(journal, data, uni) {
    var out = [];
    Object.keys(journal || {}).forEach(function (t) { var q = quote(t, data, uni); (journal[t].rules || []).forEach(function (r) { if (checkRule(r, q)) out.push({ t: t, name: q ? q.name : t, text: ruleText(r) }); }); });
    return out;
  }
  function Journal(props) {
    var data = props.data, uni = props.uni, J = props.journal, setJ = props.setJournal;
    var _t = useState(props.preset || ""), cur = _t[0], setCur = _t[1];
    useEffect(function () { if (props.preset) setCur(props.preset); }, [props.preset]);
    var _r = useState({ k: "below", v: "" }), nr = _r[0], setNr = _r[1];
    var e0 = J[cur] || { thesis: "", rules: [] };
    function upd(t, patch) { var n = Object.assign({}, J); n[t] = Object.assign({ thesis: "", rules: [], created: new Date().toISOString().slice(0, 10) }, J[t] || {}, patch); setJ(n); }
    function addRule() { var R0 = RULES.find(function (x) { return x[0] === nr.k; }); if (R0[2] !== null && !(parseFloat(nr.v) > 0)) return; upd(cur, { rules: (e0.rules || []).concat([{ k: nr.k, v: R0[2] === null ? null : parseFloat(nr.v) }]) }); setNr({ k: nr.k, v: "" }); }
    function delRule(i) { upd(cur, { rules: e0.rules.filter(function (_, j) { return j !== i; }) }); }
    function delEntry(t) { var n = Object.assign({}, J); delete n[t]; setJ(n); if (cur === t) setCur(""); }
    var q = cur ? quote(cur, data, uni) : null;
    var R0 = RULES.find(function (x) { return x[0] === nr.k; });
    var sugg = q && q.deep ? [["below", +(q.d.entry * 0.85).toFixed(2)], ["overfair", 20], ["score", 50], ["sell", null]] : [];
    return html`<div>
      <p className="muted" style=${{ marginTop: 0 }}>לפני שקונים, כותבים למה – ומה יגרום לך למכור. כשאחד התנאים מתקיים, תופיע התראה בראש הדף. כך מחליטים מראש, בראש שקט, ולא בלחץ של יום ירידות.</p>
      <${TickerInput} data=${data} uni=${uni} btn="פתח יומן" ph="לאיזו מניה? סימול או שם" onOk=${function (T) { setCur(T); if (!J[T]) upd(T, {}); }}/>
      ${Object.keys(J).length ? html`<div style=${{ margin: "10px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>${Object.keys(J).map(function (t) {
        var hit = (J[t].rules || []).some(function (r) { return checkRule(r, quote(t, data, uni)); });
        return html`<button key=${t} className=${"chipbtn" + (t === cur ? " on" : "")} onClick=${function () { setCur(t); }}>${hit ? "⚠ " : ""}${t}</button>`; })}</div>` : null}
      ${cur && q ? html`<div className="jbox">
        <div style=${{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}><h3>${q.name} <span className="muted mono" style=${{ fontSize: 13 }}>${cur} · ${usd(q.price)}</span></h3><button className="x" onClick=${function () { delEntry(cur); }} aria-label="מחק יומן">✕</button></div>
        <label className="muted" style=${{ fontSize: 13 }} htmlFor="thesis">למה קניתי (או למה אני שוקל לקנות)?</label>
        <textarea id="thesis" rows="3" defaultValue=${e0.thesis} key=${"th-" + cur} onBlur=${function (ev) { upd(cur, { thesis: ev.target.value }); }} placeholder="למשל: הענן של מיקרוסופט צומח מעל 30%, ואני קונה כי המחיר מתחת לשווי ההוגן."></textarea>
        <div className="muted" style=${{ fontSize: 13, marginTop: 8 }}>אמכור / אבדוק מחדש אם…</div>
        <ul className="rules">${(e0.rules || []).map(function (r, i) { var hit = checkRule(r, q); return html`<li key=${i} className=${hit ? "hit" : ""}><span>${hit ? "⚠ התקיים: " : "✓ "}${ruleText(r)}</span><button className="x" onClick=${function () { delRule(i); }} aria-label="מחק תנאי">✕</button></li>`; })}</ul>
        <div className="tk-in">
          <select value=${nr.k} onChange=${function (ev) { setNr({ k: ev.target.value, v: "" }); }} aria-label="סוג תנאי">${RULES.map(function (x) { return html`<option key=${x[0]} value=${x[0]} disabled=${!q.deep && ["overfair", "score", "sell", "growth"].indexOf(x[0]) >= 0}>${x[1]}${x[2] === null ? "" : "…"}</option>`; })}</select>
          ${R0[2] !== null ? html`<input className="num-in" type="number" step="any" min="0" value=${nr.v} onInput=${function (ev) { setNr({ k: nr.k, v: ev.target.value }); }} placeholder=${R0[2] === "$" ? "מחיר $" : R0[2] === "%" ? "אחוז" : "ציון"} aria-label="ערך"/>` : null}
          <button className="btn" onClick=${addRule}>הוסף תנאי</button>
        </div>
        ${sugg.length && !(e0.rules || []).length ? html`<div className="muted" style=${{ fontSize: 12.5, marginTop: 8 }}>הצעות: ${sugg.map(function (x, i) { return html`<button key=${i} className="chipbtn" onClick=${function () { upd(cur, { rules: (e0.rules || []).concat([{ k: x[0], v: x[1] }]) }); }}>${ruleText({ k: x[0], v: x[1] })}</button>`; })}</div>` : null}
      </div>` : null}
    </div>`;
  }

  // ---------- portfolio risk & shekel view ----------
  function PortfolioRisk(props) {
    var data = props.data, rows = props.rows, fx = data.fx;
    var tot = rows.reduce(function (a, r) { return a + (r.val || 0); }, 0); if (!tot) return null;
    var beta = 0, s20 = 0, sR = 0, ilsCost = 0, ilsVal = 0, fxEff = 0, divInc = 0, unk = 0;
    var over = [];
    rows.forEach(function (r) {
      var w = (r.val || 0) / tot, q = r.q;
      var s = q && q.deep ? q.s : null, d = q && q.deep ? q.d : null;
      var b = s && s.beta != null ? s.beta : (s ? 2 : null); if (b == null) { unk += w; b = 1.3; }
      beta += w * b;
      var st = s ? C.stress(s, d) : { market20: -20 * b, rates1: -8 };
      s20 += w * st.market20; sR += w * st.rates1;
      if (s) { var z = C.sizing(s, d, props.style || "balanced"); if (w * 100 > z.maxPct + 0.5) over.push(q.name + " (" + pct(w * 100, 0) + " מול עד " + z.maxPct + "%)"); divInc += (r.val || 0) * (s.dividendYield || 0) / 100; }
      r.lots.forEach(function (l) { var f0 = fxAt(fx, l.date) || fx.now; ilsCost += l.qty * l.price * f0; if (r.px != null) { ilsVal += l.qty * r.px * fx.now; fxEff += l.qty * r.px * (fx.now - f0); } });
    });
    var ilsPl = ilsVal - ilsCost, tax = Math.max(0, ilsPl) * 0.25;
    function ils(v) { return (v < 0 ? "-" : "") + "₪" + Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 }); }
    return html`<div className="risk">
      <h3>בשקלים – מה באמת נכנס לכיס</h3>
      <div className="kpis">
        <div className="kpi"><div className="l">שווי בשקלים</div><div className="v">${N(ils(ilsVal))}</div><div className="s">לפי ₪${fx.now} לדולר</div></div>
        <div className="kpi"><div className="l">רווח/הפסד בשקלים</div><div className=${"v " + cls(ilsPl)}>${N(ils(ilsPl))}</div><div className="s">${pct(ilsCost ? ilsPl / ilsCost * 100 : 0, 1, true)}</div></div>
        <div className="kpi"><div className="l">מתוכו – השפעת הדולר</div><div className=${"v " + cls(fxEff)}>${N(ils(fxEff))}</div><div className="s">${fxEff < 0 ? "הדולר ירד מאז הקנייה" : "הדולר עלה מאז הקנייה"}</div></div>
        <div className="kpi"><div className="l">מס רווחי הון משוער (25%)</div><div className="v">${N(ils(tax))}</div><div className="s">נטו אחרי מס: ${ils(ilsPl - tax)}</div></div>
      </div>
      ${divInc > 0 ? html`<p style=${{ fontSize: 14 }}>דיבידנד צפוי בשנה: כ־${N(usd(divInc, 0))} ברוטו, כ־${N(usd(divInc * 0.75, 0))} נטו (25% מס במקור בארה"ב עם טופס W-8BEN, שמתקזז מהמס בישראל).</p>` : null}
      <h3 style=${{ marginTop: 16 }}>סיכון – מה יקרה לתיק אם…</h3>
      <div className="kpis">
        <div className="kpi"><div className="l">בטא של התיק</div><div className="v">${N(beta.toFixed(2))}</div><div className="s">${beta > 1.3 ? "תנודתי מהשוק" : beta < 0.8 ? "יציב מהשוק" : "דומה לשוק"}</div></div>
        <div className="kpi"><div className="l">השוק יורד 20%</div><div className="v down">${N(pct(s20, 0))}</div><div className="s">≈ ${usd(tot * s20 / 100, 0)}</div></div>
        <div className="kpi"><div className="l">ריבית ארוכה עולה 1%</div><div className="v down">${N(pct(sR, 0))}</div><div className="s">מניות יקרות נפגעות יותר</div></div>
        <div className="kpi"><div className="l">הדולר יורד 10% מול השקל</div><div className="v down">${N("-10%")}</div><div className="s">בשקלים ≈ ${ils(-ilsVal * 0.1)}</div></div>
      </div>
      ${over.length ? html`<div className="note-warn">⚠ גדול מגודל הפוזיציה המומלץ לפי הסיכון: ${over.join(" · ")}.</div>` : null}
      <p className="method">הערכות גסות לצורך תחושת סדר גודל, לא תחזית: ירידת שוק מוכפלת בבטא של כל מניה; רגישות לריבית לפי המכפיל העתידי (מעל 30: ‎-12%, ‏20–30: ‎-8%, מתחת: ‎-4%). העלות בשקלים מחושבת לפי ממוצע שער הדולר בחודש הקנייה. מס רווחי הון בישראל הוא 25% על הרווח הריאלי, ויש כללים מיוחדים לניירות ערך זרים – לבדוק מול רואה חשבון או טופס 867 של הבנק.${unk > 0 ? " למניות בלי ניתוח מלא הונחה בטא 1.3." : ""}</p>
    </div>`;
  }

  // ---------- screener ----------
  function Screener(props) {
    var data = props.data;
    var _f = useState({ greens: 0, below: false, rec: "", sec: "", maxGap: "" }), f = _f[0], setF = _f[1];
    var _s = useState("score"), sort = _s[0], setSort = _s[1];
    var all = data.order.map(function (t) { var s = data.stocks[t], d = C.derive(s), P = C.pillars(s, d, props.mkt1y); return { t: t, s: s, d: d, P: P, g: P.filter(function (p) { return p.light === "g"; }).length, gap: (s.price / d.entry - 1) * 100 }; });
    var secs = Object.keys(all.reduce(function (a, x) { a[x.s.sector] = 1; return a; }, {}));
    var rows = all.filter(function (x) {
      return x.g >= f.greens && (!f.below || x.s.price < x.d.fair) && (!f.rec || x.d.rec.key === f.rec || (f.rec === "buy" && x.d.rec.key === "sb")) && (!f.sec || x.s.sector === f.sec) && (f.maxGap === "" || x.gap <= parseFloat(f.maxGap));
    }).sort(function (a, b) { return sort === "score" ? b.d.score - a.d.score : sort === "upside" ? b.d.upside - a.d.upside : sort === "gap" ? a.gap - b.gap : b.g - a.g; });
    function set(k, v) { var n = Object.assign({}, f); n[k] = v; setF(n); }
    return html`<section className="card" id="sec-screener">
      <div className="sec-h"><div><div className="kicker">סורק</div><h2>מצא מניות לפי הכללים שלך</h2></div><div className="hint">${data.order.length} מניות עם ניתוח מלא · אחרי כל יום מסחר נוספות עוד 3</div></div>
      <div className="scr-f">
        <label>רמזורים ירוקים לפחות<select value=${f.greens} onChange=${function (ev) { set("greens", +ev.target.value); }}>${[0, 2, 3, 4, 5, 6].map(function (n) { return html`<option key=${n} value=${n}>${n === 0 ? "הכול" : n + " מתוך 6"}</option>`; })}</select></label>
        <label>המלצת המודל<select value=${f.rec} onChange=${function (ev) { set("rec", ev.target.value); }}><option value="">הכול</option><option value="buy">קנייה או קנייה חזקה</option><option value="sb">קנייה חזקה</option><option value="hold">החזק</option><option value="sell">מכירה</option></select></label>
        <label>סקטור<select value=${f.sec} onChange=${function (ev) { set("sec", ev.target.value); }}><option value="">הכול</option>${secs.map(function (x) { return html`<option key=${x} value=${x}>${x}</option>`; })}</select></label>
        <label>מרחק ממחיר הכניסה עד (%)<input className="num-in" type="number" value=${f.maxGap} onInput=${function (ev) { set("maxGap", ev.target.value); }} placeholder="למשל 10"/></label>
        <label className="chk"><input type="checkbox" checked=${f.below} onChange=${function (ev) { set("below", ev.target.checked); }}/> רק מתחת לשווי ההוגן</label>
      </div>
      <div style=${{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "8px 0" }}><span className="muted" style=${{ fontSize: 13 }}>מיון:</span>
        <div className="seg">${[["score", "ציון"], ["upside", "פוטנציאל"], ["gap", "קרוב למחיר כניסה"], ["greens", "רמזורים"]].map(function (x) { return html`<button key=${x[0]} className=${sort === x[0] ? "on" : ""} onClick=${function () { setSort(x[0]); }}>${x[1]}</button>`; })}</div></div>
      ${!rows.length ? html`<p className="muted">אף מניה לא עומדת בכל התנאים. נסו לרכך אחד מהם.</p>` : html`<div className="tbl-wrap"><table className="t">
        <thead><tr><th>מניה</th><th>רמזורים</th><th className="n">ציון</th><th>המלצה</th><th className="n">פוטנציאל</th><th className="n">ממחיר הכניסה</th></tr></thead>
        <tbody>${rows.map(function (x) { return html`<tr key=${x.t}>
          <td><button className="lnk" onClick=${function () { props.onPick(x.t); }}>${x.s.nameHe}</button> <span className="muted mono" style=${{ fontSize: 12 }}>${x.t}</span></td>
          <td><span className="lights sm">${x.P.map(function (p) { return html`<span key=${p.key} className="light" style=${{ background: LIGHT[p.light][1] }} title=${p.q}></span>`; })}</span></td>
          <td className="n">${x.d.score}</td><td className=${x.d.rec.cls}>${x.d.rec.he}</td>
          <td className=${"n " + cls(x.d.upside)}>${pct(x.d.upside * 100, 1, true)}</td>
          <td className=${"n " + (x.gap <= 0 ? "up" : "")}>${x.gap <= 0 ? "מתחת ✓" : pct(x.gap, 1, true)}</td></tr>`; })}</tbody></table></div>`}
      <p className="method">לכל 6,000+ המניות בוול סטריט (מחיר, שווי שוק, סקטור) – ראו "דפדוף לפי קטגוריות" למטה.</p>
    </section>`;
  }

  // ---------- extended market gauges ----------
  function Markets(props) {
    var M = props.markets; if (!M) return null;
    return html`<section className="card" id="sec-markets">
      <div className="sec-h"><div><div className="kicker">מדדי שוק</div><h2>ריבית, פחד ודולר – מה הרוח בשוק</h2></div><div className="hint"><${Fresh} k="daily"/></div></div>
      <div className="macro">${M.items.map(function (x) { return html`<div className="kpi" key=${x.k} style=${{ padding: 14 }}>
        <div className="l">${x.label}</div><div className="v" style=${{ fontSize: 22 }}>${N(x.value != null ? (x.unit === "₪" ? "₪" + x.value : x.value + (x.unit === "%" ? "%" : x.unit ? " " + x.unit : "")) : x.text)}</div>
        <div style=${{ fontSize: 13.5, marginTop: 4 }}>${x.note} <a href=${x.src} target="_blank" rel="noopener" style=${{ fontSize: 12 }}>מקור ↗</a></div>
        <div className="muted" style=${{ fontSize: 11.5 }}>${x.date.length === 7 ? "ממוצע " + x.date : dt(x.date)}</div></div>`; })}</div>
    </section>`;
  }

  // ---------- model track record ----------
  function TrackRecord(props) {
    var data = props.data, T = data.track; if (!T || !T.log) return null;
    var rows = T.log.slice().reverse().map(function (x) { var s = data.stocks[x.t]; var now = s ? s.price : null; return Object.assign({}, x, { now: now, chg: now != null ? (now / x.price - 1) * 100 : null }); });
    var spx = (data.indices || []).find(function (x) { return x.id === "SPX"; });
    var days = Math.max(0, -daysTo(T.since));
    return html`<section className="card" id="sec-track">
      <div className="sec-h"><div><div className="kicker">שקיפות</div><h2>ביצועי המודל – כולל הטעויות</h2></div><div className="hint">היומן התחיל ב־${dt(T.since)}${days ? " · לפני " + days + " ימים" : " · היום"}</div></div>
      <p className="muted" style=${{ marginTop: 0 }}>${T.note} רק אחרי חודשים של נתונים אפשר לשפוט אם המודל עוזר; עד אז – קחו את ההמלצות כנקודת פתיחה לבדיקה.</p>
      <div className="tbl-wrap"><table className="t">
        <thead><tr><th>תאריך</th><th>מניה</th><th>המלצה אז</th><th className="n">מחיר אז</th><th className="n">שווי הוגן אז</th><th className="n">מחיר היום</th><th className="n">שינוי</th></tr></thead>
        <tbody>${rows.map(function (x, i) { var good = x.chg == null ? null : (x.rec === "sb" || x.rec === "buy") ? x.chg > 0 : x.rec === "sell" ? x.chg < 0 : null;
          return html`<tr key=${i}><td>${dt(x.date)}</td><td><button className="lnk" onClick=${function () { props.onPick(x.t); }}>${(data.stocks[x.t] || {}).nameHe || x.t}</button></td><td>${x.recHe}</td><td className="n">${usd(x.price)}</td><td className="n">${usd(x.fair, 0)}</td><td className="n">${x.now != null ? usd(x.now) : "—"}</td>
          <td className=${"n " + cls(x.chg)}>${x.chg != null ? pct(x.chg, 1, true) : "—"}${good === true ? " ✓" : good === false ? " ✗" : ""}</td></tr>`; })}</tbody></table></div>
      ${spx ? html`<p className="method">להשוואה: S&P 500 עומד היום על ${spx.level.toLocaleString("en-US", { maximumFractionDigits: 0 })}. ✓ = ההמלצה (קנייה/מכירה) הלכה בכיוון הנכון עד עכשיו, ✗ = בכיוון ההפוך; ל"החזק" אין סימון.</p>` : null}
    </section>`;
  }

  // ---------- share card as an image ----------
  function shareCard(s, d, P) {
    var W = 1080, H = 1080, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var x = cv.getContext("2d");
    function draw() {
      x.fillStyle = "#0F172A"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#131C31"; x.fillRect(48, 48, W - 96, H - 96);
      x.direction = "rtl"; x.textAlign = "right"; var R = W - 96;
      x.fillStyle = "#E9B949"; x.font = "900 44px 'Frank Ruhl Libre', serif"; x.fillText("הדקה הכלכלית של שמש", R, 130);
      x.fillStyle = "#93A0B8"; x.font = "500 26px Heebo, Arial"; x.fillText("96% דיוק · כרטיס החלטה · " + dt(s.priceDate), R, 172);
      x.fillStyle = "#E5EAF3"; x.font = "900 76px 'Frank Ruhl Libre', serif"; x.fillText(s.nameHe, R, 290);
      x.font = "600 34px Heebo, Arial"; x.fillStyle = "#93A0B8"; x.fillText(s.ticker + " · " + usd(s.price), R, 340);
      var rc = { "c-sb": "#34D399", "c-b": "#10B981", "c-h": "#F59E0B", "c-s": "#EF4444" }[d.rec.cls] || "#E5EAF3";
      x.fillStyle = rc; x.font = "900 64px 'Frank Ruhl Libre', serif"; x.fillText(d.rec.he, R, 440);
      x.fillStyle = "#E5EAF3"; x.font = "700 34px Heebo, Arial"; x.fillText("ציון " + d.score + "/100 · שווי הוגן " + usd(d.fair, 0) + " · כניסה " + usd(d.entry, 0), R, 500);
      var C2 = { g: "#10B981", y: "#F59E0B", r: "#EF4444", n: "#93A0B8" };
      P.forEach(function (p, i) {
        var y = 580 + i * 62; x.beginPath(); x.fillStyle = C2[p.light]; x.arc(R - 16, y - 12, 16, 0, Math.PI * 2); x.fill();
        x.fillStyle = "#E5EAF3"; x.font = "600 32px Heebo, Arial"; x.fillText(p.q, R - 50, y);
        x.fillStyle = C2[p.light]; x.textAlign = "left"; x.fillText(LIGHT[p.light][0], 120, y); x.textAlign = "right";
      });
      x.fillStyle = "#93A0B8"; x.font = "400 22px Heebo, Arial"; x.fillText("מידע לימודי, לא ייעוץ השקעות. מקורות: StockAnalysis, Morningstar, Nasdaq.", R, H - 80);
      cv.toBlob(function (b) {
        if (!b) return;
        var file = null; try { file = new File([b], "shemesh-" + s.ticker + ".png", { type: "image/png" }); } catch (e1) { }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: s.nameHe + " – הדקה הכלכלית של שמש" }).catch(function () { }); return; }
        var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "shemesh-" + s.ticker + ".png"; a.click();
      }, "image/png");
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw, draw); else draw();
  }

  // ---------- browser notifications (while the site/app is open) ----------
  function useNotify(hits) {
    useEffect(function () {
      if (!hits.length || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      var key = "shemesh-notified-" + new Date().toISOString().slice(0, 10), sig = hits.map(function (h) { return h.t + h.text; }).join("|");
      try { if (localStorage.getItem(key) === sig) return; localStorage.setItem(key, sig); } catch (e1) { }
      try { new Notification("הדקה הכלכלית של שמש", { body: hits.map(function (h) { return h.name + ": " + h.text; }).join("\n"), icon: "icon-192.png" }); } catch (e2) { }
    }, [hits.map(function (h) { return h.t + h.text; }).join("|")]);
  }

  // ---------- mobile bottom navigation ----------
  function BottomNav(props) {
    function go(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    return html`<nav className="bnav" aria-label="ניווט מהיר">
      <button onClick=${function () { window.scrollTo({ top: 0, behavior: "smooth" }); }}><span aria-hidden="true">⌂</span>בית</button>
      <button onClick=${function () { var i = document.getElementById("q"); if (i) { i.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(function () { i.focus(); }, 300); } }}><span aria-hidden="true">⌕</span>חיפוש</button>
      <button onClick=${function () { props.openTool("watch"); }}><span aria-hidden="true">★</span>מעקב${props.alerts ? html`<b className="badge">${props.alerts}</b>` : null}</button>
      <button onClick=${function () { props.openTool("port"); }}><span aria-hidden="true">◔</span>התיק</button>
      <button onClick=${function () { go("sec-screener"); }}><span aria-hidden="true">⚲</span>סורק</button>
    </nav>`;
  }

  // ================= round 4: new navigation, stock layers, legends, paper portfolio, learning =================
  var GLOSS = {
    stock: ["מניה", "חלק קטן בבעלות על חברה. כשהחברה מרוויחה וגדלה – המניה שווה יותר, וחלק מהרווח יכול לחזור אליך כדיבידנד."],
    index: ["מדד", "סל של הרבה מניות שמייצג שוק שלם. ה־S&P 500, למשל, כולל את 500 החברות הגדולות בארה״ב."],
    pe: ["מכפיל רווח (P/E)", "כמה שנים של רווח משלמים על המניה: מחיר המניה חלקי הרווח למניה. מכפיל 20 = משלמים פי 20 מהרווח השנתי."],
    peg: ["PEG", "מכפיל הרווח חלקי קצב הצמיחה. מתחת ל־1 נחשב זול ביחס לצמיחה (שיטה של פיטר לינץ׳)."],
    fair: ["שווי הוגן", "הערכה של כמה המניה ״באמת״ שווה. אצלנו: ממוצע של קונצנזוס האנליסטים, Morningstar ו־4 בנקים גדולים."],
    mos: ["מרווח ביטחון", "הנחה שדורשים מהשווי ההוגן, כדי שגם אם טעינו בהערכה – לא נשלם יותר מדי. ככל שהמניה מסוכנת יותר, המרווח גדול יותר."],
    entry: ["מחיר כניסה", "השווי ההוגן פחות מרווח הביטחון. מתחת למחיר הזה, המודל רואה במניה הזדמנות."],
    roic: ["תשואה על ההון (ROIC)", "כמה רווח החברה מייצרת מכל דולר שהושקע בה. מעל 15% נחשב עסק איכותי."],
    moat: ["חפיר", "יתרון שקשה למתחרים להעתיק – מותג, טכנולוגיה, רשת לקוחות. מונח של וורן באפט."],
    beta: ["בטא", "כמה המניה זזה ביחס לשוק. בטא 2 = כשהשוק זז 1%, המניה זזה בממוצע 2%."],
    div: ["דיבידנד", "חלק מהרווח שהחברה מחלקת לבעלי המניות במזומן, בדרך כלל כל רבעון."],
    etf: ["קרן מחקה (ETF)", "קרן שקונה בבת אחת את כל המניות במדד. דמי ניהול נמוכים ופיזור מיידי."],
    vix: ["מדד הפחד (VIX)", "כמה תנודתיות השוק מצפה בחודש הקרוב. מתחת ל־20 רגוע, מעל 30 פאניקה."],
    fcf: ["תזרים חופשי", "המזומן שנשאר לחברה אחרי כל ההוצאות וההשקעות. ממנו משלמים דיבידנדים וקונים מניות בחזרה."],
    spread: ["פיזור", "לא לשים את כל הביצים בסל אחד: כמה מניות, מכמה תחומים, כך שנפילה של אחת לא מפילה את כל התיק."],
    compound: ["ריבית דריבית", "רווח על רווח: התשואה של השנה מצטרפת לקרן, ובשנה הבאה מרוויחים גם עליה. ככל שהזמן ארוך יותר – האפקט חזק יותר."],
    fee: ["דמי ניהול", "עמלה שנתית שגובה הקרן או הבנק מכל הסכום. 1% בשנה נשמע מעט, אבל על פני 30 שנה זה יכול להיות חמישית מהכסף."],
    cgt: ["מס רווחי הון", "בישראל משלמים 25% מהרווח הריאלי כשמוכרים מניה ברווח. כל עוד לא מכרת – לא משלמים."]
  };
  function Term(props) {
    var _o = useState(false), open = _o[0], setOpen = _o[1];
    var g = GLOSS[props.k], kids = props.children; if (Array.isArray(kids) && !kids.length) kids = null; if (!g) return kids || null;
    return html`<span className="term"><button className="term-b" aria-expanded=${open} onClick=${function () { setOpen(!open); }}>${kids || g[0]}</button>${open ? html`<span className="term-pop" role="note"><b>${g[0]}:</b> ${g[1]}</span>` : null}</span>`;
  }

  // ---------- main navigation ----------
  var NAV = [["home", "בית", "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"], ["stock", "מניות", "M3 17l6-6 4 4 8-8M15 7h6v6"], ["mine", "שלי", "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"], ["discover", "גלה", "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5"], ["learn", "למד", "M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 19V5"]];
  function NavBar(props) {
    return html`<nav className="mainnav" aria-label="ניווט ראשי">${NAV.map(function (n) {
      var on = props.screen === n[0];
      return html`<button key=${n[0]} aria-current=${on ? "page" : "false"} className=${on ? "on" : ""} onClick=${function () { props.go(n[0]); }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${n[2]}/></svg>
        <span>${n[1]}</span>${n[0] === "mine" && props.alerts ? html`<b className="badge">${props.alerts}</b>` : null}</button>`;
    })}</nav>`;
  }
  function TopTools(props) {
    return html`<div className="toptools">
      <${ModeSwitch} mode=${props.mode} setMode=${props.setMode}/>
      <button className="chipbtn big" aria-pressed=${props.big} onClick=${function () { props.setBig(!props.big); }}>${props.big ? "א− טקסט רגיל" : "א+ הגדלת טקסט"}</button>
    </div>`;
  }

  // ---------- stock: top layer ----------
  function StockSummary(props) {
    var s = props.s, d = props.d, P = props.P, V = C.verdictLine(P);
    var WORD = { quality: ["חזק", "סביר", "חלש"], growth: ["מהר", "מתון", "לא"], health: ["חזק", "סביר", "חלש"], valuation: ["כן", "בערך", "יקר"], sentiment: ["חיובי", "מעורב", "שלילי"], risk: ["נמוך", "בינוני", "גבוה"] };
    var Q = { quality: "עסק טוב?", growth: "צומח?", health: "בריא פיננסית?", valuation: "מחיר הגיוני?", sentiment: "מה השוק חושב?", risk: "כמה מסוכן?" };
    var below = s.price <= d.entry;
    return html`<section className="card sum" aria-labelledby="sum-h">
      <div className="sum-top">
        <div><h2 id="sum-h" className="sum-name">${s.nameHe}</h2><div className="muted">${s.ticker} · ${s.sector}</div></div>
        <div className="sum-px"><div className="v">${N(usd(s.price))}</div><div className="muted" style=${{ fontSize: 12.5 }}>סגירה ${dt(s.priceDate)}</div></div>
      </div>
      <p className="sum-line">${V.text}</p>
      <div className="sum-pills"><span className=${"pill " + d.rec.cls}>${d.rec.he}</span><span className="pill">ציון ${d.score}/100</span></div>
      <div className="sum-grid">
        <div className="six">${P.map(function (p) {
          var i = p.light === "g" ? 0 : p.light === "y" ? 1 : 2;
          return html`<div key=${p.key} className="six-r"><span className="light" style=${{ background: LIGHT[p.light][1] }} aria-hidden="true"></span><span className="q">${Q[p.key] || p.q}</span><b style=${{ color: LIGHT[p.light][1] }}>${p.light === "n" ? "אין נתון" : WORD[p.key] ? WORD[p.key][i] : LIGHT[p.light][0]}</b></div>`;
        })}<button className="lnk" style=${{ fontSize: 13, marginTop: 6 }} onClick=${props.onMore}>ההסבר והמספרים של כל שאלה ←</button></div>
        <div className="entry-box">
          <div className="eb-row"><span><${Term} k="entry"/></span><b className="v">${N(usd(d.entry, 0))}</b></div>
          <p>${below ? html`המחיר היום <b className="up">מתחת למחיר הכניסה</b>.` : html`המחיר היום גבוה ב־${N(pct((s.price / d.entry - 1) * 100, 0))} ממחיר הכניסה.`} מחיר הכניסה = <${Term} k="fair"/> (${usd(d.fair, 0)}) פחות <${Term} k="mos"/> של ${Math.round(d.mos * 100)}%.</p>
        </div>
      </div>
    </section>`;
  }
  var STABS = [["sum", "סיכום"], ["legends", "הגדולים"], ["chart", "גרף"], ["fin", "כספים"], ["analysts", "אנליסטים"], ["tools", "כלים"]];
  function StockTabs(props) {
    return html`<nav className="stabs" aria-label="חלקי הניתוח">${STABS.map(function (t) { var on = props.tab === t[0]; return html`<button key=${t[0]} aria-current=${on ? "page" : "false"} className=${on ? "on" : ""} onClick=${function () { props.setTab(t[0]); }}>${t[1]}</button>`; })}</nav>`;
  }

  // ---------- legends & featured analysts ----------
  function Legends(props) {
    var s = props.s, d = props.d, data = props.data;
    var vix = ((data.markets && data.markets.items) || []).find(function (x) { return x.k === "vix"; });
    var Lr = C.lenses(s, d, { peHist: C.peHistory(s, d, data.history), vix: vix ? vix.value : null });
    var T = Lr.tally, V = C.verdictLine(C.pillars(s, d, props.mkt1y));
    var head = T.g >= 4 ? "רוב העדשות של המשקיעים הגדולים רואות כאן הזדמנות." : T.g >= 3 ? "רוב העדשות חיוביות, עם הסתייגויות." : T.r >= 3 ? "רוב העדשות מסתייגות מהמניה הזו." : "התמונה מעורבת – יש נקודות חזקות וחלשות.";
    var cav = Lr.list.filter(function (x) { return x.v === "y" || x.v === "r"; }).map(function (x) { return x.name + ": " + x.line; });
    var VC = { g: ["בעד", "var(--green)"], y: ["בזהירות", "var(--amber)"], r: ["נגד", "var(--red)"], n: ["אין נתון", "var(--muted)"] };
    return html`<section className="card" aria-labelledby="lg-h">
      <div className="ours">
        <div className="kicker" style=${{ color: "var(--gold)" }}>חוות הדעת שלנו</div>
        <p style=${{ margin: "6px 0", fontSize: 16.5, lineHeight: 1.55 }}>${head} ${V.text}${cav.length ? " ההסתייגות העיקרית – " + cav[0].replace(/^[^:]+: /, "") : ""}</p>
        <div style=${{ display: "flex", gap: 6, flexWrap: "wrap" }}><span className="pill c-sb">${T.g} בעד</span><span className="pill c-h">${T.y} בזהירות</span><span className="pill c-s">${T.r} נגד</span></div>
      </div>
      <h2 id="lg-h" style=${{ margin: "18px 0 4px" }}>מה היו אומרים המשקיעים הגדולים?</h2>
      <p className="muted" style=${{ marginTop: 0, fontSize: 13.5 }}>בדיקה של המניה לפי העקרונות שכל אחד מהם פרסם בספרים ובמכתבים. זה לא ציטוט, ולא דעה שלהם על המניה הזו.</p>
      <div className="lenses">${Lr.list.map(function (l) {
        return html`<details key=${l.id} className="lens"><summary>
          <span className="ini" aria-hidden="true">${l.ini}</span>
          <span className="lt"><b>${l.name}</b><span>${l.line}</span></span>
          <b style=${{ color: VC[l.v][1], whiteSpace: "nowrap" }}>${VC[l.v][0]}</b></summary>
          <div className="lens-b"><b>העיקרון:</b> ${l.rule}<br/><b>הנתונים:</b> ${l.facts || "—"}</div></details>`;
      })}</div>
      <${FeaturedAnalysts} t=${s.ticker} extras=${props.extras}/>
      <p className="method">העדשות מחושבות אוטומטית מהנתונים של המניה (חפיר ואי־ודאות מ־Morningstar, תשואה על ההון, PEG, מכפילים, חוב, סנטימנט האנליסטים ותרחישי המחיר). זה כלי לימוד שמראה איך כל גישה חושבת – לא המלצה ולא ציטוט.</p>
    </section>`;
  }
  function FeaturedAnalysts(props) {
    var X = props.extras; if (!X) return null;
    var rows = (X.coverage && X.coverage[props.t]) || [];
    var all = Object.keys(X.analysts || {}).map(function (k) { return X.analysts[k]; });
    return html`<div style=${{ marginTop: 18 }}>
      <h3 style=${{ margin: "0 0 6px" }}>אנליסטים מובילים שמכסים את המניה</h3>
      ${rows.length ? rows.map(function (r, i) {
        var A = X.analysts[r.a] || {}, old = daysTo(r.date) < -365;
        return html`<div key=${i} className="fa">
          <div className="fa-top"><b>${A.name}</b><span className=${"pill " + (/buy|outperform|overweight/i.test(r.rating) ? "c-sb" : /sell|under/i.test(r.rating) ? "c-s" : "c-h")}>${r.he}</span></div>
          <div className="muted" style=${{ fontSize: 13.5 }}>${A.firm} · ${A.focus}${r.target ? " · יעד " + usd(r.target, 0) : ""} · ${r.dateLabel || dt(r.date)}</div>
          ${old ? html`<div style=${{ fontSize: 12.5, color: "var(--amber)" }}>הדירוג האחרון שמצאנו בשמו ישן משנה – ייתכן שאינו מעודכן</div>` : null}
          <a href=${r.src} target="_blank" rel="noopener" style=${{ fontSize: 12.5 }}>מקור ↗</a></div>`;
      }) : html`<p className="muted" style=${{ fontSize: 13.5, margin: 0 }}>אף אחד מהאנליסטים שאנחנו עוקבים אחריהם (${all.map(function (a) { return a.name; }).join(", ")}) לא מכסה את המניה הזו.</p>`}
    </div>`;
  }

  // ---------- paper portfolio ----------
  var CHECK = ["אני מבין מה החברה עושה ואיך היא מרוויחה", "בדקתי את מחיר הכניסה והשווי ההוגן", "החלטתי כמה אחוז מהתיק זה יהיה", "החלטתי מתי אמכור (ברווח וגם בהפסד)", "אני יודע למה דווקא עכשיו"];
  function paperFee(P, amt) { return P.fees ? Math.max(5, amt * 0.001) : 0; }
  function PaperSetup(props) {
    var fx = props.data.fx || { now: 3.15 };
    var _a = useState(200000), amt = _a[0], setAmt = _a[1];
    var _c = useState("usd"), cur = _c[0], setCur = _c[1];
    var _o = useState({ fees: true, tax: true, bench: true }), o = _o[0], setO = _o[1];
    var spx = (props.data.indices || []).find(function (x) { return x.id === "SPX"; });
    function open() {
      var usdAmt = cur === "ils" ? amt / fx.now : amt;
      props.setP({ v: 1, start: amt, startUsd: usdAmt, cur: cur, fx0: fx.now, fees: o.fees, tax: o.tax, bench: o.bench, date: new Date().toISOString().slice(0, 10), spx0: spx ? spx.level : null, cash: usdAmt, lots: [], trades: [], realized: 0, taxPaid: 0, feesPaid: 0 });
    }
    function tog(k) { var n = Object.assign({}, o); n[k] = !n[k]; setO(n); }
    var sym = cur === "ils" ? "₪" : "$";
    return html`<div className="paper-setup">
      <span className="pill" style=${{ color: "#8BB6FF" }}>כסף וירטואלי · בלי סיכון</span>
      <h3 style=${{ fontSize: 24, margin: "8px 0 4px" }}>התיק הניסיוני שלך</h3>
      <p style=${{ marginTop: 0 }}>מתאמנים על השקעות בלי לסכן שקל: קונים ומוכרים מניות אמיתיות במחירים אמיתיים, אבל עם כסף מדומה. כך לומדים איך זה מרגיש לפני שמשקיעים באמת.</p>
      <label htmlFor="pamt" style=${{ fontWeight: 700 }}>עם כמה כסף להתחיל?</label>
      <div className="paper-amt">${N(sym + amt.toLocaleString("en-US"))}</div>
      <input id="pamt" type="range" min="100000" max="500000" step="50000" value=${amt} onInput=${function (ev) { setAmt(+ev.target.value); }} style=${{ width: "100%", accentColor: "var(--gold)" }}/>
      <div className="seg" style=${{ margin: "10px 0" }}>${[["usd", "דולרים ($)"], ["ils", "שקלים (₪)"]].map(function (c) { return html`<button key=${c[0]} className=${cur === c[0] ? "on" : ""} onClick=${function () { setCur(c[0]); }}>${c[1]}</button>`; })}</div>
      ${[["fees", "עמלות קנייה ומכירה", "כמו בבית השקעות: 0.1% מכל עסקה, מינימום $5"], ["tax", "מס רווחי הון במכירה", "25% מהרווח – כדי לראות כמה באמת נשאר"], ["bench", "השוואה ל־S&P 500", "האם הייתי מרוויח יותר אילו פשוט קניתי את המדד?"]].map(function (x) {
        return html`<label key=${x[0]} className="opt"><input type="checkbox" checked=${o[x[0]]} onChange=${function () { tog(x[0]); }}/><span><b>${x[1]}</b><br/><span className="muted" style=${{ fontSize: 13 }}>${x[2]}</span></span></label>`;
      })}
      <button className="btn" style=${{ width: "100%", minHeight: 52, fontSize: 17, marginTop: 10 }} onClick=${open}>פתח את התיק הניסיוני</button>
      <p className="muted" style=${{ fontSize: 12.5, textAlign: "center" }}>אפשר לאפס ולהתחיל מחדש בכל רגע. אימון בלבד, לא ייעוץ השקעות.</p>
    </div>`;
  }
  function PaperBuy(props) {
    var P = props.P, q = props.q, data = props.data;
    var _c = useState(CHECK.map(function () { return false; })), ch = _c[0], setCh = _c[1];
    var _r = useState(""), reason = _r[0], setReason = _r[1];
    var _a = useState(""), amt = _a[0], setAmt = _a[1];
    var a = parseFloat(amt) || 0, qty = q.price ? a / q.price : 0, fee = a ? paperFee(P, a) : 0;
    var ok = ch.every(Boolean) && reason.trim().length >= 5 && a > 0 && a + fee <= P.cash + 0.001;
    var V = q.deep ? C.verdictLine(C.pillars(q.s, q.d, props.mkt1y)) : null;
    var Lr = q.deep ? C.lenses(q.s, q.d, { peHist: C.peHistory(q.s, q.d, data.history) }) : null;
    var Z = q.deep ? C.sizing(q.s, q.d, load("shemesh-style", "balanced")) : null;
    var tot = props.total, w = tot ? a / tot * 100 : 0;
    return html`<div className="paper-panel">
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h3 style=${{ margin: 0 }}>קנייה: ${q.name}</h3><b>${N(usd(q.price))}</b></div>
      ${q.deep ? html`<div className="ours" style=${{ marginTop: 10 }}>
        <div className="kicker" style=${{ color: "var(--gold)" }}>חוות הדעת שלנו</div>
        <p style=${{ margin: "4px 0" }}>${V.text}</p>
        <div className="muted" style=${{ fontSize: 13 }}>המלצת המודל: <b>${q.d.rec.he}</b> · מחיר כניסה ${usd(q.d.entry, 0)} · המשקיעים הגדולים: ${Lr.tally.g} בעד, ${Lr.tally.y} בזהירות, ${Lr.tally.r} נגד</div>
      </div>` : html`<p className="muted">למניה הזו עדיין אין ניתוח מלא – רק מחיר. כדאי לבדוק אותה לעומק לפני שקונים.</p>`}
      <fieldset className="checklist"><legend>רשימת בדיקה לפני קנייה</legend>${CHECK.map(function (c, i) {
        return html`<label key=${i}><input type="checkbox" checked=${ch[i]} onChange=${function () { var n = ch.slice(); n[i] = !n[i]; setCh(n); }}/> ${c}</label>`;
      })}</fieldset>
      <label htmlFor="preason" style=${{ fontWeight: 700 }}>למה אתה קונה? (נשמר ביומן ההשקעה)</label>
      <textarea id="preason" rows="2" value=${reason} onInput=${function (ev) { setReason(ev.target.value); }} placeholder="למשל: עסק חזק, המחיר מתחת למחיר הכניסה, ואני מוכן להחזיק שנתיים."></textarea>
      <div className="tk-in" style=${{ marginTop: 8 }}>
        <label htmlFor="pamt2" className="muted">סכום ($)</label>
        <input id="pamt2" className="num-in" type="number" min="0" step="100" value=${amt} onInput=${function (ev) { setAmt(ev.target.value); }} placeholder=${"עד " + Math.floor(P.cash).toLocaleString("en-US")}/>
        <span className="muted" style=${{ fontSize: 13 }}>${a ? "≈ " + qty.toFixed(qty < 10 ? 2 : 0) + " מניות · עמלה " + usd(fee, 2) + " · " + pct(w, 1) + " מהתיק" : ""}</span>
      </div>
      ${Z && w > Z.maxPct + 0.5 ? html`<div className="note-warn" style=${{ marginTop: 8 }}>⚠ זה ${pct(w, 0)} מהתיק. לפי הסיכון של המניה מומלץ עד ${Z.maxPct}%. מותר – זה אימון – אבל שים לב לריכוז.</div>` : null}
      ${a + fee > P.cash ? html`<div className="down" style=${{ fontSize: 13 }}>אין מספיק מזומן פנוי.</div>` : null}
      <div style=${{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn" disabled=${!ok} onClick=${function () { props.onBuy(q, a, fee, reason.trim()); }}>אשר קנייה</button>
        <button className="btn ghost" onClick=${props.onCancel}>ביטול</button>
      </div>
      ${!ok ? html`<p className="muted" style=${{ fontSize: 12.5 }}>כדי לאשר: לסמן את כל חמש השאלות, לכתוב למה, ולבחור סכום.</p>` : null}
    </div>`;
  }
  function PaperPortfolio(props) {
    var data = props.data, uni = props.uni, fx = data.fx || { now: 3.15 };
    var _p = useStored("shemesh-paper", null), P = _p[0], setP = _p[1];
    var _b = useState(null), buyT = _b[0], setBuyT = _b[1];
    var _s = useState(null), sellT = _s[0], setSellT = _s[1];
    var _sq = useState(""), sellQ = _sq[0], setSellQ = _sq[1];
    if (!P) return e(PaperSetup, { data: data, setP: setP });
    var spx = (data.indices || []).find(function (x) { return x.id === "SPX"; });
    var g = {}; P.lots.forEach(function (l) { (g[l.t] = g[l.t] || []).push(l); });
    var rows = Object.keys(g).map(function (t) {
      var q = quote(t, data, uni), qty = 0, cost = 0; g[t].forEach(function (l) { qty += l.qty; cost += l.qty * l.price; });
      var px = q ? q.price : cost / qty, val = qty * px;
      var sec = q && q.deep ? q.s.sector : (uni && uni.map[t] ? secHe(uni, uni.map[t][3]) : "אחר");
      return { t: t, q: q, qty: qty, cost: cost, avg: cost / qty, px: px, val: val, pl: val - cost, sec: sec };
    }).filter(function (r) { return r.qty > 1e-9; });
    var inv = rows.reduce(function (a, r) { return a + r.val; }, 0), tot = P.cash + inv;
    var ret = (tot / P.startUsd - 1) * 100, spxRet = P.spx0 && spx ? (spx.level / P.spx0 - 1) * 100 : null;
    var ils = P.cur === "ils";
    function money(vUsd, d0) { return ils ? "₪" + Math.round(vUsd * fx.now).toLocaleString("en-US") : usd(vUsd, d0 == null ? 0 : d0); }
    var plIls = ils ? tot * fx.now - P.start : null;
    var days = -daysTo(P.date), lastTrade = P.trades.length ? P.trades[P.trades.length - 1].date : P.date, quiet = -daysTo(lastTrade);
    function buy(q, a, fee, reason) {
      var n = JSON.parse(JSON.stringify(P)), today = new Date().toISOString().slice(0, 10);
      n.lots.push({ id: Date.now() + "-" + q.t, t: q.t, qty: a / q.price, price: q.price, date: today, reason: reason });
      n.cash -= a + fee; n.feesPaid += fee;
      n.trades.push({ type: "buy", t: q.t, qty: a / q.price, price: q.price, amt: a, fee: fee, date: today });
      setP(n); setBuyT(null);
      if (props.setJournal && !(props.journal || {})[q.t]) { var j = Object.assign({}, props.journal || {}); j[q.t] = { thesis: "תיק ניסיוני: " + reason, rules: [], created: today }; props.setJournal(j); }
    }
    function sell(r, qty) {
      qty = Math.min(qty, r.qty); if (!(qty > 0)) return;
      var n = JSON.parse(JSON.stringify(P)), today = new Date().toISOString().slice(0, 10);
      var proceeds = qty * r.px, fee = paperFee(P, proceeds), basis = qty * r.avg, gain = proceeds - fee - basis, tax = P.tax && gain > 0 ? gain * 0.25 : 0;
      var left = qty; n.lots = n.lots.map(function (l) { if (l.t !== r.t || left <= 0) return l; var take = Math.min(l.qty, left); left -= take; return Object.assign({}, l, { qty: l.qty - take }); }).filter(function (l) { return l.qty > 1e-9; });
      n.cash += proceeds - fee - tax; n.feesPaid += fee; n.taxPaid += tax; n.realized += gain;
      n.trades.push({ type: "sell", t: r.t, qty: qty, price: r.px, amt: proceeds, fee: fee, tax: tax, gain: gain, date: today });
      setP(n); setSellT(null); setSellQ("");
    }
    // lessons
    var lessons = [];
    rows.forEach(function (r) { if (r.q && r.q.deep) { var Z = C.sizing(r.q.s, r.q.d, load("shemesh-style", "balanced")), w = r.val / tot * 100; if (w > Z.maxPct + 1) lessons.push(["ריכוז", r.q.name + " תופסת " + pct(w, 1) + " מהתיק, ולפי הסיכון שלה מומלץ עד " + Z.maxPct + "%." + (r.pl < 0 && Math.abs(r.pl) > Math.abs(tot - P.startUsd) * 0.5 ? " רוב ההפסד של התיק מגיע ממנה." : "")]); } });
    var secs = {}; rows.forEach(function (r) { secs[r.sec] = (secs[r.sec] || 0) + r.val; });
    Object.keys(secs).forEach(function (k) { if (inv && secs[k] / tot > 0.5) lessons.push(["פיזור", "יותר מחצי מהתיק בתחום אחד (" + k + "). נפילה בתחום הזה תפגע בכל התיק."]); });
    if (days >= 7 && P.cash / tot > 0.8) lessons.push(["כסף שלא עובד", "יותר מ־80% מהתיק עדיין במזומן. גם זו החלטה – אבל לאורך זמן מזומן לא צומח."]);
    if (P.bench && spxRet != null && days >= 14) lessons.push(ret >= spxRet ? ["מול המדד", "בינתיים התיק שלך (" + pct(ret, 1, true) + ") מנצח את ה־S&P 500 (" + pct(spxRet, 1, true) + "). בדוק אם זו שיטה או מזל – עקוב עוד כמה חודשים."] : ["מול המדד", "ה־S&P 500 עשה " + pct(spxRet, 1, true) + " והתיק שלך " + pct(ret, 1, true) + ". זו בדיוק הסיבה שרוב המקצוענים ממליצים להתחיל ממדד."]);
    var ch = [
      ["מפוזר", "5 מניות לפחות מ־3 תחומים", rows.length >= 5 && Object.keys(secs).length >= 3],
      ["סבלני", "30 יום בלי לגעת בתיק", rows.length > 0 && quiet >= 30],
      ["מנצח את המדד", "אחרי 30 יום, תשואה מעל ה־S&P 500", days >= 30 && spxRet != null && ret > spxRet]
    ];
    var sr = sellT ? rows.find(function (r) { return r.t === sellT; }) : null;
    var vixI = ((data.markets && data.markets.items) || []).find(function (x) { return x.k === "vix"; });
    return html`<div>
      <div style=${{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span className="pill" style=${{ color: "#8BB6FF" }}>כסף וירטואלי</span>
        <span className="muted" style=${{ fontSize: 13 }}>נפתח ב־${dt(P.date)} עם ${ils ? "₪" + P.start.toLocaleString("en-US") : usd(P.start, 0)}</span>
      </div>
      <div className="paper-sum">
        <div className="muted">שווי התיק</div>
        <div className="paper-val"><b>${N(money(tot))}</b><span className=${cls(ret)}>${N((ret >= 0 ? "+" : "−") + money(Math.abs(tot - P.startUsd)) + " (" + pct(ret, 1, true) + ")")}</span></div>
        ${ils ? html`<div className="muted" style=${{ fontSize: 13 }}>בשקלים, כולל השפעת הדולר: ${N((plIls >= 0 ? "+" : "−") + "₪" + Math.abs(Math.round(plIls)).toLocaleString("en-US"))}</div>` : null}
        <div className="kpis" style=${{ marginTop: 10 }}>
          <div className="kpi"><div className="l">מזומן פנוי</div><div className="v">${N(money(P.cash))}</div></div>
          <div className="kpi"><div className="l">מושקע במניות</div><div className="v">${N(pct(tot ? inv / tot * 100 : 0, 0))}</div></div>
          <div className="kpi"><div className="l">עמלות ומס ששולמו</div><div className="v">${N(money(P.feesPaid + P.taxPaid))}</div></div>
        </div>
        ${P.bench && spxRet != null ? html`<div className=${"vs " + (ret >= spxRet ? "good" : "bad")}>מול השוק: ה־S&P 500 ${spxRet >= 0 ? "עלה" : "ירד"} מאז הפתיחה ${pct(Math.abs(spxRet), 1)}. ${ret >= spxRet ? html`<b>התיק שלך עושה טוב יותר – בינתיים.</b>` : html`<b>המדד עושה טוב יותר מהתיק שלך.</b>`}</div>` : null}
      </div>
      ${buyT ? null : html`<div className="paper-buybar"><${TickerInput} data=${data} uni=${uni} btn="+ קנה מניה" ph="איזו מניה לקנות? סימול או שם" onOk=${function (T) { setBuyT(T); setSellT(null); }}/></div>`}
      ${buyT && quote(buyT, data, uni) ? html`<${PaperBuy} key=${buyT} P=${P} q=${quote(buyT, data, uni)} data=${data} mkt1y=${props.mkt1y} total=${tot} onBuy=${buy} onCancel=${function () { setBuyT(null); }}/>` : null}
      ${sr ? html`<div className="paper-panel">
        <h3 style=${{ marginTop: 0 }}>מכירה: ${sr.q ? sr.q.name : sr.t}</h3>
        ${(sr.pl / sr.cost < -0.15 || (vixI && vixI.value > 30)) ? html`<div className="note-warn">רגע לפני: ${sr.pl / sr.cost < -0.15 ? "המניה ירדה " + pct(Math.abs(sr.pl / sr.cost * 100), 0) + " מהמחיר שלך. " : ""}בהיסטוריה, רוב הנפילות הגדולות של השוק התאוששו – ומי שמכר בתחתית נעל את ההפסד. השאלה הנכונה: האם הסיבה שקנית עדיין נכונה? <button className="lnk" onClick=${function () { props.goLearn && props.goLearn("crash"); }}>מה קרה בנפילות הקודמות</button></div>` : null}
        <div className="tk-in"><input className="num-in" type="number" min="0" step="any" value=${sellQ} placeholder=${"עד " + sr.qty.toFixed(2) + " מניות"} onInput=${function (ev) { setSellQ(ev.target.value); }} aria-label="כמות למכירה"/>
          <button className="chipbtn" onClick=${function () { setSellQ(String(sr.qty)); }}>הכול</button></div>
        <div style=${{ display: "flex", gap: 8, marginTop: 10 }}><button className="btn" onClick=${function () { sell(sr, parseFloat(sellQ)); }} disabled=${!(parseFloat(sellQ) > 0)}>אשר מכירה</button><button className="btn ghost" onClick=${function () { setSellT(null); }}>ביטול</button></div>
      </div>` : null}
      <h3 style=${{ margin: "18px 0 8px" }}>ההחזקות שלך</h3>
      ${!rows.length ? html`<p className="muted">עוד לא קנית כלום. בחר מניה למעלה – לפני כל קנייה תקבל את חוות הדעת שלנו ורשימת בדיקה קצרה.</p>` : rows.map(function (r) {
        var w = tot ? r.val / tot * 100 : 0, plp = r.pl / r.cost * 100;
        return html`<div key=${r.t} className="ph">
          <div className="ph-top"><button className="lnk" onClick=${function () { props.onPick(r.t); }}><b>${r.q ? r.q.name : r.t}</b></button><b>${N(money(r.val))}</b></div>
          <div className="ph-mid muted"><span>${r.qty.toFixed(r.qty < 10 ? 2 : 0)} מניות · ממוצע ${usd(r.avg)}</span><span className=${cls(r.pl)}>${(r.pl >= 0 ? "+" : "−") + money(Math.abs(r.pl)) + " (" + pct(plp, 1, true) + ")"}</span></div>
          <div className="ph-mid"><span className="muted">משקל ${pct(w, 1)}</span>${r.q && r.q.deep ? html`<span className=${"pill " + r.q.rec.cls}>${r.q.rec.he}</span>` : null}<button className="chipbtn" onClick=${function () { setSellT(r.t); setBuyT(null); setSellQ(""); }}>מכור</button></div>
        </div>`;
      })}
      ${lessons.length ? html`<div className="lessons"><div className="kicker" style=${{ color: "var(--gold)" }}>מה אפשר ללמוד מהתיק שלך</div>${lessons.map(function (l, i) { return html`<p key=${i}><b>${l[0]}:</b> ${l[1]}</p>`; })}</div>` : null}
      <h3 style=${{ margin: "18px 0 8px" }}>אתגרים</h3>
      <div className="chal">${ch.map(function (c) { return html`<div key=${c[0]} className=${"chal-i" + (c[2] ? " done" : "")}><b>${c[2] ? "✓ " : ""}${c[0]}</b><span>${c[1]}</span></div>`; })}</div>
      ${P.trades.length ? html`<details style=${{ marginTop: 14 }}><summary style=${{ cursor: "pointer", fontWeight: 700, minHeight: 44, display: "flex", alignItems: "center" }}>היסטוריית פעולות (${P.trades.length})</summary>
        <ul className="hist">${P.trades.slice().reverse().map(function (t, i) { var q = quote(t.t, data, uni); return html`<li key=${i}><span>${t.type === "buy" ? "קנייה" : "מכירה"}: ${t.qty.toFixed(t.qty < 10 ? 2 : 0)} ${q ? q.name : t.t} ב־${usd(t.price)}</span><span className="muted">${dt(t.date)} · ${usd(t.amt, 0)}${t.tax ? " · מס " + usd(t.tax, 0) : ""}</span></li>`; })}</ul></details>` : null}
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
        <button className="btn ghost danger" onClick=${function () { if (window.confirm ? window.confirm("לאפס את התיק הניסיוני ולהתחיל מחדש?") : true) setP(null); }}>אפס והתחל מחדש</button>
        <span className="muted" style=${{ fontSize: 12.5 }}>קנייה ומכירה לפי מחיר הסגירה האחרון מהעדכון היומי</span>
      </div>
      <p className="method">אימון בכסף מדומה – לא ייעוץ השקעות. התיק נשמר בדפדפן הזה בלבד (אפשר לגבות אותו עם "גיבוי לקובץ" בלשונית "התיק שלי").</p>
    </div>`;
  }

  // ---------- learning ----------
  function lessonsFor(data, extras) {
    var spx = (data.indices || []).find(function (x) { return x.id === "SPX"; }) || {};
    var nv = data.stocks.NVDA, ko = data.stocks.KO, dn = nv && C.derive(nv), dk = ko && C.derive(ko);
    var sp = extras && extras.spiva;
    return [
      { id: "stock", t: "מה זו מניה?", m: 3, body: ["מניה היא חלק קטן בבעלות על חברה. מי שקונה מניה של אפל הוא בעלים של חלק זעיר מאפל – כולל זכות לחלק מהרווחים.", "המחיר של מניה זז כל יום לפי היצע וביקוש, אבל לאורך שנים הוא הולך בעקבות דבר אחד: כמה החברה מרוויחה, וכמה היא צפויה להרוויח בעתיד.", "שתי דרכים להרוויח ממניה: עליית מחיר, ודיבידנד – חלק מהרווח שהחברה מחלקת במזומן."],
        quiz: [["מה קונים כשקונים מניה?", ["הלוואה לחברה", "חלק בבעלות על החברה", "מוצר של החברה"], 1, "מניה = בעלות. הלוואה לחברה נקראת אג״ח."], ["מה מזיז מחיר של מניה לאורך שנים?", ["החדשות של היום", "הרווחים של החברה", "מספר העובדים"], 1, "בטווח הקצר – רגשות וחדשות. בטווח הארוך – רווחים."]] },
      { id: "index", t: "מה זה מדד, ולמה כולם מדברים על S&P 500?", m: 3, body: ["מדד הוא סל של הרבה מניות שמייצג שוק שלם. ה־S&P 500 כולל את 500 החברות הגדולות בארה״ב – ועומד היום על " + (spx.level ? Math.round(spx.level).toLocaleString("en-US") : "—") + " נקודות.", "כשמישהו אומר ״השוק עלה״, הוא בדרך כלל מתכוון למדד הזה.", "אפשר ״לקנות את המדד״ דרך קרן מחקה (ETF) – וכך להחזיק בבת אחת חלק קטן מכל 500 החברות."],
        quiz: [["כמה חברות יש ב־S&P 500?", ["50", "500", "5,000"], 1, "500 החברות הגדולות בארה״ב."], ["איך אפשר לקנות את כל המדד בפעולה אחת?", ["קרן מחקה (ETF)", "מניה של בנק", "אי אפשר"], 0, "קרן מחקה קונה את כל המניות במדד בשבילך."]] },
      { id: "pe", t: "מכפיל רווח: מתי מניה יקרה?", m: 4, body: ["מכפיל רווח (P/E) = מחיר המניה חלקי הרווח למניה. הוא אומר כמה שנים של רווח אתה משלם.", dn && dk ? "דוגמה מהאתר: אנבידיה נסחרת במכפיל " + (dn.pe ? dn.pe.toFixed(0) : "—") + " וקוקה־קולה במכפיל " + (dk.pe ? dk.pe.toFixed(0) : "—") + ". למה? אנבידיה צפויה לצמוח הרבה יותר מהר – ולכן המשקיעים מוכנים לשלם יותר על כל דולר רווח היום." : "", "מכפיל גבוה הוא לא בהכרח ״יקר״ – הוא מוצדק רק אם הצמיחה מהירה. לכן בודקים גם PEG: המכפיל חלקי קצב הצמיחה."],
        quiz: [["מניה במחיר 100$ ורווח של 5$ למניה – מה המכפיל?", ["5", "20", "500"], 1, "100 חלקי 5 = 20."], ["מתי מכפיל גבוה מוצדק?", ["כשהחברה ותיקה", "כשהצמיחה מהירה", "אף פעם"], 1, "משלמים יותר על עסק שהרווחים שלו צפויים לגדול מהר."]] },
      { id: "spread", t: "פיזור: לא לשים את כל הביצים בסל אחד", m: 3, body: ["גם חברות מצוינות יכולות לרדת 50% בשנה רעה. אם כל הכסף במניה אחת – כל התיק יורד איתה.", "פיזור = כמה מניות, מכמה תחומים (טכנולוגיה, בריאות, צריכה, אנרגיה). כשתחום אחד נופל, אחרים מאזנים.", "באתר, בכל מניה יש ״כמה לקנות?״ – המלצה כמה אחוז מהתיק לשים בה לפי הסיכון שלה."],
        quiz: [["מה הכי מפוזר?", ["מניה אחת מצוינת", "5 מניות טכנולוגיה", "8 מניות מ־4 תחומים"], 2, "גם הרבה מניות מאותו תחום נופלות יחד."], ["למה מניה מסוכנת צריכה לקבל חלק קטן מהתיק?", ["כי היא זולה", "כדי שנפילה שלה לא תפיל את כל התיק", "כי ככה החוק"], 1, "גודל הפוזיציה קובע כמה נפילה אחת יכולה להזיק."]] },
      { id: "compound", t: "ריבית דריבית: הכוח הכי חזק בהשקעות", m: 3, body: ["כשהתשואה מצטרפת לקרן, בשנה הבאה מרוויחים גם עליה. אחרי 10 שנים זה מורגש, אחרי 30 שנה זה מדהים.", "דוגמה: 1,000 ₪ בחודש במשך 30 שנה, בתשואה שנתית של 7%, יהיו בערך 1.2 מיליון ₪ – כשהפקדת רק 360 אלף.", "המסקנה: הזמן חשוב יותר מהתזמון. להתחיל מוקדם, גם עם סכום קטן. נסו את המחשבון למטה."],
        quiz: [["מה הכי משפיע על ריבית דריבית?", ["זמן", "מזל", "השעה שבה קונים"], 0, "ככל שהזמן ארוך יותר, האפקט חזק יותר."], ["מי ירוויח יותר: מי שהתחיל בגיל 25 או בגיל 40, עם אותו סכום חודשי?", ["בגיל 25", "בגיל 40", "אותו דבר"], 0, "15 שנים נוספות של ריבית דריבית עושות הבדל עצום."]] },
      { id: "fees", t: "דמי ניהול: האויב השקט", m: 3, body: ["1% דמי ניהול בשנה נשמע מעט. אבל על פני 30 שנה, הוא יכול לאכול כחמישית מהכסף שהיה מצטבר.", "קרן מחקה על S&P 500 עולה בדרך כלל עשיריות האחוז בשנה – הרבה פחות מקרן מנוהלת.", "לפני כל השקעה, שאלו: כמה זה עולה לי בשנה? במחשבון למטה אפשר לראות את ההבדל בשקלים."],
        quiz: [["על מה גובים דמי ניהול?", ["רק על הרווח", "על כל הסכום, כל שנה", "רק בקנייה"], 1, "דמי ניהול נגבים מכל הסכום, גם בשנים של הפסד."], ["למה קרן מחקה זולה יותר?", ["כי אין בה מניות טובות", "כי היא רק מעתיקה מדד ולא צריכה מנהל שבוחר", "כי היא חדשה"], 1, "אין צוות שבוחר מניות – ולכן העלות נמוכה."]] },
      { id: "tax", t: "מס ודולר: כמה באמת נשאר ביד", m: 3, body: ["בישראל משלמים 25% מס רווחי הון על הרווח, רק כשמוכרים. כל עוד לא מכרת – המס ״מחכה״.", "מניות בוול סטריט נקנות בדולרים. אם הדולר יורד מול השקל, הרווח בשקלים קטן – גם אם המניה עלתה.", "בלשונית ״התיק שלי״ אפשר לראות את התיק בשקלים, כולל השפעת הדולר ומס משוער."],
        quiz: [["מתי משלמים מס רווחי הון?", ["כל שנה", "כשמוכרים ברווח", "כשקונים"], 1, "המס נגבה רק במכירה ברווח."], ["המניה עלתה 10% והדולר ירד 10%. מה הרווח בשקלים?", ["בערך 0%", "20%", "10%"], 0, "העלייה במניה ״נמחקת״ בירידת הדולר."]] },
      { id: "indexfirst", t: "האמת: רוב המקצוענים לא מנצחים את המדד", m: 4, body: [sp ? "לפי דוח SPIVA של S&P (" + sp.asOf + "), " + sp.rows.map(function (r) { return Math.round(r[1]) + "% מהקרנות המנוהלות בארה״ב פיגרו אחרי ה־S&P 500 ב" + r[0]; }).join("; ") + "." : "", "כלומר: רוב מנהלי הקרנות, עם צוותים ומחקר, לא מצליחים לנצח את המדד לאורך זמן. רובם גם גובים דמי ניהול גבוהים יותר.", "לכן לרוב האנשים הצעד הראשון הנכון הוא קרן מחקה מדד. בחירת מניות יכולה להיות חלק קטן ומעניין מהתיק – ובשביל זה בדיוק יש את התיק הניסיוני."],
        quiz: [["כמה מהקרנות המנוהלות פיגרו אחרי המדד ב־15 שנה?", ["כ־20%", "כ־50%", "כ־90%"], 2, "כ־90% לפי SPIVA."], ["מה הצעד הראשון הנבון לרוב המתחילים?", ["מניה אחת חמה", "קרן מחקה מדד", "מסחר יומי"], 1, "פיזור רחב, עלות נמוכה, ובלי צורך לבחור."]] }
    ];
  }
  function Academy(props) {
    var L = lessonsFor(props.data, props.extras);
    var _p = useStored("shemesh-academy", {}), prog = _p[0], setProg = _p[1];
    var _o = useState(props.open || null), open = _o[0], setOpen = _o[1];
    var _a = useState({}), ans = _a[0], setAns = _a[1];
    var done = L.filter(function (l) { return prog[l.id]; }).length;
    var cur = L.find(function (l) { return l.id === open; });
    function pickAns(qi, oi) { var n = Object.assign({}, ans); n[open + qi] = oi; setAns(n); var allOk = cur.quiz.every(function (q, i) { return (i === qi ? oi : n[open + i]) === q[2]; }); if (allOk) { var p = Object.assign({}, prog); p[open] = true; setProg(p); } }
    return html`<section className="card" id="sec-academy">
      <div className="sec-h"><div><div className="kicker">הצעדים הראשונים</div><h2>מסלול למתחילים: ${L.length} שיעורים קצרים</h2></div><div className="hint">${done}/${L.length} הושלמו</div></div>
      <div className="prog"><span style=${{ width: (done / L.length * 100) + "%" }}></span></div>
      ${cur ? html`<div className="lesson">
        <button className="lnk" onClick=${function () { setOpen(null); }}>→ חזרה לרשימה</button>
        <h3 style=${{ fontSize: 22, margin: "8px 0" }}>${cur.t}</h3>
        ${cur.body.filter(Boolean).map(function (b, i) { return html`<p key=${i}>${b}</p>`; })}
        <div className="quiz"><div className="kicker">בדוק את עצמך</div>${cur.quiz.map(function (q, qi) {
          var a = ans[open + qi];
          return html`<div key=${qi} className="qz"><b>${q[0]}</b><div className="qz-o">${q[1].map(function (o, oi) {
            var st = a == null ? "" : oi === q[2] ? " ok" : a === oi ? " bad" : "";
            return html`<button key=${oi} className=${"chipbtn" + st} aria-pressed=${a === oi} onClick=${function () { pickAns(qi, oi); }}>${o}</button>`;
          })}</div>${a != null ? html`<div className=${a === q[2] ? "up" : "down"} style=${{ fontSize: 13.5 }}>${a === q[2] ? "נכון! " : "לא בדיוק. "}${q[3]}</div>` : null}</div>`;
        })}</div>
        ${prog[open] ? html`<div className="vs good">✓ השיעור הושלם.${L.findIndex(function (l) { return l.id === open; }) < L.length - 1 ? html` <button className="lnk" onClick=${function () { var i = L.findIndex(function (l) { return l.id === open; }); setOpen(L[i + 1].id); setAns({}); }}>לשיעור הבא ←</button>` : " סיימת את כל המסלול – הזמן לנסות את התיק הניסיוני."}</div>` : null}
      </div>` : html`<ol className="lessons-l">${L.map(function (l, i) {
        return html`<li key=${l.id}><button onClick=${function () { setOpen(l.id); setAns({}); }}><span className=${"num" + (prog[l.id] ? " done" : "")}>${prog[l.id] ? "✓" : i + 1}</span><span className="lt">${l.t}</span><span className="muted" style=${{ fontSize: 13 }}>${l.m} דק׳</span></button></li>`;
      })}</ol>`}
    </section>`;
  }
  function TimeMachine(props) {
    var data = props.data, H = data.history, fx = data.fx;
    var opts = ["SPY"].concat(data.order.filter(function (t) { return H && H.series && H.series[t] && H.series[t].length >= 13; }));
    var _t = useState("SPY"), t = _t[0], setT = _t[1];
    var _a = useState(10000), amt = _a[0], setAmt = _a[1];
    var _y = useState(5), yrs = _y[0], setYrs = _y[1];
    function run(tk) {
      var ser = H && H.series[tk]; if (!ser || !ser.length) return null;
      var n = Math.min(yrs * 12, ser.length - 1), p0 = ser[ser.length - 1 - n], s = data.stocks[tk];
      var pNow = s ? s.price : ser[ser.length - 1][1];
      var f0 = fx ? fxAt(fx, p0[0]) : 1, fN = fx ? fx.now : 1;
      var shares = amt / f0 / p0[1], val = shares * pNow * fN;
      return { from: p0[0], val: val, ret: (val / amt - 1) * 100, usdRet: (pNow / p0[1] - 1) * 100 };
    }
    var r = run(t), b = t !== "SPY" ? run("SPY") : null;
    function nm(tk) { return tk === "SPY" ? "מדד S&P 500 (דרך SPY)" : (data.stocks[tk] || {}).nameHe || tk; }
    return html`<section className="card" id="sec-time">
      <div className="sec-h"><div><div className="kicker">מכונת הזמן</div><h2>אם הייתי משקיע לפני כמה שנים…</h2></div></div>
      <div className="scr-f">
        <label>במה<select value=${t} onChange=${function (ev) { setT(ev.target.value); }}>${opts.map(function (o) { return html`<option key=${o} value=${o}>${nm(o)}</option>`; })}</select></label>
        <label>כמה (₪)<input className="num-in" type="number" min="100" step="100" value=${amt} onInput=${function (ev) { setAmt(Math.max(0, +ev.target.value || 0)); }}/></label>
        <div className="seg">${[1, 3, 5].map(function (y) { return html`<button key=${y} className=${yrs === y ? "on" : ""} onClick=${function () { setYrs(y); }}>לפני ${y === 1 ? "שנה" : y + " שנים"}</button>`; })}</div>
      </div>
      ${r ? html`<div className="tm-res">
        <div>${amt.toLocaleString("en-US")} ₪ ב${nm(t)} ב־${lbl(r.from)} שווים היום</div>
        <div className=${"tm-big " + cls(r.ret)}>${N("₪" + Math.round(r.val).toLocaleString("en-US"))}</div>
        <div className="muted">${pct(r.ret, 1, true)} בשקלים · ${pct(r.usdRet, 1, true)} בדולרים${b ? " · המדד באותה תקופה: ₪" + Math.round(b.val).toLocaleString("en-US") + " (" + pct(b.ret, 1, true) + ")" : ""}</div>
      </div>` : html`<p className="muted">אין מספיק היסטוריה.</p>`}
      <p className="method">לפי סגירות חודשיות ושער הדולר הממוצע בחודש הקנייה, לפני עמלות ומס, ובלי דיבידנדים. ביצועי עבר לא מבטיחים ביצועים בעתיד – אבל הם מראים כמה תנודתית הדרך.</p>
    </section>`;
  }
  function Compound() {
    var _m = useState(1000), m = _m[0], setM = _m[1], _y = useState(30), y = _y[0], setY = _y[1], _r = useState(7), r = _r[0], setR = _r[1], _f = useState(1), f = _f[0], setF = _f[1];
    function fv(rate) { var i = rate / 100 / 12, n = y * 12; return i ? m * ((Math.pow(1 + i, n) - 1) / i) : m * n; }
    var gross = fv(r), net = fv(r - f), dep = m * y * 12;
    function F(v) { return "₪" + Math.round(v).toLocaleString("en-US"); }
    return html`<section className="card" id="sec-compound">
      <div className="sec-h"><div><div className="kicker">מחשבון</div><h2><${Term} k="compound"/> ו<${Term} k="fee"/></h2></div></div>
      <div className="scr-f">
        <label>הפקדה חודשית (₪)<input className="num-in" type="number" min="0" step="100" value=${m} onInput=${function (ev) { setM(+ev.target.value || 0); }}/></label>
        <label>שנים<input className="num-in" type="number" min="1" max="60" value=${y} onInput=${function (ev) { setY(Math.min(60, Math.max(1, +ev.target.value || 1))); }}/></label>
        <label>תשואה שנתית (%)<input className="num-in" type="number" step="0.5" value=${r} onInput=${function (ev) { setR(+ev.target.value || 0); }}/></label>
        <label>דמי ניהול (%)<input className="num-in" type="number" step="0.1" min="0" value=${f} onInput=${function (ev) { setF(Math.max(0, +ev.target.value || 0)); }}/></label>
      </div>
      <div className="kpis" style=${{ marginTop: 12 }}>
        <div className="kpi"><div className="l">הפקדת בסך הכול</div><div className="v">${N(F(dep))}</div></div>
        <div className="kpi"><div className="l">יצטבר (אחרי דמי ניהול)</div><div className="v up">${N(F(net))}</div></div>
        <div className="kpi"><div className="l">דמי הניהול עלו לך</div><div className="v down">${N(F(gross - net))}</div><div className="s">${pct(gross ? (gross - net) / gross * 100 : 0, 0)} ממה שהיה מצטבר</div></div>
      </div>
      <p className="method">חישוב עם ריבית חודשית קבועה. תשואה של 7% היא הנחה לצורך הדגמה – השוק לא עולה בקו ישר, ויש שנים של ירידות.</p>
    </section>`;
  }
  function IndexTruth(props) {
    var sp = props.extras && props.extras.spiva;
    return html`<section className="card" id="sec-index">
      <div className="sec-h"><div><div className="kicker">לפני שבוחרים מניות</div><h2>האמת על מדדים</h2></div></div>
      ${sp ? html`<div className="spiva">${sp.rows.map(function (r) { return html`<div key=${r[0]} className="sp-r"><span>${r[0]}</span><span className="track"><span style=${{ width: r[1] + "%" }}></span></span><b>${Math.round(r[1])}%</b></div>`; })}</div>
      <p className="muted" style=${{ fontSize: 13.5 }}>אחוז הקרנות המנוהלות בארה״ב שפיגרו אחרי ה־S&P 500 (נכון ל${sp.asOf}). <a href=${sp.src} target="_blank" rel="noopener">SPIVA ↗</a></p>` : null}
      <p>רוב מנהלי הקרנות לא מנצחים את המדד לאורך זמן. לכן לרוב האנשים הבסיס הנכון הוא <${Term} k="etf"/> על מדד רחב, ובחירת מניות – אם בכלל – היא חלק קטן מהתיק.</p>
      <h3>איך משקיעים במדד מישראל?</h3>
      <ul className="opts">
        <li><b>קרן מחקה / קרן סל:</b> נקנית בחשבון מסחר בבנק או בבית השקעות, בבורסה בתל אביב או בחו״ל. דמי ניהול נמוכים.</li>
        <li><b>קופת גמל להשקעה:</b> אפשר לבחור מסלול שעוקב אחרי ה־S&P 500. יש תקרת הפקדה שנתית, ויתרון מס אם מושכים אותה כקצבה בגיל פרישה.</li>
        <li><b>IRA (ניהול אישי של כספי פנסיה):</b> מאפשר להשקיע בעצמך חלק מהחיסכון הפנסיוני – כולל במדדים. מתאים למי שכבר מבין מה הוא עושה.</li>
      </ul>
      <p className="method">התנאים, התקרות ודמי הניהול משתנים בין גופים ומעת לעת – בדקו מול הגוף המנהל או יועץ פנסיוני מורשה. זה מידע כללי, לא ייעוץ.</p>
    </section>`;
  }
  function Crashes(props) {
    var X = props.extras && props.extras.crashes; if (!X) return null;
    return html`<section className="card" id="sec-crash">
      <div className="sec-h"><div><div className="kicker">כשהשוק נופל</div><h2>מה קרה בנפילות הגדולות – ומה למדנו</h2></div></div>
      <div className="crash">${X.map(function (c) {
        return html`<div key=${c.name} className="cr"><div className="cr-top"><b>${c.name}</b><span className="down" style=${{ fontWeight: 800 }}>${N(c.drop + "%")}</span></div>
          <div className="muted" style=${{ fontSize: 13 }}>S&P 500 · מ${c.peak} עד ${c.bottom} · ${c.recovery}</div><p>${c.lesson}</p></div>`;
      })}</div>
      <p><b>השורה התחתונה:</b> נפילות הן חלק רגיל מהשוק. הטעות הכי יקרה של מתחילים היא למכור בפאניקה בתחתית. לפני שמוכרים, שואלים: האם הסיבה שקניתי עדיין נכונה?</p>
    </section>`;
  }
  function Glossary() {
    var _q = useState(""), q = _q[0], setQ = _q[1];
    var ks = Object.keys(GLOSS).filter(function (k) { return !q || GLOSS[k][0].indexOf(q) >= 0 || GLOSS[k][1].indexOf(q) >= 0; });
    return html`<section className="card" id="sec-gloss">
      <div className="sec-h"><div><div className="kicker">מילון</div><h2>מונחים בשפה פשוטה</h2></div></div>
      <input className="num-in" style=${{ width: "100%", maxWidth: 360 }} placeholder="חפש מונח" value=${q} onInput=${function (ev) { setQ(ev.target.value); }} aria-label="חיפוש מונח"/>
      <dl className="gloss">${ks.map(function (k) { return html`<div key=${k}><dt>${GLOSS[k][0]}</dt><dd>${GLOSS[k][1]}</dd></div>`; })}</dl>
    </section>`;
  }
  function LearnMore(props) {
    var X = props.extras && props.extras.learnMore; if (!X) return null;
    return html`<section className="card"><div className="sec-h"><div><div className="kicker">להמשך</div><h2>איפה ללמוד עוד בעברית</h2></div></div>
      <ul className="opts">${X.map(function (x) { return html`<li key=${x.url}><a href=${x.url} target="_blank" rel="noopener"><b>${x.name} ↗</b></a><br/><span className="muted" style=${{ fontSize: 13.5 }}>${x.note}</span></li>`; })}</ul>
      <p className="method">קישורים לתוכן חיצוני לצורך למידה. אין לנו קשר מסחרי עם היוצרים, והם לא אחראים לתוכן באתר הזה.</p></section>`;
  }

  // ---------- investor profile (first visit) ----------
  var PQ = [
    ["לכמה זמן הכסף הזה מיועד?", [["פחות מ־3 שנים", 0], ["3–10 שנים", 1], ["יותר מ־10 שנים", 2]]],
    ["התיק ירד 20% בחודש. מה תעשה?", [["אמכור הכול", 0], ["אחכה ואבדוק", 1], ["אקנה עוד", 2]]],
    ["כמה ניסיון יש לך בהשקעות?", [["אין בכלל", 0], ["קצת", 1], ["הרבה", 2]]]
  ];
  function Profile(props) {
    var _a = useState({}), a = _a[0], setA = _a[1];
    var all = PQ.every(function (_, i) { return a[i] != null; });
    function finish() {
      var risk = (a[0] || 0) + (a[1] || 0), style = risk <= 1 ? "careful" : risk >= 3 ? "bold" : "balanced";
      save("shemesh-style", style); props.setMode(a[2] === 2 ? "pro" : "simple");
      props.setProfile({ style: style, exp: a[2], at: new Date().toISOString().slice(0, 10) });
    }
    return html`<section className="card profile">
      <div className="sec-h"><div><div className="kicker">30 שניות</div><h2>בוא נכיר – כדי שהאתר יתאים לך</h2></div><button className="lnk" onClick=${function () { props.setProfile({ skipped: true }); }}>דלג</button></div>
      ${PQ.map(function (q, i) { return html`<div key=${i} className="qz"><b>${q[0]}</b><div className="qz-o">${q[1].map(function (o) { return html`<button key=${o[1]} className=${"chipbtn" + (a[i] === o[1] ? " on" : "")} aria-pressed=${a[i] === o[1]} onClick=${function () { var n = Object.assign({}, a); n[i] = o[1]; setA(n); }}>${o[0]}</button>`; })}</div></div>`; })}
      <button className="btn" disabled=${!all} onClick=${finish}>סיימתי</button>
      <p className="method">התשובות נשמרות רק בדפדפן שלך. הן קובעות את רמת הפירוט ואת הסגנון ב״כמה לקנות?״ – אפשר לשנות בכל רגע.</p>
    </section>`;
  }
  function NextStep(props) {
    var prog = load("shemesh-academy", {}), L = lessonsFor(props.data, props.extras), done = L.filter(function (l) { return prog[l.id]; }).length, paper = load("shemesh-paper", null);
    var step = done < L.length ? ["המשך ללמוד", "סיימת " + done + " מתוך " + L.length + " שיעורים במסלול למתחילים.", "learn"] : !paper ? ["נסה את התיק הניסיוני", "סיימת את המסלול – עכשיו תתאמן על השקעה בכסף מדומה.", "paper"] : ["בדוק את התיק הניסיוני", "איך התיק שלך מול המדד?", "paper"];
    return html`<section className="card nextstep"><div><div className="kicker">הצעד הבא שלך</div><h3 style=${{ margin: "4px 0" }}>${step[0]}</h3><p className="muted" style=${{ margin: 0 }}>${step[1]}</p></div>
      <button className="btn" onClick=${function () { props.go(step[2]); }}>${step[0]}</button></section>`;
  }

  // ================= round 5: index model card, currencies =================
  function IdxModel(props) {
    var x = props.x, M = props.M, A = props.A;
    var VC = { g: "var(--green)", y: "var(--amber)", r: "var(--red)", n: "var(--muted)" };
    var W = { g: "חיובי", y: "בינוני", r: "שלילי", n: "אין נתון" };
    return html`<section className="card">
      <div className="sec-h"><div><div className="kicker">${A ? "בדיקה נוספת" : "פסק הדין"}</div><h2>${A ? "ארבע השאלות על " + x.nameHe : "האם כדאי להשקיע ב" + x.nameHe + "?"}</h2></div></div>
      ${!A ? (M.rec ? html`<div className="verdict"><div className="rec">
          <div className=${"tag " + IREC[M.rec][1]}>${IREC[M.rec][0]}</div>
          <div className="entry"><div className="muted" style=${{ fontSize: 12.5 }}>רמת כניסה (מרווח ביטחון 20%)</div><div style=${{ fontSize: 26, fontWeight: 800 }}>${N(lvl(M.entry))}</div></div>
          <div className="muted" style=${{ fontSize: 12.5 }}>שווי לשנה לפי המודל: ${N(lvl(M.fair))} (${pct(M.up, 1, true)} מהרמה היום) · ציון ${M.score}/100</div>
          ${M.capped ? html`<p className="note-warn" style=${{ marginTop: 8 }}>אין לנו נתון אמין למכפיל הרווח של המדד הזה מול ההיסטוריה שלו, ולכן לא נמליץ על קנייה רק בגלל תשואות עבר.</p>` : null}
        </div></div>` : html`<p className="note-warn">אין עדיין מספיק נתונים למדד הזה כדי לתת פסק דין (צריך לפחות 3 מתוך 4 הבדיקות). הנתונים יתווספו בעדכון היומי.</p>`) : null}
      <div className="six" style=${{ marginTop: 12 }}>${M.lights.map(function (l) {
        return html`<div key=${l.key} className="six-r" style=${{ gridTemplateColumns: "14px 1fr auto" }}><span className="light" style=${{ background: VC[l.light] }} aria-hidden="true"></span><span><b>${l.q}</b><br/><span className="muted" style=${{ fontSize: 13.5 }}>${l.a}</span></span><b style=${{ color: VC[l.light] }}>${W[l.light]}</b></div>`;
      })}</div>
      <div className="ours" style=${{ marginTop: 14 }}>
        <div className="kicker" style=${{ color: "var(--gold)" }}>מה היו אומרים הגדולים</div>
        <p style=${{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.6 }}><b>וורן באפט</b> כתב שלרוב האנשים עדיף לקנות קרן מדד זולה ולהחזיק אותה שנים, במקום לבחור מניות. <b>הווארד מרקס</b> מזכיר שגם במדד המחיר חשוב: ${M.lights[0].light === "r" ? "כרגע המכפיל גבוה מהרגיל – עדיף להיכנס בהדרגה." : M.lights[0].light === "g" ? "כרגע המכפיל נמוך מהרגיל – תקופה נוחה יחסית להיכנס." : M.lights[0].light === "y" ? "כרגע המכפיל בטווח הרגיל." : "למדד הזה אין לנו נתון מכפיל, אז כדאי להיכנס בהדרגה."} <span className="muted">(לפי העקרונות שפרסמו, לא דעה שלהם על המדד הזה)</span></p>
      </div>
      <p className="method">${M.how}${x.val ? " מכפיל: " + x.val.note + ", נכון ל־" + dt(x.val.asOf) + "." : ""} זה מודל פשוט ושקוף לצורכי לימוד – לא ייעוץ השקעות.</p>
    </section>`;
  }

  var FXK = {
    USD: { pair: "דולר/שקל", name: "שער הדולר", sym: "$", key: "usd", flag: "🇺🇸",
      up: ["טיסות, קניות באינטרנט ומוצרים מיובאים (דלק, אלקטרוניקה, רכבים) מתייקרים.", "זה יכול להעלות את האינפלציה בישראל, ולכן בנק ישראל ייטה לא להוריד ריבית.", "טוב ליצואנים ולחברות הייטק שמוכרות בדולרים – הן מקבלות יותר שקלים.", "מי שמחזיק מניות בוול סטריט מרוויח: התיק שווה יותר שקלים."],
      down: ["חו״ל ומוצרים מיובאים זולים יותר, וזה עוזר להוריד את האינפלציה.", "לבנק ישראל קל יותר להוריד ריבית – משכנתאות והלוואות יכולות להוזיל.", "קשה יותר ליצואנים: אותו דולר שווה פחות שקלים.", "מי שמחזיק מניות אמריקאיות מרוויח פחות בשקלים – גם אם המניה עלתה."],
      move: ["פער הריביות בין בנק ישראל לפד האמריקאי.", "המצב הביטחוני והפוליטי – אי־ודאות מחלישה את השקל.", "השקעות של זרים בישראל, בעיקר בהייטק.", "גופים מוסדיים: כשוול סטריט עולה הם מוכרים דולרים כדי לגדר – והשקל מתחזק.", "התערבות של בנק ישראל (רכישת או מכירת דולרים)."] },
    EUR: { pair: "יורו/שקל", name: "שער היורו", sym: "€", key: "eur", flag: "🇪🇺",
      up: ["חופשה באירופה ומוצרים מאירופה (רכבים, מזון, ביגוד) מתייקרים.", "טוב לחברות ישראליות שמוכרות לאירופה.", "מי שמחזיק השקעות באירופה (למשל מדד הדאקס) מרוויח יותר בשקלים."],
      down: ["טיסות וחופשות באירופה זולות יותר.", "מוצרים מאירופה זולים יותר.", "השקעות באירופה שוות פחות שקלים."],
      move: ["שער היורו מול הדולר: היורו/שקל ≈ היורו/דולר × הדולר/שקל.", "הריבית של הבנק המרכזי האירופי לעומת בנק ישראל.", "הכלכלה באירופה (גרמניה במיוחד) – צמיחה, אנרגיה, מלחמה באוקראינה.", "אותם גורמים ישראליים שמזיזים את השקל מול הדולר."] }
  };
  function fxStats(fx, k) {
    var mon = k === "USD" ? fx.monthly : fx.eur && fx.eur.monthly; if (!mon) return null;
    var ks = Object.keys(mon).sort(), last = ks[ks.length - 1];
    var rep = fx.rep ? fx.rep[FXK[k].key] : null, now = rep || (k === "USD" ? fx.now : mon[last]);
    var cm = String(rep ? fx.rep.date : last).slice(0, 7), Y = +cm.slice(0, 4), Mo = +cm.slice(5, 7);
    function back(n) { var t = (Y * 12 + Mo - 1) - n, k2 = Math.floor(t / 12) + "-" + ("0" + (t % 12 + 1)).slice(-2); return mon[k2] || null; }
    var y1 = back(12), y5 = back(60), m1 = back(1), lastY = ks.slice(-12).map(function (x) { return mon[x]; });
    return { now: now, date: rep ? fx.rep.date : (k === "USD" ? fx.asOf : last), ks: ks, mon: mon,
      c1: m1 ? (now / m1 - 1) * 100 : null, c12: y1 ? (now / y1 - 1) * 100 : null, c5: y5 ? (now / y5 - 1) * 100 : null,
      lo: Math.min.apply(null, lastY), hi: Math.max.apply(null, lastY), avg5: ks.slice(-60).reduce(function (a, x) { return a + mon[x]; }, 0) / Math.min(60, ks.length) };
  }
  function FxCards(props) {
    var fx = props.fx; if (!fx) return null;
    return html`<div><h3 className="idx-g">מטבעות</h3><div className="strip">${["USD", "EUR"].map(function (k) {
      var S = fxStats(fx, k); if (!S) return null;
      return html`<button key=${k} className="tick" onClick=${function () { props.onPick("FX:" + k); }}>
        <div className="row"><span style=${{ fontWeight: 700, fontSize: 14 }}>${FXK[k].name}</span><span className="muted" style=${{ fontSize: 11 }}>${FXK[k].pair}</span></div>
        <div className="row"><span className="px">${N("₪" + S.now.toFixed(3))}</span>${S.c1 != null ? N(pct(S.c1, 1, true), "") : null}</div>
        <div className="row" style=${{ fontSize: 12 }}><span className="muted">מול לפני שנה</span>${S.c12 != null ? N(pct(S.c12, 1, true)) : "—"}</div>
        <div className="row"><span className="muted" style=${{ fontSize: 12 }}>מה זה אומר? ←</span></div>
      </button>`;
    })}</div></div>`;
  }
  function CurrencyView(props) {
    var k = props.k, fx = props.fx, K = FXK[k], S = fxStats(fx, k);
    var _a = useState(10000), amt = _a[0], setAmt = _a[1];
    if (!S) return html`<section className="card"><p className="muted">אין נתונים.</p></section>`;
    var rows = S.ks.slice(-60).map(function (m) { return { label: lbl(m), v: S.mon[m] }; });
    var chart = RC ? e(RC.ResponsiveContainer, { width: "100%", height: 240 }, e(RC.LineChart, { data: rows, margin: { top: 10, right: 10, left: 4, bottom: 0 } },
      e(RC.CartesianGrid, { stroke: "#24314F", strokeDasharray: "3 4", vertical: false }),
      e(RC.XAxis, { dataKey: "label", tick: AX, stroke: "#24314F", reversed: true, interval: 11 }),
      e(RC.YAxis, { tick: AX, stroke: "#24314F", orientation: "right", width: 46, domain: ["auto", "auto"], tickFormatter: function (v) { return v.toFixed(2); } }),
      e(RC.Tooltip, { content: function (pp) { return e(TT, Object.assign({}, pp, { fmt: { v: function (v) { return "₪" + v.toFixed(3); } } })); } }),
      e(RC.ReferenceLine, { y: S.avg5, stroke: "#93A0B8", strokeDasharray: "4 4" }),
      e(RC.Line, { dataKey: "v", name: K.name, stroke: "#E9B949", strokeWidth: 2.5, dot: false, isAnimationActive: false }))) : null;
    var vsAvg = (S.now / S.avg5 - 1) * 100;
    var exUp = amt * S.now * 0.05, ratio = fx.rep && fx.rep.usd && fx.rep.eur ? fx.rep.eur / fx.rep.usd : null;
    return html`<div>
      <section className="card"><div className="hero"><div>
        <div className="kicker">מטבע · ${K.pair}</div>
        <div className="nm"><h2>${K.name}</h2></div>
        <div className="price">${N("₪" + S.now.toFixed(4))}</div>
        <div className="muted" style=${{ fontSize: 13 }}>${fx.rep ? "השער היציג של בנק ישראל, " : ""}${dt(S.date)}</div>
        <p style=${{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>${K.sym === "$" ? "דולר אחד" : "יורו אחד"} עולה היום ${N("₪" + S.now.toFixed(2))}. זה ${vsAvg >= 0 ? "גבוה" : "נמוך"} ב־${pct(Math.abs(vsAvg), 1)} מהממוצע של 5 השנים האחרונות (₪${S.avg5.toFixed(2)}) – כלומר ה${K.sym === "$" ? "דולר" : "יורו"} ${Math.abs(vsAvg) < 3 ? "בערך במחיר הרגיל שלו" : vsAvg >= 0 ? "יקר יחסית, והשקל חלש" : "זול יחסית, והשקל חזק"}.</p>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="l">לעומת לפני חודש</div><div className=${"v"}>${N(pct(S.c1, 1, true))}</div><div className="s">מול ממוצע החודש הקודם</div></div>
        <div className="kpi"><div className="l">לעומת לפני שנה</div><div className="v">${N(pct(S.c12, 1, true))}</div></div>
        <div className="kpi"><div className="l">לעומת לפני 5 שנים</div><div className="v">${N(pct(S.c5, 1, true))}</div></div>
        <div className="kpi"><div className="l">טווח 12 חודשים</div><div className="v">${N(S.lo.toFixed(2) + "–" + S.hi.toFixed(2))}</div><div className="s">ממוצעים חודשיים</div></div>
        ${ratio ? html`<div className="kpi"><div className="l">יורו מול דולר</div><div className="v">${N(ratio.toFixed(3))}</div><div className="s">יורו אחד = כמה דולרים</div></div>` : null}
      </div></div></section>
      <section className="card"><div className="sec-h"><div><div className="kicker">5 שנים</div><h2>הממוצע החודשי של ${K.name}</h2></div><div className="hint">הקו המקווקו: ממוצע 5 שנים</div></div>
        <div className="chart">${chart || html`<${NoCharts}/>`}</div></section>
      <section className="card"><div className="sec-h"><div><div className="kicker">הסבר</div><h2>מה זה אומר כש${K.sym === "$" ? "הדולר" : "היורו"} עולה או יורד?</h2></div></div>
        <div className="pc">
          <div className="col"><h3 className="up">כש${K.sym === "$" ? "הדולר" : "היורו"} עולה (השקל נחלש)</h3><ul>${K.up.map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ul></div>
          <div className="col risk"><h3 className="down">כש${K.sym === "$" ? "הדולר" : "היורו"} יורד (השקל מתחזק)</h3><ul>${K.down.map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ul></div>
        </div>
        <h3 style=${{ marginTop: 16 }}>מה מזיז את השער?</h3>
        <ul className="opts">${K.move.map(function (t, i) { return html`<li key=${i}>${t}</li>`; })}</ul>
      </section>
      <section className="card"><div className="sec-h"><div><div className="kicker">דוגמה</div><h2>מה זה עושה להשקעה שלך</h2></div></div>
        <div className="tk-in"><label htmlFor="fxamt" className="muted">יש לך השקעה של</label><input id="fxamt" className="num-in" type="number" min="0" step="1000" value=${amt} onInput=${function (ev) { setAmt(Math.max(0, +ev.target.value || 0)); }}/><span>${K.sym}</span></div>
        <p style=${{ fontSize: 15.5, lineHeight: 1.7 }}>היום היא שווה ${N("₪" + Math.round(amt * S.now).toLocaleString("en-US"))}. אם ה${K.sym === "$" ? "דולר" : "יורו"} יעלה ב־5%, היא תהיה שווה ${N("₪" + Math.round(amt * S.now * 1.05).toLocaleString("en-US"))} (+₪${Math.round(exUp).toLocaleString("en-US")}) – בלי שההשקעה עצמה זזה. אם הוא ירד ב־5%, תפסיד ₪${Math.round(exUp).toLocaleString("en-US")} באותה דרך.</p>
        <p className="muted" style=${{ fontSize: 13.5 }}>לכן מי שמשקיע בחו״ל מרוויח (או מפסיד) פעמיים: מהמניה ומהמטבע. בלשונית "התיק שלי" ובתיק הניסיוני אפשר לראות את התיק גם בשקלים.</p>
      </section>
      <p className="method">שער נוכחי: השער היציג של בנק ישראל. גרף ושינויים: ממוצעים חודשיים מ־x-rates.com. אין לנו תחזית לשער – אף אחד לא יודע לחזות מטבעות באופן עקבי. מידע לימודי, לא ייעוץ.</p>
      <section className="card"><div className="sec-h"><div><div className="kicker">שקיפות</div><h2>מקורות</h2></div></div><ol className="src-list">
        ${fx.rep ? html`<li><a href=${fx.rep.src} target="_blank" rel="noopener">בנק ישראל – שערי חליפין יציגים</a></li>` : null}
        <li><a href=${k === "USD" ? fx.src : fx.eur.src} target="_blank" rel="noopener">x-rates – ממוצעים חודשיים ${K.pair}</a></li></ol></section>
    </div>`;
  }
  var HOME_IDX = ["SPX", "NDX", "TA35", "TA125"];
  function MarketBar(props) {
    var data = props.data, fx = data.fx;
    var items = HOME_IDX.map(function (id) { return (data.indices || []).find(function (x) { return x.id === id; }); }).filter(Boolean);
    return html`<section className="card mbar" aria-label="מדדים ומטבעות">
      <div className="sec-h" style=${{ marginBottom: 8 }}><div><div className="kicker">השווקים היום</div></div><button className="lnk" onClick=${props.onAll}>כל המדדים ←</button></div>
      <div className="mbar-row">${items.map(function (x) {
        return html`<button key=${x.id} onClick=${function () { props.onPick("IDX:" + x.id); }}><span className="muted">${x.nameHe}</span><b className="num">${lvl(Math.round(x.level))}</b>${N(pct(x.chg, 1, true), cls(x.chg))}</button>`;
      })}${["USD", "EUR"].map(function (k) { var S = fx && fxStats(fx, k); return S ? html`<button key=${k} onClick=${function () { props.onPick("FX:" + k); }}><span className="muted">${FXK[k].name}</span><b className="num">₪${S.now.toFixed(3)}</b><span className="muted" style=${{ fontSize: 12 }}>מה זה אומר?</span></button>` : null; })}</div>
    </section>`;
  }

  // ---------- app ----------
  function App() {
    var _d = useState(null), data = _d[0], setData = _d[1];
    var _er = useState(null), err = _er[0], setErr = _er[1];
    var _t = useState(null), cur = _t[0], setCur = _t[1];
    var _u = useState(null), unknown = _u[0], setUnknown = _u[1];
    var _db = useState(null), db = _db[0], setDb = _db[1];
    var _sm = useState(null), sample = _sm[0], setSample = _sm[1];
    var _un = useState(null), uni = _un[0], setUni = _un[1];
    var _w = useStored("shemesh-watch", []), watch = _w[0], setWatch = _w[1];
    var _pf = useStored("shemesh-port", []), port = _pf[0], setPort = _pf[1];
    var _cs = useState(null), cmpSel = _cs[0], setCmpSel = _cs[1];
    var _mt = useState("watch"), myTab = _mt[0], setMyTab = _mt[1];
    var _pp = useState(""), portPreset = _pp[0], setPortPreset = _pp[1];
    var _md = useStored("shemesh-mode", "simple"), mode = _md[0], setMode = _md[1];
    var _jn = useStored("shemesh-journal", {}), journal = _jn[0], setJournal = _jn[1];
    var _sc = useState(function () { return (location.hash || "").length > 1 ? "stock" : "home"; }), screen = _sc[0], setScreen = _sc[1];
    var _st = useState("sum"), stab = _st[0], setStab = _st[1];
    var _bg = useStored("shemesh-big", false), big = _bg[0], setBig = _bg[1];
    var _pr = useStored("shemesh-profile", null), profile = _pr[0], setProfile = _pr[1];
    var _x = useState(null), extras = _x[0], setExtras = _x[1];
    var syncRef = useRef("");
    useEffect(function () {
      if (!db) return;
      var payload = { watch: watch.map(function (w) { return { t: w.t, alert: w.alert || null }; }), journal: Object.keys(journal).reduce(function (o, t) { o[t] = { rules: journal[t].rules || [] }; return o; }, {}), held: Object.keys(port.reduce(function (o, p) { o[p.t] = 1; return o; }, {})) };
      var sig = JSON.stringify(payload);
      if (syncRef.current === "") {
        syncRef.current = "loading";
        var ref = db.doc("my/state");
        Promise.resolve(ref.get ? ref.get() : null).then(function (res) {
          var r = res && (typeof res.data === "function" ? res.data() : res.data || res);
          if (r && Array.isArray(r.watch) && !watch.length && r.watch.length) setWatch(r.watch);
          if (r && r.journal && !Object.keys(journal).length && Object.keys(r.journal).length) setJournal(r.journal);
          syncRef.current = "ready";
        }, function () { syncRef.current = "ready"; });
        return;
      }
      if (syncRef.current === "loading" || syncRef.current === sig) return;
      syncRef.current = sig;
      try { db.doc("my/state").set(Object.assign({ updatedAt: new Date().toISOString() }, payload)).catch(function () { }); } catch (e1) { }
    }, [db, watch, journal, port]);
    var pendingRef = useRef((location.hash || "").replace("#", "").toUpperCase());
    var firstScreen = useRef(true);
    useEffect(function () { if (firstScreen.current) { firstScreen.current = false; return; } try { window.scrollTo({ top: 0 }); } catch (x) { } }, [screen, stab]);

    useEffect(function () {
      fetch("data.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          setData(j);
          var h = pendingRef.current;
          var hi = (j.indices || []).find(function (x) { return x.id === h; });
          setCur(j.stocks[h] ? h : hi ? "IDX:" + hi.id : j.order[0]);
          if (j.stocks[h] || hi) pendingRef.current = "";
        })
        .catch(function () { setErr("לא הצלחתי לטעון את קובץ הנתונים. רעננו את הדף."); });
      fetch("universe.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (u) {
        if (!u || !u.rows) return;
        u.map = {}; u.rows.forEach(function (x) { u.map[x[0]] = x; });
        setUni(u);
        var h = pendingRef.current;
        if (h && u.map[h]) { setCur("L:" + h); pendingRef.current = ""; }
      }).catch(function () {});
      fetch("extras.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (x) { if (x) setExtras(x); }).catch(function () {});
      if (window.claude && window.claude.use) {
        window.claude.use("db").then(function (x) { if (x) setDb(x); }, function () {});
        window.claude.use("sample").then(function (x) { if (x) setSample(function () { return x; }); }, function () {});
      }
    }, []);

    function pick(t) {
      setUnknown(null);
      var key = t;
      if (t.indexOf("IDX:") !== 0 && t.indexOf("FX:") !== 0) {
        var T = t.toUpperCase();
        if (data.stocks[T]) key = T;
        else if (uni && uni.map[T]) key = "L:" + T;
        else { setUnknown(t); setScreen("stock"); return; }
      }
      setCur(key); setStab("sum"); setScreen("stock");
      try { history.replaceState(null, "", "#" + key.replace("IDX:", "").replace("L:", "").replace("FX:", "").toLowerCase()); } catch (x) { }
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (x) { }
    }
    function scrollTo(id) { setTimeout(function () { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }

    if (err) return html`<div className="wrap"><div className="state">${err}</div></div>`;
    if (!data || !cur) return html`<div className="wrap"><div className="state">טוען את הדשבורד…</div></div>`;
    var idx = cur.indexOf("IDX:") === 0 ? (data.indices || []).find(function (x) { return "IDX:" + x.id === cur; }) : null;
    var lite = cur.indexOf("L:") === 0 && uni ? uni.map[cur.slice(2)] : null;
    var fxk = cur.indexOf("FX:") === 0 ? cur.slice(3) : null;
    var s = idx || lite || fxk ? data.stocks[data.order[0]] : data.stocks[cur];
    var d = C.derive(s);
    var deep = {}; data.order.forEach(function (t) { deep[t] = 1; });
    var spxI = (data.indices || []).find(function (x) { return x.id === "SPX"; });
    var mkt1y = spxI && spxI.ret1y != null ? spxI.ret1y : null;
    var uniAsOf = uni && uni.asOf ? dt(uni.asOf) : "";
    function toggleWatch(t) { setWatch(watch.some(function (w) { return w.t === t; }) ? watch.filter(function (w) { return w.t !== t; }) : watch.concat([{ t: t, alert: null, added: new Date().toISOString().slice(0, 10) }])); }
    function openTool(tab, t) { setMyTab(tab); if (tab === "port" || tab === "journal") setPortPreset(t || ""); setScreen("mine"); }
    var sel = cmpSel || [data.stocks[cur] ? cur : data.order[0], data.order.find(function (t) { return t !== cur && t !== data.order[0]; }) || data.order[1]];
    function addCompare(t) { var n = sel.indexOf(t) >= 0 ? sel : (sel.length >= 3 ? sel.slice(0, 2).concat([t]) : sel.concat([t])); setCmpSel(n); setScreen("discover"); scrollTo("sec-compare"); }
    function go(scr) { if (scr === "paper") return openTool("paper"); setScreen(scr); }
    function goLearn(id) { setScreen("learn"); scrollTo(id === "crash" ? "sec-crash" : "sec-" + id); }
    var curT = idx || fxk ? null : lite ? lite[0] : cur;
    var my = { data: data, uni: uni, watch: watch, setWatch: setWatch, port: port, setPort: setPort, onPick: pick, preset: portPreset, journal: journal, setJournal: setJournal, mkt1y: mkt1y, goLearn: goLearn };
    var simple = mode === "simple";
    var jHits = journalHits(journal, data, uni);
    var nAlerts = jHits.length + watch.filter(function (w) { var q = quote(w.t, data, uni); var tg = w.alert || (q && q.entry); return q && tg && q.price <= tg; }).length;
    var P = C.pillars(s, d, mkt1y);

    var body;
    if (screen === "home") body = html`<div>
      ${profile ? null : html`<${Profile} setMode=${setMode} setProfile=${setProfile}/>`}
      <${MarketBar} data=${data} onPick=${pick} onAll=${function () { setScreen("discover"); scrollTo("sec-indices"); }}/>
      <${NextStep} data=${data} extras=${extras} go=${go}/>
      <${Morning} data=${data} uni=${uni} watch=${watch} port=${port} onPick=${pick}/>
      <${Queue} db=${db}/>
    </div>`;
    else if (screen === "stock") {
      var main;
      if (fxk) main = html`<${CurrencyView} key=${fxk} k=${fxk} fx=${data.fx}/>`;
      else if (idx) main = html`<${IndexView} key=${idx.id} x=${idx} db=${db} sample=${sample}/>`;
      else if (lite) main = html`<${LiteView} key=${lite[0]} row=${lite} uni=${uni} asOf=${uniAsOf} deep=${deep} db=${db} sample=${sample} onPick=${pick}/>`;
      else {
        var tabBody;
        if (stab === "sum") tabBody = html`<div>
          <${DecisionCard} s=${s} d=${d} mkt1y=${mkt1y}/>
          <${Verdict} s=${s} d=${d}/>
          <${Outlook} s=${s} d=${d}/></div>`;
        else if (stab === "legends") tabBody = html`<${Legends} key=${"lg-" + cur} s=${s} d=${d} data=${data} mkt1y=${mkt1y} extras=${extras}/>`;
        else if (stab === "chart") tabBody = html`<${PriceHistory} key=${"h-" + cur} s=${s} d=${d} hist=${data.history}/>`;
        else if (stab === "fin") tabBody = simple ? html`<div className="card simple-more"><span>הדוחות הכספיים ל־5 שנים ומכפילי השוק מוצגים במצב "מתקדם".</span><button className="btn ghost" onClick=${function () { setMode("pro"); }}>עבור למתקדם</button></div>` : html`<div><${Hero} s=${s} d=${d} noJump=${true}/><${Fin} key=${"fin-" + cur} s=${s} d=${d}/></div>`;
        else if (stab === "analysts") tabBody = html`<div><section className="card"><${FeaturedAnalysts} t=${s.ticker} extras=${extras}/></section><${Analysts} s=${s} d=${d}/></div>`;
        else tabBody = html`<${AnalystTools} key=${"at-" + cur} s=${s} d=${d} data=${data} mode=${mode}/>`;
        main = html`<div>
          <${StockSummary} s=${s} d=${d} P=${P} onMore=${function () { setStab("sum"); scrollTo("sec-decision"); }}/>
          <${StockTabs} tab=${stab} setTab=${setStab}/>
          ${tabBody}
          ${stab === "sum" ? html`<${Sources} s=${s} macro=${data.macro}/>` : null}</div>`;
      }
      body = html`<div>
        ${unknown ? html`<${AiAnalysis} key=${"u-" + unknown} query=${unknown} db=${db} sample=${sample} onClose=${function () { setUnknown(null); }}/>` : null}
        <div id="sec-main" style=${{ scrollMarginTop: 8 }}>
        ${curT ? html`<${ActionBar} t=${curT} deep=${!!data.stocks[curT]} watch=${watch} port=${port} toggleWatch=${toggleWatch} openTool=${openTool} addCompare=${addCompare} onShare=${data.stocks[curT] ? function () { var S = data.stocks[curT], D2 = C.derive(S); shareCard(S, D2, C.pillars(S, D2, mkt1y)); } : null}/>` : null}
        ${main}</div></div>`;
    }
    else if (screen === "mine") body = e(MyArea, Object.assign({}, my, { tab: myTab, setTab: setMyTab }));
    else if (screen === "discover") body = html`<div>
      <${IndicesStrip} indices=${data.indices} fx=${data.fx} cur=${cur} onPick=${pick}/>
      <${Screener} data=${data} mkt1y=${mkt1y} onPick=${pick}/>
      <${Compare} data=${data} sel=${sel} setSel=${setCmpSel} mkt1y=${mkt1y} onPick=${pick}/>
      <${Categories} uni=${uni} deep=${deep} onPick=${pick}/>
      <${Markets} markets=${data.markets}/>
      <${Macro} macro=${data.macro}/>
      <${TrackRecord} data=${data} onPick=${pick}/>
    </div>`;
    else body = html`<div>
      <${Academy} data=${data} extras=${extras}/>
      <${TimeMachine} data=${data}/>
      <${Compound}/>
      <${IndexTruth} extras=${extras}/>
      <${Crashes} extras=${extras}/>
      <${Guide}/>
      <${Learn} s=${s} d=${d}/>
      <${Glossary}/>
      <${LearnMore} extras=${extras}/>
    </div>`;

    return html`<div className=${"wrap" + (big ? " big" : "")}>
      <${NavBar} screen=${screen} go=${go} alerts=${nAlerts}/>
      <${Header} data=${data} uni=${uni} cur=${cur} onPick=${pick} onUnknown=${function (t) { pick(t); }} compact=${screen !== "home"}/>
      ${screen === "home" ? html`<${InstallTip}/>` : null}
      <${TopTools} mode=${mode} setMode=${setMode} big=${big} setBig=${setBig}/>
      ${screen === "home" || screen === "mine" ? html`<${AlertBanner} watch=${watch} data=${data} uni=${uni} onPick=${pick} jHits=${jHits} openTool=${openTool}/>` : null}
      ${body}
      <footer className="foot">הדקה הכלכלית של שמש · מידע לימודי ומעקב בלבד, לא ייעוץ השקעות ולא תחליף לבעל רישיון. "96% דיוק" הוא שם המותג. כל מספר בדף מגיע עם מקור; טעויות יכולות לקרות – בדקו לפני החלטה.</footer>
    </div>`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();

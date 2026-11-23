/* Todoist-style picker for Jace's Resume 🔥 tasks, rendered inside a Claude Visualizer widget.
   Usage: renderResumePicker(el, tasks)
   Task: {i:id, c:content, d?:description markdown, p:1-4 priority, du?:'YYYY-MM-DD' due,
          dl?:'YYYY-MM-DD' deadline, t?:'45m' duration, l?:[[name,colorName|null]],
          pr?:[name,colorName], a:addedAt ISO}
   Selecting a row and pressing the button calls sendPrompt() with the task. */
(function () {
  var TZ = 'America/Chicago';
  var PRI = { 1: '#D1453B', 2: '#EB8909', 3: '#246FE0', 4: '#999999' };
  var COLOR = { berry_red: '#B8255F', red: '#DC4C3E', orange: '#C77100', yellow: '#B29104', olive_green: '#949C31', lime_green: '#65A33A', green: '#369307', mint_green: '#42A393', teal: '#148FAD', sky_blue: '#319DC0', light_blue: '#6988A4', blue: '#4180FF', grape: '#692EC2', violet: '#CA3FEE', lavender: '#A4698C', magenta: '#E05095', salmon: '#C9766F', charcoal: '#808080', grey: '#999999', taupe: '#8F7A69' };
  var CSS = '.rp .td-row{display:flex;gap:10px;padding:10px 8px 10px 4px;border-bottom:0.5px solid var(--border);cursor:pointer;border-radius:0}' +
    '.rp .td-row:hover{background:var(--bg-neutral)}' +
    '.rp .td-row.sel{background:var(--bg-accent-muted,var(--bg-neutral));box-shadow:inset 3px 0 0 var(--border-accent)}' +
    '.rp .td-chk{flex:none;width:18px;height:18px;border-radius:50%;border:2px solid;margin-top:3px}' +
    '.rp .td-desc{font-size:13px;color:var(--text-secondary);margin-top:2px}' +
    '.rp .td-desc a{color:var(--text-secondary);text-decoration:underline}' +
    '.rp .td-meta{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13px;margin-top:6px;align-items:center}' +
    '.rp .td-meta i{font-size:15px;vertical-align:-2px;margin-right:3px}' +
    '.rp .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function md(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, t, u) { return '<a href="' + u + '">' + t + '</a>'; })
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:500">$1</strong>');
  }
  function localMidnight(d) { var x = new Date(d.toLocaleString('en-US', { timeZone: TZ })); x.setHours(0, 0, 0, 0); return x; }
  var TODAY = localMidnight(new Date());
  function pd(s) { var a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  function days(d) { return Math.round((d - TODAY) / 864e5); }
  function fmt(d, o) { return d.toLocaleDateString('en-US', o); }
  function due(s) {
    var d = pd(s), n = days(d), md_ = fmt(d, { month: 'short', day: 'numeric' });
    if (n < 0) return { t: md_, c: '#D1453B' };
    if (n === 0) return { t: 'Today', c: '#058527' };
    if (n === 1) return { t: 'Tomorrow', c: '#AD6200' };
    if (n < 7) return { t: fmt(d, { weekday: 'long' }), c: '#692EC2' };
    return { t: md_, c: 'var(--text-secondary)' };
  }
  function deadline(s) {
    var d = pd(s), n = days(d);
    return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n > 1 && n < 7 ? 'In ' + n + ' days' : fmt(d, { month: 'short', day: 'numeric' });
  }
  function labelColor(l) { if (l[1] && COLOR[l[1]]) return COLOR[l[1]]; if (/⁺$/.test(l[0])) return COLOR.taupe; return 'var(--text-secondary)'; }
  function span(color, icon, text) { return '<span style="color:' + color + '"><i class="ti ti-' + icon + '" aria-hidden="true"></i>' + text + '</span>'; }
  function meta(t) {
    var p = [];
    if (t.du) { var r = due(t.du); p.push(span(r.c, 'calendar-event', r.t + (t.t ? ' · ' + esc(t.t) : ''))); }
    else if (t.t) p.push(span('var(--text-secondary)', 'clock', esc(t.t)));
    if (t.dl) p.push(span('#7C4DDB', 'target-arrow', deadline(t.dl)));
    (t.l || []).forEach(function (l) { p.push(span(labelColor(l), 'tag', esc(l[0]))); });
    return p.join('');
  }
  function group(iso) {
    var d = localMidnight(new Date(iso)), n = days(d);
    return fmt(d, { month: 'short', day: 'numeric' }) + (n === 0 ? ' · Today' : n === -1 ? ' · Yesterday' : '') + ' · ' + fmt(d, { weekday: 'long' });
  }

  window.renderResumePicker = function (el, tasks) {
    tasks = (tasks || []).slice().sort(function (a, b) { return String(b.a).localeCompare(String(a.a)); });
    var html = '<style>' + CSS + '</style><div class="rp" style="padding:0.5rem 0;max-width:640px">' +
      '<h2 class="sr">Todoist-style picker of open Resume tasks; select one to resume.</h2>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><i class="ti ti-droplet" style="font-size:20px;color:#C77100" aria-hidden="true"></i><h1 style="margin:0;font-size:22px">Resume 🔥</h1></div>' +
      '<p style="font-size:14px;color:var(--text-muted);margin:0 0 16px">These are tasks I started but haven\'t finished. Most recent task is listed first.</p>' +
      '<div class="rp-list" role="radiogroup" aria-label="Resume tasks">';
    var last = '';
    tasks.forEach(function (t) {
      var g = group(t.a);
      if (g !== last) { html += '<div style="font-size:14px;font-weight:500;padding:8px 0;border-bottom:0.5px solid var(--border)">' + g + '</div>'; last = g; }
      var c = PRI[t.p] || PRI[4];
      var proj = t.pr ? '<div class="td-meta" style="white-space:nowrap;color:' + (COLOR[t.pr[1]] || 'var(--text-secondary)') + '">#' + esc(t.pr[0]) + '</div>' : '';
      html += '<div class="td-row" role="radio" aria-checked="false" tabindex="0" data-id="' + esc(t.i) + '">' +
        '<span class="td-chk" style="border-color:' + c + ';background:' + c + '1a"></span>' +
        '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text-primary);line-height:1.4">' + esc(t.c) + '</div>' +
        (t.d ? '<div class="td-desc">' + md(t.d) + '</div>' : '') +
        '<div style="display:flex;justify-content:space-between;gap:12px"><div class="td-meta">' + meta(t) + '</div>' + proj + '</div></div></div>';
    });
    html += '</div><div style="display:flex;align-items:center;gap:12px;margin-top:14px"><button class="rp-go">Resume this task ↗</button>' +
      '<span class="rp-err" style="font-size:13px;color:var(--text-danger)"></span></div></div>';
    el.innerHTML = html;

    var rows = [].slice.call(el.querySelectorAll('.td-row')), pick = null, err = el.querySelector('.rp-err');
    function choose(r) {
      rows.forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
      r.classList.add('sel'); r.setAttribute('aria-checked', 'true'); pick = r; err.textContent = '';
    }
    rows.forEach(function (r) {
      r.onclick = function (e) { if (e.target.closest('a')) return; choose(r); };
      r.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); choose(r); } };
    });
    el.querySelector('.rp-go').onclick = function () {
      if (!pick) { err.textContent = 'Pick a task first'; return; }
      resume(tasks.filter(function (x) { return x.i === pick.dataset.id; })[0]);
    };
  };

  function resume(t) { sendPrompt('Resume the 🔥 task "' + t.c.replace(/^🔥\s*/, '') + '" (Todoist id ' + t.i + ').'); }

  /* Single resume button for one task, shown in the chat that owns it.
     Usage: renderResumeButton(el, {i:id, c:content}) */
  window.renderResumeButton = function (el, t) {
    el.innerHTML = '<div style="display:flex;align-items:center;gap:12px;padding:0.5rem 0;flex-wrap:wrap">' +
      '<button class="rb-go">Resume this task ↗</button>' +
      '<span style="font-size:13px;color:var(--text-secondary);min-width:0">' + esc(t.c) + '</span></div>';
    el.querySelector('.rb-go').onclick = function () { resume(t); };
  };
})();

/* app.js – shared utilities */

async function api(path, body) {
  const o = body
    ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }
    : { method:'GET' };
  const r = await fetch(path, o);
  return r.json();
}

function alert_(msg, type, secs) {
  const el = document.getElementById('alert');
  if (!el) return;
  const map = { ok:'aok', err:'aerr', warn:'awn', info:'ainf' };
  el.textContent = msg;
  el.className   = 'alert ' + (map[type]||'ainf') + ' show';
  const t = secs ?? (type==='err'?0:4);
  if (t>0) setTimeout(()=>el.classList.remove('show'), t*1000);
}

function showSec(id) {
  document.querySelectorAll('[data-sec]').forEach(s => s.classList.add('sh'));
  const el = document.getElementById('s-'+id);
  if (el) el.classList.remove('sh');
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.sec===id));
  if (typeof afterShow==='function') afterShow(id);
}

function openM(id)  { document.getElementById(id).classList.add('open');  }
function closeM(id) { document.getElementById(id).classList.remove('open'); }

function rupee(n) { return '₹'+parseFloat(n||0).toFixed(2); }
function dt(d)    { return d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'; }

function badge(s) {
  const m={PENDING:'bp',CONFIRMED:'bc',REJECTED:'brej',DISPATCHED:'bd',DELIVERED:'bdel'};
  return `<span class="badge ${m[s]||''}">${s}</span>`;
}

function logout() { window.location.href='/api/logout'; }

async function checkAuth(role) {
  let d;
  try { d = await api('/api/me'); } catch { window.location.href='/?error=Server+not+running'; return null; }
  if (!d||!d.role) { window.location.href='/?error=Session+expired.+Login+again.'; return null; }
  if (d.role!==role) { window.location.href='/?error=Access+denied.'; return null; }
  const n=document.getElementById('sbName'), r=document.getElementById('sbRole');
  if (n) n.textContent=d.name;
  if (r) r.textContent=d.role;
  return d;
}

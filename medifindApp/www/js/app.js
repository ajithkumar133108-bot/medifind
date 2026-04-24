/* app.js – shared utilities */

async function api(path, body) {
  const o = body
    ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }
    : { method:'GET' };
  
  const baseUrl = 'http://10.67.132.109:3000';
  const fullPath = path.startsWith('/') ? baseUrl + path : path;

  const r = await fetch(fullPath, o);
  return r.json();
}

function alert_(msg, type, secs) {
  if (typeof showMsg === 'function') {
    showMsg(msg, type);
    return;
  }
  const el = document.getElementById('alert');
  if (!el) return;
  const map = { ok:'aok', err:'aerr', warn:'awn', info:'ainf' };
  el.textContent = msg;
  el.className   = 'alert ' + (map[type]||'ainf') + ' show';
  const t = secs ?? (type==='err'?0:4);
  if (t>0) setTimeout(()=>el.classList.remove('show'), t*1000);
}

// Input Validation Functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(pass) {
  return pass.length >= 6;
}

function validateRequired(value, fieldName) {
  if (!value || value.trim() === '') {
    alert_(`${fieldName} is required.`, 'err');
    return false;
  }
  return true;
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Loading…' : btn.dataset.originalText || btn.textContent;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
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

async function getAISuggestions() {
  const symptoms = document.getElementById('symptomsInp').value.trim();
  if (!symptoms) {
    alert_('Please describe your symptoms.', 'err');
    return;
  }
  const res = document.getElementById('aiResults');
  res.innerHTML = '<div class="loading">🤖 Analyzing symptoms...</div>';
  try {
    const data = await api('/api/ai/suggest', { symptoms });
    if (data.success) {
      let html = '<h4>Recommended Medicines:</h4><ul>';
      data.medicines.forEach(m => {
        html += `<li><strong>${m.name}</strong> - ${m.description}</li>`;
      });
      html += '</ul>';
      if (data.pharmacies && data.pharmacies.length > 0) {
        html += '<h4>Nearby Pharmacies:</h4><ul>';
        data.pharmacies.forEach(p => {
          html += `<li><strong>${p.name}</strong> (${p.distance.toFixed(1)} km) - ${p.address}</li>`;
        });
        html += '</ul>';
      }
      res.innerHTML = html;
    } else {
      res.innerHTML = '<div class="error">No recommendations found. Please try different symptoms.</div>';
    }
  } catch (e) {
    res.innerHTML = '<div class="error">Failed to get AI suggestions. Try again.</div>';
  }
}


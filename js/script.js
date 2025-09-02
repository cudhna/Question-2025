// Simple CSV parser (handles quoted fields and commas inside quotes)
function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i+1] === '"') { field += '"'; i += 2; continue; } // escaped quote
        inQuotes = false; i++; continue;
      } else { field += c; i++; continue; }
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); field = ''; row = []; i++; continue; }
      field += c; i++; continue;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

async function loadCSV(path) {
  const res = await fetch(path, {cache:'no-store'});
  if (!res.ok) throw new Error('Không tải được ' + path);
  const text = await res.text();
  const rows = parseCSV(text).filter(r => r.length && r.some(x => String(x).trim().length));
  const header = rows.shift().map(h => String(h).trim());
  const idx = name => header.indexOf(name);
  return rows.map(r => ({
    id: String(r[idx('id')] || '').trim(),
    q: String(r[idx('q')] || '').trim(),
    a: String(r[idx('a')] || '').trim(),
    b: String(r[idx('b')] || '').trim(),
    c: String(r[idx('c')] || '').trim(),
    correct: String(r[idx('correct')] || '').trim().toUpperCase()
  })).filter(x => x.q);
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function render(questions) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const total = questions.length;
  document.getElementById('total').textContent = total;
  let score = 0;
  const solved = new Map(); // id -> true/false

  questions.forEach((q, idx) => {
    const card = el('section','card');
    const meta = el('div','meta', `<span>Thuật ngữ</span><span>${idx+1}/${total}</span>`);
    const qtext = el('div','qtext');
    qtext.textContent = q.q;

    const options = el('div','options');
    const choices = [['A', q.a], ['B', q.b], ['C', q.c]].filter(([,t]) => t && t.trim().length);
    choices.forEach(([k, text]) => {
      const btn = el('button','btn');
      const label = el('span', null, `${text}`);
      const badge = el('span','badge');
      btn.append(el('strong',null,`${k}.`));
      btn.append(label);
      btn.append(badge);

      btn.addEventListener('click', () => {
        [...options.children].forEach(b => {
          b.classList.remove('ok','ng');
          const bd = b.querySelector('.badge'); if (bd) bd.textContent='';
        });
        if (k === q.correct) {
          btn.classList.add('ok');
          badge.textContent = 'Đúng';
          const key = q.id || idx;
          if (solved.get(key) !== true) { score++; solved.set(key, true); }
        } else {
          btn.classList.add('ng');
          badge.textContent = 'Sai';
          const key = q.id || idx;
          if (solved.get(key) === true) { score--; }
          solved.set(key, false);
        }
        document.getElementById('score').textContent = score;
      });

      options.append(btn);
    });

    card.append(meta, qtext, options);
    app.append(card);
  });
}

loadCSV('assets/questions.csv')
  .then(render)
  .catch(err => {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="card"><div class="qtext">Lỗi tải câu hỏi: ${err.message}</div></div>`;
  });

async function loadCSV(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Không tải được ${path} (HTTP ${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text).filter(r => r.length && r.some(x => String(x).trim().length));

  // header chuẩn hóa: trim + bỏ BOM + lowercase
  const rawHeader = rows.shift();
  const header = rawHeader.map(h => String(h || '')
    .replace(/^\uFEFF/, '') // strip BOM
    .trim().toLowerCase());

  const idx = name => header.indexOf(name);

  const need = ['id','q','a','b','c','correct'];
  for (const k of need) if (idx(k) === -1) throw new Error(`Thiếu cột '${k}' trong header CSV`);

  return rows.map(r => ({
    id: String(r[idx('id')] || '').trim(),
    q:  String(r[idx('q')]  || '').trim(),
    a:  String(r[idx('a')]  || '').trim(),
    b:  String(r[idx('b')]  || '').trim(),
    c:  String(r[idx('c')]  || '').trim(),
    d:  String(r[idx('d')]  || '').trim(),
    correct: String(r[idx('correct')] || '').trim().toUpperCase()
  })).filter(x => x.q);
}

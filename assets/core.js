/* 公共核心：存储、配置、提示、图片处理、导航 */
window.Gift = window.Gift || {};
(function (G) {
  'use strict';

  /* localStorage 封装 */
  G.LS = {
    get(k, d) { try { const v = localStorage.getItem('gift:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gift:' + k, JSON.stringify(v)); return true; } catch (e) { G.toast('本地空间不足，请换小一点的图片'); return false; } },
    del(k) { localStorage.removeItem('gift:' + k); }
  };
  G.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  G.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 提示条 */
  let toastTimer;
  G.toast = function (msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  };

  /* 个人化配置 */
  const DEFAULT_CFG = { name: '亲爱的你', title: '给她的礼物', birthday: '' };
  G.cfg = Object.assign({}, DEFAULT_CFG, G.LS.get('config', {}));
  G.saveCfg = function (patch) {
    Object.assign(G.cfg, patch); G.LS.set('config', G.cfg); G.applyCfg();
  };
  G.applyCfg = function () {
    document.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.getAttribute('data-bind');
      if (G.cfg[key] != null) el.textContent = G.cfg[key];
    });
    document.title = (G.cfg.title || '生日礼物') + ' · ' + (G.cfg.name || '');
    updateCountdown();
  };
  function nextBirthday() {
    if (!G.cfg.birthday) return null;
    const p = String(G.cfg.birthday).split('-').map(Number);
    if (p.length < 3 || !p[1] || !p[2] || p[1] > 12 || p[2] > 31) return null;
    const m = p[1], d = p[2];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    let target = new Date(now.getFullYear(), m - 1, d);
    if (target < now) target = new Date(now.getFullYear() + 1, m - 1, d);
    return isNaN(target.getTime()) ? null : target;
  }
  function updateCountdown() {
    const el = document.getElementById('countdown-box'); if (!el) return;
    const t = nextBirthday();
    if (!t) { el.innerHTML = '设置一个生日日期<br><b>—</b> 天后可见'; return; }
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const days = Math.max(0, Math.round((t - now) / 86400000));
    el.innerHTML = days === 0 ? '就是今天，生日快乐！<br><b>♡</b>' :
      '距离下次生日还有<br><b>' + days + '</b> 天';
  }
  G.nextBirthday = nextBirthday;

  /* 图片工具：读取 + 等比缩放为 dataURL，避免本地存储爆掉 */
  G.readImage = function (file, maxSize) {
    maxSize = maxSize || 900;
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) { reject(new Error('请选择图片文件')); return; }
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('读取失败'));
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (Math.max(w, h) > maxSize) { const r = maxSize / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const cx = c.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.86));
        };
        img.onerror = () => reject(new Error('图片解析失败'));
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  };
  G.pickFile = function (accept) {
    return new Promise(resolve => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = accept || 'image/*';
      i.onchange = () => resolve(i.files[0] || null); i.click();
    });
  };
  G.download = function (dataUrl, name) {
    const a = document.createElement('a'); a.href = dataUrl; a.download = name; a.click();
  };

  /* IndexedDB：存放录音等较大的媒体 */
  G.IDB = {
    _db: null,
    open() {
      return new Promise((res, rej) => {
        if (this._db) return res(this._db);
        const r = indexedDB.open('birthday-gift-media', 1);
        r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('media')) r.result.createObjectStore('media', { keyPath: 'id' }); };
        r.onsuccess = () => { this._db = r.result; res(r.result); };
        r.onerror = () => rej(r.error);
      });
    },
    async put(obj) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('media', 'readwrite'); t.objectStore('media').put(obj); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
    async all() { const db = await this.open(); return new Promise((res, rej) => { const r = db.transaction('media', 'readonly').objectStore('media').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); }); },
    async del(id) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('media', 'readwrite'); t.objectStore('media').delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
  };

  /* 背景星尘 */
  function stardust() {
    const box = document.getElementById('stardust'); if (!box) return;
    let html = '';
    for (let i = 0; i < 34; i++) {
      html += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;bottom:-10px;animation-duration:' +
        (14 + Math.random() * 18).toFixed(1) + 's;animation-delay:-' + (Math.random() * 20).toFixed(1) + 's"></i>';
    }
    box.innerHTML = html;
  }

  /* 导航切换 */
  function nav() {
    const btns = document.querySelectorAll('.nav button[data-go]');
    const quicks = document.querySelectorAll('[data-go]');
    function go(id) {
      document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === 'sec-' + id));
      document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b.dataset.go === id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
      window.dispatchEvent(new CustomEvent('gift:section', { detail: id }));
    }
    quicks.forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    const initial = location.hash.slice(1);
    if (initial && document.getElementById('sec-' + initial)) go(initial);
    G.go = go;
  }

  document.addEventListener('DOMContentLoaded', () => {
    stardust(); nav();
    G.applyCfg();
    const save = document.getElementById('cfg-save');
    if (save) save.addEventListener('click', () => {
      G.saveCfg({
        name: document.getElementById('cfg-name').value.trim() || '亲爱的你',
        title: document.getElementById('cfg-title').value.trim() || '给她的礼物',
        birthday: document.getElementById('cfg-birthday').value
      });
      G.toast('已经记下啦，礼物会记住这个名字 ♡');
    });
    ['cfg-name', 'cfg-title', 'cfg-birthday'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = G.cfg[id.replace('cfg-', '')] || '';
    });
    const top = document.getElementById('toTop');
    if (top) {
      window.addEventListener('scroll', () => top.classList.toggle('show', window.scrollY > 420), { passive: true });
      top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  });
})(window.Gift);

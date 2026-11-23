/* 互动礼物全部玩法 */
(function (G) {
  'use strict';
  const $ = id => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', () => {

    /* ---------- 年历缩略预览 ---------- */
    (function preview() {
      const box = $('calPreview'); if (!box) return;
      const seasons = ['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'];
      const colors = { spring:'#8FB89A', summer:'#E8A45C', autumn:'#C9815E', winter:'#7E96BC' };
      box.innerHTML = seasons.map((s, i) =>
        '<div class="cal-mini" style="background:linear-gradient(145deg,' + colors[s] + ',' + colors[s] + 'bb)" title="' + (i+1) + '月">' + (i+1) + '月</div>').join('');
    })();

    /* ---------- 滤镜工坊 ---------- */
    (function filters() {
      const canvas = $('filterCanvas'), drop = $('filterDrop'), ph = $('filterPh');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const PRESETS = [
        ['origin','原图'], ['warm','暖阳'], ['film','胶片'], ['retro','复古'],
        ['mono','黑白'], ['cream','奶油'], ['dusk','暮色'], ['rose','粉调']
      ];
      const FILTERS = {
        origin: () => 'none',
        warm: i => `sepia(${.3*i}) saturate(${1+.35*i}) brightness(${1+.06*i})`,
        film: i => `sepia(${.42*i}) contrast(${1+.18*i}) saturate(${1-.15*i})`,
        retro: i => `sepia(${.65*i}) hue-rotate(${-12*i}deg) contrast(${.92+.12*i}) saturate(${1.1-.2*i})`,
        mono: i => `grayscale(${i}) contrast(${1+.1*i})`,
        cream: i => `brightness(${1+.08*i}) contrast(${.94-.06*i}) saturate(${1-.18*i})`,
        dusk: i => `brightness(${1-.1*i}) contrast(${1+.22*i}) saturate(${1+.1*i}) hue-rotate(${8*i}deg)`,
        rose: i => `sepia(${.2*i}) hue-rotate(${330*i}deg) saturate(${1+.2*i})`
      };
      G.filterCSS = (key, intensity) => (FILTERS[key] || FILTERS.origin)(intensity);
      let img = null, preset = 'warm';

      $('presets').innerHTML = PRESETS.map((p, i) =>
        '<button class="preset' + (i === 1 ? ' active' : '') + '" data-p="' + p[0] + '">' + p[1] + '</button>').join('');

      function render() {
        if (!img) return;
        const w = canvas.width, h = canvas.height;
        const i = Number($('filterIntensity').value) / 100;
        const px = Number($('pixelSize').value);
        const f = FILTERS[preset](i);
        ctx.clearRect(0, 0, w, h);
        if (px < 2) {
          ctx.filter = f; ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, w, h); ctx.filter = 'none';
        } else {
          const sw = Math.max(1, Math.round(w / px)), sh = Math.max(1, Math.round(h / px));
          const small = document.createElement('canvas'); small.width = sw; small.height = sh;
          const sc = small.getContext('2d'); sc.filter = f; sc.drawImage(img, 0, 0, sw, sh);
          ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, w, h);
        }
      }
      function load(file) {
        G.readImage(file, 1200).then(data => {
          const im = new Image();
          im.onload = () => {
            img = im;
            const scale = Math.min(1, 1200 / Math.max(im.width, im.height));
            canvas.width = Math.round(im.width * scale); canvas.height = Math.round(im.height * scale);
            canvas.style.display = 'block'; ph.style.display = 'none';
            $('filterInfo').textContent = im.width + ' × ' + im.height;
            render(); G.toast('照片进来啦，挑个滤镜试试 ✨');
          };
          im.src = data;
        }).catch(e => G.toast(e.message));
      }
      drop.addEventListener('click', () => $('filterFile').click());
      $('filterFile').addEventListener('change', e => e.target.files[0] && load(e.target.files[0]));
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.background = '#FFEADD'; });
      drop.addEventListener('dragleave', () => drop.style.background = '');
      drop.addEventListener('drop', e => { e.preventDefault(); drop.style.background = ''; if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
      $('presets').addEventListener('click', e => {
        const b = e.target.closest('.preset'); if (!b) return;
        document.querySelectorAll('.preset').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); preset = b.dataset.p; render();
      });
      $('filterIntensity').addEventListener('input', e => { $('intensityVal').textContent = e.target.value + '%'; render(); });
      $('pixelSize').addEventListener('input', e => { $('pixelVal').textContent = e.target.value < 2 ? '关闭' : e.target.value + ' px'; render(); });
      $('filterDownload').addEventListener('click', () => {
        if (!img) return G.toast('先上传一张照片吧');
        G.download(canvas.toDataURL('image/png'), 'warm-photo-' + Date.now() + '.png'); G.toast('已下载 ♡');
      });
      $('filterToWall').addEventListener('click', () => {
        if (!img) return G.toast('先上传一张照片吧');
        if (G.addDoodlePhoto) { G.addDoodlePhoto(canvas.toDataURL('image/jpeg', .88)); G.go('doodle'); }
      });
      $('filterClear').addEventListener('click', () => {
        img = null; canvas.style.display = 'none'; ph.style.display = '';
        $('filterFile').value = ''; $('filterInfo').textContent = '';
      });
    })();

    /* ---------- 童年相册回忆录 ---------- */
    (function childhood() {
      if (!$('memTimeline')) return;
      let items = G.LS.get('memories', []);
      if (!items.length && !G.LS.get('memSeeded', false)) {
        items = [
          { id: G.uid(), age:'很小的时候', title:'故事的开头', text:'那张照片还泛着黄，你笑得很用力。世界很大，你很小，但你已经开始发光了。', src:'' },
          { id: G.uid(), age:'再大一点', title:'第一次记事', text:'很多细节已经忘了，但那天的心情还记得。原来记忆留下的是感觉，不是画面。', src:'' },
          { id: G.uid(), age:'某一个夏天', title:'跑得飞快的傍晚', text:'蝉鸣、冰汽水、被晒得发烫的马路。你那时候以为夏天永远过不完。', src:'' },
          { id: G.uid(), age:'现在', title:'长成了很好的人', text:'一路走到今天，变成了值得被认真庆祝的你。生日快乐。', src:'' }
        ];
        G.LS.set('memories', items); G.LS.set('memSeeded', true);
      }
      const save = () => G.LS.set('memories', items);
      let editing = null, pendingSrc = null;

      function resetForm() {
        editing = null; pendingSrc = null;
        ['memAge','memTitle','memText','memFile'].forEach(id => $(id).value = '');
        $('memAdd').textContent = '收进回忆录 🌱';
      }
      function render() {
        const box = $('memTimeline');
        $('memCount').textContent = items.length ? '一共 ' + items.length + ' 页回忆，按时间排列。' : '还没有回忆，先写一段吧。';
        if (!items.length) { box.innerHTML = '<div class="empty">时间线还是空的。</div>'; return; }
        box.innerHTML = items.map((it, i) =>
          '<div class="tl-item"><div class="tl-dot"></div><div class="tl-card">' +
          (it.src ? '<img class="tl-photo" src="' + it.src + '" data-zoom="' + it.id + '" alt="回忆照片">' : '') +
          '<div class="tl-age">' + G.esc(it.age || '那一年') + '</div>' +
          '<div class="tl-title">' + G.esc(it.title || '一段回忆') + '</div>' +
          '<div class="tl-text">' + G.esc(it.text) + '</div>' +
          '<div class="tl-actions"><button data-edit="' + it.id + '">编辑</button><button data-del="' + it.id + '">删除</button></div>' +
          '</div></div>').join('');
      }
      $('memAdd').onclick = async () => {
        const age = $('memAge').value.trim(), title = $('memTitle').value.trim(), text = $('memText').value.trim();
        if (!title && !text) return G.toast('写点什么再收进来吧');
        let src = pendingSrc;
        const f = $('memFile').files[0];
        if (f) { try { src = await G.readImage(f, 900); } catch (e) { return G.toast(e.message); } }
        if (editing) {
          const it = items.find(x => x.id === editing);
          if (it) Object.assign(it, { age, title, text, src: src || it.src });
          resetForm(); G.toast('这一页改好啦');
        } else {
          items.push({ id: G.uid(), age, title, text, src: src || '' });
          G.toast('又收进一段回忆 🌱');
        }
        save(); render();
      };
      $('memReset').onclick = () => { resetForm(); G.toast('可以写新的一段了'); };
      $('memTimeline').addEventListener('click', e => {
        if (e.target.dataset.del) {
          items = items.filter(x => x.id !== e.target.dataset.del); save(); render(); return;
        }
        if (e.target.dataset.edit) {
          const it = items.find(x => x.id === e.target.dataset.edit); if (!it) return;
          editing = it.id; pendingSrc = it.src || null;
          $('memAge').value = it.age || ''; $('memTitle').value = it.title || ''; $('memText').value = it.text || '';
          $('memFile').value = ''; $('memAdd').textContent = '保存修改 ✓';
          $('memAge').scrollIntoView({ behavior: 'smooth', block: 'center' }); G.toast('改完点「保存修改」');
          return;
        }
        if (e.target.dataset.zoom) {
          const it = items.find(x => x.id === e.target.dataset.zoom);
          if (it) { $('modalImg').src = it.src; $('modal').classList.add('open'); }
        }
      });
      render();
    })();

    /* ---------- 滤镜工坊：模式切换 ---------- */
    (function filterTabs() {
      const tabs = $('filterTabs'); if (!tabs) return;
      tabs.addEventListener('click', e => {
        const b = e.target.closest('[data-ftab]'); if (!b) return;
        document.querySelectorAll('[data-ftab]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const which = b.dataset.ftab;
        ['single','collage','deco'].forEach(k => { const el = $(k + 'Panel'); if (el) el.style.display = k === which ? '' : 'none'; });
      });
    })();

    /* ---------- 多图拼贴 ---------- */
    (function collage() {
      const canvas = $('collageCanvas'); if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const LAYOUTS = {
        grid:  [[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]],
        side:  [[0,0,.56,1],[.56,0,.44,.5],[.56,.5,.44,.5]],
        top:   [[0,0,.5,.55],[.5,0,.5,.55],[0,.55,1,.45]],
        strip: [[0,0,.3334,1],[.3333,0,.3334,1],[.6667,0,.3333,1]],
        hero:  [[0,0,1,.56],[0,.56,.3333,.44],[.3333,.56,.3334,.44],[.6667,.56,.3333,.44]],
        four:  [[0,0,.25,1],[.25,0,.25,1],[.5,0,.25,1],[.75,0,.25,1]]
      };
      let photos = [];

      function roundRect(c, x, y, w, h, r) {
        r = Math.min(r, w/2, h/2);
        c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
        c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
        c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
      }
      function render() {
        const W = canvas.width, H = canvas.height, bg = $('collageBg').value;
        ctx.clearRect(0,0,W,H); ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
        if (!photos.length) {
          canvas.style.display='none'; $('collagePh').style.display='';
          $('collageDrop').style.minHeight='210px';
          $('collagePh').innerHTML='<b>🧩</b>点这里选多张照片<br>或把照片拖进来';
          return;
        }
        $('collageDrop').style.minHeight='56px';
        $('collagePh').innerHTML='<b style="font-size:20px">＋</b> 已选好照片，点这里可以继续添加';
        const title = $('collageTitle').value.trim();
        const band = title ? 110 : 0, gap = Number($('collageGap').value);
        const layout = LAYOUTS[$('collageLayout').value] || LAYOUTS.grid;
        const f = G.filterCSS ? G.filterCSS($('collageFilter').value, Number($('collageInt').value)/100) : 'none';
        layout.forEach((cell, i) => {
          const im = photos[i % photos.length];
          const x = cell[0]*W + gap/2, y = cell[1]*(H-band) + gap/2;
          const w = cell[2]*W - gap, h = cell[3]*(H-band) - gap;
          if (w <= 4 || h <= 4) return;
          ctx.save(); roundRect(ctx, x, y, w, h, 16); ctx.clip(); ctx.filter = f;
          const r = Math.max(w/im.width, h/im.height), iw = im.width*r, ih = im.height*r;
          ctx.drawImage(im, x+(w-iw)/2, y+(h-ih)/2, iw, ih); ctx.restore();
        });
        if (title) {
          const y = H - band;
          ctx.fillStyle = bg === '#3C3A4F' ? 'rgba(255,255,255,.94)' : 'rgba(255,253,248,.94)';
          ctx.fillRect(0, y, W, band);
          ctx.fillStyle = '#4A3A33'; ctx.font = '30px "Songti SC","Noto Serif SC",serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(title, W/2, y+band/2, W-80);
        }
        canvas.style.display='block'; $('collagePh').style.display='';
      }
      function update() {
        $('collageCount').textContent = photos.length ? '已选 ' + photos.length + ' 张照片，正在拼贴。' : '还没有照片，先选几张吧。';
        $('collageInfo').textContent = photos.length ? photos.length + ' 张' : '';
        render();
      }
      function load(files) {
        Promise.all(Array.from(files).filter(f => f.type.startsWith('image/')).map(f =>
          G.readImage(f, 1000).then(data => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = data; }))
        )).then(imgs => { if (!imgs.length) return; photos = photos.concat(imgs); update(); G.toast('照片加进来啦 🧩'); })
          .catch(e => G.toast(e.message));
      }
      $('collageDrop').addEventListener('click', () => $('collageFile').click());
      $('collageFile').addEventListener('change', e => { load(e.target.files); e.target.value = ''; });
      $('collageDrop').addEventListener('dragover', e => { e.preventDefault(); $('collageDrop').style.background = '#FFEADD'; });
      $('collageDrop').addEventListener('dragleave', () => $('collageDrop').style.background = '');
      $('collageDrop').addEventListener('drop', e => {
        e.preventDefault(); $('collageDrop').style.background = ''; if (e.dataTransfer.files.length) load(e.dataTransfer.files);
      });
      ['collageLayout','collageFilter','collageBg'].forEach(id => $(id).addEventListener('change', render));
      $('collageInt').addEventListener('input', e => { $('collageIntVal').textContent = e.target.value + '%'; render(); });
      $('collageGap').addEventListener('input', e => { $('collageGapVal').textContent = e.target.value + ' px'; render(); });
      $('collageTitle').addEventListener('input', render);
      $('collageDownload').addEventListener('click', () => {
        if (!photos.length) return G.toast('先选几张照片吧');
        G.download(canvas.toDataURL('image/png'), 'collage-' + Date.now() + '.png'); G.toast('拼图已下载 ♡');
      });
      $('collageToWall').addEventListener('click', () => {
        if (!photos.length) return G.toast('先选几张照片吧');
        if (G.addDoodlePhoto) { G.addDoodlePhoto(canvas.toDataURL('image/jpeg', .88)); G.go('doodle'); }
      });
      $('collageClear').addEventListener('click', () => { photos = []; update(); });
      update();
    })();

    /* ---------- 贴纸装扮 ---------- */
    (function deco() {
      const canvas = $('decoCanvas'); if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const STICKERS = {
        emoji: [
          {k:'emoji',t:'✨',s:100},{k:'emoji',t:'💖',s:110},{k:'emoji',t:'🌸',s:110},{k:'emoji',t:'🫧',s:120},
          {k:'emoji',t:'🍒',s:100},{k:'emoji',t:'🐰',s:120},{k:'emoji',t:'🧸',s:120},{k:'emoji',t:'⭐',s:100},
          {k:'emoji',t:'☁️',s:120},{k:'emoji',t:'🦋',s:110},{k:'emoji',t:'🍓',s:100},{k:'emoji',t:'🎀',s:110},
          {k:'emoji',t:'💎',s:100},{k:'emoji',t:'🐻',s:120},{k:'emoji',t:'💬',s:100},{k:'emoji',t:'🌈',s:130}
        ],
        shape: [
          {k:'circle',label:'⭕',s:190,c:'#E8836F'},{k:'arrow',label:'↗️',s:180,c:'#E8836F'},
          {k:'squiggle',label:'〰️',s:190,c:'#8FB89A'},{k:'star',label:'✦',s:150,c:'#EFAE63'},
          {k:'heart',label:'♥️',s:160,c:'#E8836F'},{k:'sparkles',label:'✨',s:160,c:'#BBA8D6'}
        ],
        retro: [
          {k:'date',t:'2027.05.20',label:'日期戳',s:80,c:'#4A3A33'},{k:'label',t:'DUMP!',label:'DUMP!',s:90,c:'#E8836F'},
          {k:'pixel',label:'▦',s:140,c:'#8FA9C4'},{k:'tapeText',t:'MEMORY',label:'TAPE',s:80,c:'#6D5B52'},
          {k:'emoji',t:'📼',s:120},{k:'emoji',t:'🗓️',s:110},
          {k:'label',t:'LOVE',label:'LOVE',s:80,c:'#BBA8D6'},{k:'date',t:'MAY',label:'MAY',s:80,c:'#fff'}
        ],
        dress: [
          {k:'accessory',t:'🕶️',s:220},{k:'accessory',t:'🎀',s:160},{k:'accessory',t:'🐰',s:180},
          {k:'accessory',t:'👑',s:160},{k:'accessory',t:'🧢',s:200},{k:'accessory',t:'🦊',s:170},
          {k:'accessory',t:'💠',s:140},{k:'accessory',t:'🩵',s:140},{k:'accessory',t:'👒',s:190},{k:'accessory',t:'🦋',s:150}
        ],
        text: [
          {k:'text',t:'what I did ♡',s:58,c:'#fff'},{k:'text',t:'best day!',s:68,c:'#fff'},
          {k:'text',t:'55~ T_T',s:60,c:'#8FB89C'},{k:'text',t:'我们的夏天',s:66,c:'#fff'},
          {k:'text',t:'love you ♡',s:58,c:'#E8836F'},{k:'text',t:'✦ star ✦',s:56,c:'#EFAE63'}
        ]
      };
      let base = null, objects = [], selected = null, drag = null, cat = 'emoji';

      function rr(c, x, y, w, h, r) {
        r = Math.min(r, w/2, h/2);
        c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
        c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
        c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
      }
      function sparkle(x, y, r, color) {
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(x, y-r); ctx.quadraticCurveTo(x+r*.16, y-r*.16, x+r, y);
        ctx.quadraticCurveTo(x+r*.16, y+r*.16, x, y+r);
        ctx.quadraticCurveTo(x-r*.16, y+r*.16, x-r, y);
        ctx.quadraticCurveTo(x-r*.16, y-r*.16, x, y-r); ctx.fill();
      }
      function drawObject(o) {
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate((o.rot||0)*Math.PI/180);
        const s = o.size, c = o.color || '#E8836F';
        switch (o.k) {
          case 'emoji': case 'accessory':
            ctx.font = s + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
            ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(o.t,0,0); break;
          case 'text': case 'date':
            ctx.font = 'bold ' + s + 'px ' + (o.k === 'date' ? '"Courier New",monospace' : '"PingFang SC","Microsoft YaHei",sans-serif');
            ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
            ctx.lineWidth = Math.max(4, s*.18); ctx.strokeStyle='rgba(255,255,255,.9)';
            ctx.strokeText(o.t,0,0); ctx.fillStyle=c; ctx.fillText(o.t,0,0); break;
          case 'circle':
            ctx.strokeStyle=c; ctx.lineWidth=Math.max(3,s*.05); ctx.lineCap='round';
            ctx.beginPath(); ctx.ellipse(0,0,s*.9,s*.58,-.1,0,Math.PI*2); ctx.stroke();
            ctx.globalAlpha=.55; ctx.beginPath(); ctx.ellipse(6,5,s*.82,s*.52,-.1,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; break;
          case 'arrow':
            ctx.strokeStyle=c; ctx.lineWidth=Math.max(3,s*.055); ctx.lineCap='round'; ctx.lineJoin='round';
            ctx.beginPath(); ctx.moveTo(-s*.8,-s*.3); ctx.quadraticCurveTo(0,s*.55,s*.8,s*.15); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(s*.8,s*.15); ctx.lineTo(s*.5,s*0); ctx.moveTo(s*.8,s*.15); ctx.lineTo(s*.6,s*.42); ctx.stroke(); break;
          case 'squiggle':
            ctx.strokeStyle=c; ctx.lineWidth=Math.max(3,s*.045); ctx.lineCap='round'; ctx.beginPath();
            for (let i=0;i<=40;i++) { const x=-s+s*2*i/40, y=Math.sin(i/40*Math.PI*4)*s*.22; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
            ctx.stroke(); break;
          case 'star': sparkle(0,0,s*.8,c); break;
          case 'sparkles': sparkle(0,-s*.28,s*.45,c); sparkle(s*.45,s*.2,s*.3,c); sparkle(-s*.5,s*.4,s*.22,c); break;
          case 'heart':
            ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(0,s*.6);
            ctx.bezierCurveTo(-s*1.1,-s*.15,-s*.5,-s*.9,0,-s*.35);
            ctx.bezierCurveTo(s*.5,-s*.9,s*1.1,-s*.15,0,s*.6); ctx.fill(); break;
          case 'label':
            ctx.rotate(-.12); ctx.fillStyle=c; rr(ctx,-s*1.15,-s*.36,s*2.3,s*.72,9); ctx.fill();
            ctx.fillStyle='#fff'; ctx.font='bold '+(s*.58)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(o.t,0,0); break;
          case 'tapeText':
            ctx.rotate(-.1); ctx.fillStyle='rgba(255,226,175,.88)'; ctx.fillRect(-s*1.25,-s*.33,s*2.5,s*.66);
            ctx.fillStyle=c; ctx.font='bold '+(s*.48)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(o.t,0,0); break;
          case 'pixel': {
            ctx.fillStyle=c; const n=6, cell=s*.29;
            for(let a=0;a<n;a++) for(let b=0;b<n;b++) { if((a+b)%3===0) continue; ctx.fillRect((a-n/2)*cell,(b-n/2)*cell,cell-3,cell-3); }
            break;
          }
        }
        ctx.restore();
      }
      function boxOf(o) {
        const wide = o.k === 'text' || o.k === 'date' || o.k === 'label' || o.k === 'tapeText';
        return [o.size*(wide?1.85:1.15), o.size*1.15];
      }
      function drawSelection(o) {
        ctx.save(); ctx.translate(o.x,o.y); ctx.rotate((o.rot||0)*Math.PI/180);
        const b=boxOf(o); ctx.strokeStyle='rgba(74,58,51,.7)'; ctx.lineWidth=2; ctx.setLineDash([7,5]);
        ctx.strokeRect(-b[0]/2,-b[1]/2,b[0],b[1]); ctx.restore();
      }
      function background(W,H) {
        if ($('decoGrid').checked) {
          ctx.save(); ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1;
          for(let x=0;x<W;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
          for(let y=0;y<H;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();} ctx.restore();
        }
        if ($('decoFilm').checked) {
          ctx.save(); ctx.fillStyle='#1E1E26'; ctx.fillRect(0,0,W,70); ctx.fillRect(0,H-70,W,70);
          ctx.fillStyle='rgba(255,255,255,.85)';
          for(let x=18;x<W;x+=58){rr(ctx,x,22,30,24,5);ctx.fill();rr(ctx,x,H-46,30,24,5);ctx.fill();} ctx.restore();
        }
        if ($('decoDate').checked) {
          const d = G.cfg.birthday ? new Date(G.cfg.birthday+'T00:00:00') : new Date();
          const txt = d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');
          ctx.save(); ctx.font='bold 30px "Courier New",monospace'; ctx.textAlign='left'; ctx.textBaseline='bottom';
          ctx.fillStyle='rgba(255,255,255,.95)'; ctx.shadowColor='rgba(0,0,0,.5)'; ctx.shadowBlur=6;
          ctx.fillText(txt,26,H-26); ctx.restore();
        }
        if ($('decoTape').checked) {
          ctx.save(); ctx.fillStyle='rgba(255,230,185,.8)'; ctx.translate(70,50); ctx.rotate(-.35);
          ctx.fillRect(-70,-16,140,32); ctx.restore();
          ctx.save(); ctx.fillStyle='rgba(210,230,220,.8)'; ctx.translate(W-70,H-50); ctx.rotate(-.3);
          ctx.fillRect(-70,-16,140,32); ctx.restore();
        }
      }
      function render() {
        const W=canvas.width,H=canvas.height;
        ctx.clearRect(0,0,W,H); ctx.fillStyle='#FFF9F2'; ctx.fillRect(0,0,W,H);
        if (base) {
          const f=G.filterCSS?G.filterCSS($('decoFilter').value,Number($('decoInt').value)/100):'none';
          ctx.save(); ctx.filter=f;
          const r=Math.max(W/base.width,H/base.height),w=base.width*r,h=base.height*r;
          ctx.drawImage(base,(W-w)/2,(H-h)/2,w,h); ctx.restore();
        }
        background(W,H);
        objects.forEach((o,i)=>{drawObject(o); if(i===selected)drawSelection(o);});
      }
      function sync() {
        const o=objects[selected];
        $('decoSize').value=o?o.size:120; $('decoRot').value=o?(o.rot||0):0;
        $('decoColor').value=o?(o.color||'#E8836F'):'#E8836F';
        $('decoSizeVal').textContent=$('decoSize').value; $('decoRotVal').textContent=$('decoRot').value;
      }
      function renderGrid() {
        const arr=STICKERS[cat]||[];
        $('stickerGrid').innerHTML=arr.map((d,i)=>{
          const isText = d.k==='text'||d.k==='date'||d.k==='label'||d.k==='tapeText';
          return '<div class="sticker'+(isText?' stext':'')+'" data-i="'+i+'" title="点一下放上去">'+
            G.esc(d.label || d.t) + '</div>';
        }).join('');
      }
      $('decoCats').addEventListener('click', e => {
        const b=e.target.closest('[data-cat]'); if(!b)return;
        document.querySelectorAll('[data-cat]').forEach(x=>x.classList.remove('active'));
        b.classList.add('active'); cat=b.dataset.cat; renderGrid();
      });
      $('stickerGrid').addEventListener('click', e => {
        const s=e.target.closest('.sticker'); if(!s)return;
        const d=(STICKERS[cat]||[])[Number(s.dataset.i)]; if(!d)return;
        const n=objects.length, ang=n*2.399963, rad=55+30*Math.sqrt(n);
        const x=Math.max(90,Math.min(canvas.width-90,canvas.width/2+Math.cos(ang)*rad));
        const y=Math.max(90,Math.min(canvas.height-90,canvas.height/2+Math.sin(ang)*rad));
        objects.push({ k:d.k, t:d.t, size:d.s, color:d.c||'#E8836F', rot:0, x, y });
        selected=objects.length-1; sync(); render(); G.toast('贴上去啦，拖一拖换个位置 ✨');
      });
      function pos(e) { const r=canvas.getBoundingClientRect(); return [(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height]; }
      function hit(x,y) {
        for(let i=objects.length-1;i>=0;i--) { const o=objects[i],b=boxOf(o);
          if(Math.abs(x-o.x)<=b[0]/2 && Math.abs(y-o.y)<=b[1]/2) return i; }
        return -1;
      }
      canvas.addEventListener('pointerdown', e => {
        const p=pos(e), i=hit(p[0],p[1]);
        if(i>=0){ selected=i; drag={dx:p[0]-objects[i].x,dy:p[1]-objects[i].y}; sync(); render(); }
        else { selected=null; render(); }
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', e => {
        if(!drag||selected==null)return; const p=pos(e),o=objects[selected];
        o.x=p[0]-drag.dx; o.y=p[1]-drag.dy; render();
      });
      ['pointerup','pointercancel'].forEach(t=>canvas.addEventListener(t,()=>{drag=null;}));
      $('decoSize').addEventListener('input', e => { const o=objects[selected]; if(!o)return;
        o.size=Number(e.target.value); $('decoSizeVal').textContent=e.target.value; render(); });
      $('decoRot').addEventListener('input', e => { const o=objects[selected]; if(!o)return;
        o.rot=Number(e.target.value); $('decoRotVal').textContent=e.target.value; render(); });
      $('decoColor').addEventListener('input', e => { const o=objects[selected]; if(!o)return;
        o.color=e.target.value; render(); });
      $('decoDup').onclick=()=>{ const o=objects[selected]; if(!o)return G.toast('先选中一个贴纸');
        objects.push(Object.assign({},o,{x:o.x+30,y:o.y+30})); selected=objects.length-1; render(); };
      $('decoDel').onclick=()=>{ if(selected==null)return G.toast('先选中一个贴纸');
        objects.splice(selected,1); selected=null; sync(); render(); };
      $('decoFront').onclick=()=>{ if(selected==null)return G.toast('先选中一个贴纸');
        objects.push(objects.splice(selected,1)[0]); selected=objects.length-1; render(); };
      ['decoFilm','decoGrid','decoDate','decoTape'].forEach(id=>$(id).addEventListener('change',render));
      $('decoFilter').addEventListener('change',render);
      $('decoInt').addEventListener('input',e=>{$('decoIntVal').textContent=e.target.value+'%';render();});
      $('decoDrop').addEventListener('click',()=>$('decoFile').click());
      $('decoFile').addEventListener('change',e=>{ if(e.target.files[0])loadPhoto(e.target.files[0]); e.target.value=''; });
      $('decoDrop').addEventListener('dragover',e=>{e.preventDefault();$('decoDrop').style.background='#FFEADD';});
      $('decoDrop').addEventListener('dragleave',()=>$('decoDrop').style.background='');
      $('decoDrop').addEventListener('drop',e=>{e.preventDefault();$('decoDrop').style.background='';
        if(e.dataTransfer.files[0])loadPhoto(e.dataTransfer.files[0]);});
      function loadPhoto(file) {
        G.readImage(file,1100).then(data=>{ const im=new Image();
          im.onload=()=>{ base=im; objects=[]; selected=null; canvas.style.display='block';
            $('decoDrop').style.minHeight='56px'; $('decoPh').innerHTML='<b style="font-size:20px">＋</b> 点这里可以换一张照片';
            sync(); render(); G.toast('开始给她打扮吧 🎀'); }; im.src=data;
        }).catch(e=>G.toast(e.message));
      }
      $('decoReset').onclick=()=>{ base=null; objects=[]; selected=null; canvas.style.display='none';
        $('decoFile').value=''; $('decoDrop').style.minHeight='180px';
        $('decoPh').innerHTML='<b>🎀</b>上传一张照片，开始贴贴纸<br>或把照片拖进来'; };
      $('decoClearStickers').onclick=()=>{ objects=[]; selected=null; sync(); render(); G.toast('贴纸清空啦'); };
      $('decoDownload').onclick=()=>{ G.download(canvas.toDataURL('image/png'),'sticker-photo-'+Date.now()+'.png'); G.toast('作品已下载 ♡'); };
      $('decoToWall').onclick=()=>{ if(G.addDoodlePhoto){G.addDoodlePhoto(canvas.toDataURL('image/jpeg',.88));G.go('doodle');} };
      renderGrid(); sync(); render();
    })();

    /* ---------- 成长幻灯片 ---------- */
    (function story() {
      if (!$('storyStage')) return;
      let slides = [], idx = 0, timer = null, paused = false;
      const stage = $('storyStage'), overlay = $('story'), DURATION = 4300;

      function buildSlides() {
        const items = G.LS.get('memories', []), name = G.cfg.name || '亲爱的你';
        slides = [{ age:'A LITTLE GIRL', title:'她的小时候', emoji:'🌱',
          text:'从很小很小的时候，到今天。\n这一页一页，都是你长大的样子。' }];
        items.forEach(it => slides.push({ age: it.age || '那一年', title: it.title || '一段回忆',
          text: it.text || '', src: it.src, emoji:'📷' }));
        slides.push({ age:'HAPPY BIRTHDAY', title:'生日快乐，' + name, emoji:'♡',
          text:'愿你记得来时的路，也永远相信前面还有好多的好日子。\n\n今天，我们认真替你庆祝。' });
      }
      function render() {
        const s = slides[idx];
        stage.innerHTML = '<div class="story-slide"><div class="story-photo">' +
          (s.src ? '<img src="' + s.src + '" alt="回忆照片">' : '<span class="ph-emoji">' + s.emoji + '</span>') +
          '</div><div class="story-copy"><span class="story-age">' + G.esc(s.age) + '</span><h3>' +
          G.esc(s.title) + '</h3><p>' + G.esc(s.text || '') + '</p></div></div>';
        $('storyProgress').style.width = ((idx+1) / slides.length * 100) + '%';
        $('storyCount').textContent = (idx+1) + ' / ' + slides.length;
      }
      function schedule() { clearTimeout(timer); if (!paused) timer = setTimeout(next, DURATION); }
      function next() { idx = (idx+1) % slides.length; render(); schedule(); }
      function prev() { idx = (idx-1+slides.length) % slides.length; render(); schedule(); }
      function close() { overlay.classList.remove('open'); clearTimeout(timer); }
      $('memPlay').onclick = () => {
        buildSlides();
        if (slides.length <= 2) return G.toast('先添加几段回忆，再来播放动画吧');
        idx = 0; paused = false; $('storyPause').textContent = '⏸ 暂停';
        overlay.classList.add('open'); render(); schedule();
      };
      $('storyClose').onclick = close;
      $('storyNext').onclick = next;
      $('storyPrev').onclick = prev;
      $('storyPause').onclick = () => { paused = !paused; $('storyPause').textContent = paused ? '▶ 继续' : '⏸ 暂停'; schedule(); };
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', e => {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === ' ') { e.preventDefault(); $('storyPause').click(); }
      });
    })();

    /* ---------- 涂鸦照片墙（含照片上加文字） ---------- */
    (function doodle() {
      const canvas = $('doodleCanvas'); if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let items = G.LS.get('doodles', []);
      let color = '#E8836F', baseImg = null, history = [], selected = null, drag = null;
      const save = () => G.LS.set('doodles', items);

      function drawText(t, isSelected) {
        ctx.save();
        ctx.font = 'bold ' + t.size + 'px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(4, t.size * .14); ctx.strokeStyle = 'rgba(255,255,255,.82)';
        ctx.lineJoin = 'round'; ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
        if (isSelected) {
          const w = ctx.measureText(t.text).width / 2 + 10;
          ctx.strokeStyle = 'rgba(74,58,51,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
          ctx.strokeRect(t.x - w, t.y - t.size * .75, w * 2, t.size * 1.5);
        }
        ctx.restore();
      }
      function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (baseImg) {
          const r = Math.max(canvas.width/baseImg.width, canvas.height/baseImg.height);
          const w = baseImg.width*r, h = baseImg.height*r;
          ctx.drawImage(baseImg, (canvas.width-w)/2, (canvas.height-h)/2, w, h);
        } else { ctx.fillStyle = '#eee'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        history.forEach((it, idx) => {
          if (it.kind === 'stroke') {
            if (!it.points.length) return;
            ctx.strokeStyle = it.color; ctx.lineWidth = it.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(it.points[0][0], it.points[0][1]);
            it.points.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
            if (it.points.length === 1) ctx.lineTo(it.points[0][0]+.1, it.points[0][1]+.1);
            ctx.stroke();
          } else drawText(it, idx === selected);
        });
      }
      function pos(e) {
        const r = canvas.getBoundingClientRect();
        return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height];
      }
      function hitText(x, y) {
        for (let i = history.length - 1; i >= 0; i--) {
          const t = history[i]; if (t.kind !== 'text') continue;
          ctx.font = 'bold ' + t.size + 'px "PingFang SC",sans-serif';
          const w = ctx.measureText(t.text).width / 2 + 12, h = t.size * .8;
          if (x >= t.x - w && x <= t.x + w && y >= t.y - h && y <= t.y + h) return i;
        }
        return -1;
      }
      canvas.addEventListener('pointerdown', e => {
        const p = pos(e), hit = hitText(p[0], p[1]);
        if (hit >= 0) {
          const t = history[hit]; selected = hit;
          drag = { idx: hit, dx: p[0] - t.x, dy: p[1] - t.y };
          canvas.setPointerCapture(e.pointerId); redraw(); return;
        }
        selected = null;
        const cur = { kind:'stroke', color, size: Number($('brushSize').value), points: [p] };
        history.push(cur); drag = { stroke: true }; canvas.setPointerCapture(e.pointerId); redraw();
      });
      canvas.addEventListener('pointermove', e => {
        if (!drag) return;
        const p = pos(e);
        if (drag.stroke) history[history.length-1].points.push(p);
        else { const t = history[drag.idx]; t.x = p[0] - drag.dx; t.y = p[1] - drag.dy; }
        redraw();
      });
      ['pointerup','pointercancel'].forEach(t => canvas.addEventListener(t, () => { drag = null; }));
      $('swatches').addEventListener('click', e => {
        const s = e.target.closest('.swatch'); if (!s) return;
        document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active'); color = s.dataset.color;
      });
      $('addText').onclick = () => {
        const text = $('textInput').value.trim();
        if (!text) return G.toast('先输入想写在照片上的话');
        history.push({ kind:'text', text, x: canvas.width/2, y: canvas.height/2 + (history.filter(h=>h.kind==='text').length%4 - 1.5)*70,
          size: Number($('textSize').value), color });
        selected = history.length - 1; $('textInput').value = ''; redraw(); G.toast('文字加上啦，可以拖动它 ♡');
      };
      $('delText').onclick = () => {
        if (selected == null || history[selected] == null || history[selected].kind !== 'text') return G.toast('先点一下照片上的文字选中它');
        history.splice(selected, 1); selected = null; redraw();
      };
      $('undoBtn').onclick = () => { history.pop(); selected = null; redraw(); };
      $('clearDoodle').onclick = () => { history = []; selected = null; redraw(); };
      $('closeEditor').onclick = () => $('editor').classList.remove('open');

      function openWith(src) {
        const im = new Image();
        im.onload = () => { baseImg = im; history = []; selected = null; redraw(); $('editor').classList.add('open'); };
        im.src = src;
      }
      G.addDoodlePhoto = openWith;
      $('wallFile').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        G.readImage(f, 1100).then(openWith).catch(err => G.toast(err.message));
        e.target.value = '';
      });
      $('saveDoodle').onclick = () => {
        if (!baseImg) return;
        items.push({ id: G.uid(), src: canvas.toDataURL('image/jpeg', .86), cap: $('doodleCaption').value.trim(), time: Date.now() });
        if (!save()) { items.pop(); return; }
        $('editor').classList.remove('open'); $('doodleCaption').value = ''; render(); G.toast('贴到墙上啦 ✏️');
      };
      function render() {
        const grid = $('wallGrid');
        if (!items.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">墙上还空着，传一张照片开始涂鸦吧 ✏️</div>'; return; }
        grid.innerHTML = items.map(it => '<div class="doodle-card" style="transform:rotate(' + ((Math.random()*4-2).toFixed(1)) + 'deg)">' +
          '<button class="dc-del" data-del="' + it.id + '">×</button><img src="' + it.src + '" data-zoom="' + it.id + '" alt="涂鸦照片">' +
          (it.cap ? '<div class="dc-cap">' + G.esc(it.cap) + '</div>' : '') + '</div>').join('');
      }
      $('wallGrid').addEventListener('click', e => {
        if (e.target.dataset.del) { items = items.filter(x => x.id !== e.target.dataset.del); save(); render(); return; }
        if (e.target.dataset.zoom) { const it = items.find(x => x.id === e.target.dataset.zoom); if (it) { $('modalImg').src = it.src; $('modal').classList.add('open'); } }
      });
      render();
    })();

    /* ---------- 朋友的留言区 ---------- */
    (function blessings() {
      if (!$('blesWall')) return;
      const COLORS = { coral:'#E8836F', amber:'#EFAE63', sage:'#8FB89A', blue:'#8FA9C4', lav:'#BBA8D6' };
      let items = G.LS.get('blessings', []);
      if (!items.length && !G.LS.get('blesSeeded', false)) {
        items = [{ id: G.uid(), from:'我', text:'生日快乐呀。愿你以后想起今天，还会忍不住笑出来。', color:'coral', time: Date.now() }];
        G.LS.set('blessings', items); G.LS.set('blesSeeded', true);
      }
      const save = () => G.LS.set('blessings', items);
      function render() {
        $('blesCount').textContent = '已收集 ' + items.length + ' 句';
        const box = $('blesWall');
        if (!items.length) { box.innerHTML = '<div class="empty" style="grid-column:1/-1">小屋还空着，贴第一张便签吧 💬</div>'; return; }
        box.innerHTML = items.map((it, i) =>
          '<div class="bless-note" style="--note:' + (COLORS[it.color] || COLORS.coral) + ';--rot:' + ((i*7%9)-4).toFixed(1) + 'deg">' +
          '<button class="bn-del" data-del="' + it.id + '">×</button>' +
          '<div class="bn-text">' + G.esc(it.text) + '</div><div class="bn-from">— ' + G.esc(it.from || '一位朋友') + '</div></div>').join('');
      }
      $('blesAdd').onclick = () => {
        const text = $('blesText').value.trim();
        if (!text) return G.toast('祝福还是空的呢');
        items.push({ id: G.uid(), from: $('blesFrom').value.trim(), text, color: $('blesMood').value, time: Date.now() });
        save(); render(); $('blesText').value = ''; $('blesFrom').value = '';
        G.toast('祝福贴好啦 💬');
      };
      $('blesWall').addEventListener('click', e => {
        if (!e.target.dataset.del) return;
        items = items.filter(x => x.id !== e.target.dataset.del); save(); render();
      });
      render();
    })();

    /* ---------- 我们的约定：漂流瓶 + 转盘/抽签 ---------- */
    (function promises() {
      const wheel = $('wheel'); if (!wheel) return;
      const COLORS = ['#E8836F','#EFAE63','#8FB89A','#8FA9C4','#BBA8D6','#E9A6B4','#C9815E','#7E96BC'];
      let items = G.LS.get('promises', []);
      if (!items.length && !G.LS.get('promSeeded', false)) {
        items = [
          { id: G.uid(), title:'一起去看一次海', note:'挑个晴天，带上相机和零食。', done:false },
          { id: G.uid(), title:'深夜吃泡面聊到天亮', note:'不许提前睡着。', done:false },
          { id: G.uid(), title:'拍一组丑丑的合照', note:'越丑越好，留着以后笑。', done:false },
          { id: G.uid(), title:'去游乐园坐过山车', note:'她尖叫，我负责录影。', done:false }
        ];
        G.LS.set('promises', items); G.LS.set('promSeeded', true);
      }
      const save = () => G.LS.set('promises', items);
      let rotation = 0, resolveTimer = null;

      function buildWheel() {
        const n = items.length;
        if (!n) {
          wheel.style.background = '#E9E2D9'; wheel.innerHTML = '<div class="wheel-empty">先装几个瓶子</div>';
          $('wheelHint').textContent = '先装几个漂流瓶，再来转转盘。';
          $('spinBtn').disabled = true; $('drawBtn').disabled = true; return;
        }
        $('spinBtn').disabled = false; $('drawBtn').disabled = false;
        $('wheelHint').textContent = '一共 ' + n + ' 个约定，转到哪个就去做哪个。';
        const seg = 360 / n;
        let stops = '';
        for (let i = 0; i < n; i++) {
          stops += COLORS[i % COLORS.length] + ' ' + (i*seg).toFixed(2) + 'deg ' + ((i+1)*seg).toFixed(2) + 'deg' + (i < n-1 ? ',' : '');
        }
        wheel.style.background = 'conic-gradient(from 0deg, ' + stops + ')';
        wheel.innerHTML = items.map((it, i) => {
          const a = i*seg + seg/2;
          return '<div class="wheel-label" style="transform:translate(-50%,-50%) rotate(' + a.toFixed(2) + 'deg) translateY(-76px) rotate(' + (-a).toFixed(2) + 'deg)">' +
            G.esc(it.title) + '</div>';
        }).join('');
      }
      function showResult(idx) {
        const it = items[idx]; if (!it) return;
        $('drawResult').innerHTML = '<span class="dr-label">今天就去完成</span><b>' + G.esc(it.title) + '</b>' +
          (it.note ? '<small>' + G.esc(it.note) + '</small>' : '');
        $('drawResult').classList.remove('flash'); void $('drawResult').offsetWidth; $('drawResult').classList.add('flash');
        document.querySelectorAll('.bottle').forEach((b, i) => b.classList.toggle('picked', i === idx));
      }
      $('spinBtn').onclick = () => {
        if (!items.length) return;
        const n = items.length, seg = 360 / n;
        const idx = Math.floor(Math.random() * n);
        const delta = (360 - (idx*seg + seg/2)) % 360;
        wheel.style.transition = 'none'; wheel.style.transform = 'rotate(' + (rotation % 360) + 'deg)';
        void wheel.offsetWidth;
        wheel.style.transition = 'transform 4s cubic-bezier(.12,.75,.18,1)';
        rotation += 360*5 + delta;
        wheel.style.transform = 'rotate(' + rotation + 'deg)';
        $('drawResult').textContent = '转盘转起来了…';
        clearTimeout(resolveTimer); resolveTimer = setTimeout(() => showResult(idx), 4100);
      };
      $('drawBtn').onclick = () => {
        if (!items.length) return;
        clearTimeout(resolveTimer); showResult(Math.floor(Math.random() * items.length));
      };
      $('promAdd').onclick = () => {
        const title = $('promTitle').value.trim();
        if (!title) return G.toast('先写下想一起做的事');
        items.push({ id: G.uid(), title, note: $('promNote').value.trim(), done:false });
        save(); render(); buildWheel(); $('promTitle').value = ''; $('promNote').value = '';
        G.toast('约定装进瓶子啦 🍾');
      };
      function render() {
        const grid = $('bottleGrid');
        if (!items.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">瓶子空空的，写一个约定吧。</div>'; return; }
        grid.innerHTML = items.map((it, i) =>
          '<div class="bottle' + (it.done ? ' done' : '') + '" data-i="' + i + '"><div class="cork"></div>' +
          '<div class="bottle-body"><div class="bottle-note"><b>' + G.esc(it.title) + '</b>' +
          (it.note ? '<small>' + G.esc(it.note) + '</small>' : '') + '</div>' +
          (it.done ? '<span class="bottle-stamp">已完成 ✓</span>' : '') + '</div>' +
          '<div class="bottle-actions"><button data-done="' + i + '">' + (it.done ? '↺ 撤销' : '✓ 完成') + '</button>' +
          '<button data-del="' + i + '">删除</button></div></div>').join('');
      }
      $('bottleGrid').addEventListener('click', e => {
        if (e.target.dataset.done != null) {
          const it = items[Number(e.target.dataset.done)]; if (!it) return;
          it.done = !it.done; save(); render(); G.toast(it.done ? '又完成一件，好棒 ✦' : '已撤销'); return;
        }
        if (e.target.dataset.del != null) {
          items.splice(Number(e.target.dataset.del), 1); save(); render(); buildWheel(); return;
        }
      });
      buildWheel(); render();
    })();

    /* ---------- 空间手机站 ---------- */
    (function booth() {
      if (!$('modePanel')) return;
      let mode = 'speak', recorder = null, timer = null, seconds = 0;
      const panel = $('modePanel'), list = $('msgList');

      function panelHTML() {
        if (mode === 'write') {
          return '<label class="field"><span>想说的话</span><textarea id="writeText" rows="4" placeholder="写给外太空的她…"></textarea></label>' +
            '<div class="row"><button class="btn" id="writeSend">发射到太空 📡</button>' +
            '<button class="btn ghost sm" id="clearMsgs">清空消息</button></div>';
        }
        const humming = mode === 'hum';
        return '<div class="row"><button class="btn" id="recBtn">● 开始' + (humming ? '哼歌' : '录音') + '</button>' +
          '<span id="recTime" style="font-size:12px;color:var(--muted)">00:00</span>' +
          (humming ? '<div class="eq" id="eqBox">' + '<i></i>'.repeat(12) + '</div>' : '') +
          '<button class="btn ghost sm" id="clearMsgs">清空消息</button></div>' +
          '<p class="hint" style="margin-top:10px">' + (humming ? '哼吧，跑调也没关系。录完点"停止"。' : '说点什么吧，录完点"停止"。最长 60 秒。') + '</p>';
      }
      function renderPanel() {
        panel.innerHTML = panelHTML();
        if (mode === 'write') {
          $('writeSend').onclick = async () => {
            const text = $('writeText').value.trim(); if (!text) return G.toast('先写点什么吧');
            await G.IDB.put({ id: G.uid(), type: 'text', text, time: Date.now() });
            $('writeText').value = ''; G.toast('消息已发射 📡'); renderMsgs(); signal();
          };
        } else {
          $('recBtn').onclick = toggleRec;
        }
        $('clearMsgs').onclick = async () => {
          if (!confirm('清空所有留言？')) return;
          const all = await G.IDB.all(); await Promise.all(all.map(m => G.IDB.del(m.id)));
          renderMsgs(); G.toast('消息已清空');
        };
      }
      function signal() {
        $('boothStatus').innerHTML = '消息已抵达<br><span style="color:#FFD9A8">✦ 信号稳定 ✦</span>';
        setTimeout(() => { $('boothStatus').innerHTML = '信号已连接<br>等待你的消息…'; }, 3000);
      }
      async function toggleRec() {
        if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recorder = new MediaRecorder(stream); const chunks = [];
          recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
          recorder.onstop = async () => {
            clearInterval(timer); stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
            const fr = new FileReader();
            fr.onload = async () => {
              await G.IDB.put({ id: G.uid(), type: mode === 'hum' ? 'hum' : 'voice', text: '', data: fr.result, time: Date.now() });
              renderMsgs(); signal(); G.toast('收到啦，点一下就能播放 ♪');
            };
            fr.readAsDataURL(blob);
            $('recBtn').textContent = '● 开始' + (mode === 'hum' ? '哼歌' : '录音');
            $('recTime').textContent = '00:00'; seconds = 0;
          };
          recorder.start();
          $('recBtn').textContent = '■ 停止并发送'; seconds = 0;
          timer = setInterval(() => { seconds++; $('recTime').textContent =
            String(Math.floor(seconds/60)).padStart(2,'0') + ':' + String(seconds%60).padStart(2,'0');
            if (seconds >= 60 && recorder.state === 'recording') recorder.stop();
          }, 1000);
        } catch (e) { G.toast('麦克风用不了，可以改用"写字"哦'); }
      }
      async function renderMsgs() {
        const all = (await G.IDB.all()).sort((a,b) => b.time - a.time);
        if (!all.length) { list.innerHTML = '<div class="empty">还没有消息，说一句吧 ✨</div>'; return; }
        list.innerHTML = all.map(m => {
          const t = new Date(m.time).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
          const label = m.type === 'hum' ? '哼歌' : m.type === 'voice' ? '语音' : '文字';
          return '<div class="msg"><div class="meta">' + label + ' · ' + t + '</div>' +
            (m.data ? '<audio controls src="' + m.data + '"></audio>' : G.esc(m.text)) + '</div>';
        }).join('');
      }
      document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
        if (recorder && recorder.state === 'recording') recorder.stop();
        document.querySelectorAll('[data-mode]').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); mode = b.dataset.mode; renderPanel();
      }));
      renderPanel(); renderMsgs();
    })();

    /* ---------- 定时可见的信 ---------- */
    (function letters() {
      if (!$('letterList')) return;
      let items = G.LS.get('letters', []);
      if (!items.length && !G.LS.get('letterSeeded', false)) {
        let t = G.nextBirthday();
        if (!t) { t = new Date(); t.setDate(t.getDate() + 7); t.setHours(9, 0, 0, 0); }
        items = [{ id: G.uid(), title: '给未来的你', body: '嗨，未来的你：\n\n希望你已经长成了很喜欢的那个人。\n希望你还会因为小事开心，还会认真看天上的云。\n\n不管今天过得怎么样，记得——你一直被好好爱着。\n\n生日快乐 ♡', time: t.getTime() }];
        G.LS.set('letters', items); G.LS.set('letterSeeded', true);
      }
      const save = () => G.LS.set('letters', items);
      function fmt(ts) {
        let s = Math.floor((ts - Date.now()) / 1000);
        if (s <= 0) return '可以拆开了 ✦';
        const d = Math.floor(s/86400); s %= 86400;
        const h = Math.floor(s/3600); s %= 3600;
        const m = Math.floor(s/60);
        return '还有 ' + d + ' 天 ' + h + ' 小时 ' + m + ' 分';
      }
      function render() {
        const box = $('letterList');
        if (!items.length) { box.innerHTML = '<div class="empty">信箱空空的，写一封吧 💌</div>'; return; }
        box.innerHTML = items.map(it => {
          const open = Date.now() >= it.time;
          const when = new Date(it.time).toLocaleString('zh-CN');
          if (open) return '<div class="letter"><div class="lt">💌 ' + G.esc(it.title) + '</div>' +
            '<div class="lb">' + G.esc(it.body) + '</div><div class="lm">写于 ' + when +
            ' · <a href="#" data-del="' + it.id + '" style="color:var(--muted)">删除</a></div></div>';
          return '<div class="letter locked"><span class="lock-icon">🔒</span><div class="lt">' + G.esc(it.title) + '</div>' +
            '<div class="count" data-count="' + it.time + '">' + fmt(it.time) + '</div>' +
            '<div class="lm">' + when + ' 才会出现 · <a href="#" data-del="' + it.id + '" style="color:var(--muted)">删除</a></div></div>';
        }).join('');
      }
      $('letterAdd').onclick = () => {
        const title = $('letterTitle').value.trim() || '一封没起名的信';
        const body = $('letterBody').value.trim();
        const time = new Date($('letterTime').value).getTime();
        if (!body) return G.toast('信纸还是空的呢');
        if (!time || isNaN(time)) return G.toast('选一个开封的时间吧');
        items.push({ id: G.uid(), title, body, time }); save(); render();
        $('letterTitle').value = ''; $('letterBody').value = ''; $('letterTime').value = '';
        G.toast('信封好啦，交给时间 ⏳');
      };
      $('letterList').addEventListener('click', e => {
        const a = e.target.closest('[data-del]'); if (!a) return;
        e.preventDefault(); items = items.filter(x => x.id !== a.dataset.del); save(); render();
      });
      setInterval(() => document.querySelectorAll('[data-count]').forEach(el => { el.textContent = fmt(Number(el.dataset.count)); }), 30000);
      render();
    })();

    /* ---------- 点歌台 ---------- */
    (function music() {
      if (!$('songSelect')) return;
      const MELODIES = {
        birthday: { name:'生日快乐歌', by:'传统旋律', notes:[[392,.5],[392,.5],[440,1],[392,1],[523,1],[494,2],[392,.5],[392,.5],[440,1],[392,1],[587,1],[523,2],[392,.5],[392,.5],[784,1],[659,1],[523,1],[494,1],[440,2],[698,.5],[698,.5],[659,1],[523,1],[587,1],[523,2]] },
        twinkle: { name:'小星星', by:'莫扎特', notes:[[523,.5],[523,.5],[784,.5],[784,.5],[880,.5],[880,.5],[784,1],[698,.5],[698,.5],[659,.5],[659,.5],[587,.5],[587,.5],[523,1]] },
        ode: { name:'欢乐颂', by:'贝多芬', notes:[[392,1],[392,1],[440,1],[494,1],[494,1],[440,1],[392,1],[349,1],[330,1],[330,1],[349,1],[392,1],[392,1.5],[349,.5],[349,2]] },
        canon: { name:'卡农片段', by:'帕赫贝尔', notes:[[494,.75],[370,.25],[440,.5],[494,.5],[587,1],[494,1],[370,.5],[440,.5],[494,.5],[587,.5],[659,1],[587,.5],[494,.5]] },
        chiptune: { name:'专属小旋律', by:'为你生成', notes:[[523,.25],[659,.25],[784,.25],[1047,.5],[988,.25],[784,.25],[880,.5],[659,.25],[698,.25],[784,.5],[1047,.75],[0,.25],[880,.5],[784,.5],[659,1]] }
      };
      let list = G.LS.get('songs', []), audioCtx = null;
      $('songSelect').innerHTML = Object.entries(MELODIES).map(([k,v]) => '<option value="' + k + '">' + v.name + ' · ' + v.by + '</option>').join('');
      const save = () => G.LS.set('songs', list);

      function play(key, el) {
        try {
          audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const notes = MELODIES[key] ? MELODIES[key].notes : MELODIES.chiptune.notes;
          let t = audioCtx.currentTime + 0.06;
          notes.forEach(([freq, dur]) => {
            if (freq) {
              const o = audioCtx.createOscillator(), g = audioCtx.createGain();
              o.type = 'triangle'; o.frequency.setValueAtTime(freq, t);
              g.gain.setValueAtTime(0.0001, t);
              g.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
              g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.92);
              o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + dur);
            }
            t += dur;
          });
          document.querySelectorAll('.song').forEach(s => s.classList.remove('playing'));
          if (el) el.classList.add('playing');
          $('nowPlaying').textContent = '♪ 正在播放：' + (el ? el.querySelector('b').textContent : '小旋律');
          setTimeout(() => { document.querySelectorAll('.song').forEach(s => s.classList.remove('playing')); }, (t - audioCtx.currentTime) * 1000);
        } catch (e) { G.toast('浏览器暂时不让播放呢'); }
      }
      function render() {
        const box = $('playlist');
        if (!list.length) { box.innerHTML = '<div class="empty">还没有人点歌 ♪</div>'; return; }
        box.innerHTML = list.map(s => '<div class="song" data-id="' + s.id + '"><span class="vinyl"></span>' +
          '<div style="flex:1"><b>' + G.esc(s.name) + '</b><small>' + G.esc(s.dedicate || '送给你的一首歌') + '</small></div>' +
          '<button class="play" title="播放">▶</button></div>').join('');
      }
      $('requestBtn').onclick = () => {
        const key = $('songSelect').value;
        const name = $('songName').value.trim() || MELODIES[key].name;
        list.push({ id: G.uid(), name, dedicate: $('dedicate').value.trim(), key, time: Date.now() });
        save(); render(); $('songName').value = ''; $('dedicate').value = '';
        G.toast('点歌成功 ♪'); play(key, null);
      };
      $('playlist').addEventListener('click', e => {
        const row = e.target.closest('.song'); if (!row) return;
        const s = list.find(x => x.id === row.dataset.id); if (s) play(s.key, row);
      });
      render();
    })();

    /* 放大弹窗关闭 */
    const modal = $('modal');
    if (modal) modal.addEventListener('click', () => modal.classList.remove('open'));
  });
})(window.Gift);

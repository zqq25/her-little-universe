/* 12 个月照片年历 */
(function (G) {
  'use strict';
  const $ = id => document.getElementById(id);
  const QUOTES = [
    '新的一年的第一页，想先写下你的名字。愿这一年的风都温柔，日子都发光。',
    '春天还没来，但我想先把暖意寄给你。愿你被偏爱，被惦记，被好好收藏。',
    '花开得刚刚好，就像遇见你那天。愿你永远有少女的烂漫和说走就走的勇气。',
    '四月的风很轻，适合把心事说给云听。愿你眼里有光，心里有暖。',
    '五月的阳光有蜂蜜味。愿你所有的努力，都在悄悄开花。',
    '夏天来了，西瓜、晚风和你。愿你这个夏天，有橘子汽水般的清爽和甜。',
    '蝉鸣很吵，但青春正好。愿你一直待在热爱的世界里，闪闪发光。',
    '把星星装进口袋，把笑容留在八月。愿你遇见的都是好人，经历的都成故事。',
    '秋风起，落叶黄，日子慢下来也没关系。愿你被时光温柔以待。',
    '十月的桂花香，是思念的味道。愿你所求皆如愿，所行化坦途。',
    '天冷了，记得添衣。愿你有人问你粥可温，有人与你立黄昏。',
    '这一年辛苦啦。愿所有遗憾都是明年惊喜的铺垫。生日快乐，我最亲爱的你。'
  ];
  const SEASON = m => (m === 12 || m <= 2) ? 'winter' : (m <= 5) ? 'spring' : (m <= 8) ? 'summer' : 'autumn';
  const SEASON_CN = { winter:'冬', spring:'春', summer:'夏', autumn:'秋' };
  const DECO = ['❄️','🧧','🌸','🍃','🌷','🍉','☀️','⭐','🍂','🎃','🧣','🎄'];
  const EN = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const WD = ['一','二','三','四','五','六','日'];

  document.addEventListener('DOMContentLoaded', () => {
    let year = Number(G.LS.get('calYear', 2027));
    let data = G.LS.get('calendar', {});
    const sel = $('yearSelect');
    for (let y = year - 2; y <= year + 4; y++) {
      const o = document.createElement('option'); o.value = y; o.textContent = y + ' 年';
      if (y === year) o.selected = true; sel.appendChild(o);
    }
    $('calName').textContent = G.cfg.name || '亲爱的你';

    function key(m) { return year + '-' + m; }
    function save() { G.LS.set('calendar', data); }

    function miniCal(m) {
      const first = new Date(year, m - 1, 1);
      const lead = (first.getDay() + 6) % 7;
      const days = new Date(year, m, 0).getDate();
      const bday = G.cfg.birthday ? (G.cfg.birthday.split('-')[1] == m ? Number(G.cfg.birthday.split('-')[2]) : 0) : 0;
      let h = WD.map(w => '<div class="wd">' + w + '</div>').join('');
      for (let i = 0; i < lead; i++) h += '<div class="d blank">·</div>';
      for (let d = 1; d <= days; d++) {
        const we = (lead + d - 1) % 7 >= 5 ? ' we' : '';
        h += '<div class="d' + we + (d === bday ? ' bday' : '') + '">' + (d === bday ? '♥' : d) + '</div>';
      }
      return '<div class="mini-cal">' + h + '</div>';
    }
    function render() {
      const grid = $('monthGrid');
      grid.innerHTML = '';
      $('calYearTitle').textContent = year;
      for (let m = 1; m <= 12; m++) {
        const k = key(m), d = data[k] || {}, season = SEASON(m);
        const card = document.createElement('article');
        card.className = 'month-card'; card.dataset.season = season;
        card.innerHTML =
          '<div class="mc-deco">' + DECO[m-1] + '</div>' +
          '<div class="mh"><b>' + m + ' 月</b><span>' + EN[m-1] + '</span></div>' +
          '<label class="photo-box" title="点击替换照片">' +
            (d.src ? '<img src="' + d.src + '" alt="' + m + '月的照片">' :
              '<div class="ph"><b>📷</b>点这里放上她的照片</div>') +
            '<span class="change">更换照片 ✎</span>' +
            '<input type="file" accept="image/*" data-month="' + m + '">' +
          '</label>' +
          '<div class="quote" contenteditable="true" data-month="' + m + '" spellcheck="false">' + G.esc(d.quote || QUOTES[m-1]) + '</div>' +
          miniCal(m) +
          '<div class="foot"><span class="season-tag">' + SEASON_CN[season] + ' · ' + m + '月</span><span>点击语录可修改 ✎</span></div>';
        grid.appendChild(card);
      }
    }
    $('monthGrid').addEventListener('change', e => {
      if (!e.target.matches('input[type=file]')) return;
      const f = e.target.files[0], m = e.target.dataset.month; if (!f) return;
      G.readImage(f, 1000).then(src => { data[key(m)] = Object.assign({}, data[key(m)], { src }); save(); render(); G.toast(m + '月的照片换好啦 ♡'); })
        .catch(err => G.toast(err.message));
    });
    $('monthGrid').addEventListener('blur', e => {
      if (!e.target.classList.contains('quote')) return;
      const m = e.target.dataset.month, text = e.target.textContent.trim();
      data[key(m)] = Object.assign({}, data[key(m)], { quote: text || QUOTES[m-1] }); save();
    }, true);
    sel.addEventListener('change', () => { year = Number(sel.value); G.LS.set('calYear', year); render(); });
    $('printBtn').addEventListener('click', () => window.print());
    render();
  });
})(window.Gift);

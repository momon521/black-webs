(function(){
  'use strict';

  var STAMP_KEY = 'fuye.stamps';
  var ANNOT_KEY = 'fuye.annotate';
  var SOUND_KEY = 'fuye.sound';

  var chapters = window.FUYE ? window.FUYE.chapters : [];
  var patchesEl = document.getElementById('patches');
  var progressText = document.getElementById('progressText');
  var annotBtn = document.getElementById('annotBtn');
  var soundBtn = document.getElementById('soundBtn');
  var gate = document.getElementById('gate');
  var seal = document.getElementById('seal');
  var preface = document.getElementById('preface');
  var prefaceBtn = document.getElementById('prefaceBtn');
  var prefaceClose = document.getElementById('prefaceClose');

  function getStamps(){
    try {
      var v = JSON.parse(localStorage.getItem(STAMP_KEY) || '[]');
      return Array.isArray(v) ? v.map(Number) : [];
    } catch(e){ return []; }
  }

  function buildPatches(){
    var got = getStamps();
    var html = '';
    chapters.forEach(function(ch){
      html +=
        '<a class="patch' + (got.indexOf(ch.id) >= 0 ? ' read' : '') + '" href="page.html?id=' + ch.id + '" aria-label="第' + ch.numeral + '页 ' + ch.title + '">' +
          '<span class="patch-scar"></span>' +
          '<span class="patch-no">' + ch.numeral + '</span>' +
          '<span class="patch-title">' + ch.title + '</span>' +
          '<span class="patch-module">' + ch.moduleShort + '</span>' +
          '<span class="patch-girl">' + ch.girl + '</span>' +
          '<span class="patch-mark"></span>' +
        '</a>';
    });
    patchesEl.innerHTML = html;
    var n = got.length;
    progressText.textContent = n >= 9 ? '九页已读 · 第十页在等你' : '已读 ' + n + ' / 9';
  }
  buildPatches();

  function revealPatches(){
    var all = patchesEl.querySelectorAll('.patch');
    for (var i = 0; i < all.length; i++){
      (function(el, i){
        setTimeout(function(){ el.classList.add('in'); }, 40 + i * 90);
      })(all[i], i);
    }
  }

  // 批注
  var annotOn = false;
  try { annotOn = localStorage.getItem(ANNOT_KEY) === '1'; } catch(e){}
  function setAnnotate(on){
    annotOn = on;
    document.body.classList.toggle('annotate', on);
    annotBtn.classList.toggle('on', on);
    annotBtn.textContent = on ? '批注 · 开' : '批注';
    try { localStorage.setItem(ANNOT_KEY, on ? '1' : '0'); } catch(e){}
  }
  setAnnotate(annotOn);
  annotBtn.addEventListener('click', function(){ setAnnotate(!annotOn); });

  // 声音
  var ac = null, master = null, beatTimer = null;
  var soundOn = true;
  try {
    var savedSound = localStorage.getItem(SOUND_KEY);
    if (savedSound === '0') soundOn = false;
  } catch(e){}

  function updateSoundBtn(){
    soundBtn.textContent = soundOn ? '声音 · 开' : '声音 · 关';
    soundBtn.classList.toggle('on', soundOn);
  }
  updateSoundBtn();

  function thump(vol, freq){
    if (!ac || !soundOn) return;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.55);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(ac.currentTime + 0.6);
  }

  function heartbeat(){
    if (!ac) return;
    if (soundOn) {
      thump(0.42, 46);
      setTimeout(function(){ thump(0.22, 42); }, 330);
    }
    beatTimer = setTimeout(heartbeat, 1600);
  }

  function initAudio(){
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ac = new Ctx();
    master = ac.createGain();
    master.gain.value = soundOn ? 0.06 : 0;
    master.connect(ac.destination);
    heartbeat();
  }

  soundBtn.addEventListener('click', function(){
    soundOn = !soundOn;
    updateSoundBtn();
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch(e){}
    if (soundOn) {
      initAudio();
      if (master) master.gain.value = 0.06;
    } else if (master) {
      master.gain.value = 0;
    }
  });

  // 封印
  seal.addEventListener('click', function(){
    gate.classList.add('open');
    initAudio();
    revealPatches();
    setTimeout(function(){ gate.style.display = 'none'; }, 1100);
  });

  // 序页
  prefaceBtn.addEventListener('click', function(){ preface.classList.add('on'); });
  prefaceClose.addEventListener('click', function(){ preface.classList.remove('on'); });
  preface.addEventListener('click', function(e){
    if (e.target === preface) preface.classList.remove('on');
  });

  // 返回封面时刷新指印
  window.addEventListener('pageshow', function(){ buildPatches(); });

})();

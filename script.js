(function(){
  const tracks = [
    {
      title: "Midnight Static",
      artist: "The Analog Room",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
      title: "Copper Wire",
      artist: "Faye & the Fixtures",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
      title: "Slow Dial",
      artist: "Marrow",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    },
    {
      title: "Frequency Drift",
      artist: "Harbor Lights",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    },
    {
      title: "Last Call",
      artist: "The Analog Room",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
    }
  ];

  const audio = document.getElementById('audio');
  const disc = document.getElementById('disc');
  const tonearm = document.getElementById('tonearm');
  const titleEl = document.getElementById('title');
  const artistEl = document.getElementById('artist');
  const trackCountEl = document.getElementById('trackCount');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progressTrack = document.getElementById('progressTrack');
  const progressFill = document.getElementById('progressFill');
  const progressKnob = document.getElementById('progressKnob');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const volumeTrack = document.getElementById('volumeTrack');
  const volumeFill = document.getElementById('volumeFill');
  const volumeKnob = document.getElementById('volumeKnob');
  const autoplayBtn = document.getElementById('autoplayBtn');
  const loopBtn = document.getElementById('loopBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const playlistEl = document.getElementById('playlist');

  let current = 0;
  let isPlaying = false;
  let autoAdvance = true;
  let loopTrack = false;
  let shuffle = false;
  audio.volume = 0.7;

  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  function formatTime(sec){
    if(!isFinite(sec) || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function renderPlaylist(){
    playlistEl.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = i === current ? 'active' : '';
      li.innerHTML = `
        <div class="pl-track">
          <div class="pl-title">${t.title}</div>
          <div class="pl-artist">${t.artist}</div>
        </div>
        <div class="pl-dur" data-dur="${i}">--:--</div>
      `;
      li.addEventListener('click', () => loadTrack(i, true));
      playlistEl.appendChild(li);
    });
  }

  function loadTrack(index, autoplayNow){
    current = index;
    const t = tracks[current];
    audio.src = t.src;
    titleEl.textContent = t.title;
    artistEl.textContent = t.artist;
    trackCountEl.textContent = `TRACK ${current + 1} / ${tracks.length}`;
    progressFill.style.width = '0%';
    progressKnob.style.left = '0%';
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
    [...playlistEl.children].forEach((li, i) => li.classList.toggle('active', i === current));
    if(autoplayNow){
      audio.play().then(()=> setPlaying(true)).catch(()=> setPlaying(false));
    } else {
      setPlaying(false);
    }
  }

  function setPlaying(state){
    isPlaying = state;
    playIcon.parentElement.innerHTML = state ? ICON_PAUSE : ICON_PLAY;
    playBtn.setAttribute('aria-label', state ? 'Pause' : 'Play');
    disc.classList.toggle('spinning', state);
    tonearm.classList.toggle('on', state);
  }

  function togglePlay(){
    if(isPlaying){
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(()=> setPlaying(true)).catch(()=>{});
    }
  }

  function nextTrack(){
    let idx;
    if(shuffle){
      idx = Math.floor(Math.random() * tracks.length);
    } else {
      idx = (current + 1) % tracks.length;
    }
    loadTrack(idx, true);
  }

  function prevTrack(){
    if(audio.currentTime > 3){
      audio.currentTime = 0;
      return;
    }
    const idx = (current - 1 + tracks.length) % tracks.length;
    loadTrack(idx, true);
  }

  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);

  audio.addEventListener('timeupdate', () => {
    if(!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    progressKnob.style.left = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
    const durCell = playlistEl.querySelector(`[data-dur="${current}"]`);
    if(durCell) durCell.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    if(loopTrack){
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if(autoAdvance){
      nextTrack();
    } else {
      setPlaying(false);
    }
  });

  // seek by clicking / dragging progress bar
  function seekFromEvent(e){
    const rect = progressTrack.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.min(1, Math.max(0, pct));
    if(audio.duration){
      audio.currentTime = pct * audio.duration;
      progressFill.style.width = (pct*100) + '%';
      progressKnob.style.left = (pct*100) + '%';
    }
  }
  let seeking = false;
  progressTrack.addEventListener('mousedown', (e) => { seeking = true; seekFromEvent(e); });
  window.addEventListener('mousemove', (e) => { if(seeking) seekFromEvent(e); });
  window.addEventListener('mouseup', () => seeking = false);
  progressTrack.addEventListener('touchstart', (e) => { seeking = true; seekFromEvent(e); });
  window.addEventListener('touchmove', (e) => { if(seeking) seekFromEvent(e); });
  window.addEventListener('touchend', () => seeking = false);

  // volume control
  function setVolumeFromEvent(e){
    const rect = volumeTrack.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.min(1, Math.max(0, pct));
    audio.volume = pct;
    volumeFill.style.width = (pct*100) + '%';
    volumeKnob.style.left = (pct*100) + '%';
  }
  let adjustingVol = false;
  volumeTrack.addEventListener('mousedown', (e) => { adjustingVol = true; setVolumeFromEvent(e); });
  window.addEventListener('mousemove', (e) => { if(adjustingVol) setVolumeFromEvent(e); });
  window.addEventListener('mouseup', () => adjustingVol = false);
  volumeTrack.addEventListener('touchstart', (e) => { adjustingVol = true; setVolumeFromEvent(e); });
  window.addEventListener('touchmove', (e) => { if(adjustingVol) setVolumeFromEvent(e); });
  window.addEventListener('touchend', () => adjustingVol = false);

  // init volume UI
  volumeFill.style.width = (audio.volume*100) + '%';
  volumeKnob.style.left = (audio.volume*100) + '%';

  // mode toggles
  autoplayBtn.addEventListener('click', () => {
    autoAdvance = !autoAdvance;
    autoplayBtn.classList.toggle('active', autoAdvance);
  });
  loopBtn.addEventListener('click', () => {
    loopTrack = !loopTrack;
    loopBtn.classList.toggle('active', loopTrack);
  });
  shuffleBtn.addEventListener('click', () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('active', shuffle);
  });

  // preload durations for playlist display
  tracks.forEach((t, i) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = t.src;
    probe.addEventListener('loadedmetadata', () => {
      const cell = playlistEl.querySelector(`[data-dur="${i}"]`);
      if(cell) cell.textContent = formatTime(probe.duration);
    });
  });

  renderPlaylist();
  loadTrack(0, false);
})();
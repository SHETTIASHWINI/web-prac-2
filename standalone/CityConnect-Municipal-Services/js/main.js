document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. CityConnect Audio Guide (Spoken English Speech Synthesis)
  const segments = [
    'Welcome to CityConnect Municipal Services, the digital citizen portal designed to keep our municipality connected, responsive, and easy to reach.',
    'On this website, residents can check water supply updates, review the six-day household waste collection schedule, read official municipal announcements, and locate city office contact details.',
    'To report a civic concern, open the Register a Complaint section, choose Water Supply, Waste Management, or Public Grievance, enter your street or area, describe the problem clearly, and submit the form for departmental review.',
    'Clean cities begin with everyday civic responsibility. Separating household waste, using designated collection points, and promptly reporting water leaks or missed pickups help sanitation workers keep our neighborhoods healthy and safe for everyone.'
  ];

  const playBtn = document.getElementById('audioPlayBtn');
  const pauseBtn = document.getElementById('audioPauseBtn');
  const stopBtn = document.getElementById('audioStopBtn');
  const voiceSelect = document.getElementById('voiceSelect');
  const rateSelect = document.getElementById('rateSelect');
  const statusBadge = document.getElementById('audioStatusBadge');
  const progressFill = document.getElementById('audioProgressFill');
  const progressText = document.getElementById('audioProgressText');
  const audioNotice = document.getElementById('audioNotice');
  const transcriptItems = Array.from(document.querySelectorAll('.transcript-item'));

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voices = [];
  let currentSegment = 0;
  let isSpeaking = false;
  let isPaused = false;
  let speechSessionId = 0;

  function populateVoices() {
    if (!synth || !voiceSelect) return;
    const allVoices = synth.getVoices();
    const englishVoices = allVoices.filter((v) => /^en/i.test(v.lang));
    voices = englishVoices.length > 0 ? englishVoices : allVoices;
    voiceSelect.innerHTML = '';
    if (voices.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Default browser English voice';
      voiceSelect.appendChild(opt);
      return;
    }
    voices.forEach((voice, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${voice.name} (${voice.lang})`;
      if (voice.default) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
  }

  if (synth) {
    populateVoices();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = populateVoices;
    }
  } else if (audioNotice) {
    audioNotice.hidden = false;
    audioNotice.textContent = 'Speech synthesis is unavailable in this browser. Please open in Chrome, Edge, Firefox, or Safari.';
  }

  function updateAudioUI(stateLabel) {
    if (statusBadge) statusBadge.textContent = stateLabel;
    if (playBtn) {
      playBtn.disabled = isSpeaking && !isPaused;
      playBtn.textContent = isPaused ? '▶ Resume' : '▶ Play';
    }
    if (pauseBtn) pauseBtn.disabled = !isSpeaking || isPaused;
    if (stopBtn) stopBtn.disabled = !isSpeaking && !isPaused;

    const pct = isSpeaking || isPaused ? Math.round(((currentSegment + 1) / segments.length) * 100) : 0;
    if (progressFill) progressFill.style.width = `${pct}%`;

    transcriptItems.forEach((btn, idx) => {
      btn.classList.toggle('active', (isSpeaking || isPaused) && idx === currentSegment);
    });
  }

  function stopSpeech(completed = false) {
    speechSessionId += 1;
    if (synth) synth.cancel();
    isSpeaking = false;
    isPaused = false;
    currentSegment = 0;
    if (progressText) {
      progressText.textContent = completed
        ? 'Finished speaking all 4 sections. Click Play to listen again.'
        : 'Click Play to hear the spoken English guide (4 sections).';
    }
    updateAudioUI(completed ? 'Completed' : 'Ready to speak');
  }

  function speakFromIndex(index) {
    if (!synth) {
      if (audioNotice) audioNotice.hidden = false;
      return;
    }

    if (audioNotice) audioNotice.hidden = true;
    speechSessionId += 1;
    const activeSession = speechSessionId;
    synth.cancel();

    currentSegment = index;
    isSpeaking = true;
    isPaused = false;

    const utterance = new SpeechSynthesisUtterance(segments[index]);
    utterance.lang = 'en-US';
    utterance.rate = rateSelect ? parseFloat(rateSelect.value) || 1 : 1;

    if (voiceSelect && voiceSelect.value !== '' && voices[Number(voiceSelect.value)]) {
      utterance.voice = voices[Number(voiceSelect.value)];
    }

    if (progressText) {
      progressText.textContent = `Speaking section ${index + 1} of ${segments.length}...`;
    }
    updateAudioUI('Speaking');

    utterance.onend = () => {
      if (activeSession !== speechSessionId) return;
      if (index + 1 < segments.length) {
        speakFromIndex(index + 1);
      } else {
        stopSpeech(true);
      }
    };

    utterance.onerror = (ev) => {
      if (activeSession !== speechSessionId) return;
      if (ev.error === 'interrupted' || ev.error === 'canceled') return;
      isSpeaking = false;
      isPaused = false;
      updateAudioUI('Audio unavailable');
      if (audioNotice) {
        audioNotice.hidden = false;
        audioNotice.textContent = `Audio playback could not start (${ev.error}). Check system sound or browser speech voices.`;
      }
    };

    synth.speak(utterance);
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (!synth) return;
      if (isPaused) {
        synth.resume();
        isPaused = false;
        isSpeaking = true;
        if (progressText) progressText.textContent = `Speaking section ${currentSegment + 1} of ${segments.length}...`;
        updateAudioUI('Speaking');
        return;
      }
      speakFromIndex(0);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!synth || !isSpeaking || isPaused) return;
      synth.pause();
      isPaused = true;
      if (progressText) progressText.textContent = `Paused at section ${currentSegment + 1} of ${segments.length}.`;
      updateAudioUI('Paused');
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => stopSpeech(false));
  }

  transcriptItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.segment || 0);
      speakFromIndex(idx);
    });
  });

  window.addEventListener('beforeunload', () => {
    if (synth) synth.cancel();
  });

  // 3. CityConnect in Action Video Chapter Buttons
  const video = document.getElementById('municipalVideo');
  document.querySelectorAll('.chapter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!video) return;
      const targetTime = parseFloat(btn.dataset.time || '0');
      video.currentTime = targetTime;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    });
  });

  // 4. Photo Gallery Lightbox Modal
  const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxCredit = document.getElementById('lightboxCredit');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(card) {
    if (!lightbox || !lightboxImg || !lightboxTitle || !lightboxDesc || !lightboxCredit) return;
    const img = card.querySelector('img');
    const title = card.querySelector('strong');
    const desc = card.querySelector('figcaption p');
    const credit = card.querySelector('.credit');
    if (!img) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxTitle.textContent = title ? title.textContent : '';
    lightboxDesc.textContent = desc ? desc.textContent : '';
    lightboxCredit.textContent = credit ? credit.textContent : '';
    lightbox.hidden = false;
  }

  function closeLightbox() {
    if (lightbox) lightbox.hidden = true;
  }

  galleryCards.forEach((card) => {
    card.addEventListener('click', () => openLightbox(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(card);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  // 5. Complaint Form Validation & Accessible Confirmation
  const complaintForm = document.getElementById('complaintForm');
  const feedbackBox = document.getElementById('formFeedback');

  if (complaintForm && feedbackBox) {
    complaintForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullname = document.getElementById('fullname');
      const phone = document.getElementById('phone');
      const email = document.getElementById('email');
      const category = document.getElementById('category');
      const area = document.getElementById('area');
      const details = document.getElementById('details');

      [fullname, phone, email, category, area, details].forEach((el) => el && el.classList.remove('invalid'));

      const errors = [];
      const nameVal = fullname.value.trim();
      const phoneDigits = phone.value.replace(/\D/g, '');
      const emailVal = email.value.trim();
      const categoryVal = category.value.trim();
      const areaVal = area.value.trim();
      const detailsVal = details.value.trim();

      if (nameVal.length < 2) {
        errors.push('Please enter your full name.');
        fullname.classList.add('invalid');
      }
      if (phoneDigits.length < 7) {
        errors.push('Please enter a valid contact phone number (at least 7 digits).');
        phone.classList.add('invalid');
      }
      if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errors.push('Please enter a valid email address.');
        email.classList.add('invalid');
      }
      if (!categoryVal) {
        errors.push('Please select a service category.');
        category.classList.add('invalid');
      }
      if (areaVal.length < 3) {
        errors.push('Please enter your street, ward, or area location.');
        area.classList.add('invalid');
      }
      if (detailsVal.length < 10) {
        errors.push('Please enter at least 10 characters describing the issue.');
        details.classList.add('invalid');
      }

      feedbackBox.hidden = false;
      if (errors.length > 0) {
        feedbackBox.className = 'form-feedback error';
        feedbackBox.textContent = errors.join(' ');
        return;
      }

      const refCode = `CC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      feedbackBox.className = 'form-feedback success';
      feedbackBox.textContent = `Thank you, ${nameVal}. Demonstration reference ${refCode} recorded for ${categoryVal} at ${areaVal}. This is a front-end practicum demo; no complaint has been sent to a municipal office.`;
      complaintForm.reset();
    });
  }
});

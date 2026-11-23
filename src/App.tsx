/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect, useRef, useState} from 'react';

interface GalleryItem {
  title: string;
  src: string;
  alt: string;
  caption: string;
  credit: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    title: 'Municipal Corporation Buildings',
    src: '/web-prac-2/Assets/Media/Images/muncipal-building.jpg',
    alt: 'Municipal corporation city hall and civic administrative building with landscaped entrance and transit street',
    caption:
      'Civic headquarters housing municipal administration, citizen desks, and public service records.',
    credit: 'Photo: Wikimedia Commons (CC BY-SA 2.0)',
  },
  {
    title: 'Road Cleaning & Sanitation Workers',
    src: '/web-prac-2/Assets/Media/Images/road-cleaning.jpg',
    alt: 'Sanitation workers in orange safety gear cleaning city sidewalks alongside a municipal street sweeping truck',
    caption:
      'Municipal sanitation crews clearing sidewalks and roadways to keep commercial and residential streets spotless.',
    credit: 'Photo: Wikimedia Commons (CC BY-SA 4.0)',
  },
  {
    title: 'Garbage Collection & Waste Management',
    src: '/web-prac-2/Assets/Media/Images/garbage-collection.jpg',
    alt: 'Municipal sanitation worker operating a white garbage collection truck along a city avenue',
    caption:
      'Dedicated municipal collection trucks transporting household and neighborhood waste safely on daily routes.',
    credit: 'Photo: Wikimedia Commons (CC BY 2.0)',
  },
  {
    title: 'Road Maintenance & Street Repairs',
    src: '/web-prac-2/Assets/Media/Images/road-maintenance.jpg',
    alt: 'Crew operating an asphalt paving machine and compactor roller during road maintenance and resurfacing',
    caption:
      'Civil engineering and paving crews resurfacing damaged roadways and maintaining smooth urban transport links.',
    credit: 'Photo: Public Domain Civic Archive',
  },
  {
    title: 'Water Supply & Drainage Systems',
    src: '/web-prac-2/Assets/Media/Images/water-supply.jpg',
    alt: 'Municipal water treatment plant concrete filtration basins, channels, and clean water storage tanks',
    caption:
      'Municipal filtration basins, water treatment channels, and distribution facilities safeguarding clean city water.',
    credit: 'Photo: Wikimedia Commons (CC BY-SA 2.0)',
  },
  {
    title: 'Public Parks & City Infrastructure',
    src: '/web-prac-2/Assets/Media/Images/public-park.jpg',
    alt: 'Neighborhood municipal public park featuring green lawns, mature trees, playground equipment, and park pavilion',
    caption:
      'Maintained neighborhood green spaces, playgrounds, and shared community infrastructure open to all residents.',
    credit: 'Photo: Wikimedia Commons (CC BY-SA 4.0)',
  },
];

interface AudioSegment {
  heading: string;
  text: string;
}

const AUDIO_SEGMENTS: AudioSegment[] = [
  {
    heading: '1. Introduction to CityConnect',
    text: 'Welcome to CityConnect Municipal Services, the digital citizen portal designed to keep our municipality connected, responsive, and easy to reach.',
  },
  {
    heading: '2. Municipal Services Available',
    text: 'On this website, residents can check water supply updates, review the six-day household waste collection schedule, read official municipal announcements, and locate city office contact details.',
  },
  {
    heading: '3. How to Report Complaints',
    text: 'To report a civic concern, open the Register a Complaint section, choose Water Supply, Waste Management, or Public Grievance, enter your street or area, describe the problem clearly, and submit the form for departmental review.',
  },
  {
    heading: '4. Cleanliness & Civic Responsibility',
    text: 'Clean cities begin with everyday civic responsibility. Separating household waste, using designated collection points, and promptly reporting water leaks or missed pickups help sanitation workers keep our neighborhoods healthy and safe for everyone.',
  },
];

export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Audio Guide state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const [audioStatus, setAudioStatus] = useState('Ready to speak');
  const [audioProgressMsg, setAudioProgressMsg] = useState(
    'Click Play to hear the spoken English guide (4 sections).'
  );
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const speechSessionRef = useRef(0);

  // Lightbox state
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Complaint Form state
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('');
  const [details, setDetails] = useState('');
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioNotice(
        'Speech synthesis is unavailable in this browser. Please open in Chrome, Edge, Firefox, or Safari.'
      );
      return;
    }

    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const english = all.filter((v) => /^en/i.test(v.lang));
      const list = english.length > 0 ? english : all;
      setVoices(list);
      if (list.length > 0) {
        const defaultIdx = list.findIndex((v) => v.default);
        setSelectedVoiceIdx(String(defaultIdx >= 0 ? defaultIdx : 0));
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
      synth.cancel();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const stopSpeech = (completed = false) => {
    speechSessionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveSegment(0);
    setAudioStatus(completed ? 'Completed' : 'Ready to speak');
    setAudioProgressMsg(
      completed
        ? 'Finished speaking all 4 sections. Click Play to listen again.'
        : 'Click Play to hear the spoken English guide (4 sections).'
    );
  };

  const speakFromIndex = (index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioNotice('Speech synthesis is unavailable in this browser.');
      return;
    }

    const synth = window.speechSynthesis;
    setAudioNotice(null);
    speechSessionRef.current += 1;
    const activeSession = speechSessionRef.current;
    synth.cancel();

    setActiveSegment(index);
    setIsSpeaking(true);
    setIsPaused(false);
    setAudioStatus('Speaking');
    setAudioProgressMsg(`Speaking section ${index + 1} of ${AUDIO_SEGMENTS.length}...`);

    const utterance = new SpeechSynthesisUtterance(AUDIO_SEGMENTS[index].text);
    utterance.lang = 'en-US';
    utterance.rate = speechRate;

    const chosen = selectedVoiceIdx !== '' ? voices[Number(selectedVoiceIdx)] : undefined;
    if (chosen) {
      utterance.voice = chosen;
    }

    utterance.onend = () => {
      if (activeSession !== speechSessionRef.current) return;
      if (index + 1 < AUDIO_SEGMENTS.length) {
        speakFromIndex(index + 1);
      } else {
        stopSpeech(true);
      }
    };

    utterance.onerror = (ev) => {
      if (activeSession !== speechSessionRef.current) return;
      if (ev.error === 'interrupted' || ev.error === 'canceled') return;
      setIsSpeaking(false);
      setIsPaused(false);
      setAudioStatus('Audio unavailable');
      setAudioNotice(
        `Audio playback could not start (${ev.error}). Check system audio or browser speech voices.`
      );
    };

    synth.speak(utterance);
  };

  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      setAudioStatus('Speaking');
      setAudioProgressMsg(`Speaking section ${activeSegment + 1} of ${AUDIO_SEGMENTS.length}...`);
      return;
    }
    speakFromIndex(0);
  };

  const handlePauseAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!isSpeaking || isPaused) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setAudioStatus('Paused');
    setAudioProgressMsg(`Paused at section ${activeSegment + 1} of ${AUDIO_SEGMENTS.length}.`);
  };

  const handleVideoChapter = (seconds: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = seconds;
    const p = vid.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  };

  const handleComplaintSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextInvalid: Record<string, boolean> = {};
    const errors: string[] = [];

    const nameTrimmed = fullname.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    const emailTrimmed = email.trim();
    const areaTrimmed = area.trim();
    const detailsTrimmed = details.trim();

    if (nameTrimmed.length < 2) {
      nextInvalid.fullname = true;
      errors.push('Please enter your full name.');
    }
    if (phoneDigits.length < 7) {
      nextInvalid.phone = true;
      errors.push('Please enter a valid contact phone number (at least 7 digits).');
    }
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      nextInvalid.email = true;
      errors.push('Please enter a valid email address.');
    }
    if (!category) {
      nextInvalid.category = true;
      errors.push('Please select a service category.');
    }
    if (areaTrimmed.length < 3) {
      nextInvalid.area = true;
      errors.push('Please enter your street, ward, or area location.');
    }
    if (detailsTrimmed.length < 10) {
      nextInvalid.details = true;
      errors.push('Please enter at least 10 characters describing the issue.');
    }

    setInvalidFields(nextInvalid);

    if (errors.length > 0) {
      setFormFeedback({type: 'error', message: errors.join(' ')});
      return;
    }

    const refCode = `CC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormFeedback({
      type: 'success',
      message: `Thank you, ${nameTrimmed}. Demonstration reference ${refCode} recorded for ${category} at ${areaTrimmed}. This is a front-end practicum demo; no complaint has been sent to a municipal office.`,
    });
    setFullname('');
    setPhone('');
    setEmail('');
    setCategory('');
    setArea('');
    setDetails('');
  };

  const audioProgressPct =
    isSpeaking || isPaused ? `${Math.round(((activeSegment + 1) / AUDIO_SEGMENTS.length) * 100)}%` : '0%';

  return (
    <>
      <div className="top-strip">
        <span>🏛️ City Municipal Corporation · Citizen Service Portal</span>
        <span>Public information and essential services</span>
      </div>

      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#home" aria-label="CityConnect home">
            <span className="brand-mark">C</span>
            <span>
              <strong>CityConnect</strong>
              <small>Municipal Services</small>
            </span>
          </a>
          <button
            type="button"
            className="mobile-menu-btn"
            aria-expanded={mobileNavOpen}
            aria-controls="mainNav"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            Menu ☰
          </button>
          <nav
            id="mainNav"
            className={`main-nav${mobileNavOpen ? ' open' : ''}`}
            aria-label="Main navigation"
          >
            <a href="#home" onClick={() => setMobileNavOpen(false)}>Home</a>
            <a href="#services" onClick={() => setMobileNavOpen(false)}>Services</a>
            <a href="#multimedia" onClick={() => setMobileNavOpen(false)}>Multimedia Centre</a>
            <a href="#announcements" onClick={() => setMobileNavOpen(false)}>Announcements</a>
            <a href="#schedule" onClick={() => setMobileNavOpen(false)}>Collection Schedule</a>
            <a href="#complaint" className="nav-cta" onClick={() => setMobileNavOpen(false)}>
              Register Complaint
            </a>
            <a href="#contact" onClick={() => setMobileNavOpen(false)}>Contact</a>
          </nav>
        </div>
      </header>

      <main className="portal-main">
        <section className="hero" id="home">
          <div>
            <span className="eyebrow">Your city, your services</span>
            <h1>A better city begins with better public services.</h1>
            <p>
              Find essential municipal information, learn about water and waste services, and share a
              civic concern with your municipal corporation.
            </p>
            <div className="hero-actions">
              <a className="button" href="#services">Explore Services</a>
              <a className="button secondary" href="#complaint">Submit a Complaint</a>
              <a className="button outline-light" href="#audio-guide">Listen to Audio Guide</a>
            </div>
          </div>
          <img
            className="hero-art"
            src="/assets/media/images/municipal-building.jpg"
            alt="CityConnect municipal corporation city hall building and civic plaza"
            width={960}
            height={436}
          />
        </section>

        <div className="quick-grid" aria-label="Quick service highlights">
          <div className="quick-card">
            <span className="quick-icon">💧</span>
            <div>
              <strong>Water Services</strong>
              <span>Supply and service information</span>
            </div>
          </div>
          <div className="quick-card">
            <span className="quick-icon">♻️</span>
            <div>
              <strong>Waste Management</strong>
              <span>Collection and cleanliness</span>
            </div>
          </div>
          <div className="quick-card">
            <span className="quick-icon">📣</span>
            <div>
              <strong>Public Grievances</strong>
              <span>Report a civic issue</span>
            </div>
          </div>
        </div>

        <section className="portal-section" id="services">
          <div className="section-heading">
            <div>
              <h2>Municipal Services</h2>
              <p>Access important services provided for residents.</p>
            </div>
            <span className="tag">Citizen help centre</span>
          </div>
          <div className="service-grid">
            <article className="service-card">
              <span className="icon">💧</span>
              <h3>Water Supply</h3>
              <p>
                View water supply updates, report interruptions, and find information about
                water-related services.
              </p>
              <a href="#complaint">Report a water issue →</a>
            </article>
            <article className="service-card">
              <span className="icon">♻️</span>
              <h3>Waste Management</h3>
              <p>
                Check waste collection information and report missed pickups or public-area waste
                concerns.
              </p>
              <a href="#schedule">View collection schedule →</a>
            </article>
            <article className="service-card">
              <span className="icon">📝</span>
              <h3>Public Grievances</h3>
              <p>
                Share concerns about municipal services so the appropriate department can review them.
              </p>
              <a href="#complaint">Register a complaint →</a>
            </article>
          </div>
        </section>

        <section className="portal-section" id="multimedia">
          <div className="section-heading">
            <div>
              <h2>Multimedia Centre</h2>
              <p>
                Real-life municipal service photography, spoken English citizen guide, and field
                operations video.
              </p>
            </div>
            <span className="tag">Photos · Audio · Video</span>
          </div>

          <div className="media-block">
            <div className="sub-heading">
              <h3>Real-Life Municipal Photo Gallery</h3>
              <p>
                Genuine photographs showing city administration, street sanitation, waste collection,
                road repairs, water treatment, and public parks. Click any photo to enlarge.
              </p>
            </div>
            <div className="gallery-grid" id="photoGallery">
              {GALLERY_ITEMS.map((item) => (
                <figure
                  key={item.title}
                  className="gallery-card"
                  tabIndex={0}
                  onClick={() => setLightboxItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxItem(item);
                    }
                  }}
                >
                  <div className="gallery-img-wrap">
                    <img src={item.src} alt={item.alt} loading="lazy" />
                  </div>
                  <figcaption>
                    <strong>{item.title}</strong>
                    <p>{item.caption}</p>
                    <span className="credit">{item.credit}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="av-grid">
            <article className="av-card" id="audio-guide">
              <div className="av-header">
                <div>
                  <h3>CityConnect Audio Guide</h3>
                  <p>
                    Spoken English introduction covering municipal services, complaint reporting, and
                    civic responsibility.
                  </p>
                </div>
                <span className="tag" id="audioStatusBadge">{audioStatus}</span>
              </div>

              <div className="audio-player-box">
                <div className="audio-controls" role="group" aria-label="Audio guide playback controls">
                  <button
                    type="button"
                    className="button"
                    id="audioPlayBtn"
                    disabled={isSpeaking && !isPaused}
                    onClick={handlePlayAudio}
                  >
                    {isPaused ? '▶ Resume' : '▶ Play'}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    id="audioPauseBtn"
                    disabled={!isSpeaking || isPaused}
                    onClick={handlePauseAudio}
                  >
                    ⏸ Pause
                  </button>
                  <button
                    type="button"
                    className="button danger-soft"
                    id="audioStopBtn"
                    disabled={!isSpeaking && !isPaused}
                    onClick={() => stopSpeech(false)}
                  >
                    ■ Stop
                  </button>
                </div>

                <div className="audio-options">
                  <label htmlFor="voiceSelect">
                    Speaking Voice
                    <select
                      id="voiceSelect"
                      aria-label="Select speaking voice"
                      value={selectedVoiceIdx}
                      onChange={(e) => setSelectedVoiceIdx(e.target.value)}
                    >
                      {voices.length === 0 ? (
                        <option value="">Default browser English voice</option>
                      ) : (
                        voices.map((v, idx) => (
                          <option key={`${v.name}-${idx}`} value={String(idx)}>
                            {v.name} ({v.lang})
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <label htmlFor="rateSelect">
                    Speed
                    <select
                      id="rateSelect"
                      aria-label="Select speaking speed"
                      value={String(speechRate)}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value) || 1)}
                    >
                      <option value="0.9">0.9× Clear</option>
                      <option value="1">1.0× Normal</option>
                      <option value="1.15">1.15× Brisk</option>
                    </select>
                  </label>
                </div>

                <div className="progress-wrap" aria-hidden="true">
                  <div className="progress-fill" style={{width: audioProgressPct}} />
                </div>
                <p className="audio-meta" id="audioProgressText">{audioProgressMsg}</p>
                {audioNotice && (
                  <div className="audio-fallback-note" id="audioNotice">
                    {audioNotice}
                  </div>
                )}
              </div>

              <div className="transcript-box" aria-label="Spoken audio guide transcript">
                <h4>Spoken Script &amp; Live Highlight</h4>
                <div className="transcript-list" id="transcriptList">
                  {AUDIO_SEGMENTS.map((seg, idx) => (
                    <button
                      key={seg.heading}
                      type="button"
                      className={`transcript-item${
                        (isSpeaking || isPaused) && activeSegment === idx ? ' active' : ''
                      }`}
                      onClick={() => speakFromIndex(idx)}
                    >
                      <strong>{seg.heading}</strong>
                      <span>{seg.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="av-card" id="video-action">
              <div className="av-header">
                <div>
                  <h3>CityConnect in Action</h3>
                  <p>
                    Real-life municipal street sweeping and neighborhood waste collection operations in
                    progress.
                  </p>
                </div>
                <span className="tag">HD Video with Sound</span>
              </div>

              <div className="video-frame-wrap">
                <video
                  ref={videoRef}
                  id="municipalVideo"
                  controls
                  preload="metadata"
                  playsInline
                  poster="/web-prac-2/Assets/Media/Images/video-poster.jpg"
                >
                  <source src="/web-prac-2/Assets/Media/Video/cityconnect-in-action.mp4" type="video/mp4" />
                  Your browser does not support HTML5 video playback.
                </video>
              </div>

              <div className="video-chapters" role="group" aria-label="Video activity highlights">
                <button
                  type="button"
                  className="chapter-btn"
                  onClick={() => handleVideoChapter(0)}
                >
                  0:00 · Walk-Behind Street Sweeping
                </button>
                <button
                  type="button"
                  className="chapter-btn"
                  onClick={() => handleVideoChapter(7.6)}
                >
                  0:08 · Curbside Waste Collection Truck
                </button>
              </div>

              <p className="video-caption">
                <strong>Activities shown:</strong> Municipal sidewalk and pavement street sweeping
                followed by automated residential waste pickup along a neighborhood route. Real
                ambient audio included.
              </p>
              <span className="credit">
                Video clips: Wikimedia Commons (CC BY-SA 4.0) · Walk-behind street sweeper &amp;
                neighborhood trash collection truck.
              </span>
            </article>
          </div>
        </section>

        <section className="portal-section" id="announcements">
          <div className="section-heading">
            <div>
              <h2>Announcements &amp; Updates</h2>
              <p>Important notices for citizens. Check here for service updates.</p>
            </div>
          </div>
          <div className="content-grid">
            <article className="portal-card">
              <h3>Latest Announcements</h3>
              <div className="announcement">
                <time dateTime="2026-11-20">20 November 2026 · Public notice</time>
                <p>
                  Residents are encouraged to keep household waste separated for responsible
                  collection.
                </p>
              </div>
              <div className="announcement">
                <time dateTime="2026-11-18">18 November 2026 · Water services</time>
                <p>
                  Citizens can use the complaint section to report water supply interruptions in their
                  area.
                </p>
              </div>
              <div className="announcement">
                <time dateTime="2026-11-15">15 November 2026 · Clean city</time>
                <p>Please keep public spaces clean and use the designated waste collection points.</p>
              </div>
            </article>
            <aside className="panel">
              <h3>Citizen Information</h3>
              <ul className="notice-list">
                <li>Use the complaint form to describe a civic issue clearly.</li>
                <li>Choose the correct service category when submitting a complaint.</li>
                <li>Provide accurate contact details for follow-up.</li>
                <li>Follow official announcements for service-related updates.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="portal-section" id="schedule">
          <div className="section-heading">
            <div>
              <h2>Waste Collection Information</h2>
              <p>A sample schedule showing how collection details can be presented.</p>
            </div>
            <span className="tag">Sample information</span>
          </div>
          <div className="table-wrap">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Service Area</th>
                  <th>Service</th>
                  <th>Collection Day</th>
                  <th>Information</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Central Zone</td>
                  <td>Household waste</td>
                  <td>Monday – Saturday</td>
                  <td><span className="status">Scheduled</span></td>
                </tr>
                <tr>
                  <td>North Zone</td>
                  <td>Household waste</td>
                  <td>Monday – Saturday</td>
                  <td><span className="status">Scheduled</span></td>
                </tr>
                <tr>
                  <td>South Zone</td>
                  <td>Household waste</td>
                  <td>Monday – Saturday</td>
                  <td><span className="status">Scheduled</span></td>
                </tr>
                <tr>
                  <td>All Zones</td>
                  <td>Public-area cleaning</td>
                  <td>As per local route</td>
                  <td><span className="status">Ongoing</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="form-note">
            Note: The schedule above is sample website content for this practicum, not an official
            municipal timetable.
          </p>
        </section>

        <section className="portal-section" id="complaint">
          <div className="section-heading">
            <div>
              <h2>Register a Complaint</h2>
              <p>Use this sample form to describe an issue related to municipal services.</p>
            </div>
          </div>
          <div className="form-layout">
            <div className="form-intro">
              <h3>Your feedback helps improve the city.</h3>
              <p>
                Choose a service category and provide a clear description of the issue. Include your
                area so the relevant department can identify the location.
              </p>
              <ul>
                <li>Water supply concerns</li>
                <li>Waste collection concerns</li>
                <li>Other municipal grievances</li>
              </ul>
            </div>
            <form
              id="complaintForm"
              className="complaint-form"
              action="#"
              method="get"
              noValidate
              onSubmit={handleComplaintSubmit}
            >
              <div className="form-row">
                <div>
                  <label htmlFor="fullname">Full Name</label>
                  <input
                    type="text"
                    id="fullname"
                    name="fullname"
                    placeholder="Enter your name"
                    required
                    value={fullname}
                    className={invalidFields.fullname ? 'invalid' : ''}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="phone">Contact Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    required
                    value={phone}
                    className={invalidFields.phone ? 'invalid' : ''}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    value={email}
                    className={invalidFields.email ? 'invalid' : ''}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="category">Service Category</label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={category}
                    className={invalidFields.category ? 'invalid' : ''}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Public Grievance">Public Grievance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <label htmlFor="area">Area / Location</label>
              <input
                type="text"
                id="area"
                name="area"
                placeholder="Enter your street or area"
                required
                value={area}
                className={invalidFields.area ? 'invalid' : ''}
                onChange={(e) => setArea(e.target.value)}
              />
              <label htmlFor="details">Complaint Details</label>
              <textarea
                id="details"
                name="details"
                placeholder="Briefly explain the issue..."
                required
                value={details}
                className={invalidFields.details ? 'invalid' : ''}
                onChange={(e) => setDetails(e.target.value)}
              />
              <button className="button" type="submit">Submit Complaint</button>
              {formFeedback && (
                <div
                  id="formFeedback"
                  className={`form-feedback ${formFeedback.type}`}
                  role="status"
                  aria-live="polite"
                >
                  {formFeedback.message}
                </div>
              )}
              <p className="form-note">
                Demonstration form only. It does not store or send personal information.
              </p>
            </form>
          </div>
        </section>

        <section className="portal-section" id="contact">
          <div className="section-heading">
            <div>
              <h2>Contact the Municipal Office</h2>
              <p>Use the contact information below for general municipal enquiries.</p>
            </div>
          </div>
          <div className="contact-grid">
            <div className="contact-card">
              <strong>📍 Office Address</strong>
              <p>
                Municipal Corporation Office
                <br />
                City Centre, Main Road
              </p>
            </div>
            <div className="contact-card">
              <strong>☎️ Helpdesk</strong>
              <p>
                Phone: 1800-000-0000
                <br />
                Monday – Friday, 9:00 AM – 5:00 PM
              </p>
            </div>
            <div className="contact-card">
              <strong>✉️ Email</strong>
              <p>
                <a href="mailto:help@cityconnect.example">help@cityconnect.example</a>
                <br />
                For general service enquiries
              </p>
            </div>
          </div>
          <p className="form-note">
            The address and contact details are illustrative placeholders for the practicum project.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>CityConnect Municipal Services</strong>
            <p>Working together for a cleaner, safer and better-connected city.</p>
            <p>© 2026 CityConnect. Static HTML practicum demonstration.</p>
          </div>
          <div className="footer-links">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#multimedia">Multimedia</a>
            <a href="#complaint">Complaints</a>
            <a href="#contact">Contact</a>
            <a
              href="/CityConnect-Municipal-Services.zip"
              download="CityConnect-Municipal-Services.zip"
              className="zip-download-link"
            >
              Download VS Code ZIP
            </a>
          </div>
        </div>
      </footer>

      {lightboxItem && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightboxTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxItem(null);
          }}
        >
          <div className="lightbox-dialog">
            <button
              type="button"
              className="lightbox-close"
              aria-label="Close photo preview"
              onClick={() => setLightboxItem(null)}
            >
              ✕
            </button>
            <img src={lightboxItem.src} alt={lightboxItem.alt} />
            <div className="lightbox-caption">
              <h4 id="lightboxTitle">{lightboxItem.title}</h4>
              <p>{lightboxItem.caption}</p>
              <span className="credit">{lightboxItem.credit}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

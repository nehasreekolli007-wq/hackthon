// ─────────────────────────────────────────────────────────────
//  Voice Engine — voice.js
//  Strategy:
//    • Indian languages → Backend TTS proxy → Google Translate audio
//      (avoids localhost CORS block)
//    • English → Web Speech API (browser built-in, works offline)
// ─────────────────────────────────────────────────────────────

// Our backend proxy endpoint
const TTS_PROXY = 'http://localhost:5000/tts';


// Google Translate language codes
const GT_LANG = {
  en: 'en',
  hi: 'hi',
  te: 'te',
  ta: 'ta',
  kn: 'kn',
  mr: 'mr'
};

// Track current audio so we can stop it
let _currentAudio = null;

// Stop any playing audio
const stopAll = () => {
  if (_currentAudio) {
    try { _currentAudio.pause(); _currentAudio.src = ''; } catch (_) { }
    _currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

// Split long text into ≤190 char chunks at sentence boundaries
// (Google TTS has a character limit per request)
const chunkText = (text, maxLen = 190) => {
  const parts = text.match(/[^।.!?]+[।.!?]*/g) || [text];
  const chunks = [];
  let buf = '';
  for (const p of parts) {
    if ((buf + p).length > maxLen && buf.trim()) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf += p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter(c => c.trim().length > 0);
};

// Play one audio chunk via backend proxy, returns a promise
const playChunk = (text, lang) => {
  return new Promise((resolve) => {
    const url = `${TTS_PROXY}?text=${encodeURIComponent(text)}&lang=${lang}`;
    console.log(`[Voice] 🔊 Fetching TTS via proxy [${lang}]: "${text.substring(0, 50)}"`);

    const audio = new Audio(url);
    _currentAudio = audio;

    audio.oncanplaythrough = () => {
      audio.play().catch(() => resolve('play-error'));
    };
    audio.onended = () => {
      console.log('[Voice] ✅ Chunk done.');
      resolve('done');
    };
    audio.onerror = (e) => {
      console.warn('[Voice] Audio error on chunk:', e);
      resolve('error');
    };

    // Timeout safety — if audio doesn't start in 8s, skip
    setTimeout(() => resolve('timeout'), 8000);
  });
};

// Play all chunks sequentially
const playSequentially = async (chunks, lang) => {
  for (const chunk of chunks) {
    if (!_currentAudio && chunks.indexOf(chunk) > 0) break; // stopped
    await playChunk(chunk, lang);
  }
};

// ── Web Speech API for English ────────────────────────────────
const speakEnglish = async (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const voices = await new Promise((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) return resolve(v);
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices() || []), 2000);
  });

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.88;
  utterance.pitch = 1.0;

  const voice = voices.find(v => v.lang === 'en-IN')
    || voices.find(v => v.lang === 'en-US')
    || voices.find(v => v.lang.startsWith('en'))
    || null;

  if (voice) utterance.voice = voice;

  utterance.onstart = () => console.log('[Voice] 🔊 English speech started.');
  utterance.onend = () => console.log('[Voice] ✅ English done.');
  utterance.onerror = (e) => console.error('[Voice] Web Speech error:', e.error);

  setTimeout(() => window.speechSynthesis.speak(utterance), 80);
};

// ─────────────────────────────────────────────────────────────
//  Main exported speak() function
//
//  speak(localText, appLang, englishFallback)
//    localText       — text in selected language script
//    appLang         — 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'mr'
//    englishFallback — English text used if proxy fails
// ─────────────────────────────────────────────────────────────
export const speak = async (localText, appLang = 'en', englishFallback = null) => {
  const text = (localText || '').trim();
  if (!text) {
    console.warn('[Voice] Empty text, skipping.');
    return;
  }

  stopAll();
  console.log(`[Voice] speak() — lang: ${appLang}`);

  // English: use Web Speech API directly
  if (appLang === 'en') {
    return speakEnglish(englishFallback || text);
  }

  // Indian languages: use backend proxy → Google TTS
  const lang = GT_LANG[appLang] || 'hi';
  const chunks = chunkText(text);
  console.log(`[Voice] ${chunks.length} chunk(s) to speak in [${lang}].`);

  try {
    await playSequentially(chunks, lang);
    console.log('[Voice] ✅ All done.');
  } catch (err) {
    console.error('[Voice] Proxy playback failed, using English fallback:', err);
    if (englishFallback) speakEnglish(englishFallback);
  }
};

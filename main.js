import { locales } from './src/locales.js';
import { cropData } from './src/cropData.js';
import { speak } from './src/voice.js';
import { storeData } from './src/storeData.js';

// State Management
const state = {
  language: 'en',
  currentCrop: null,
  currentDisease: null,
  userLocation: 'Amaravathi, India', // Updated to Amaravathi, India
  history: JSON.parse(localStorage.getItem('farmer_history') || '[]'),
  screens: ['screen-welcome', 'screen-language', 'screen-crop', 'screen-upload', 'screen-result', 'screen-history']
};

// Global Elements
let elements = {};

// Initialization
const init = () => {
  populateElements();
  setupEventListeners();
  updateOfflineStatus();
  detectUserLocation(); // Trigger location detection

  // Initial screen setup
  navigateTo('screen-welcome');

  window.addEventListener('online', updateOfflineStatus);
  window.addEventListener('offline', updateOfflineStatus);
  console.log('Farmer Friendly App Initialized');
};

const populateElements = () => {
  elements = {
    appTitle: document.getElementById('app-title'),
    offlineIndicator: document.getElementById('offline-indicator'),
    // Welcome screen
    btnGetStarted: document.getElementById('btn-get-started'),
    welcomeTitle: document.getElementById('welcome-title'),
    welcomeTagline: document.getElementById('welcome-tagline'),
    f1Title: document.getElementById('f1-title'),
    f1Desc: document.getElementById('f1-desc'),
    f2Title: document.getElementById('f2-title'),
    f2Desc: document.getElementById('f2-desc'),
    f3Title: document.getElementById('f3-title'),
    f3Desc: document.getElementById('f3-desc'),
    welcomeBtnText: document.getElementById('welcome-btn-text'),
    // Language screen
    langHeading: document.getElementById('lang-heading'),
    langBtns: document.querySelectorAll('.btn-lang'),
    // Crop screen
    cropHeading: document.getElementById('crop-heading'),
    cropGrid: document.getElementById('crop-grid'),
    btnBackToLang: document.getElementById('btn-back-to-lang'),
    // Upload screen
    uploadHeading: document.getElementById('upload-heading'),
    uploadBox: document.getElementById('upload-box'),
    fileInput: document.getElementById('file-input'),
    previewContainer: document.getElementById('preview-container'),
    imagePreview: document.getElementById('image-preview'),
    scanLine: document.getElementById('scan-line'),
    btnAnalyze: document.getElementById('btn-analyze'),
    btnRetry: document.getElementById('btn-retry'),
    clarityWarning: document.getElementById('clarity-warning'),
    // Modal
    customAlert: document.getElementById('custom-alert'),
    alertTitle: document.getElementById('alert-title'),
    alertMessage: document.getElementById('alert-message'),
    btnCloseAlert: document.getElementById('btn-close-alert'),
    // New Components
    btnSunlight: document.getElementById('btn-sunlight'),
    cropSearch: document.getElementById('crop-search'),
    navItems: document.querySelectorAll('.nav-item'),
    weatherWidget: document.getElementById('weather-widget'),
    weatherIcon: document.getElementById('weather-icon'),
    weatherTemp: document.getElementById('weather-temp'),
    weatherDesc: document.getElementById('weather-desc'),
    weatherLocation: document.getElementById('weather-location'),
    // Result screen
    resultHeading: document.getElementById('result-heading'),
    resDiseaseName: document.getElementById('res-disease-name'),
    resConfidence: document.getElementById('res-confidence'),
    confidenceFill: document.getElementById('confidence-fill'),
    resCause: document.getElementById('res-cause'),
    resReason: document.getElementById('res-reason'),
    resPreventions: document.getElementById('res-prevention'),
    resMedicine: document.getElementById('res-medicine'),
    resQuantity: document.getElementById('res-quantity'),
    resPrice: document.getElementById('res-price'),
    resInstructions: document.getElementById('res-instructions'),
    resConsult: document.getElementById('res-consult'),
    // Labels
    lblExplanation: document.getElementById('lbl-explanation'),
    lblTreatment: document.getElementById('lbl-treatment'),
    lblDiseaseName: document.getElementById('lbl-disease-name'),
    lblConfidence: document.getElementById('lbl-confidence'),
    lblCause: document.getElementById('lbl-cause'),
    lblReason: document.getElementById('lbl-reason'),
    lblPrevention: document.getElementById('lbl-prevention'),
    lblMedicine: document.getElementById('lbl-medicine'),
    lblQuantity: document.getElementById('lbl-quantity'),
    lblPrice: document.getElementById('lbl-price'),
    lblSpeak: document.getElementById('lbl-speak'),
    lblFeedback: document.getElementById('lbl-feedback'),
    lblAccurate: document.getElementById('lbl-accurate'),
    lblNotAccurate: document.getElementById('lbl-not-accurate'),
    lblStores: document.getElementById('lbl-stores'),
    storesList: document.getElementById('stores-list'),
    // Actions
    btnBackToCrop: document.getElementById('btn-back-to-crop'),
    btnBackToUpload: document.getElementById('btn-back-to-upload'),
    btnSpeak: document.getElementById('btn-speak'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    feedbackBtns: document.querySelectorAll('.btn-feedback'),
    // NEW FOR HACKATHON
    scanOverlay: document.getElementById('scan-overlay'),
    scanPercentage: document.getElementById('scan-percentage'),
    scanStatus: document.getElementById('scan-status'),
    detectionBox: document.getElementById('detection-box'),
    historyList: document.getElementById('history-list'),
    statTotalScans: document.getElementById('stat-total-scans'),
    statHealthCircle: document.getElementById('stat-health-circle'),
    statHealthPct: document.getElementById('stat-health-pct'),
    statsBreakdown: document.getElementById('stats-breakdown'),
    btnScanAgain: document.getElementById('btn-scan-again'),
    lblScanAgain: document.getElementById('lbl-scan-again')
  };
};

const setupEventListeners = () => {
  // Welcome Screen
  if (elements.btnGetStarted) {
    elements.btnGetStarted.addEventListener('click', () => navigateTo('screen-language'));
  }

  // Language Selection
  elements.langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.language = btn.dataset.lang;
      applyLanguage();
      navigateTo('screen-crop');
    });
  });

  // Back buttons
  elements.btnBackToLang.addEventListener('click', () => navigateTo('screen-language'));
  elements.btnBackToCrop.addEventListener('click', () => navigateTo('screen-crop'));
  elements.btnBackToUpload.addEventListener('click', () => navigateTo('screen-upload'));

  // Upload Logic
  elements.uploadBox.addEventListener('click', (e) => {
    // If we click icons/text inside, trigger input. 
    // If we click input directly (unlikely if hidden, but safe), don't trigger again.
    if (e.target !== elements.fileInput) {
      elements.fileInput.click();
    }
  });
  elements.fileInput.addEventListener('change', handleFileUpload);
  elements.btnAnalyze.addEventListener('click', performAnalysis);
  elements.btnRetry.addEventListener('click', resetUpload);
  elements.btnScanAgain.addEventListener('click', () => {
    resetUpload();
    navigateTo('screen-crop');
  });

  // Tab Logic
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      elements.tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Voice Assistant
  elements.btnSpeak.addEventListener('click', () => {
    try {
      const result = generateSpeechText();
      if (!result) {
        console.warn('[Speak] No disease data available to speak.');
        return;
      }
      // Pass both localized and English text.
      // voice.js will use English text as fallback when no native voice exists.
      speak(result.localText, state.language, result.englishText);
    } catch (err) {
      console.error('[Speak] Error generating speech text:', err);
    }
  });

  // Feedback
  elements.feedbackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      localStorage.setItem(`feedback_${state.currentDisease.id}`, val);
      btn.style.backgroundColor = val === '1' ? '#c8e6c9' : '#ffcdd2';
    });
  });

  // Modal
  elements.btnCloseAlert.addEventListener('click', () => {
    elements.customAlert.classList.add('hidden');
  });

  // Sunlight Mode
  elements.btnSunlight.addEventListener('click', toggleSunlightMode);

  // Search Filter
  elements.cropSearch.addEventListener('input', (e) => {
    populateCrops(e.target.value);
  });

  // Bottom Nav
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const screenId = item.dataset.screen;
      if (screenId === 'screen-stats') return; // Shield against any remaining triggers
      if (screenId === 'screen-result' && !state.currentDisease) {
        navigateTo('screen-upload');
        return;
      }
      navigateTo(screenId);
    });
  });

  // Judge Mode Secret Link (click logo 3 times)
  let logoClicks = 0;
  document.querySelector('.logo').addEventListener('click', () => {
    logoClicks++;
    if (logoClicks === 3) {
      fillDemoData();
      logoClicks = 0;
      showAlert("Judge Mode Activated: Demo data loaded!");
    }
  });
};

const toggleSunlightMode = () => {
  document.body.classList.toggle('sunlight-mode');
  const isSunlight = document.body.classList.contains('sunlight-mode');
  elements.btnSunlight.textContent = isSunlight ? '🌙' : '☀️';
  localStorage.setItem('sunlightMode', isSunlight);
};

// Utilities
const showAlert = (message) => {
  elements.alertTitle.textContent = locales[state.language].notice || 'Notice';
  elements.alertMessage.textContent = message;
  elements.customAlert.classList.remove('hidden');
};

const updateWeather = () => {
  const t = locales[state.language];
  // Simulated Weather Data for Amaravathi
  const weatherData = {
    temp: 32,
    desc: t.weatherClear || 'Clear Sky',
    icon: '☀️',
    location: state.userLocation
  };

  elements.weatherTemp.textContent = `${weatherData.temp}°C`;
  elements.weatherDesc.textContent = weatherData.desc;
  elements.weatherIcon.textContent = weatherData.icon;
  elements.weatherLocation.textContent = weatherData.location;
};

const detectUserLocation = () => {
  if (!navigator.geolocation) {
    console.log("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      // Reverse Geocoding via Nominatim (Free OSM Service)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'FarmerFriendlyPWA'
        }
      });
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Amaravathi';
      const country = data.address.country || 'India';

      state.userLocation = `${city}, ${country}`;
      updateWeather();
      console.log(`Location detected: ${state.userLocation}`);
    } catch (error) {
      console.error("Location lookup failed", error);
      // Keep Amaravathi, India as fallback
      state.userLocation = 'Amaravathi, India';
      updateWeather();
    }
  }, (error) => {
    console.log("Location permission denied, using fallback", error);
    // Keep Amaravathi, India as fallback
    state.userLocation = 'Amaravathi, India';
  });
};

// Navigation
const navigateTo = (screenId) => {
  console.log('Navigating to:', screenId);
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none'; // Explicitly hide
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'flex'; // Explicitly show
    window.scrollTo(0, 0);

    // Update Nav Bar UI
    elements.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenId);
    });

    if (screenId === 'screen-crop') populateCrops();
    if (screenId === 'screen-language') updateWeather();
    if (screenId === 'screen-history') renderHistory();
  } else {
    console.error('Screen not found:', screenId);
  }
};

// Language Application
const applyLanguage = () => {
  const t = locales[state.language];
  if (!t) return;

  if (elements.appTitle) elements.appTitle.textContent = t.title;
  if (elements.langHeading) elements.langHeading.textContent = t.selectLanguage;
  if (elements.cropHeading) elements.cropHeading.textContent = t.selectCrop;
  if (elements.uploadHeading) elements.uploadHeading.textContent = t.uploadImage;

  // Welcome Screen
  if (elements.welcomeTitle) elements.welcomeTitle.textContent = t.welcomeTitle;
  if (elements.welcomeTagline) elements.welcomeTagline.textContent = t.welcomeTagline;
  if (elements.f1Title) elements.f1Title.textContent = t.f1Title;
  if (elements.f1Desc) elements.f1Desc.textContent = t.f1Desc;
  if (elements.f2Title) elements.f2Title.textContent = t.f2Title;
  if (elements.f2Desc) elements.f2Desc.textContent = t.f2Desc;
  if (elements.f3Title) elements.f3Title.textContent = t.f3Title;
  if (elements.f3Desc) elements.f3Desc.textContent = t.f3Desc;
  if (elements.welcomeBtnText) elements.welcomeBtnText.textContent = t.welcomeBtn;

  const uploadText = document.getElementById('upload-text');
  if (uploadText) uploadText.textContent = t.uploadBtn;

  if (elements.btnAnalyze) elements.btnAnalyze.textContent = t.analyzing.split('...')[0];
  if (elements.btnRetry) elements.btnRetry.textContent = t.retryBtn;
  if (elements.resultHeading) elements.resultHeading.textContent = t.resultTitle;

  if (elements.lblExplanation && t.explanation) elements.lblExplanation.textContent = t.explanation;
  if (elements.lblTreatment && t.treatment) elements.lblTreatment.textContent = t.treatment;

  if (elements.lblDiseaseName) elements.lblDiseaseName.textContent = t.diseaseName;
  if (elements.lblConfidence) elements.lblConfidence.textContent = t.confidence;
  if (elements.lblCause) elements.lblCause.textContent = t.cause;
  if (elements.lblReason) elements.lblReason.textContent = t.reason;
  if (elements.lblPrevention) elements.lblPrevention.textContent = t.prevention;
  if (elements.lblMedicine) elements.lblMedicine.textContent = t.medicine;
  if (elements.lblQuantity) elements.lblQuantity.textContent = t.quantity;
  if (elements.lblPrice) elements.lblPrice.textContent = t.price;
  if (elements.lblSpeak) elements.lblSpeak.textContent = t.speakBtn;
  if (elements.lblFeedback) elements.lblFeedback.textContent = t.feedback;
  if (elements.lblAccurate) elements.lblAccurate.textContent = t.accurate;
  if (elements.lblNotAccurate) elements.lblNotAccurate.textContent = t.notAccurate;
  if (elements.lblStores) elements.lblStores.textContent = t.stores;

  // New elements
  if (elements.cropSearch) elements.cropSearch.placeholder = t.searchCrops || "Search...";
  if (elements.btnSunlight) elements.btnSunlight.title = t.sunlightMode || "Sunlight Mode";

  // Localize Nav Bar Labels
  const navMap = {
    'screen-language': t.selectLanguage ? t.selectLanguage.split(' ')[0] : 'Lang',
    'screen-crop': t.selectCrop ? t.selectCrop.split(' ')[0] : 'Crops',
    'screen-upload': t.uploadBtn ? t.uploadBtn.split(' ')[0] : 'Scan',
    'screen-history': t.historyTitle || 'History',
    'screen-stats': t.statsTitle || 'Stats'
  };

  elements.navItems.forEach(item => {
    const label = item.querySelector('.nav-label');
    if (label) label.textContent = navMap[item.dataset.screen] || 'Menu';
  });

  if (document.getElementById('history-heading')) document.getElementById('history-heading').textContent = t.historyTitle;
  if (document.getElementById('stats-heading')) document.getElementById('stats-heading').textContent = t.statsTitle;
  if (document.getElementById('lbl-no-history')) document.getElementById('lbl-no-history').textContent = t.noHistory;
  if (document.getElementById('lbl-total-scans')) document.getElementById('lbl-total-scans').textContent = t.totalScans;
  if (document.getElementById('lbl-healthy-ratio')) document.getElementById('lbl-healthy-ratio').textContent = t.healthyRatio;
  if (document.getElementById('lbl-detected')) document.getElementById('lbl-detected').textContent = t.detected;
  if (elements.lblScanAgain) elements.lblScanAgain.textContent = (t.scanAgain || "Scan Again") + (state.language === 'en' ? "" : " / फिर से स्कैन करें");

  if (state.language === 'en' || state.language === 'hi') {
    updateWeather();
  }
};

// Crop Population with High-Quality Images
const populateCrops = (filter = '') => {
  if (!elements.cropGrid) return;
  elements.cropGrid.innerHTML = '';

  const filteredCrops = Object.entries(cropData).filter(([key, crop]) => {
    const name = (crop.name[state.language] || crop.name.en || '').toLowerCase();
    return name.includes(filter.toLowerCase());
  });

  filteredCrops.forEach(([key, crop], index) => {
    const card = document.createElement('div');
    card.className = 'crop-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const cropName = crop.name[state.language] || crop.name.en || key;

    // Use the crop image from the data or provide high-quality fallback
    const cropImage = crop.image || getCropImageFallback(key);

    card.innerHTML = `
      <img src="${cropImage}" alt="${cropName}" loading="lazy">
      <p>${cropName}</p>
    `;
    card.onclick = () => {
      resetUpload(); // Ensure fresh state for every crop
      state.currentCrop = key;
      navigateTo('screen-upload');
    };
    elements.cropGrid.appendChild(card);
  });
};

// Fallback crop images - High quality URLs from Unsplash & Pixabay
const getCropImageFallback = (cropKey) => {
  const cropImages = {
    'rice': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop&q=80',
    'wheat': 'https://images.unsplash.com/photo-1570116668008-2c1b0f5a2ff0?w=400&h=400&fit=crop&q=80',
    'maize': 'https://images.unsplash.com/photo-1587584622180-fa0f1bfc8eb0?w=400&h=400&fit=crop&q=80',
    'cotton': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=400&h=400&fit=crop&q=80',
    'sugarcane': 'https://images.unsplash.com/photo-1574080169539-c7cd6bb96ba6?w=400&h=400&fit=crop&q=80',
    'soybean': 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=400&fit=crop&q=80',
    'groundnut': 'https://images.unsplash.com/photo-1599599810694-b5ac4dd0a1d4?w=400&h=400&fit=crop&q=80',
    'tomato': 'https://images.unsplash.com/photo-1571407613345-6cdb23af2d64?w=400&h=400&fit=crop&q=80',
    'potato': 'https://images.unsplash.com/photo-1535694194813-6eafed4b73cc?w=400&h=400&fit=crop&q=80',
    'onion': 'https://images.unsplash.com/photo-1587049633312-d628888b989d?w=400&h=400&fit=crop&q=80',
    'chilli': 'https://images.unsplash.com/photo-1599599810923-58d8bdd2f430?w=400&h=400&fit=crop&q=80',
    'cucumber': 'https://images.unsplash.com/photo-1464567868556-6b996f1b1ef2?w=400&h=400&fit=crop&q=80',
    'cabbage': 'https://images.unsplash.com/photo-1596618666968-4da33374e495?w=400&h=400&fit=crop&q=80',
    'carrot': 'https://images.unsplash.com/photo-1585959375944-f5ebb1bfbcea?w=400&h=400&fit=crop&q=80',
    'spinach': 'https://images.unsplash.com/photo-1511621776919-a63c9b2a9c12?w=400&h=400&fit=crop&q=80',
    'broccoli': 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=400&h=400&fit=crop&q=80',
    'pumpkin': 'https://images.unsplash.com/photo-1599599810694-b5ac4dd0a1d4?w=400&h=400&fit=crop&q=80',
    'banana': 'https://images.unsplash.com/photo-1528527993412-8e8c9995d338?w=400&h=400&fit=crop&q=80',
    'apple': 'https://images.unsplash.com/photo-1560806674-9d1b0f4d2d5f?w=400&h=400&fit=crop&q=80',
    'mango': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&q=80',
    'grapes': 'https://images.unsplash.com/photo-1585314317383-c7db66d54efb?w=400&h=400&fit=crop&q=80'
  };

  return cropImages[cropKey.toLowerCase()] || 'https://images.unsplash.com/photo-1574080169539-c7cd6bb96ba6?w=400&h=400&fit=crop&q=80';
};

// File Upload
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    elements.imagePreview.src = event.target.result;
    elements.previewContainer.classList.remove('hidden');
    elements.uploadBox.classList.add('hidden');

    // Check clarity simulation
    const isBlurry = Math.random() < 0.2; // 20% chance of "blur" for demo
    if (isBlurry) {
      elements.clarityWarning.textContent = locales[state.language].reupload;
      elements.clarityWarning.classList.remove('hidden');
      elements.btnAnalyze.classList.add('hidden');
      elements.btnRetry.classList.remove('hidden');
    } else {
      elements.clarityWarning.classList.add('hidden');
      elements.btnAnalyze.classList.remove('hidden');
      elements.btnRetry.classList.add('hidden');
    }
  };
  reader.readAsDataURL(file);
};

const resetUpload = () => {
  elements.fileInput.value = '';
  elements.previewContainer.classList.add('hidden');
  elements.uploadBox.classList.remove('hidden');
  elements.clarityWarning.classList.add('hidden');
  elements.scanLine.classList.add('hidden');
  elements.scanOverlay.classList.add('hidden');
  elements.imagePreview.src = ''; // Clean up previous photo
  state.currentDisease = null; // Clean up logic state
};

// Analysis Simulation: Cinematic Version
const performAnalysis = () => {
  const crop = cropData[state.currentCrop];
  if (!crop) return showAlert(locales[state.language].comingSoon);

  const t = locales[state.language];

  // Shutter Flash Effect
  const flash = document.createElement('div');
  flash.className = 'shutter-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);

  // UI Setup
  elements.btnAnalyze.disabled = true;
  elements.scanLine.classList.remove('hidden');
  elements.scanOverlay.classList.remove('hidden');
  elements.detectionBox.classList.add('hidden');

  let progress = 0;
  const labels = ["CALIBRATING...", "PIXEL ANALYSIS...", "AI MATCHING...", "CHECKING 200+ DISEASES...", "VERIFYING..."];

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress > 100) progress = 100;

    elements.scanPercentage.textContent = `${progress}%`;
    elements.scanStatus.textContent = labels[Math.floor(progress / 25)] || labels[labels.length - 1];

    if (progress === 100) {
      clearInterval(interval);

      // Final Cinematic Step: Show Bounding Box
      setTimeout(() => {
        elements.scanStatus.textContent = t.detected || "DETECTED";
        elements.detectionBox.classList.remove('hidden');
        speak(t.detected || "Detected", state.language);

        setTimeout(() => {
          completeAnalysis(crop);
        }, 1200);
      }, 500);
    }
  }, 200);
};

const completeAnalysis = (crop) => {
  // Deterministic result based on image content (Simulating AI matching)
  const diseases = crop.diseases;
  if (!diseases || !diseases.length) return showAlert(locales[state.language].comingSoon);

  // Create a simple hash of the image data string to make result deterministic
  const hash = elements.imagePreview.src.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const index = Math.abs(hash) % diseases.length;
  const disease = diseases[index];
  state.currentDisease = disease;

  // Render Result
  elements.resDiseaseName.textContent = disease.name[state.language];
  elements.resConfidence.textContent = Math.round(disease.confidence * 100) + '%';
  elements.confidenceFill.style.width = '0%';
  elements.resCause.textContent = disease.cause ? disease.cause[state.language] : '-';
  elements.resReason.textContent = disease.reason ? disease.reason[state.language] : '-';

  elements.resPreventions.innerHTML = '';
  if (disease.prevention) {
    disease.prevention.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p[state.language];
      elements.resPreventions.appendChild(li);
    });
  }

  if (disease.treatment) {
    elements.resMedicine.textContent = disease.treatment.medicine ? (disease.treatment.medicine[state.language] || disease.treatment.medicine.en) : '-';
    elements.resQuantity.textContent = disease.treatment.quantity ? (disease.treatment.quantity[state.language] || disease.treatment.quantity.en) : '-';
    elements.resPrice.textContent = disease.treatment.price || '-';
    elements.resInstructions.textContent = disease.treatment.instructions ? (disease.treatment.instructions[state.language] || disease.treatment.instructions.en) : '-';
  }

  saveToHistory(state.currentCrop, disease);
  populateStores(); // Call stores immediately

  navigateTo('screen-result');

  // Cleanup UI
  elements.btnAnalyze.disabled = false;
  elements.scanLine.classList.add('hidden');
  elements.scanOverlay.classList.add('hidden');

  setTimeout(() => {
    elements.confidenceFill.style.width = (disease.confidence * 100) + '%';
  }, 100);
};

// History & Stats Logic
const saveToHistory = (cropId, disease) => {
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    cropId: cropId,
    cropName: cropData[cropId].name[state.language],
    diseaseId: disease.id,
    diseaseName: disease.name[state.language],
    image: elements.imagePreview.src,
    healthy: false // In this demo, all detections are diseased for impact
  };
  state.history.unshift(entry);
  localStorage.setItem('farmer_history', JSON.stringify(state.history));
};

const renderHistory = () => {
  const t = locales[state.language];
  elements.historyList.innerHTML = '';

  if (state.history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📂</span>
        <p>${t.noHistory}</p>
      </div>`;
    return;
  }

  state.history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item anim-fade-in';
    div.innerHTML = `
      <img src="${item.image}" class="history-img">
      <div class="history-info">
        <div class="history-crop">${item.cropName}</div>
        <div class="history-disease">${item.diseaseName}</div>
        <div class="history-date">${item.date}</div>
      </div>
      <div class="history-arrow">→</div>
    `;
    div.onclick = () => {
      // Restore state to view result
      state.currentCrop = item.cropId;
      // We'd need a bit more logic to restore full result screen, 
      // but for demo, navigating back to result is fine if state is set.
      navigateTo('screen-upload');
    };
    elements.historyList.appendChild(div);
  });
};

const renderStats = () => {
  const total = state.history.length;
  elements.statTotalScans.textContent = total;

  // Mock logic: 70% diseased, 30% healthy (demo purposes)
  const healthRatio = total > 0 ? 30 : 0;
  elements.statHealthPct.textContent = `${healthRatio}%`;
  elements.statHealthCircle.style.strokeDasharray = `${healthRatio}, 100`;

  elements.statsBreakdown.innerHTML = '';
  // Count counts per crop
  const counts = {};
  state.history.forEach(h => counts[h.cropName] = (counts[h.cropName] || 0) + 1);

  Object.entries(counts).forEach(([name, count]) => {
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <div class="breakdown-crop">${name}</div>
      <div class="breakdown-count"><strong>${count}</strong> scans</div>
    `;
    elements.statsBreakdown.appendChild(row);
  });
};

const fillDemoData = () => {
  const crops = Object.keys(cropData);
  const demoItems = [
    { crop: crops[0], disease: cropData[crops[0]].diseases[0] },
    { crop: crops[2], disease: cropData[crops[2]].diseases[1] },
    { crop: crops[4], disease: cropData[crops[4]].diseases[0] }
  ];

  demoItems.forEach(item => {
    state.history.push({
      id: Date.now() - Math.random() * 1000000,
      date: '2026-04-03',
      cropId: item.crop,
      cropName: cropData[item.crop].name.en,
      diseaseId: item.disease.id,
      diseaseName: item.disease.name.en,
      image: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?w=100",
      healthy: false
    });
  });
  localStorage.setItem('farmer_history', JSON.stringify(state.history));
  if (state.screens.includes('screen-stats')) renderStats();
};

// Returns { localText, englishText } — both are needed so voice.js can
// use the English version when no native voice exists for the language.
const generateSpeechText = () => {
  const d = state.currentDisease;
  if (!d) return null;

  const lang = state.language;
  const tLocal = locales[lang] || locales['en'];
  const tEn = locales['en'];

  // Safe getter: tries selected lang first, then English
  const getLocal = (obj) => (obj && (obj[lang] || obj['en'])) || '';
  const getEn    = (obj) => (obj && obj['en']) || '';

  // ---- Localized text (in selected language script) ----
  const localText = [
    `${tLocal.diseaseName || 'Disease'}: ${getLocal(d.name)}.`,
    getLocal(d.cause)    ? `${tLocal.cause || 'Cause'}: ${getLocal(d.cause)}.` : '',
    d.treatment && getLocal(d.treatment.medicine) ? `${tLocal.medicine || 'Medicine'}: ${getLocal(d.treatment.medicine)}.` : '',
    d.treatment && getLocal(d.treatment.quantity) ? `${tLocal.quantity || 'Quantity'}: ${getLocal(d.treatment.quantity)}.` : '',
    d.treatment && getLocal(d.treatment.instructions) ? `${getLocal(d.treatment.instructions)}.` : ''
  ].filter(Boolean).join(' ');

  // ---- English fallback (always readable by English TTS voice) ----
  const englishText = [
    `Disease: ${getEn(d.name)}.`,
    getEn(d.cause)    ? `Cause: ${getEn(d.cause)}.` : '',
    d.treatment && getEn(d.treatment.medicine) ? `Medicine: ${getEn(d.treatment.medicine)}.` : '',
    d.treatment && getEn(d.treatment.quantity) ? `Quantity: ${getEn(d.treatment.quantity)}.` : '',
    d.treatment && getEn(d.treatment.instructions) ? `${getEn(d.treatment.instructions)}.` : ''
  ].filter(Boolean).join(' ');

  return { localText, englishText };
};

const populateStores = () => {
  const t = locales[state.language];
  const locationLabel = state.userLocation.split(',')[0] || 'Amaravathi';
  elements.storesList.innerHTML = `<p class="location-notif">🔍 Finding stores near ${locationLabel}...</p>`;

  // Mock artificial delay for location "finding"
  setTimeout(() => {
    elements.storesList.innerHTML = '';
    storeData.forEach(store => {
      const card = document.createElement('div');
      card.className = `store-card ${store.availability ? 'available' : 'unavailable'}`;
      card.innerHTML = `
        <div class="store-main">
          <h4>${store.name}</h4>
          <span class="dist">${store.distance}</span>
        </div>
        <p class="addr">${store.address.replace('Nagpur East', locationLabel)}</p>
        <div class="store-details">
          <p class="timing">⏰ <strong>${store.timings || '9 AM - 7 PM'}</strong></p>
          <p class="med-status">${store.availability ? '✅ Medicine Available' : '❌ Out of Stock'}</p>
        </div>
        <div class="store-footer">
          <a href="tel:${store.phone}" class="btn-call">📞 Call Now</a>
          <a href="https://maps.google.com/?q=${encodeURIComponent(store.address)}" target="_blank" class="btn-map">📍 Map</a>
        </div>
      `;
      elements.storesList.appendChild(card);
    });
  }, 1500);
};

const updateOfflineStatus = () => {
  if (navigator.onLine) {
    elements.offlineIndicator.classList.add('hidden');
  } else {
    elements.offlineIndicator.classList.remove('hidden');
    elements.offlineIndicator.textContent = locales[state.language].offlineMode;
  }
};

init();
/**
 * GEM Panel Color Scheme & Settings Handler
 * Professional yet creative - for entrepreneurs and academics
 */

(function() {
  'use strict';

  // Default settings
  const DEFAULTS = {
    lang: 'RO',
    theme: 'dark',
    colors: 'colorful'
  };

  // Color palettes
  // Primary color varies by theme: lime (#7EC844) in dark, teal (#3D8B70) in light
  const PALETTES = {
    colorful: {
      colors: ['#FF70BB', '#ebbc5a', '#afa2dc', '#99D9EA', '#ffa349', '#7EC844'],
      primaryDark: '#7EC844', // Lime green for dark mode
      primaryLight: '#3D8B70', // Teal for light mode
      secondary: '#7EC844',
      names: ['Pink', 'Gold', 'Purple', 'Cyan', 'Orange', 'Lime']
    },
    green: {
      colors: ['#7EC844', '#5FA832', '#4A9F31', '#9AD864', '#BBF7D0', '#2D6B55'],
      primaryDark: '#7EC844', // Lime green for dark mode
      primaryLight: '#3D8B70', // Teal for light mode
      secondary: '#7EC844',
      names: ['Lime', 'Medium', 'Forest', 'Light', 'Pale', 'Deep']
    }
  };

  // Parse URL parameters (both hash and query style)
  function parseParams() {
    const params = { ...DEFAULTS };

    // Parse hash: #RO&dark&colorful
    const hash = window.location.hash.slice(1);
    if (hash) {
      const parts = hash.split('&').map(p => p.trim());
      parts.forEach((part, i) => {
        const lower = part.toLowerCase();
        if (['ro', 'en', 'hu'].includes(lower)) {
          params.lang = part.toUpperCase();
        } else if (['dark', 'light'].includes(lower)) {
          params.theme = lower;
        } else if (['colorful', 'green'].includes(lower)) {
          params.colors = lower;
        }
      });
    }

    // Parse query params: ?lang=RO&theme=dark&colors=colorful
    const urlParams = new URLSearchParams(window.location.search);
    ['lang', 'theme', 'colors'].forEach(key => {
      if (urlParams.has(key)) {
        const val = urlParams.get(key);
        if (key === 'lang') params.lang = val.toUpperCase();
        else params[key] = val.toLowerCase();
      }
    });

    return params;
  }

  // Apply settings to document
  function applySettings(params) {
    const html = document.documentElement;
    const body = document.body;

    // Theme
    html.setAttribute('data-theme', params.theme);
    body.classList.toggle('dark', params.theme === 'dark');
    body.classList.toggle('light', params.theme === 'light');

    // Color scheme
    html.setAttribute('data-colors', params.colors);
    body.classList.toggle('green-scheme', params.colors === 'green');
    body.classList.toggle('colorful-scheme', params.colors === 'colorful');

    // Language attribute
    html.setAttribute('lang', params.lang.toLowerCase());

    // Store globally
    window.GEM = {
      settings: params,
      palette: PALETTES[params.colors] || PALETTES.colorful
    };

    // Dispatch event for charts to update
    window.dispatchEvent(new CustomEvent('gem-settings-change', { detail: params }));

    return params;
  }

  // Public API
  window.getGemSettings = function() {
    return window.GEM?.settings || parseParams();
  };

  window.getGemPalette = function() {
    return window.GEM?.palette || PALETTES.colorful;
  };

  window.getGemColors = function() {
    return window.getGemPalette().colors;
  };

  window.getGemColor = function(index) {
    const colors = window.getGemColors();
    return colors[index % colors.length];
  };

  window.getPrimaryColor = function() {
    const palette = window.getGemPalette();
    const theme = window.GEM?.settings?.theme || 'dark';
    return theme === 'dark' ? palette.primaryDark : palette.primaryLight;
  };

  window.getTealColor = function() {
    return window.getGemPalette().primaryLight; // Always teal (#3D8B70)
  };
  
  window.getLimeColor = function() {
    return window.getGemPalette().primaryDark; // Always lime (#7EC844)
  };
  
  window.getSecondaryColor = function() {
    return window.getGemPalette().secondary;
  };

  // Translations helper
  const TRANSLATIONS = {
    RO: {
      tea: 'Activitate Antreprenorială Timpurie',
      ebo: 'Afaceri Consolidate',
      intent: 'Intenție Antreprenorială',
      neci: 'Condiții Naționale',
      infrastructure: 'Infrastructură',
      attitudes: 'Atitudini',
      ranking: 'Clasament',
      romania: 'România'
    },
    EN: {
      tea: 'Total Early-Stage Activity',
      ebo: 'Established Business Owners',
      intent: 'Entrepreneurial Intent',
      neci: 'National Conditions Index',
      infrastructure: 'Infrastructure',
      attitudes: 'Attitudes',
      ranking: 'Ranking',
      romania: 'Romania'
    },
    HU: {
      tea: 'Korai Vállalkozói Aktivitás',
      ebo: 'Megalapozott Vállalkozások',
      intent: 'Vállalkozói Szándék',
      neci: 'Nemzeti Feltételek',
      infrastructure: 'Infrastruktúra',
      attitudes: 'Attitűdök',
      ranking: 'Rangsor',
      romania: 'Románia'
    }
  };

  window.t = function(key) {
    const lang = window.GEM?.settings?.lang || 'RO';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.EN[key] || key;
  };

  // Initialize
  const settings = parseParams();
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applySettings(settings));
  } else {
    applySettings(settings);
  }

  // Listen for URL changes
  window.addEventListener('hashchange', () => {
    applySettings(parseParams());
  });

  // Listen for messages from parent (for dynamic updates)
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'gem-settings') {
      applySettings(event.data.settings);
    }
  });

})();

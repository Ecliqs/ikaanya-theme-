function closeFilterDrawerWithSlide(triggerEl) {
  const mobileFiltersComponent = document.querySelector('collection-mobile-filters');
  if (mobileFiltersComponent && typeof mobileFiltersComponent.close === 'function') {
    mobileFiltersComponent.close('icon');
    document
      .querySelectorAll('.collection-mobile-filters .filter-wrapper, #CollectionSidebarFilterWrap .filter-wrapper')
      .forEach((wrapper) => wrapper.classList.remove('is-active'));
    return;
  }

  const filterBtn = document.querySelector('.collection-filter__item--drawer .collection-filter__btn')
    || document.querySelector('.collection-filter__btn');

  // Use the same native toggle path as open, so close animation matches open animation.
  if (filterBtn) {
    filterBtn.click();
    return;
  }

  // Fallback if the toggle button is not available in DOM yet.
  document.dispatchEvent(new Event('filter:selected'));
}

function normalizeHexColor(value) {
  if (!value) return '';
  const text = String(value).trim().toUpperCase();
  const shortHex = text.match(/^#([0-9A-F]{3})$/i);
  if (shortHex) {
    const chars = shortHex[1].split('');
    return `#${chars[0]}${chars[0]}${chars[1]}${chars[1]}${chars[2]}${chars[2]}`;
  }
  const fullHex = text.match(/^#([0-9A-F]{6})$/i);
  return fullHex ? `#${fullHex[1]}` : '';
}

function hexToReadableName(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return '';

  const exactMap = {
    '#4022D3': 'Purple',
    '#183FCD': 'Blue',
    '#FF0000': 'Red',
    '#FFFFFF': 'White',
    '#000000': 'Black'
  };
  if (exactMap[normalized]) return exactMap[normalized];

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2 / 255;

  if (lightness >= 0.95) return 'White';
  if (lightness <= 0.1) return 'Black';
  if (delta <= 12) return 'Grey';

  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 70) return 'Yellow';
  if (hue < 165) return 'Green';
  if (hue < 195) return 'Turquoise';
  if (hue < 250) return 'Blue';
  if (hue < 290) return 'Purple';
  if (hue < 345) return 'Pink';

  return 'Colour';
}

function applyComboColorNameLabel() {
  const colorLabel = document.querySelector('.combo_products [data-variant-color-label]');
  if (!colorLabel) return;

  const rawText = (colorLabel.textContent || '').trim();
  const readable = hexToReadableName(rawText);
  if (readable) {
    colorLabel.textContent = readable;
  }
}

function initCustomFilterButton() {
  const filterButton = document.getElementById('custom-filter-menu-button');
  if (!filterButton) return console.log('Button not found yet...');

  filterButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeFilterDrawerWithSlide(this);
  });

  console.log('Custom filter button initialized.');
}

// Try repeatedly in case the button is injected dynamically
let checkExist = setInterval(() => {
  if (document.getElementById('custom-filter-menu-button')) {
    initCustomFilterButton();
    clearInterval(checkExist);
  }
}, 300); // check every 300ms

// Prevent product-link navigation when clicking quick-view button inside product card links.
document.addEventListener('click', function (e) {
  const quickViewButton = e.target.closest('.grid-product__actions [class*="js-modal-open-quick-modal-"]');
  if (!quickViewButton) return;

  e.preventDefault();
});

// Fallback for dynamically cloned filter drawer close button
document.addEventListener('click', function (e) {
  const closeBtn = e.target.closest('#custom-filter-menu-button');
  if (!closeBtn) return;

  e.preventDefault();
  closeFilterDrawerWithSlide(closeBtn);
});

applyComboColorNameLabel();
document.addEventListener('variant:change', applyComboColorNameLabel);




// document.querySelectorAll('.custom_size-chart').forEach(el => {
//   if (el.innerHTML.includes('Select Your Colour:')) {
//     el.innerHTML = el.innerHTML.replace('Select Your Colour:', '');
//   }
// });

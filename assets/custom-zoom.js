/* custom-zoom.js — removed (now unused). Left in assets for backup. */

  This file intentionally avoids import-maps or modules so it works if vendor files are loaded as globals.
*/
(function () {
  'use strict';

  function log() { if (window.console) console.info('[custom-zoom]', ...arguments); }
  function error() { if (window.console) console.error('[custom-zoom]', ...arguments); }

  function buildItemsFromContainer(container) {
    var items = [];
    var nodeList = container.querySelectorAll('[data-photoswipe-src]');
    nodeList.forEach(function (node) {
      // the theme sometimes renders the image wrapper; find the actual <img> if present
      var el = node;
      if (node.tagName.toLowerCase() !== 'img') {
        var imgChild = node.querySelector('img');
        if (imgChild) el = imgChild;
      }

      var src = el.getAttribute('data-photoswipe-src') || el.getAttribute('data-large-src') || el.src || '';
      var w = parseInt(el.getAttribute('data-photoswipe-width')) || el.naturalWidth || 1200;
      var h = parseInt(el.getAttribute('data-photoswipe-height')) || el.naturalHeight || 800;

      items.push({ src: src, w: w, h: h, el: el });
    });
    return items;
  }

  function getThumbBoundsFn(el) {
    var rect = el.getBoundingClientRect();
    return {
      x: rect.left + (window.pageXOffset || document.documentElement.scrollLeft),
      y: rect.top + (window.pageYOffset || document.documentElement.scrollTop),
      w: rect.width
    };
  }

  function openPhotoSwipe(index, items) {
    if (typeof PhotoSwipe === 'undefined' || typeof PhotoSwipeUI_Default === 'undefined') {
      error('PhotoSwipe or PhotoSwipeUI_Default not found on window. Make sure vendor assets are loaded.');
      return;
    }

    var pswpElement = document.querySelector('.pswp');
    if (!pswpElement) {
      error('PhotoSwipe template element (.pswp) not found in DOM.');
      return;
    }

    var options = {
      index: index,
      getThumbBoundsFn: function (idx) {
        return getThumbBoundsFn(items[idx].el);
      }
    };

    try {
      var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
      gallery.init();
    } catch (err) {
      error('Error initializing PhotoSwipe', err);
    }
  }

  function addZoomButtons(container, items) {
    // find thumbnails / images to attach button to
    items.forEach(function (item, idx) {
      var imgEl = item.el;
      // Place the button inside the closest .image-wrap if present
      var wrapper = imgEl.closest('.image-wrap') || imgEl.parentElement || imgEl;

      // Skip if there's already a custom-zoom-button
      if (wrapper.querySelector('.custom-zoom-button')) return;

      var btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.className = 'custom-zoom-button';
      btn.setAttribute('aria-label', 'Open image gallery (zoom)');
      btn.dataset.index = idx;

      // Simple magnifier SVG icon
      btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
        + '<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openPhotoSwipe(parseInt(btn.dataset.index, 10) || 0, items);
      });

      // Make sure wrapper is positioned to hold absolute button
      if (window.getComputedStyle(wrapper).position === 'static') {
        wrapper.style.position = 'relative';
      }

      wrapper.appendChild(btn);
    });
  }

  function initForContainer(container) {
    try {
      var items = buildItemsFromContainer(container);
      if (!items.length) {
        log('No images with data-photoswipe-src found in container, nothing to do.');
        return;
      }
      addZoomButtons(container, items);
    } catch (err) {
      error('Error during custom zoom initialization', err);
    }
  }

  function init() {
    log('Initializing custom-zoom');

    // Wait for a short time to allow other scripts to render images
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      var containers = document.querySelectorAll('[data-product-images]');
      containers.forEach(initForContainer);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        var containers = document.querySelectorAll('[data-product-images]');
        containers.forEach(initForContainer);
      });
    }
  }

  // Expose a manual init for debugging
  window.__customZoom = { init: init };

  // Auto init
  init();
})();

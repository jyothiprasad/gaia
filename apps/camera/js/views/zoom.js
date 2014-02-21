define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var bind = require('lib/bind');
var find = require('lib/find');
var constants = require('config/camera');
var orientation = require('lib/orientation');

/**
 * Locals
 */

var MIN_ZOOM_SCALE = constants.MIN_VIEWFINDER_SCALE;
var MAX_ZOOM_SCALE = constants.MAX_VIEWFINDER_SCALE;

/**
 * Exports
 */

module.exports = View.extend({
  name: 'zoomslider',
  hideTimer: null,

  initialize: function() {
    this.el.innerHTML = this.render();

    // Get elements
    this.els.zoom = find('.js-zoom-wrapper', this.el);
    this.els.slider = find('.js-zoom-slider', this.el);
    this.els.ratio = find('.js-zoom-ratio', this.el);

    // Set up event handlers
    orientation.on('orientation', this.setOrientation);

    // init
    this.els.slider.min = MIN_ZOOM_SCALE;
    this.els.slider.max = MAX_ZOOM_SCALE;

    this.els.slider.value = MIN_ZOOM_SCALE;
    this.els.ratio.textContent = this.els.slider.value;

    this.hideZoomSlider();
    this.setOrientation(orientation.get());
  },

  setOrientation: function(orientation) {    
    this.els.zoom.dataset.orientation = orientation;  
    this.els.ratio.dataset.orientation = orientation;
  },

  onZoomClick: function() {
    this.els.slider.value += 0.1;
    window.alert(this.els.slider.value);
  },

  isShown: function() {
    return !this.el.classList.contains('hidden');
  },

  hideZoomSlider: function() {
    this.el.classList.add('hidden');
    return this;
  },

  showZoomSlider: function(time) {
    this.el.classList.remove('hidden');

    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(this.hideZoomSlider, 1500);

    return this;
  },

  updateZoomSlider: function(scale, callback) {
    scale = scale.toFixed(1);

    if (scale < MIN_ZOOM_SCALE)
      scale = MIN_ZOOM_SCALE;
    else if (scale > MAX_ZOOM_SCALE)
      scale = MAX_ZOOM_SCALE;

    this.els.slider.value = scale;
    this.els.ratio.textContent = scale + "x";

    var zoomLevel = 1;
    if(scale > MIN_ZOOM_SCALE)
      zoomLevel = scale * 15; // for nexus
    else
      zoomLevel = scale; 
    callback(zoomLevel);
  },

  render: function() {
    return '<div class="js-zoom-wrapper">' +
      '<span class="js-zoom-min"></span>' +
      '<input type="range" class="js-zoom-slider" step="0.1"/>' +
      '<span class="js-zoom-max"></span>' +
    '</div>'+
    '<div class="js-zoom-ratio"></div>';
  }
});

});

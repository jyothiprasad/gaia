define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('view:dual-shutter');
var attach = require('vendor/attach');
var View = require('vendor/view');
var find = require('lib/find');

/**
 * Exports
 */

module.exports = View.extend({
  name: 'dual-shutter',
  className: 'test-dual-shutter',

  initialize: function() {
    this.render();
  },

  render: function() {
    this.el.innerHTML = this.template();
    attach.on(this.el, 'click', '.js-btn', this.onButtonClick);
    this.els.thumbnailButton = find('.thumbnail-button', this.el);
    debug('rendered');
  },

  set: function(key, value) {
    this.el.setAttribute(key, value);
  },

  get: function(key) {
    return this.el.getAttribute(key);
  },

  setter: function(key) {
    return (function(value) { this.set(key, value); }).bind(this);
  },

  enable: function(key, value) {
    value = arguments.length === 2 ? value : true;
    this.set(key + '-enabled', value);
  },

  enabler: function(key) {
    return (function(value) { this.enable(key, value); }).bind(this);
  },

  disable: function(key) {
    this.enable(key, false);
  },

  onButtonClick: function(e, el) {
    e.stopPropagation();
    var name = el.getAttribute('name');
    this.emit('click:' + name, e);

    if(name === 'capture-dual')
      this.set('anim-camera', true);
    else if (name === 'video-dual') {
      var anim = this.get('anim-video-start');
      if(anim === 'true') {
        this.set('anim-video-start', false);
        this.set('anim-video-stop', true);
      }
      else {
        this.set('anim-video-start', true);
        this.set('anim-video-stop', false);
      }
    }
  },

  addThumbnailIcon: function() {
    var thumbnail = new Image();
    thumbnail.id = "thumbnail-button";
    return this.els.thumbnailButton.appendChild(thumbnail);
  },
  
  removeThumbnail: function() {
    var elem = find('#thumbnail-button', this.el);
    this.els.thumbnailButton.removeChild(elem);
  },

  template: function() {
    return '<a class="gallery-button-dual js-btn" name="gallery-dual">' +
      '<span class="icon rotates"></span>' + 
    '</a>' +
    '<a class="thumbnail-button js-btn" name="thumbnail"></a>' +
    '<a class="take-button js-btn" name="capture-dual">' +
      '<span class="animation"></span>' +
      '<span class="icon rotates"></span>' +
    '</a>' +
    '<a class="recording-button js-btn" name="video-dual">' +
      '<span class="recording-dot"></span>' + 
    '</a>';
  },
});

});

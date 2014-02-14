define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var bind = require('utils/bind');
var find = require('utils/find');
var formatTimer = require('utils/formattimer');
var debug = require('debug')('view:controls');

/**
 * Exports
 */

module.exports = View.extend({
  className: 'controls js-controls',
  buttonsDisabledClass: 'buttons-disabled',
  initialize: function() {
    this.render();
  },

  render: function() {
    this.el.innerHTML = this.template();

    // Find elements
    this.els.switchButton = find('.js-switch', this.el);
    this.els.captureButton = find('.js-capture', this.el);
    this.els.galleryButton = find('.js-gallery', this.el);
    this.els.thumbnailButton = find('.js-thumbnail', this.el);
    this.els.cancelPickButton = find('.js-cancel-pick', this.el);
    this.els.timer = find('.js-video-timer', this.el);
    this.els.videoButton = find('.js-video', this.el);

    // Bind events
    bind(this.els.switchButton, 'click', this.onButtonClick);
    bind(this.els.captureButton, 'click', this.onButtonClick);
    bind(this.els.galleryButton, 'click', this.onButtonClick);
    bind(this.els.cancelPickButton, 'click', this.onButtonClick);
    bind(this.els.videoButton, 'click', this.onButtonClick);
  },

  template: function() {
    return '<a class="switch-button js-switch" name="switch">' +
      '<span class="rotates"></span>' +
    '</a>' +
//    '<a class="video-button js-video" name="video">' +
//      '<span class="rotates"></span>' +
//    '</a>' +
//    '<a class="capture-button js-capture" name="capture">' +
//      '<span class="rotates"></span>' +
//    '</a>' +
    '<div class="picture-button js-capture rotates" name="capture">' +
      '<div class="circle outer-circle"></div>' +
      '<div class="circle middle-circle"></div>' +
      '<div class="circle inner-circle"></div>' +
      '<div class="center"></div>' +
    '</div>' +
    '<div class="record-button js-video" name="video">' +
      '<div class="circle record-middle-circle"></div>' +
      '<div class="circle record-inner-circle"></div>' +
      '<div class="center"></div>' +
    '</div>' +
      '<div class="misc-button">' +
      '<a class="gallery-button js-gallery" name="gallery">' +
        '<span class="rotates"></span>' +
      '</a>' +
      '<a class="thumbnail-button js-thumbnail" name="thumbnail"></a>' +
      '<a class="cancel-pick js-cancel-pick" name="cancel">' +
        '<span></span>' +
      '</a>' +
      '<span class="video-timer js-video-timer">00:00</span>' +
    '</div>';
  },

  set: function(key, value) {
    this.el.setAttribute('data-' + key, value);
  },

  enableButtons: function() {
    this.el.classList.remove(this.buttonsDisabledClass);
    debug('buttons enabled');
  },

  disableButtons: function() {
    this.el.classList.add(this.buttonsDisabledClass);
    debug('buttons disabled');
  },

  setVideoTimer: function(ms) {
    var formatted = formatTimer(ms);
    this.els.timer.textContent = formatted;
  },

  onButtonClick: function(event) {
    var el = event.currentTarget;
    var name = el.getAttribute('name');
    this.emit('click:' + name);
  },

  addTimerUI:function(value){
    var divEle = document.createElement('div');
    divEle.id = "timerDiv"; 
    divEle.classList.add('capturetimer');
    divEle.setAttribute("data-value",value.toString());
    var span = document.createElement('span');
    span.id = "valueSpan";
    span.innerHTML = value;
    
    divEle.appendChild(span);
    document.body.appendChild(divEle);
  },
  updateTumerUI:function(value){
    var elem = find('#timerDiv', document.body);
    var span = find('#valueSpan',elem);
    span.innerHTML = value;
    elem.setAttribute("data-value",value.toString());
    if(value == 0)
      this.addLastTimeWrapper();
  },
  removeTimerUI:function(){
    var elem = find('#timerDiv', document.body);
    elem.innerHTML = "";
    elem.parentNode.removeChild(elem);
  },
  addLastTimeWrapper:function(){
    var divEle = document.createElement('div');
    divEle.classList.add('captureDiv');
    document.body.appendChild(divEle);
    setTimeout(function(){
      divEle.parentNode.removeChild(divEle);
    },1500);
  },
  addThumbnail: function() {
    var thumbnail = new Image();
    thumbnail.id="thumbnail-button";
    thumbnail.classList.add('thumbnail-btn');
    return this.els.thumbnailButton.appendChild(thumbnail);
  },

});

});

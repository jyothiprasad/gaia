define(function(require, exports, module) {
'use strict';

/**
 * TODO: Controllers should create views
 */

/**
 * Dependencies
 */

var debug = require('debug')('controller:dual-shutter');
var bindAll = require('lib/bind-all');
var broadcast = require('lib/broadcast');

/**
 * Exports
 */

exports = module.exports = function(app) {
  return new DualShutterController(app);
};

function DualShutterController(app) {
  debug('initializing');
  bindAll(this);
  this.app = app;
  this.activity = app.activity;
  this.dualShutter = app.views.dualShutter;
  this.bindEvents();
  this.configure();
  debug('initialized');
}

DualShutterController.prototype.bindEvents = function() {  
  this.app.settings.on('change:mode', this.dualShutter.setter('mode'));
  this.dualShutter.on('click:capture-dual', this.app.firer('capture'));
  //this.dualShutter.on('click:video-dual', this.onVideoButtonClick);
  this.dualShutter.on('click:video-dual', this.app.settings.toggler('mode'));
  this.dualShutter.on('click:gallery-dual', this.onGalleryButtonClick);
  this.app.on('change:recording', this.dualShutter.setter('recording'));
  this.app.on('camera:loading', this.disableButtons);
  this.app.on('camera:ready', this.enableButtons);
  this.app.on('camera:busy', this.disableButtons);
  this.app.on('camera:dual', this.enableButtons);
  //this.app.on('camera:anim-camera', this.dualShutter.setter('anim-camera'));
  //this.app.on('camera:anim-video-recording', this.dualShutter.setter('anim-video-recording'));
  //this.app.on('camera:anim-video-stop', this.dualShutter.setter('anim-video-stop'));
  this.app.camera.on('newimage', this.enableThumbnailButton);
  this.app.camera.on('newvideo', this.enableThumbnailButton);
  broadcast.on('disableThumbnail', this.disableThumbnailButton);
  debug('events bound');
};

DualShutterController.prototype.configure = function() {
  var initialMode = this.app.settings.mode.value();

  // The gallery button should not
  // be shown if an activity is pending
  // or the application is in 'secure mode'.
  var showGallery = !this.app.activity.active && !this.app.inSecureMode;

  this.showThumbnail = !showGallery;

  this.dualShutter.set('gallery', showGallery);
  this.dualShutter.set('mode', initialMode);

  var enableDualShutter = this.app.settings.value('dualShutter');
  this.app.camera.set('dual-shutter', enableDualShutter);

  if(enableDualShutter) {
    this.dualShutter.set('dual-enabled', enableDualShutter);
  }
  console.log("dualShutter: "+enableDualShutter);
};

DualShutterController.prototype.disableButtons = function() {
  this.dualShutter.disable('buttons');
};

DualShutterController.prototype.enableButtons = function() {
  this.dualShutter.enable('buttons');
};

var throttleGalleryLaunch = false;

/**
 * Open the gallery app
 * when the gallery button
 * is pressed.
 *
 */
DualShutterController.prototype.onGalleryButtonClick = function(e) {
  e.stopPropagation();
  var MozActivity = window.MozActivity;

  // Can't launch the gallery if the lockscreen is locked.
  // The button shouldn't even be visible in this case, but
  // let's be really sure here.
  if (this.app.inSecureMode) { return; }

  if (throttleGalleryLaunch) {
    return;
  }

  throttleGalleryLaunch = true;

  // Launch the gallery with an activity
  this.mozActivity = new MozActivity({
    name: 'browse',
    data: { type: 'photos' }
  });

  // Wait 2000ms before re-enabling the Gallery to be launched
  // (Bug 957709)
  window.setTimeout(function() {
    throttleGalleryLaunch = false;
  }, 2000);
};

/**
 * To be Updated the video button event
 * 
DualShutterController.prototype.onVideoButtonClick = function() {
  this.app.emit('dual-recording');
};*/

/**
 * Enable/disable Thumbnail Button,
 * if more than one photo has been taken in a session.
 *
 */
DualShutterController.prototype.enableThumbnailButton = function() {
  if(!this.showThumbnail) {
    var thumbnail = this.dualShutter.addThumbnailIcon();
    thumbnail.onclick = this.onThumbnailButtonClick;

    this.showThumbnail = true;
    this.dualShutter.set('gallery', false);
    this.dualShutter.set('thumbnail', true);
  }
  this.dualShutter.set('anim-camera', false);
  
  var anim = this.dualShutter.get('recording');
  if(anim !== 'true') {
    this.dualShutter.set('anim-video-start', false);
    this.dualShutter.set('anim-video-stop', false);    
  }
};

DualShutterController.prototype.disableThumbnailButton = function() {
    this.showThumbnail = false;
    this.dualShutter.removeThumbnail();

    this.dualShutter.set('gallery', true);
    this.dualShutter.set('thumbnail', false);
};

/**
 * Open the preview image
 * when the thumbnail button is pressed.
 *
 */
DualShutterController.prototype.onThumbnailButtonClick = function(event) {
  var target = event.target;
  if (!target || !target.classList.contains('thumbnail-btn')) {
    return;
  }

  this.app.filmstrip.previewItem(0);
  // If we're showing previews be sure we're showing the filmstrip
  // with no timeout and be sure that the viewfinder video is paused.
  this.app.views.viewfinder.el.pause();
};

});

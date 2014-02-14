define(function(require, exports, module) {
/*jshint laxbreak:true*/

'use strict';

/**
 * Dependencies
 */

var bindAll = require('utils/bindAll');
var debug = require('debug')('controller:controls');
  var bind = require('utils/bind');
/**
 * Exports
 */

exports = module.exports = function(app) {
  return new ControlsController(app);
};

function ControlsController(app) {
  debug('initializing');
  this.filmstrip = app.filmstrip;
  this.viewfinder = app.views.viewfinder;
  this.controls = app.views.controls;
  this.activity = app.activity;
  this.camera = app.camera;
  this.app = app;
  this.captureTimer  = null;
  bindAll(this);
  this.bindEvents();
  this.setup();
  debug('initialized');
}

ControlsController.prototype.bindEvents = function() {
  var controls = this.controls;
  var camera = this.camera;

  // Bind events
  camera.on('focusFailed', controls.enableButtons);
  camera.on('previewResumed', controls.enableButtons);
  camera.on('preparingToTakePicture', controls.disableButtons);
  camera.on('change:videoElapsed', this.onVideoTimeUpdate);
  camera.on('change:recording', this.onRecordingChange);
  camera.on('change:mode', this.onCameraModeChange);
  camera.on('changeImagePreview', this.onchangeImagePreview);
  camera.on('newimage', this.enableThumbnailButton);
  camera.on('newvideo', this.enableThumbnailButton);

  // Respond to UI events
  controls.on('click:switch', this.onSwitchButtonClick);
  controls.on('click:capture', this.onCaptureButtonClick);
  controls.on('click:cancel', this.onCancelButtonClick);
  controls.on('click:gallery', this.onGalleryButtonClick);
  controls.on('click:video', this.onVideoButtonClick);

    //bind volume key events
    bind(window,'keypress',this.onKeyPress);
  debug('events bound');
};

ControlsController.prototype.setup = function() {
  var activity = this.activity;
  var controls = this.controls;
  var isCancellable = activity.active;
  var showCamera = !activity.active || activity.allowedTypes.image;
  var showVideo = !activity.active || activity.allowedTypes.video;
  var isSwitchable = showVideo && showCamera;

  // The gallery button should not
  // be shown if an activity is pending
  // or the application is in 'secure mode'.
  var showGallery = !activity.active && !this.app.inSecureMode;

  controls.set('mode', this.camera.get('mode'));
  controls.set('gallery', showGallery);
  controls.set('cancel', isCancellable);
  controls.set('switchable', isSwitchable);

  if(this.camera.get('dualbutton'))
    controls.set('dualbutton', true);

  if(showGallery)
    this.showThumbnail = false;
};

ControlsController.prototype.onCameraModeChange = function(value) {
  this.controls.set('mode', value);
  debug('camera mode change: %s', value);
};

ControlsController.prototype.onRecordingChange = function(value) {
  this.controls.set('recording', value);
};

ControlsController.prototype.onVideoTimeUpdate = function(value) {
  this.controls.setVideoTimer(value);
};

/**
 * Fades the viewfinder out,
 * changes the camera capture
 * mode. Then fades the viewfinder
 * back in.
 *
 */
ControlsController.prototype.onSwitchButtonClick = function() {
  var controls = this.controls;
  var viewfinder = this.viewfinder;
  var camera = this.camera;

  camera.toggleMode();
  controls.disableButtons();
  viewfinder.fadeOut(onFadeOut);

  function onFadeOut() {
    camera.loadStreamInto(viewfinder.el, onStreamLoaded);
  }

  function onStreamLoaded() {
    controls.enableButtons();
    viewfinder.fadeIn();
  }
};

/**
 * Fades the viewfinder out,
 * changes the camera capture
 * mode. Then fades the viewfinder
 * back in.
 *
 */
ControlsController.prototype.onchangeImagePreview = function() {
  var controls = this.controls;
  var viewfinder = this.viewfinder;
  var camera = this.camera;

  //camera.toggleBode();
  controls.disableButtons();
  viewfinder.fadeOut(onFadeOut);

  function onFadeOut() {
    camera.loadStreamInto(viewfinder.el, onStreamLoaded);
  }

  function onStreamLoaded() {
    controls.enableButtons();
    viewfinder.fadeIn();
  }
};

/**
 * Cancel the current activity
 * when the cancel button is
 * pressed.
 *
 * This means the device will
 * navigate back to the app
 * that initiated the activity.
 *
 */
ControlsController.prototype.onCancelButtonClick = function() {
  this.activity.cancel();
};

/**
 * Open the gallery app
 * when the gallery button
 * is pressed.
 *
 */
ControlsController.prototype.onGalleryButtonClick = function() {
  var MozActivity = window.MozActivity;

  // Can't launch the gallery if the lockscreen is locked.
  // The button shouldn't even be visible in this case, but
  // let's be really sure here.
  if (this.app.inSecureMode) {
    return;
  }

  // Launch the gallery with an activity
  this.mozActivity = new MozActivity({
    name: 'browse',
    data: { type: 'photos' }
  });
};

/**
 * Capture when the capture
 * button is pressed.
 *
 */
ControlsController.prototype.onCaptureButtonClick = function() {
  var position = this.app.geolocation.position;
  var self = this;
  var mode = this.camera.get('mode') === 'photo';
  if(mode) {
    this.controls.set('capturing', true);
    var timer = this.camera.getCaptureTimer();
    if(this.captureTimer)
      return;
    if(timer)
    {
      timer = parseInt(timer);
      timer++;
      timer = timer * 1000;
      var self = this;
      var controls = this.controls;
      this.showTimerUI();
      setTimeout(function(){ 
        clearInterval(self.captureTimer);
        controls.removeTimerUI();
        self.captureTimer = null;
        self.camera.capture({ position: position });

         },timer);
    }
    else 
      this.camera.capture({ position: position });
  }
  else {
    var recording = this.camera.get('recording');
    var dualbutton = this.camera.get('dualbutton');

    if (recording && dualbutton) { 
      this.camera.takePicture({ position: position });
      this.controls.set('capturing', true);
    }
    else 
      this.camera.capture({ position: position });
  }

  // Disable controls for 500ms to
  // prevent rapid fire button bashing.
  this.controls.disableButtons();
  //setTimeout(this.controls.enableButtons, 500);
  setTimeout(function() {
    self.controls.enableButtons();
    self.controls.set('capturing', false);
  }, 500);
};

/**
 *
 */
ControlsController.prototype.onVideoButtonClick = function() {
  console.log("onVideoButtonClick");
  var viewfinder = this.viewfinder;
  var self = this;
  var recording = this.camera.get('recording');
  if (!recording) {
    this.camera.toggleMode();
 
    //viewfinder.fadeOut(onFadeOut);
  }
  //else
    recordingStart();

  /*function onFadeOut() {
    self.camera.loadStreamInto(viewfinder.el, onStreamLoaded);
  }

  function onStreamLoaded() {
    viewfinder.fadeIn();
    recordingStart();
  }*/

  function recordingStart(){
    var position = self.app.geolocation.position;
    self.camera.capture({ position: position });
    self.controls.disableButtons();
    setTimeout(self.controls.enableButtons, 500);
  }

};


/**
 * Open the preview image
 * when the thumbnail button
 * is pressed.
 *
 */
ControlsController.prototype.onThumbnailButtonClick = function(event) {
  var target = event.target;
  if (!target || !target.classList.contains('thumbnail-btn')) {
    return;
  }

  var index = parseInt(target.dataset.index);
  this.filmstrip.previewItem(index);
  // If we're showing previews be sure we're showing the filmstrip
  // with no timeout and be sure that the viewfinder video is paused.
  this.viewfinder.el.pause();
};

/**
 * Enable Thumbnail Button,
 * if more than one photo has been taken in a session.
 *
 */
ControlsController.prototype.enableThumbnailButton = function() {
  // If more than one photo has been taken in a session,
  var controls = this.controls;

  if(!this.showThumbnail) {
    this.showThumbnail = true;
    controls.set('gallery', false);
    controls.set('thumbnail', true);

    var thumbnail = controls.addThumbnail();
    thumbnail.onclick = this.onThumbnailButtonClick;
  }
};


ControlsController.prototype.showTimerUI = function(){
  var controls = this.controls;
  var counter = parseInt(this.camera.getCaptureTimer());
  var apps = this.app;
  controls.addTimerUI(counter--);
  this.captureTimer = setInterval(function(){
  if(counter <= 4){
    apps.sounds.play('recordingStart');
  }
  controls.updateTumerUI(counter--);
},1000);
  };
  /**
  * Capture picture on volume key press
  *
  ***/
  ControlsController.prototype.onKeyPress = function(evt){
    if(evt.keyCode == evt.DOM_VK_PAGE_UP || evt.keyCode == evt.DOM_VK_PAGE_DOWN )
      this.onCaptureButtonClick();
};


});

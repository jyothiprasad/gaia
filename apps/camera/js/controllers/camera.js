define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:camera');
var bindAll = require('lib/bind-all');
var bind = require('lib/bind');
var selfTimerView = require('views/selftimer');

/**
 * Exports
 */

exports = module.exports = function(app) { return new CameraController(app); };
exports.CameraController = CameraController;

/**
 * Initialize a new `CameraController`
 *
 * @param {App} app
 */
function CameraController(app) {
  debug('initializing');
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.storage = app.storage;
  this.storage = app.storage;
  this.activity = app.activity;
  this.filmstrip = app.filmstrip;
  this.viewfinder = app.views.viewfinder;
  this.controls = app.views.controls;
  this.hud = app.views.hud;
  this.selfTimer = null;
  this.selfTimeout = null;
  this.selfTimerView = new selfTimerView();
  this.configure();
  this.bindEvents();
  debug('initialized');
}

CameraController.prototype.bindEvents = function() {
  var camera = this.camera;
  var app = this.app;

  // Relaying camera events means other modules
  // don't have to depend directly on camera
  camera.on('change:videoElapsed', app.firer('camera:timeupdate'));
  camera.on('configured', this.app.setter('capabilities'));
  camera.on('configured', app.firer('camera:configured'));
  camera.on('changePreview', app.firer('camera:changePreview'));
  camera.on('change:recording', app.setter('recording'));
  camera.on('loading', app.firer('camera:loading'));
  camera.on('shutter', app.firer('camera:shutter'));
  camera.on('loaded', app.firer('camera:loaded'));
  camera.on('ready', app.firer('camera:ready'));
  camera.on('busy', app.firer('camera:busy'));
  camera.on('dual', app.firer('camera:dual'));

  // Camera
  camera.on('filesizelimitreached', this.onFileSizeLimitReached);
  camera.on('newimage', this.onNewImage);
  camera.on('newvideo', this.onNewVideo);

  // App
  app.on('boot', this.camera.load);
  app.on('focus', this.camera.load);
  app.on('capture', this.onCapture);
  app.on('blur', this.teardownCamera);
  app.on('settings:configured', this.onSettingsConfigured);
//  app.settings.on('change:pictureSizes', this.camera.setPictureSize);
  app.settings.on('change:pictureSizes', this.changePictureSize);
  app.settings.on('change:recorderProfiles', this.onVideoProfileChanged);
  app.settings.on('change:flashModes', this.setFlashMode);
  app.settings.on('change:cameras', this.loadCamera);
  app.settings.on('change:mode', this.setMode);
  //added for setting change listenr change listener
  app.settings.on('change:timer', this.setSelfTimer);
  app.settings.on('change:hdr', this.setHDRMode);
  // click event to cancel timer
  this.app.on('settings:toggle', this.cancelSelfTimer);
  this.hud.on('click:camera', this.cancelSelfTimer);
  this.hud.on('click:flash', this.cancelSelfTimer);
  this.controls.on('click:capture', this.cancelSelfTimer);
  this.controls.on('click:gallery', this.cancelSelfTimer);
  this.controls.on('click:switch', this.cancelSelfTimer);
  this.viewfinder.on('click', this.cancelSelfTimer);
  //bind volume key events
  bind(this.app.win,'keypress',this.onKeyPress);

  debug('events bound');
};

/**
 * Configure the camera with
 * initial configuration derived
 * from various startup parameters.
 *
 * @private
 */
CameraController.prototype.configure = function() {
  var settings = this.app.settings;
  var activity = this.activity;
  var camera = this.camera;

  // Configure the 'cameras' setting using the
  // cameraList data given by the camera hardware
  settings.get('cameras').configureOptions(camera.cameraList);

  // This is set so that the video recorder can
  // automatically stop when video size limit is reached.
  camera.set('maxFileSizeBytes', activity.data.maxFileSizeBytes);
  camera.set('selectedCamera', settings.value('cameras'));
  camera.setMode(settings.value('mode'));
  debug('configured');
};
CameraController.prototype.onVideoProfileChanged = function() {
  var recorderProfile = this.app.settings.recorderProfiles.selected().key;
  var mode = this.app.settings.value('mode');
  var self = this;
  if (mode === 'video') {
    this.viewfinder.fadeOut(function() {
    self.camera.changeVideoProfile(recorderProfile);
    });
  } else {
    this.camera.changeVideoProfile(recorderProfile);
  }
  
};

CameraController.prototype.changePictureSize = function() {
  var mode = this.app.settings.value('mode');
  var self = this;
  if (mode === 'picture') {
    this.viewfinder.fadeOut(function() {
    self.camera.changePictureSize(self.app.settings.value('pictureSizes'));
    });
  } else {
    this.camera.changePictureSize(self.app.settings.value('pictureSizes'));
  }
  
};

CameraController.prototype.onSettingsConfigured = function() {
  var recorderProfile = this.app.settings.recorderProfiles.selected().key;
  this.camera.setPictureSize(this.app.settings.value('pictureSizes'));
  this.camera.setVideoProfile(recorderProfile);
  this.camera.setFlashMode(this.app.settings.value('flashModes'));
  debug('camera configured with final settings');

  // TODO: Move to a new StorageController (or App?)
  var pictureSize = this.app.settings.pictureSizes.value();
  var maxFileSize = (pictureSize.width * pictureSize.height * 4) + 4096;
  this.storage.setMaxFileSize(maxFileSize);
};

// TODO: Tidy this crap
CameraController.prototype.teardownCamera = function() {
  var recording = this.camera.get('recording');
  var camera = this.camera;

  try {
    if (recording) {
      camera.stopRecording();
    }

    this.viewfinder.stopPreview();
    camera.set('previewActive', false);
    camera.set('focus', 'none');
    this.viewfinder.setPreviewStream(null);
  } catch (e) {
    console.error('error while stopping preview', e.message);
  } finally {
    camera.release();
  }

  // If the lockscreen is locked
  // then forget everything when closing camera
  if (this.app.inSecureMode) {
    this.filmstrip.clear();
  }

  debug('torn down');
};

CameraController.prototype.onCapture = function() {
  // For taking a picture during video recording on dual shutter mode
  var position = this.app.geolocation.position;
  var recording = this.camera.get('recording');  
  var dualShutter = this.camera.get('dual-shutter');
  var timer = this.camera.get('selftimer');
  var self = this;
  if(timer){
    timer = parseInt(timer);
    timer++;
    timer = timer * 1000;
    //show timer UI
    this.showTimerUI();
    //set time out
    this.selfTimeout = setTimeout(function(){ 
      if(dualShutter && recording)
        self.camera.takePicture({ position: position });
      else {
        self.camera.capture({ position: position });
        self.cancelSelfTimer();
      }
    },timer);
  }
  else {
    if(dualShutter && recording)
        self.camera.takePicture({ position: position });
    else
      self.camera.capture({ position: position });
  }
};


CameraController.prototype.showTimerUI = function(){
  var counter = parseInt(this.camera.get('selftimer'));
  var apps = this.app;
  var self = this;
  var timerview = this.selfTimerView;
  timerview.addTimerUI(counter--);
  if(counter <= 3)
      apps.sounds.play('recordingStart');
  this.selfTimer = setInterval(function(){
    if(counter <= 3 && counter >= 0){
      apps.sounds.play('recordingStart');
    }
    timerview.updateTumerUI(counter--);
  },1000);
};
CameraController.prototype.onNewImage = function(image) {
  var filmstrip = this.filmstrip;
  var storage = this.storage;
  var blob = image.blob;
  var self = this;

  // In either case, save
  // the photo to device storage
  storage.addImage(blob, function(filepath) {
    debug('stored image', filepath);
    if (!self.activity.active) {
      filmstrip.addImageAndShow(filepath, blob);
    }
  });

  debug('new image', image);
  this.app.emit('newimage', image);
};

CameraController.prototype.onNewVideo = function(video) {
  debug('new video', video);

  var storage = this.storage;
  var poster = video.poster;
  var camera = this.camera;
  var tmpBlob = video.blob;
  var app = this.app;

  // Add the video to the filmstrip,
  // then save lazily so as not to block UI
  if (!this.activity.active) {
    this.filmstrip.addVideoAndShow(video);
  }
  storage.addVideo(tmpBlob, function(blob, filepath) {
    debug('stored video', filepath);
    video.filepath = filepath;
    video.blob = blob;

    // Add the poster image to the image storage
    poster.filepath = video.filepath.replace('.3gp', '.jpg');
    storage.addImage(poster.blob, { filepath: poster.filepath });

    // Now we have stored the blob
    // we can delete the temporary one.
    // NOTE: If we could 'move' the temp
    // file it would be a lot better.
    camera.deleteTmpVideoFile();
    app.emit('newvideo', video);
  });
};

CameraController.prototype.onFileSizeLimitReached = function() {
  this.camera.stopRecording();
  this.showSizeLimitAlert();
};

CameraController.prototype.showSizeLimitAlert = function() {
  if (this.sizeLimitAlertActive) { return; }
  this.sizeLimitAlertActive = true;
  var alertText = this.activity.active ?
    'activity-size-limit-reached' :
    'storage-size-limit-reached';
  alert(navigator.mozL10n.get(alertText));
  this.sizeLimitAlertActive = false;
};

CameraController.prototype.setMode = function(mode) {
  var flashMode = this.app.settings.value('flashMode');
  var self = this;
  // We need to force a flash change so that
  // the camera hardware gets set with the
  // correct flash for this capture mode.
  this.setFlashMode(flashMode);
  this.viewfinder.fadeOut(function() {
    // switch mode and capture for dual shttuer mode
    var dualShutter = self.camera.get('dual-shutter');
    if(dualShutter) {
      var position = self.app.geolocation.position;
      option = { position: position };
      self.camera.setMode(mode, option);
    }
    else
      self.camera.setMode(mode);
  });
};

CameraController.prototype.loadCamera = function(value) {
  this.camera.set('selectedCamera', value);
  this.viewfinder.fadeOut(this.camera.load);
};

/**
 * Toggles the flash on
 * the camera and UI when
 * the flash button is pressed.
 */
CameraController.prototype.setFlashMode = function(flashMode) {
  flashMode = this.translateFlashMode(flashMode);
  this.camera.setFlashMode(flashMode);
};

/**
 * This is a quick fix to translate
 * the chosen flash mode into a video
 * compatible flash mode.
 *
 * The reason being, camera will soon
 * be dual shutter and both camera
 * and video will support the same
 * flash options. We don't want to
 * waste time building support for
 * deprecated functionality.
 *
 * @param  {String} flashMode
 * @return {String}
 */
CameraController.prototype.translateFlashMode = function(flashMode) {
  var isFrontCamera = this.app.get('selectedCamera') === 1;
  var isPhotoMode = this.app.settings.value('mode') === 'picture';
  if (isPhotoMode) { return flashMode; }
  if (isFrontCamera) { return null; }
  switch (flashMode) {
    case 'auto': return 'off';
    case 'on': return 'torch';
    default: return flashMode;
  }
};
/**
* set Self timer value when change from settings 
*@ paramet
**/
CameraController.prototype.setSelfTimer = function(value){
  this.camera.configureSelfTimer(value);
};

/**
* cancel Self timer if clicked on viewfinder or any other copenet on screen
*@ paramet
**/
CameraController.prototype.cancelSelfTimer = function(){
    if(this.selfTimer)
    {
      clearInterval(this.selfTimer);
      clearTimeout(this.selfTimeout);
      this.selfTimer = null;
      this.selfTimeout = null;
      // hide timer UI
      this.selfTimerView.removeTimerUI();
    }
};

/**
  * Capture picture on volume key press
  *
  ***/
CameraController.prototype.onKeyPress = function(evt){
  if(evt.keyCode == evt.DOM_VK_PAGE_UP || evt.keyCode == evt.DOM_VK_PAGE_DOWN )
    this.onCapture();
};

CameraController.prototype.setHDRMode = function (value){
  this.camera.configureHDR(value);
};

});

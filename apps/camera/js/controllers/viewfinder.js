define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var bindAll = require('utils/bindAll');
var debug = require('debug')('controller:viewfinder');

/**
 * Exports
 */

module.exports = ViewfinderController;

/**
 * Initialize a new `ViewfinderController`
 *
 * @param {App} app
 */
function ViewfinderController(app) {
  if (!(this instanceof ViewfinderController)) {
    return new ViewfinderController(app);
  }

  debug('initializing');
  this.viewfinder = app.views.viewfinder;
  this.slider = app.views.slider;
  this.filmstrip = app.filmstrip;
  this.activity = app.activity;
  this.camera = app.camera;
  bindAll(this);
  this.bindEvents();
  debug('initialized');
}

ViewfinderController.prototype.bindEvents = function() {
  this.camera.on('configured', this.onConfigured);
  this.camera.on('change:mode', this.onConfigured);
  this.camera.on('changeImagePreview', this.onConfigured);
  this.viewfinder.on('click', this.onViewfinderClick);
  this.viewfinder.on('touchmove', this.onViewfinderTouchMove);
  this.viewfinder.on('touchFocusMode', this.ontouchFocusMode);
};

ViewfinderController.prototype.onConfigured = function() {
  debug('camera configured');
  this.viewfinder.updatePreview(this.camera.previewSize,
                                this.camera.get('selectedCamera') === 1);
  this.camera.loadStreamInto(this.viewfinder.el, onStreamLoaded);
  function onStreamLoaded(stream) {
    debug('stream loaded %d ms after dom began loading',
    Date.now() - window.performance.timing.domLoading);
  }
};

ViewfinderController.prototype.onViewfinderClick = function() {
  var recording = this.camera.get('recording');

  // The filmstrip shouldn't be
  // shown while camera is recording.
  if (recording || this.activity.active) {
    return;
  }

  var zoom = this.slider.isShown();
  if(zoom)
    this.slider.disableZoom();
  //else
  //  this.filmstrip.toggle();

  debug('click');
};

ViewfinderController.prototype.ontouchFocusMode = function(evt) {
  var touchCoord ={
    x:0,
    y:0
  };

  touchCoord = this.viewfinder.getTouchPoints();

  console.log("CCC touchCoord.x:"+touchCoord.x);
  console.log("CCC touchCoord.y:"+touchCoord.y);
  this.camera.setTouchFlag();

  this.camera.setTouchFocusMode(touchCoord.x, touchCoord.y);
};

// zoom
ViewfinderController.prototype.onViewfinderTouchMove = function(evt) {
  this.slider.enableZoom();

  var self = this;
  var scale = this.viewfinder.getScale();

  this.slider.updateSlider(scale, onSuccess);

  //this.camera.loadStreamInto(this.viewfinder.el, onPreviewSuccess);
  //console.log("scale : " + scale);
  //this.camera.setZoom(scale);

  //this.camera.loadStreamInto(this.viewfinder.el, onSuccess);

  function onSuccess(scale) {
    self.camera.setZoom(scale);
    self.camera.resumePreview();
    console.log("resumePreview: " + scale);    
  }

  function onPreviewSuccess() {
    console.log("preview done");
  }
};

});

define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:viewfinder');
var bindAll = require('lib/bind-all');
/**
 * Exports
 */

module.exports = function(app) { return new ViewfinderController(app); };
module.exports.ViewfinderController = ViewfinderController;

/**
 * Initialize a new `ViewfinderController`
 *
 * @param {App} app
 */
function ViewfinderController(app) {
  debug('initializing');
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.activity = app.activity;
  this.filmstrip = app.filmstrip;
  this.viewfinder = app.views.viewfinder;
  this.zoom = app.views.zoom;
  this.bindEvents();
  debug('initialized');
}

ViewfinderController.prototype.bindEvents = function() {
  this.viewfinder.on('touchmove', this.onViewfinderTouchMove);
  this.viewfinder.on('click', this.onViewfinderClick);
  this.viewfinder.on('touchFocusPts', this.ontouchFocusPts);
  this.app.on('camera:configured', this.loadStream);
  this.app.on('camera:changePreview',this.loadStream);
  this.app.on('settings:configured', this.configureCamera);
  this.app.settings.on('change:grid', this.setGridView);
};

ViewfinderController.prototype.configureCamera = function() {
  this.camera.viewportSize = {
    width: this.app.el.clientWidth,
    height: this.app.el.clientHeight
  };
  this.setGridView(this.app.settings.value('grid'));;
};

/**
 * capture touch coordinates
 * when user clicks view finder
 * and call touch focus function.
 *
 */

ViewfinderController.prototype.ontouchFocusPts = function() {
  var self = this;
  var touchFocusPts = this.viewfinder.getTouchFocusPts();
  this.app.views.focusRing.el.style.left = touchFocusPts.x + 'px';
  this.app.views.focusRing.el.style.top = touchFocusPts.y + 'px';
  this.camera.setTouchFocus(touchFocusPts.x, touchFocusPts.y, focusDone);
  function focusDone() {
    // clear ring UI
    self.camera.clearFocusRing();
    // update focus flag when touch is available
    self.viewfinder.setTouchFocusDone();
  }
};

ViewfinderController.prototype.loadStream = function() {
  var isFrontCamera = this.app.settings.cameras.value() === 'front';
  debug('load stream mode: %s', this.app.settings.value('mode'));
  this.viewfinder.updatePreview(this.camera.previewSize, isFrontCamera);
  this.camera.loadStreamInto(this.viewfinder.el);
  this.viewfinder.fadeIn();
};

/**
 * Toggles the filmstrip, but not
 * whilst recording or within an
 * activity session.
 *
 * @private
 */
ViewfinderController.prototype.onViewfinderClick = function() {
  var recording = this.app.get('recording');
  if (recording || this.activity.active) { return; }

  /** 
  * [hyuna] Hide zoom slider
  * To-Do: Need to remove filmstrip
  */
  var zoomimg = this.zoom.isShown();
  if(zoomimg)
    this.zoom.hideZoomSlider();
  else
    this.filmstrip.toggle();
  debug('click');
};

/** 
* [hyuna] show zoom slider
* To-Do: Will remove this code
*/
ViewfinderController.prototype.onViewfinderTouchMove = function(evt) {
  this.zoom.showZoomSlider();

  var self = this;
  var scale = this.viewfinder.getScale();

  this.zoom.updateZoomSlider(scale, onSuccess);

  /**
  * [hyuna] Need to check which function is better 
  * between loadStreamInto and resumePreview
  */
  //this.camera.loadStreamInto(this.viewfinder.el, onPreviewSuccess);
  //this.camera.setZoom(scale);
  //this.camera.loadStreamInto(this.viewfinder.el, onSuccess);
  
  function onSuccess(scale) {
    self.camera.setZoom(scale);
    self.camera.resumePreview();
  }

  function onPreviewSuccess() {
    console.log("preview done");
  }
};
/**
*Set grid view
*
**/

ViewfinderController.prototype.setGridView = function(value){
  var isFrontCamera = this.app.settings.cameras.value() === 'front';
  this.camera.configureGridPreview(value);
  if(value)
    this.viewfinder.addGridPreview(this.camera.previewSize, isFrontCamera);
  else
    this.viewfinder.removeGridPreview();
};

});

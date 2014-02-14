define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var bindAll = require('utils/bindAll');

/**
 * Locals
 */

var proto = SliderController.prototype;

/**
 * Exports
 */

exports = module.exports = function(app) {
  return new SliderController(app);
};


/**
 * Initialize a new `SliderController`
 *
 * @param {AppController} app
 * @constructor
 *
 */
function SliderController(app) {
  this.viewfinder = app.views.viewfinder;
  this.controls = app.views.controls;
  this.hud = app.views.hud;
  this.slider = app.views.slider;
  this.camera = app.camera;

  bindAll(this);
}

});
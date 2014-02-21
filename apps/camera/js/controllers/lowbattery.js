define(function(require, exports, module) {
  /*jshint laxbreak:true*/

  'use strict';

  /**
  * Dependencies
  */

  var bindAll = require('lib/bind-all');
  var debug = require('debug')('controller:lowbattery');
  var bind = require('lib/bind');
  /**
  * Local variables
  **/
  var batteryHelper = require('BatteryHelper');
  var toastMsg = require('views/toastmessage');

  /**
   * Exports
  */

  exports = module.exports = function(app) {
    return new LowBatteryController(app);
  };
  /**
 * Initialize a new `LowBatteryController`
 *
 * @param {Object} options
 */
  function LowBatteryController(app){
    this.app = app;
  	this.camera = app.camera;
    this.indicator = app.views.indicator;
    this.toast = new toastMsg();
    bindAll(this);
  	this.bindEvents();
    debug('initialized');
  }

 /**
 * Bind callbacks to required events.
 *
 */
  LowBatteryController.prototype.bindEvents = function(){
  	//low battery indicator
//    this.app.on('change:Battery',this.batteyCheck);
  	batteryHelper.addBatteryListener([1,2,3,4,5,10,11,12,13,14,15], this.lowBatteryHandler);
  };
  /**
 * lowBatteryHandler` to handle low battery scenario
 *
 * @param {Object} options
 */
  LowBatteryController.prototype.lowBatteryHandler = function (value){
   // alert(value);
   var toast = this.toast;
   var indicator =  this.indicator;
   toast.removeMessage();
  if(value <=15 && value >6)
  {
    toast.setLowBatteryMesg(value);
    setTimeout(function(){
      toast.removeMessage();
      indicator.setBatteryStatus(value,"notcharging");
    },3000);

  }else if(value == 6){
    toast.setLowBatteryMesg(value);
    indicator.setBatteryStatus(value,"notcharging");
  }
  else if(value <=5)
  {
    var camera = this.camera;
    toast.setLowBatteryMesg(value);
    if(camera.get('recording'))
      camera.stopRecording();
    setTimeout(function(){toast.removeMessage(); window.close();},3000);
  }
};

LowBatteryController.prototype.batteyCheck = function(){
//  var value = constans.CameraMenuItems.photo.Battery.options[constans.CameraMenuItems.photo.Battery.value].value;
//  this.lowBatteryHandler(value);
};

});
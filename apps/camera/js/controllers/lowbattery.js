define(function(require, exports, module) {
  /*jshint laxbreak:true*/

  'use strict';

  /**
  * Dependencies
  */

  var bindAll = require('utils/bindAll');
  var debug = require('debug')('controller:lowbattery');
  var bind = require('utils/bind');
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
  	this.camera = app.camera;
  	this.toast = new toastMsg();
    this.battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;
  	this.bindEvents();
    this.batteyCheck();
    debug('initialized');
  }

 /**
 * Bind callbacks to required events.
 *
 */
  LowBatteryController.prototype.bindEvents = function(){
  	//low battery indicator
    bind(this.battery, "chargingchange", this.batteyCheck);
    bind(this.battery, "levelchange", this.batteyCheck);
  	//batteryHelper.addBatteryListener([1,2,3,4,5,10,15], function(value){ this.lowBatteryHandler(value);} );
  };
  /**
 * lowBatteryHandler` to handle low battery scenario
 *
 * @param {Object} options
 */
  LowBatteryController.prototype.lowBatteryHandler = function (value){
  if(value <=15 && value >6)
  {
    var toast = this.toast;
    var msg = "You have "+value+"% battery remaining";
    toast.showBottomToast(msg);
    setTimeout(function(){toast.removeMessage();},3000);

  }else if(value == 6){
    var toast = this.toast;
    var msg = "Critically low battery";
    toast.showBlinkToastMsg(msg);
  }
  else if(value <=5)
  {
    var toast = this.toast;
    var camera = this.camera;
    var title = " Low Battery ";
    var msg = "The battery is too low to use the Camera";
    toast.showFullScreenMessage(title,msg);
    if(camera.get('recording'))
      camera.stopRecording();
    setTimeout(function(){toast.removeMessage(); window.close();},3000);
  }
};
LowBatteryController.prototype.batteyCheck = function(){
    var level = Math.floor(this.battery.level * 100);
    if(level <= 15)
     this.lowBatteryHandler(level);
  };

});
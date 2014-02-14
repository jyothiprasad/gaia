define(function(require, exports, module) {
/*jshint laxbreak:true*/

  'use strict';

  /**
  * Dependencies
  */

  var bindAll = require('utils/bindAll');
  var debug = require('debug')('controller:indicator');
  var bind = require('utils/bind');
  /**
  * Local variables
  **/
  var indicatorConfig = require('config/indicator');

  /**
  * Exports
  */

  exports = module.exports = function(app) {
    return new IndicatorController(app);
  };
  /**
  * Initialize a new `IndicatorController`
  *
  * @param {Object} options
  */
  function IndicatorController(app) {
    debug('initializing');
    this.indicator = app.views.indicator;
    this.camera = app.camera;
    this.app = app;
    this.battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;
    this.requireData = null;
    bindAll(this);
    this.setup();
    debug('initialized');
  }

  /**
  * get the indicators if it is enabled.
  *
  */
  IndicatorController.prototype.setup = function() {
    if(indicatorConfig.Indicators.status)
    {
      this.requireData = indicatorConfig.Indicators.require?require(indicatorConfig.Indicators.require):null;
      this.getIndicators();
    }
  };
  /**
  * get the enabled indicators and add to the indicators .
  *
  */
   IndicatorController.prototype.getIndicators = function(){ 
    var indicatorOpt = indicatorConfig.Indicators.option;
    for(var index in indicatorOpt)
    {
      if(indicatorOpt[index].status)
        this.addIndicators(index,indicatorOpt[index])
    }

  };
  /**
  * get the acheck the indicator and set the lisners .
  *
  */
  IndicatorController.prototype.addIndicators = function(name,indicatorObj){
    var events = indicatorObj.eventName;
    switch(name)
    {
      case "Battery":{
        this.batteyCheck();
        this.bindBatteryEvents(events);
        break;
      }
      case "Geolocation":{
        this.bindGeolocationEvents(events);
        break;
      }
      case "HDR":{
        this.bingHDREvents(events);
        break;
      }
      case "SelfTimer":{
        this.bingTimerEvents(events);
        break;
      }
    }
    
  };
  IndicatorController.prototype.bindBatteryEvents = function(events){
    for(var evt in events)
      {
        bind(this.battery, events[evt], this.batteyCheck);
      }
  };
  IndicatorController.prototype.bindGeolocationEvents = function(events){
    for(var evt in events){  
      switch(events[evt]){
        case "visibilitychange":{
          var app = this.app;
          bind(app.doc, events[evt], this.onVisibilitychange);
          break;
        }
        case "configured":{
          var camera = this.camera;
          camera.on(events[evt], this.onConfiguredIndicator);
          break;
        }
      }
    }
  };
  IndicatorController.prototype.bingHDREvents = function(events){
    var app = this.app;
    app.on(events, this.updateHDR);
  };
   IndicatorController.prototype.bingTimerEvents = function(events){
    var app = this.app;
    app.on(events, this.updateCaptureTimer);
  };
  IndicatorController.prototype.batteyCheck = function(){
    var level = Math.floor(this.battery.level * 100);
    if(level > 15)
      return;
    var charging = this.battery.charging;
    if(charging)
 	    this.indicator.setBatteryStatus(level.toString(),"charging");
    else
 	    this.indicator.setBatteryStatus(level.toString(),"notcharging");
  };

  IndicatorController.prototype.onVisibilitychange = function(){
    var app = this.app;
    if(!app.doc.hidden)
      this.updateGeoTagging();
  };
  IndicatorController.prototype.updateGeoTagging = function(){
	  var position = this.app.geolocation.position;
    var mozPerms = navigator.mozPermissionSettings;
    var apps = navigator.mozApps;
    var indicator = this.indicator;
    var self = this;
    apps.mgmt.getAll().onsuccess = function mozAppGotAll(evt) {
      var apps = evt.target.result;
      apps.forEach(function(app) {
        if(app.manifest.name == "camera"){
          var value = mozPerms.get("geolocation", app.manifestURL, app.origin, false);
          console.log("  Application name:: "+app.manifest.name+"  Permission ::"+value);
          switch(value){
            case "allow":
              indicator.setGeoTagging('On');
            break;
            case "deny":
              indicator.setGeoTagging('Off');
            break;
            case "prompt":{
              setTimeout(function(){self.updateGeoTagging();},500);
            break;
            }
          }
        }
      });
    };
  };

  IndicatorController.prototype.onConfiguredIndicator = function(){
	  this.updateGeoTagging();
    this.updateHDR();
    this.updateCaptureTimer();
  };
  IndicatorController.prototype.updateHDR = function(){
  var hdrValue = this.requireData.CameraMenuItems.photo.HDR.value;
  this.indicator.setHDRindicator(hdrValue);
  };
  IndicatorController.prototype.updateCaptureTimer = function(){
  var timer = this.requireData.CameraMenuItems.photo.Timer.value;
  this.indicator.setCaptureTimer(timer);
  };

 
});
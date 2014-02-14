define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var bindAll = require('utils/bindAll');
var indexDB = require('utils/indexDB');

var debug = require('debug')('controller:hud');

var constans = require('config/settings');
var cameraConstants = require('config/camera');
var SettingsView = require('views/settings');

/**
 * Locals
 */

var toastMsg = require('views/toastmessage');
/**
 * Exports
 */

exports = module.exports = create;
exports.SettingsController = SettingsController;
/**
 * Create new `HudController`
 * and bind events.
 *
 * @param  {AppController} app
 * @return {HudController}
 *
 */
function create(app) {
  return new SettingsController(app).bindEvents();
}

/**
 * Initialize a new `HudController`
 *
 * @param {AppController} app
 * @constructor
 *
 */
function SettingsController(app) {
  debug('initializing');
  this.viewfinder = app.views.viewfinder;
  this.controls = app.views.controls;
//  this.filmstrip = app.filmstrip;
  this.hud = app.views.hud;
  this.settings = app.views.settings;
  this.indicator = app.views.indicator;
  this.camera = app.camera;
  this.app = app;
  this.menuDisplay = false;
  this.toast = new toastMsg();
  bindAll(this);
  debug('initialized');
}

/**
 * Bind callbacks to events.
 *
 * @return {HudController} for chaining
 *
 */
SettingsController.prototype.bindEvents = function() {
  this.hud.on('flashToggle', this.onFlashToggle);
  this.hud.on('cameraToggle', this.onCameraToggle);
  this.hud.on('settings', this.onSettingClick);
  this.camera.on('previewresumed', this.hud.enableButtons);
  this.camera.on('preparingtotakepicture', this.onTakePicture);
  this.camera.on('change:recording', this.onRecordingChange);
/***** added to destroy grid menu*****/
  this.controls.on('click:switch', this.onCaptureClick);
  this.controls.on('click:capture', this.onCaptureClick);
  this.controls.on('click:gallery', this.onCaptureClick);
  this.viewfinder.on('click', this.onViewfinderClick);
  return this;
};

/**
 * on switch capture and click of gallery hide 
 * 
 */
SettingsController.prototype.onCaptureClick = function(){
  if(this.menuDisplay)
      this.clearSettingMenu();

};
SettingsController.prototype.isMenuDisplay = function(){
  return this.menuDisplay;
};

/**
* onlick of viewfinder 
*
**/
SettingsController.prototype.onViewfinderClick = function(){
   if(this.menuDisplay)
   {
      this.clearSettingMenu();
   }
      
};

/**
 * Toggles the flash on
 * the camera and UI when
 * the flash button is pressed.
 *
 */
SettingsController.prototype.onFlashToggle = function() {
  if(this.menuDisplay)
      this.clearSettingMenu();
};

/**
 * Toggle the camera (front/back),
 * fading the viewfinder in between.
 *
 */
SettingsController.prototype.onCameraToggle = function() {
   if(this.menuDisplay)
      this.clearSettingMenu();
};


/**
* when setting menu icon is clicked
*
*
*/
SettingsController.prototype.onSettingClick=function(){
    
    debug('Setting Button clicked');
    console.log(" this.menuDisplay:: "+this.menuDisplay);
    if(this.menuDisplay)
      this.clearSettingMenu();
    else
      this.showSettingMenu();  
};

/**
* Start showing the settings Grid Menu
*
*
*/
SettingsController.prototype.showSettingMenu = function(){
  var mode = this.camera.get('mode');
  var dataObj = this.getMenuArray(mode) ;
  this.settings.setSettingMenuObj(dataObj);
  this.settings.render();
  this.settings.on('setSettingOption', this.onSetSettingOption);
  //this.settings.on('showSettingOption', this.onShowSettingOption);
  this.menuDisplay = true;
}

/**
* Clear the setting menu
*
*
*/
SettingsController.prototype.clearSettingMenu = function(){
  this.settings.removeListener('setSettingOption', this.onSetSettingOption);
  //this.settings.removeListener('showSettingOption', this.onShowSettingOption);
  this.settings.clearSettingMenu();
  this.menuDisplay = false;   
};




/**
* when a setting option is changed.
*
*
*/
SettingsController.prototype.onSetSettingOption = function (events){
  var mode = this.camera.get('mode') == cameraConstants.CAMERA_MODE_TYPE.PHOTO ? cameraConstants.CAMERA_MODE_TYPE.PHOTO : cameraConstants.CAMERA_MODE_TYPE.VIDEO ;
  this.updateValuesStruc(events.target.menuitem,events.target.menuvalue,mode);

  var dataObj = this.getMenuArray(mode) ;
  this.settings.setSettingMenuObj(dataObj);
  this.settings.updateMenuOptionUI(events.target.menuitem);
  this.setChanges(events.target.menuitem,events.target.menuvalue,events.target.menusetval);
  var menuItem = events.target.menuitem.replace(" ","");
  this.checkPersistent(mode, menuItem, events.target.menuvalue);
};

/**
* If the menu Item is persistent then save the setting
* value in indexDB to retain the value.
*
*/
SettingsController.prototype.checkPersistent=function(mode, menuItem, value){
  var obj = constans.CameraMenuItems.video;

  if(mode == "photo") {
    obj = constans.CameraMenuItems.photo;
  }

  if(menuItem in obj) {
    if (obj[menuItem].persistant){
      indexDB.updateRecord(mode, menuItem, value);
    }
  }
};


/**
* Get menu array of each mode
*
*
*/
SettingsController.prototype.getMenuArray=function(mode){
 
if(mode == "photo")
 	var obj = constans.CameraMenuItems.photo;
else
	var obj = constans.CameraMenuItems.video;
    return obj;

};


/**
* when a setting value is selected/changed,
* take the appropiate action.
* All Fixed values should be REMOVED 
*/
SettingsController.prototype.setChanges = function (item,menuItem, value){

  var imageSize={width:2560,height:1920};
  var previewSize = {width:1080,height:720};
  var videoProfile='';
  this.app.emit('change:' + item);
  var self =this;
  switch(item){
    case "Timer":{
      this.camera.setCaptureTimer(value);
      console.log(" hud setCaptureTimer  this._captureTimer:: "+value);
      break;
    }
    case "Zoom":{
      this.camera.mozCamera.zoom = value;
      break;
    }
    case "Image Size":{
      switch(menuItem){
        
        case "4:3":{
        imageSize =value;
          previewSize.width = 640;
          previewSize.height = 480;
          this.camera.setImagesize(imageSize, previewSize);
          break;
        }
        case "1:1":{
          imageSize =value;
          previewSize.width = 176;
          previewSize.height = 176;
          this.camera.setImagesize(imageSize, previewSize);
          break;
        }
        case "16:9":{
          imageSize =value;
          previewSize.width = 800;
          previewSize.height = 480;
          this.camera.setImagesize(imageSize, previewSize);
          break;
        }
      }
      break;
    }
    case "Video Size":{
      switch(menuItem){
        
        case "16:9":{
          videoProfile =value;
          var videoSize = {
            width: 1280,
            height: 720
          };
          this.camera.setVideoProfile(videoProfile, videoSize);
          break;
        }
        case "3:2":{
          videoProfile =value;
          var videoSize = {
            width: 720,
            height: 480
          };
          this.camera.setVideoProfile(videoProfile, videoSize);
          break;
        }
        case "5:4":{
          videoProfile =value;

          var videoSize = {
            width: 320,
            height: 240
          };
          this.camera.setVideoProfile(videoProfile, videoSize);
          break;
        }
      }
      break;
    }
    case "Frame Grid":{
       switch(menuItem){
        case "On":{
             this.viewfinder.addGridPreview(this.camera.previewSize,this.camera.get('selectedCamera') === 1);
          break;
        }
        case "Off":{
            this.viewfinder.removeGridPreview();
          break;
        }
       }

       break;
    }
    case "HDR":{
       this.camera.setHDR(value);
       break;
    }
    case "White Balance":{
      this.camera.setWhiteBalanceMode(value);
      break;
    }
    case "ISO":{
       this.camera.setISO(value);
       break;
    }
    case "Battery":{
      if(value <= 15)
      {
        this.indicator.setBatteryStatus(value,"notcharging");
        value = parseInt(value);
        this.lowBatteryHandler(value);
      }
      
    }
  }
};

/**
 * Disable the buttons
 * when recording
 *
 * @param  {Boolean} value
 *
 */
SettingsController.prototype.onRecordingChange = function(value) {
  if(this.menuDisplay)
      this.clearSettingMenu();
};

/**
*
*
*/

SettingsController.prototype.updateValuesStruc = function(item,value,mode){
  var index = item.replace(" ","");
if(mode == "photo")
  var obj = constans.CameraMenuItems.photo;
else
  var obj = constans.CameraMenuItems.video;
  obj[index].value = value;

};


SettingsController.prototype.lowBatteryHandler = function (value){
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

});
define(function(require, exports, module) {
'use strict';

/**
 * Exports
 *add eventname  only when the vent is unique .
 */

  module.exports = {
  	Indicators:{
  	  	status:true,
        require:"config/settings",
  	  	option:{
        "Battery":{
          status:true,
          eventName:["chargingchange","levelchange"],
        },
        "Geolocation":{
          status:true,
          eventName:["visibilitychange","configured"],
        },
  		  "HDR":{
  		  	status:true,
  		  	eventName:"change:HDR",
  		  },
  		  "SelfTimer":{
  		  	status:true,
  		  	eventName:"change:Timer"
  		  }
  		}
  	}
  };
});
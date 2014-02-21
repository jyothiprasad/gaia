define(function(require, exports, module) {
'use strict';

/**
 * Exports
 *add eventname  only when the vent is unique .
 */

  module.exports = {
  	Indicators:{
  	  	status:true,
        require:null,
  	  	option:{
        "Battery":{
          status:true,
          eventName:["chargingchange","levelchange"],
        },
        "Geolocation":{
          status:true,
          eventName:["visibilitychange","settings:configured"],
        },
  		  "HDR":{
  		  	status:true,
  		  	eventName:"change:hdr",
  		  },
  		  "SelfTimer":{
  		  	status:true,
  		  	eventName:"change:timer"
  		  }
  		}
  	}
  };
});
define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

	var View = require('vendor/view');
	var bind = require('lib/bind');
	var find = require('lib/find');

	module.exports = View.extend({

		name:'indicator',
		initialize: function() {
	    	this.render();
	  	},
	  	render: function() {
	  		this.el.innerHTML = this.template();
	  		this.els.hdrstatus = find('.js-hdrstatus', this.el);
	  		this.els.geotagging = find('.js-geotagging', this.el);
	  		this.els.capturetimer = find('.js-capturetimer', this.el);
	  		this.els.batterystatus = find('.js-batterystatus', this.el);

	  	},
	  	template: function(){
	  		return "<ul><li class='js-capturetimer  captureIndicator rotates'></li>"+
	  		"<li class='js-geotagging  geotagging rotates'></li>"+
	  		"<li class='js-hdrstatus  hdrstatus rotates'></li></ul>"+
	  		"<li class='js-batterystatus  batteryStatus rotates'></li></ul>";
	  	},
	  	setHDRindicator:function(value){
	  		this.els.hdrstatus.setAttribute("data-mode",value);
	  	},
	  	setGeoTagging:function(value){
	  		this.els.geotagging.setAttribute("data-mode",value);
	  	},
	  	setCaptureTimer:function(value){
	  		this.els.capturetimer.setAttribute("data-mode",value);
	  	},
	  	setBatteryStatus:function(value,charging){
	  		console.log("  value:: "+value+"  charging:: "+charging);
	  		this.els.batterystatus.setAttribute("data-value",value);
	  		this.els.batterystatus.setAttribute("data-mode",charging);
	  	},


	});


});
define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('views/gridview');
//var View = require('vendor/view');
var find = require('utils/find');
var bind = require('utils/bind');
var proto = View.prototype;
/**
 * Exports
 */
 module.exports = View.extend({
  name:"settings",
  dataArray:new Array(),

/**
*
*
*
*/
   setSettingMenuObj:function(dataObj)
   {
     this.dataArray = dataObj;
   },
   
/**
*
*
*
*/
   getSettingMenuObj:function (){
      return this.dataArray;
   },
  
/**
*
*
*
*/

 });

});
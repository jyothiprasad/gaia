define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */
var debug = require('debug')('view:selftimer');
var View = require('vendor/view');
var bind = require('lib/bind');
var find = require('lib/find');
/**
 * Exports
 */

module.exports = View.extend({
  name:"selftimer",
  addTimerUI:function(value){
    var divEle = document.createElement('div');
    divEle.id = "timerDiv"; 
    divEle.classList.add('capturetimer');
    divEle.setAttribute("data-value",value.toString());
    var span = document.createElement('span');
    span.id = "valueSpan";
    span.innerHTML = value;
    
    divEle.appendChild(span);
    document.body.appendChild(divEle);
  },
  updateTumerUI:function(value){
    var elem = find('#timerDiv', document);
    var span = find('#valueSpan',elem);
    span.innerHTML = value;
    elem.setAttribute("data-value",value.toString());
    if(value == 0)
      this.addLastTimeWrapper();
  },
  removeTimerUI:function(){
    var elem = find('#timerDiv', this.elem);
    elem.innerHTML = "";
    elem.parentNode.removeChild(elem);
  },
  addLastTimeWrapper:function(){
    var divEle = document.createElement('div');
    divEle.classList.add('captureDiv');
    document.body.appendChild(divEle);
    setTimeout(function(){
      divEle.parentNode.removeChild(divEle);
    },1000);
  },
  addThumbnail: function() {
    var thumbnail = new Image();
    thumbnail.id="thumbnail-button";
    thumbnail.classList.add('thumbnail-btn');
    return this.els.thumbnailButton.appendChild(thumbnail);
  },
});

});
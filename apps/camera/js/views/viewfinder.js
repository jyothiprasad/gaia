define(function(require) {
'use strict';

/**
 * Dependencies
 */

var bind = require('lib/bind');
var CameraUtils = require('lib/camera-utils');
var debug = require('debug')('view:viewfinder');
var constants = require('config/camera');
var View = require('vendor/view');
var find = require('lib/find');
/**
 * Locals
 */

var MIN_VIEWFINDER_SCALE = constants.MIN_VIEWFINDER_SCALE;
var MAX_VIEWFINDER_SCALE = constants.MAX_VIEWFINDER_SCALE;
var lastTouchA = null;
var lastTouchB = null;
var isScaling = false;
var scale = 1.0;
var touchFocusPt = {x: 0, y: 0};
var touchFocusDone = false;

var getNewTouchA = function(touches) {
  if (!lastTouchA) return null;
  for (var i = 0, length = touches.length, touch; i < length; i++) {
    touch = touches[i];
    if (touch.identifier === lastTouchA.identifier) return touch;
  }
  return null;
};

var getNewTouchB = function(touches) {
  if (!lastTouchB) return null;
  for (var i = 0, length = touches.length, touch; i < length; i++) {
    touch = touches[i];
    if (touch.identifier === lastTouchB.identifier) return touch;
  }
  return null;
};

var getDeltaScale = function(touchA, touchB) {
  if (!touchA || !lastTouchA || !touchB || !lastTouchB) return 0;

  var oldDistance = Math.sqrt(Math.pow(lastTouchB.pageX -
                                       lastTouchA.pageX, 2) +
                    Math.pow(lastTouchB.pageY - lastTouchA.pageY, 2));
  var newDistance = Math.sqrt(Math.pow(touchB.pageX - touchA.pageX, 2) +
                    Math.pow(touchB.pageY - touchA.pageY, 2));
  return newDistance - oldDistance;
};

return View.extend({
  name: 'viewfinder',
  tag: 'video',
  className: 'js-viewfinder',
  fadeTime: 200,
  initialize: function() {
    bind(this.el, 'click', this.onClick);
    bind(this.el, 'touchstart', this.onTouchStart);
    bind(this.el, 'touchmove', this.onTouchMove);
    bind(this.el, 'touchend', this.onTouchEnd);
    this.el.autoplay = true;
  },

  onClick: function() {
    this.emit('click');
  },

  onTouchStart: function(evt) {
    var touchCount = evt.touches.length;
    if (touchCount === 2) {
      lastTouchA = evt.touches[0];
      lastTouchB = evt.touches[1];
      isScaling = true;
    } else if (touchCount === 1 && touchFocusDone === false) {
      touchFocusPt.x = evt.touches[0].pageX;
      touchFocusPt.y = evt.touches[0].pageY;
      this.emit('touchFocusPts');
      touchFocusDone = true;
    }
  },

  setTouchFocusDone: function() {
    // to avoid multiple calls to
    // set auto focus
    touchFocusDone = false;
  },

  getTouchFocusPts: function() {
    return touchFocusPt;
  },

  onTouchMove: function(evt) {
    if (!isScaling) {
      return;
    }

    var touchA = getNewTouchA(evt.touches);
    var touchB = getNewTouchB(evt.touches);

    var deltaScale = getDeltaScale(touchA, touchB);

    scale *= 1 + (deltaScale / 100);

    this.setScale(scale);

    lastTouchA = touchA;
    lastTouchB = touchB;
    this.emit('touchmove');
  },

  onTouchEnd: function(evt) {
    var touchCount = evt.touches.length;
    if (touchCount < 2) {
      isScaling = false;
    }
  },

  setScale: function(scale) {
    scale = Math.min(Math.max(scale, MIN_VIEWFINDER_SCALE),
                     MAX_VIEWFINDER_SCALE);
    //this.el.style.transform = 'scale(' + scale + ', ' + scale + ')';  // temp. block by hyuan
  },

  /** 
  * [hyuna] get the scale value
  * To-Do: Will remove this code
  */
  getScale: function() {
    //console.log("getScale: "+scale);
    return scale;
  },

  setPreviewStream: function(previewStream) {
    this.el.mozSrcObject = previewStream;
  },

  setStream: function(stream, done) {
    this.setPreviewStream(stream);
    this.startPreview();
  },

  startPreview: function() {
    this.el.play();
  },

  stopPreview: function() {
    this.el.pause();
  },

  fadeOut: function(done) {
    this.el.classList.add('fade-out');

    if (done) {
      setTimeout(done, this.fadeTime);
    }
  },

  fadeIn: function(done) {
    this.el.classList.remove('fade-out');

    if (done) {
      setTimeout(done, this.fadeTime);
    }
  },

  updatePreview: function(previewSize, mirrored) {
    debug('update preview, mirrored: %s', mirrored);
    // Use the device-independent viewport size for transforming the
    // preview using CSS
    var deviceIndependentViewportSize = {
      width: document.body.clientHeight,
      height: document.body.clientWidth
    };

    // Scale the optimal preview size to fill the viewport (will
    // overflow if necessary)
    var scaledPreviewSize = CameraUtils.scaleSizeToFitViewport(
                              deviceIndependentViewportSize,
                              previewSize);

    this.el.style.width = scaledPreviewSize.width + 'px';
    this.el.style.height = scaledPreviewSize.height + 'px';

    // Rotate the preview image 90 degrees
    var transform = 'rotate(90deg)';

    if (mirrored) {
      // backwards-facing camera
      transform += ' scale(-1, 1)';
    }

    this.el.style.transform = transform;

    var offsetX = (deviceIndependentViewportSize.height -
                   scaledPreviewSize.width) / 2;
    var offsetY = (deviceIndependentViewportSize.width -
                   scaledPreviewSize.height) / 2;

    this.el.style.left = offsetX + 'px';
    this.el.style.top = offsetY + 'px';
    var grid = find('#PreviewframeGrid',document);
    if(grid)
    {
      this.setGridPosition(grid,previewSize,mirrored);
    }
  },
  addGridPreview: function(previewSize,mirrored){
    var grid = find('#PreviewframeGrid',document);
    if(grid)
    {
      this.setGridPosition(grid,previewSize,mirrored);
      return;
    }
    var gridDiv = document.createElement("Div");
    gridDiv.classList.add('frameGrid');
    gridDiv.id = "PreviewframeGrid";
    this.setGridPosition(gridDiv,previewSize);
    gridDiv.appendChild(this.appentGrid());
    document.body.appendChild(gridDiv);
  },
  setGridPosition: function(gridDiv,previewSize,mirrored){
    var deviceIndependentViewportSize = {
      width: document.body.clientHeight,
      height: document.body.clientWidth
    };
    var scaledPreviewSize = CameraUtils.scaleSizeToFillViewport(
                              deviceIndependentViewportSize,
                              previewSize);
    gridDiv.style.width = scaledPreviewSize.width + 'px';
    gridDiv.style.height = scaledPreviewSize.height + 'px';
    var transform = 'rotate(90deg)';
    if (mirrored) {
      // backwards-facing camera
      transform += ' scale(-1, 1)';
    }
    gridDiv.style.transform = transform;
    var offsetX = (deviceIndependentViewportSize.height -
                   scaledPreviewSize.width) / 2;
    var offsetY = (deviceIndependentViewportSize.width -
                   scaledPreviewSize.height) / 2;
    gridDiv.style.left = offsetX + 'px';
    gridDiv.style.top = offsetY + 'px';
  },
  appentGrid:function(){
    var table = document.createElement("table");
     for(var i=0;i<3;i++)
     {
        var tr = document.createElement("tr");
        for(var j=0; j<3 ; j++){
          var td = document.createElement("td");
          tr.appendChild(td);
        }
        table.appendChild(tr);
     }
     return table;
  },
  removeGridPreview: function (){
    var grid = find('#PreviewframeGrid',document);
    if(grid)
    {
      grid.innerHTML = "";
      grid.parentNode.removeChild(grid);
    }
  },
});

});

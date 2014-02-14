define(function(require) {
'use strict';

/**
 * Dependencies
 */

var bind = require('utils/bind');
var CameraUtils = require('utils/camera-utils');
var constants = require('config/camera');
var View = require('vendor/view');
var find = require('utils/find');
/**
 * Locals
 */

var MIN_VIEWFINDER_SCALE = constants.MIN_VIEWFINDER_SCALE;
var MAX_VIEWFINDER_SCALE = constants.MAX_VIEWFINDER_SCALE;
var lastTouchA = null;
var lastTouchB = null;
var isScaling = false;
var scale = 1.0;
var touchPt ={ x:0,y:0};

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
  tag: 'video',
  className: 'viewfinder js-viewfinder',
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
    }
    if (touchCount === 1) {
      touchPt.x = evt.touches[0].pageX;
      touchPt.y = evt.touches[0].pageY;

      this.emit('touchFocusMode');
    }
  },

  getTouchPoints: function() {
  //  console.log("CCC touchPt.x:"+touchPt.x);
  //  console.log("CCC touchPt.y:"+touchPt.y);
    return touchPt;
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
    //this.el.style.transform = 'scale(' + scale + ', ' + scale + ')';
  },

  getScale: function() {
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
    console.log('GGG offsetY: '+offsetY);
    console.log('GGG offsetX: '+offsetX);
    // For Demo
    var xxx = -1 * offsetX;
    if (xxx < 80 && xxx > 50)
      offsetY =  75;
    else if (xxx < 50)
      offsetY = 110;

    this.el.style.left = offsetX + 'px';
    this.el.style.top = offsetY + 'px';

    var grid = find('#PreviewframeGrid',document);
    if(grid)
    {
      this.setGridPosition(grid,previewSize,mirrored);
    }
  },

  addGridPreview: function(previewSize,mirrored){
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
    var scaledPreviewSize = CameraUtils.scaleSizeToFitViewport(
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

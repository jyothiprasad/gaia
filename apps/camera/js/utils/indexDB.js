define(function(require, exports, module) {
'use strict';

var settingConstants = require('config/settings');
var cameraConstants = require('config/camera');

module.exports = {
  DB_NAME  : "Camera_Settings",	
  DB_VERSION :1,
  DB_CAMERA_STORE_NAME :'CameraSettings',
  DB_CAMCORDER_STORE_NAME:'CamcorderSettings',
  DB_OBJECT:null,
  RECORD_COUNT:0,
  camMode:'',
    init: function IndexDB_init(done){
      window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      if (!window.indexedDB) {
        console.log("IDBDatabese Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
      }
      var request = indexedDB.open(this.DB_NAME , 2);

      request.onerror = function(event) {
        console.log("IDBDatabese Database error: " + event.target.errorCode);
      };
      var self =this;
      request.onupgradeneeded = function(event) {
        self.DB_OBJECT = event.target.result;
       	self.cerateCameraStore(event);
        self.createCamcorderStore(event);		  	
      };

      request.onsuccess = function(event) {
        self.DB_OBJECT  = event.target.result;
        //self.clearObjectStore(cameraConstants.CAMERA_MODE_TYPE.PHOTO);//clearing existing objetcs
        //self.clearObjectStore(cameraConstants.CAMERA_MODE_TYPE.VIDEO);
        self.checkDBEntry(cameraConstants.CAMERA_MODE_TYPE.PHOTO);
        setTimeout(function(){
          self.checkDBEntry(cameraConstants.CAMERA_MODE_TYPE.VIDEO,onInitComplete);
          function onInitComplete() {
            done();
          }
        },50);
      };
    },

	resume:function IndexDB_resume(){
		window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
		if (!window.indexedDB) {
   		  console.log("IDBDatabese Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
		}
		var request = indexedDB.open(this.DB_NAME , 2);

		request.onerror = function(event) {
		  	console.log("IDBDatabese resume Database error: " + event.target.errorCode);
		};
		var self =this;
		request.onsuccess = function(event) {
		  	self.DB_OBJECT  = event.target.result;
			console.log("IDBDatabese resume Database Success: " + event.target.result);
		};
	},
	cerateCameraStore: function IndexDB_cerateCameraStore(event){
	  var self = this;
	  var store = event.currentTarget.result.createObjectStore(
     // IndexDB.DB_CAMERA_STORE_NAME, { keyPath: 'id', autoIncrement: true });\	    
      //store.createIndex('settings', 'settings', { unique: true });
       self.DB_CAMERA_STORE_NAME, { keyPath: 'settings',unique: true });
      store.createIndex('value', 'value', { unique: false });
		
	},
	createCamcorderStore: function IndexDB_createCamcorderStore(event){
	  var self = this;
	  var store = event.currentTarget.result.createObjectStore(
     // IndexDB.DB_CAMCORDER_STORE_NAME, { keyPath: 'id', autoIncrement: true });
     // store.createIndex('settings', 'settings', { unique: true });
     self.DB_CAMCORDER_STORE_NAME, { keyPath: 'settings',unique: true});
      store.createIndex('value', 'value', { unique: false });
	},
	getObjectStore: function IndexDB_getObjectStore(store_name, mode) {
		console.log("IDBDatabese getObjectStore start:: "+this.DB_OBJECT);
		var storeObj = null;
		if(store_name == "photo")
	  	{
	  		storeObj = this.DB_CAMERA_STORE_NAME;
	  	}
	  	else{
	  		storeObj = this.DB_CAMCORDER_STORE_NAME;
	  	}
	    var tx = this.DB_OBJECT.transaction(storeObj, mode);
	    
	    return tx.objectStore(storeObj);
 	},
 	
  clearObjectStore: function IndexDB_clearObjectStore(store_name) {
 	var store = null;
  	store = this.getObjectStore(store_name,'readwrite');
  	
    var req = store.clear();
    req.onsuccess = function(evt) {
     console.log("IDBDatabese Object cleared successfuly");
    };
    req.onerror = function (evt) {
        console.log("IDBDatabese fail to clear  Object ");
    };
  },
  getIndexItem: function IndexDB_getIndexItem(store_name){
  	 if (typeof store_name == 'undefined')
     	 return;
     	 
  	var store  = this.getObjectStore(store_name,'readonly');
    var key = IDBKeyRange.lowerBound(0);
    var cursor = store.openCursor(key);
    var x=0;

    cursor.onsuccess = function(event){
        var result = event.target.result;
        if(result)
        {
            x++;
            var charx=x.toString();
           console.log("IDBDatabese Results :: "+result.value['settings']+" :: "+result.value['value']);
            result.continue();
        }
        else 
        return;
    };
  },
  checkDBEntry: function IndexDB_checkDBEntry(store_name, done){
  	console.log("IDBDatabese checkDBEntry start:: "+this.DB_OBJECT);
  	var store  = this.getObjectStore(store_name,'readonly');
    var key = IDBKeyRange.lowerBound(0);
    var cursor = store.openCursor(key);
    var x=0;
	var self =this;
    cursor.onsuccess = function(event){
    	console.log("IDBDatabese checkDBEntry onsuccess:: ");
        var result = event.target.result;
        if(result)
        {
           x++;
           var charx=x.toString();
           if(store_name == 'photo')
           	settingConstants.cameraPersisItems[result.value['settings']] = result.value['value'];
           else
           	settingConstants.camcorderPersisItems[result.value['settings']] = result.value['value'];
           result.continue();
        }
        else if(x==0)
        	self.setRecordInitialy(store_name);
        else
          self.setPersistArray(store_name);
       
       if(done) {
         done();	
       }        	
	};     	  
  },

setPersistArray: function IndexDB_setPersistArray(mode){

  var obj = settingConstants.CameraMenuItems.video;
 
  if(mode == "photo") {
    obj = settingConstants.CameraMenuItems.photo;

    for(k in obj) {
      if(obj[k].persistant) {
        obj[k].value = settingConstants.cameraPersisItems[k] ;
      }
    }
  } else {
  	for(k in obj) {
      if(obj[k].persistant) {
        obj[k].value = settingConstants.camcorderPersisItems[k] ;
      }
    }
  }
},

setRecordInitialy:function IndexDB_setRecordInitialy(store_name){
  	
  	var objArray = null;  
     if(store_name == 'photo')
     	 objArray = settingConstants.cameraPersisItems;     
     else
     	 objArray = settingConstants.camcorderPersisItems;
     
     var store  = this.getObjectStore(store_name,'readwrite');
 	for(k in objArray)
 	{
 		var obj={settings:k,value:objArray[k]};
 		var request = store.put(obj);
 	}
 	var self =this;
 	setTimeout(function(){self.checkDBEntry(store_name);},500);
 			
 },
  updateRecord:function  IndexDB_updateRecord(store_name,settings,value){
  	var store  = this.getObjectStore(store_name,'readwrite');  	
  	var request = store.openCursor(IDBKeyRange.only(settings));
 		request.onerror = function(event) {
 		 // Handle errors!
 		 console.log("Error while getting Data ::"+event.target.error.message);
		};
 	
 	request.onsuccess = function(event) {
 		var cursor = event.target.result;
 		if(cursor) {
	 		if(cursor.key == settings) {
	 			//console.log("Cursor Value ::"+cursor.value.value);
	 			cursor.value.value = value;
	 			//console.log("Cursor Value ::"+cursor.value.value);
	 			var requestpro = cursor.update(cursor.value );

		        requestpro.onsuccess = function(e) {
		          // take further action once the record is successfully updated
		           console.log("Success while updating::"+e.target.result);
		        };
		          requestpro.onerror = function(e) {
		          // take further action once the record is successfully updated
		          console.log("Error while updating::"+e.target.error.message);
		        };
	 		}
	 		 cursor.continue();
	 	}
 	};
	
  },
  getRecordCount: function IndexDB_getRecordCount(store){
    var req = store.count();
    req.onsuccess = function(evt) {
       this.RECORD_COUNT = evt.target.result;
    };
    req.onerror = function(evt) {
      console.error("add error", this.error);
    };

  },
  
  closeIndexDB: function IndexDB_closeIndexDB(){
  	console.log("IDBDatabese onclose called");
  	this.DB_OBJECT.close();
  },

};

});
/*
 *These is a generic file that handles the Low Battery Scenario.
 *It accepts two inputs from the user namely - an array & a callback function
 *The array consists of the battery levels (numbers) that the app is intersted in. EG:- [5,10,15]
 *Note:- The array must be in ascending order
 *The second parameter is of the form function(value){ } that is passed to the function addBatteryListener
 *The app will call BatteryHelper.addBatteryListener([5,10,15], function(value){ ... } )
 *What these File does:- It will execute the corresponding callback function depending on the battery value if it is below the array value that the app has provided.
 *there by handling the Low Battery Scenario.
 */
var BatteryHelper = (function(){

  var battery = navigator.battery || navigator.mozBattery;
  var criticalValue,statusCallback,length;
  var flag = new Array();

  function lowBatteryCondition(value) {
    for (var i = 0; i < length; i++)
    {
      if((value < criticalValue[i]) && (flag[i] == 0))
        {
          flag[i] = 1;
          return statusCallback(value);
        }
    }
  }

  function battery_status() {
    var charging = navigator.battery.charging;
    if(battery) {
      var value = Math.round(battery.level * 100);
      if (charging) {
        for (var k = 0; k < length; k++) {
          flag[k] = 0;
        }
      }
      else {
        lowBatteryCondition(value);
      }
    }
  }

  function addBatteryListener(critical, callback) {
    criticalValue= critical;
    statusCallback = callback;
    length = critical.length;
    flag.length = length;
    for (var j = 0; j < length; j++) {
      flag[j] = 0;
    }
    //Check with the current level once.
    battery_status();
    battery.addEventListener('levelchange', battery_status);
  }
  
  return {
    addBatteryListener: addBatteryListener
  };
}());
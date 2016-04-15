// Load Grove module
var sensorModule = require('jsupm_ldt0028');

// Create the LDT0-028 Piezo Vibration Sensor object using AIO pin 0
var sensor = new sensorModule.LDT0028(1);

logVibrations();

function logVibrations()
{
    console.log(sensor.getSample());
    setTimeout(logVibrations, 1000);
}

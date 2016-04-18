var mraa = require('mraa');
var digitalAccelerometer = require('jsupm_mma7660');
var fs = require('fs');

// Config
var readPeriod = 50; // Read the acceleration every 50ms
var vibrationThreshold = 1.2; // Consider the washing machine to be vibrating if the acceleration value is > 1
var batchSize = 40; // Batch readings together in sets of 40
var maxStillReadingsCount = 180; // After 180 still readings (i.e. 6 mins of still readings) we assume the washing machine has stopped
var thresholdVibrationReadingsCount = 15; // We require 15 vibration readings (i.e. 30 seconds of continuous vibration) before we record the washing machine as started

// State
var isWashing = false;
var isVibrating = false;
var stillReadingsCount = 0;
var vibrationReadingsCount = 0;
var batchReadings = [];
var n = 0;

// LED
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

// Output
if (!fs.existsSync('data-output')) {
    fs.mkdir('data-output');
}
if (fs.existsSync('data-output/data.json')) {
    fs.unlinkSync('data-output/data.json');
}
if (fs.existsSync('data-output/data-full.txt')) {
    fs.unlinkSync('data-output/data-full.txt');
}

var jsonDataFile = 'data-output/data.json'; // This file holds the json for iteration no., mean and max values. Copy it into the data variable in chart.js to view a graph of the data
var fullOutputFile = 'data-output/data-full.txt'; // This file holds all of the log output

var myDigitalAccelerometer = new digitalAccelerometer.MMA7660(
    digitalAccelerometer.MMA7660_I2C_BUS,
    digitalAccelerometer.MMA7660_DEFAULT_I2C_ADDR);

myDigitalAccelerometer.setModeStandby();
myDigitalAccelerometer.setSampleRate(digitalAccelerometer.MMA7660.AUTOSLEEP_64);
myDigitalAccelerometer.setModeActive();

var ax = digitalAccelerometer.new_floatp();
var ay = digitalAccelerometer.new_floatp();
var az = digitalAccelerometer.new_floatp();

function logOutput (s) {
    console.log(s);
    fs.appendFile(fullOutputFile, s + '\n', function (err) { if (err) { console.log(err); }});
}

function writeJsonData (x) {
    fs.appendFile(jsonDataFile, JSON.stringify(x) + ',\n', function (err) { if (err) { console.log(err); }});
}

function accelerometer() {
    myDigitalAccelerometer.getAcceleration(ax, ay, az);
    var x = digitalAccelerometer.floatp_value(ax);
    var y = digitalAccelerometer.floatp_value(ay);
    var z = digitalAccelerometer.floatp_value(az);
    batchReadings.push({
        x: x,
        y: y,
        z: z,
        d: Math.sqrt(x*x + y*y + z*z) // the magnitude of the acceleration
    });
    if (batchReadings.length === batchSize) {
        var averageReading = 0;
        var maxReading = 0;
        batchReadings.forEach(function (r) { averageReading += r.d; if (r.d > maxReading) { maxReading = r.d; } });
        averageReading /= batchSize;
        n++;
        logOutput(n.toString());
        logOutput(averageReading + ' ' + maxReading);
        writeJsonData({i: n, mean: averageReading, max: maxReading });
        isVibrating = maxReading > vibrationThreshold;
        if (isWashing) {
            if (isVibrating) {
                stillReadingsCount = 0;
                isWashing = true;
            } else {
                stillReadingsCount += 1;
                if (stillReadingsCount === maxStillReadingsCount) {
                    isWashing = false;
                    stillReadingsCount = 0;
                    logOutput('ALERT! Washing machine has finished!');
                    myOnboardLed.write(0);
                }
            }
        } else {
            if (isVibrating) {
                vibrationReadingsCount += 1;
                if (vibrationReadingsCount === thresholdVibrationReadingsCount) {
                    isWashing = true;
                    vibrationReadingsCount = 0;
                    logOutput('Washing machine has started!');
                    myOnboardLed.write(1);
                }
            } else {
                vibrationReadingsCount = 0;
            }
        }

        batchReadings = [];
        logOutput(JSON.stringify({
            isVibrating: isVibrating,
            isWashing: isWashing,
            stillReadingsCount: stillReadingsCount,
            vibrationReadingsCount: vibrationReadingsCount
        }));
    }
}

process.on('SIGINT', function () {
  digitalAccelerometer.delete_floatp(ax);
  digitalAccelerometer.delete_floatp(ay);
  digitalAccelerometer.delete_floatp(az);

  myDigitalAccelerometer.setModeStandby();

  console.log("Exiting...");
  process.exit(1);
});

periodicActivity();

function periodicActivity()
{
    accelerometer();
    setTimeout(periodicActivity, readPeriod);
}

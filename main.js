var mraa = require('mraa');
var digitalAccelerometer = require('jsupm_mma7660');

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

// LED
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

var myDigitalAccelerometer = new digitalAccelerometer.MMA7660(
    digitalAccelerometer.MMA7660_I2C_BUS,
    digitalAccelerometer.MMA7660_DEFAULT_I2C_ADDR);

myDigitalAccelerometer.setModeStandby();
myDigitalAccelerometer.setSampleRate(digitalAccelerometer.MMA7660.AUTOSLEEP_64);
myDigitalAccelerometer.setModeActive();

var ax = digitalAccelerometer.new_floatp();
var ay = digitalAccelerometer.new_floatp();
var az = digitalAccelerometer.new_floatp();

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
        console.log(n);
        console.log(averageReading, maxReading);
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
                    console.log('ALERT! Washing machine has finished!');
                    myOnboardLed.write(0);
                }
            }
        } else {
            if (isVibrating) {
                vibrationReadingsCount += 1;
                if (vibrationReadingsCount === thresholdVibrationReadingsCount) {
                    isWashing = true;
                    vibrationReadingsCount = 0;
                    console.log('Washing machine has started!');
                    myOnboardLed.write(1);
                }
            } else {
                vibrationReadingsCount = 0;
            }
        }

        batchReadings = [];
        console.log({
            isVibrating: isVibrating,
            isWashing: isWashing,
            stillReadingsCount: stillReadingsCount,
            vibrationReadingsCount: vibrationReadingsCount
        });
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

var digitalAccelerometer = require('jsupm_mma7660');

// Config
var readPeriod = 200; // Read the acceleration every 200ms
var vibrationThreshold = 1.0; // Consider the washing machine to be vibrating if the acceleration value is > 1
var batchSize = 10; // Batch readings together in sets of 10
var maxStillReadingsCount = 5; // After 60 still readings (i.e. 2 mins of still readings) we assume the washing machine has stopped
var thresholdVibrationReadingsCount = 5; // We require 60 vibration readings (i.e. 2 mins of continuous vibration) before we record the washing machine as started

// State
var isWashing = false;
var isVibrating = false;
var stillReadingsCount = 0;
var vibrationReadingsCount = 0;
var batchReadings = [];

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
        batchReadings.forEach(function (r) { averageReading += r.d; });
        averageReading /= batchSize;
        console.log(averageReading);
        isVibrating = averageReading > vibrationThreshold;
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
                }
            }
        } else {
            if (isVibrating) {
                vibrationReadingsCount += 1;
                if (vibrationReadingsCount === thresholdVibrationReadingsCount) {
                    isWashing = true;
                    vibrationReadingsCount = 0;
                    console.log('Washing machine has started!')
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
    var val = accelerometer();
    setTimeout(periodicActivity, readPeriod);
}


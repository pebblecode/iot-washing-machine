var digitalAccelerometer = require('jsupm_mma7660');

var vibrationThreshold = 1;

var isWashing = false;
var isVibrating = false;
var stillReadingsCount = 0;
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
    return {
        x: x,
        y: y,
        z: z,
        d: Math.sqrt(x*x + y*y + z*z) // the magnitude of the acceleration
    };
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
    console.log(val);
    setTimeout(periodicActivity, 2000); // Log out the acceleration values every 2 seconds
}


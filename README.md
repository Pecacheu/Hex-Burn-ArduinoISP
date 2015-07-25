# Hex-Burn-ArduinoISP
Burn firmware to an Arduino using another one as an ISP

This is a simple [Node.js](https://nodejs.org) script that uses avrdude included in the Arduino IDE to burn hex firmware files to an Arduino. If you have Node.js installed, you can run it with `node hex-burn-ArduinoISP.js`. For more information on how to setup the ArduinoISP sketch, see http://www.arduino.cc/en/Tutorial/ArduinoISP.

## Setup
Before using this script, make sure to set the folowing variables:

1. **pathToAvrdude**: Path to avrdude. Will be somthing like `[Arduino Install Dir]/hardware/tools/avr/bin/avrdude`.
2. **pathToConfig**: Path to avrdude.conf file. Will be somthing like `hardware/tools/avr/etc/avrdude.conf`.
3. **burnFile**: The file you want to burn, of course.
4. **processorName**: The sorthand of the processor you want to burn to.<br>
To list all possible values, just change it to something random like `blah` and run the script.

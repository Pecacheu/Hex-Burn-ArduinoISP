/*<legalstuff>
This work is licensed under a Creative Commons Attribution 4.0 International License. Visit http://creativecommons.org/licenses/by/4.0/ for details.
</legalstuff>*/

//Hex-Burn-ArduinoISP, by Pecacheu.

//Burn HEX bootloader files to Arduino using ArduinoISP sketch.
//For instructions on setting up ArduinoISP, see "http://www.arduino.cc/en/Tutorial/ArduinoISP".
//Make sure to select the right processorName for your processor.

//----- CONFIGURATION OPTIONS:

var burnFile = "path/to/file.hex"; //<- HEX file to burn.
var processorName = "m16u2"; //(m16u2 is the serial chip used in the Arduino Uno and Mega R3. Use the correct ICSP header!)

var pathToAvrdude = "/Applications/Arduino.app/Contents/Java/hardware/tools/avr/bin/avrdude";
var pathToConfig = "/Applications/Arduino.app/Contents/Java/hardware/tools/avr/etc/avrdude.conf";

var deleteDir = false; //<- Delete Entire Module Directory and Reinstall if Incomplete
var autoInstallOptionals = false; //<- Also Install Optional Packages During Required Package Installation
var npmInstallNames = ["serialport", "chalk"]; //<- Dependencies List
var optionalInstall = []; //<- Optional Dependencies (That's an oxymoron)

//----- END OF CONFIG OPTIONS

var dirname = __dirname,
fs = require('fs'),
http = require('http'),
spawn = require('child_process').spawn,
exec = require('child_process').exec;

console.log("Checking for Dependencies...");

if(verifyDepends()) {
	var chalk = require('chalk'),
	SerialObject = require('serialport');
	console.log(chalk.gray("All Dependencies Found!")); console.log();
	
	selectPort(function(serialPort) {
		var cmd = spawn(pathToAvrdude, ["-C"+pathToConfig, "-p"+processorName, "-P"+serialPort, "-b"+"19200", "-c"+"stk500v1", "-U"+dirname+"/"+burnFile]);
		cmd.stdout.pipe(process.stdout); cmd.stderr.pipe(process.stdout);
		
		cmd.on('close', function(code) {
			console.log("Finished burning file: "+burnFile);
			process.exit();
		});
	});
} else {
	console.log("Dependencies Missing!"); console.log();
	runJSLoader();
}

function verifyDepends() {
	var pathsExist = true;
	for(var n=0; n<npmInstallNames.length; n++) {
		if(!fs.existsSync(dirname+"/node_modules/"+npmInstallNames[n])) { pathsExist = false; break; }
	}
	return pathsExist;
}

function selectPort(completionFunc) {
	// list available ports in command line:
	SerialObject.list(function(err, ports) {
		console.log(chalk.yellow("--------- Available Ports ---------"));
		for(var i=0; i < ports.length; i++) {
			var commString = "["+(i+1)+"] "+ports[i].comName;
			if(ports[i].manufacturer) commString += (", Brand = '"+ports[i].manufacturer+"'");
			console.log(commString);
		}
		console.log(chalk.yellow("-----------------------------------"));
		console.log();
		console.log(chalk.cyan("Please enter the port you want to use:"));
		// wait for user input:
		function onPortSelectInput(newPort) {
			newPort = newPort.replace(/\n/g, ""); newPort = newPort.replace(/\r/g, "");
			var portExists = false;
			for(var i=0; i < ports.length; i++) if(newPort == ports[i].comName) { portExists = true; break; }
			if(!portExists && Number(newPort) && ports[Number(newPort)-1]) {
				newPort = ports[Number(newPort)-1].comName; portExists = true;
			}
			if(portExists) {
				console.log(chalk.bgGreen.black("Using port \""+newPort+"\""));
				process.stdin.removeListener('data', onPortSelectInput);
				completionFunc(newPort);
			} else {
				console.log(chalk.bgRed.black("Port \""+newPort+"\" does not exist!"));
			}
		}
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', function(text) {
			if(text.search('\n') != -1) text = text.substring(0, text.search('\n'));
			if(text.search('\r') != -1) text = text.substring(0, text.search('\r'));
			if(text == "exit" || text == "quit") {
				console.log(chalk.magenta("Exiting..."));
				process.exit();
			}
		});
		process.stdin.on('data', onPortSelectInput);
	});
}

function runJSLoader() {
	console.log("Starting Installer..."); console.log();
	checkInternet(function(res) {
		if(res) {
			doInstall();
		} else {
			console.log("Error: No Internet Connection Detected!");
			console.log(); process.exit();
		}
	});
}

function doInstall() {
	if(deleteDir) { console.log("Emptying Install Directory..."); deleteFolder(dirname+"/node_modules/"); console.log(); }
	console.log("Installing Node.js Modules...");
	if(autoInstallOptionals) npmInstallNames = npmInstallNames.concat(optionalInstall);
	var i = 0; runinternal();
	function runinternal() {
		if(i >= npmInstallNames.length) { deleteFolder(dirname+"/etc"); console.log("Installer Finished. Exiting..."); console.log(); process.exit(); }
		else if(deleteDir || !fs.existsSync(dirname+"/node_modules/"+npmInstallNames[i])) {
			var module = npmInstallNames[i]; i++;
			var command = "npm install \""+module+"\" --prefix \""+dirname+"\"";
			console.log("Installing NPM Module: "+module);
			try{ exec(command, function(error, stdout, stderr) {
				console.log();
				if(error) { console.log("AN ERROR HAS OCCURRED!"); console.log(); console.log(error); }
				else if(stderr) { console.log("AN ERROR HAS OCCURRED!"); console.log(); console.log(stderr); }
				else {
					if(stdout) console.log(stdout);
					console.log("Module '"+module+"' Installed."); console.log();
					runinternal();
				}
			}); } catch(e) { console.log("Error Installing!"); return; }
		} else {
			var module = npmInstallNames[i]; i++;
			console.log("Skipping '"+module+"' Module."); console.log();
			runinternal();
		}
	}
}

function createNewFolder(path) {
	if(fs.existsSync(path)) deleteFolder(path);
	fs.mkdirSync(path);
}

function deleteFolder(path) {
	if(fs.existsSync(path)) { //If path exists:
		var fileList = fs.readdirSync(path);
		for(var t=0; t<fileList.length; t++) { 
			var currPath = path+"/"+fileList[t];
			if(fs.lstatSync(currPath).isDirectory()) { //If directory, recurse:
				deleteFolder(currPath);
			} else { //If file, delete it:
				fs.unlinkSync(currPath);
			}
		}
		fs.rmdirSync(path);
	}
}

function checkInternet(callback) {
	require('dns').resolve("www.google.com", function(err) { callback(!err); });
}

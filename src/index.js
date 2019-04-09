const {app, BrowserWindow} = require("electron");
const path = require("path");
const ipc = require("electron").ipcMain;
const dialog = require("electron").dialog;
const {Menu, Tray} = require("electron");
const launch = require("auto-launch");
const dgram = require("dgram");
const fs = require("fs");

let quit = false;
let appIcon = null;

let mainWindow = null;

function createTrayicon(){
	const contextMenu = Menu.buildFromTemplate([
		{label: "Quit", click: () => {
			mainWindow.close();
			mainWindow = null;
			app.quit();
		}}
	]);

	// eslint-disable-next-line no-undef
	let trayIcon = new Tray(path.join(__dirname, "windows-icon.png"));
	trayIcon.setContextMenu(contextMenu);
	trayIcon.setToolTip(app.getName());
	trayIcon.on("click", () => {
		mainWindow.focus();
		mainWindow.show();
	});
	return trayIcon;
}


app.on("ready", () =>{
	mainWindow = new BrowserWindow({
		width: 160,
		height: 165,
		skipTaskbar: true,
		resizable: false,
		alwaysOnTop : true,
		frame: false,
		fullscreenable: false,
		title: "Captureapp",
		autoHideMenuBar: true,
	});
	// eslint-disable-next-line no-undef
	mainWindow.loadURL(path.join("file://",  __dirname, "/index.html"));

	const dscreeen = require("electron").screen;
	let Displays = dscreeen.getAllDisplays();
	let sumWidth = 0;
	Displays.forEach((element) => {
		let tpWindow = new BrowserWindow({
			width: element.size.width,
			height: element.size.height,
			x: sumWidth,
			y: 0,
			transparent: true,
			frame: false,
			//movable: false,
			parent: mainWindow,
			hasShadow: false,
		});
		sumWidth += element.size.width;

		tpWindow.maximize();
		tpWindow.setIgnoreMouseEvents(true, {forward: true});
		tpWindow.loadURL((path.join("file://",  __dirname, "/Catcher.html")));
	});

	mainWindow.on("close", (event) => {
		if(!quit){
			event.preventDefault();
			mainWindow.hide();
		}
	});

	appIcon = createTrayicon();

	const sock = dgram.createSocket("udp4", (msg, rinfo) => {
		console.log("accept");
		const archiveDate = msg.toString("ascii", 0, rinfo.size);
		let archiveWindow = new BrowserWindow({
			width: 1920,
			height: 1080,
			skipTaskbar: true,
			autoHideMenuBar: true,
			title: archiveDate + "archive",
			useContentSize: true
		});
		archiveWindow.loadURL(path.join("file://",  __dirname, "/archive.html#" + archiveDate));
		archiveWindow.maximize();
		archiveWindow.focus();
	});

	sock.bind(1524, "127.0.0.1");

});

app.on("close", (event) => {
	if(!quit){
		event.preventDefault();
		mainWindow.hide();
		if(appIcon.isDestroyed())
			appIcon = createTrayicon();
	}
});

ipc.on("set-dir", (event) => {
	dialog.showOpenDialog({
		properties: ["openDirectory"]
	}, (dirpath) => {
		if(dirpath){
			event.sender.send("capture-directory", dirpath);
		}
	});
});

ipc.on("print-pdf", (event) => {
	event.sender.printToPDF({printBackground: true}, (err, buf) => {
		if(err) throw err;
		dialog.showSaveDialog({}, (filename) => {
			fs.writeFile(filename + ".pdf", buf, err => {
				if(err) throw err;
			});
		})
	});
})

ipc.on("mouseMoved", (event) => {
	mainWindow.webContents.send("enable-capture");
});
ipc.on("on-capture", (event) => {
	BrowserWindow.getAllWindows().forEach((element) =>{
		element.webContents.send("captured");
	});
});

ipc.on("create-newwindow", (event) => {
	let noteWindow = new BrowserWindow({
		width: 450,
		height: 230,
		skipTaskbar: true,
		autoHideMenuBar: true,
		fullscreenable: false,
		frame: false,
		title: "Capture Discriprion",
		parent: mainWindow,
	});

	noteWindow.loadURL(path.join("file://",  __dirname, "/note.html"));
});

const autoLaunch = new launch({
	name: "Captureapp",
	// eslint-disable-next-line no-undef
	path: process.execPath.match(/.*?\.exe/)[0],
	isHidden: true
});

autoLaunch.enable();

autoLaunch.isEnabled().then( (isEnabled) => {
	if(isEnabled){
		return;
	}
	autoLaunch.enable();
}).catch( err => {
	console.log(err);
	throw err;
});

app.on("before-quit", () => {
	quit = true;
});
const {app, BrowserWindow} = require("electron");
const path = require("path");
const ipc = require("electron").ipcMain;
const dialog = require("electron").dialog;
const {Menu, Tray} = require("electron");
const launch = require("auto-launch");

let quit = false;
let appIcon = null;

let mainWindow = null;

function createTrayicon(){
	const contextMenu = Menu.buildFromTemplate([
		{label: "Preference", click: () => {
			mainWindow.focus();
			mainWindow.show();
		}},
		{ type: "separator" },
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
		resizable: true,
		alwaysOnTop : true,
		frame: false,
		fullscreenable: false,
		title: "Captureapp",
		autoHideMenuBar: true,
	});
	// eslint-disable-next-line no-undef
	mainWindow.loadURL(path.join("file://",  __dirname, "/index.html"));

	mainWindow.on("close", (event) => {
		if(!quit){
			event.preventDefault();
			mainWindow.hide();
		}
	});

	appIcon = createTrayicon();
});

app.on("close", (event) => {
	if(!quit){
		event.preventDefault();
		mainWindow.hide();
		if(appIcon.isDestroyed())
			appIcon = createTrayicon();
	}
});

ipc.on("capture-on", (event) => {
	dialog.showOpenDialog({
		properties: ["openDirectory"]
	}, (dirpath) => {
		if(dirpath) event.sender.send("capture-directory", dirpath);
	});
});

ipc.on("set-pPath", (event) => {
	dialog.showOpenDialog({
		properties: ["openfile"]
	}, (ppath) => {
		if(ppath) event.sender.send("select-process", ppath);
	});
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
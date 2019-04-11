const ipc = require("electron").ipcRenderer;
const remote = require("electron").remote;

let savepath = null;
const win = remote.getCurrentWindow();

if (localStorage.getItem("savePath")) {
	savepath = JSON.parse(localStorage.getItem("savePath"));
}else{
	// eslint-disable-next-line no-undef
	savepath = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] + "/Documents";
}

async function screenshotAndClose(text){
	await ipc.send("Manual-capture", text);
	win.close();
}

document.getElementById("submit-btn").addEventListener("click", (event) => {
	screenshotAndClose(document.getElementById("discription-form").value);
});
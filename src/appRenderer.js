const capterer = require("electron").desktopCapturer;
const fs = require("fs");
const dscreeen = require("electron").screen;
const ipc = require("electron").ipcRenderer;
const moment = require("moment");
const remote = require("electron").remote;
const app = remote.app;

const DirectoryBtn = document.getElementById("set-directory-btn");

//保存するディレクトリを指定するためのipcイベントを送信
let savepath = null;
let enableCapture = false;

if (localStorage.getItem("savePath")) {
	savepath = JSON.parse(localStorage.getItem("savePath"));
}else{
	// eslint-disable-next-line no-undef
	savepath = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] + "/Documents";
}

DirectoryBtn.addEventListener("click", (event) => {
	ipc.send("set-dir");
});

ipc.on("capture-directory", (event, dirpath) => {
	if(dirpath) savepath = dirpath;
	localStorage.setItem("savePath", JSON.stringify(savepath));
	fs.writeFile(app.getPath("userData")+"/Local Storage/" + "path.txt", savepath, err => {
		if(err) throw err;
	});
});

ipc.on("enable-capture", (event) => {
	enableCapture = true;
});

//スクリーンショットをとる時間間隔を指定
const timeInput = document.getElementById("time-interval");
let IntervalTime = timeInput.value;
timeInput.addEventListener("change", () =>{
	IntervalTime = timeInput.value;
});

//実際にスクリーンショットを実行する処理
function CaptureScreen(text){
	const DisplaySize = dscreeen.getPrimaryDisplay().size;
	let txtContent = text;

	let captureOptions = {
		types: ["screen"],
		thumbnailSize: {
			width: DisplaySize.width,
			height: DisplaySize.height
		}
	};

	//ディレクトリのチェックと生成
	// eslint-disable-next-line no-undef
	if(savepath === null) savepath = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] + "/Documents";
	const pathdir = savepath +  "/Captureapp";
	const pathdirdate = pathdir + "/" +  moment().format("YYYY-MM-DD");
	const pathdirtxt = pathdirdate + "/" + "txt";
	const capturetime = moment().format("HH.mm.ss");
	if (!fs.existsSync(pathdir)) {
		fs.mkdirSync(pathdir);
	}
	if (!fs.existsSync(pathdirdate)) {
		fs.mkdirSync(pathdirdate);
		fs.writeFileSync(pathdirdate + "/archive.bat", "//&cls&node %0 %1&exit"  + "\n" + `const date = "${moment().format("YYYY-MM-DD")}"; const dgram = require('dgram');const Msg = new Buffer(date);const client = dgram.createSocket('udp4');async function Send(){client.send(Msg, 0, Msg.length, 1524, '127.0.0.1', (err, bytes)=>{if(err) throw err;client.close();process.exit(0);});}Send();`);
	}
	if (!fs.existsSync(pathdirtxt)) {
		fs.mkdirSync(pathdirtxt);
		fs.writeFileSync(pathdirtxt + "/_Dialy.txt", "");
	}

	capterer.getSources(captureOptions, (err, sources) => {
		if(err) throw err;

		sources.forEach( (source) => {
			if(source.name === "Entire screen" || source.name === "Screen 1" || source.name === "Screen 2"){
				const screenshotpath = pathdirdate + "/" + capturetime + "_" + source.name + ".jpg";

				fs.writeFile(screenshotpath, source.thumbnail.toJPEG(30), (err) => {
					if(err) throw err;
				});
			}
		});
	});

	const txtpath = pathdirtxt + "/" + capturetime + ".txt"
	fs.writeFile(txtpath, txtContent, (err) => {
		if(err) throw err;
	});
}

const ManualCapture = document.getElementById("capture-btn");
ManualCapture.addEventListener("click", (event) =>{
	ipc.send("create-newwindow");
});

let autoCaptureCheck = document.getElementById("is-Auto-Captured");
function DoneInterval_factorial(){
	if(autoCaptureCheck.checked && enableCapture){
		enableCapture = false;
		ipc.send("on-capture");
		CaptureScreen("");
	}
	setTimeout(DoneInterval_factorial, IntervalTime * 60000);
}
DoneInterval_factorial();

ipc.on("Manual-capture", (event, txt) => {
	CaptureScreen(txt);
})

//終了時、設定をlocalStrageへ保存
remote.getCurrentWindow().on("close", () => {
	localStorage.setItem("savePath", JSON.stringify(savepath));
});

// eslint-disable-next-line no-undef
if(process.platform == "win32"){
	remote.getCurrentWindow().on("session-end", () => {
		localStorage.setItem("savePath", JSON.stringify(savepath));
	});
}
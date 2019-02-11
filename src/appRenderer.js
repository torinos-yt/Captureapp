const capterer = require("electron").desktopCapturer;
const fs = require("fs");
const dscreeen = require("electron").screen;
const ipc = require("electron").ipcRenderer;
const moment = require("moment");
const remote = require("electron").remote;

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
	ipc.send("capture-on");
});

ipc.on("capture-directory", (event, dirpath) => {
	if(dirpath) savepath = dirpath;
	localStorage.setItem("savePath", JSON.stringify(savepath));
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
function screenshotInterval(text){
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
	}
	if (!fs.existsSync(pathdirtxt)) {
		fs.mkdirSync(pathdirtxt);
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
		screenshotInterval("");
	}
	setTimeout(DoneInterval_factorial, IntervalTime * 60000);
}
DoneInterval_factorial();

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
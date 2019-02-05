const capterer = require("electron").desktopCapturer;
const fs = require("fs");
const dscreeen = require("electron").screen;
const ipc = require("electron").ipcRenderer;
const moment = require("moment");
const remote = require("electron").remote;

const DirectoryBtn = document.getElementById("set-directory-btn");

//保存するディレクトリを指定するためのipcイベントを送信
let savepath = null;

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

//スクリーンショットをとる時間間隔を指定
const timeInput = document.getElementById("time-interval");
let IntervalTime = timeInput.value;
timeInput.addEventListener("change", () =>{
	IntervalTime = timeInput.value;
});

//実際にスクリーンショットを実行する処理
function screenshotInterval(){
	const DisplaySize = dscreeen.getPrimaryDisplay().size;

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
	if (!fs.existsSync(pathdir)) {
		fs.mkdirSync(pathdir);
	}
	if (!fs.existsSync(pathdirdate)) {
		fs.mkdirSync(pathdirdate);
	}

	capterer.getSources(captureOptions, (err, sources) => {
		if(err) throw err;

		sources.forEach( (source) => {
			if(source.name === "Entire screen" || source.name === "Screen 1" || source.name === "Screen 2"){
				const capturetime = moment().format("HH.mm.ss");
				const screenshotpath = pathdirdate + "/" + capturetime + "_" + source.name + ".jpg";

				fs.writeFile(screenshotpath, source.thumbnail.toJPEG(40), (err) => {
					if(err) throw err;
				});
			}
		});
	});
}

const ManualCapture = document.getElementById("capture-btn");
ManualCapture.addEventListener("click", (event) =>{
	screenshotInterval();
});

let autoCaptureCheck = document.getElementById("is-Auto-Captured");
function DoneInterval_factorial(){
	if(autoCaptureCheck.checked) screenshotInterval();
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
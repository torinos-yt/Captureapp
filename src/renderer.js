const capterer = require("electron").desktopCapturer;
const fs = require("fs");
const dscreeen = require("electron").screen;
const ipc = require("electron").ipcRenderer;
const moment = require("moment");
const os = require("os");
const powershell = require("node-powershell");
const pathmod = require("path");
const _ = require("lodash");
const remote = require("electron").remote;

const DirectoryBtn = document.getElementById("set-directory-btn");

//起動時にlocalStrageにある監視アプリのリストを取得
//同時に、要素分のli要素を生成
let processName = [];
if(localStorage.getItem("processList")){
	processName = JSON.parse(localStorage.getItem("processList"));

	for(let i = 0; i < processName.length; i++){
		let newLi = document.createElement("li");
		newLi.appendChild(document.createTextNode(processName[i] + ".exe"));
		newLi.id = "PList-" + i;

		let newBtn = document.createElement("button");
		newBtn.appendChild(document.createTextNode("-"));
		newBtn.id = "PList-Btn-" + i;
		newLi.appendChild(newBtn);

		const ProcessUl = document.getElementById("process-list");
		ProcessUl.appendChild(newLi);

		//要素生成と同時に、要素を削除するためのイベントハンドラを設置
		newBtn.addEventListener("click", () => {
			newLi.parentNode.removeChild(newLi);
			newBtn.parentNode.removeChild(newBtn);
			processName.splice(processName.indexOf(processName[i]));
		});
	}
}
let IntervalTime = 5.0;

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
});

//監視プロセスリストの追加
function addProcessList(path, listnum){
	const pName = pathmod.basename(path[0], ".exe");
	processName.push(pName);

	let newLi = document.createElement("li");
	newLi.appendChild(document.createTextNode(pName + ".exe"));
	newLi.id = "PList-" + listnum;

	let newBtn = document.createElement("button");
	newBtn.appendChild(document.createTextNode("-"));
	newBtn.id = "PList-Btn-" + listnum;
	newLi.appendChild(newBtn);

	const ProcessUl = document.getElementById("process-list");
	ProcessUl.appendChild(newLi);

	//要素生成と同時に、要素を削除するためのイベントハンドラを設置
	newBtn.addEventListener("click", () => {
		newLi.parentNode.removeChild(newLi);
		newBtn.parentNode.removeChild(newBtn);
		processName.splice(processName.indexOf(pName));
	});
}

//スクリーンショットをとる時間間隔を指定
const timeInput = document.getElementById("time-interval");
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

				fs.writeFile(screenshotpath, source.thumbnail.toJPEG(80), (err) => {
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

let ProcessExist = false;
function DoneInterval_factorial(){
	screenshotInterval();
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
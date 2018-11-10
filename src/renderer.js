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

const captureBtn = document.getElementById("capture-btn");
const caplog = document.getElementById("capture-log");

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

		const ProcessUl = document.getElementById("process-list");
		ProcessUl.appendChild(newLi);
		ProcessUl.appendChild(newBtn);

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
caplog.innerHTML = savepath;

captureBtn.addEventListener("click", (event) => {
	ipc.send("capture-on");
});
ipc.on("capture-directory", (event, dirpath) => {
	if(dirpath) savepath = dirpath;
	caplog.innerHTML = dirpath;
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

	const ProcessUl = document.getElementById("process-list");
	ProcessUl.appendChild(newLi);
	ProcessUl.appendChild(newBtn);

	//要素生成と同時に、要素を削除するためのイベントハンドラを設置
	newBtn.addEventListener("click", () => {
		newLi.parentNode.removeChild(newLi);
		newBtn.parentNode.removeChild(newBtn);
		processName.splice(processName.indexOf(pName));
	});
}

const setListBtn = document.getElementById("set-list-btn");
setListBtn.addEventListener("click", (event) => {
	ipc.send("set-pPath");
});
ipc.on("select-process", (event, ppath) => {
	if(ppath){
		let cnt = 0;
		while(true){
			let d = document.getElementById("PList-" + cnt);
			if(d === null) break;
			cnt++;
		}
		addProcessList(ppath, cnt);
	}
});

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
				const capturetime = moment().format("hh-mm-ss");
				const screenshotpath = pathdirdate + "/" + capturetime + "_" + source.name + ".png";

				fs.writeFile(screenshotpath, source.thumbnail.toPNG(), (err) => {
					if(err) throw err;

					caplog.innerHTML = screenshotpath;
				});
			}
		});
	});
}


//powershellに実行中プロセスのリストを要求し、指定したアプリが実行中か判定
//setTimeout()を再帰的に呼び出して、指定間隔でスクリーンショットを実行
let ps = new powershell({
	executionPolicy: "Bypass",
	noProfile: "true"
});

let ProcessExist = false;
function DoneInterval_factorail(){
	ProcessExist = false;
	ps.addCommand("Get-Process | Select-Object name");
	ps.invoke()
		.then(output => {
			const Process =  _.chain(output)
				.split(os.EOL)
				.invokeMap("trim")
				.uniq()
				.value();

			return Process;
		})
		.then(list => {
			for(let i = 0; i < processName.length; i++){
				if(_.includes(list, processName[i])){
					ProcessExist = true;
					break;
				}
			}
		})
		.then( () => {
			if(ProcessExist) screenshotInterval();
			setTimeout(DoneInterval_factorail, IntervalTime * 60000);
		});
}
DoneInterval_factorail();

//終了時、設定をlocalStrageへ保存
remote.getCurrentWindow().on("close", () => {
	localStorage.setItem("savePath", JSON.stringify(savepath));
	localStorage.setItem("processList", JSON.stringify(processName));
});

// eslint-disable-next-line no-undef
if(process.platform == "win32"){
	remote.getCurrentWindow().on("session-end", () => {
		localStorage.setItem("savePath", JSON.stringify(savepath));
		localStorage.setItem("processList", JSON.stringify(processName));
	});
}
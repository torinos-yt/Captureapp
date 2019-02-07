const capterer = require("electron").desktopCapturer;
const fs = require("fs");
const dscreeen = require("electron").screen;
const moment = require("moment");
const remote = require("electron").remote;

let savepath = null;
const win = remote.getCurrentWindow();

if (localStorage.getItem("savePath")) {
	savepath = JSON.parse(localStorage.getItem("savePath"));
}else{
	// eslint-disable-next-line no-undef
	savepath = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] + "/Documents";
}

//実際にスクリーンショットを実行する処理
function screenshotAndClose(text){
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
	const capturetime = moment().format("HH.mm.ss");
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
				const screenshotpath = pathdirdate + "/" + capturetime + "_" + source.name + ".jpg";

				fs.writeFileSync(screenshotpath, source.thumbnail.toJPEG(30), (err) => {
					if(err) throw err;
				});
			}
		});

		const txtpath = pathdirdate + "/" + capturetime + ".txt"
		fs.writeFileSync(txtpath, text, (err) => {
			if(err) throw err;
		});
		win.close();
	});
}

document.getElementById("submit-btn").addEventListener("click", (event) => {
	screenshotAndClose(document.getElementById("discription-form").value);
});
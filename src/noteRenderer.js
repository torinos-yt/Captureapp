const capterer = require("electron").desktopCapturer;
const fs = require("fs");
const dscreeen = require("electron").screen;
const ipc = require("electron").ipcRenderer;
const remote = require("electron").remote;

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

document.getElementById("submit-btn").addEventListener("click", (event) => {
	remote.getCurrentWindow().close();
});
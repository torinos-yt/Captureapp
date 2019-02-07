const ipc = require("electron").ipcRenderer;
let mouseMoved = false;


document.getElementById("body").addEventListener("mousemove", (event)=>{
    if(!mouseMoved){
        ipc.send("mouseMoved");
        mouseMoved = true;
    }
});

ipc.on("captured", (event) => {
    mouseMoved = false;
});
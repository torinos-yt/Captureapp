const fs = require("fs");
const path = require("path");
const app = require("electron").remote.app;
const {remote} = require("electron");
const {Menu, MenuItem} = remote
const ipc = require("electron").ipcRenderer;

const menu = new Menu();
menu.append(new MenuItem({ label: "Print", click() {
    console.log("print");
    ipc.send("print-pdf");
 } }));

window.addEventListener("contextmenu", err => {
    err.preventDefault();
    menu.popup({ window: remote.getCurrentWindow() })
}, false);

const date = location.hash.substring(1);
const imageUl = document.getElementById("image-list-ul");

const title = document.getElementById("title-date");
title.innerText = date + " Archive";

let Dirpath;

Promise.resolve()
    .then(() => {
        return new Promise( (resolve, reject) => {
            fs.readFile(app.getPath("userData")+"/Local Storage/path.txt", (err, data) => {
                if(err) throw err;
                Dirpath = data + "/Captureapp/" + date;
                console.log(Dirpath);
                resolve();
            });
        })
    })
    .then(() => {
        return new Promise( (resolve, reject) => {
            fs.readdir(Dirpath, (err, files) => {
                if(err) throw err
                const imagefiles = files.filter(filename => path.extname(filename) === ".jpg" || path.extname(filename) === ".png");
                //console.log(textfiles);
                for(let i = 0, cnt = 0; i < imagefiles.length; i++, cnt++){
                    const newli = document.createElement("li");
                    newli.classList.add("uk-grid");

                    const newdivimg = document.createElement("div");
                    newdivimg.classList.add("uk-width-1-3");
                    let newImg = document.createElement("img");
                    newImg.src = "file:///" + Dirpath + "/" +  imagefiles[i];
                    newdivimg.appendChild(newImg);

                    const crrTime = imagefiles[i].split("_")[0];
                    const txtpath = Dirpath + "/txt/" +  crrTime + ".txt";
                    const newdivinput = document.createElement("div");
                    newdivinput.classList.add("uk-width-2-3");
                    let newinput = document.createElement("textarea");
                    newinput.setAttribute("rows", 10);
                    newinput.classList.add("uk-textarea", "uk-form-blank");
                    fs.readFile(txtpath, (err, data) => {
                        newinput.innerText = data;
                    });
                    newinput.addEventListener("change", () => {
                        fs.writeFile(txtpath, newinput.value, err => {
                            if(err) throw err;
                        });
                    });
                    newdivinput.appendChild(newinput);

                    if(i+1 < imagefiles.length){
                        const nextTime = imagefiles[i+1].split("_")[0];
                        if(crrTime == nextTime){
                            newImg = document.createElement("img");
                            newImg.src = "file:///" + Dirpath + "/" + imagefiles[i+1];
                             newdivimg.appendChild(newImg);
                             i++;
                         }
                    }
                    newli.appendChild(newdivimg);
                    newli.appendChild(newdivinput);
                    imageUl.appendChild(newli);
                };
                resolve();
            });
        })
    })
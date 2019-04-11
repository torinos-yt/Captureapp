const fs = require("fs");
const path = require("path");
const app = require("electron").remote.app;
const {remote} = require("electron");
const {Menu, MenuItem} = remote
const ipc = require("electron").ipcRenderer;


const date = location.hash.substring(1);
const menu = new Menu();
menu.append(new MenuItem({ label: "Print PDF", click() {
    console.log("print");
    ipc.send("print-pdf", date);
 } }));

window.addEventListener("contextmenu", err => {
    err.preventDefault();
    menu.popup({ window: remote.getCurrentWindow() })
}, false);


const imageUl = document.getElementById("image-list-ul");

const title = document.getElementById("title-date");
title.innerText = date + " Archive";

let Dirpath;

function createImgbox(imgsrc, idnum, newDiv){
    const imgBox = document.getElementById("imgBox")
    const instance = document.importNode(imgBox.content, true);
    instance.querySelector("div").id = "fragment" + idnum;

    const newimg = instance.querySelector("img");
    newimg.src = "file:///" + Dirpath + "/" +  imgsrc;
    instance.querySelector(".removetoggle").setAttribute("uk-toggle", "target: #modal" + idnum);

    const modal = instance.querySelector("#modal");
    modal.id =  "modal" + idnum;

    const removeBtn = modal.querySelector(".uk-button");

    removeBtn.addEventListener("click", () => {
        const imgCount = newDiv.childElementCount;
        if(imgCount == 1){
            fs.unlink(Dirpath + "/" +  imgsrc, err => {
                if(err) throw err;
            });
            fs.unlink(Dirpath + "/txt/" + imgsrc.split("_")[0] + ".txt", err => {
                if(err) throw err;
            })
            newDiv.parentElement.remove();
        }else{
            fs.unlink(Dirpath + "/" +  imgsrc, err => {
                if(err) throw err;
            });
            document.querySelector("#fragment" + idnum).remove();
        }
    });
    return instance;
}

Promise.resolve()
    .then(() => {
        return new Promise( (resolve, reject) => {
            fs.readFile(app.getPath("userData")+"/Local Storage/path.txt", (err, data) => {
                if(err) throw err;
                Dirpath = data + "/Captureapp/" + date;

                const dialytxt = document.getElementById("dialy");
                fs.readFile(Dirpath + "/txt/_Dialy.txt", (err, data) => {
                    dialytxt.innerText = data;
                });
                dialytxt.addEventListener("change", () => {
                    fs.writeFile(Dirpath + "/txt/_Dialy.txt", dialytxt.value, err => {
                        if(err) throw err;
                    });
                });
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
                    newli.classList.add("uk-grid", "uk-margin-medium-left", "uk-margin-small-right");
                    newli.setAttribute("style", "break-inside: avoid");

                    const newimgdiv = document.createElement("div");
                    newimgdiv.classList.add("uk-width-2-5");

                    const crrTime = imagefiles[i].split("_")[0];

                    const timeThumb = document.createElement("span");
                    timeThumb.classList.add("uk-width-expand", "uk-text-middle", "uk-text-large", "uk-padding-remove");
                    const times = crrTime.split(".");
                    timeThumb.textContent = times[0] + ":" + times[1] + "." + times[2];
                    newli.appendChild(timeThumb);

                    newimgdiv.appendChild(createImgbox(imagefiles[i], i, newimgdiv));
                    if(i+1 < imagefiles.length){
                        const nextTime = imagefiles[i+1].split("_")[0];
                        if(crrTime == nextTime){
                            i++;
                            newimgdiv.appendChild(createImgbox(imagefiles[i], i, newimgdiv));
                         }
                    }

                    const txtpath = Dirpath + "/txt/" +  crrTime + ".txt";
                    const newdivinput = document.createElement("div");
                    newdivinput.classList.add("uk-width-1-2");
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

                    newli.appendChild(newimgdiv);
                    newli.appendChild(newdivinput);
                    imageUl.appendChild(newli);
                };
                resolve();
            });
        })
    })
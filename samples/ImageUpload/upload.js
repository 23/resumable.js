var elems = document.getElementsByClassName('fileEnhancement');
for(var i = 0; i < elems.length; i++) {
    elems[i].addEventListener('click', setFileOpts);
}

var sharedElems = document.getElementsByClassName('sharedEnhancement');
for(var i = 0; i < sharedElems.length; i++) {
    sharedElems[i].addEventListener('click', setOpts);
}

var button = document.getElementById('action');
button.addEventListener('click', action);

var fileActive = document.getElementById('fileActive');
var sharedActive = document.getElementById('sharedActive');
var progress = document.getElementById('progress');
var files = document.getElementById('files');
var percentage = document.getElementById('percentage');
var imagelist = document.getElementById('imagelist');

var r = new Resumable({
    target:'/upload.php',
    testChunks: false
});

function update () {
    var progr = r.progress();

    progress.setAttribute("value", progr);
    percentage.innerHTML = Math.round(progr * 100) + '%';
    files.innerHTML = r.files.length;

    if(r.isUploading()) {
        button.innerHTML = "pause";
    }
    else {
        button.innerHTML = "upload";
    }
}

function setFileOpts() {

    var opts = {};

    if(this.dataset.enhancement != "none") {
        opts.query = {'enhance': this.dataset.enhancement};
    }

    r.setFileOptions(opts);
    fileActive.innerHTML = this.dataset.enhancement;
}

function setOpts() {

    var opts = {};

    if(this.dataset.enhancement != "none") {
        opts.query = {'enhance': this.dataset.enhancement};
    }

    r.setOptions(opts);
    sharedActive.innerHTML = this.dataset.enhancement;
}



function action() {

    if(this.innerHTML == "upload") {
        r.upload();
    }
    else {
        r.pause();
    }
}

function append(file) {

    var img = document.createElement("img");
    img.src = "/temp/" + file.fileName + "?cacheprevent=" + Math.random();
    imagelist.appendChild(img);

}

r.assignDrop(document.getElementById('resumable-drop'));
r.assignBrowse(document.getElementById('resumable-browse'));
r.on('catchAll' ,update);
r.on('fileSuccess', append);
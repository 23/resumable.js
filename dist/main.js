!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("resumablejs",[],t):"object"==typeof exports?exports.resumablejs=t():e.resumablejs=t()}(this,(function(){return function(){"use strict";var e={603:function(e,t,i){var s=this&&this.__awaiter||function(e,t,i,s){return new(i||(i=Promise))((function(r,n){function a(e){try{l(s.next(e))}catch(e){n(e)}}function h(e){try{l(s.throw(e))}catch(e){n(e)}}function l(e){var t;e.done?r(e.value):(t=e.value,t instanceof i?t:new i((function(e){e(t)}))).then(a,h)}l((s=s.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.Resumable=void 0;const r=i(20),n=i(396),a=i(719);class h extends a.default{constructor(e={}){super(),this.files=[],this.validators={},this.clearInput=!0,this.dragOverClass="dragover",this.fileTypes=[],this.fileTypeErrorCallback=e=>{alert(`${e.fileName||e.name} has an unsupported file type, please upload files of type ${this.fileTypes}.`)},this._generateUniqueIdentifier=null,this.maxFileSizeErrorCallback=e=>{alert(e.fileName||e.name+" is too large, please upload files less than "+r.default.formatSize(this.maxFileSize)+".")},this.maxFilesErrorCallback=e=>{var t=this.maxFiles;alert("Please upload no more than "+t+" file"+(1===t?"":"s")+" at a time.")},this.minFileSize=1,this.minFileSizeErrorCallback=e=>{alert(e.fileName||e.name+" is too small, please upload files larger than "+r.default.formatSize(this.minFileSize)+".")},this.prioritizeFirstAndLastChunk=!1,this.fileValidationErrorCallback=e=>{},this.simultaneousUploads=3,this.setInstanceProperties(e),this.opts=e,this.checkSupport()}checkSupport(){if(this.support=void 0!==File&&void 0!==Blob&&void 0!==FileList&&!!Blob.prototype.slice,!this.support)throw new Error("Not supported by Browser")}setInstanceProperties(e){Object.assign(this,e),this.sanitizeFileTypes()}sanitizeFileTypes(){this.fileTypes=this.fileTypes.map((e=>e.replace(/[\s.]/g,"").toLowerCase()))}mapDirectoryItemToFile(e,t){return s(this,void 0,void 0,(function*(){if(e.isFile){const i=yield new Promise(((t,i)=>e.file(t,i)));return i.relativePath=t+i.name,[i]}return e.isDirectory?yield this.processDirectory(e,t+e.name+"/"):e instanceof File?[e]:(console.warn("Item mapping did not return a file object. This might be due to an unknown file type."),[])}))}mapDragItemToFile(e,t){return s(this,void 0,void 0,(function*(){let i=e.webkitGetAsEntry();if(i.isDirectory)return yield this.processDirectory(i,t+i.name+"/");let s=e.getAsFile();return s instanceof File?(s.relativePath=t+s.name,[s]):(console.warn("Item mapping did not return a file object. This might be due to an unknown file type."),[])}))}processDirectory(e,t){return new Promise(((i,r)=>{const n=e.createReader();let a=[];const h=()=>{n.readEntries((e=>s(this,void 0,void 0,(function*(){if(e.length)return a=a.concat(e),h();a=a.map((e=>this.mapDirectoryItemToFile(e,t))),i(yield Promise.all(a))}))),r)};h()}))}onDrop(e){return s(this,void 0,void 0,(function*(){e.currentTarget.classList.remove(this.dragOverClass),r.default.stopEvent(e);let t=[];if(e.dataTransfer&&e.dataTransfer.items?t=[...e.dataTransfer.items]:e.dataTransfer&&e.dataTransfer.files&&(t=[...e.dataTransfer.files]),!t.length)return;this.fire("fileProcessingBegin",t);let i=t.map((e=>this.mapDragItemToFile(e,""))),s=r.default.flattenDeep(yield Promise.all(i));s.length&&this.appendFilesFromFileList(s,e)}))}onDragLeave(e){e.currentTarget.classList.remove(this.dragOverClass)}onDragOverEnter(e){e.preventDefault();let t=e.dataTransfer;t.types.includes("Files")?(e.stopPropagation(),t.dropEffect="copy",t.effectAllowed="copy",e.currentTarget.classList.add(this.dragOverClass)):(t.dropEffect="none",t.effectAllowed="none")}validateFiles(e){return s(this,void 0,void 0,(function*(){let t=r.default.uniqBy(e,(e=>e.uniqueIdentifier),(e=>this.fire("fileProcessingFailed",e,"duplicate"))).map((e=>s(this,void 0,void 0,(function*(){if(this.files.some((t=>t.uniqueIdentifier===e.uniqueIdentifier)))return this.fire("fileProcessingFailed",e,"duplicate"),!1;let t=e.type.toLowerCase(),i=e.name.split(".").pop().toLowerCase();return this.fileTypes.length>0&&!this.fileTypes.some((e=>i===e||e.includes("/")&&(e.includes("*")&&t.substring(0,e.indexOf("*"))===e.substring(0,e.indexOf("*"))||t===e)))?(this.fire("fileProcessingFailed",e,"fileType"),this.fileTypeErrorCallback(e),!1):void 0!==this.minFileSize&&e.size<this.minFileSize?(this.fire("fileProcessingFailed",e,"minFileSize"),this.minFileSizeErrorCallback(e),!1):void 0!==this.maxFileSize&&e.size>this.maxFileSize?(this.fire("fileProcessingFailed",e,"maxFileSize"),this.maxFileSizeErrorCallback(e),!1):!(i in this.validators&&!(yield this.validators[i](e))&&(this.fire("fileProcessingFailed",e,"validation"),this.fileValidationErrorCallback(e),1))}))));const i=yield Promise.all(t);return e.filter(((e,t)=>i[t]))}))}appendFilesFromFileList(e,t){return s(this,void 0,void 0,(function*(){if(void 0!==this.maxFiles&&this.maxFiles<e.length+this.files.length){if(1!==this.maxFiles||1!==this.files.length||1!==e.length)return this.fire("fileProcessingFailed",void 0,"maxFiles"),this.maxFilesErrorCallback(e),!1;this.removeFile(this.files[0])}const i=yield Promise.all(e.map((e=>s(this,void 0,void 0,(function*(){return e.uniqueIdentifier=yield this.generateUniqueIdentifier(e,t),e}))))),r=yield this.validateFiles(i);let a=i.filter((e=>!r.includes(e)));for(const e of r){let i=new n.default(e,e.uniqueIdentifier,this.opts);i.on("chunkSuccess",(()=>this.handleChunkSuccess())),i.on("chunkError",(()=>this.handleChunkError())),i.on("chunkCancel",(()=>this.handleChunkCancel())),i.on("fileProgress",((...e)=>this.handleFileProgress(e))),i.on("fileError",((...e)=>this.handleFileError(e))),i.on("fileSuccess",((...e)=>this.handleFileSuccess(e))),i.on("fileCancel",((...e)=>this.handleFileCancel(e))),i.on("fileRetry",(()=>this.handleFileRetry())),this.files.push(i),this.fire("fileAdded",i,t)}(r.length||a.length)&&this.fire("filesAdded",r,a)}))}generateUniqueIdentifier(e,t){return"function"==typeof this._generateUniqueIdentifier?this._generateUniqueIdentifier(e,t):r.default.generateUniqueIdentifier(e)}uploadNextChunk(){if(this.prioritizeFirstAndLastChunk)for(const e of this.files){if(e.chunks.length&&"chunkPending"===e.chunks[0].status)return void e.chunks[0].send();if(e.chunks.length>1&&"chunkPending"===e.chunks[e.chunks.length-1].status)return void e.chunks[e.chunks.length-1].send()}for(const e of this.files)if(e.upload())return}assignBrowse(e,t=!1){e instanceof HTMLElement&&(e=[e]);for(const i of e){let e;i instanceof HTMLInputElement&&"file"===i.type?e=i:(e=document.createElement("input"),e.setAttribute("type","file"),e.style.display="none",i.addEventListener("click",(()=>{e.style.opacity=0,e.style.display="block",e.focus(),e.click(),e.style.display="none"}),!1),i.appendChild(e)),1!==this.maxFiles?e.setAttribute("multiple","multiple"):e.removeAttribute("multiple"),t?e.setAttribute("webkitdirectory","webkitdirectory"):e.removeAttribute("webkitdirectory"),this.updateFileTypes(this.fileTypes,e),e.addEventListener("change",this.handleChangeEvent.bind(this),!1)}}assignDrop(e){e instanceof HTMLElement&&(e=[e]);for(const t of e)t.addEventListener("dragover",this.onDragOverEnter.bind(this),!1),t.addEventListener("dragenter",this.onDragOverEnter.bind(this),!1),t.addEventListener("dragleave",this.onDragLeave.bind(this),!1),t.addEventListener("drop",this.onDrop.bind(this),!1)}unAssignDrop(e){e instanceof HTMLElement&&(e=[e]);for(const t of e)t.removeEventListener("dragover",this.onDragOverEnter.bind(this)),t.removeEventListener("dragenter",this.onDragOverEnter.bind(this)),t.removeEventListener("dragleave",this.onDragLeave.bind(this)),t.removeEventListener("drop",this.onDrop.bind(this))}updateFileTypes(e,t=null){if(t&&"file"!==t.type)throw new Error("Dom node is not a file input.");this.fileTypes=e,this.sanitizeFileTypes(),t&&(e.length>=1?t.setAttribute("accept",this.fileTypes.map((e=>(e.match(/^[^.][^/]+$/)&&(e="."+e),e))).join(",")):t.removeAttribute("accept"))}get isUploading(){return this.files.some((e=>e.isUploading))}upload(){if(!this.isUploading){this.fire("uploadStart");for(let e=1;e<=this.simultaneousUploads;e++)this.uploadNextChunk()}}pause(){for(const e of this.files)e.abort();this.fire("pause")}cancel(){this.fire("beforeCancel");for(let e=this.files.length-1;e>=0;e--)this.files[e].cancel();this.fire("cancel")}progress(){let e=this.files.reduce(((e,t)=>e+t.size*t.progress()),0),t=this.getSize();return t>0?e/t:0}addFile(e,t){this.appendFilesFromFileList([e],t)}addFiles(e,t){this.appendFilesFromFileList(e,t)}addFileValidator(e,t){e in this.validators&&console.warn(`Overwriting validator for file type: ${e}`),this.validators[e]=t}removeFile(e){for(let t=this.files.length-1;t>=0;t--)if(this.files[t]===e){this.files.splice(t,1);break}}getFromUniqueIdentifier(e){return this.files.find((t=>t.uniqueIdentifier===e))}getSize(){return this.files.reduce(((e,t)=>e+t.size),0)}handleDropEvent(e){this.onDrop(e)}handleChangeEvent(e){const t=e.target;this.fire("fileProcessingBegin",t.files),this.appendFilesFromFileList([...t.files],e),this.clearInput&&(t.value="")}checkUploadComplete(){this.files.every((e=>e.isComplete))&&this.fire("complete")}handleChunkSuccess(){this.uploadNextChunk()}handleChunkError(){this.uploadNextChunk()}handleChunkCancel(){this.uploadNextChunk()}handleFileError(e){this.fire("error",e[1],e[0])}handleFileSuccess(e){this.fire("fileSuccess",...e),this.checkUploadComplete()}handleFileProgress(e){this.fire("fileProgress",...e),this.fire("progress")}handleFileCancel(e){this.removeFile(e[0])}handleFileRetry(){this.upload()}}t.Resumable=h},454:function(e,t,i){Object.defineProperty(t,"__esModule",{value:!0});const s=i(20),r=i(719);class n extends r.default{constructor(e,t,i){super(),this.lastProgressCallback=new Date,this.tested=!1,this.retries=0,this.pendingRetry=!1,this.isMarkedComplete=!1,this.loaded=0,this.xhr=null,this.chunkSize=1048576,this.fileParameterName="file",this.chunkNumberParameterName="resumableChunkNumber",this.chunkSizeParameterName="resumableChunkSize",this.currentChunkSizeParameterName="resumableCurrentChunkSize",this.totalSizeParameterName="resumableTotalSize",this.typeParameterName="resumableType",this.identifierParameterName="resumableIdentifier",this.fileNameParameterName="resumableFilename",this.relativePathParameterName="resumableRelativePath",this.totalChunksParameterName="resumableTotalChunks",this.throttleProgressCallbacks=.5,this.query={},this.headers={},this.method="multipart",this.uploadMethod="POST",this.testMethod="GET",this.parameterNamespace="",this.testChunks=!0,this.maxChunkRetries=100,this.chunkRetryInterval=void 0,this.permanentErrors=[400,401,403,404,409,415,500,501],this.withCredentials=!1,this.xhrTimeout=0,this.chunkFormat="blob",this.setChunkTypeFromFile=!1,this.target="/",this.testTarget="",this.setInstanceProperties(i),this.fileObj=e,this.fileObjSize=e.size,this.fileObjType=e.file.type,this.offset=t,this.startByte=this.offset*this.chunkSize,this.endByte=Math.min(this.fileObjSize,(this.offset+1)*this.chunkSize),this.xhr=null}setInstanceProperties(e){Object.assign(this,e)}setCustomHeaders(){if(!this.xhr)return;let e=this.headers;e instanceof Function&&(e=e(this.fileObj,this));for(const t in e)e.hasOwnProperty(t)&&this.xhr.setRequestHeader(t,e[t])}get formattedQuery(){var e=this.query;"function"==typeof e&&(e=e(this.fileObj,this));const t={[this.chunkNumberParameterName]:this.offset+1,[this.chunkSizeParameterName]:this.chunkSize,[this.currentChunkSizeParameterName]:this.endByte-this.startByte,[this.totalSizeParameterName]:this.fileObjSize,[this.typeParameterName]:this.fileObjType,[this.identifierParameterName]:this.fileObj.uniqueIdentifier,[this.fileNameParameterName]:this.fileObj.fileName,[this.relativePathParameterName]:this.fileObj.relativePath,[this.totalChunksParameterName]:this.fileObj.chunks.length};return Object.assign(Object.assign({},t),e)}get status(){return this.pendingRetry?"chunkUploading":this.isMarkedComplete?"chunkSuccess":this.xhr?this.xhr.readyState<4?"chunkUploading":200===this.xhr.status||201===this.xhr.status?"chunkSuccess":this.permanentErrors.includes(this.xhr.status)||this.retries>=this.maxChunkRetries?"chunkError":(this.abort(),"chunkPending"):"chunkPending"}getTarget(e){return s.default.getTarget(e,this.target,this.testTarget,this.formattedQuery,this.parameterNamespace)}test(){this.xhr=new XMLHttpRequest;var e=()=>{this.tested=!0,"chunkSuccess"===this.status?this.fire("chunkSuccess",this.message()):this.send()};this.xhr.addEventListener("load",e,!1),this.xhr.addEventListener("error",e,!1),this.xhr.addEventListener("timeout",e,!1),this.xhr.open(this.testMethod,this.getTarget("test")),this.xhr.timeout=this.xhrTimeout,this.xhr.withCredentials=this.withCredentials,this.setCustomHeaders(),this.xhr.send(null)}abort(){this.xhr&&this.xhr.abort(),this.xhr=null}send(){if(this.testChunks&&!this.tested)return void this.test();this.xhr=new XMLHttpRequest,this.xhr.upload.addEventListener("progress",(e=>{Date.now()-this.lastProgressCallback.getTime()>1e3*this.throttleProgressCallbacks&&(this.fire("chunkProgress"),this.lastProgressCallback=new Date),this.loaded=e.loaded||0}),!1),this.loaded=0,this.pendingRetry=!1,this.fire("chunkProgress");let e=()=>{var e=this.status;switch(e){case"chunkSuccess":case"chunkError":this.fire(e,this.message());break;default:this.fire("chunkRetry",this.message()),this.abort(),this.retries++;let t=this.chunkRetryInterval;void 0!==t?(this.pendingRetry=!0,setTimeout(this.send,t)):this.send()}};this.xhr.addEventListener("load",e,!1),this.xhr.addEventListener("error",e,!1),this.xhr.addEventListener("timeout",e,!1);let t=this.fileObj.file.slice(this.startByte,this.endByte,this.setChunkTypeFromFile?this.fileObj.file.type:""),i=null,s=this.parameterNamespace;if("octet"===this.method)i=t;else{i=new FormData;for(const e in this.formattedQuery)i.append(s+e,this.formattedQuery[e]);switch(this.chunkFormat){case"blob":i.append(s+this.fileParameterName,t,this.fileObj.fileName);break;case"base64":var r=new FileReader;r.onload=()=>{i.append(s+this.fileParameterName,r.result),this.xhr.send(i)},r.readAsDataURL(t)}}let n=this.getTarget("upload");this.xhr.open(this.uploadMethod,n),"octet"===this.method&&this.xhr.setRequestHeader("Content-Type","application/octet-stream"),this.xhr.timeout=this.xhrTimeout,this.xhr.withCredentials=this.withCredentials,this.setCustomHeaders(),"blob"===this.chunkFormat&&this.xhr.send(i)}message(){return this.xhr?this.xhr.responseText:""}progress(e=!1){var t=e?(this.endByte-this.startByte)/this.fileObjSize:1;if(this.pendingRetry)return 0;switch(this.xhr&&this.xhr.status||this.isMarkedComplete||(t*=.95),this.status){case"chunkSuccess":case"chunkError":return t;case"chunkPending":return 0;default:return this.loaded/(this.endByte-this.startByte)*t}}markComplete(){this.isMarkedComplete=!0}}t.default=n},719:function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),t.default=class{constructor(){this.registeredEventHandlers={}}on(e,t){e=e.toLowerCase(),this.registeredEventHandlers.hasOwnProperty(e)||(this.registeredEventHandlers[e]=[]),this.registeredEventHandlers[e].push(t)}fire(e,...t){e=e.toLowerCase(),this.executeEventCallback(e,...t),this.executeEventCallback("*",e,...t)}executeEventCallback(e,...t){this.registeredEventHandlers.hasOwnProperty(e)&&this.registeredEventHandlers[e].forEach((e=>e(...t)))}}},396:function(e,t,i){Object.defineProperty(t,"__esModule",{value:!0});const s=i(454),r=i(719);class n extends r.default{constructor(e,t,i){super(),this._prevProgress=0,this.isPaused=!1,this.chunks=[],this.chunkSize=1048576,this.opts=i,this.setInstanceProperties(i),this.file=e,this.fileName=e.name,this.size=e.size,this.relativePath=e.webkitRelativePath||this.fileName,this.uniqueIdentifier=t,this._error=void 0!==t,this.fire("chunkingStart",this),this.bootstrap()}setInstanceProperties(e){Object.assign(this,e)}abort(){let e=0;for(const t of this.chunks)"chunkUploading"===t.status&&(t.abort(),e++);e>0&&this.fire("fileProgress",this)}cancel(){for(const e of this.chunks)"chunkUploading"===e.status&&(e.abort(),this.fire("chunkCancel",e));this.chunks=[],this.fire("fileCancel",this),this.fire("fileProgress",this)}retry(){this.bootstrap();let e=!1;this.on("chunkingComplete",(()=>{e||this.fire("fileRetry"),e=!0}))}bootstrap(){const e=e=>this.fire("fileProgress",this,e),t=()=>this.fire("fileRetry",this),i=e=>{this._error||(this.fire("chunkSuccess"),this.fire("fileProgress",this,e),this.isComplete&&this.fire("fileSuccess",this,e))},r=e=>{this.fire("chunkError",e),this.abort(),this._error=!0,this.chunks=[],this.fire("fileError",this,e)};this.abort(),this._error=!1,this.chunks=[],this._prevProgress=0;const n=Math.max(Math.ceil(this.file.size/this.chunkSize),1);for(var a=0;a<n;a++){const h=new s.default(this,a,this.opts);h.on("chunkProgress",e),h.on("chunkError",r),h.on("chunkSuccess",i),h.on("chunkRetry",t),this.chunks.push(h),this.fire("chunkingProgress",this,a/n)}this.fire("chunkingComplete",this)}progress(){if(this._error)return 1;var e=0,t=!1;for(const i of this.chunks)"chunkError"===i.status&&(t=!0),e+=i.progress(!0);return e=t||e>.99999?1:e,e=Math.max(this._prevProgress,e),this._prevProgress=e,e}get isUploading(){return this.chunks.some((e=>"chunkUploading"===e.status))}get isComplete(){return!this.chunks.some((e=>"chunkPending"===e.status||"chunkUploading"===e.status))}upload(){if(this.isPaused)return!1;for(const e of this.chunks)if("chunkPending"===e.status)return e.send(),!0;return!1}markChunksCompleted(e){if(this.chunks&&!(this.chunks.length<=e))for(let t=0;t<e;t++)this.chunks[t].markComplete()}}t.default=n},20:function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),t.default=class{static stopEvent(e){e.stopPropagation(),e.preventDefault()}static generateUniqueIdentifier(e){let t=e.webkitRelativePath||e.relativePath||e.name;return t=t.replace("/","-"),e.size+"-"+t.replace(/[^0-9a-zA-Z_-]/gim,"")}static flattenDeep(e){return Array.isArray(e)?e.reduce(((e,t)=>e.concat(this.flattenDeep(t))),[]):[e]}static uniqBy(e,t,i){let s=new Set;return e.filter((e=>{let r=t(e);return s.has(r)?(i(e),!1):(s.add(r),!0)}))}static formatSize(e){return e<1024?e+" bytes":e<1048576?(e/1024).toFixed(0)+" KB":e<1073741824?(e/1024/1024).toFixed(1)+" MB":(e/1024/1024/1024).toFixed(1)+" GB"}static getTarget(e,t,i,s,r=""){let n=t;"test"===e&&i&&(n="/"===i?t:i);let a=n.indexOf("?")<0?"?":"&",h=Object.entries(s).map((([e,t])=>[encodeURIComponent(r+e),encodeURIComponent(t)].join("="))).join("&");return h&&(n=n+a+h),n}}}},t={};return function i(s){var r=t[s];if(void 0!==r)return r.exports;var n=t[s]={exports:{}};return e[s].call(n.exports,n,n.exports,i),n.exports}(603)}()}));
//# sourceMappingURL=main.js.map
// Type definitions for Resumable.js
// Project: https://github.com/23/resumable.js
// Definitions by: Matthew de Nobrega <https://github.com/matthewdenobrega>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare class Resumable {
    addFile(file: File, event: any): void;
    assignBrowse(domNodes: any, isDirectory: boolean): void;
    assignDrop(domNodes: any): void;
    cancel(): void;
    fire(): void;
    getFromUniqueIdentifier(uniqueIdentifier: string): any;
    getOpt(o: string): any;
    getSize(): number;
    handleChangeEvent(e: any): void;
    handleDropEvent(e: any): void;
    isUploading(): boolean;
    on(event: string, callback: any): void;
    pause(): void;
    progress(): number;
    removeFile(file: any): void;
    unAssignDrop(domNodes: any): void;
    upload(): void;
    uploadNextChunk(): void;

    defaults: Object;
    events: Array<any>;
    files: Array<any>;
    opts: Object;
    support: boolean;
    version: number;

    constructor(opts?: Object);
}

export = Resumable
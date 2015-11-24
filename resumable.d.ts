declare class Resumable {
    addFile(file: File, event: any): void
    assignBrowse(domNodes, isDirectory: boolean): void
    assignDrop(domNodes): void
    cancel(): void
    fire(): void
    getFromUniqueIdentifier(uniqueIdentifier: string): any
    getOpt(o: string): any
    getSize(): number
    handleChangeEvent(e: any): void
    handleDropEvent(e: any): void
    isUploading(): boolean
    on(event: string, callback: any): void
    pause(): void
    progress(): number
    removeFile(file: File): void
    unAssignDrop(domNodes: any): void
    upload(): void
    uploadNextChunk(): void

    defaults: Object
    events: Array<any>
    files: Array<File>
    opts: Object
    support: boolean
    version: number

    constructor(opts: Object)
}

export = Resumable
# 2.0.0

## Features

 - All code follows Google javascript style guide
 - Target url can be provided with query string
 - Events **fileAdded** and **filesAdded** can prevent file from being added to $.files list by
 returning false. Custom validators can be ran here.
 - **ResumableFile.getType()** and **ResumableFile.getExtension()** helper methods added. Can be
 used for custom validation.
 - **fileProgress** and **progress** events are always asynchronous.
 - **ResumableFile.pause()** and **ResumableFile.resume()** methods for single file pausing and
 resuming.

## Breaking Changes

 - **ResumableFile.fileName** parameter renamed to **ResumableFile.name**
 - **Resumable.getOpt** method dropped, use Resumable.opts parameter instead if needed.
 - **Resumable.maxFiles**, **Resumable.minFileSize**, **Resumable.maxFileSize**,
 **Resumable.fileType** validators dropped. Use **fileAdded** and **filesAdded** events for
 custom validation.
 - **fileProgress** and **progress** events are not thrown on ResumableFile.abort() and ResumableFile.cancel() methods execution.

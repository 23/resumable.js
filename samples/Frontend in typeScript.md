# Resumable.js front-end in Typescript
[@steffentchr](http://twitter.com/steffentchr)

This library is originally built to work with [TwentyThree](https://www.twentythree.com), and the 23 uploader is a good example of:

* Selecing files or drag-dropping them in
* Using events to build UI and progress bar
* Pausing and Resuming uploads
* Recovering uploads after browser crashes and even across different computers
* Detecting file support from chunks, for example whether an upload is actually a video file
* Building thumbnails from chunks to give better feedback during upload
* Falling back to alternative upload options when Resumable.js is not supported.

There's [a free trial for TwentyThree](https://www.twentythree.com) if
you want to see this in action, but the pieces are:

install typescript with this Command: `yarn add resumablejs` or `npm inatall resumablejs`

after install you can use in typescript as follow

```typescript
import { Resumable } from 'resumablejs/resumable-es2015';

const serverSrc = 'http://localhost:3000/upload';
var testFile = new File(["foo"], "foo.txt", {
  type: "text/plain",
});


const resumable = new Resumable({
  target: ${serverSrc},
  query: {},
  testChunks: true,
  withCredentials: true
});

resumable.addFile(fileTest);
resumable.upload();
```

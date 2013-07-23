##Resumable.coffee

Resumable.coffee is a `coffeescript` version for resumable.js. 
All api and structure of resumable.js are not changed in resumable.coffee. 

There are also three classes:

* Resumable
* ResumableChunk
* ResumableFile

I wrote it just for fun. But it is more identifiable than js version.


## NOTICE

Resumable.coffee is not maintained alongsize the Resumable.js. 


##How to build

First, install coffee script.

	npm install coffee -g

Build resumable.js

	coffee -c resumable.coffee

Add -m if you would like to generate source map.

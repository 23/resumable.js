# Sample code for Node.js

This sample is written for [Node.js 0.6+](http://nodejs.org/) and requires [Express](http://expressjs.com/) and a piece for middleware ([connect-form](https://github.com/visionmedia/connect-form)) to make the sample code cleaner.

To install and run:

    cd samples/Node.js
    npm install express connect-form
    node app.js
    
The browse to [localhost:3000](http://localhost:3000).


If you would like to load the resumable.js library from one domain and have your Node.js reside on another, you must allow 'Access-Control-Allow-Origin' from '*'.  For an example, use the following:

    node app_crossDomain.js

Then in public/index.html, on line 49, update the target with your server's address.  For example: http://www.example.com/upload
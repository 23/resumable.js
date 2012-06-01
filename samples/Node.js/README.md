# Sample code for Node.js

This sample is written for [Node.js 0.6+](http://nodejs.org/) and requires [Express](http://expressjs.com/) to make the sample code cleaner.

To install and run:

    cd samples/Node.js
    npm install express
    node app.js

Then browse to [localhost:3000](http://localhost:3000).


## Enabling Cross-domain Uploads

If you would like to load the resumable.js library from one domain and have your Node.js reside on another, you must allow 'Access-Control-Allow-Origin' from '*'.  Please remember, there are some potential security risks with enabling this functionality.  If you would still like to implement cross-domain uploads, open app.js and uncomment lines 24-31 and uncomment line 17.

Then in public/index.html, on line 49, update the target with your server's address.  For example: target:'http://www.example.com/upload'

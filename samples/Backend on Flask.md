# Sample server implementation in Python using Flask 

[Gabor Szelcsanyi](https://github.com/szelcsanyi) has provided this sample implementation for Flask. 

This is an example. It should probably not be used as-is.

Tested on Python 2.7.9 and Flask 0.10.1


```python
from flask import Flask, request, abort
import os

app = Flask(__name__, static_url_path='')

temp_base = '/tmp/resumable_images/'
```

Controller for getting chunk informations

```python
@app.route('/upload', methods=['GET'])
def show():

    temp_dir = "{}{}".format(temp_base, request.args.get('resumableIdentifier', default='error', type=str))
    chunk_file = "{}/{}.part{}".format(temp_dir, request.args.get('resumableFilename', default='error', type=str), request.args.get('resumableChunkNumber', default=1, type=int))
    app.logger.debug('Getting chunk: %s', chunk_file)

    if os.path.isfile(chunk_file):
        return 'OK'
    else:
        abort(404, 'Not found')
```

Controller for storing chunks

```python
@app.route('/upload', methods=['POST'])
def create():

    temp_dir = "{}{}".format(temp_base, request.form.get('resumableIdentifier', default='error', type=str))
    chunk_file = "{}/{}.part{}".format(temp_dir, request.form.get('resumableFilename', default='error', type=str), request.form.get('resumableChunkNumber', default=1, type=int))
    app.logger.debug('Creating chunk: %s', chunk_file)

    if not os.path.isdir(temp_dir):
        os.makedirs(temp_dir, 0777)

    file = request.files['file']
    file.save(chunk_file)

    currentSize = request.form.get('resumableChunkNumber', default=1, type=int) * request.form.get('resumableChunkSize', default=1, type=int)
    filesize = request.form.get('resumableTotalSize', default=1, type=int)

    if (currentSize + request.form.get('resumableCurrentChunkSize', default=1, type=int) ) >= filesize:

        target_file_name = "{}/{}".format(temp_base, request.form.get('resumableFilename', default='error', type=str))
        with open(target_file_name, "ab") as target_file:
            for i in range(1, request.form.get('resumableChunkNumber', default=1, type=int)+1):
                stored_chunk_file_name = "{}/{}.part{}".format(temp_dir, request.form.get('resumableFilename', default='error', type=str), str(i))
                stored_chunk_file = open(stored_chunk_file_name, 'rb')
                target_file.write( stored_chunk_file.read() )
                stored_chunk_file.close()
                os.unlink(stored_chunk_file_name)
        target_file.close()
        os.rmdir(temp_dir)
        app.logger.debug('File saved to: %s', target_file_name)

    return 'OK'
```

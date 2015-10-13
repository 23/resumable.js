# Sample server implementation in Python using Flask 

[Gabor Szelcsanyi](https://github.com/szelcsanyi) has provided this sample implementation for Flask.

This is a basic example whithout extra validations. It is supposed to work in an optimal situation where every chunk is uploaded in strict order. It should probably not be used as-is. The script is unsupported.

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

    identifier = request.args.get('resumableIdentifier', type=str)
    filename = request.args.get('resumableFilename', type=str)
    chunk_number = request.args.get('resumableChunkNumber', type=int)

    if not identifier or not filename or not chunk_number:
        # Parameters are missing or invalid
        abort(500, 'Parameter error')

    # chunk folder path based on the parameters
    temp_dir = "{}{}".format(temp_base, identifier)
    # chunk path based on the parameters
    chunk_file = "{}/{}.part{}".format(temp_dir, filename, chunk_number)

    app.logger.debug('Getting chunk: %s', chunk_file)

    if os.path.isfile(chunk_file):
        #Let resumable.js know this chunk already exists
        return 'OK'
    else:
        #Let resumable.js know this chunk does not exists and needs to be uploaded
        abort(404, 'Not found')
```

Controller for storing chunks

```python
@app.route('/upload', methods=['POST'])
def create():

    identifier = request.form.get('resumableIdentifier', type=str)
    filename = request.form.get('resumableFilename', type=str)
    chunk_number = request.form.get('resumableChunkNumber', type=int)
    chunk_size = request.form.get('resumableChunkSize', type=int)
    current_chunk_size = request.form.get('resumableCurrentChunkSize', type=int)
    total_size = request.form.get('resumableTotalSize', type=int)

    if not identifier or not filename or not chunk_number or not chunk_size or not current_chunk_size or not total_size:
        # Parameters are missing or invalid
        abort(500, 'Parameter error')

    # chunk folder path based on the parameters
    temp_dir = "{}{}".format(temp_base, identifier)
    # chunk path based on the parameters
    chunk_file = "{}/{}.part{}".format(temp_dir, filename, chunk_number)

    app.logger.debug('Creating chunk: %s', chunk_file)

    # Create directory of not exists
    if not os.path.isdir(temp_dir):
        os.makedirs(temp_dir, 0777)

    file = request.files['file']
    file.save(chunk_file)

    current_size = chunk_number * chunk_size

    # When all chunks are uploaded
    # (does not handle if chunks are out of order!)
    if (current_size + current_chunk_size ) >= total_size:

        # Create a target file
        target_file_name = "{}/{}".format(temp_base, filename)
        with open(target_file_name, "ab") as target_file:
            # Loop trough the chunks
            for i in range(1, chunk_number+1):
                # Select the chun
                stored_chunk_file_name = "{}/{}.part{}".format(temp_dir, filename, str(i))
                stored_chunk_file = open(stored_chunk_file_name, 'rb')
                # Write chunk into target file
                target_file.write( stored_chunk_file.read() )
                stored_chunk_file.close()
                # Deleting chunk
                os.unlink(stored_chunk_file_name)
        target_file.close()
        os.rmdir(temp_dir)
        app.logger.debug('File saved to: %s', target_file_name)

    return 'OK'
```

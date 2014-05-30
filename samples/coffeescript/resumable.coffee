window.Resumable = class Resumable

  constructor: (@opt)->
    console.log 'constructor'

    #Properties
    @support = File? and Blob? and FileList? and (Blob.prototype.webkitSlice? or Blob.prototype.mozSlice? or Blob.prototype.slice?)
    @files = []
    @defaults =
      chunkSize: 1 * 1024 * 1024
      forceChunkSize: false
      simultaneousUploads: 3
      fileParameterName: 'file'
      throttleProgressCallbacks: 0.5
      query: {}
      headers: {}
      preprocess: null
      method: 'multipart'
      prioritizeFirstAndLastChunk: false
      target: '/'
      testChunks: true
      generateUniqueIdentifier: null
      maxChunkRetries: undefined
      chunkRetryInterval: undefined
      permanentErrors: [415, 500, 501]
      maxFiles: undefined
      maxFilesErrorCallback: (files, errorCount)->
        #TODO @getOpt
        maxFiles = @getOpt('maxFiles')
        alert('Please upload ' + maxFiles + ' file' + (maxFiles == 1 ? '': 's') + ' at a time.');
      minFileSize: undefined
      minFileSizeErrorCallback: (file, errorCount) ->
        #TODO @getOpt
        alert(file.fileName +' is too small, please upload files larger than ' + @formatSize(@getOpt('minFileSize')) + '.')
      maxFileSize: undefined
      maxFileSizeErrorCallback: (file, errorCount) ->
        #TODO @getOpt
        alert(file.fileName +' is too large, please upload files less than ' + @formatSize(@getOpt('maxFileSize')) + '.')
    @opt = {} if not @opt?
    @events = []

  getOpt: (o)->

    if o instanceof Array
      opts = {}
      for item in o
        opts[item] = @getOpt(item)
      return opts
    else
      return if @opt[o]? then @opt[o] else @defaults[o]

  formatSize: (size)->
    if size < 1024
      size + ' bytes'
    else if size < 1024 * 1024
      (size / 1024.0).toFixed(0) + ' KB'
    else if size < 1024 * 1024 * 1024
      (size / 1024.0 / 1024.0).toFixed(1) + ' MB'
    else
      (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB'

  stopEvent: (e) ->
    console.log 'stopEvent'
    e.stopPropagation()
    e.preventDefault()

  generateUniqueIdentifier: (file) ->
    console.log 'generateUniqueIdentifier'
    custom = @getOpt('generateUniqueIdentifier')
    if typeof custom is 'function'
      return custom file
    else
      # Some confusion in different versions of Firefox
      relativePath = file.webkitRelativePath || file.fileName || file.name
      size = file.size
      return (size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''))

  # EVENTS
  # catchAll(event, ...)
  # fileSuccess(file), fileProgress(file), fileAdded(file, event), fileRetry(file), fileError(file, message),
  # complete(), progress(), error(message, file), pause()
  on:(event, callback) ->
    console.log "on: #{event}"
    @events.push({event: event, callback: callback})

  fire: (args...) ->
    console.log "fire: #{args[0]}"
    event = args[0].toLowerCase()
    for e in @events
      if e.event.toLowerCase() is event       then e.callback.apply(this, args[1..])
      if e.event.toLowerCase() is 'catchall'  then e.callback.apply(null, args)

    if event is 'fireerror'    then @fire('error', args[2], args[1])
    if event is 'fileprogress' then @fire('progress')

#Drop
  onDrop: (event) ->
    console.log "onDrop"
    @stopEvent(event)
    @appendFilesFromFileList(event.dataTransfer.files, event)
  onDragOver: (event) ->
    console.log "onDragOver"
    event.preventDefault()

#  // INTERNAL METHODS (both handy and responsible for the heavy load)
  appendFilesFromFileList: (fileList, event) ->
    console.log "appendFilesFromFileList"
#     check for uploading too many files
    errorCount = 0;
    [maxFiles, minFileSize, maxFileSize, maxFilesErrorCallback, minFileSizeErrorCallback, maxFileSizeErrorCallback] = @getOpt(['maxFiles', 'minFileSize', 'maxFileSize', 'maxFilesErrorCallback', 'minFileSizeErrorCallback', 'maxFileSizeErrorCallback']);

    if maxFiles? and maxFiles < (fileList.length + @files.length)
      maxFilesErrorCallback fileList, errorCount++
      return false

    files = []
    for file in fileList
      #consistency across browsers for the error message
      file.name = file.fileName = file.name || file.fileName

      #Check file size
      if minFileSize? and file.size < minFileSize
        minFileSizeErrorCallback file, errorCount++
        return false
      if maxFileSize? and file.size > maxFileSize
        maxFilesErrorCallback file, errorCount++
        return false

      #Directories have size == 0
      if file.size > 0 and not @getFromUniqueIdentifier(@generateUniqueIdentifier(file))
        resumableFile = new ResumableFile(this, file)
        @files.push resumableFile
        files.push resumableFile
        @fire 'fileAdded', resumableFile, event

    @fire 'fileAdded', files

  uploadNextChunk: ()->
    console.log "uploadNextChunk"

    found = false
    # In some cases (such as videos) it's really handy to upload the first
    # and last chunk of a file quickly; this let's the server check the file's
    # metadata and determine if there's even a point in continuing.
    if @getOpt 'prioritizeFirstAndLastChunk'
      for file in @files
        if file.chunks.length and file.chunks[0].status() is 'pending' and file.chunks[0].preprocessState is 0
          file.chunks[0].send()
          found = true
          break

        if file.chunks.length > 1 and file.chunks[file.chunks.length - 1].status() is 'pending' and file.chunks[file.chunks.length - 1].preprocessState is 0
          file.chunks[file.chunks.length - 1].send()
          found = true
          break
      return true if found

    # Now, simply look for the next, best thing to upload
    for file in @files
      for chunk in file.chunks
        if chunk.status() is 'pending' and chunk.preprocessState is 0
          chunk.send()
          found = true
          break
      break if found

    return true if found

    #The are no more outstanding chunks to upload, check is everything is done
    for file in @files
      outstanding = false
      for chunk in file.chunks
        status = chunk.status()
        if status is 'pending' or status is 'uploading' or chunk.preprocessState is 1
          outstanding = true
          break
      break if outstanding

    @fire('complete') if not outstanding #All chunks have been uploaded, complete

    return false

  #PUBLIC METHODS FOR RESUMABLE.JS
  assignBrowse: (domNodes, isDirectory) ->
    console.log "assignBrowse"
    domNodes = [domNodes] if not domNodes.length?
    # We will create an <input> and overlay it on the domNode
    # (crappy, but since HTML5 doesn't have a cross-browser.browse() method we haven't a choice.
    #  FF4+ allows click() for this though: https://developer.mozilla.org/en/using_files_from_web_applications)
    for dn in domNodes
      if dn.tagName is 'INPUT' and dn.type is 'file'
        input = dn
      else 
        input = document.createElement('input')
        input.setAttribute('type', 'file')
        #Place <input /> with the dom node an position the input to fill the entire space
        dn.style.display      = 'inline-block'
        dn.style.position     = 'relative'
        input.style.position  = 'absolute'
        input.style.top = input.style.left = input.style.bottom = input.style.right = 0
        input.style.opacity   = 0
        input.style.cursor    = 'pointer'
        dn.appendChild(input)

    maxFiles = @getOpt('maxFiles')
    if maxFiles? or maxFiles isnt 1
      input.setAttribute('multiple', 'multiple')
    else
      input.removeAttribute('multiple')

    if isDirectory
      input.setAttribute 'webkitdirectory', 'webkitdirectory'
    else
      input.removeAttribute 'webkitdirectory'

    # When new files are added, simply append them to the overall list
    changeHandler = (e)=>
      @appendFilesFromFileList(e.target.files)
      e.target.value = ''

    input.addEventListener 'change', changeHandler, false



  assignDrop: (domNodes) ->
    console.log "assignDrop"
    domNodes = [domNodes] if not domNodes.length?
    for dn in domNodes
      dn.addEventListener 'dragover', @onDragOver, false
      dn.addEventListener 'drop', @onDrop, false

  unAssignDrop: (domNodes) ->
    console.log "unAssignDrop"
    domNodes = [domNodes] if not domNodes.length?
    for dn in domNodes
      dn.removeEventListener 'dragover', @onDragOver
      dn.removeEventListener 'drop', @onDrop

  isUploading: () ->
    uploading = false
    for file in @files
      for chunk in file.chunks
        if chunk.status() is 'uploading'
          uploading = true
          break
      break if uploading

    return uploading

  upload: () ->
    console.log "upload"
    #Make sure we don't start too many uploads at once
    return if @isUploading()
    #Kick off the queue
    @fire('uploadStart')
    for num in [0..@getOpt('simultaneousUploads')]
      @uploadNextChunk()

  pause: ()->
    console.log "pause"
    #Resume all chunks currently being uploaded
    for file in @files
      file.abort()
    @fire 'pause'

  cancel:() ->
    console.log "cancel"
    for file in @files
      file.cancel()
    @fire 'cancel'

  progress: ()->
    console.log "progress"
    totalDone = 0
    totalSize = 0
    for file in @files
      totalDone += file.progress() * file.size
      totalSize += file.size
    return(if totalSize>0 then totalDone/totalSize else 0)

  addFile: (file)->
    console.log "addFile"
    @appendFilesFromFileList([file])

  removeFile: (file) ->
    console.log "removeFile"
    files = [];
    for f in @files
      files.push(f) if f isnt file
    @files = files;
  getFromUniqueIdentifier: (uniqueIdentifier) ->
    console.log "getFromUniqueIdentifier"
    for f in @files
      return f if f.uniqueIdentifier is uniqueIdentifier
    return false
  getSize: ()->
    console.log "getSize"
    totalSize = 0
    for file in @files
      totalSize += file.size
    return totalSize

window.ResumableChunk = class ResumableChunk
  constructor: (@resumableObj, @fileObj, @offset, @callback) ->
    @opt = {}
    @fileObjSize = @fileObj.size
    @lastProgressCallback = (new Date)
    @tested = false
    @retries = 0
    @preprocessState = 0 # 0 = unprocessed, 1 = processing, 2 = finished

    #Computed properties
    @chunkSize = @getOpt('chunkSize')
    @loaded = 0
    @startByte = @offset * @chunkSize
    @endByte = Math.min @fileObjSize, (@offset + 1) * @chunkSize
    if (@fileObjSize - @endByte < @chunkSize) and (not @getOpt('forceChunkSize'))
      @endByte = @fileObjSize

    @xhr = null

  getOpt: (o)->
    return @resumableObj.getOpt o

  pushParams: (params, key, value) ->
    params.push [encodeURIComponent(key), encodeURIComponent(value)].join('=')

  # makes a GET request without any data to see if the chunk has already been uploaded in a previous session
  test: () ->
    @xhr = new XMLHttpRequest()

    testHandler = (e) =>
      @tested = true
      status = @status()

      if status is 'success'
        @callback status, @message()
        @resumableObj.uploadNextChunk()
      else
        @send()

    @xhr.addEventListener 'load' , testHandler, false
    @xhr.addEventListener 'error', testHandler, false

    #Add data from the query options
    params = []

    customQuery = @getOpt 'query'
    customQuery = customQuery(@fileObj, @) if typeof customQuery is 'function'
    if customQuery?
      for key, value of customQuery
        pushParams key, value

    #Add extra data to identify chunk
    @pushParams params, 'resumableChunkNumber',      (@offset + 1)
    @pushParams params, 'resumableChunkSize',        @chunkSize
    @pushParams params, 'resumableCurrentChunkSize', (@endByte - @startByte)
    @pushParams params, 'resumableTotalSize',        @fileObjSize
    @pushParams params, 'resumableIdentifier',       @fileObj.uniqueIdentifier
    @pushParams params, 'resumableFilename',         @fileObj.fileName
    @pushParams params, 'resumableRelativePath',     @fileObj.relativePath

    #Append the relevant chunk and send it
    @xhr.open 'GET', @getOpt('target') + '?' + params.join('&')
    #Add data from header options
    headers = @getOpt('headers')
    headers = {} if not headers?
    @xhr.setRequestHeader(key, value) for key, value of headers
    @xhr.send null

  preprocessFinished: () ->
    @preprocessState = 2
    @send()

  #send() uploads the actual data in a POST call
  send: () ->
    preprocess = @getOpt('preprocess')
    if typeof preprocess is 'function'
      ret = false
      switch @preprocessState
        when 0                #Go to preprocess
          preprocess @
          @preprocessState = 1
          ret = true
        when 1 then ret = true    #Processing
        when 2 then ret = false     #Go on
      return if ret

    if @getOpt('testChunks') and not @tested
      @test()
      return

    #Set up request and listen for event
    @xhr = new XMLHttpRequest()

    #Progress
    @loaded = 0
    progressHandler = (e) =>
      if (new Date) - @lastProgressCallback > @getOpt('throttleProgressCallbacks') * 1000
        @callback 'progress'
        @lastProgressCallback = (new Date)

      @loaded = e.loaded || 0

    @xhr.upload.addEventListener 'progress', progressHandler, false
    @callback 'progress'

    # Done (either done, failed or retry)
    doneHandler = (e) =>
      status = @status()
      if status is 'success' or status is 'error'
        @callback status, @message()
        @resumableObj.uploadNextChunk()
      else
        @callback 'retry', @message()
        @abort()
        @retries++
        retryInterval = @getOpt('chunkRetryInterval')
        if retryInterval?
          setTimeout @send, retryInterval

    @xhr.addEventListener 'load', doneHandler, false
    @xhr.addEventListener 'error', doneHandler, false


    #Add data from header options
    headers = @getOpt('headers')
    headers = {} if not headers?
    @xhr.setRequestHeader(key, value) for key, value of headers

    if @fileObj.file.slice?
      func = 'slice'
    else if @fileObj.file.mozSlice?
      func = 'mozSlice'
    else if @fileObj.file.webkitSlice?
      func = 'webkitSlice'
    else
      func = 'slice'

    bytes = @fileObj.file[func](@startByte, @endByte)
    data = null
    target = @getOpt 'target'

    #Set up the basic query data from Resumable
    query =
      resumableChunkNumber:       @offset+1
      resumableChunkSize:         @getOpt('chunkSize')
      resumableCurrentChunkSize:  @endByte - @startByte
      resumableTotalSize:         @fileObjSize
      resumableIdentifier:        @fileObj.uniqueIdentifier
      resumableFilename:          @fileObj.fileName
      resumableRelativePath:      @fileObj.relativePath


    customQuery = @getOpt 'query'
    customQuery = customQuery(@fileObj, @) if typeof customQuery is 'function'
    customQuery = {} if not customQuery?

    pushParams query, key, value for key, value of customQuery

    if @getOpt('method') is 'octet'
      # Add data from the query options
      data = bytes
      params = []
      for key, value of query
        @pushParams params, key, value

      target += '?' + params.join('&')
    else
      #Add data from the query options
      data = new FormData()
      for key, value of query
        data.append(key, value)

      data.append(@getOpt('fileParameterName'), bytes)

    @xhr.open 'POST', target
    @xhr.send data

  abort: ()->
    @xhr.abort() if @xhr?
    @xhr = null

  status: ()->
    #Returns: 'pending', 'uploading', 'success', 'error'

    permanentErrors = @getOpt('permanentErrors')
    maxChunkRetries = @getOpt('maxChunkRetries')
    permanentErrors = {} if not permanentErrors?
    maxChunkRetries = 0 if not maxChunkRetries?

    if not @xhr?
      return 'pending'
    else if @xhr.readyState < 4
      # Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
      return 'uploading'
    else if @xhr.status is 200
      return 'success'
    else if (@xhr.status in permanentErrors) or (@retries >= maxChunkRetries)
      #HTTP 415/500/501, permanent error
      return 'error'
    else
      #this should never happen, but we'll reset and queue a retry
      #a likely case for this would be 503 service unavailable
      @abort()
      return 'pending'

  message: ()->
    return (if @xhr? then @xhr.responseText else '')

  progress: (relative)->
    factor = (if relative? then (@endByte - @startByte)/@fileObjSize else 1)
    switch @status()
      when 'success', 'error'
        return 1 * factor
      when 'pending'
        return 0 * factor
      else
        return @loaded / (@endByte - @startByte) * factor

window.ResumableFile = class ResumableFile
  constructor: (@resumableObj, @file)->
    @opt = {}
    @_prevProgress = 0;
    @fileName = @file.fileName || @file.name
    @size = @file.size
    @relativePath = @file.webkitRelativePath || @fileName
    @uniqueIdentifier = @resumableObj.generateUniqueIdentifier @file
    @_error = false
    @chunks = []
    #Bootstrap and return
    @bootstrap()

  getOpt: (o)->
    return @resumableObj.getOpt o

  #Callback when something happens within the chunk
  chunkEvent: (event, message)->
    switch event
      when "progress" then @resumableObj.fire('fileProgress', this)
      when "error"
        @abort()
        @_error = true
        @chunks = []
        @resumableObj.fire('fileError', this, message)
      when "success"
        if not @_error
          @resumableObj.fire('fileProgress', this)
          if @progress() is 1
            @resumableObj.fire('fileSuccess', this, message)
      when "retry" then @resumableObj.fire('fileRetry', this)

  # Main code to set up a file object with chunks,
  # packaged to be able to handle retries if needed.
  abort: () ->
    for c in @chunks
      c.abort() if c.status() is 'uploading'
    @resumableObj.fire 'fileProgress', this

  cancel: ()->
    #Reset this file to be void
    _chunks = @chunks
    @chunks = []
    # Stop current uploads
    for c in _chunks
      if c.status() is 'uploading'
        c.abort()
        @resumableObj.uploadNextChunk()
    @resumableObj.removeFile this
    @resumableObj.fire('fileProgress', this)

  retry: () ->
    @bootstrap();
    @resumableObj.upload()

  bootstrap: () ->
    @abort()
    @_error = false
    # Rebuild stack of chunks from file
    @chunks = []
    @_prevProgress = 0

    if @getOpt('forceChunkSize')?
      round = Math.ceil
    else
      round = Math.floor
    offset = 0
    max = Math.max(round(@file.size / @getOpt('chunkSize')), 1)
    for offset in [0..(max-1)]
      @chunks.push new ResumableChunk(@resumableObj, this, offset, @chunkEvent)

  progress: ()->
    return (1) if @_error
    #Sum up progress across everything
    ret = 0
    error = false
    for c in @chunks
      error = c.status() is 'error'
      #get chunk progress relative to entire file
      ret += c.progress(true)
    ret = (if error or error > 0.99 then 1 else ret)
    #We don't want to lose percentages when an upload is paused
    ret = Math.max(@_prevProgress, ret)
    @_prevProgress = ret
    return ret

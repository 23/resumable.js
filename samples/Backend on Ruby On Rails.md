# Sample server implementation in Ruby on Rails 

[Bert Sinnema](https://github.com/bertsinnema) has provided this sample implementation for Ruby on Rails. 

This is a sample backend controller for Ruby on Rails (3.2)

Tested on ruby 2.0.0 

######config/routes.rb
Add a chunk resource to the routes file

```ruby 
resource :chunk, :only => [:create, :show]
```
######app/controllers/chunks_controller.rb
Add a chunks controller

```ruby

	class ChunksController < ApplicationController
	  layout nil
	  
	  #GET /chunk
	  def show
	    #chunk folder path based on the parameters
	    dir = "/tmp/#{params[:resumableIdentifier]}"
	    #chunk path based on the parameters
	    chunk = "#{dir}/#{params[:resumableFilename]}.part#{params[:resumableChunkNumber]}"
	
	    if File.exists?(chunk)
	      #Let resumable.js know this chunk already exists
	      render :nothing => true, :status => 200    
	    else
	      #Let resumable.js know this chunk doesnt exists and needs to be uploaded
	      render :nothing => true, :status => 404    
	    end
	    
	  end
	
	  #POST /chunk
	  def create
	
	    #chunk folder path based on the parameters
	    dir = "/tmp/#{params[:resumableIdentifier]}"
	    #chunk path based on the parameters
	    chunk = "#{dir}/#{params[:resumableFilename]}.part#{params[:resumableChunkNumber]}"
	
	    #Create chunks directory when not present on system
	    if !File.directory?(dir)
	      FileUtils.mkdir(dir, :mode => 0700)
			elsif	params[:resumableChunkNumber].to_i == 1
				FileUtils.rm_rf Dir.glob("#{dir}/*")
	    end
	
	    #Move the uploaded chunk to the directory
	    FileUtils.mv params[:file].tempfile, chunk
	
	    #Concatenate all the partial files into the original file
	
	    currentSize = params[:resumableChunkNumber].to_i * params[:resumableChunkSize].to_i
	    filesize = params[:resumableTotalSize].to_i
	
	    #When all chunks are uploaded
	    if (currentSize + params[:resumableCurrentChunkSize].to_i) >= filesize
	      
	      #Create a target file
	      File.open("#{dir}/#{params[:resumableFilename]}","a") do |target|
	        #Loop trough the chunks
	        for i in 1..params[:resumableChunkNumber].to_i
	          #Select the chunk
	          chunk = File.open("#{dir}/#{params[:resumableFilename]}.part#{i}", 'r').read
	          
	          #Write chunk into target file
	          chunk.each_line do |line|
	            target << line
	          end
	          
	          #Deleting chunk
	          FileUtils.rm "#{dir}/#{params[:resumableFilename]}.part#{i}", :force => true 
	        end
	      end
				#You can use the file now
				puts "File saved to #{dir}/#{params[:resumableFilename]}"
	    end
	
	    render :nothing => true, :status => 200
	  end  
	
	end
```

###### Resumable.js configuration
Ruby on Rails needs X-CSRF-Token headers. You can pass this is in the headers option. The token should be in a meta tag of the application layout file. In this example is used coffeescript.

```coffeescript
	
	jQuery ->  
	  r = new Resumable
	    target: "/chunk"
	    headers:
	      'X-CSRF-Token' : $('meta[name="csrf-token"]').attr('content')
	
	  if !r.support
	    alert('No Support!!!!!')
```
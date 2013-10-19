# Sample server implementation in Ruby on Rails 

[Bert Sinnema](https://attaching.it) has provided this sample implementation for Ruby on Rails. 

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
	    end
	
	    #Move the uploaded chunk to the directory
	    FileUtils.mv params[:file].tempfile, chunk
	
	    #Concatenate all the partial files into the original file
	
	    currentSize = params[:resumableChunkNumber].to_i * params[:resumableChunkSize].to_i
	    filesize = params[:resumableTotalSize].to_i
	
	    if (currentSize + params[:resumableCurrentChunkSize].to_i) >= filesize
	      target = File.new()
	      for i in 1..params[:resumableChunkNumber].to_i
	         puts "Value of local variable is #{i}"
	      end      
	    end
	
	
	
	    render :nothing => true, :status => 200
	  end  
	end
```

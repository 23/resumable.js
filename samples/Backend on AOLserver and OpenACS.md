# AOLserver and OpenACS
[@steffentchr](http://twitter.com/steffentchr)

Our upload managers are using [AOLserver](http://www.aolserver.com/) and [OpenACS](http://www.openacs.com/).
Generally, all Resumable.js request are handled through a single method:

    ad_proc handle_resumable_file {
        {-file_parameter_name "file"}
        {-folder "/tmp"}
        -check_video:boolean
        {-max_file_size ""}
    } {} {
        # Check parameter to see if this is indeed a resumable
        ad_page_contract {} {
            {resumableChunkNumber:integer "0"}
            {resumableChunkSize:integer "0"}
            {resumableTotalSize:integer "0"}
            {resumableIdentifier ""}
            {resumableFilename ""}
        }

        # Clean up the identifier
        regsub -all {[^0-9A-Za-z_-]} $resumableIdentifier "" resumableIdentifier

        # Check if the request is sane
        if { $resumableChunkNumber==0 || $resumableChunkSize==0 || $resumableTotalSize==0 || $resumableIdentifier eq "" } {
            return "non_resumable_request"
        }
        set number_of_chunks [expr int(floor($resumableTotalSize/($resumableChunkSize*1.0)))]
        if { $number_of_chunks==0 } {set number_of_chunks 1}
        if { $resumableChunkNumber>$number_of_chunks } {
            return "invalid_resumable_request"
        }

        # What would the file name be?
        set filename [file join $folder "resumable-${resumableIdentifier}.${resumableChunkNumber}"]

        # If this is a GET request, we should tell the uploader if the file is already in place or not
        if { [ns_conn method] eq "GET" } {
            if { [file exists $filename] && [file size $filename]==$resumableChunkSize } {
                doc_return 200 text/plain "ok"
            } else {
                doc_return 404 text/plain "not found"
            }
            ad_script_abort
        }

        # Assign a tmp file 
        ad_page_contract {} [list "${file_parameter_name}:trim" "${file_parameter_name}.tmpfile:tmpfile"]
        set tmp_filename [set "${file_parameter_name}.tmpfile"]
        if { $resumableFilename ne "" } {
            set original_filename $resumableFilename
        } else {
            set original_filename [set $file_parameter_name]
        }

        # Check data size
        if { $max_file_size ne "" && $resumableTotalSize>$max_file_size } {
            return [list "invalid_resumable_request" "The file is too large" $original_filename]
        } elseif { $resumableChunkNumber<$number_of_chunks && [file size $tmp_filename]!=$resumableChunkSize } {
            return [list "invalid_resumable_request" "Wrong data size" $original_filename]
        } elseif { $number_of_chunks>1 && $resumableChunkNumber==$number_of_chunks && [file size $tmp_filename] != [expr ($resumableTotalSize % $resumableChunkSize) + $resumableChunkSize] } {
            return [list "invalid_resumable_request" "Wrong data size" $original_filename]
        } elseif { $number_of_chunks==1 && [file size $tmp_filename] != $resumableTotalSize } {
            return [list "invalid_resumable_request" "Wrong data size" $original_filename]
        }

        # Save the chunk
        file mkdir $folder
        file copy -force $tmp_filename $filename

        # Try collating the first and last chunk -- and identify
        if { $check_video_p && ($resumableChunkNumber==1 || $resumableChunkNumber==$number_of_chunks) } {
            ## (Here you can do check on first and last chunk if needed
            ##  For example, we will check if this is a support video file.)
        }
    
        # Check if all chunks have come in
        set chunk_num 1
        set chunk_files [list]
        while { $chunk_num<=$number_of_chunks } {
            set chunk_filename [file join $folder "resumable-${resumableIdentifier}.${chunk_num}"]
            if { ![file exists $chunk_filename] } {
                return [list "partly_done" $filename $original_filename]
            }
            lappend chunk_files $chunk_filename
            incr chunk_num
        }

        # We've come this far, meaning that all the pieces are in place
        set output_filename [file join $folder "resumable-${resumableIdentifier}.final"]
        foreach file $chunk_files {
            exec cat $file >> $output_filename 
            catch {
                file delete $file
            }
        }

        return [list "done" $output_filename $original_filename $resumableIdentifier]
    }


After this, all Resumable.js cases can be handled easily, including
fallback to non-resumable requests.

    # Is this a file from Resumable.js?
    lassign [handle_resumable_file] resumable_status resumable_context resumable_original_filename resumable_identifier
    if { $resumable_status ne "non_resumable_request" } {
        # Yes, it is
        switch -exact $resumable_status {
            partly_done {
                doc_return 200 text/plain ok
                ad_script_abort
            }
            done {
                # All the pieces are in place
                ad_page_contract {} {
                    {file:trim "unknown"}
                }
                set "file.tmpfile" $resumable_context
                set file $resumable_identifier
            }
            invalid_resumable_request -
            default {
                doc_return 500 text/plain $resumable_context
                ad_script_abort
            }
        }
    } else {
        # Nope, it's just a straight-forward HTTP request
        ad_page_contract {} {
            file:trim
            file.tmpfile:tmpfile
        }
    }


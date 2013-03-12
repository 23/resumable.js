<?php
/**
 * Image upload server side part for Resumable.js
 * @author https://github.com/jinora
 *
 * original php server side by Gregory Chris
 */

/**
 * This is the implementation of the server side part of
 * Resumable.js client script, which sends/uploads files
 * to a server in several chunks.
 *
 * The script receives the files in a standard way as if
 * the files were uploaded using standard HTML form (multipart).
 *
 * This PHP script stores all the chunks of a file in a temporary
 * directory (`temp`) with the extension `_part<#ChunkN>`. Once all
 * the parts have been uploaded, a final destination file is
 * being created from all the stored parts (appending one by one).
 *
 * @author Gregory Chris (http://online-php.com)
 * @email www.online.php@gmail.com
 */


////////////////////////////////////////////////////////////////////
// THE FUNCTIONS
////////////////////////////////////////////////////////////////////

/**
 *
 * Logging operation - to a file (upload_log.txt) and to the stdout
 * @param string $str - the logging string
 */
function _log($str) {

    // log to the output
    $log_str = date('d.m.Y').": {$str}\r\n";
    echo $log_str;

    // log to file
    if (($fp = fopen('upload_log.txt', 'a+')) !== false) {
        fputs($fp, $log_str);
        fclose($fp);
    }
}


/**
 *
 * Delete a directory RECURSIVELY
 * @param string $dir - directory path
 * @link http://php.net/manual/en/function.rmdir.php
 */
function rrmdir($dir) {
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (filetype($dir . "/" . $object) == "dir") {
                    rrmdir($dir . "/" . $object);
                } else {
                    unlink($dir . "/" . $object);
                }
            }
        }
        reset($objects);
        rmdir($dir);
    }
}



/**
 *
 * Check if all the parts exist, and
 * gather all the parts of the file together
 * @param string $temp_dir - the temporary directory holding all the parts of the file
 * @param string $fileName - the original file name
 * @param string $chunkSize - each chunk size (in bytes)
 * @param string $totalSize - original file size (in bytes)
 * @return bool - File creation result
 */
function createFileFromChunks($temp_dir, $fileName, $chunkSize, $totalSize) {

    // count all the parts of this file
    $total_files = 0;
    foreach(scandir($temp_dir) as $file) {
        if (stripos($file, $fileName) !== false) {
            $total_files++;
        }
    }

    // check that all the parts are present
    // the size of the last part is between chunkSize and 2*$chunkSize
    if ($total_files * $chunkSize >=  ($totalSize - $chunkSize + 1)) {

        // create the final destination file 
        if (($fp = fopen('temp/'.$fileName, 'w')) !== false) {
            for ($i=1; $i<=$total_files; $i++) {
                fwrite($fp, file_get_contents($temp_dir.'/'.$fileName.'.part'.$i));
                _log('writing chunk '.$i);
            }
            fclose($fp);
        } else {
            _log('cannot create the destination file');
            return false;
        }

        // rename the temporary directory (to avoid access from other 
        // concurrent chunks uploads) and than delete it
        if (rename($temp_dir, $temp_dir.'_UNUSED')) {
            rrmdir($temp_dir.'_UNUSED');
        } else {
            rrmdir($temp_dir);
        }

        return true;
    } else {

        return false;
    }

}


function enhance($fileName, $enhancement) {

    if(!empty($enhancement)) {
        $image = new Imagick('temp/'.$fileName);

        switch($enhancement) {
            case "blur":
                $image->blurImage(8,5);
                break;
            case "wave":
                $image->waveimage(3,5);
                break;
            case "solarize":
                $image->solarizeimage(10);
                break;
            case "sepia":
                $image->sepiatoneimage(60);
                break;
            case "shade":
                $image->shadeimage(true, 45, 10);
                break;
            case "oil":
                $image->oilpaintimage(10);
                break;
            default:
                _log("unknown image enhancement");
                break;
        }

        $image->writeimage('temp/'.$fileName);
    }
}

////////////////////////////////////////////////////////////////////
// THE SCRIPT
////////////////////////////////////////////////////////////////////


// loop through files and move the chunks to a temporarily created directory
if (!empty($_FILES)) foreach ($_FILES as $file) {

    // check the error status
    if ($file['error'] != 0) {
        _log('error '.$file['error'].' in file '.$_POST['resumableFilename']);
        continue;
    }

    // init the destination file (format <filename.ext>.part<#chunk>
    // the file is stored in a temporary directory
    $temp_dir = 'temp/'.$_POST['resumableIdentifier'];
    $dest_file = $temp_dir.'/'.$_POST['resumableFilename'].'.part'.$_POST['resumableChunkNumber'];

    // create the temporary directory
    if (!is_dir($temp_dir)) {
        mkdir($temp_dir, 0777, true);
    }

    // move the temporary file
    if (!move_uploaded_file($file['tmp_name'], $dest_file)) {
        _log('Error saving (move_uploaded_file) chunk '.$_POST['resumableChunkNumber'].' for file '.$_POST['resumableFilename']);
    } else {

        // check if all the parts present, and create the final destination file
        createFileFromChunks($temp_dir, $_POST['resumableFilename'],
            $_POST['resumableChunkSize'], $_POST['resumableTotalSize']);

        enhance($_POST['resumableFilename'], $_POST['enhance']);
    }
}
# Resumable.php is a PHP package for resumable.js

[Resumable.php](https://github.com/dilab/resumable.php) provides abstraction for handling file upload in PHP.

## Installation

To install, use composer:

``` composer require dilab/resumable.php ```

## How to use
**upload.php**

```
<?php
include 'vendor/autoload.php';

use Dilab\Network\SimpleRequest;
use Dilab\Network\SimpleResponse;
use Dilab\Resumable;

$request = new SimpleRequest();
$response = new SimpleResponse();

$resumable = new Resumable($request, $response);
$resumable->tempFolder = 'tmps';
$resumable->uploadFolder = 'uploads';
$resumable->process();

```


## Testing
```
$ ./vendor/bin/phpunit
```

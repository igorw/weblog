<?php

$scriptName = $_SERVER['DOCUMENT_ROOT'].$_SERVER['SCRIPT_NAME'];
if (__FILE__ !== $scriptName && is_file($scriptName)) {
    return false;
}

require __DIR__.'/../vendor/autoload.php';
balrog_front_controller(__DIR__.'/..');

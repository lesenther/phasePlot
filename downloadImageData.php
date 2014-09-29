<?php

/**
 * downloadImageData.php
 *
 */

$data = (
  isset($_POST['data'])
    &&
  $_POST['data']!=''
)
  ? $_POST['data']
  : null;

if($data!=null){

  $filename = (
    isset($_POST['filename'])
      &&
    $_POST['filename']!=''
  )
    ? $_POST['filename']
    : "phasePlot-".date("Y-m-d_H-i-s");

  $uri = substr($data,strpos($data,",")+1);

  header("Pragma: public");
  header("Expires: 0");
  header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
  header("Cache-Control: private", false);
  header("Content-type: image/png");
  header("Content-disposition: attachment; filename=\"$filename.png\";");
  header("Content-transfer-encoding: binary");

  echo base64_decode($uri);

}else{

  die("Bad request");

}
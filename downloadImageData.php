<?php

/**
 * DownloadImageData
 *
 * Server-side helper script that will set the proper header for outputting
 * image data for plots
 *
 * To use, send POST request to script with the key-value pairs:
 *
 *   data:      [data URI from the canvas.toDataURL method]
 *   filename:  [string] (optional - see code below)
 *
 */

// Process input data
$data = (
  isset($_POST["data"])
    &&
  ($_POST["data"] != "")
)
  ? str_replace( // PHP >= 5.1.0 needs to manually convert spaces to pluses
      ' ',
      '+',
      substr( // Strip "data:image/png;base64," prefix
        $data,
        strpos($_POST["data"], ",") + 1
      )
    )
  : null;


// Check input
if ($data != null){

  // Check for a passed filename, otherwise use a default format with timestamp
  $filename = (
    isset($_POST["filename"])
      &&
    ($_POST["filename"] != '')
  )
    ? $_POST["filename"]
    : "phasePlot-".date("Y-m-d_H-i-s");

  // Set header
  header("Pragma: public");
  header("Expires: 0");
  header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
  header("Cache-Control: private", false);
  header("Content-type: image/png");
  header("Content-disposition: attachment; filename=\"$filename.png\";");
  header("Content-transfer-encoding: binary");

  // Print encoded data
  echo base64_decode($data);

}else{

  echo "Bad request";

}
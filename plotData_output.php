<?php

$plotData = array(
  "plot_type" => 4,
  "axes_labels" => array("Aa","Bb","Cc","Dd"),
  "plots" => array(
    array(
      "caption" => "Plot 1",
      "points" => array(
        array(0.1, 0.2, 300),
        array(0.2, 0.3, 400),
        array(0.3, 0.4, 500),
        array(0.4, 0.5, 600),
      )
    ),
    array(
      "caption" => "Plot 2",
      "points" => array(
        array(0.1, 0.2, 700),
        array(0.2, 0.3, 800),
        array(0.3, 0.4, 900),
        array(0.4, 0.5, 1000),
      )
    )
  )
);

echo json_encode($plotData);
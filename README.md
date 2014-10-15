# phasePlot

## Live Demos
  * [Ternary Diagram](http://htmlpreview.github.io/?https://raw.githubusercontent.com/lesenther/phasePlot/master/example.html)
  * [Quaternary Diagram](http://htmlpreview.github.io/?https://raw.githubusercontent.com/lesenther/phasePlot/master/example2.html)

## Setup

```html
<script type="text/javascript" src="phasePlot.js"></script>
```

```html
<canvas id="myCanvas"></canvas>
```

```html
<textarea id="myData"></textarea>
```

```javascript
var myPlotSheet = new plotSheet("myCanvas");

myPlotSheet.init({
  dataId: "myData",
  tempMap: true
});
```

## Plot Data
Data to create the plot is in JSON format.  Here's an example:

```javascript
{

  "plot_type": 3, // Ternary coordinate system

  "axe_labels": ["Label 1", "Label 2", "Label 3"], // Labels for the axes

  "plots":[

    {
      "caption": "Plot 1",
      "data": {
        [0.5, 0.5, 300]
        //
      }
    }

  ]
}
```

$plotData = array(
  "plot_type" => 4,
  "axes_labels" => array("Aa","Bb","Cc","Dd"),
  "plots" => array(
    array(
      "caption" => "Plot 1",
      "data" => array(
        array(0.1, 0.2, 300),
        array(0.2, 0.3, 400),
        array(0.3, 0.4, 500),
        array(0.4, 0.5, 600),
      )
    ),
    array(
      "caption" => "Plot 2",
      "data" => array(
        array(0.1, 0.2, 700),
        array(0.2, 0.3, 800),
        array(0.3, 0.4, 900),
        array(0.4, 0.5, 1000),
      )
    )
  )
);

echo json_encode($plotData);

Data to generate plots is computed on the backend by our server and either automatically or manually entered into a textarea for processing.  See example_data.js or example_data2.js.
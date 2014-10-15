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
Data to create the plot is in JSON format and should get put into the textarea container.  Here's an example:

```javascript
{

  "plot_type": 3, // Ternary coordinate system

  "axe_labels": ["Label 1", "Label 2", "Label 3"], // Labels for the axes

  "plots":[

    {
      "caption": "Plot 1",
      "data": {
        [
          0.5, // First param indicates the ratio of the first component,
          0.5, // Second param is the ratio of the second component, (Third component ratio is deduced from these two ratios)
          300  // Third param is temperature of the phase transition
        ],
        [0,0,null] // Many datapoints can be charted onto a single plot

      }
    }

   // Additional plots can be added on a single sheet

  ]
}
```

See example_data.js or example_data2.js.
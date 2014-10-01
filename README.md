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

Data to generate plots is computed on the backend by our server and either automatically or manually entered into a textarea for processing.  See example_data.js or example_data2.js.
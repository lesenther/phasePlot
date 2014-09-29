# phasePlot

## Inputs

### Link to script:

  <script type="text/javascript" src="phasePlot.js"></script>

### Create textarea with input data:

  <textarea id="myData">

  </textarea>

Data to generate plots is computed on the backend by our server and either automatically or manually entered into a textarea for processing.

See example_data.js or example_data2.js


### Create canvas element

  <canvas id="myCanvas" ondblclick="myPlotSheet.savePlot();"></canvas>

### Javascript to initialize plot:

  <script>
    var myPlotSheet=new plotSheet('myCanvas');
    myPlotSheet.init({dataId:'myData',tempMap:1});
  </script>

## Output

[img][/img]

## Configuration

TODO:  Improve support for user configuration.

## Saving Diagram Images

To save diagram images, it's helpful to set up a server-side file to assign the proper header data so that the file is automatically downloaded.  See the downloadImageData.php PHP script for an example of how to configure such a file.

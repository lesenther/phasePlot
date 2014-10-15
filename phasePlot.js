/* phasePlot */

// Track all the plotSheets on the DOM for global updating such as window
// resizing, updates to the configuration, or changes in the data source.
var plotSheets = Array();

// Global limits for page
var plot = {
    count: 0,
    min: null,
    max: null
};

// Set up event handler to replot on window resize
window.onload = window.onresize = function () {
    for (var plotSheet in plotSheets) {
        plotSheets[plotSheet].plotPoints();
    }
}

// Update all the sheets in the DOM
function updatePlotSheets() {
    for (var plotSheet in plotSheets) {
        plot.count++;
        plotSheets[plotSheet].updateConfig();
        plotSheets[plotSheet].plotPoints();
        plot.min = parseInt(
            (
                (plot.min > plotSheets[plotSheet].min)
                    ||
                (plot.min === null)
            )
                ? plotSheets[plotSheet].min
                : plot.min
        );
        plot.max = parseInt(
            (
                (plot.max < plotSheets[plotSheet].max)
                    ||
                (plot.max === null)
            )
                ? plotSheets[plotSheet].max
                : plot.max
        );
    }
}

// Primary plotSheet Object
function plotSheet(canvasId) {

    // Add sheet to page array
    plotSheets.push(this);

    // Default config settings specific to each plot
    this.config = {
        gridSize: 320,
        gridPadding: 10,
        boundingBox: false,
        originOffset: [0, 0],
        tempMin: 200,
        tempMax: 500,
        dotSize: 2,
        dotOpacity: 1,
        dotColor: "rgba(0,0,0,0.6)",
        dotNumbers: false
    }

    // Default plotSheet settings
    this.canvasId = canvasId;
    this.canvas = document.getElementById(this.canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.plotOrdinates = Array();
    this.plotIndex = 1;
    this.totalPlots = null;
    this.dataSourceId = null;
    this.dotNumber = 0;
    this.min = null;
    this.max = null;
    this.plotType = 3;
    this.tempMap = false;

    // Initialize with user config parameters
    this.init = function (config) {
        this.dataSourceId = config.dataId;
        this.processData();
        this.tempMap = config.tempMap;
        if (config.minTemp != null) {
            this.config.tempMin = config.minTemp;
            document.plotConfiguration.temp_lbound.value = config.minTemp;
        }
        if (config.maxTemp != null) {
            this.config.tempMax = config.maxTemp;
            document.plotConfiguration.temp_ubound.value = config.maxTemp;
        }
        this.state = [];
        this.state.alerted = false;
        this.plotPoints();
    }

    // Show Plot Configuration dialog when user right clicks on canvas object
    this.canvas.oncontextmenu = function () {
        //toggleDialog('plotConfiguration');

        // TODO: Embed configuration pane into function
        return false;
    }

    // Process
    this.processData = function () {
        if (document.getElementById(this.dataSourceId).value == '') {
            this.writeMessage('Failed to process data:  Data Source is empty!');
            return false;
        } else {
            var jsonData = document.getElementById(this.dataSourceId).value;
            eval("plotData="+jsonData);
            if (plotData.error) { // If server throws this flag, print message and quit
                this.writeMessage(plotData.error);
                return false;
            }

            this.plotType = plotData.plot_type; // 3 for a ternery diagram, 4 for quaternary diagram

            this.totalPlots = plotData.plots.length;

            if (this.totalPoints == 0) { // Server can return an empty dataset, deal with it
                this.writeMessage('ProcessData Error:  No plots found!');
                return false;
            }

            // Figure out the height of the sheet based on the data, the config settings for the plots and the automatic width of the canvas element
            this.config.sheetHeight = Math.ceil(this.totalPlots * (this.config.gridSize + 2 * this.config.gridPadding) / this.canvas.width) * (this.config.gridSize + 2 * this.config.gridPadding)

            // Store the plotData
            this.plotData = plotData;

            return true;
        }
    }

    // Update config from a form - TODO: Write function to generate the plot configuration form
    this.updateConfig = function () {
        this.config = {
            'gridSize': parseInt(document.plotConfiguration.grid_size.value),
            'gridPadding': parseInt(document.plotConfiguration.grid_padding.value),
            'boundingBox': document.plotConfiguration.bounding_box.checked,
            'originOffset': this.config.originOffset,
            'tempMin': this.config.tempMin,
            'tempMax': this.config.tempMax,
            'dotSize': parseFloat(document.plotConfiguration.dot_size.value),
            'dotOpacity': parseFloat(document.plotConfiguration.dot_opacity.value),
            'dotColor': document.plotConfiguration.dot_color.value,
            'dotNumbers': document.plotConfiguration.dot_numbers.checked
        }
    }

    // Determines oridinates for subplots for a plotSheet
    this.createPlotOrdinates = function () {
        var maxScreenWidth = window.innerWidth - 90 + ((this.tempMap != null) ? 40 : 0);
        var maxPlotsWidth = this.totalPlots * (this.config.gridSize + 2 * this.config.gridPadding) + ((this.tempMap != null) ? 40 : 0);
        var maxWrapperPlotsWidth = Math.floor(maxScreenWidth / (this.config.gridSize + 2 * this.config.gridPadding)) * (this.config.gridSize + 2 * this.config.gridPadding) + ((this.tempMap != null) ? 40 : 0);
        this.canvas.width = ((maxScreenWidth > maxPlotsWidth) ? (maxPlotsWidth) : (maxWrapperPlotsWidth));
        this.canvas.height = Math.ceil(this.totalPlots * (this.config.gridSize + 2 * this.config.gridPadding) / this.canvas.width) * (this.config.gridSize + 2 * this.config.gridPadding);
        var totalgridSize = this.config.gridSize + 2 * this.config.gridPadding,
            gridsXAxis = Math.floor(this.canvas.width / totalgridSize),
            gridsYAxis = Math.floor(this.canvas.height / totalgridSize);
        this.plotOrdinates.length = 0;
        for (var i = 0; i < gridsYAxis; i++)
        for (var j = 0; j < gridsXAxis; j++) {
            this.plotOrdinates.push([j * totalgridSize, i * totalgridSize]);
        }
    }

    // Set the target to the next plot by index on the page
    this.nextPlot = function () {
        this.plotIndex++;
        if (this.totalPlots != null && this.plotIndex > this.totalPlots) this.plotIndex = 1;
        this.config.originOffset = this.plotOrdinates[this.plotIndex - 1]
    }

    // Draw a single datapoint on to the canvas
    this.plotPoint = function (dataPoint) {
        var coord1 = parseFloat(dataPoint[0]),
            coord2 = parseFloat(dataPoint[1]),
            rgbVal = this.getRGBa(dataPoint[2]),
            sideSpace = (this.plotType == 3) ? 0 : 10,
            width = this.config.gridSize - sideSpace,
            height = Math.round(width * Math.sqrt(3) / 2),
            headerSpace = (width - height) / 2,
            tempOpacity = this.config.dotOpacity;

        if (this.plotType == 3) { // Ternary diagram
            x = this.config.originOffset[0] + this.config.gridPadding + this.config.gridSize * (1 / 2 * (1 - coord1 + coord2)),
            y = this.config.originOffset[1] + this.config.gridPadding + headerSpace + height * (coord1 + coord2);
        } else if (this.plotType == 4) { // Quaternary diagram
            x = this.config.originOffset[0] + this.config.gridPadding + sideSpace + width * coord2,
            y = this.config.originOffset[1] + this.config.gridPadding + headerSpace + height * (1 - coord1);
        } else {
            this.writeMessage("PlotPoint Error: Plot type not supported (" + this.plotType + ")");
            return;
        }

        this.dotNumber++;

        this.min = (this.min < dataPoint[2] && this.min !== null) ? this.min : dataPoint[2];
        this.max = (this.max > dataPoint[2] && this.max !== null) ? this.max : dataPoint[2];
        this.ctx.save();
        this.ctx.fillStyle = rgbVal;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.config.dotSize, 0, Math.PI * 2, true);
        this.ctx.fill();
        this.ctx.font = "normal 7px Tahoma";

        if (this.config.dotNumbers) {
            this.ctx.fillStyle = '#666';
            this.ctx.strokeStyle = "#ccc";
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 2);
            this.ctx.lineTo(x - 4 + Math.round(x / 100), y - 20);
            this.ctx.stroke();
            this.ctx.fillText(this.dotNumber, x - 4 + Math.round(x / 100), y - 20);
        }
        this.ctx.restore();
    }

    // Plot an array of points onto a canvas element
    this.plotPoints = function () {
        this.reset();
        if (!this.processData()) return;
        this.createPlotOrdinates();
        for (var plot in this.plotData.plots) {
            var maxScreenWidth = window.innerWidth - 90 + ((this.tempMap != null) ? 40 : 0);
            if ((maxScreenWidth - this.config.gridSize - 20) <= 0) {
                if (!this.state.alerted) {
                    alert('You screen width is too small to render content.');
                    this.state.alerted = true;
                }
                return;
            }
            var axe_offset=(plotData.plots[plot].axeOffset)?plotData.plots[plot].axeOffset:0;
            this.drawGrid(plotData.axes_labels, plotData.plots[plot].caption,axe_offset);
            for (var dataPoint in plotData.plots[plot].data)
            this.plotPoint(plotData.plots[plot].data[dataPoint]);
            this.nextPlot();
        }
        if (this.tempMap) this.addTemperatureMap();
        window.plot.min = ((window.plot.min > this.min || window.plot.min == null) ? this.min : window.plot.min);
        window.plot.max = ((window.plot.max < this.max || window.plot.min == null) ? this.max : window.plot.max);
    }

    // Clear the canvas
    this.clearCanvas = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    // Reset all parameters
    this.reset = function () {
        this.clearCanvas();
        this.dotNumber = 0;
        this.plotIndex = 1;
        this.totalPlots = 0;
        this.config.originOffset = [0, 0];
    }

    // Determine a color given a value based on the min and max limits defined in the config
    this.getRGBa = function (temp) {
        var opacity = this.config.dotOpacity,
            lbound = Math.floor(this.config.tempMin),
            ubound = Math.ceil(this.config.tempMax),
            range = ubound - lbound,
            scale, rgb;

        // Special cases for melt and nomelt keywords
        if (temp == "melt") return "rgba(249,132,229,1)";
        if (temp == "nomelt") return "rgba(0,0,0,1)";

        // Default dot color for empty
        if (temp == null || temp == "")
            return (this.tempMap)
                    ? this.config.dotColor
                    : "rgba(0,0,0,0.8)";

        // Detect out of bounds datapoints
        if (temp < lbound || temp > ubound)
            return (temp < lbound)
                    ? "rgba(0,0,200," + opacity + ")"
                    : "rgba(200,0,0," + opacity + ")";
        if (temp <= (lbound + .25 * range)) {
            scale = (lbound + .25 * range - temp) / (.25 * range);
            rgb = 255 - Math.round(scale * 255);
            return "rgba(0," + rgb + ",255," + opacity + ")";
        } else if ((temp >= (lbound + .25 * range)) && (temp < (lbound + .5 * range))) {
            scale = (lbound + .5 * range - temp) / (.25 * range);
            rgb = Math.round(scale * 255);
            return "rgba(0,255," + rgb + "," + opacity + ")";
        } else if ((temp >= (lbound + .5 * range)) && (temp < (lbound + .75 * range))) {
            scale = (lbound + .75 * range - temp) / (.25 * range);
            rgb = 255 - Math.round(scale * 255);
            return "rgba(" + rgb + ",255,0," + opacity + ")";
        } else if ((temp >= (lbound + .75 * range)) && (temp <= (lbound + range))) {
            scale = (lbound + range - temp) / (.25 * range);
            rgb = Math.round(scale * 255);
            return "rgba(255," + rgb + ",0," + opacity + ")";
        }
        return "rgba(255,105,180," + opacity + ")";
    }

    // Prints text on the plot, approximately in the center
    this.writeMessage = function (message) {
        var padding = this.config.gridPadding,
            originOffset = this.config.originOffset,
            sideSpace = (this.plotType == 3) ? 0 : 10,
            width = this.config.gridSize - sideSpace,
            height = Math.round(width * Math.sqrt(3) / 2);
        this.ctx.font = "bold 11px Tahoma";
        this.ctx.textAlign = 'center';
        this.ctx.beginPath();
        this.ctx.fillStyle = "#000";
        this.ctx.fillText(message, originOffset[0] + padding + width / 2 + sideSpace, originOffset[1] + padding + height / 2 + 6);
        this.ctx.stroke();
    }

    // Draws the boundary lines and gridlines for the diagram
    this.drawGrid = function (axeLabels, title, axeOffset) {
        var padding = this.config.gridPadding,
            originOffset = this.config.originOffset,
            edge = 2,
            sideSpace = (this.plotType == 3) ? 0 : 10,
            width = this.config.gridSize - sideSpace,
            height = Math.round(width * Math.sqrt(3) / 2),
            headerSpace = (width - height) / 2,
            slope = height / (width / 2),
            scale = height / width,
            lbl1 = axeLabels[0],
            lbl2 = axeLabels[1],
            lbl3 = axeLabels[2],
            lbl4 = (this.plotType == 3) ? null : axeLabels[3];
        this.ctx.save();
        if (this.plotType == 3) {
            this.ctx.beginPath();
            this.ctx.moveTo(originOffset[0] + width / 2 + padding, originOffset[1] + padding + headerSpace - 2 * edge);
            this.ctx.lineTo(originOffset[0] + width + padding + 2 * edge, originOffset[1] + padding + height + headerSpace + edge);
            this.ctx.lineTo(originOffset[0] + padding - 2 * edge, originOffset[1] + padding + height + headerSpace + edge);
            this.ctx.lineTo(originOffset[0] + width / 2 + padding, originOffset[1] + padding + headerSpace - 2 * edge);
            this.ctx.stroke();
        } else if (this.plotType == 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(originOffset[0] + padding + sideSpace - edge, originOffset[1] + padding + headerSpace - edge);
            this.ctx.lineTo(originOffset[0] + padding + sideSpace + width + edge, originOffset[1] + padding + headerSpace - edge);
            this.ctx.lineTo(originOffset[0] + padding + sideSpace + width + edge, originOffset[1] + padding + height + headerSpace + edge);
            this.ctx.lineTo(originOffset[0] + padding + sideSpace - edge, originOffset[1] + padding + height + headerSpace + edge);
            this.ctx.lineTo(originOffset[0] + padding + sideSpace - edge, originOffset[1] + padding + headerSpace - edge);
            this.ctx.stroke();
        } else {
            this.writeMessage("DrawGrid Error: Plot type not supported (" + this.plotType + ")");
            return;
        }

        // External box around the plot - As requested by user
        if (this.config.boundingBox) {
            this.ctx.strokeStyle = "#ccc";
            this.ctx.beginPath();
            this.ctx.moveTo(originOffset[0], originOffset[1]);
            this.ctx.lineTo(originOffset[0] + width + 2 * padding, originOffset[1]);
            this.ctx.lineTo(originOffset[0] + width + 2 * padding, originOffset[1] + width + 2 * padding);
            this.ctx.lineTo(originOffset[0], originOffset[1] + width + 2 * padding);
            this.ctx.lineTo(originOffset[0], originOffset[1]);
            this.ctx.stroke();
        }

        this.ctx.font = "bold 11px Tahoma";
        this.ctx.textAlign = 'center';
        this.ctx.beginPath();
        this.ctx.fillStyle = "#000";
        this.ctx.fillText(title, originOffset[0] + padding + width / 2 + sideSpace, originOffset[1] + padding + 6);
        this.ctx.stroke();
        if (this.plotType == 3) {
            this.ctx.beginPath();

            this.ctx.fillText(lbl1, originOffset[0] + width * 1 / 4 - 10 + padding - edge, originOffset[1] + height / 2 + padding + headerSpace);
            this.ctx.fillText(lbl2, originOffset[0] + width * 2 / 4 + 00 + padding, originOffset[1] + height / 1 + padding + 20 + headerSpace);
            this.ctx.fillText(lbl3, originOffset[0] + width * 3 / 4 + 10 + padding + edge, originOffset[1] + height / 2 + padding + headerSpace);

            this.ctx.stroke();
            this.ctx.strokeWidth = 1;
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = "#aaa";
            this.ctx.fillStyle = "#000";
            this.ctx.font = "normal 9px Tahoma";
            this.ctx.beginPath();

            if(axeOffset>0)
              this.ctx.textAlign = 'right';

            for (var x = width / 10; x < width / 2; x += width / 10) {
                this.ctx.dashedLineTo(originOffset[0] + x + padding, originOffset[1] + height - slope * x + padding + headerSpace, originOffset[0] + x * 2 + padding, originOffset[1] + height + padding + headerSpace, [4, 5]);
                this.ctx.fillText(Math.round(((100 - 200 * x / width) * (1 - axeOffset))*100)/100, originOffset[0] + x + padding - 5 - edge, originOffset[1] + height - slope * x + padding + headerSpace);
            }

            this.ctx.stroke();
            this.ctx.beginPath();

            if(axeOffset>0)
              this.ctx.textAlign = 'left';

            for (x = width / 2 + width / 10; x < width; x += width / 10) {
                this.ctx.dashedLineTo(originOffset[0] + x + padding, originOffset[1] + slope * x - height + padding + headerSpace, originOffset[0] + (x - width / 2) * 2 + padding, originOffset[1] + height + padding + headerSpace, [4, 5]);
                this.ctx.fillText(Math.round(((100 - 200 * (x - width / 2) / width) * (1 - axeOffset))*100)/100, originOffset[0] + x + padding + 5 + edge, originOffset[1] + x * slope - height + padding + headerSpace);
            }

            this.ctx.stroke();
            this.ctx.textAlign = 'center';
            this.ctx.beginPath();

            for (var y = 0; y < height; y += height / 5) {
                if (y != 0) {
                    this.ctx.dashedLineTo(originOffset[0] + (height - y) / slope + padding, originOffset[1] + y + padding + headerSpace, originOffset[0] + (height + y) / slope + padding, originOffset[1] + y + padding + headerSpace, [4, 5]);
                    this.ctx.fillText(Math.round(((100 * y / height) * (1 - axeOffset))*100)/100, originOffset[0] + y / scale + padding, originOffset[1] + height + 10 + padding + headerSpace + edge);
                }
            }

            this.ctx.stroke();
            this.ctx.restore();

        } else if (this.plotType == 4) {
            this.ctx.beginPath();
            this.ctx.fillStyle = "#000";
            this.ctx.fillText(lbl1, originOffset[0] + padding, originOffset[1] + padding + headerSpace);
            this.ctx.fillText(lbl2, originOffset[0] + padding, originOffset[1] + height + padding + headerSpace + 10);
            this.ctx.fillText(lbl3, originOffset[0] + padding + sideSpace, originOffset[1] + height + padding + 20 + headerSpace + edge);
            this.ctx.fillText(lbl4, originOffset[0] + width + padding + edge + 5, originOffset[1] + height + padding + 20 + headerSpace + edge);
            this.ctx.stroke();
            this.ctx.strokeWidth = 1;
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = "#aaa";
            this.ctx.font = "normal 9px Tahoma";
            this.ctx.textAlign = 'center';
            this.ctx.beginPath();
            for (var x = 0; x < width; x += width / 10) {
                if (Math.round(100 * x / width) != 0 && Math.round(100 * x / width) != 100) {
                    this.ctx.dashedLineTo(originOffset[0] + x + padding + sideSpace, originOffset[1] + padding + headerSpace, originOffset[0] + x + padding + sideSpace, originOffset[1] + height + padding + headerSpace, [4, 5]);
                    this.ctx.fillText(Math.round(100 * x / width), originOffset[0] + x + padding + sideSpace + edge, originOffset[1] + height + padding + headerSpace + edge + 10);
                }
            }
            this.ctx.stroke();
            this.ctx.textAlign = 'right';
            this.ctx.beginPath();
            for (var y = 0; y < height; y += height / 10) {
                if (Math.round(100 * y / height) != 0 && Math.round(100 * y / height) != 100) {
                    this.ctx.dashedLineTo(originOffset[0] + padding + sideSpace, originOffset[1] + y + padding + headerSpace, originOffset[0] + height / scale + padding + sideSpace, originOffset[1] + y + padding + headerSpace, [4, 5]);
                    this.ctx.fillText(Math.round(100 - 100 * y / height), originOffset[0] + padding - edge + sideSpace - 2, originOffset[1] + y + padding + headerSpace + edge + 2);
                }
            }
            this.ctx.stroke();
            this.ctx.restore();
        } else {
            this.writeMessage("DrawGrid Error: Plot type not supported (" + this.plotType + ")");
            return;
        }
    }

    //
    this.drawBoundingBox = function () {
        var height = this.config.gridSize * Math.sqrt(3) / 2;
        var slope = height / (this.config.gridSize / 2);
        var scale = height / this.config.gridSize;
        this.ctx.beginPath();
        this.ctx.moveTo();
        this.ctx.lineTo(this.config.gridSize + this.config.gridPadding, height + this.config.gridPadding);
        this.ctx.lineTo(this.config.gridPadding, height + this.config.gridPadding);
        this.ctx.lineTo(this.config.gridSize / 2 + this.config.gridPadding, this.config.gridPadding);
        this.ctx.stroke();
    }

    // Auto-fill the saveDesign form, which submits canvas image data to server, which sets proper header and pushes image data to user for automatic download
    this.savePlot = function () {

        if(document.phasePlotSaveForm==undefined){
            var form = document.createElement("form");
            form.setAttribute("method", "post");
            form.setAttribute("name", "phasePlotSaveForm");
            form.setAttribute("action", this.config.savePlotPath);

            var data = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", "data");
            hiddenField.setAttribute("value", this.canvas.toDataURL("image/png"));
            form.appendChild(hiddenField);

            document.body.appendChild(form);
        }

        document.phasePlotSaveForm.submit();
        document.phasePlotSaveForm.data.value = null;

    }

    // Adds a temperature map to the diagram
    this.addTemperatureMap = function () {
        this.tempMap = true;
        var tMin = Math.floor(this.config.tempMin / 10) * 10,
            tMax = Math.ceil(this.config.tempMax / 10) * 10,
            stepSize = Math.round((tMax - tMin) / Math.round(this.config.gridSize / 2)),
            start, tempOpacity = this.config.dotOpacity;
        this.config.dotOpacity = 1;
        this.ctx.save();
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.textAlign = 'right';
        this.ctx.font = 'normal 9px Tahoma';
        var i = start = 18,
            topOffset = 30,
            sideOffset = 40;
        for (var x = tMax; x >= tMin; x -= stepSize) {
            if (x % 50 == 0) this.ctx.fillText(x + '-', this.canvas.width - sideOffset - this.config.gridPadding / 2 + 20, i + 3 + topOffset);
            this.ctx.strokeStyle = this.getRGBa(x);
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width - sideOffset + 21 - this.config.gridPadding / 2, i + topOffset);
            this.ctx.lineTo(this.canvas.width - sideOffset + 39 - this.config.gridPadding / 2, i + topOffset);
            this.ctx.stroke();
            i++;
        }
        this.ctx.strokeWidth = 1;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "black";
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - sideOffset + 20 - this.config.gridPadding / 2, start + topOffset);
        this.ctx.lineTo(this.canvas.width - sideOffset + 40 - this.config.gridPadding / 2, start + topOffset);
        this.ctx.lineTo(this.canvas.width - sideOffset + 40 - this.config.gridPadding / 2, i + topOffset);
        this.ctx.lineTo(this.canvas.width - sideOffset + 20 - this.config.gridPadding / 2, i + topOffset);
        this.ctx.lineTo(this.canvas.width - sideOffset + 20 - this.config.gridPadding / 2, start + topOffset);
        this.ctx.stroke();
        this.ctx.restore();
        this.config.dotOpacity = tempOpacity;
    }
}

/**
 * Adds dashedLineTo function to the canvas prototype
 *
 * Jacked from:  http://davidowens.wordpress.com/2010/09/07/html-5-canvas-and-dashed-lines/
 **/
if (typeof CanvasRenderingContext2D !== 'undefined') {
    CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
        var lt = function (a, b) {
            return a <= b;
        };
        var gt = function (a, b) {
            return a >= b;
        };
        var capmin = function (a, b) {
            return Math.min(a, b);
        };
        var capmax = function (a, b) {
            return Math.max(a, b);
        };
        var checkX = {
            thereYet: gt,
            cap: capmin
        };
        var checkY = {
            thereYet: gt,
            cap: capmin
        };
        if (fromY - toY > 0) {
            checkY.thereYet = lt;
            checkY.cap = capmax;
        }
        if (fromX - toX > 0) {
            checkX.thereYet = lt;
            checkX.cap = capmax;
        }
        this.moveTo(fromX, fromY);
        var offsetX = fromX;
        var offsetY = fromY;
        var idx = 0,
            dash = true;

        while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
            var ang = Math.atan2(toY - fromY, toX - fromX);
            var len = pattern[idx];
            offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
            offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));
            if (dash) this.lineTo(offsetX, offsetY);
            else this.moveTo(offsetX, offsetY);
            idx = (idx + 1) % pattern.length;
            dash = !dash;
        }
    };
}

(function () {
    var sgreen = [96,197,105];
    var swhite = [198,249,253];
    var syellow = [223,241,119];
    var sorange = [188,152,218];
    var sblue = [0,194,255];
    var sred = [247,130,211];
	
	var RGB = {r : 0, g : 1, b: 2}
	var sideOrder = {L: 0, R: 1, D: 2, U: 3, B: 4, F: 6}

	var lstColor = [];
    lstColor.push({r: sgreen[0], g: sgreen[1], b: sgreen[2]});
    lstColor.push({r: swhite[0], g: swhite[1], b: swhite[2]});
    lstColor.push({r: syellow[0], g: syellow[1], b: syellow[2]});
    lstColor.push({r: sorange[0], g: sorange[1], b: sorange[2]});
    lstColor.push({r: sblue[0], g: sblue[1], b: sblue[2]});
    lstColor.push({r: sred[0], g: sred[1], b: sred[2]});
    
    sizeMatrix = [3, 3];    // matrix 3x3
    var imageWidth = document.getElementById('after').naturalWidth + 1;
    var imageHeight = document.getElementById('after').naturalHeight + 1;
	
	var distribution = [];
    for (let i = 0; i < sizeMatrix[0]; ++i) {
        distribution.push([]);
        for (let j = 0; j < sizeMatrix[1]; ++j)  
            distribution[i].push(new Array(lstColor.length).fill(0));
	}
	
	// upgrade
	var scale = 60;
	var distributionRGB = [];
	for (let i = 0; i < sizeMatrix[0]; ++i) {
        distributionRGB.push([]);
        for (let j = 0; j < sizeMatrix[1]; ++j) {  
			distributionRGB[i].push([]);
			for (let k = 0; k < 3; ++k)
				distributionRGB[i][j].push(new Array(scale + 1).fill(0));
		}
    }


    distanceSq = function (color1, color2) {
        return Math.pow(color1.r - color2.r, 2) + Math.pow(color1.g - color2.g, 2) + Math.pow(color1.b - color2.b, 2);
    }

    minDistanceIndex = function (color, lstColor) {
        minDistIndex = 0;
        for (let i = 1; i < lstColor.length; i++) {
            if (distanceSq(color, lstColor[i]) < distanceSq(color, lstColor[minDistIndex])) {
                minDistIndex = i;
            }
        }
        return minDistIndex;
    }

    indexOfMaxElement = function (arr) {
        if (arr.length == 0)
            return -1;
        let imax = 0;
        for (let i = 0; i < arr.length; ++i)
            if (arr[i] > arr[imax])
                imax = i;
        return imax;
	}
	var pixel = 0;
	scaleColor = function (rgb) {
		let sum = rgb.r + rgb.g + rgb.b;
		let pr = parseInt(rgb.r / sum * 100);
		let pg = parseInt(rgb.g / sum * 100);
		let pb = parseInt(rgb.b / sum * 100);
		dColor = {};
		dColor.pr = pr;
		dColor.pg = pg;
		dColor.pb = pb;
		return dColor;
	}

	getUnscaleColor = function (cell) {
		maxFrequentR = indexOfMaxElement(cell[RGB.r]);
		maxFrequentG = indexOfMaxElement(cell[RGB.g]);
		maxFrequentB = indexOfMaxElement(cell[RGB.b]);
		unscaleRGB = {
			r: maxFrequentR * 255 / scale,
			g: maxFrequentG * 255 / scale,
			b: maxFrequentB * 255 / scale
		}
		return unscaleRGB;
	}

    Caman.Filter.register('mapColor', function(distribution) {
        this.process('mapColor', function (rgba) {
            let x = rgba.locationXY().x;
            let y = rgba.locationXY().y;
            let cell = [Math.floor(x / (imageWidth / sizeMatrix[1])), Math.floor((y / (imageHeight / sizeMatrix[0])))];         // determine current cell
			let color = lstColor[indexOfMaxElement(distribution[cell[1]][cell[0]])];
            rgba.r = color.r;
            rgba.g = color.g;
			rgba.b = color.b;

			// upgrade
			let unscaleColor = getUnscaleColor(distributionRGB[cell[1]][cell[0]]);
			rgba.r = unscaleColor.r;
            rgba.g = unscaleColor.g;
			rgba.b = unscaleColor.b;
            return rgba;
        });
        return this;
    });

    Caman.Filter.register('preprocessing', function(lstColor) {
        this.process('preproccessing', function(rgba) {
            let x = rgba.locationXY().x;
			let y = rgba.locationXY().y;
            let cell = [Math.floor(x / (imageWidth / sizeMatrix[1])), Math.floor((y / (imageHeight / sizeMatrix[0])))];         // determine current cell
			let iColor = minDistanceIndex(rgba, lstColor);
			let dColor = scaleColor(rgba);
			distribution[cell[1]][cell[0]][iColor]++;               // because origin of 2 coordinate is different so [x, y] -> [y, x]

			// upgrade
			distributionRGB[cell[1]][cell[0]][RGB.r][dColor.pr]++;
			distributionRGB[cell[1]][cell[0]][RGB.g][dColor.pg]++;
			distributionRGB[cell[1]][cell[0]][RGB.b][dColor.pb]++;
        });
        return this;
    });

    Caman('#after', function () {
        this.preprocessing(lstColor);
        // this.mapColor(lstColor);
        this.render(function () {
            console.log(distributionRGB);
            this.mapColor(distribution);
            this.render();
        });
    });
})();
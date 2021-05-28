if (window.location.hash == '#movetogame') {
	window.location.hash = '';
	window.location.hash = '#game';
}
// utils
const convertHex = function (hex) {
	hex = hex.replace('#', '');
	r = parseInt(hex.substring(0, 2), 16);
	g = parseInt(hex.substring(2, 4), 16);
	b = parseInt(hex.substring(4, 6), 16);
	result = 'rgb(' + r + ', ' + g + ', ' + b + ')';
	return result;
}
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const convertRGB = rgbStr => '#' + rgbStr.match(/\d+/g).map(y = z => ((+z < 16) ? '0' : '') + ((+z > 255) ? 255 : +z).toString(16)).join('');

const rgb2List = rgbStr => rgbStr.match(/\d+/g).map(x => parseInt(x));

function hsvToRgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function rgbToHsv(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h, s, v]
}

// show rubik grid
const rubik_size = 3;
const defaultCellColor = 'rgb(220, 220, 220)';
const defaultCellColorHex = '#DCDCDC';

const rubik = document.querySelector(".rubik-grid-inner>tbody");
const sideColor = document.querySelector(".side-color-picker-inner>tbody");
const oneside = document.querySelector(".oneside");
const mappedColor = document.querySelector(".mapped-oneside");
const populateSide = document.querySelector('.populate-side');

var selectedColor = '';
var selectedSide = '';

var sideOrder = ['sideL', 'sideF', 'sideR', 'sideB', 'sideU', 'sideD'];
var rubikColor = {
	'sideU': localStorage.getItem('sideU') || 'rgb(245, 246, 247)',
	'sideR': localStorage.getItem('sideR') || 'rgb(7, 102, 245)',
	'sideF': localStorage.getItem('sideF') || 'rgb(227, 62, 36)',
	'sideL': localStorage.getItem('sideL') || 'rgb(20, 222, 23)',
	'sideD': localStorage.getItem('sideD') || 'rgb(229, 245, 7)',
	'sideB': localStorage.getItem('sideB') || 'rgb(240, 178, 10)',
	'default': defaultCellColor
}

const rubikMap = [
	['x', 'x', 'x', 'U1', 'U2', 'U3', 'x', 'x', 'x', 'x', 'x', 'clear'],
	['x', 'x', 'x', 'U4', 'U5', 'U6', 'x', 'x', 'x', 'x', 'x', 'x'],
	['x', 'x', 'x', 'U7', 'U8', 'U9', 'x', 'x', 'x', 'x', 'x', 'x'],
	['L1', 'L2', 'L3', 'F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'B1', 'B2', 'B3'],
	['L4', 'L5', 'L6', 'F4', 'F5', 'F6', 'R4', 'R5', 'R6', 'B4', 'B5', 'B6'],
	['L7', 'L8', 'L9', 'F7', 'F8', 'F9', 'R7', 'R8', 'R9', 'B7', 'B8', 'B9'],
	['x', 'x', 'x', 'D1', 'D2', 'D3', 'x', 'x', 'x', 'x', 'x', 'x'],
	['x', 'x', 'x', 'D4', 'D5', 'D6', 'x', 'x', 'x', 'x', 'x', 'x'],
	['x', 'x', 'x', 'D7', 'D8', 'D9', 'x', 'x', 'x', 'x', 'x', 'x']
];

const colorMap = JSON.parse(localStorage.getItem('colorMap') || '{}');

const sideMap = [
	['x', 'sideU', 'x', 'x', 'x', 'pick-frm-image'],
	['sideL', 'sideF', 'sideR', 'sideB', 'x', 'color-picker'],
	['x', 'sideD', 'x', 'x', 'x', 'submit']
];

const classNameMap = {
	'sideU': 'U5',
	'sideL': 'L5',
	'sideF': 'F5',
	'sideR': 'R5',
	'sideB': 'B5',
	'sideD': 'D5'
};

/* 
	RUBIK GRID
*/
const banClick = [
	[1, 4],
	[4, 1],
	[4, 4],
	[4, 7],
	[4, 10],
	[7, 4]
];
const clickBinder = function (i, j, currentClass) {
	if (currentClass == 'x')
		return '';
	for (let pos of banClick) {
		if (i == pos[0] && j == pos[1])
			return `style="background-color: ${rubikColor['side'+currentClass[0]] || defaultCellColor}"`;
	}
	if (currentClass == 'clear')
		return 'onClick="clearAllCell(this)"';

	return `onClick="coloringCell(this)" style="background-color: ${rubikColor[colorMap[currentClass] || 'default']}"`;
}

const textContent4Class = function (i, j, currentClass) {
	if (currentClass == 'x')
		return '';
	if (currentClass == 'clear')
		return 'Clear';
	return `<span>${currentClass}</span>`;
}

let injectHtml = '';
for (let i = 0; i < rubikMap.length; ++i) {
	injectHtml += '<tr>\n';
	for (let j = 0; j < rubikMap[0].length; ++j) {
		injectHtml += `<td class="${rubikMap[i][j]}" ${clickBinder(i, j, rubikMap[i][j])}>${textContent4Class(i, j, rubikMap[i][j])}</td>\n`;
	}
	injectHtml += '</tr>\n';
}
rubik.innerHTML += injectHtml;

/// event hanlder for rubik grid
const clearAllCell = function (element) {
	for (let key in colorMap) {
		colorMap[key] = defaultCellColor;
		document.querySelector('.rubik-grid-inner>tbody>tr>.' + key).style.backgroundColor = rubikColor['default'];
	}
	localStorage.setItem('colorMap', JSON.stringify(colorMap));
}

// color cells
const coloringCell = function (element) {
	let currentColor = selectedColor;
	if (element.style.backgroundColor == currentColor) {
		element.style.backgroundColor = defaultCellColor;
		colorMap[element.className] = '';
	} else {
		element.style.backgroundColor = currentColor;
		colorMap[element.className] = selectedSide;
	}
	localStorage.setItem('colorMap', JSON.stringify(colorMap));
}

/*
	SIDE COLOR PICKER GRID
*/
const clickBinderEdge = function (i, j, currentClass) {
	if (currentClass == 'x')
		return '';
	if (currentClass == 'pick-frm-image')
		return 'onClick="pickFromImage(this)"';
	if (currentClass == 'color-picker')
		return '';
	if (currentClass == 'submit')
		return 'onClick="submitColor(this)"';

	return `onClick="selectSide(this)" style="background-color: ${rubikColor[currentClass] || defaultColor}"`;
}

const textContent4ClassEdge = function (i, j, currentClass) {
	if (currentClass == 'x')
		return '';
	if (currentClass == 'pick-frm-image')
		return `Pick color from above captured image<br><input type="color" style="pointer-events:none" value="${defaultCellColorHex}" onchange="colorPickerChange(this)">`;
	if (currentClass == 'color-picker')
		return `Pick from color picker<br><input type="color" value="${defaultCellColorHex}" onchange="colorPickerChange(this)">`;
	if (currentClass == 'submit')
		return 'Submit color for playing!';

	return `<span>${currentClass[currentClass.length - 1]}</span>`;
}

injectHtml = '';
for (let i = 0; i < sideMap.length; ++i) {
	injectHtml += '<tr>\n';
	for (let j = 0; j < sideMap[0].length; ++j) {
		injectHtml += `<td class="${sideMap[i][j]}" ${clickBinderEdge(i, j, sideMap[i][j])}>${textContent4ClassEdge(i, j, sideMap[i][j])}</td>\n`;
	}
	injectHtml += '</tr>\n';
}
sideColor.innerHTML += injectHtml;

/// event hanlder for side color picker
const selectSide = function (element) {
	if (element.className == selectedSide) {
		element.style.border = '';
		element.style.boxShadow = '';
		selectedSide = '';
		selectedColor = defaultCellColor;
	} else {
		if (selectedSide != '') {
			prevSelectElement = document.querySelector('.' + selectedSide)
			prevSelectElement.style.border = '';
			prevSelectElement.style.boxShadow = '';
		}
		element.style.border = '3px dashed aqua';
		element.style.boxShadow = '0 8px 17px 0 rgba(0, 0, 0, 0.2)';
		selectedSide = element.className;
		selectedColor = element.style.backgroundColor || defaultCellColor;
	}
	colorHex = convertRGB(selectedColor)
	document.querySelector('.side-color-picker-inner>tbody>tr>.color-picker>input').value = colorHex;
	document.querySelector('.side-color-picker-inner>tbody>tr>.pick-frm-image>input').value = colorHex;
}

const updateGridColor = function () {
	for (let key in colorMap) {
		let currentSide = colorMap[key];
		if (currentSide == selectedSide)
			document.querySelector('.rubik-grid-inner>tbody>tr>.' + key).style.backgroundColor = rubikColor[currentSide];
	}
	localStorage.setItem('colorMap', JSON.stringify(colorMap));
}

const colorPickerChange = function (element) {
	if (selectedSide != '') {
		selectedColor = convertHex(element.value);
		document.querySelector('.' + selectedSide).style.backgroundColor = selectedColor;
		localStorage.setItem(selectedSide, selectedColor);
		rubikColor[selectedSide] = selectedColor;
		document.querySelector('.' + classNameMap[selectedSide]).style.backgroundColor = selectedColor;
		updateGridColor();

		reInitLstColor();
	}
}

const submitColor = function (element) {
	let edgeMap = 'L7D7B9L8D4L9D1F7L4B6L5L6F4L1U1B3L2U4L3U7F1D8B8D5D2F8B5F5U2B2U5U8F2R9D9B7R8D6R7D3F9R6B4R5R4F6R3U3B1R2U6R1U9F3';
	let edgeColor = new Array(54).fill('');
	if (Object.keys(colorMap).length != 48 || Object.values(colorMap).some(x => x == '')) {
		alert("Your rubik has not been completed fill !");
	} else {
		for (let i = 0; i < edgeMap.length; i += 2) {
			let edgeName = edgeMap.substr(i, 2);
			let c = ''
			if (edgeName[1] == 5) {
				c = edgeName[0];
			} else {
				c = colorMap[edgeName];
				c = c[c.length - 1];
			}
			edgeColor[parseInt(i / 2)] = c;
		}
		localStorage.setItem("edgeColor", JSON.stringify(edgeColor));
		localStorage.setItem('isNewCube', true);
		let prefs = JSON.parse(localStorage.getItem('theCube_preferences'));
		let colors = prefs.colors.cube;
		for (let key in rubikColor) {
			if (key == 'default')
				continue;
			let shortName = key[key.length-1];
			let rgb = rgb2List(rubikColor[key]);
			let hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
			hsv[2] = 0.75;
			rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
			let hexColor = rgbToHex(rgb[0], rgb[1], rgb[2]);
			let colorNumber = parseInt(hexColor.substring(1), 16);
			colors[shortName] = colorNumber;
		}
		localStorage.setItem('theCube_preferences', JSON.stringify(prefs));

		/// refresh page or re-init rubik
		document.location.hash = '';
		document.location.hash = '#movetogame';
		document.location.reload();
	}
}


const getPixelColor = function (event) {
	let x = event.pageX - event.currentTarget.offsetLeft;
	let y = event.pageY - event.currentTarget.offsetTop;
	const ctx = this.getContext('2d');
	let pixel = ctx.getImageData(event.currentTarget.width - (x+1), y, 1, 1).data;
	const rgbStr = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
	colorHex = convertRGB(rgbStr);
	document.querySelector('.side-color-picker-inner>tbody>tr>.pick-frm-image>input').value = colorHex;
	if (selectedSide != '') {
		selectedColor = rgbStr;
		document.querySelector('.' + selectedSide).style.backgroundColor = selectedColor;
		localStorage.setItem(selectedSide, selectedColor);
		rubikColor[selectedSide] = selectedColor;
		document.querySelector('.' + classNameMap[selectedSide]).style.backgroundColor = selectedColor;
		updateGridColor();

		reInitLstColor();
	}
}

const cancelPicking = function () {
	oneside.removeEventListener('click', getPixelColor);
	oneside.style.cursor = 'default';
	oneside.removeEventListener('contextmenu', cancelPicking);
}

const pickFromImage = function (element) {
	if (window.getComputedStyle(document.querySelector('.captured-image')).display == 'none') {
		alert('You have not captured any image !');
		return;
	}
	if (oneside.style.cursor != 'crosshair') {
		oneside.style.cursor = 'crosshair';
		oneside.addEventListener('click', getPixelColor);
		element.style.boxShadow = '0 8px 17px 0 rgba(0, 0, 0, 0.2)';
	} else {
		cancelPicking();
		element.style.boxShadow = '0 2px 5px 0 rgba(0, 0, 0, 0.26)';
	}
}

const reInitLstColor = function () {
	lstColor = [];
	sideOrder.forEach(key => {
		let tmp = rgb2List(rubikColor[key]);
		tmp = rgbToHsv(tmp[0], tmp[1], tmp[2]);
		lstColor.push({
			h: tmp[0],
			s: tmp[1],
			v: tmp[2]
		});
	});
	console.log(lstColor);
}

var lstColor = [-1];
reInitLstColor();

var sizeMatrix = [3, 3]; // matrix 3x3 width x height

var distribution = [];
var mapColor = [];
for (let i = 0; i < sizeMatrix[1]; ++i) {
	distribution.push([]);
	mapColor.push(new Array(sizeMatrix[0]).fill(0));
	for (let j = 0; j < sizeMatrix[0]; ++j)
		distribution[i].push(new Array(lstColor.length).fill(0));
}

distanceSq = function (color1, color2) {
	let weight = [0.1, 0.45, 0.45];
	return (weight[0]*Math.pow((color1.h - color2.h), 2) + weight[1]*Math.pow((color1.s - color2.s), 2) + weight[2]*Math.pow((color1.v - color2.v), 2));
}

isSameColor = function (color1, color2) {
	let threshold = [0.05, 0.6, 0.7];
	let ret = true;
	if (Math.abs(color1.h - color2.h) > threshold[0])
		ret = false;
	if (Math.abs(color1.s - color2.s) > threshold[1])
		ret = false;
	if (Math.abs(color1.v - color2.v) > threshold[2])
		ret = false;
	return ret;
}

lookSameLike = function (color, lstColor) {
	let idSame = [];
	for (let i = 0; i < lstColor.length; i++) {
		if (isSameColor(color, lstColor[i])) {
			// return i;
			idSame.push(i);
		}
	}
	if (idSame.length < 1)
		return -1;
	let minDistIndex = idSame[0];
	for (let i = 1; i < idSame.length; i++) {
		if (distanceSq(color, lstColor[idSame[i]]) < distanceSq(color, lstColor[minDistIndex])) {
			minDistIndex = idSame[i];
		}
	}
	if (distanceSq(color, lstColor[minDistIndex]) > 0.09)
		return -1;
	return minDistIndex;
}

minDistanceIndex = function (color, lstColor) {
	minDistIndex = 0;
	for (let i = 1; i < lstColor.length; i++) {
		if (distanceSq(color, lstColor[i]) < distanceSq(color, lstColor[minDistIndex])) {
			minDistIndex = i;
		}
	}
	if (distanceSq(color, lstColor[minDistIndex]) > 0.11)
		return -1;
	return minDistIndex;
}

argmax = function (arr) {
	if (arr.length == 0)
		return -1;
	let imax = 0;
	for (let i = 0; i < arr.length; ++i)
		if (arr[i] > arr[imax])
			imax = i;
	return imax;
}

const idx2Loc = function (idx, width, height) {
	let pixelId = Math.floor(idx / 4);
	let cellX = Math.floor((pixelId % width) * sizeMatrix[0] / width);
	let cellY = Math.floor((Math.floor(pixelId / width)) * sizeMatrix[1] / height);
	return {'x': cellX, 'y': cellY};
}

mappedColor.click = function (imgData) {
	for (let i = 0; i < sizeMatrix[1]; ++i) {
		for (let j = 0; j < sizeMatrix[0]; ++j) {
			for (let k = 0; k < lstColor.length; ++k)
				distribution[i][j][k] = 0;
		}
	}
	let pixelNum = imgData.data.length;
	let lstPixel = imgData.data;
	for (let i = 0; i < pixelNum; i += 4) {
		let loc = idx2Loc(i, imgData.width, imgData.height);
		let lstHSL = rgbToHsv(lstPixel[i], lstPixel[i+1], lstPixel[i+2])
		let hsv = {h: lstHSL[0], s: lstHSL[1], v: lstHSL[2]};
		let iColor = lookSameLike(hsv, lstColor);
		if (0 <= iColor) {
			++distribution[loc.y][loc.x][iColor];
		}
	}
	for (let i = 0; i < sizeMatrix[1]; ++i) {
		for (let j = 0; j < sizeMatrix[0]; ++j)
			mapColor[i][j] = argmax(distribution[i][j]);
	}
	let lstColorRgb = [];
	for (let i = 0; i < lstColor.length; ++i) {
		let hsv = lstColor[i];
		lstColorRgb.push(hsvToRgb(hsv.h, hsv.s, hsv.v));
	}
	for (let i = 0; i < pixelNum; i += 4) {
		let loc = idx2Loc(i, imgData.width, imgData.height);
		let rgb = lstColorRgb[mapColor[loc.y][loc.x]];
		lstPixel[i] = rgb[0];
		lstPixel[i+1] = rgb[1];
		lstPixel[i+2] = rgb[2];
	}
	return imgData;
}

populateSide.addEventListener('click', function (event) {
	if (selectedSide == '') {
		alert('You have not chosen any side yet.');
		return;
	}
	let currentSide = sideOrder[mapColor[Math.floor(sizeMatrix[1] / 2)][Math.floor(sizeMatrix[0] / 2)]];
	if (currentSide != selectedSide) {
		alert('Please turn the rubik follows the order, current side is ' + currentSide[currentSide.length - 1]);
		return;
	}
	for (let i = 0; i < sizeMatrix[1]; ++i) {
		for (let j = 0; j < sizeMatrix[0]; ++j) {
			if (i == 1 && j == 1)
				continue;
			let side = sideOrder[mapColor[i][j]];
			let selSide = selectedSide[selectedSide.length - 1];
			let edge = selSide != 'U' ? (i * sizeMatrix[0] + j + 1).toString() : (sizeMatrix[0] * sizeMatrix[1] - i * sizeMatrix[0] - j);
			colorMap[selSide + edge] = side;
		}
	}
	for (let key in colorMap) {
		if (key[0] == selectedSide[selectedSide.length - 1])
			document.querySelector('.rubik-grid-inner>tbody>tr>.' + key).style.backgroundColor = rubikColor[colorMap[key]];
	}
	localStorage.setItem('colorMap', JSON.stringify(colorMap));
});
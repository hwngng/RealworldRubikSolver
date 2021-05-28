(async function () {
	const init = document.querySelector(".init-cube");
	const wcStart = document.querySelector(".webcam-start");
	const wcShow = document.querySelector(".webcam-show");
	const bbCube = document.querySelector(".cube-bounding-box");
	const showBB = document.querySelector(".show-bounding-box");
	const oneside = document.querySelector(".oneside");
	const capture = document.querySelector(".webcam-capture");
	const captured_img = document.querySelector(".captured-image");
	const mappedColor = document.querySelector('.mapped-oneside');
	const captureBox = document.querySelector('.capture-box');
	const populateSide = document.querySelector('.populate-side');
	var isFirstMap = true;
	const autoDetect = document.querySelector('.auto-detect');
	autoDetect.disabled = true;
	capture.disabled = true;

	var isAutoDetect = true;
	var isStreaming = undefined;

	const imgCubeSize = 280;
	const captureBoxSize = 280;

	const IMG_TENSOR_SIZE = 320;
	const model_path = 'assets/rubik_model/model.json';
	const preload = async function () {
		const model = await tf.loadGraphModel(model_path);
		let img_tensor = tf.zeros([IMG_TENSOR_SIZE, IMG_TENSOR_SIZE, 3], 'float32');
		let images = tf.expandDims(img_tensor, 0);
		const _ = model.execute([images]);
		return model;
	};
	var model = await preload();
	var detected_point = -1;

	bbCube.style.top = wcShow.offsetTop;
	bbCube.style.left = wcShow.offsetLeft;
	captureBox.style.top = wcShow.offsetTop;
	captureBox.style.left = wcShow.offsetLeft;

	

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		console.log("getUserMedia() not supported.");
		return;
	}

	const iou = function (box1, box2) {
		const inter_width = Math.min(box1[0] + box1[2] * 0.5, box2[0] + box2[2] * 0.5) -
			Math.max(box1[0] - box1[2] * 0.5, box2[0] - box2[2] * 0.5);
		const inter_height = Math.min(box1[1] + box1[3] * 0.5, box2[1] + box2[3] * 0.5) -
			Math.max(box1[1] - box1[3] * 0.5, box2[1] - box2[3] * 0.5);

		const inter_area = (inter_width < 0 || inter_height < 0) ? 0.0 : inter_width * inter_height;
		return inter_area / (box1[2] * box1[3] + box2[2] * box2[3] - inter_area);
	};

	const interpret_output = function (predict_object_probs, predict_box, w, h) {
		let filtered_indices = [];
		for (let i = 0; i < predict_object_probs.length; ++i) {
			for (let j = 0; j < predict_object_probs[i].length; ++j) {
				for (let k = 0; k < predict_object_probs[i][j].length; ++k) {
					if (predict_object_probs[i][j][k] > 0.71) {
						filtered_indices.push([i, j, k]);
					}
				}
			}
		}

		let filtered_boxes = [];
		let filtered_object_probs = [];
		for (let i = 0; i < filtered_indices.length; ++i) {
			filtered_boxes.push(predict_box[filtered_indices[i][0]][filtered_indices[i][1]][filtered_indices[i][2]]);
			filtered_object_probs.push(predict_object_probs[filtered_indices[i][0]][filtered_indices[i][1]][filtered_indices[i][2]]);
		}

		filtered_boxes = filtered_boxes.map((box, idx) => [filtered_object_probs[idx], box])
			.sort(([object_prob1], [object_prob2]) => object_prob2 - object_prob1)
			.map(([, box]) => box);
		filtered_object_probs.sort((prob1, prob2) => prob2 - prob1);

		// non-maxima suppression algorithm
		for (let i = 0; i < filtered_boxes.length; ++i) {
			if (filtered_object_probs[i] == 0.0)
				continue;
			for (let j = i + 1; j < filtered_boxes.length; ++j) {
				if (iou(filtered_boxes[i], filtered_boxes[j]) > 0.5)
					filtered_object_probs[j] = 0.0;
			}
		}
		filtered_boxes = filtered_boxes.filter((_, idx) => filtered_object_probs[idx] > 0.0);
		filtered_object_probs = filtered_object_probs.filter(prob => prob > 0.0);
		const result = [];
		const isPadHeight = w > h;
		const padSize = Math.abs(w - h) / 2;
		const imgSize = isPadHeight * w + (!isPadHeight) * h;
		for (let i = 0; i < filtered_boxes.length; ++i) {
			result.push([
				filtered_boxes[i][0] * imgSize - (!isPadHeight) * padSize, // x_center
				filtered_boxes[i][1] * imgSize - (isPadHeight) * padSize, // y_center
				filtered_boxes[i][2] * imgSize, // width
				filtered_boxes[i][3] * imgSize, // height
				filtered_object_probs[i] // object occurence probability
			]);
		}
		return result;
	};

	const predict = function (img, callback) {
		tf.tidy(() => {
			const w = img.width;
			const h = img.height;
			let img_tensor = tf.browser.fromPixels(img);
			let pad_size = Math.abs(w - h) / 2;
			if (w > h) {
				img_tensor = img_tensor.pad([
					[pad_size, pad_size],
					[0, 0],
					[0, 0]
				]);
			} else if (w < h) {
				img_tensor = img_tensor.pad([
					[0, 0],
					[pad_size, pad_size],
					[0, 0]
				]);
			}
			img_tensor = img_tensor.resizeBilinear([IMG_TENSOR_SIZE, IMG_TENSOR_SIZE]).asType('float32').expandDims(0);
			let data = model.execute([img_tensor]);
			let predict_object_probs = data[0].arraySync()[0];
			let predict_box = data[1].arraySync()[0];
			let predict_out = interpret_output(predict_object_probs, predict_box, w, h);
			callback(predict_out);
		});
	}

	const drawBoundingBoxes = function (img, rects) {
		let ctx = bbCube.getContext('2d');
		let ctxImg = oneside.getContext('2d');
		let ctxMapped = mappedColor.getContext('2d');
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		rects.forEach(rect => {
			ctx.strokeStyle = "#00FFFF";
			ctx.lineWidth = 3;
			let w = rect[2];
			let h = rect[3];
			let x = rect[0] - w / 2;
			let y = rect[1] - h / 2;	
			ctx.strokeRect(bbCube.width - x - w, y, w, h);
			ctx.fillStyle = "#000000";
			ctx.fillText(Math.round(rect[4] * 100) / 100, bbCube.width - x - w, y - 5);
			
			if (rect[4] > 0.85) {
				if (detected_point > 0)
					return;
				ctxImg.clearRect(0, 0, imgCubeSize, imgCubeSize);
				ctxImg.drawImage(img, x, y, w, h, 0, 0, imgCubeSize, imgCubeSize);
				ctxMapped.clearRect(0, 0, imgCubeSize, imgCubeSize);
				imgData = mappedColor.click(ctxImg.getImageData(0, 0, imgCubeSize, imgCubeSize));
				if (isFirstMap) {
					populateSide.style.display = 'block';
					isFirstMap = false;
				}
				ctxMapped.putImageData(imgData, 0, 0);
				detected_point = performance.now();
			}
		});
	}

	const detect = function () {
		if (!isAutoDetect || !isStreaming)
			return;

		if (detected_point < 0) {
			let canvas = document.createElement("canvas");
			canvas.width = wcShow.videoWidth;
			canvas.height = wcShow.videoHeight;
			let ctx = canvas.getContext("2d");
			ctx.drawImage(wcShow, 0, 0);
			predict(canvas, (predictions) => {
				drawBoundingBoxes(canvas, predictions);
				requestAnimationFrame(() => {
					detect();
				});
			});
		} else {
			if (performance.now() - detected_point > 1000)
				detected_point = -1;
			requestAnimationFrame(() => {
				detect();
			});
		}
	};

	wcStart.addEventListener('click', function (e) {
		let video = wcShow;
		if (isStreaming === false) {
			video.play()
			isStreaming = true;
			wcStart.textContent = 'Stop webcam input';
			autoDetect.disabled = false;
			capture.disabled = false;
			detect();
			return;
		} else if (isStreaming === true) {
			video.pause()
			isStreaming = false;
			wcStart.textContent = 'Start webcam input';
			autoDetect.disabled = true;
			capture.disabled = true;

			return;
		}

		navigator.mediaDevices.getUserMedia({
				// audio: true
				video: true
			})
			.then(function (stream) {
				if ("srcObject" in video) {
					video.srcObject = stream;
				} else {
					video.src = window.URL.createObjectURL(stream);
				}
				video.onloadedmetadata = function (e) {
					isStreaming = true;
					wcStart.textContent = 'Stop webcam input';

					bbCube.width = video.offsetWidth;
					bbCube.height = video.offsetHeight;
					oneside.width = imgCubeSize;
					oneside.height = imgCubeSize;
					mappedColor.width = imgCubeSize;
					mappedColor.height = imgCubeSize;
					captureBox.width = video.offsetWidth;
					captureBox.height = video.offsetHeight;
					captured_img.style.display = 'block';

					let ctx = captureBox.getContext('2d');
					ctx.strokeStyle = "#ffffff";
					ctx.lineWidth = 2;
					ctx.strokeRect((video.clientWidth - captureBoxSize) / 2, (video.clientHeight - captureBoxSize) / 2, captureBoxSize, captureBoxSize);
					init_oneside_capture();
					capture.disabled = false;
					autoDetect.disabled = false;

					video.play();
					detect();
				};
			})
			.catch(function (err) {
				console.log(err.name + ": " + err.message);
			});
	});
	
	capture.addEventListener('click', function (e) {
		let ctxImg = oneside.getContext('2d');
		let ctxMapped = mappedColor.getContext('2d');
		ctxImg.clearRect(0, 0, imgCubeSize, imgCubeSize);
		ctxImg.drawImage(wcShow, (wcShow.clientWidth - captureBoxSize)/2, (wcShow.clientHeight - captureBoxSize)/2, captureBoxSize, captureBoxSize, 0, 0, imgCubeSize, imgCubeSize);
		ctxMapped.clearRect(0, 0, imgCubeSize, imgCubeSize);
		imgData = mappedColor.click(ctxImg.getImageData(0, 0, imgCubeSize, imgCubeSize));
		if (isFirstMap) {
			populateSide.style.display = 'block';
			isFirstMap = false;
		}
		ctxMapped.putImageData(imgData, 0, 0);
	});

	autoDetect.addEventListener('click', function (e) {
		isAutoDetect = !isAutoDetect;
		if (isAutoDetect) {
			autoDetect.textContent = 'Disable auto detecting';
			detect();
		} else {
			let ctx = bbCube.getContext('2d');
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			autoDetect.textContent = 'Enable auto detecting';
		}
		
	});

	init_oneside_capture = function () {
		let ctx = oneside.getContext('2d');
		ctx.fillStyle = "#AAA";
		ctx.fillRect(0, 0, oneside.width, oneside.height);
	}
})();
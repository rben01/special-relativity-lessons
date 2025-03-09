/*****************************************************************
 ** Author: Asvin Goel, goel@telematique.eu
 **
 ** A plugin for reveal.js adding a chalkboard.
 **
 ** Version: 2.1.0
 **
 ** License: MIT license (see LICENSE.md)
 **
 ** Credits:
 ** Chalkboard effect by Mohamed Moustafa https://github.com/mmoustafa/Chalkboard
 ** Multi color support initially added by Kurt Rinnert https://github.com/rinnert
 ** Compatibility with reveal.js v4 by Hakim El Hattab https://github.com/hakimel
 ******************************************************************/

window.RevealChalkboard = window.RevealChalkboard || {
	id: "RevealChalkboard",
	init: function (deck) {
		initChalkboard(deck);
	},
	configure: function (config) {
		configure(config);
	},
	toggleNotesCanvas: function () {
		toggleNotesCanvas();
	},
	toggleChalkboard: function () {
		toggleChalkboard();
	},
	colorIndex: function () {
		colorIndex();
	},
	colorNext: function () {
		colorNext();
	},
	colorPrev: function () {
		colorPrev();
	},
	clear: function () {
		clear();
	},
	reset: function () {
		reset();
	},
	resetAll: function () {
		resetAll();
	},
	updateStorage: function () {
		updateStorage();
	},
	getData: function () {
		return getData();
	},
	download: function () {
		download();
	},
};

function scriptPath() {
	// obtain plugin path from the script element
	let src;
	if (document.currentScript) {
		src = document.currentScript.src;
	} else {
		let sel = document.querySelector('script[src$="/chalkboard/plugin.js"]');
		if (sel) {
			src = sel.src;
		}
	}
	let path = src === undefined ? "" : src.slice(0, src.lastIndexOf("/") + 1);
	//console.log("Path: " + path);
	return path;
}
let path = scriptPath();

const initChalkboard = function (Reveal) {
	function forEachCanvas(o, func) {
		const canvases = o.canvasContainer.querySelectorAll("canvas");

		for (let i = 0, len = canvases.length; i < len; i++) {
			func(canvases[i]);
		}
	}

	// not actually constant; it changes when the window resizes (but it's constant-ish)
	let SCALE = window.devicePixelRatio;
	// list of paths; each path is a list of [x,y] pairs
	let drawnShapes = [];

	//console.warn(path);
	/* Feature detection for passive event handling*/
	let passiveSupported = false;

	try {
		window.addEventListener(
			"test",
			null,
			Object.defineProperty({}, "passive", {
				get: function () {
					passiveSupported = true;
				},
			}),
		);
	} catch (err) {}

	/*****************************************************************
	 ** Configuration
	 ******************************************************************/
	let background, pen, draw;
	let grid = false;
	let boardmarkerWidth = 3;
	let chalkWidth = 7;
	let chalkEffect = 1.0;
	let rememberColor = [true, false];
	let eraser = {
		src: path + "img/eraser-icon.svg",
		radius: 20,
	};
	let boardmarkers = [
		{
			color: "rgba(100,100,100,1)",
			cursor: "url(" + path + "img/boardmarker-black.png), auto",
		},
		{
			color: "rgba(30,144,255, 1)",
			cursor: "url(" + path + "img/boardmarker-blue.png), auto",
		},
		{
			color: "rgba(220,20,60,1)",
			cursor: "url(" + path + "img/boardmarker-red.png), auto",
		},
		{
			color: "rgba(50,205,50,1)",
			cursor: "url(" + path + "img/boardmarker-green.png), auto",
		},
		{
			color: "rgba(255,140,0,1)",
			cursor: "url(" + path + "img/boardmarker-orange.png), auto",
		},
		{
			color: "rgba(150,0,20150,1)",
			cursor: "url(" + path + "img/boardmarker-purple.png), auto",
		},
		{
			color: "rgba(255,220,0,1)",
			cursor: "url(" + path + "img/boardmarker-yellow.png), auto",
		},
	];
	let chalks = [
		{
			color: "rgba(255,255,255,0.5)",
			cursor: "url(" + path + "img/chalk-white.png), auto",
		},
		{
			color: "rgba(96, 154, 244, 0.5)",
			cursor: "url(" + path + "img/chalk-blue.png), auto",
		},
		{
			color: "rgba(237, 20, 28, 0.5)",
			cursor: "url(" + path + "img/chalk-red.png), auto",
		},
		{
			color: "rgba(20, 237, 28, 0.5)",
			cursor: "url(" + path + "img/chalk-green.png), auto",
		},
		{
			color: "rgba(220, 133, 41, 0.5)",
			cursor: "url(" + path + "img/chalk-orange.png), auto",
		},
		{
			color: "rgba(220,0,220,0.5)",
			cursor: "url(" + path + "img/chalk-purple.png), auto",
		},
		{
			color: "rgba(255,220,0,0.5)",
			cursor: "url(" + path + "img/chalk-yellow.png), auto",
		},
	];
	let keyBindings = {
		toggleNotesCanvas: {
			keyCode: 67,
			key: "C",
			description: "Toggle notes canvas",
		},
		toggleChalkboard: {
			keyCode: 66,
			key: "B",
			description: "Toggle chalkboard",
		},
		clear: {
			keyCode: 46,
			key: "DEL",
			description: "Clear drawings on slide",
		},
		/*
		reset: {
			keyCode: 173,
			key: '-',
			description: 'Reset drawings on slide'
		},
*/
		resetAll: {
			keyCode: 8,
			key: "BACKSPACE",
			description: "Reset all drawings",
		},
		colorNext: {
			keyCode: 88,
			key: "X",
			description: "Next color",
		},
		colorPrev: {
			keyCode: 89,
			key: "Y",
			description: "Previous color",
		},
		download: {
			keyCode: 68,
			key: "D",
			description: "Download drawings",
		},
	};

	let drawingCanvas = [
		{
			id: "notescanvas",
		},
		{
			id: "chalkboard",
		},
	];

	let theme = "chalkboard";
	let color = [0, 0];
	let toggleChalkboardButton = false;
	let toggleNotesButton = false;
	let colorButtons = true;
	let boardHandle = true;
	let transition = 800;

	const tools = [
		{ name: "freehand", iconMaskFilename: "scribble-icon.svg" },
		{ name: "line", iconMaskFilename: "ruler-icon.svg" },
		{ name: "rect", iconMaskFilename: "rectangle-icon.svg" },
	];

	let currentTool = "freehand";

	let readOnly = false;
	let messageType = "broadcast";

	let config = configure(Reveal.getConfig().chalkboard || {});
	if (config.keyBindings) {
		for (let key in config.keyBindings) {
			keyBindings[key] = config.keyBindings[key];
		}
	}

	function configure(config) {
		if (config.boardmarkerWidth || config.penWidth)
			boardmarkerWidth = config.boardmarkerWidth || config.penWidth;
		if (config.chalkWidth) chalkWidth = config.chalkWidth;
		if (config.chalkEffect) chalkEffect = config.chalkEffect;
		if (config.rememberColor) rememberColor = config.rememberColor;
		if (config.eraser) eraser = config.eraser;
		if (config.boardmarkers) boardmarkers = config.boardmarkers;
		if (config.chalks) chalks = config.chalks;

		if (config.theme) theme = config.theme;
		switch (theme) {
			case "whiteboard":
				background = ["rgba(127,127,127,.1)", path + "img/whiteboard.png"];
				draw = [drawWithBoardmarker, drawWithBoardmarker];
				pens = [boardmarkers, boardmarkers];
				grid = {
					color: "rgb(127,127,255,0.1)",
					distance: 40,
					width: 2,
				};
				break;
			case "chalkboard":
			default:
				background = ["rgba(127,127,127,.1)", path + "img/blackboard.png"];
				draw = [drawWithBoardmarker, drawWithChalk];
				pens = [boardmarkers, chalks];
				grid = {
					color: "rgb(50,50,10,0.5)",
					distance: 80,
					width: 2,
				};
		}

		if (config.background) background = config.background;
		if (config.grid != undefined) grid = config.grid;

		if (config.toggleChalkboardButton != undefined)
			toggleChalkboardButton = config.toggleChalkboardButton;
		if (config.toggleNotesButton != undefined)
			toggleNotesButton = config.toggleNotesButton;
		if (config.colorButtons != undefined) colorButtons = config.colorButtons;
		if (config.boardHandle != undefined) boardHandle = config.boardHandle;
		if (config.transition) transition = config.transition;

		if (config.readOnly != undefined) readOnly = config.readOnly;
		if (config.messageType) messageType = config.messageType;

		if (drawingCanvas && (config.theme || config.background || config.grid)) {
			let canvas = document.getElementById(drawingCanvas[1].id);
			canvas.style.background = 'url("' + background[1] + '") repeat';
			clearCanvases(1);
			drawGrid();
		}

		return config;
	}
	/*****************************************************************
	 ** Setup
	 ******************************************************************/

	function whenReady(callback) {
		// wait for markdown to be parsed and code to be highlighted
		if (
			!document.querySelector("section[data-markdown]:not([data-markdown-parsed])") &&
			!document.querySelector('code[data-line-numbers*="|"]')
		) {
			callback();
		} else {
			console.log("Wait for markdown to be parsed and code to be highlighted");
			setTimeout(whenReady, 500, callback);
		}
	}

	function whenLoaded(callback) {
		// wait for drawings to be loaded and markdown to be parsed
		if (loaded !== null) {
			callback();
		} else {
			console.log("Wait for drawings to be loaded");
			setTimeout(whenLoaded, 500, callback);
		}
	}

	if (toggleChalkboardButton) {
		console.warn(
			"toggleChalkboardButton is deprecated, use customcontrols plugin instead!",
		);
		//console.log("toggleChalkboardButton")
		let button = document.createElement("div");
		button.className = "chalkboard-button";
		button.id = "toggle-chalkboard";
		button.style.visibility = "visible";
		button.style.position = "absolute";
		button.style.zIndex = 30;
		button.style.fontSize = "24px";

		button.style.left = toggleChalkboardButton.left || "30px";
		button.style.bottom = toggleChalkboardButton.bottom || "30px";
		button.style.top = toggleChalkboardButton.top || "auto";
		button.style.right = toggleChalkboardButton.right || "auto";

		button.innerHTML =
			'<a href="#" title="Toggle chalkboard (' +
			keyBindings.toggleChalkboard.key +
			')" onclick="RevealChalkboard.toggleChalkboard(); return false;"><i class="fa fa-pen-square"></i></a>';
		document.querySelector(".reveal").appendChild(button);
	}
	if (toggleNotesButton) {
		console.warn("toggleNotesButton is deprecated, use customcontrols plugin instead!");
		//console.log("toggleNotesButton")
		let button = document.createElement("div");
		button.className = "chalkboard-button";
		button.id = "toggle-notes";
		button.style.position = "absolute";
		button.style.zIndex = 30;
		button.style.fontSize = "24px";

		button.style.left = toggleNotesButton.left || "70px";
		button.style.bottom = toggleNotesButton.bottom || "30px";
		button.style.top = toggleNotesButton.top || "auto";
		button.style.right = toggleNotesButton.right || "auto";

		button.innerHTML =
			'<a href="#" title="Toggle slide annotation (' +
			keyBindings.toggleNotesCanvas.key +
			')" onclick="RevealChalkboard.toggleNotesCanvas(); return false;"><i class="fa fa-pen"></i></a>';
		document.querySelector(".reveal").appendChild(button);
	}

	setupDrawingCanvas(0);
	setupDrawingCanvas(1);

	let mode = 0; // 0: notes canvas, 1: chalkboard
	let board = 0; // board index (only for chalkboard)

	let mouseX = 0;
	let mouseY = 0;
	let lastX = null;
	let lastY = null;

	let drawing = false;
	let erasing = false;

	let slideStart = Date.now();
	let slideIndices = {
		h: 0,
		v: 0,
	};

	let timeouts = [[], []];
	let touchTimeout = null;
	let slidechangeTimeout = null;
	let updateStorageTimeout = null;
	let playback = false;

	function createPalette(colors, length) {
		if (length === true || length > colors.length) {
			length = colors.length;
		}
		let palette = document.createElement("div");
		palette.classList.add("palette");
		palette.addEventListener("mousedown", evt => {
			evt.stopPropagation();
		});

		let list = document.createElement("ul");
		list.classList.add("color-list");

		// color pickers
		for (let i = 0; i < length; i++) {
			let colorButton = document.createElement("li");
			if (i === 0) {
				colorButton.classList.add("selected");
			}
			colorButton.setAttribute("data-color", i);
			colorButton.style.color = colors[i].color;
			colorButton.style.background = colors[i].color;
			colorButton.addEventListener("click", function (e) {
				let element = e.target;
				while (!element.hasAttribute("data-color")) {
					element = element.parentElement;
				}
				colorIndex(parseInt(element.getAttribute("data-color")));

				const colorButtons = list.querySelectorAll("li");
				for (let i = 0; i < length; i++) {
					const colorButton = colorButtons[i];
					if (colorButton === element) {
						colorButton.classList.add("selected");
					} else {
						colorButton.classList.remove("selected");
					}
				}

				palette.classList.remove("faded");
			});

			colorButton.addEventListener("touchstart", function (e) {
				let element = e.target;
				while (!element.hasAttribute("data-color")) {
					element = element.parentElement;
				}
				colorIndex(parseInt(element.getAttribute("data-color")));
			});
			list.appendChild(colorButton);
		}
		palette.appendChild(list);

		const toolList = document.createElement("ul");
		toolList.classList.add("tool-list");
		for (const { name, faIconClass, iconMaskFilename } of tools) {
			const toolButton = document.createElement("li");
			toolButton.setAttribute("data-tool", name);

			const childMaskedDiv = document.createElement("div");
			childMaskedDiv.classList.add("tool-button-background");

			// remove domain (eg https://blah.com)
			const pathToImgDir = path.replace(/^\w+:\/\/[^/]+/, "");
			childMaskedDiv.style.mask = `url('${pathToImgDir}img/${iconMaskFilename}')`;
			toolButton.appendChild(childMaskedDiv);

			if (name === currentTool) {
				toolButton.classList.add("selected");
			}
			toolList.appendChild(toolButton);

			for (const event of ["click", "touchstart"]) {
				toolButton.addEventListener(event, e => {
					const element = e.target.closest("li[data-tool]");
					currentTool = element.dataset.tool;

					const children = toolList.children;
					for (let i = 0, len = children.length; i < len; i++) {
						const child = children[i];

						if (child === element) {
							child.classList.add("selected");
						} else {
							child.classList.remove("selected");
						}
					}

					palette.classList.remove("faded");
				});
			}
		}

		palette.appendChild(toolList);

		return palette;
	}

	function switchBoard(boardIdx) {
		selectBoard(boardIdx, true);
		// broadcast
		let message = new CustomEvent(messageType);
		message.content = {
			sender: "chalkboard-plugin",
			type: "selectboard",
			timestamp: Date.now() - slideStart,
			mode,
			board,
		};
		document.dispatchEvent(message);
	}

	function appendNewCanvas(id) {
		const canvasContainer = drawingCanvas[id].canvasContainer;

		let canvas = document.createElement("canvas");
		canvas.style.width = `${drawingCanvas[id].width}px`;
		canvas.style.height = `${drawingCanvas[id].height}px`;

		canvas.width = Math.floor(SCALE * drawingCanvas[id].width);
		canvas.height = Math.floor(SCALE * drawingCanvas[id].height);

		canvas.setAttribute("data-chalkboard", id);
		canvas.style.cursor = pens[id][color[id]].cursor;

		canvas.getContext("2d").scale(SCALE, SCALE);

		canvasContainer.appendChild(canvas);

		return canvas;
	}

	function setupDrawingCanvas(id) {
		let container = document.createElement("div");
		container.id = drawingCanvas[id].id;
		container.classList.add("overlay");
		container.setAttribute("data-prevent-swipe", "true");
		container.oncontextmenu = function () {
			return false;
		};
		container.style.cursor = pens[id][color[id]].cursor;

		drawingCanvas[id].width = window.innerWidth;
		drawingCanvas[id].height = window.innerHeight;
		drawingCanvas[id].scale = 1;
		drawingCanvas[id].xOffset = 0;
		drawingCanvas[id].yOffset = 0;

		if (id == "0") {
			container.style.background = "rgba(0,0,0,0)";
			container.style.zIndex = 24;
			container.style.opacity = 1;
			container.style.visibility = "visible";
			container.style.pointerEvents = "none";

			let slides = document.querySelector(".slides");
			let aspectRatio = Reveal.getConfig().width / Reveal.getConfig().height;
			if (drawingCanvas[id].width > drawingCanvas[id].height * aspectRatio) {
				drawingCanvas[id].xOffset =
					(drawingCanvas[id].width - drawingCanvas[id].height * aspectRatio) / 2;
			} else if (drawingCanvas[id].height > drawingCanvas[id].width / aspectRatio) {
				drawingCanvas[id].yOffset =
					(drawingCanvas[id].height - drawingCanvas[id].width / aspectRatio) / 2;
			}

			if (colorButtons) {
				let palette = createPalette(boardmarkers, colorButtons);
				palette.style.visibility = "hidden"; // only show palette in drawing mode
				container.appendChild(palette);
			}
		} else {
			container.style.background = 'url("' + background[id] + '") repeat';
			container.style.zIndex = 26;
			container.style.opacity = 0;
			container.style.visibility = "hidden";

			if (colorButtons) {
				let palette = createPalette(chalks, colorButtons);
				container.appendChild(palette);
			}
			if (boardHandle) {
				let handle = document.createElement("div");
				handle.classList.add("boardhandle");
				handle.innerHTML =
					'<ul><li><a id="previousboard" href="#" title="Previous board"><i class="fas fa-chevron-up"></i></a></li><li><a id="nextboard" href="#" title="Next board"><i class="fas fa-chevron-down"></i></a></li></ul>';
				handle.querySelector("#previousboard").addEventListener("click", function (e) {
					e.preventDefault();
					switchBoard(board - 1);
				});
				handle.querySelector("#nextboard").addEventListener("click", function (e) {
					e.preventDefault();
					switchBoard(board + 1);
				});
				handle
					.querySelector("#previousboard")
					.addEventListener("touchstart", function (e) {
						e.preventDefault();
						switchBoard(board - 1);
					});
				handle.querySelector("#nextboard").addEventListener("touchstart", function (e) {
					e.preventDefault();
					switchBoard(board + 1);
				});

				container.appendChild(handle);
			}
		}

		let sponge = document.createElement("img");
		sponge.src = eraser.src;
		sponge.id = "sponge";
		sponge.style.visibility = "hidden";
		sponge.style.position = "absolute";
		container.appendChild(sponge);
		drawingCanvas[id].sponge = sponge;

		const canvasContainer = document.createElement("div");
		canvasContainer.classList.add("canvas-container");
		canvasContainer.setAttribute("data-container-chalkboard", id);
		container.prepend(canvasContainer);

		drawingCanvas[id].canvasContainer = canvasContainer;

		document.querySelector(".reveal").appendChild(container);
		drawingCanvas[id].container = container;

		const backgroundCanvas = appendNewCanvas(id);
		backgroundCanvas.classList.add("canvas-background");

		const foregroundCanvas = appendNewCanvas(id);
		foregroundCanvas.classList.add("canvas-foreground");

		drawingCanvas[id].canvases = {
			background: backgroundCanvas,
			foreground: foregroundCanvas,
		};

		setupCanvasEvents(container);
	}

	/*****************************************************************
	 ** Storage
	 ******************************************************************/

	let storage = [
		{
			width: Reveal.getConfig().width,
			height: Reveal.getConfig().height,
			data: [],
		},
		{
			width: Reveal.getConfig().width,
			height: Reveal.getConfig().height,
			data: [],
		},
	];

	let loaded = null;

	if (config.storage) {
		// Get chalkboard drawings from session storage
		loaded = initStorage(sessionStorage.getItem(config.storage));
	}

	if (!loaded && config.src != null) {
		// Get chalkboard drawings from the given file
		loadData(config.src);
	}

	/**
	 * Initialize storage.
	 */
	function initStorage(json) {
		let success = false;
		try {
			let data = JSON.parse(json);
			for (let id = 0; id < data.length; id++) {
				if (
					drawingCanvas[id].width != data[id].width ||
					drawingCanvas[id].height != data[id].height
				) {
					drawingCanvas[id].scale = Math.min(
						drawingCanvas[id].width / data[id].width,
						drawingCanvas[id].height / data[id].height,
					);
					drawingCanvas[id].xOffset =
						(drawingCanvas[id].width - data[id].width * drawingCanvas[id].scale) / 2;
					drawingCanvas[id].yOffset =
						(drawingCanvas[id].height - data[id].height * drawingCanvas[id].scale) / 2;
				}
				if (config.readOnly) {
					drawingCanvas[id].container.style.cursor = "default";
					forEachCanvas(drawingCanvas[id], (canvas.style.cursor = "default"));
				}
			}
			success = true;
			storage = data;
		} catch (err) {
			console.warn("Cannot initialise storage!");
		}
		return success;
	}

	/**
	 * Load data.
	 */
	function loadData(filename) {
		let xhr = new XMLHttpRequest();
		xhr.onload = function () {
			if (xhr.readyState === 4 && xhr.status != 404) {
				loaded = initStorage(xhr.responseText);
				updateStorage();
				console.log("Drawings loaded from file");
			} else {
				config.readOnly = undefined;
				readOnly = undefined;
				console.warn(
					"Failed to get file " +
						filename +
						". ReadyState: " +
						xhr.readyState +
						", Status: " +
						xhr.status,
				);
				loaded = false;
			}
		};

		xhr.open("GET", filename, true);
		try {
			xhr.send();
		} catch (error) {
			config.readOnly = undefined;
			readOnly = undefined;
			console.warn(
				"Failed to get file " +
					filename +
					". Make sure that the presentation and the file are served by a HTTP server and the file can be found there. " +
					error,
			);
			loaded = false;
		}
	}

	function storageChanged(now) {
		if (!now) {
			// create or update timer
			if (updateStorageTimeout) {
				clearTimeout(updateStorageTimeout);
			}
			updateStorageTimeout = setTimeout(storageChanged, 1000, true);
		} else {
			// console.log("Update storage", updateStorageTimeout,  Date.now());
			updateStorage();
			updateStorageTimeout = null;
		}
	}

	function updateStorage() {
		let json = JSON.stringify(storage);
		if (config.storage) {
			sessionStorage.setItem(config.storage, json);
		}
		return json;
	}

	function recordEvent(event) {
		//console.log(event);
		event.time = Date.now() - slideStart;
		if (mode == 1) event.board = board;
		let slideData = getSlideData();
		let i = slideData.events.length;
		while (i > 0 && event.time < slideData.events[i - 1].time) {
			i--;
		}
		slideData.events.splice(i, 0, event);
		slideData.duration = Math.max(slideData.duration, Date.now() - slideStart) + 1;

		storageChanged();
	}

	/**
	 * Get data as json string.
	 */
	function getData() {
		// cleanup slide data without events
		for (let id = 0; id < 2; id++) {
			for (let i = storage[id].data.length - 1; i >= 0; i--) {
				if (storage[id].data[i].events.length == 0) {
					storage[id].data.splice(i, 1);
				}
			}
		}

		return updateStorage();
	}

	/**
	 * Download data.
	 */
	function downloadData() {
		let a = document.createElement("a");
		document.body.appendChild(a);
		try {
			a.download = "chalkboard.json";
			let blob = new Blob([getData()], {
				type: "application/json",
			});
			a.href = window.URL.createObjectURL(blob);
		} catch (error) {
			// https://stackoverflow.com/a/6234804
			// escape data for proper handling of quotes and line breaks
			// in case malicious gets a chance to craft the exception message
			error = String(error)
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");

			a.innerHTML += " (" + error + ")";
		}
		a.click();
		document.body.removeChild(a);
	}

	/**
	 * Returns data object for the slide with the given indices.
	 */
	function getSlideData(indices, id) {
		if (id == undefined) id = mode;
		if (!indices) indices = slideIndices;
		let data;
		for (let i = 0; i < storage[id].data.length; i++) {
			if (
				storage[id].data[i].slide.h === indices.h &&
				storage[id].data[i].slide.v === indices.v &&
				storage[id].data[i].slide.f === indices.f
			) {
				data = storage[id].data[i];
				return data;
			}
		}
		let page = Number(Reveal.getCurrentSlide().getAttribute("data-pdf-page-number"));
		//console.log( indices, Reveal.getCurrentSlide() );
		storage[id].data.push({
			slide: indices,
			page,
			events: [],
			duration: 0,
		});
		data = storage[id].data[storage[id].data.length - 1];
		return data;
	}

	/**
	 * Returns maximum duration of slide playback for both modes
	 */
	function getSlideDuration(indices) {
		if (!indices) indices = slideIndices;
		let duration = 0;
		for (let id = 0; id < 2; id++) {
			for (let i = 0; i < storage[id].data.length; i++) {
				if (
					storage[id].data[i].slide.h === indices.h &&
					storage[id].data[i].slide.v === indices.v &&
					storage[id].data[i].slide.f === indices.f
				) {
					duration = Math.max(duration, storage[id].data[i].duration);
					break;
				}
			}
		}
		//console.log( duration );
		return duration;
	}

	/*****************************************************************
	 ** Print
	 ******************************************************************/
	let printMode = /print-pdf/gi.test(window.location.search);
	//console.log("createPrintout" + printMode)

	function addPageNumbers() {
		// determine page number for printouts with fragments serialised
		let slides = Reveal.getSlides();
		let page = 0;
		for (let i = 0; i < slides.length; i++) {
			slides[i].setAttribute("data-pdf-page-number", page.toString());
			// add number of fragments without fragment indices
			let count = slides[i].querySelectorAll(
				".fragment:not([data-fragment-index])",
			).length;
			let fragments = slides[i].querySelectorAll(".fragment[data-fragment-index]");
			for (let j = 0; j < fragments.length; j++) {
				// increasenumber of fragments by highest fragment index (which start at 0)
				if (Number(fragments[j].getAttribute("data-fragment-index")) + 1 > count) {
					count = Number(fragments[j].getAttribute("data-fragment-index")) + 1;
				}
			}
			//console.log(count,fragments.length,( slides[i].querySelector('h1,h2,h3,h4')||{}).innerHTML, page);
			page += count + 1;
		}
	}

	function createPrintout() {
		//console.warn(Reveal.getTotalSlides(),Reveal.getSlidesElement());
		if (storage[1].data.length == 0) return;
		console.log("Create printout(s) for " + storage[1].data.length + " slides");
		drawingCanvas[0].container.style.opacity = 0; // do not print notes canvas
		drawingCanvas[0].container.style.visibility = "hidden";

		let patImg = new Image();
		patImg.onload = function () {
			let slides = Reveal.getSlides();
			//console.log(slides);
			for (let i = storage[1].data.length - 1; i >= 0; i--) {
				console.log(
					"Create printout for slide " +
						storage[1].data[i].slide.h +
						"." +
						storage[1].data[i].slide.v,
				);
				let slideData = getSlideData(storage[1].data[i].slide, 1);
				let drawings = createDrawings(slideData, patImg);
				//console.log("Page:", storage[ 1 ].data[ i ].page );
				//console.log("Slide:", slides[storage[ 1 ].data[ i ].page] );
				addDrawings(slides[storage[1].data[i].page], drawings);
			}
			//			Reveal.sync();
		};
		patImg.src = background[1];
	}

	function cloneCanvas(oldCanvas) {
		//create a new canvas
		let newCanvas = document.createElement("canvas");
		let context = newCanvas.getContext("2d");
		//set dimensions
		newCanvas.width = oldCanvas.width;
		newCanvas.height = oldCanvas.height;
		//apply the old canvas to the new one
		context.drawImage(oldCanvas, 0, 0);
		//return the new canvas
		return newCanvas;
	}

	function getCanvases(template, container, board) {
		let idx = container.findIndex(element => element.board === board);
		if (idx === -1) {
			let canvas = cloneCanvas(template);
			if (!container.length) {
				idx = 0;
				container.push({
					board,
					canvas,
				});
			} else if (board < container[0].board) {
				idx = 0;
				container.unshift({
					board,
					canvas,
				});
			} else if (board > container[container.length - 1].board) {
				idx = container.length;
				container.push({
					board,
					canvas,
				});
			}
		}

		return container[idx].canvases;
	}

	function createDrawings(slideData, patImg) {
		let width = Reveal.getConfig().width;
		let height = Reveal.getConfig().height;
		let scale = 1;
		let xOffset = 0;
		let yOffset = 0;
		if (width != storage[1].width || height != storage[1].height) {
			scale = Math.min(width / storage[1].width, height / storage[1].height);
			xOffset = (width - storage[1].width * scale) / 2;
			yOffset = (height - storage[1].height * scale) / 2;
		}
		mode = 1;
		board = 0;
		//		console.log( 'Create printout(s) for slide ', slideData );

		let drawings = [];
		let template = document.createElement("canvas");
		template.width = width;
		template.height = height;

		let imgCtx = template.getContext("2d");
		imgCtx.fillStyle = imgCtx.createPattern(patImg, "repeat");
		imgCtx.rect(0, 0, width, height);
		imgCtx.fill();

		for (let j = 0; j < slideData.events.length; j++) {
			switch (slideData.events[j].type) {
				case "draw":
					draw[1](
						getCanvases(template, drawings, board).getContext("2d"),
						xOffset + slideData.events[j].x1 * scale,
						yOffset + slideData.events[j].y1 * scale,
						xOffset + slideData.events[j].x2 * scale,
						yOffset + slideData.events[j].y2 * scale,
						yOffset + slideData.events[j].color,
					);
					break;
				case "erase":
					eraseWithSponge(
						getCanvases(template, drawings, board).getContext("2d"),
						xOffset + slideData.events[j].x * scale,
						yOffset + slideData.events[j].y * scale,
					);
					break;
				case "selectboard":
					selectBoard(slideData.events[j].board);
					break;
				case "clear":
					getCanvases(template, drawings, board)
						.getContext("2d")
						.clearRect(0, 0, width, height);
					getCanvases(template, drawings, board).getContext("2d").fill();
					break;
				default:
					break;
			}
		}

		drawings = drawings.sort((a, b) => (a.board > b.board && 1) || -1);

		mode = 0;

		return drawings;
	}

	function addDrawings(slide, drawings) {
		let parent = slide.parentElement.parentElement;
		let nextSlide = slide.parentElement.nextElementSibling;

		for (let i = 0; i < drawings.length; i++) {
			let newPDFPage = document.createElement("div");
			newPDFPage.classList.add("pdf-page");
			newPDFPage.style.height = Reveal.getConfig().height;
			for (const canvas of drawings[i].canvases) {
				newPDFPage.append(canvas);
			}
			//console.log("Add drawing", newPDFPage);
			if (nextSlide != null) {
				parent.insertBefore(newPDFPage, nextSlide);
			} else {
				parent.append(newPDFPage);
			}
		}
	}

	/*****************************************************************
	 ** Drawings
	 ******************************************************************/

	function drawWithBoardmarker(context, fromX, fromY, toX, toY, colorIdx) {
		if (colorIdx == undefined) colorIdx = color[mode];
		context.lineWidth = boardmarkerWidth;
		context.lineCap = "round";
		context.lineJoin = "round";
		context.strokeStyle = boardmarkers[colorIdx].color;
		context.beginPath();
		context.moveTo(fromX, fromY);
		context.lineTo(toX, toY);
		context.stroke();
	}

	function drawWithChalk(context, fromX, fromY, toX, toY, colorIdx) {
		if (colorIdx == undefined) colorIdx = color[mode];
		let brushDiameter = chalkWidth;
		context.lineWidth = brushDiameter;
		context.lineCap = "round";
		context.fillStyle = chalks[colorIdx].color; // 'rgba(255,255,255,0.5)';
		context.strokeStyle = chalks[colorIdx].color;
		/*let opacity = Math.min(0.8, Math.max(0,color[1].replace(/^.*,(.+)\)/,'$1') - 0.1)) + Math.random()*0.2;*/
		let opacity = 1.0;
		context.strokeStyle = context.strokeStyle.replace(/[\d\.]+\)$/g, opacity + ")");
		context.beginPath();
		context.moveTo(fromX, fromY);
		context.lineTo(toX, toY);
		context.stroke();
		// Chalk Effect
		let length = Math.round(
			Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)) /
				(5 / brushDiameter),
		);
		let xUnit = (toX - fromX) / length;
		let yUnit = (toY - fromY) / length;
		for (let i = 0; i < length; i++) {
			if (chalkEffect > Math.random() * 0.9) {
				let xCurrent = fromX + i * xUnit;
				let yCurrent = fromY + i * yUnit;
				let xRandom = xCurrent + (Math.random() - 0.5) * brushDiameter * 1.2;
				let yRandom = yCurrent + (Math.random() - 0.5) * brushDiameter * 1.2;
				context.clearRect(xRandom, yRandom, Math.random() * 2 + 2, Math.random() + 1);
			}
		}
	}

	function eraseWithSponge(context, x, y) {
		context.save();
		context.beginPath();
		context.arc(x, y, eraser.radius, 0, 2 * Math.PI, false);
		context.clip();
		context.clearRect(
			x - eraser.radius - 1,
			y - eraser.radius - 1,
			eraser.radius * 2 + 2,
			eraser.radius * 2 + 2,
		);
		context.restore();
		if (mode == 1 && grid) {
			redrawGrid(x, y, eraser.radius);
		}
	}

	/**
	 * Show an overlay for the chalkboard.
	 */
	function showChalkboard() {
		//console.log("showChalkboard");
		clearTimeout(touchTimeout);
		touchTimeout = null;
		drawingCanvas[0].sponge.style.visibility = "hidden"; // make sure that the sponge from touch events is hidden
		drawingCanvas[1].sponge.style.visibility = "hidden"; // make sure that the sponge from touch events is hidden
		drawingCanvas[1].container.style.opacity = 1;
		drawingCanvas[1].container.style.visibility = "visible";
		mode = 1;
	}

	/**
	 * Closes open chalkboard.
	 */
	function closeChalkboard() {
		clearTimeout(touchTimeout);
		touchTimeout = null;
		drawingCanvas[0].sponge.style.visibility = "hidden"; // make sure that the sponge from touch events is hidden
		drawingCanvas[1].sponge.style.visibility = "hidden"; // make sure that the sponge from touch events is hidden
		drawingCanvas[1].container.style.opacity = 0;
		drawingCanvas[1].container.style.visibility = "hidden";
		lastX = null;
		lastY = null;
		mode = 0;
	}

	/**
	 * Clear current canvas.
	 */
	let clearCanvasAnimationFrames = [null, null];
	function clearCanvases(id, { should_fade } = {}) {
		drawnShapes = [];

		should_fade = should_fade ?? false;
		const dc = drawingCanvas[id];

		// matches `transition: opacity 1s ease-in-out` of \
		// `& .slides section[data-transition="fade"]` in qm.scss
		const fadeTimeMs = 1000;
		let start;

		if (clearCanvasAnimationFrames[id]) {
			cancelAnimationFrame(clearCanvasAnimationFrames[id]);
			clearCanvasAnimationFrames[id] = null;
		}

		if (should_fade) {
			const opacityInit = 1;
			const opacityFinal = 0;

			function decreaseOpacityTo0(timestamp) {
				if (start === undefined) {
					start = timestamp;
				}
				const elapsed = timestamp - start;

				if (elapsed <= fadeTimeMs) {
					const t = elapsed / fadeTimeMs;

					dc.canvasContainer.style.opacity =
						opacityInit + (opacityFinal - opacityInit) * t;

					clearCanvasAnimationFrames[id] = requestAnimationFrame(decreaseOpacityTo0);
				} else {
					forEachCanvas(dc, canvas =>
						canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height),
					);

					dc.canvasContainer.style.opacity = 1.0;
				}
			}

			clearCanvasAnimationFrames[id] = requestAnimationFrame(decreaseOpacityTo0);
		} else {
			forEachCanvas(dc, canvas =>
				canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height),
			);

			dc.canvasContainer.style.opacity = 1.0;
		}

		if (id == 1 && grid) drawGrid();
	}

	/**
	 * Draw grid on background
	 */
	function drawGrid() {
		let context = drawingCanvas[1].context;

		drawingCanvas[1].scale = Math.min(
			drawingCanvas[1].width / storage[1].width,
			drawingCanvas[1].height / storage[1].height,
		);
		drawingCanvas[1].xOffset =
			(drawingCanvas[1].width - storage[1].width * drawingCanvas[1].scale) / 2;
		drawingCanvas[1].yOffset =
			(drawingCanvas[1].height - storage[1].height * drawingCanvas[1].scale) / 2;

		let scale = drawingCanvas[1].scale;
		let xOffset = drawingCanvas[1].xOffset;
		let yOffset = drawingCanvas[1].yOffset;

		let distance = grid.distance * scale;

		let fromX =
			drawingCanvas[1].width / 2 -
			distance / 2 -
			Math.floor((drawingCanvas[1].width - distance) / 2 / distance) * distance;
		for (let x = fromX; x < drawingCanvas[1].width; x += distance) {
			context.beginPath();
			context.lineWidth = grid.width * scale;
			context.lineCap = "round";
			context.fillStyle = grid.color;
			context.strokeStyle = grid.color;
			context.moveTo(x, 0);
			context.lineTo(x, drawingCanvas[1].height);
			context.stroke();
		}
		let fromY =
			drawingCanvas[1].height / 2 -
			distance / 2 -
			Math.floor((drawingCanvas[1].height - distance) / 2 / distance) * distance;

		for (let y = fromY; y < drawingCanvas[1].height; y += distance) {
			context.beginPath();
			context.lineWidth = grid.width * scale;
			context.lineCap = "round";
			context.fillStyle = grid.color;
			context.strokeStyle = grid.color;
			context.moveTo(0, y);
			context.lineTo(drawingCanvas[1].width, y);
			context.stroke();
		}
	}

	function redrawGrid(centerX, centerY, diameter) {
		let context = drawingCanvas[1].context;

		drawingCanvas[1].scale = Math.min(
			drawingCanvas[1].width / storage[1].width,
			drawingCanvas[1].height / storage[1].height,
		);
		drawingCanvas[1].xOffset =
			(drawingCanvas[1].width - storage[1].width * drawingCanvas[1].scale) / 2;
		drawingCanvas[1].yOffset =
			(drawingCanvas[1].height - storage[1].height * drawingCanvas[1].scale) / 2;

		let scale = drawingCanvas[1].scale;
		let xOffset = drawingCanvas[1].xOffset;
		let yOffset = drawingCanvas[1].yOffset;

		let distance = grid.distance * scale;

		let fromX =
			drawingCanvas[1].width / 2 -
			distance / 2 -
			Math.floor((drawingCanvas[1].width - distance) / 2 / distance) * distance;

		for (
			let x = fromX + distance * Math.ceil((centerX - diameter - fromX) / distance);
			x <= fromX + distance * Math.floor((centerX + diameter - fromX) / distance);
			x += distance
		) {
			context.beginPath();
			context.lineWidth = grid.width * scale;
			context.lineCap = "round";
			context.fillStyle = grid.color;
			context.strokeStyle = grid.color;
			context.moveTo(
				x,
				centerY - Math.sqrt(diameter * diameter - (centerX - x) * (centerX - x)),
			);
			context.lineTo(
				x,
				centerY + Math.sqrt(diameter * diameter - (centerX - x) * (centerX - x)),
			);
			context.stroke();
		}
		let fromY =
			drawingCanvas[1].height / 2 -
			distance / 2 -
			Math.floor((drawingCanvas[1].height - distance) / 2 / distance) * distance;
		for (
			let y = fromY + distance * Math.ceil((centerY - diameter - fromY) / distance);
			y <= fromY + distance * Math.floor((centerY + diameter - fromY) / distance);
			y += distance
		) {
			context.beginPath();
			context.lineWidth = grid.width * scale;
			context.lineCap = "round";
			context.fillStyle = grid.color;
			context.strokeStyle = grid.color;
			context.moveTo(
				centerX - Math.sqrt(diameter * diameter - (centerY - y) * (centerY - y)),
				y,
			);
			context.lineTo(
				centerX + Math.sqrt(diameter * diameter - (centerY - y) * (centerY - y)),
				y,
			);
			context.stroke();
		}
	}

	/**
	 * Set the  color
	 */
	function setColor(index, record) {
		// protect against out of bounds (this could happen when
		// replaying events recorded with different color settings).
		if (index >= pens[mode].length) index = 0;
		color[mode] = index;

		forEachCanvas(
			drawingCanvas[mode],
			canvas => (canvas.style.cursor = pens[mode][color[mode]].cursor),
		);
	}

	/**
	 * Set the  board
	 */
	function selectBoard(boardIdx, record) {
		//console.log("Set board",boardIdx);
		if (board == boardIdx) return;

		board = boardIdx;
		redrawChalkboard(boardIdx);
		if (record) {
			recordEvent({ type: "selectboard" });
		}
	}

	function redrawChalkboard(boardIdx) {
		clearCanvases(1);
		let slideData = getSlideData(slideIndices, 1);
		let index = 0;
		let play = boardIdx == 0;
		while (
			index < slideData.events.length &&
			slideData.events[index].time < Date.now() - slideStart
		) {
			if (boardIdx == slideData.events[index].board) {
				playEvent(1, slideData.events[index], Date.now() - slideStart);
			}

			index++;
		}
	}

	/**
	 * Forward cycle color
	 */
	function cycleColorNext() {
		color[mode] = (color[mode] + 1) % pens[mode].length;
		return color[mode];
	}

	/**
	 * Backward cycle color
	 */
	function cycleColorPrev() {
		color[mode] = (color[mode] + (pens[mode].length - 1)) % pens[mode].length;
		return color[mode];
	}

	/*****************************************************************
	 ** Broadcast
	 ******************************************************************/

	let eventQueue = [];

	document.addEventListener("received", function (message) {
		if (message.content && message.content.sender == "chalkboard-plugin") {
			// add message to queue
			eventQueue.push(message);
			console.log(JSON.stringify(message));
		}
		if (eventQueue.length == 1) processQueue();
	});

	function processQueue() {
		// take first message from queue
		let message = eventQueue.shift();

		// synchronize time with seminar host
		slideStart = Date.now() - message.content.timestamp;
		// set status
		if (mode < message.content.mode) {
			// open chalkboard
			showChalkboard();
		} else if (mode > message.content.mode) {
			// close chalkboard
			closeChalkboard();
		}
		if (board != message.content.board) {
			board = message.content.board;
			redrawChalkboard(board);
		}

		switch (message.content.type) {
			case "showChalkboard":
				showChalkboard();
				break;
			case "closeChalkboard":
				closeChalkboard();
				break;
			case "erase":
				erasePoint(message.content.x, message.content.y);
				break;
			case "draw":
				drawSegment(
					message.content.fromX,
					message.content.fromY,
					message.content.toX,
					message.content.toY,
					message.content.color,
				);
				break;
			case "clear":
				clearSlide();
				break;
			case "selectboard":
				selectBoard(message.content.board, true);
				break;
			case "resetSlide":
				resetSlideDrawings();
				break;
			case "init":
				storage = message.content.storage;
				for (let id = 0; id < 2; id++) {
					drawingCanvas[id].scale = Math.min(
						drawingCanvas[id].width / storage[id].width,
						drawingCanvas[id].height / storage[id].height,
					);
					drawingCanvas[id].xOffset =
						(drawingCanvas[id].width - storage[id].width * drawingCanvas[id].scale) / 2;
					drawingCanvas[id].yOffset =
						(drawingCanvas[id].height - storage[id].height * drawingCanvas[id].scale) /
						2;
				}
				clearCanvases(0);
				clearCanvases(1);
				if (!playback) {
					slidechangeTimeout = setTimeout(
						startPlayback,
						transition,
						getSlideDuration(),
						0,
					);
				}
				if (mode == 1 && message.content.mode == 0) {
					setTimeout(closeChalkboard, transition + 50);
				}
				if (mode == 0 && message.content.mode == 1) {
					setTimeout(showChalkboard, transition + 50);
				}
				mode = message.content.mode;
				board = message.content.board;
				break;
			default:
				break;
		}

		// continue with next message if queued
		if (eventQueue.length > 0) {
			processQueue();
		} else {
			storageChanged();
		}
	}

	document.addEventListener("welcome", function (user) {
		// broadcast storage
		let message = new CustomEvent(messageType);
		message.content = {
			sender: "chalkboard-plugin",
			recipient: user.id,
			type: "init",
			timestamp: Date.now() - slideStart,
			storage: storage,
			mode,
			board,
		};
		document.dispatchEvent(message);
	});

	/*****************************************************************
	 ** Playback
	 ******************************************************************/

	document.addEventListener("seekplayback", function (event) {
		//console.log('event seekplayback ' + event.timestamp);
		stopPlayback();
		if (!playback || event.timestamp == 0) {
			// in other cases startplayback fires after seeked
			startPlayback(event.timestamp);
		}
		//console.log('seeked');
	});

	document.addEventListener("startplayback", function (event) {
		//console.log('event startplayback ' + event.timestamp);
		stopPlayback();
		playback = true;
		startPlayback(event.timestamp);
	});

	document.addEventListener("stopplayback", function (event) {
		//console.log('event stopplayback ' + (Date.now() - slideStart) );
		playback = false;
		stopPlayback();
	});

	document.addEventListener("startrecording", function (event) {
		//console.log('event startrecording ' + event.timestamp);
		startRecording();
	});

	// catch mousemove and mouseup on the (invisible) bottom button that toggles
	// drawing mode
	(() => {
		const buttonEventsInterval = setInterval(() => {
			const button = document.querySelector(
				".slide-chalkboard-buttons .toggle-notes-canvas",
			);
			if (!button) return;

			for (const eventName of ["mousemove", "mouseup"]) {
				button.addEventListener(eventName, event => {
					const { clientX, clientY } = event;
					notescanvas.dispatchEvent(new MouseEvent(eventName, { clientX, clientY }));
				});
			}

			clearInterval(buttonEventsInterval);
		}, 500);
	})();

	function startRecording() {
		resetSlide(true);
		slideStart = Date.now();
	}

	function startPlayback(timestamp, finalMode) {
		//console.log("playback " + timestamp );
		slideStart = Date.now() - timestamp;
		closeChalkboard();
		mode = 0;
		board = 0;
		for (let id = 0; id < 2; id++) {
			clearCanvases(id);
			let slideData = getSlideData(slideIndices, id);
			//console.log( timestamp +" / " + JSON.stringify(slideData));
			let index = 0;
			while (
				index < slideData.events.length &&
				slideData.events[index].time < Date.now() - slideStart
			) {
				playEvent(id, slideData.events[index], timestamp);
				index++;
			}

			while (playback && index < slideData.events.length) {
				timeouts[id].push(
					setTimeout(
						playEvent,
						slideData.events[index].time - (Date.now() - slideStart),
						id,
						slideData.events[index],
						timestamp,
					),
				);
				index++;
			}
		}
		//console.log("Mode: " + finalMode + "/" + mode );
		if (finalMode != undefined) {
			mode = finalMode;
		}
		if (mode == 1) showChalkboard();
		//console.log("playback (ok)");
	}

	function stopPlayback() {
		//console.log("stopPlayback");
		//console.log("Timeouts: " + timeouts[0].length + "/"+ timeouts[1].length);
		for (let id = 0; id < 2; id++) {
			for (let i = 0; i < timeouts[id].length; i++) {
				clearTimeout(timeouts[id][i]);
			}
			timeouts[id] = [];
		}
	}

	function playEvent(id, event, timestamp) {
		//console.log( timestamp +" / " + JSON.stringify(event));
		//console.log( id + ": " + timestamp +" / " +  event.time +" / " + event.type +" / " + mode );
		switch (event.type) {
			case "open":
				if (timestamp <= event.time) {
					showChalkboard();
				} else {
					mode = 1;
				}

				break;
			case "close":
				if (timestamp < event.time) {
					closeChalkboard();
				} else {
					mode = 0;
				}
				break;
			case "clear":
				clearCanvases(id);
				break;
			case "selectboard":
				selectBoard(event.board);
				break;
			case "draw":
				drawLine(id, event, timestamp);
				break;
			case "erase":
				eraseCircle(id, event, timestamp);
				break;
		}
	}

	function drawLine(id, event, timestamp) {
		let ctx = drawingCanvas[id].context;
		let scale = drawingCanvas[id].scale;
		let xOffset = drawingCanvas[id].xOffset;
		let yOffset = drawingCanvas[id].yOffset;
		draw[id](
			ctx,
			xOffset + event.x1 * scale,
			yOffset + event.y1 * scale,
			xOffset + event.x2 * scale,
			yOffset + event.y2 * scale,
			event.color,
		);
	}

	function eraseCircle(id, event, timestamp) {
		let ctx = drawingCanvas[id].context;
		let scale = drawingCanvas[id].scale;
		let xOffset = drawingCanvas[id].xOffset;
		let yOffset = drawingCanvas[id].yOffset;

		eraseWithSponge(ctx, xOffset + event.x * scale, yOffset + event.y * scale);
	}

	function startErasing(x, y) {
		drawing = false;
		erasing = true;
		drawingCanvas[mode].sponge.style.visibility = "visible";
		erasePoint(x, y);
	}

	function erasePoint(x, y) {
		const dc = drawingCanvas[mode];
		let ctx = dc.context;
		let scale = dc.scale;
		let xOffset = dc.xOffset;
		let yOffset = dc.yOffset;

		// move sponge image
		dc.sponge.style.left = x * scale + xOffset + "px";
		dc.sponge.style.top = y * scale + yOffset + "px";

		recordEvent({
			type: "erase",
			x,
			y,
		});

		if (
			x * scale + xOffset > 0 &&
			y * scale + yOffset > 0 &&
			x * scale + xOffset < dc.width &&
			y * scale + yOffset < dc.height
		) {
			forEachCanvas(dc, canvas =>
				eraseWithSponge(
					canvas.getContext("2d"),
					x * scale + xOffset,
					y * scale + yOffset,
				),
			);
		}
	}

	function stopErasing() {
		erasing = false;
		// hide sponge
		drawingCanvas[mode].sponge.style.visibility = "hidden";
	}

	function startDrawing(x, y) {
		drawing = true;

		const dc = drawingCanvas[mode];

		// copy the foreground into the background before drawing on the foreground. we do
		// this here and not in stopDrawing in order to still persist the drawing in the
		// event of an uncaught mouseup (eg mouseup outside the window), which would
		// prevent the foreground drawing from being copied to the background before the
		// next drawing cleared the foreground canvas
		const { background, foreground } = dc.canvases;
		background
			.getContext("2d", { alpha: false })
			.drawImage(foreground, 0, 0, background.width / SCALE, background.height / SCALE);

		let scale = dc.scale;
		let xOffset = dc.xOffset;
		let yOffset = dc.yOffset;

		lastX = x * scale + xOffset;
		lastY = y * scale + yOffset;

		drawnShapes.push({
			color: boardmarkers[color[mode]].color,
			points: [[lastX, lastY]],
			tool: currentTool,
		});

		drawPathPoints();
	}

	function drawPathPoints() {
		const dc = drawingCanvas[mode];
		const canvas = dc.canvases.foreground;
		const ctx = canvas.getContext("2d", { alpha: false });

		ctx.clearRect(0, 0, dc.width, dc.height);

		const { color, points, tool } = drawnShapes.at(-1);

		ctx.lineWidth = boardmarkerWidth;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = color;
		ctx.beginPath();

		switch (tool) {
			case "freehand": {
				const len = points.length;
				for (let i = 0; i < len; i++) {
					const [x, y] = points[i];
					if (i === 0) {
						ctx.moveTo(x, y);
						if (len === 1) {
							ctx.arc(x, y, boardmarkerWidth / 4, 0, 2 * Math.PI, false);
							ctx.fillStyle = color;
							ctx.fill();
						}
					} else {
						ctx.lineTo(x, y);
					}
				}
				break;
			}
			case "line": {
				const [x1, y1] = points.at(0);
				let [x2, y2] = points.at(-1);

				// +y is naturally towards bottom of the screen, so +90deg = towards bottom
				// of screen, 270deg = towards top, 0 is right, 180 is left. \
				// (2pi + x) % 2pi is a trick to get the result to always be in [0, 2pi)
				const twoPi = 2 * Math.PI;
				let angleRad = (twoPi + Math.atan2(y2 - y1, x2 - x1)) % twoPi;
				// snap angle to multiple of pi/2 (90deg) if it's close
				const snapAngularDist = 0.075;
				let didSnap = false;
				for (let i = 0; i <= 4; i += 1) {
					const anchorAngleRad = (Math.PI / 2) * i;
					if (Math.abs(angleRad - anchorAngleRad) < snapAngularDist) {
						angleRad = anchorAngleRad;
						didSnap = true;
						break;
					}
				}

				ctx.moveTo(x1, y1);

				if (didSnap) {
					const halfPi = Math.PI / 2;
					const isClose = (x, y) => Math.abs(x - y) < 1e-6;

					let ks, dx, dy;

					outer: for ({ ks, dx, dy } of [
						{ ks: [0, 2, 4], dx: x2 - x1, dy: 0 },
						{ ks: [1, 3], dx: 0, dy: y2 - y1 },
					]) {
						for (const k of ks) {
							if (Math.abs(angleRad - (Math.PI / 2) * k) < 1e-6) {
								break outer;
							}
						}
					}

					x2 = x1 + dx;
					y2 = y1 + dy;
				}

				ctx.lineTo(x2, y2);
				break;
			}
			case "rect": {
				const [x1, y1] = points.at(0);
				const [x2, y2] = points.at(-1);

				const [xMin, xMax] = [x1, x2].sort();
				const [yMin, yMax] = [y1, y2].sort();

				const w = xMax - xMin;
				const h = yMax - yMin;

				ctx.strokeRect(xMin, yMin, w, h);
				break;
			}
			default: {
				throw new Error(`invalid tool '${tool}'`);
			}
		}

		ctx.stroke();
	}

	function drawSegment(fromX, fromY, toX, toY, colorIdx) {
		let ctx = drawingCanvas[mode].context;
		let scale = drawingCanvas[mode].scale;
		let xOffset = drawingCanvas[mode].xOffset;
		let yOffset = drawingCanvas[mode].yOffset;

		recordEvent({
			type: "draw",
			color: colorIdx,
			x1: fromX,
			y1: fromY,
			x2: toX,
			y2: toY,
		});

		if (
			fromX * scale + xOffset > 0 &&
			fromY * scale + yOffset > 0 &&
			fromX * scale + xOffset < drawingCanvas[mode].width &&
			fromY * scale + yOffset < drawingCanvas[mode].height &&
			toX * scale + xOffset > 0 &&
			toY * scale + yOffset > 0 &&
			toX * scale + xOffset < drawingCanvas[mode].width &&
			toY * scale + yOffset < drawingCanvas[mode].height
		) {
			draw[mode](
				ctx,
				fromX * scale + xOffset,
				fromY * scale + yOffset,
				toX * scale + xOffset,
				toY * scale + yOffset,
				colorIdx,
			);
		}
	}

	function stopDrawing() {
		drawing = false;
	}

	/*****************************************************************
	 ** User interface
	 ******************************************************************/

	function setupCanvasEvents(container) {
		// TODO: check all touchevents
		container.addEventListener(
			"touchstart",
			function (evt) {
				evt.preventDefault();
				//console.log("Touch start");
				if (!readOnly && evt.target.getAttribute("data-chalkboard") == mode) {
					let scale = drawingCanvas[mode].scale;
					let xOffset = drawingCanvas[mode].xOffset;
					let yOffset = drawingCanvas[mode].yOffset;

					let touch = evt.touches[0];
					mouseX = touch.pageX;
					mouseY = touch.pageY;
					startDrawing((mouseX - xOffset) / scale, (mouseY - yOffset) / scale);
					touchTimeout = setTimeout(
						startErasing,
						500,
						(mouseX - xOffset) / scale,
						(mouseY - yOffset) / scale,
					);
				}
			},
			passiveSupported
				? {
						passive: false,
				  }
				: false,
		);

		container.addEventListener(
			"touchmove",
			function (evt) {
				evt.preventDefault();
				//console.log("Touch move");
				clearTimeout(touchTimeout);
				touchTimeout = null;
				if (drawing || erasing) {
					let scale = drawingCanvas[mode].scale;
					let xOffset = drawingCanvas[mode].xOffset;
					let yOffset = drawingCanvas[mode].yOffset;

					let touch = evt.touches[0];
					mouseX = touch.pageX;
					mouseY = touch.pageY;
					if (
						mouseY < drawingCanvas[mode].height &&
						mouseX < drawingCanvas[mode].width
					) {
						// move sponge
						if (event.type == "erase") {
							drawingCanvas[mode].sponge.style.left = mouseX + "px";
							drawingCanvas[mode].sponge.style.top = mouseY + "px";
						}
					}

					if (drawing) {
						drawSegment(
							(lastX - xOffset) / scale,
							(lastY - yOffset) / scale,
							(mouseX - xOffset) / scale,
							(mouseY - yOffset) / scale,
							color[mode],
						);
						// broadcast
						let message = new CustomEvent(messageType);
						message.content = {
							sender: "chalkboard-plugin",
							type: "draw",
							timestamp: Date.now() - slideStart,
							mode,
							board,
							fromX: (lastX - xOffset) / scale,
							fromY: (lastY - yOffset) / scale,
							toX: (mouseX - xOffset) / scale,
							toY: (mouseY - yOffset) / scale,
							color: color[mode],
						};
						document.dispatchEvent(message);

						lastX = mouseX;
						lastY = mouseY;
					} else {
						erasePoint((mouseX - xOffset) / scale, (mouseY - yOffset) / scale);
						// broadcast
						let message = new CustomEvent(messageType);
						message.content = {
							sender: "chalkboard-plugin",
							type: "erase",
							timestamp: Date.now() - slideStart,
							mode,
							board,
							x: (mouseX - xOffset) / scale,
							y: (mouseY - yOffset) / scale,
						};
						document.dispatchEvent(message);
					}
				}
			},
			false,
		);

		container.addEventListener(
			"touchend",
			function (evt) {
				evt.preventDefault();
				clearTimeout(touchTimeout);
				touchTimeout = null;
				// hide sponge image
				drawingCanvas[mode].sponge.style.visibility = "hidden";
				stopDrawing();
			},
			false,
		);

		container.addEventListener("mousedown", function (evt) {
			evt.preventDefault();
			document.querySelector("#notescanvas .palette")?.classList.add("faded");

			const target = evt.target.closest(".canvas-container");
			if (!readOnly && target.getAttribute("data-container-chalkboard") == mode) {
				//console.log( "mousedown: " + evt.button );
				let scale = drawingCanvas[mode].scale;
				let xOffset = drawingCanvas[mode].xOffset;
				let yOffset = drawingCanvas[mode].yOffset;

				mouseX = evt.pageX;
				mouseY = evt.pageY;

				if (evt.button == 2 || evt.button == 1) {
					startErasing((mouseX - xOffset) / scale, (mouseY - yOffset) / scale);
					// broadcast
					let message = new CustomEvent(messageType);
					message.content = {
						sender: "chalkboard-plugin",
						type: "erase",
						timestamp: Date.now() - slideStart,
						mode,
						board,
						x: (mouseX - xOffset) / scale,
						y: (mouseY - yOffset) / scale,
					};
					document.dispatchEvent(message);
				} else {
					startDrawing((mouseX - xOffset) / scale, (mouseY - yOffset) / scale);
				}
			}
		});

		container.addEventListener("mousemove", function (evt) {
			evt.preventDefault();
			//console.log("Mouse move");
			if (drawing || erasing) {
				let scale = drawingCanvas[mode].scale;
				let xOffset = drawingCanvas[mode].xOffset;
				let yOffset = drawingCanvas[mode].yOffset;

				mouseX = evt.pageX;
				mouseY = evt.pageY;

				if (drawing) {
					drawnShapes.at(-1).points.push([mouseX, mouseY]);
					drawPathPoints();

					let message = new CustomEvent(messageType);
					message.content = {
						sender: "chalkboard-plugin",
						type: "draw",
						timestamp: Date.now() - slideStart,
						mode,
						board,
						fromX: (lastX - xOffset) / scale,
						fromY: (lastY - yOffset) / scale,
						toX: (mouseX - xOffset) / scale,
						toY: (mouseY - yOffset) / scale,
						color: color[mode],
					};
					document.dispatchEvent(message);

					lastX = mouseX;
					lastY = mouseY;
				} else {
					erasePoint((mouseX - xOffset) / scale, (mouseY - yOffset) / scale);
					// broadcast
					let message = new CustomEvent(messageType);
					message.content = {
						sender: "chalkboard-plugin",
						type: "erase",
						timestamp: Date.now() - slideStart,
						mode,
						board,
						x: (mouseX - xOffset) / scale,
						y: (mouseY - yOffset) / scale,
					};
					document.dispatchEvent(message);
				}
			}
		});

		container.addEventListener("mouseup", function (evt) {
			evt.preventDefault();
			forEachCanvas(
				drawingCanvas[mode],
				canvas => (canvas.style.cursor = pens[mode][color[mode]].cursor),
			);
			if (drawing || erasing) {
				stopDrawing();
				stopErasing();
			}
		});
	}

	function resize() {
		SCALE = window.devicePixelRatio;

		//console.log("resize");
		// Resize the canvas and draw everything again
		let timestamp = Date.now() - slideStart;
		if (!playback) {
			timestamp = getSlideDuration();
		}

		//console.log( drawingCanvas[0].scale + "/" + drawingCanvas[0].xOffset + "/" +drawingCanvas[0].yOffset );
		for (let id = 0; id < 2; id++) {
			const w = window.innerWidth;
			const h = window.innerHeight;

			drawingCanvas[id].width = w;
			drawingCanvas[id].height = h;

			forEachCanvas(drawingCanvas[id], canvas => {
				canvas.width = Math.floor(SCALE * w);
				canvas.height = Math.floor(SCALE * h);
				canvas.style.width = `${drawingCanvas[id].width}px`;
				canvas.style.height = `${drawingCanvas[id].height}px`;
				canvas.getContext("2d").scale(SCALE, SCALE);
			});

			drawingCanvas[id].scale = 1;
			drawingCanvas[id].xOffset = 0;
			drawingCanvas[id].yOffset = 0;
			//console.log( drawingCanvas[id].scale + "/" + drawingCanvas[id].xOffset + "/"
			//+drawingCanvas[id].yOffset );
		}
		//console.log( window.innerWidth + "/" + window.innerHeight);
		startPlayback(timestamp, mode, true);
	}

	Reveal.addEventListener("pdf-ready", function (evt) {
		//		console.log( "Create printouts when ready" );
		whenLoaded(createPrintout);
	});

	Reveal.addEventListener("ready", function (evt) {
		//console.log('ready');
		if (!printMode) {
			window.addEventListener("resize", resize);

			slideStart = Date.now() - getSlideDuration();
			slideIndices = Reveal.getIndices();
			if (!playback) {
				startPlayback(getSlideDuration(), 0);
			}
			if (Reveal.isAutoSliding()) {
				let event = new CustomEvent("startplayback");
				event.timestamp = 0;
				document.dispatchEvent(event);
			}
			updateStorage();
			whenReady(addPageNumbers);
		}
	});
	Reveal.addEventListener("slidechanged", function (evt) {
		//		clearTimeout( slidechangeTimeout );
		//console.log('slidechanged');
		if (!printMode) {
			slideStart = Date.now() - getSlideDuration();
			slideIndices = Reveal.getIndices();
			closeChalkboard();
			board = 0;

			clearCanvases(0, { should_fade: true });
			clearCanvases(1, { should_fade: true });
			// if ( !playback ) {
			// 	slidechangeTimeout = setTimeout( startPlayback, transition, getSlideDuration(), 0 );
			// }
			if (Reveal.isAutoSliding()) {
				let event = new CustomEvent("startplayback");
				event.timestamp = 0;
				document.dispatchEvent(event);
			}
		}

		// reset palette selections to defaults
		const palette = notescanvas.querySelector(".palette");
		(() => {
			const colorList = palette.querySelector(".color-list");
			const colorButtons = colorList.querySelectorAll(":scope > li");
			for (let i = 0, len = colorButtons.length; i < len; i++) {
				let button = colorButtons[i];
				if (i === 0) {
					button.classList.add("selected");
					color[mode] = button.dataset.color;
				} else {
					button.classList.remove("selected");
				}
			}
		})();

		(() => {
			const toolList = palette.querySelector(".tool-list");
			const toolButtons = toolList.querySelectorAll(":scope > li");
			for (let i = 0, len = toolButtons.length; i < len; i++) {
				let button = toolButtons[i];
				if (i === 0) {
					button.classList.add("selected");
					currentTool = button.dataset.tool;
				} else {
					button.classList.remove("selected");
				}
			}
		})();
	});
	Reveal.addEventListener("fragmentshown", function (evt) {
		if (Reveal.getCurrentSlide().classList.contains("clear-drawing-on-fragment")) {
			clearCanvases(0, { should_fade: true });
			clearCanvases(1, { should_fade: true });
		}

		//		clearTimeout( slidechangeTimeout );
		//console.log('fragmentshown');
		if (!printMode) {
			slideStart = Date.now() - getSlideDuration();
			slideIndices = Reveal.getIndices();
			closeChalkboard();
			board = 0;
			// clearCanvas(0);
			// clearCanvas(1);
			if (Reveal.isAutoSliding()) {
				let event = new CustomEvent("startplayback");
				event.timestamp = 0;
				document.dispatchEvent(event);
			} else if (!playback) {
				// startPlayback(getSlideDuration(), 0);
				//				closeChalkboard();
			}
		}
	});
	Reveal.addEventListener("fragmenthidden", function (evt) {
		//		clearTimeout( slidechangeTimeout );
		//console.log('fragmenthidden');
		if (!printMode) {
			slideStart = Date.now() - getSlideDuration();
			slideIndices = Reveal.getIndices();
			closeChalkboard();
			board = 0;
			// clearCanvas(0);
			// clearCanvas(1);
			if (Reveal.isAutoSliding()) {
				document.dispatchEvent(new CustomEvent("stopplayback"));
			} else if (!playback) {
				// startPlayback(getSlideDuration());
				closeChalkboard();
			}
		}
	});

	Reveal.addEventListener("autoslideresumed", function (evt) {
		//console.log('autoslideresumed');
		let event = new CustomEvent("startplayback");
		event.timestamp = 0;
		document.dispatchEvent(event);
	});
	Reveal.addEventListener("autoslidepaused", function (evt) {
		//console.log('autoslidepaused');
		document.dispatchEvent(new CustomEvent("stopplayback"));

		// advance to end of slide
		//		closeChalkboard();
		startPlayback(getSlideDuration(), 0);
	});

	function toggleNotesCanvas() {
		if (!readOnly) {
			if (mode == 1) {
				toggleChalkboard();
				notescanvas.style.background = background[0]; //'rgba(255,0,0,0.5)';
				notescanvas.style.pointerEvents = "auto";
			} else {
				if (notescanvas.style.pointerEvents != "none") {
					// hide notes canvas
					if (colorButtons) {
						const palette = notescanvas.querySelector(".palette");
						palette.style.visibility = "hidden";
					}
					notescanvas.style.background = "rgba(0,0,0,0)";
					notescanvas.style.pointerEvents = "none";
				} else {
					// show notes canvas
					if (colorButtons) {
						notescanvas.querySelector(".palette").style.visibility = "visible";
						notescanvas.querySelector(".palette").classList.remove("faded");
					}
					notescanvas.style.background = background[0]; //'rgba(255,0,0,0.5)';
					notescanvas.style.pointerEvents = "auto";

					let idx = 0;
					if (color[mode]) {
						idx = color[mode];
					}

					setColor(idx, true);
				}
			}
		}
	}

	function toggleChalkboard() {
		//console.log("toggleChalkboard " + mode);
		if (mode == 1) {
			if (!readOnly) {
				recordEvent({ type: "close" });
			}
			closeChalkboard();

			// broadcast
			let message = new CustomEvent(messageType);
			message.content = {
				sender: "chalkboard-plugin",
				type: "closeChalkboard",
				timestamp: Date.now() - slideStart,
				mode: 0,
				board,
			};
			document.dispatchEvent(message);
		} else {
			showChalkboard();
			if (!readOnly) {
				recordEvent({ type: "open" });
				// broadcast
				let message = new CustomEvent(messageType);
				message.content = {
					sender: "chalkboard-plugin",
					type: "showChalkboard",
					timestamp: Date.now() - slideStart,
					mode: 1,
					board,
				};
				document.dispatchEvent(message);

				let idx = 0;

				if (rememberColor[mode]) {
					idx = color[mode];
				}

				setColor(idx, true);
			}
		}
	}

	function clearSlide() {
		recordEvent({ type: "clear" });
		clearCanvases(mode);
	}

	function clear() {
		if (!readOnly) {
			clearSlide();
			// broadcast
			let message = new CustomEvent(messageType);
			message.content = {
				sender: "chalkboard-plugin",
				type: "clear",
				timestamp: Date.now() - slideStart,
				mode,
				board,
			};
			document.dispatchEvent(message);
		}
	}

	function colorIndex(idx) {
		if (!readOnly) {
			setColor(idx, true);
		}
	}

	function colorNext() {
		if (!readOnly) {
			let idx = cycleColorNext();
			setColor(idx, true);
		}
	}

	function colorPrev() {
		if (!readOnly) {
			let idx = cycleColorPrev();
			setColor(idx, true);
		}
	}

	function resetSlideDrawings() {
		let slideData;

		slideStart = Date.now();
		closeChalkboard();

		clearCanvases(0);
		clearCanvases(1);

		mode = 1;
		slideData = getSlideData();
		slideData.duration = 0;
		slideData.events = [];

		mode = 0;
		slideData = getSlideData();
		slideData.duration = 0;
		slideData.events = [];

		updateStorage();
	}

	function resetSlide(force) {
		let ok =
			force || confirm("Please confirm to delete chalkboard drawings on this slide!");
		if (ok) {
			//console.log("resetSlide ");
			stopPlayback();
			resetSlideDrawings();
			// broadcast
			let message = new CustomEvent(messageType);
			message.content = {
				sender: "chalkboard-plugin",
				type: "resetSlide",
				timestamp: Date.now() - slideStart,
				mode,
				board,
			};
			document.dispatchEvent(message);
		}
	}

	function resetStorage(force) {
		let ok = force || confirm("Please confirm to delete all chalkboard drawings!");
		if (ok) {
			stopPlayback();
			slideStart = Date.now();
			clearCanvases(0);
			clearCanvases(1);
			if (mode == 1) {
				closeChalkboard();
			}

			storage = [
				{
					width: Reveal.getConfig().width,
					height: Reveal.getConfig().height,
					data: [],
				},
				{
					width: Reveal.getConfig().width,
					height: Reveal.getConfig().height,
					data: [],
				},
			];

			if (config.storage) {
				sessionStorage.setItem(config.storage, null);
			}
			// broadcast
			let message = new CustomEvent(messageType);
			message.content = {
				sender: "chalkboard-plugin",
				type: "init",
				timestamp: Date.now() - slideStart,
				storage,
				mode,
				board,
			};
			document.dispatchEvent(message);
		}
	}

	this.toggleNotesCanvas = toggleNotesCanvas;
	this.toggleChalkboard = toggleChalkboard;
	this.colorIndex = colorIndex;
	this.colorNext = colorNext;
	this.colorPrev = colorPrev;
	this.clear = clear;
	this.reset = resetSlide;
	this.resetAll = resetStorage;
	this.download = downloadData;
	this.updateStorage = updateStorage;
	this.getData = getData;
	this.configure = configure;

	for (let key in keyBindings) {
		if (keyBindings[key]) {
			Reveal.addKeyBinding(keyBindings[key], RevealChalkboard[key]);
		}
	}

	return this;
};

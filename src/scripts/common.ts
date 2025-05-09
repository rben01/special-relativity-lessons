function linterp(t: number, min: number, max: number) {
	return (1 - t) * min + t * max;
}

function invLinterp(x: number, min: number, max: number) {
	return (x - min) / (max - min);
}

function dist(x: number, scale: (_: number) => number, from = 0) {
	return Math.abs(scale(x) - scale(from));
}

function getGamma(fracOfC: number) {
	return 1 / Math.sqrt(1 - fracOfC ** 2);
}

const mirrorAttrs = {
	fill: "#adf",
	stroke: "#cef",
	rx: 1,
};

const photonAttrs = { fill: "#fc0" };
const photonPeriodSec = 1;
const photonPeriodMs = photonPeriodSec * 1000;

const textAttrs = {
	fill: "white",
	"font-family": "sans-serif",
	"font-size": 16,
};

function arrowheadPathString(width: number, height?: number) {
	height ??= width;
	const points = [
		[0.15, 0.2],
		[0.75, 0.5],
		[0.15, 0.8],
		[0.225, 0.5],
	];
	return "M" + points.map(([x, y]) => `${x * width} ${y * height}`).join("L") + "Z";
}

export {
	arrowheadPathString,
	dist,
	getGamma,
	invLinterp,
	linterp,
	mirrorAttrs,
	photonAttrs,
	photonPeriodMs,
	photonPeriodSec,
	textAttrs,
};

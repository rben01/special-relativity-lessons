function linterp(t: number, min: number, max: number) {
	return (1 - t) * min + t * max;
}

function invLinterp(x: number, min: number, max: number) {
	return (x - min) / (max - min);
}

function dist(x: number, scale: (_: number) => number, from = 0) {
	return Math.abs(scale(x) - scale(from));
}

const mirrorAttrs = {
	fill: "#adf",
	stroke: "#cef",
	rx: 1,
};

const photonAttrs = { fill: "#fc0" };
const photonPeriod = 1;

const textAttrs = {
	fill: "white",
	"font-family": "sans-serif",
	"font-size": 16,
};

export { dist, invLinterp, linterp, mirrorAttrs, photonAttrs, photonPeriod, textAttrs };

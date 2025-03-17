local w = 100;
local h = 100;

local _scale(t, tMin, tMax, s) =
  ((1 - t) * tMin + t * tMax) * s;

local xScale(x) =
  local xMin = 0.075;
  local xMax = 1 - xMin;

  _scale(x, xMin, xMax, w);

local xScaleDist(x) = xScale(x) - xScale(0);

local yScale(y) =
  local yMin = 0.925;
  local yMax = 1 - yMin;

  _scale(y, yMin, yMax, h);

local yScaleDist(y) = yScale(0) - yScale(y);

local rectHeight = yScaleDist(0.075);
local rectAttrs = {
  width: xScaleDist(1),
  height: rectHeight,
  fill: '#adf',
  stroke: '#cef',
  rx: 1,
};

local photonRadius = xScaleDist(0.05);


{
  xScale: xScale,
  yScale: yScale,
  photon: {
    tag: 'circle',
    attrs: {
      cx: xScale(0.3),
      cy: yScale(0) - photonRadius,
      r: photonRadius,
      fill: '#fc0',
    },
  },
  spec: {
    attrs: {
      viewBox: '0 0 %()d %()d' % [w, h],
      id: 'lightClockSchematic',
    },
    children: [
      {
        tag: 'rect',
        attrs: rectAttrs {
          id: 'bottomMirror',
          x: xScale(0),
          y: yScale(0),
        },
      },
      {
        tag: 'rect',
        attrs: rectAttrs {
          id: 'topMirror',
          x: xScale(0),
          y: yScale(1) - rectHeight,
        },
      },

    ],

  },
}

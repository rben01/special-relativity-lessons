local common = import '../../../common.libjsonnet';
local lc = import '../common.libjsonnet';

local w = 800;
local h = 200;

local xScale(x) = common.dimScale(x, w, 0.075);
local xScaleDist(x) = xScale(x) - xScale(0);

local yScale(y) = common.dimScale(y, h, 0.925);
local yScaleDist(y) = yScale(0) - yScale(y);


local rectWidth = 125;
local rectHeight = yScaleDist(0.075);
local topRect = lc.topRect {
  attrs+: { y: yScale(1) - rectHeight, width: rectWidth, height: rectHeight },
};
local bottomRect = lc.bottomRect {
  attrs+: { y: yScale(0), width: rectWidth, height: rectHeight },
};

local mirrorXMax = w - rectWidth + xScaleDist(0.075 / 2);
local tMax = 4;
local c = 2;
local v = (mirrorXMax - xScale(0)) / (h * tMax);
local gamma = 1 / std.sqrt(1 - std.pow(v / c, 2));

local photonRadius = yScaleDist(0.075);

{
  attrs: {
    viewBox: '0 0 %()d %()d' % [w, h],
    gamma: gamma,
  },
  children: [
    {
      tag: 'g',
      attrs: {
        transform: 'scale(0.5)',
      },
      children: [
        topRect {
          attrs+: { id: 'topRectTop' },
        },
        bottomRect {
          attrs+: { id: 'bottomRectTop' },
        },
        lc.photon(yScale(0), photonRadius) {
          children: lc.photonAnim(1, photonRadius, yScale(0), yScale(1)),
        },
      ] + lc.clock(
        1,
        xScale(0.1),
        yScale(0.1),
        tMax,
        'tickTop',
        function(i) std.floor(i) == std.floor(tMax)
      ),
    },
    {
      local translateInit = '0 %()d' % (h / 2),
      tag: 'g',
      attrs: {
        transform: 'translate(%()s)' % translateInit,
      },
      children: [
        {
          tag: 'animateTransform',
          attrs: {
            id: 'mainAnimation',
            attributeName: 'transform',
            type: 'translate',
            from: translateInit,
            to: '%(dx)d %(dy)d' % { dx: mirrorXMax, dy: h / 2 },
            begin: 'bottomRectTop.click',
            dur: '%()ds' % tMax,
            fill: 'freeze',
            repeatCount: 'never',
          },
        },
        {
          tag: 'g',
          attrs: {
            transform: 'scale(0.5)',
          },
          children: [
            topRect {
              attrs+: { id: 'topRectBottom' },
            },
            bottomRect {
              attrs+: { id: 'bottomRectBottom' },
            },
            lc.photon(yScale(0), photonRadius) {
              children: lc.photonAnim(gamma, photonRadius, yScale(0), yScale(1)),
            },
          ] + lc.clock(
            gamma,
            xScale(0.1),
            yScale(0.1),
            tMax,
            'tickBottom',
            function(i) std.floor(i * gamma) <= std.floor(tMax) && std.floor(tMax) <= std.floor((i + 1) * gamma)
          ),
        },

      ],
    },
  ],
}

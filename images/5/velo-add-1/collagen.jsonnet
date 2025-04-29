local w = 150;
local h = 100;
local margin = 5;
local fg = 'white';
local photonColor = '#F6D800';
local accent = '#4cf';
local rectBorder = 4.5 * margin;

local innerRectNetPadding = 6 * margin;


local xScale(t) = (1 - t) * margin + t * (w - margin);
local yScale(t) = (1 - t) * margin + t * (h - margin);
local xDist(t) = xScale(t) - xScale(0);
local yDist(t) = yScale(t) - yScale(0);

local math = {
  f: '𝐹',
  o: '𝑂',
  v: '𝑣',
  u: '𝑢',
  deltaT: 'T',
  prime: '′',
  doublePrime: '″',
};


local origin = {
  tag: 'circle',
  attrs: {
    cy: yScale(0) + yDist(1) * 2 / 3,
    fill: accent,
    stroke: fg,
    'stroke-width': 0.75,
    r: 2,
  },
};

local text = {
  tag: 'text',
  attrs: {
    'font-family': 'Times',
    'font-size': 8,
    'text-anchor': 'start',
    'dominant-baseline': 'hanging',
    fill: fg,
  },
};

local originLabel = text { attrs+: { y: origin.attrs.cy - 3.5, 'dominant-baseline': 'auto' } };

local velocityArrow = {
  tag: 'line',
  attrs: {
    fill: 'none',
    stroke: fg,
    'stroke-width': 0.8,
    'marker-end': 'url(#arrow-white)',
  },
};

local velocityArrowOffset = xDist(0.1);
local velocityArrowLength = xDist(0.15);

local x0 = xScale(0);
local x1 = xScale(0) + rectBorder;
local x2 = xScale(0.7);

local textX0 = x0 + margin / 2;
local textX1 = x1 + margin / 2;
local textX2 = x2 + margin / 2;

{
  attrs: { viewBox: '0 0 %(w)g %(h)g' % { w: w, h: h } },
  children: [
    {
      tag: 'defs',
      children:
        {
          tag: 'marker',
          attrs: {
            id: 'arrow-' + o.name,
            viewBox: '0 0 10 10',
            refX: 5,
            refY: 5,
            markerWidth: 6,
            markerHeight: 6,
            orient: 'auto-start-reverse',
          },
          children:
            {
              tag: 'path',
              attrs: {
                d: 'M 0 0 L 10 5 L 0 10 z',
                fill: o.color,
              },
            },
        },
    }
    for o in [{ name: 'white', color: fg }, { name: 'photon', color: photonColor }]
  ] + [
    {
      tag: 'rect',
      attrs: {
        x: x0,
        y: yScale(0),
        width: xDist(1),
        height: yDist(1),
        fill: 'none',
        stroke: fg,
        'stroke-width': 1,
      },
    },
    {
      tag: 'rect',
      attrs: {
        x: x1,
        y: yScale(0) + rectBorder,
        width: xDist(1) - innerRectNetPadding,
        height: yDist(1) - innerRectNetPadding,
        fill: 'none',
        stroke: fg,
        'stroke-width': 1,
      },
    },
    origin { attrs+: { cx: x0 } },
    origin { attrs+: { cx: x1 } },
    origin { attrs+: { cx: x2 } },

    text { children: math.f, attrs+: { x: textX0, y: yScale(0) + margin / 2 } },
    text { children: math.f + math.prime, attrs+: { x: textX1, y: yScale(0) + rectBorder + margin / 2 } },

    originLabel { children: math.o, attrs+: { x: textX0 } },
    originLabel { children: math.o + math.prime, attrs+: { x: textX1 } },
    originLabel { children: math.o + math.doublePrime, attrs+: { x: textX2 } },

    text { children: math.v, attrs+: {
      x: x1 + velocityArrowOffset + velocityArrowLength + 2,
      y: yScale(0) + rectBorder + margin / 2 + 3,
    } },
    velocityArrow { attrs+: {
      local y = yScale(0) + rectBorder + margin / 2 + 3,
      x1: x1 + velocityArrowOffset,
      x2: x1 + velocityArrowOffset + velocityArrowLength,
      y1: y,
      y2: y,
    } },

    text { children: math.u + math.prime, attrs+: {
      x: x2 + origin.attrs.r + velocityArrowLength + 2,
      y: origin.attrs.cy,
    } },
    velocityArrow { attrs+: {
      local y = origin.attrs.cy,
      x1: x2 + origin.attrs.r,
      x2: x2 + origin.attrs.r + velocityArrowLength,
      y1: y,
      y2: y,
    } },


  ],
}

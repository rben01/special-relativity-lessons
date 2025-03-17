local width = 300;
local height = 300;
local margin = 30;
local fg = '#aaa';
local strokeWidth = 2;
local fontSize = 20;

local vectorScale = 0.3;
local vectorX = 3 * vectorScale;
local vectorY = 2 * vectorScale;
local vectorColor = '#fd0';

local xScale(x) = margin + x * (width - 2 * margin);
local yScale(y) = height - margin - y * (height - 2 * margin);

local axis = {
  x1: xScale(0),
  y1: yScale(0),
  stroke: fg,
  fill: 'none',
  'stroke-width': strokeWidth,
  'marker-start': 'url(#arrowhead-white)',
  'marker-end': 'url(#arrowhead-white)',
};

local axisLabel = {
  fill: fg,
  'font-size': fontSize,
};

local arrowHead =
  {
    tag: 'marker',
    attrs: {
      viewBox: '0 0 10 10',
      refX: 5,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: 'auto-start-reverse',
    },
    children: {
      tag: 'path',
      attrs: { d: 'M 0 0 L 10 5 L 0 10 z' },
    },
  };


{
  attrs: { viewBox: '0 0 %()d %()d' % [width, height] },
  children: [
    {
      tag: 'defs',
      children:
        [
          arrowHead {
            attrs+: {
              id: 'arrowhead-white',
              stroke: fg,
              fill: fg,
            },
          },
          arrowHead {
            attrs+: {
              id: 'arrowhead-vector',
              stroke: vectorColor,
              fill: vectorColor,
            },
          },
        ],
    },
    // background rectangle
    //  {
    //    tag: 'rect',
    //    attrs: {
    //      x: 0,
    //      y: 0,
    //      width: width,
    //      height: height,
    //      fill: '#000',
    //    },
    //  },
    // axes
    {
      tag: 'path',
      attrs: {
        d: std.join(' ', std.map(std.toString, [
          'M',
          xScale(0),
          yScale(1),
          'L',
          xScale(0),
          yScale(0),
          'L',
          xScale(1),
          yScale(0),
        ])),
      } + axis,
    },
    //  x-axis label
    {
      tag: 'text',
      attrs: axisLabel {
        x: xScale(1),
        y: yScale(0) + 20,
        'text-anchor': 'middle',
        'dominant-baseline': 'text-top',
      },
      children: '𝑥',
    },
    // y-axis label
    {
      tag: 'text',
      attrs: axisLabel {
        x: xScale(0) - 10,
        y: yScale(1),
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
      },
      children: '𝑦',
    },
    // vector pointing to (2,3)
    {
      tag: 'line',
      attrs: {
        x1: xScale(0),
        y1: yScale(0),
        x2: xScale(vectorX),
        y2: yScale(vectorY),
        stroke: vectorColor,
        'stroke-width': strokeWidth,
        'marker-end': 'url(#arrowhead-vector)',
      },
    },
    // vector label
    {
      tag: 'text',
      attrs: {
        x: xScale(vectorX) + 10,
        y: yScale(vectorY) - 10,
        fill: vectorColor,
        'font-size': fontSize,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
      },
      children: '𝑣',
    },
    // vector length label
    {
      tag: 'text',
      attrs: {
        x: xScale(vectorX * 0.6),
        y: yScale(vectorY * 0.6) - 10,
        fill: vectorColor,
        'font-size': fontSize,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
      },
      children: '|𝑣|',
    },
    // theta label
    {
      tag: 'text',
      attrs: {
        x: xScale(0.18) + 20,
        y: yScale(vectorY / vectorX * 0.18) + 12,
        fill: vectorColor,
        'font-size': fontSize,
        'text-anchor': 'end',
        'dominant-baseline': 'middle',
      },
      children: '𝜃',
    },
    // arc below vector
    {
      tag: 'path',
      attrs: {
        local arcX = 0.2,
        local r = xScale(arcX) - xScale(0),
        local theta = std.atan(vectorY / vectorX),
        d: 'M %()d %()d a %()d %()d 0 0 0 %()d %()d' %
           [xScale(arcX), yScale(0), r, r, r * (std.cos(theta) - 1), -r * std.sin(theta)],
        fill: 'none',
        stroke: vectorColor,
        'stroke-width': strokeWidth,
      },
    },


  ],
}

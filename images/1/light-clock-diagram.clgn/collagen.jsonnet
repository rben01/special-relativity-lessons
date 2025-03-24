local o = import '../../common.libjsonnet';

local margin = 5;
local w = 200;
local h = 100;

local xScale(x) = o.linterp(x, margin, w - 2 * margin);
local yScale(y) = o.linterp(y, h - 2 * margin, margin);

local xScaleDist(x) = xScale(x) - xScale(0);
local yScaleDist(y) = yScale(0) - yScale(y);

local fg = 'white';
local line = {
  stroke: fg,
  'stroke-width': 2,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
  fill: 'none',
};

{
  attrs: {
    viewBox: '0 0 %()d %()d' % [w, h],
  },
  children: [
    {
      tag: 'path',
      attrs: line {
        d: std.join(' ', std.map(std.toString, [
          'M',
          xScale(0),
          yScale(0),
          'L',
          xScale(0.5),
          yScale(1),
          'L',
          xScale(1),
          yScale(0),
        ])),
      },
    },
  ],
}

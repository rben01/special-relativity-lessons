local o = import '../common.jsonnet';

local photonPeriod = 1;  //seconds
local timerMax = 99;

o.spec {
  children+: [
    o.photon { children: {
      tag: 'animate',
      attrs: {
        local cyInit = o.yScale(0) - o.photon.attrs.r,
        attributeName: 'cy',
        begin: 'bottomMirror.click',
        values: std.join(
          ';',
          std.map(std.toString, [cyInit, o.yScale(1) + o.photon.attrs.r, cyInit])
        ),
        dur: '%()ds' % photonPeriod,
        repeatCount: 'indefinite',
      },
    } },

  ] + [
    {
      tag: 'text',
      attrs: {
        x: o.xScale(0.9),
        y: o.yScale(0.1),
        'text-anchor': 'end',
        'dominant-baseline': 'bottom',
        visibility: 'hidden',
        fill: 'white',
        'font-size': '16',
        'font-family': 'sans-serif',
      },
      children: [
        std.toString(i),
        {
          tag: 'set',
          attrs: {
            id: 'tick%()d' % i,
            attributeName: 'visibility',
            to: 'visible',
            begin: (if i == 0 then 'bottomMirror.click;tick%()d.end' % timerMax else 'tick%()d.end' % (i - 1)),
            dur: '%()ds' % photonPeriod,
          },
        },
      ],

    }
    for i in std.range(0, timerMax)
  ],
}

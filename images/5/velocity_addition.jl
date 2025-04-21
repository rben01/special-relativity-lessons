# %%
using Makie
using CairoMakie

CairoMakie.activate!()

set_theme!(theme_black())

xs = ys = 0:0.0025:1;
zs = [(x + y) / (1 + x * y) for x in xs, y in ys];

tick_label_size = 24
axis_label_size = tick_label_size * 1.2
label_padding = 0
ax_ticks = (0:1, [L"0", L"c"])

fig = Figure(; size=(800, 600), backgroundcolor=(:black, 0))
ax = Axis(
    fig[1, 1];
    aspect=1,
    xticks=ax_ticks,
    xticklabelsize=tick_label_size,
    yticks=ax_ticks,
    yticklabelsize=tick_label_size,
    xlabel=L"v",
    xlabelsize=axis_label_size,
    xlabelpadding=label_padding - 18,
    ylabel=L"u'",
    ylabelsize=axis_label_size,
    ylabelpadding=label_padding,
    ylabelrotation=0,
)

hm = contourf!(ax, xs, ys, zs; levels=40, colormap=(:seaborn_rocket_gradient))
Colorbar(
    fig[:, end + 1],
    hm;
    label=L"u",
    labelrotation=0,
    labelsize=axis_label_size,
    labelpadding=0,
    ticks=ax_ticks,
    ticklabelsize=tick_label_size,
)
tightlimits!(ax)

save(joinpath(@__DIR__, "velocity_addition.svg"), fig; px_per_unit=2.0)
fig

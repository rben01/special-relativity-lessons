# %%
using Makie
using CairoMakie
using ColorSchemes
using Printf

CairoMakie.activate!()

set_theme!(theme_black())

function plot_it(xs, ys, zs; filename, colormap, v_max, contour_label_cmap, levels)
    tick_label_size = 32
    axis_label_size = tick_label_size * 1.5
    label_padding = 0
    ax_ticks = (0:v_max, [L"0", L"c", (L"%$(n)c" for n in 2:v_max)...])

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

    hm = heatmap!(ax, xs, ys, zs; colormap)
    contour!(
        ax,
        xs,
        ys,
        zs;
        labels=true,
        levels,
        labelformatter=x -> @sprintf("%0.2f", x),
        colormap=contour_label_cmap,
    )
    Colorbar(
        fig[1, end + 1],
        hm;
        label=L"u",
        labelrotation=0,
        labelsize=axis_label_size,
        labelpadding=0,
        ticks=ax_ticks,
        ticklabelsize=tick_label_size,
    )
    tightlimits!(ax)

    save(joinpath(@__DIR__, filename), fig; px_per_unit=4)
    return fig
end

xs = ys = 0:0.0025:1;

plot_it(
    xs,
    ys,
    [(x + y) / (1 + x * y) for x in xs, y in ys];
    filename="velocity_addition.png",
    colormap=:seaborn_rocket_gradient,
    v_max=1,
    levels=24, # one less than a multiple of 5 for nice spacing
    contour_label_cmap=["#fff1", "#fff9"],
)

# %%
c_min, c_middle, c_max = 0, 1, 2
c_length = c_max - c_min
ratio_first = (c_middle - c_min) / c_length
ratio_second = (c_max - c_middle) / c_length

less_than_c_cmap = get(
    ColorSchemes.seaborn_rocket_gradient, LinRange(0, 1, Int64(ratio_first * 100))
)
greater_than_c_cmap = reverse(
    get(ColorSchemes.seaborn_mako_gradient, LinRange(0, 1, Int64(ratio_second * 100)))
)
colormap = vcat(less_than_c_cmap, greater_than_c_cmap)

plot_it(
    xs,
    ys,
    [x + y for x in xs, y in ys];
    filename="velocity_addition_bad.png",
    colormap,
    v_max=2,
    levels=49,
    contour_label_cmap=["#fff1", "#fffa", "#fff1"],
)

# %%
import polars as pl
import altair as alt
from pathlib import Path

_ = alt.theme.enable("dark")

t0 = 0.0
t1 = 0.5
x0 = 0.5
c = 1
v = 0.35


def ys(x0: float, v: float, t0: float = t0, t1: float = t1) -> list[float]:
    return [x0 + v * t0, x0 + v * t1]


df = (
    pl.DataFrame(
        {
            "t": [t0, t1],
            "Frank": ys(x0 / 2, v),
            "𝛾_F": ys(0, c),
            "Beth": ys(-x0 / 2, v),
            "𝛾_B": ys(0, -c),
        }
    )
    .unpivot(index="t", variable_name="Object", value_name="x")
    .with_columns(
        pl.when(pl.col("Object").str.starts_with("𝛾"))
        .then(pl.lit("Photon"))
        .otherwise(pl.lit("Person"))
        .alias("Object"),
        pl.when(pl.col("Object").str.contains("B"))
        .then(pl.lit("Back"))
        .otherwise(pl.lit("Front"))
        .alias("End of train"),
    )
)

rules = (
    pl.DataFrame({"x": [0.185185, 0.384615]})
    .with_columns(
        pl.lit(-0.5).alias("y1"),
        pl.when(pl.int_range(2) == 0)
        .then(-pl.col("x"))
        .otherwise(pl.col("x"))
        .alias("y"),
    )
    .with_columns((pl.col("y") - 0.01).alias("y2"))
)


chart = (
    alt.Chart(df)
    .mark_line()
    .encode(
        alt.X(
            "t",
            axis=alt.Axis(
                title="𝑡", titleFontSize=14, labels=False, ticks=False, domain=False
            ),
        ),
        alt.Y(
            "x",
            axis=alt.Axis(
                title="𝑥",
                titlePadding=10,
                titleFontSize=14,
                titleAngle=0,
                labelExpr=f"datum.value == 0 ? '0' : datum.value == {-x0 / 2} ? '−L∕2𝛾' : datum.value == {x0 / 2} ? '+L∕2𝛾' : datum.value",
                values=[-1, -x0 / 2, 0, x0 / 2, 1],
                domain=False,
            ),
        ),
        alt.StrokeDash("Object"),
        alt.Color(
            "End of train",
            scale=alt.Scale(domain=["Front", "Back"], range=["#65A4E7", "#EECA3B"]),
        ),
    )
    + alt.Chart(rules)
    .mark_rule(color="#fff")
    .encode(alt.X("x"), alt.Y("y1"), alt.Y2("y2"))
    + alt.Chart(rules)
    .mark_point(color="#fff", opacity=1)
    .encode(alt.X("x"), alt.Y("y"))
).configure(background="#0000")
chart.save(Path(__file__).parent / "simultaneity.svg")
chart

# Panda Jump layered background

All PNGs share the same 941 x 1672 canvas and should be positioned at `(0, 0)`.

Layer order:

1. `00-sky-base.png`
2. `01-rear-clouds.png`
3. `02-distant-islands.png`
4. `03-central-mountains.png`
5. `04-foreground-cliffs.png`
6. `05-waterfalls-mist.png`

`layers.json` contains suggested z-index and parallax values. `LayeredBackground.ts`
is a minimal PixiJS v8 implementation with vertical parallax, gentle cloud drift,
and mist alpha pulsing.

Because the source artwork was flattened, covered areas were reconstructed with AI.
The result is intended for layered animation and may not recombine pixel-for-pixel
with the original image.

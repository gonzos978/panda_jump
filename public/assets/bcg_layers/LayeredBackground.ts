import { Assets, Container, Sprite, Ticker } from "pixi.js";
import config from "./layers.json";

type LayerSprite = Sprite & {
  layerConfig: (typeof config.layers)[number];
  baseX: number;
};

export class LayeredBackground extends Container {
  private layers: LayerSprite[] = [];
  private elapsed = 0;

  async init(assetRoot = "assets/background"): Promise<void> {
    for (const layerConfig of config.layers) {
      const texture = await Assets.load(`${assetRoot}/${layerConfig.file}`);
      const sprite = new Sprite(texture) as LayerSprite;

      sprite.layerConfig = layerConfig;
      sprite.baseX = 0;
      sprite.zIndex = layerConfig.zIndex;
      this.addChild(sprite);
      this.layers.push(sprite);
    }

    this.sortableChildren = true;
    Ticker.shared.add(this.update, this);
  }

  setCameraY(cameraY: number): void {
    for (const layer of this.layers) {
      layer.y = -cameraY * layer.layerConfig.parallax;
    }
  }

  private update(ticker: Ticker): void {
    this.elapsed += ticker.deltaMS / 1000;

    for (const layer of this.layers) {
      if ("driftX" in layer.layerConfig && layer.layerConfig.driftX) {
        layer.x = layer.baseX + Math.sin(this.elapsed * 0.15) * layer.layerConfig.driftX;
      }

      if ("pulseAlpha" in layer.layerConfig && layer.layerConfig.pulseAlpha) {
        layer.alpha = 0.88 + Math.sin(this.elapsed * 0.7) * 0.08;
      }
    }
  }

  destroy(options?: Parameters<Container["destroy"]>[0]): void {
    Ticker.shared.remove(this.update, this);
    super.destroy(options);
  }
}

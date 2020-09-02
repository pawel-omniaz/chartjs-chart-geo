import { Element, Rectangle, IRectangleOptions, IVisualElement, IPoint } from 'chart.js';
import { geoContains, GeoProjection } from 'd3-geo';
import { ProjectionScale } from '../scales';

export interface IGeoFeatureOptions extends IRectangleOptions {
  /**
   * background color for the outline
   * @default null
   */
  outlineBackgroundColor: string | null;
  /**
   * border color for the outline
   * @default defaultColor of Chart.js
   */
  outlineBorderColor: string;
  /**
   * border width for the outline
   * @default 0
   */
  outlineBorderWidth: number;

  /**
   * border color for the graticule
   * @default #CCCCCC
   */
  graticuleBorderColor: string;
  /**
   * border width for the graticule
   * @default 0
   */
  graticuleBorderWidth: string;
}

export type Feature = any;

export interface IGeoFeatureProps {
  x: number;
  y: number;
}

export class GeoFeature extends Element<IGeoFeatureProps, IGeoFeatureOptions> implements IVisualElement {
  cache?:
    | {
        center?: IPoint;
        bounds?: {
          x: number;
          y: number;
          width: number;
          height: number;
          x2: number;
          y2: number;
        };
        canvasKey?: string;
        canvas?: HTMLCanvasElement;
      }
    | undefined = undefined;
  projectionScale!: ProjectionScale;
  feature!: Feature;

  inRange(mouseX: number, mouseY: number) {
    const bb = this.getBounds();
    const r =
      (Number.isNaN(mouseX) || (mouseX >= bb.x && mouseX <= bb.x2)) &&
      (Number.isNaN(mouseY) || (mouseY >= bb.y && mouseY <= bb.y2));

    const projection = this.projectionScale.geoPath.projection()! as GeoProjection;
    if (r && !Number.isNaN(mouseX) && !Number.isNaN(mouseY) && typeof projection.invert === 'function') {
      // test for real if within the bounds
      const longlat = projection.invert([mouseX, mouseY]);
      return longlat != null && geoContains(this.feature, longlat);
    }

    return r;
  }

  inXRange(mouseX: number) {
    return this.inRange(mouseX, Number.NaN);
  }

  inYRange(mouseY: number) {
    return this.inRange(Number.NaN, mouseY);
  }

  getCenterPoint() {
    if (this.cache && this.cache.center) {
      return this.cache.center;
    }
    const centroid = this.projectionScale.geoPath.centroid(this.feature);
    const center = {
      x: centroid[0],
      y: centroid[1],
    };
    this.cache = Object.assign({}, this.cache || {}, { center });
    return center;
  }

  getBounds() {
    if (this.cache && this.cache.bounds) {
      return this.cache.bounds;
    }
    const bb = this.projectionScale.geoPath.bounds(this.feature);
    const bounds = {
      x: bb[0][0],
      x2: bb[1][0],
      y: bb[0][1],
      y2: bb[1][1],
      width: bb[1][0] - bb[0][0],
      height: bb[1][1] - bb[0][1],
    };
    this.cache = Object.assign({}, this.cache || {}, { bounds });
    return bounds;
  }

  _drawInCache(doc: Document) {
    const bounds = this.getBounds();
    if (!Number.isFinite(bounds.x)) {
      return;
    }
    const canvas = this.cache && this.cache.canvas ? this.cache.canvas : doc.createElement('canvas');
    canvas.width = Math.max(Math.ceil(bounds.width), 1);
    canvas.height = Math.max(Math.ceil(bounds.height), 1);

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-bounds.x, -bounds.y);
    this._drawImpl(ctx);
    ctx.restore();

    this.cache = Object.assign({}, this.cache || {}, {
      canvas,
      canvasKey: this._optionsToKey(),
    });
  }

  _optionsToKey() {
    const options = this.options;
    return `${options.backgroundColor};${options.borderColor};${options.borderWidth}`;
  }

  _drawImpl(ctx: CanvasRenderingContext2D) {
    const feature = this.feature;
    const options = this.options;
    ctx.beginPath();
    this.projectionScale.geoPath.context(ctx)(feature);
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fill();
    }
    if (options.borderColor) {
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.stroke();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const feature = this.feature;
    if (!feature) {
      return;
    }
    if (!this.cache || this.cache.canvasKey !== this._optionsToKey()) {
      this._drawInCache(ctx.canvas.ownerDocument);
    }
    const bounds = this.getBounds();
    if (this.cache && this.cache.canvas) {
      ctx.drawImage(this.cache.canvas, bounds.x, bounds.y, bounds.width, bounds.height);
    } else if (Number.isFinite(bounds.x)) {
      ctx.save();
      this._drawImpl(ctx);
      ctx.restore();
    }
  }

  static id = 'geoFeature';
  static defaults = /*#__PURE__*/ Object.assign({}, Rectangle.defaults, {
    outlineBackgroundColor: null,
    outlineBorderWidth: 0,

    graticuleBorderColor: '#CCCCCC',
    graticuleBorderWidth: 0,
  });
  static defaultRoutes = /*#__PURE__*/ Object.assign(
    {
      outlineBorderColor: 'color',
    },
    Rectangle.defaultRoutes || {}
  );
}

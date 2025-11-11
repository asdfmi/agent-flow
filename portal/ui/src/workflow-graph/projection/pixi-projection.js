import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";

const NODE_WIDTH = 184;
const NODE_HEIGHT = 96;
const HAS_WINDOW = typeof window !== "undefined";
const DEFAULT_RESOLUTION =
  HAS_WINDOW && window.devicePixelRatio ? window.devicePixelRatio : 1;

const DEFAULT_THEME = {
  pixi: {
    background: 0x0b0d17,
    gridColor: 0x1f2937,
    gridAlpha: 0.4,
    edgeColor: 0x94a3b8,
    edgeAlpha: 0.65,
    labelColor: 0xf8fafc,
    nodeFillAlpha: 0.3,
    nodeActiveFillAlpha: 0.46,
    nodeBorderAlpha: 0.95,
    nodePalette: {
      navigate: 0x3b82f6,
      click: 0x34d399,
      fill: 0xfbbf24,
      press: 0x38bdf8,
      script: 0xa855f7,
      log: 0xf97316,
      extract_text: 0x2dd4bf,
      wait: 0x94a3b8,
      scroll: 0x22d3ee,
      if: 0xf472b6,
      default: 0x94a3b8,
    },
  },
};

export default class PixiProjection {
  constructor({ graphCore, container, theme }) {
    this.graphCore = graphCore;
    this.container = container;
    this.nodeEntries = new Map();
    this.dragState = null;
    this.pendingRender = false;
    this.destroyed = false;
    this.theme = this.#withDefaults(theme);

    this.app = new Application({
      backgroundColor: this.theme.pixi.background,
      backgroundAlpha: 1,
      antialias: true,
      autoDensity: true,
      resolution: DEFAULT_RESOLUTION,
      autoStart: false,
    });
    this.app.stop();
    this.view = this.app.view;
    this.view.style.width = "100%";
    this.view.style.height = "100%";
    this.view.style.display = "block";
    container.appendChild(this.view);

    this.gridLayer = new Graphics();
    this.edgeLayer = new Graphics();
    this.nodeLayer = new Container();
    this.app.stage.addChild(this.gridLayer);
    this.app.stage.addChild(this.edgeLayer);
    this.app.stage.addChild(this.nodeLayer);
    this.app.stage.interactive = true;

    this.#attachStageListeners();
    this.#resize();
    this.resizeObserver =
      HAS_WINDOW && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            this.#resize();
            this.#scheduleRender();
          })
        : null;
    this.resizeObserver?.observe(container);

    this.viewUnsubscribe =
      this.graphCore?.subscribeView(() => this.#scheduleRender()) ?? null;
    this.stateUnsubscribe =
      this.graphCore?.subscribe(() => this.#scheduleRender()) ?? null;
    this.renderFrame();
  }

  destroy() {
    this.destroyed = true;
    this.viewUnsubscribe?.();
    this.stateUnsubscribe?.();
    this.resizeObserver?.disconnect?.();
    this.app.stage.removeAllListeners();
    this.nodeLayer
      .removeChildren()
      .forEach?.((child) => child.destroy?.({ children: true }));
    this.edgeLayer.destroy(true);
    this.gridLayer.destroy(true);
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true,
    });
    this.nodeEntries.clear();
  }

  renderFrame() {
    if (!this.graphCore || this.destroyed) return;
    const view = this.graphCore.getViewState();
    this.#drawGrid();
    this.#drawEdges(view);
    this.#drawNodes(view);
    this.app.render();
  }

  #scheduleRender() {
    if (this.pendingRender || this.destroyed) return;
    this.pendingRender = true;
    requestAnimationFrame(() => {
      this.pendingRender = false;
      this.renderFrame();
    });
  }

  #resize() {
    if (!this.container) return;
    const width = Math.max(this.container.clientWidth || 1, 200);
    const height = Math.max(this.container.clientHeight || 1, 200);
    this.app.renderer.resize(width, height);
    this.graphCore?.updateViewportSize?.({ width, height });
  }

  #attachStageListeners() {
    this.app.stage.on("pointerup", () => this.#endDrag());
    this.app.stage.on("pointerupoutside", () => this.#endDrag());
    this.app.stage.on("pointermove", (event) => this.#handlePointerMove(event));
  }

  #handlePointerMove(event) {
    if (!this.dragState) return;
    const position = event.data.getLocalPosition(this.nodeLayer);
    const x = position.x - this.dragState.offsetX;
    const y = position.y - this.dragState.offsetY;
    this.graphCore.sendIntent?.({
      type: "move-node",
      nodeKey: this.dragState.nodeKey,
      position: { x, y },
    });
  }

  #endDrag() {
    this.dragState = null;
  }

  #drawGrid() {
    const { width, height } = this.app.renderer.screen;
    this.gridLayer.clear();
    this.gridLayer.lineStyle(
      1,
      this.theme.pixi.gridColor,
      this.theme.pixi.gridAlpha,
    );
    const spacing = 48;
    for (let x = 0; x <= width; x += spacing) {
      this.gridLayer.moveTo(x, 0);
      this.gridLayer.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += spacing) {
      this.gridLayer.moveTo(0, y);
      this.gridLayer.lineTo(width, y);
    }
  }

  #drawEdges(view) {
    const map = new Map();
    view.nodes.forEach((node) => {
      map.set(node.nodeKey, node.position);
    });

    this.edgeLayer.clear();
    this.edgeLayer.lineStyle(
      2,
      this.theme.pixi.edgeColor,
      this.theme.pixi.edgeAlpha,
    );
    view.edges.forEach((edge) => {
      const from = map.get(edge.sourceKey);
      const to = map.get(edge.targetKey);
      if (!from || !to) return;
      const fromCenter = {
        x: from.x + NODE_WIDTH / 2,
        y: from.y + NODE_HEIGHT / 2,
      };
      const toCenter = {
        x: to.x + NODE_WIDTH / 2,
        y: to.y + NODE_HEIGHT / 2,
      };
      this.edgeLayer.moveTo(fromCenter.x, fromCenter.y);
      this.edgeLayer.lineTo(toCenter.x, toCenter.y);
    });
  }

  #drawNodes(view) {
    const remaining = new Set(this.nodeEntries.keys());
    view.nodes.forEach((node) => {
      let entry = this.nodeEntries.get(node.nodeKey);
      if (!entry) {
        entry = this.#createNodeEntry(node);
        this.nodeEntries.set(node.nodeKey, entry);
        this.nodeLayer.addChild(entry.container);
      }
      this.#updateNodeEntry(entry, node, view.selectedNodeKey === node.nodeKey);
      remaining.delete(node.nodeKey);
    });
    remaining.forEach((key) => {
      const entry = this.nodeEntries.get(key);
      if (entry) {
        entry.container.destroy({ children: true });
      }
      this.nodeEntries.delete(key);
    });
  }

  #createNodeEntry(node) {
    const container = new Container();
    container.interactive = true;
    container.buttonMode = true;
    container.hitArea = new Rectangle(0, 0, NODE_WIDTH, NODE_HEIGHT);

    const background = new Graphics();
    const label = new Text(node.label || node.nodeKey || "Node", {
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fill: this.theme.pixi.labelColor,
      align: "center",
      wordWrap: true,
      wordWrapWidth: NODE_WIDTH - 20,
    });
    label.anchor.set(0.5);
    label.position.set(NODE_WIDTH / 2, NODE_HEIGHT / 2);

    container.addChild(background);
    container.addChild(label);

    container.on("pointerdown", (event) =>
      this.#handlePointerDown(node.nodeKey, container, event),
    );
    container.on("pointertap", () => {
      this.graphCore.sendIntent?.({
        type: "select-node",
        nodeKey: node.nodeKey,
      });
    });

    return { container, background, label };
  }

  #handlePointerDown(nodeKey, container, event) {
    const local = event.data.getLocalPosition(this.nodeLayer);
    this.dragState = {
      nodeKey,
      offsetX: local.x - container.x,
      offsetY: local.y - container.y,
    };
    this.graphCore.sendIntent?.({ type: "select-node", nodeKey });
  }

  #updateNodeEntry(entry, node, isSelected) {
    const color = this.#getNodeColor(node.type);
    entry.container.x = node.position.x;
    entry.container.y = node.position.y;
    entry.label.text = node.label || node.nodeKey || "Node";

    entry.background.clear();
    entry.background.lineStyle(
      isSelected ? 3 : 1.5,
      color,
      this.theme.pixi.nodeBorderAlpha,
    );
    entry.background.beginFill(
      color,
      isSelected
        ? this.theme.pixi.nodeActiveFillAlpha
        : this.theme.pixi.nodeFillAlpha,
    );
    entry.background.drawRoundedRect(0, 0, NODE_WIDTH, NODE_HEIGHT, 14);
    entry.background.endFill();
  }

  updateTheme(theme) {
    this.theme = this.#withDefaults(theme);
    this.app.renderer.backgroundColor = this.theme.pixi.background;
    this.#scheduleRender();
  }

  #withDefaults(theme) {
    const merged = {
      ...DEFAULT_THEME,
      ...(theme ?? {}),
      pixi: {
        ...DEFAULT_THEME.pixi,
        ...(theme?.pixi ?? {}),
        nodePalette: {
          ...DEFAULT_THEME.pixi.nodePalette,
          ...(theme?.pixi?.nodePalette ?? {}),
        },
      },
    };
    return merged;
  }

  #getNodeColor(type) {
    const palette = this.theme.pixi.nodePalette;
    return (
      palette[type] ?? palette.default ?? DEFAULT_THEME.pixi.nodePalette.default
    );
  }
}

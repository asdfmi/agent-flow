import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";
import { getNodeMeta } from "../../components/nodeMeta.js";

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
  #boundWheelHandler = null;

  constructor({ graphCore, container, theme }) {
    this.graphCore = graphCore;
    this.container = container;
    this.nodeEntries = new Map();
    this.dragState = null;
    this.cameraDragState = null;
    this.pendingRender = false;
    this.destroyed = false;
    this.theme = this.#withDefaults(theme);
    this.camera = { x: 0, y: 0, scale: 1 };

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

    this.world = new Container();
    this.gridLayer = new Graphics();
    this.edgeLayer = new Graphics();
    this.nodeLayer = new Container();
    this.world.addChild(this.gridLayer);
    this.world.addChild(this.edgeLayer);
    this.world.addChild(this.nodeLayer);
    this.app.stage.addChild(this.world);
    this.app.stage.interactive = true;

    this.#attachStageListeners();
    this.#attachWheelListener();
    this.#resize();
    this.#updateCameraTransform();
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
    this.#detachWheelListener();
    this.app.stage.removeAllListeners();
    this.nodeLayer
      .removeChildren()
      .forEach?.((child) => child.destroy?.({ children: true }));
    this.edgeLayer.destroy(true);
    this.gridLayer.destroy(true);
    this.world.destroy({ children: true });
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
    this.app.stage.hitArea = new Rectangle(0, 0, width, height);
    this.graphCore?.updateViewportSize?.({ width, height });
  }

  #attachStageListeners() {
    this.app.stage.on("pointerdown", (event) =>
      this.#handleStagePointerDown(event),
    );
    const handlePointerUp = () => {
      this.#endNodeDrag();
      this.#stopCameraDrag();
    };
    this.app.stage.on("pointerup", handlePointerUp);
    this.app.stage.on("pointerupoutside", handlePointerUp);
    this.app.stage.on("pointercancel", handlePointerUp);
    this.app.stage.on("pointermove", (event) => {
      this.#handleNodePointerMove(event);
      this.#handleCameraPointerMove(event);
    });
  }

  #attachWheelListener() {
    if (!this.view) return;
    this.#boundWheelHandler = (event) => this.#handleWheel(event);
    this.view.addEventListener("wheel", this.#boundWheelHandler, {
      passive: false,
    });
  }

  #detachWheelListener() {
    if (this.view && this.#boundWheelHandler) {
      this.view.removeEventListener("wheel", this.#boundWheelHandler);
    }
    this.#boundWheelHandler = null;
  }

  #handleNodePointerMove(event) {
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

  #endNodeDrag() {
    this.dragState = null;
  }

  #handleStagePointerDown(event) {
    if (this.destroyed) return;
    const originalEvent = event.data?.originalEvent;
    if (!originalEvent) return;
    const pointerType = originalEvent.pointerType || "mouse";
    if (pointerType !== "mouse") return;
    if (originalEvent.button !== 0) return;
    if (event.target !== this.app.stage) return;
    this.cameraDragState = {
      last: { x: event.data.global.x, y: event.data.global.y },
    };
    if (this.view) {
      this.view.style.cursor = "grabbing";
    }
  }

  #handleCameraPointerMove(event) {
    if (!this.cameraDragState) return;
    const originalEvent = event.data?.originalEvent;
    if (
      originalEvent &&
      originalEvent.pointerType &&
      originalEvent.pointerType !== "mouse"
    ) {
      return;
    }
    const global = event.data.global;
    const dx = global.x - this.cameraDragState.last.x;
    const dy = global.y - this.cameraDragState.last.y;
    this.cameraDragState.last = { x: global.x, y: global.y };
    this.#applyCameraDelta(dx, dy);
  }

  #stopCameraDrag() {
    if (!this.cameraDragState) return;
    this.cameraDragState = null;
    if (this.view) {
      this.view.style.cursor = "";
    }
  }

  #handleWheel(event) {
    if (!this.view || this.destroyed) return;
    event.preventDefault();
    let delta = event.deltaY;
    if (!Number.isFinite(delta) || delta === 0) return;
    if (event.deltaMode === 1) {
      delta *= 16;
    } else if (event.deltaMode === 2) {
      delta *= 120;
    }
    const baseSensitivity = event.ctrlKey ? 0.02 : 0.004;
    const normalized = delta * baseSensitivity;
    if (Math.abs(normalized) < 0.0001) return;
    const zoomFactor = Math.exp(-normalized);
    const nextScale = this.#clampScale(this.camera.scale * zoomFactor);
    if (nextScale === this.camera.scale) return;
    const rect = this.view.getBoundingClientRect();
    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const worldX = (pointer.x - this.camera.x) / this.camera.scale;
    const worldY = (pointer.y - this.camera.y) / this.camera.scale;
    this.camera.scale = nextScale;
    this.camera.x = pointer.x - worldX * this.camera.scale;
    this.camera.y = pointer.y - worldY * this.camera.scale;
    this.#updateCameraTransform();
    this.#scheduleRender();
  }

  #clampScale(value) {
    const min = 0.25;
    const max = 4;
    if (!Number.isFinite(value)) return this.camera.scale;
    return Math.min(Math.max(value, min), max);
  }

  #applyCameraDelta(dx, dy) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.camera.x += dx;
    this.camera.y += dy;
    this.#updateCameraTransform();
    this.#scheduleRender();
  }

  #drawGrid() {
    const { width, height } = this.app.renderer.screen;
    const scale = this.camera.scale || 1;
    const spacing = 48;
    const worldStartX = -this.camera.x / scale;
    const worldStartY = -this.camera.y / scale;
    const worldEndX = worldStartX + width / scale;
    const worldEndY = worldStartY + height / scale;
    const startX = Math.floor(worldStartX / spacing) * spacing - spacing * 2;
    const endX = Math.ceil(worldEndX / spacing) * spacing + spacing * 2;
    const startY = Math.floor(worldStartY / spacing) * spacing - spacing * 2;
    const endY = Math.ceil(worldEndY / spacing) * spacing + spacing * 2;

    this.gridLayer.clear();
    this.gridLayer.lineStyle(
      1,
      this.theme.pixi.gridColor,
      this.theme.pixi.gridAlpha,
    );
    for (let x = startX; x <= endX; x += spacing) {
      this.gridLayer.moveTo(x, startY);
      this.gridLayer.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += spacing) {
      this.gridLayer.moveTo(startX, y);
      this.gridLayer.lineTo(endX, y);
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
      } else if (!entry.summary) {
        entry.summary = this.#createSummaryText();
        entry.container.addChild(entry.summary);
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
    label.position.set(NODE_WIDTH / 2, NODE_HEIGHT / 2 - 12);

    const summary = this.#createSummaryText();

    container.addChild(background);
    container.addChild(label);
    container.addChild(summary);

    container.on("pointerdown", (event) =>
      this.#handlePointerDown(node.nodeKey, container, event),
    );
    container.on("pointertap", () => {
      this.graphCore.sendIntent?.({
        type: "select-node",
        nodeKey: node.nodeKey,
      });
    });

    return { container, background, label, summary };
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
    const meta = this.#getNodeMeta(node.type);
    const color = meta.color;
    entry.container.x = node.position.x;
    entry.container.y = node.position.y;
    entry.label.text = node.label || node.nodeKey || meta.label || "Node";
    const summaryText = this.#getNodeSummary(node, meta);
    entry.summary.text = summaryText;

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

  #updateCameraTransform() {
    if (!this.world) return;
    this.world.position.set(this.camera.x, this.camera.y);
    this.world.scale.set(this.camera.scale);
  }

  #createSummaryText() {
    const summary = new Text("", {
      fontFamily: "Inter, sans-serif",
      fontSize: 12,
      fill: 0xb0bac5,
      align: "center",
      wordWrap: true,
      wordWrapWidth: NODE_WIDTH - 24,
    });
    summary.anchor.set(0.5);
    summary.position.set(NODE_WIDTH / 2, NODE_HEIGHT / 2 + 18);
    return summary;
  }

  #getNodeMeta(type) {
    const meta = getNodeMeta(type);
    return {
      label: meta.label || type || "node",
      description: meta.description || "",
      color: this.#resolveNodeColor(type),
    };
  }

  #resolveNodeColor(type) {
    const metaColor = getNodeMeta(type)?.color;
    const paletteColor = this.theme.pixi.nodePalette[type];
    if (paletteColor) return paletteColor;
    if (metaColor && typeof metaColor === "string") {
      // Map MUI color names to hex approximations if needed
      switch (metaColor) {
        case "primary":
          return 0x3b82f6;
        case "secondary":
          return 0xa855f7;
        case "success":
          return 0x22c55e;
        case "info":
          return 0x0ea5e9;
        case "warning":
          return 0xf97316;
        default:
          return metaColor;
      }
    }
    return this.theme.pixi.nodePalette.default ?? 0x94a3b8;
  }

  #getNodeSummary(node, meta) {
    const cfg = node.config || {};
    switch (node.type) {
      case "navigate":
        if (cfg.url) return this.#truncate(`Go to ${cfg.url}`);
        break;
      case "click":
        if (cfg.xpath) return this.#truncate(`Click ${cfg.xpath}`);
        break;
      case "fill":
        if (cfg.xpath || cfg.value) {
          return this.#truncate(
            `Fill ${cfg.xpath || "target"} = ${cfg.value ?? ""}`,
          );
        }
        break;
      case "press":
        if (cfg.key || cfg.xpath) {
          const key = cfg.key ? `Key ${cfg.key}` : "Key";
          const target = cfg.xpath ? ` @ ${cfg.xpath}` : "";
          return this.#truncate(`${key}${target}`);
        }
        break;
      case "scroll":
        if (Number.isFinite(cfg.dx) || Number.isFinite(cfg.dy)) {
          return this.#truncate(`Scroll ${cfg.dx ?? 0}, ${cfg.dy ?? 0}`);
        }
        break;
      case "wait":
        if (Number.isFinite(cfg.delay)) {
          return this.#truncate(`Wait ${cfg.delay}s`);
        }
        break;
      case "log":
        if (cfg.message) return this.#truncate(cfg.message);
        break;
      case "script":
        if (cfg.code) return this.#truncate(cfg.code);
        break;
      case "extract_text":
        if (cfg.xpath) {
          return this.#truncate(
            cfg.as ? `${cfg.xpath} → ${cfg.as}` : cfg.xpath,
          );
        }
        break;
      default:
        break;
    }
    return meta.description || "";
  }

  #truncate(value, max = 44) {
    if (!value) return "";
    const str = String(value);
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
  }
}

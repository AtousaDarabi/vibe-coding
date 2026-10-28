import maplibregl from "maplibre-gl";
import * as THREE from "three";

// Cartoon gabled roofs for low-rise buildings, drawn with three.js on top of
// the flat MapLibre extrusions. Each footprint gets its tightest rotated
// rectangle; the ridge runs along the long side, like a classic house.

const MAX_HOUSE_HEIGHT = 20;
const MIN_ZOOM = 15;
const OVERHANG = 0.5;
const roofColors = ["#c8553d", "#b54a35", "#d0634a", "#4f5a66"];
const sun = new THREE.Vector3(-0.45, -0.55, 0.7).normalize();

const origin = maplibregl.MercatorCoordinate.fromLngLat([9.2185, 49.1415], 0);
const unit = origin.meterInMercatorCoordinateUnits();

const toMeters = ([longitude, latitude]) => {
  const point = maplibregl.MercatorCoordinate.fromLngLat([longitude, latitude]);
  return [(point.x - origin.x) / unit, -(point.y - origin.y) / unit];
};

function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const hull = [];
    for (const point of list) {
      while (
        hull.length >= 2 &&
        cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0
      )
        hull.pop();
      hull.push(point);
    }
    hull.pop();
    return hull;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

// Smallest-area rectangle aligned to one of the hull edges.
function footprintRectangle(points) {
  const hull = convexHull(points);
  if (hull.length < 3) return null;
  let best = null;
  hull.forEach((point, index) => {
    const next = hull[(index + 1) % hull.length];
    const angle = Math.atan2(next[1] - point[1], next[0] - point[0]);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [x, y] of hull) {
      const u = x * cos + y * sin;
      const v = -x * sin + y * cos;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    const area = (maxU - minU) * (maxV - minV);
    if (!best || area < best.area) {
      const u = (minU + maxU) / 2;
      const v = (minV + maxV) / 2;
      best = {
        area,
        angle,
        center: [u * cos - v * sin, u * sin + v * cos],
        length: maxU - minU,
        width: maxV - minV,
      };
    }
  });
  if (best.width > best.length) {
    [best.length, best.width] = [best.width, best.length];
    best.angle += Math.PI / 2;
  }
  return best;
}

function addRoof(positions, colors, rectangle, height, roofColor, wallColor) {
  const { center, angle, length, width } = rectangle;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const ridge = Math.min(width * 0.38, 7);
  const a = length / 2;
  const ao = a + OVERHANG;
  const b = width / 2 + OVERHANG;
  const top = height + ridge;
  const world = ([u, v, z]) => [
    center[0] + u * cos - v * sin,
    center[1] + u * sin + v * cos,
    z,
  ];
  const triangle = (points, color) => {
    const [p0, p1, p2] = points.map(world);
    const normal = new THREE.Vector3()
      .subVectors(new THREE.Vector3(...p1), new THREE.Vector3(...p0))
      .cross(
        new THREE.Vector3().subVectors(
          new THREE.Vector3(...p2),
          new THREE.Vector3(...p0),
        ),
      )
      .normalize();
    const shade = 0.62 + 0.38 * Math.abs(normal.dot(sun));
    for (const point of [p0, p1, p2]) {
      positions.push(...point);
      colors.push(color.r * shade, color.g * shade, color.b * shade);
    }
  };
  const quad = ([p0, p1, p2, p3], color) => {
    triangle([p0, p1, p2], color);
    triangle([p0, p2, p3], color);
  };

  quad(
    [
      [-ao, -b, height],
      [ao, -b, height],
      [ao, 0, top],
      [-ao, 0, top],
    ],
    roofColor,
  );
  quad(
    [
      [-ao, b, height],
      [-ao, 0, top],
      [ao, 0, top],
      [ao, b, height],
    ],
    roofColor,
  );
  triangle(
    [
      [-a, -width / 2, height],
      [-a, 0, top],
      [-a, width / 2, height],
    ],
    wallColor,
  );
  triangle(
    [
      [a, -width / 2, height],
      [a, width / 2, height],
      [a, 0, top],
    ],
    wallColor,
  );
}

export function createGableRoofLayer({ wallColorFor }) {
  let map;
  let renderer;
  let mesh;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const transform = new THREE.Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new THREE.Vector3(unit, -unit, unit));
  let timer;

  const rebuild = () => {
    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh = null;
    }
    if (map.getZoom() < MIN_ZOOM) {
      map.triggerRepaint();
      return;
    }

    // Tiles clip buildings at their edges; keep the largest piece of each.
    const pieces = new Map();
    for (const feature of map.querySourceFeatures("openmaptiles", {
      sourceLayer: "building",
    })) {
      const { render_height: height, render_min_height: base } =
        feature.properties;
      if (!height || height > MAX_HOUSE_HEIGHT || base > 0) continue;
      // At this zoom the tiles merge neighbouring buildings into MultiPolygons.
      const polygons =
        feature.geometry.type === "Polygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates
            : [];
      for (const [ring] of polygons) {
        const key = ring[0].map((value) => value.toFixed(6)).join();
        if (!pieces.has(key) || pieces.get(key).ring.length < ring.length)
          pieces.set(key, {
            ring,
            height,
            id: Math.abs(Math.round(ring[0][0] * 1e6 + ring[0][1] * 1e6)),
          });
      }
    }

    const positions = [];
    const colors = [];
    for (const { ring, height, id } of pieces.values()) {
      const rectangle = footprintRectangle(ring.map(toMeters));
      if (!rectangle || rectangle.width < 3 || rectangle.width > 30) continue;
      const roofColor = new THREE.Color(roofColors[id % roofColors.length]);
      const wallColor = new THREE.Color(wallColorFor(height));
      addRoof(positions, colors, rectangle, height, roofColor, wallColor);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    map.triggerRepaint();
  };
  const scheduleRebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  };
  const onSourceData = (event) => {
    if (event.sourceId === "openmaptiles" && event.isSourceLoaded)
      scheduleRebuild();
  };

  return {
    id: "gable-roofs",
    type: "custom",
    renderingMode: "3d",
    onAdd(mapInstance, gl) {
      map = mapInstance;
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      map.on("moveend", scheduleRebuild);
      map.on("sourcedata", onSourceData);
      scheduleRebuild();
    },
    onRemove() {
      clearTimeout(timer);
      map.off("moveend", scheduleRebuild);
      map.off("sourcedata", onSourceData);
      mesh?.geometry.dispose();
      material.dispose();
    },
    render(gl, args) {
      if (!mesh) return;
      camera.projectionMatrix = new THREE.Matrix4()
        .fromArray(args.defaultProjectionData.mainMatrix)
        .multiply(transform);
      renderer.resetState();
      renderer.render(scene, camera);
    },
  };
}

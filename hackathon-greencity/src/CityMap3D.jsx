import { useEffect, useImperativeHandle, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createGableRoofLayer } from "./gableRoofs.js";

// Buildings for the whole city come from OpenFreeMap vector tiles, which carry
// each building's height (from OSM levels/height tags, or a sensible default).
// Each height band gets a cartoon facade (wall colour + windows) and a roof
// colour: red-tiled houses, light plaster blocks, stone and glassier towers.
const buildingStyles = [
  { id: "house", wall: "#fff4dc", roof: "#c26a4a", window: "#7fb3c8" },
  { id: "block", wall: "#f6e7c4", roof: "#b4876a", window: "#86b6c6" },
  { id: "stone", wall: "#ebe6d8", roof: "#9e998c", window: "#8fb9c4" },
  { id: "tower", wall: "#d3ddd6", roof: "#7f877f", window: "#a9d3dc" },
];
const heightSteps = [9, 18, 30];

const styleForHeight = (height) =>
  buildingStyles[heightSteps.filter((step) => height >= step).length];

const byHeight = (key) => [
  "step",
  ["get", "render_height"],
  ...buildingStyles.flatMap((style, index) =>
    index === 0 ? [style[key]] : [heightSteps[index - 1], style[key]],
  ),
];

// Draws one repeating facade tile: wall, two framed windows with a shine.
function facadeImage({ wall, window: glass }) {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = wall;
  context.fillRect(0, 0, size, size);
  for (const x of [5, 19]) {
    context.fillStyle = "#5b4a3d";
    context.fillRect(x - 1, 8, 10, 14);
    context.fillStyle = glass;
    context.fillRect(x, 9, 8, 12);
    context.fillStyle = "#ffffffaa";
    context.fillRect(x + 1, 10, 2, 5);
    context.fillStyle = "#5b4a3d";
    context.fillRect(x, 14, 8, 1);
    context.fillRect(x + 3.5, 9, 1, 12);
  }
  return context.getImageData(0, 0, size, size);
}

const zoomIn = (value) => [
  "interpolate",
  ["linear"],
  ["zoom"],
  13,
  0,
  14,
  value,
];

// Everything outside the city boundary, used to dim the surroundings.
const outsideMask = (boundary) => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [8.5, 48.8],
        [9.9, 48.8],
        [9.9, 49.5],
        [8.5, 49.5],
        [8.5, 48.8],
      ],
      ...boundary.geometry.coordinates,
    ],
  },
});

const sensorPopupHtml = (sensor) =>
  `<strong>${sensor.name}</strong><br />${sensor.label}: ` +
  `<span class="${sensor.type === "task" ? "tooltip-xp" : ""}">${sensor.value}</span>` +
  `<br /><small>${sensor.detail}</small>`;

function CityMap3D({ ref, sensors, user, bounds, onSelect, onCoordinates }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const callbacks = useRef({ onSelect, onCoordinates });

  useEffect(() => {
    callbacks.current = { onSelect, onCoordinates };
  });

  // Same shape the 2D map controls already call (setView / zoomIn / zoomOut).
  useImperativeHandle(ref, () => ({
    setView: ([latitude, longitude], zoom) =>
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: zoom + 1 }),
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
  }));

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          openmaptiles: {
            type: "vector",
            url: "https://tiles.openfreemap.org/planet",
          },
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: { "raster-saturation": -0.2, "raster-brightness-max": 0.97 },
          },
        ],
      },
      center: [9.2185, 49.1415],
      zoom: 15,
      pitch: 45,
      bearing: -15,
      minZoom: 10,
      maxZoom: 18.5,
      maxPitch: 75,
      maxBounds: [
        [bounds[0][1], bounds[0][0]],
        [bounds[1][1], bounds[1][0]],
      ],
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("mousemove", (event) =>
      callbacks.current.onCoordinates(event.lngLat),
    );
    map.on("click", (event) => callbacks.current.onCoordinates(event.lngLat));

    map.on("load", async () => {
      const boundary = await fetch("/data/heilbronn-boundary.geojson").then(
        (r) => r.json(),
      );
      if (mapRef.current !== map) return;

      map.addSource("outside", {
        type: "geojson",
        data: outsideMask(boundary),
      });
      map.addLayer({
        id: "outside",
        type: "fill",
        source: "outside",
        paint: { "fill-color": "#e7e1d0", "fill-opacity": 0.55 },
      });

      map.addSource("boundary", { type: "geojson", data: boundary });
      map.addLayer({
        id: "boundary",
        type: "line",
        source: "boundary",
        paint: {
          "line-color": "#ca5745",
          "line-width": 3.5,
        },
        layout: { "line-join": "round" },
      });

      // Softer shading keeps the cartoon walls bright.
      map.setLight({ anchor: "viewport", intensity: 0.3 });
      buildingStyles.forEach((style) =>
        map.addImage(`facade-${style.id}`, facadeImage(style)),
      );
      const buildingLayer = {
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        filter: ["!", ["has", "hide_3d"]],
      };
      map.addLayer({
        ...buildingLayer,
        id: "building-walls",
        paint: {
          "fill-extrusion-pattern": ["concat", "facade-", byHeight("id")],
          "fill-extrusion-height": zoomIn(["get", "render_height"]),
          "fill-extrusion-base": ["get", "render_min_height"],
          "fill-extrusion-vertical-gradient": true,
        },
      });
      // A thin solid slab on top so roofs get a plain colour, not windows.
      map.addLayer({
        ...buildingLayer,
        id: "building-roofs",
        paint: {
          "fill-extrusion-color": byHeight("roof"),
          "fill-extrusion-height": zoomIn(["+", ["get", "render_height"], 0.6]),
          "fill-extrusion-base": zoomIn(["get", "render_height"]),
        },
      });
      map.addLayer(
        createGableRoofLayer({
          wallColorFor: (height) => styleForHeight(height).wall,
        }),
      );
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [bounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const element = document.createElement("span");
    element.className = "user-marker";
    element.innerHTML = "<i></i>";
    element.title = "You are here · sample location";
    const userMarker = new maplibregl.Marker({ element })
      .setLngLat([user[1], user[0]])
      .addTo(map);

    return () => userMarker.remove();
  }, [user]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = sensors.map((sensor) => {
      const element = document.createElement("span");
      element.className = "sensor-marker-3d";
      element.innerHTML = `<span class="sensor-pin sensor-pin--${sensor.tone}"><i></i></span>`;

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: false,
        closeOnClick: false,
        className: "sensor-popup-3d",
      }).setHTML(sensorPopupHtml(sensor));

      element.addEventListener("mouseenter", () =>
        popup.setLngLat([sensor.position[1], sensor.position[0]]).addTo(map),
      );
      element.addEventListener("mouseleave", () => popup.remove());
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        callbacks.current.onSelect(sensor);
      });

      const marker = new maplibregl.Marker({ element })
        .setLngLat([sensor.position[1], sensor.position[0]])
        .addTo(map);
      marker.popup3d = popup;
      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => {
        marker.popup3d.remove();
        marker.remove();
      });
      markersRef.current = [];
    };
  }, [sensors]);

  return <div ref={containerRef} className="map-3d" />;
}

export default CityMap3D;

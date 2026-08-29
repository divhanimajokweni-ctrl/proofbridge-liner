import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, LineString, Position } from "geojson";
import type { Pipe } from "../lib/engine";
import { findLeakPipe } from "../lib/engine";

export const MAP_CENTER: [number, number] = [0, 0];
export const MAP_ZOOM = 13.5;
export const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

const COLOR_NORMAL = "#64748b";
const COLOR_CANDIDATE = "#fbbf24";
const COLOR_VERIFIED = "#34d399";
const COLOR_SELECTED = "#38bdf8";
const COLOR_LEAK = "#22d3ee";
const COLOR_HALO = "#0b1220";

export interface MapViewHandle {
  /** Push pipe colors + selection to the map. Returns false until the style has loaded. */
  updatePipes(pipes: Pipe[], selectedId: string | null): boolean;
  resetView(): void;
}

interface MapViewProps {
  onSelect: (id: string) => void;
}

interface PipeProps {
  id: string;
  color: string;
  width: number;
}

type MapData = Parameters<maplibregl.GeoJSONSource["setData"]>[0];

function pipeColor(pipe: Pipe): string {
  if (pipe.category === "VERIFIED") return COLOR_VERIFIED;
  if (pipe.category === "CANDIDATE") return COLOR_CANDIDATE;
  return COLOR_NORMAL;
}

function buildGeoJSON(pipes: Pipe[]): MapData {
  const features: Feature<LineString, PipeProps>[] = pipes.map((p) => {
    const coords: Position[] = [
      [p.x1, p.y1],
      [p.x2, p.y2],
    ];
    return {
      type: "Feature",
      properties: {
        id: p.id,
        color: pipeColor(p),
        width: p.isLeak ? 4.5 : 2.75,
      },
      geometry: { type: "LineString", coordinates: coords },
    };
  });
  const fc: FeatureCollection = { type: "FeatureCollection", features };
  return fc as unknown as MapData;
}

function buildSelected(selectedId: string | null, pipes: Pipe[]): MapData {
  const pipe = selectedId ? pipes.find((p) => p.id === selectedId) : undefined;
  if (!pipe) return { type: "FeatureCollection", features: [] } as unknown as MapData;
  const features: Feature<LineString, PipeProps>[] = [
    {
      type: "Feature",
      properties: { id: pipe.id, color: COLOR_SELECTED, width: 6 },
      geometry: {
        type: "LineString",
        coordinates: [
          [pipe.x1, pipe.y1],
          [pipe.x2, pipe.y2],
        ],
      },
    },
  ];
  return { type: "FeatureCollection", features } as unknown as MapData;
}

function buildLeakMarker(pipes: Pipe[]): MapData {
  const leak = findLeakPipe(pipes);
  const fc: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [leak.midX, leak.midY] },
      },
    ],
  };
  return fc as unknown as MapData;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { onSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useImperativeHandle(
    ref,
    () => ({
      updatePipes(pipes, selectedId) {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return false;
        const source = map.getSource("pipes") as maplibregl.GeoJSONSource | undefined;
        if (!source) return false;
        source.setData(buildGeoJSON(pipes));
        (map.getSource("pipes-selected") as maplibregl.GeoJSONSource | undefined)?.setData(
          buildSelected(selectedId, pipes),
        );
        (map.getSource("leak-marker") as maplibregl.GeoJSONSource | undefined)?.setData(
          buildLeakMarker(pipes),
        );
        return true;
      },
      resetView() {
        mapRef.current?.easeTo({ center: MAP_CENTER, zoom: MAP_ZOOM, duration: 600 });
      },
    }),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = new maplibregl.Map({
      container,
      style: STYLE_URL,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: false,
      maplibreLogo: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("pipes-halo", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "pipes-halo",
        type: "line",
        source: "pipes-halo",
        paint: {
          "line-color": COLOR_HALO,
          "line-width": ["get", "width"],
          "line-opacity": 0.4,
        },
      });
      map.addSource("pipes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "pipes",
        type: "line",
        source: "pipes",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
          "line-opacity": 0.95,
        },
      });
      map.addSource("pipes-selected", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "pipes-selected",
        type: "line",
        source: "pipes-selected",
        paint: {
          "line-color": COLOR_SELECTED,
          "line-width": 7,
          "line-opacity": 0.9,
        },
      });
      map.addSource("leak-marker", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "leak-marker",
        type: "circle",
        source: "leak-marker",
        paint: {
          "circle-radius": 9,
          "circle-color": COLOR_LEAK,
          "circle-opacity": 0.85,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#0b1220",
        },
      });

      const layerIds = ["pipes", "pipes-selected"];
      map.on("click", layerIds, (e) => {
        const feature = e.features?.[0];
        if (feature) onSelectRef.current(String(feature.properties.id));
      });
      map.on("mouseenter", layerIds, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerIds, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 bg-background" />;
});

export default MapView;

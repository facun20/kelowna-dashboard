"use client";

import { useEffect, useState, useCallback } from "react";
import { Camera, ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from "lucide-react";

interface TrafficCamera {
  id: number;
  name: string;
  highway: string;
  direction: string;
  imageUrl: string;
  mapUrl: string;
}

interface CameraData {
  available: boolean;
  cameras: TrafficCamera[];
  totalCameras: number;
}

export function TrafficCamerasWidget() {
  const [data, setData] = useState<CameraData | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [imgError, setImgError] = useState(false);

  const fetchCameras = useCallback(() => {
    fetch("/api/data/traffic-cameras")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setImgError(false);
      })
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setImgError(false);
    fetchCameras();
  };

  if (!data?.available || !data.cameras.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Camera size={16} className="text-green-500" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Traffic Cameras</p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">Camera data unavailable</p>
      </div>
    );
  }

  const cameras = data.cameras;
  const current = cameras[activeIndex];

  const prevCamera = () => {
    setActiveIndex((i) => (i === 0 ? cameras.length - 1 : i - 1));
    setImgError(false);
  };
  const nextCamera = () => {
    setActiveIndex((i) => (i === cameras.length - 1 ? 0 : i + 1));
    setImgError(false);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-green-500" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Traffic Cameras</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-[var(--card-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title="Refresh image"
          >
            <RefreshCw size={12} />
          </button>
          <a
            href={current.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-[var(--card-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title="View on DriveBC"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Camera image — compact */}
      <div className="relative aspect-[16/10] bg-[var(--surface)]">
        {!imgError ? (
          <img
            key={`${current.id}-${refreshKey}`}
            src={`${current.imageUrl}&r=${refreshKey}`}
            alt={current.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Camera size={24} className="text-[var(--text-tertiary)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-tertiary)]">Image unavailable</p>
            </div>
          </div>
        )}

        {/* Nav arrows */}
        <button
          onClick={prevCamera}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={nextCamera}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight size={16} />
        </button>

        {/* Camera counter badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
          {activeIndex + 1} / {cameras.length}
        </div>
      </div>

      {/* Camera info — compact */}
      <div className="px-4 py-2">
        <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{current.name}</p>
        <p className="text-xs text-[var(--text-secondary)]">
          {current.highway} · {current.direction}
        </p>
      </div>
    </div>
  );
}

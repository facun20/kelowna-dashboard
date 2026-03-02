import { NextResponse } from "next/server";

/**
 * DriveBC traffic cameras near Kelowna.
 * Camera images are publicly available at:
 *   https://images.drivebc.ca/bchighwaycam/pub/cameras/{ID}.jpg
 *
 * This route returns a curated list of Kelowna-area cameras.
 * Camera IDs sourced from DriveBC's public camera listing.
 */

export const dynamic = "force-dynamic";

interface TrafficCamera {
  id: number;
  name: string;
  highway: string;
  direction: string;
  imageUrl: string;
  mapUrl: string;
}

// Kelowna and area traffic cameras from DriveBC
const KELOWNA_CAMERAS: TrafficCamera[] = [
  {
    id: 127,
    name: "Hwy 97 at Hwy 33",
    highway: "Hwy 97",
    direction: "N",
    imageUrl: "https://images.drivebc.ca/bchighwaycam/pub/cameras/127.jpg",
    mapUrl: "https://www.drivebc.ca/cameras/127",
  },
  {
    id: 399,
    name: "Hwy 97 at Leckie Rd",
    highway: "Hwy 97",
    direction: "N",
    imageUrl: "https://images.drivebc.ca/bchighwaycam/pub/cameras/399.jpg",
    mapUrl: "https://www.drivebc.ca/cameras/399",
  },
  {
    id: 131,
    name: "Hwy 97C at Connector Summit",
    highway: "Hwy 97C",
    direction: "E",
    imageUrl: "https://images.drivebc.ca/bchighwaycam/pub/cameras/131.jpg",
    mapUrl: "https://www.drivebc.ca/cameras/131",
  },
  {
    id: 128,
    name: "Hwy 97 at Hwy 97A Junction",
    highway: "Hwy 97",
    direction: "N",
    imageUrl: "https://images.drivebc.ca/bchighwaycam/pub/cameras/128.jpg",
    mapUrl: "https://www.drivebc.ca/cameras/128",
  },
  {
    id: 374,
    name: "Hwy 33 at Joe Rich",
    highway: "Hwy 33",
    direction: "E",
    imageUrl: "https://images.drivebc.ca/bchighwaycam/pub/cameras/374.jpg",
    mapUrl: "https://www.drivebc.ca/cameras/374",
  },
  {
    id: 205,
    name: "Hwy 97 at Bennett Bridge",
    highway: "Hwy 97",
    direction: "N",
    imageUrl: "https://images.drivebc.ca/bchighwaycam/pub/cameras/205.jpg",
    mapUrl: "https://www.drivebc.ca/cameras/205",
  },
];

export async function GET() {
  // Add cache-busting timestamp to image URLs so they refresh
  const timestamp = Date.now();
  const cameras = KELOWNA_CAMERAS.map((cam) => ({
    ...cam,
    imageUrl: `${cam.imageUrl}?t=${timestamp}`,
  }));

  return NextResponse.json({
    available: true,
    cameras,
    totalCameras: cameras.length,
    source: "DriveBC",
    lastUpdated: new Date().toISOString(),
  });
}

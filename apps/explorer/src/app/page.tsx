"use client";

import { PortraitProvider } from "@/lib/portrait-context";
import PortraitDashboard from "@/components/PortraitDashboard";

export default function Home() {
  return (
    <PortraitProvider>
      <PortraitDashboard />
    </PortraitProvider>
  );
}

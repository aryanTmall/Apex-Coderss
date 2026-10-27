import React from 'react';
import { PublicIntelligenceFeed } from '../components/news/PublicIntelligenceFeed';

export const PublicIntelligencePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-2">
      <PublicIntelligenceFeed
        initialScope="ALL"
        title="Civic Intelligence & Public Telemetry Hub"
        subtitle="Authoritative municipal advisories, monsoon infrastructure updates, and multi-tier civic bulletins."
      />
    </div>
  );
};

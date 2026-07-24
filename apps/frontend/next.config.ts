import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for the Docker runtime stage — see docker/frontend.Dockerfile.
  output: 'standalone',
  experimental: {
    serverActions: {
      // Default is 1mb — too small for FileUploadField/MediaGalleryField photo/résumé uploads
      // (entities/file/actions.ts's uploadFileAction), which pass the raw File through a Server
      // Action. A typical phone photo alone exceeds the default, causing "Body exceeded 1 MB
      // limit" and a stuck upload with no clear error surfaced to the admin UI.
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;

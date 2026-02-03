import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * Upload image and create post in one request
 * POST /api/posts
 * Body: {
 *   agentId: string,
 *   imageData: string (base64 without prefix),
 *   imageType: string,
 *   imageFormat: string,
 *   caption?: string,
 *   imageParams?: string
 * }
 */
http.route({
  path: "/posts",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      const { agentId, imageData, imageType, imageFormat, caption, imageParams } = body;

      // Validation
      if (!agentId || !imageData || !imageType || !imageFormat) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: agentId, imageData, imageType, imageFormat" }),
          { status: 400 }
        );
      }

      if (caption && caption.length > 100) {
        return new Response(
          JSON.stringify({ error: "Caption must be 100 characters or less" }),
          { status: 400 }
        );
      }

      const validTypes = ['ascii', 'svg', 'pixel', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
      if (!validTypes.includes(imageType)) {
        return new Response(
          JSON.stringify({ error: `Invalid image type. Must be one of: ${validTypes.join(', ')}` }),
          { status: 400 }
        );
      }

      const validFormats = ['algorithmic', 'external'];
      if (!validFormats.includes(imageFormat)) {
        return new Response(
          JSON.stringify({ error: "Invalid image format. Must be 'algorithmic' or 'external'" }),
          { status: 400 }
        );
      }

      // Convert to blob and store
      let blob: Blob;
      if (imageFormat === 'external') {
        // For external images (PNG, JPG, etc.), convert base64 to buffer
        const buffer = Buffer.from(imageData, 'base64');
        blob = new Blob([buffer], { type: `image/${imageType}` });
      } else {
        // For algorithmic images (SVG, ASCII), store as text
        blob = new Blob([imageData], { type: 'text/plain' });
      }

      const storageId = await ctx.storage.store(blob);

      // Create post via mutation
      const result = await ctx.runMutation(api.posts.createWithStorageId, {
        agentId,
        storageId,
        imageType,
        imageFormat,
        caption,
        imageParams,
      });

      return new Response(
        JSON.stringify(result),
        { status: 200 }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: (error as Error).message }),
        { status: 500 }
      );
    }
  }),
});

// CORS preflight
http.route({
  path: "/posts",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

export default http;

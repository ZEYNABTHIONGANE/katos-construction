
/**
 * Utility functions for optimizing Cloudinary media delivery
 */

/**
 * Optimizes a Cloudinary URL by injecting transformation parameters.
 * If the URL is not a Cloudinary URL, it returns the original URL.
 * 
 * @param url The original media URL
 * @param options Optimization options (width, quality, format)
 * @returns The optimized URL
 */
export const optimizeCloudinaryUrl = (
    url: string | undefined,
    options: {
        width?: number;
        height?: number;
        quality?: string | number;
        format?: string;
        crop?: string;
        gravity?: string;
        startOffset?: string | number;
    } = {}
): string => {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    // Split the URL to find where to inject transformations
    // format: https://res.cloudinary.com/[cloud_name]/[resource_type]/[type]/[transformations]/[version]/[public_id].[extension]

    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');

    if (uploadIndex === -1) return url;

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill',
        startOffset
    } = options;

    const gravity = options.gravity || (crop === 'fill' ? 'auto' : undefined);

    let transformation = `q_${quality},f_${format}`;

    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (width || height) transformation += `,c_${crop}`;
    if (gravity) transformation += `,g_${gravity}`;
    if (startOffset) transformation += `,so_${startOffset}`;

    // Inject transformation after 'upload'
    parts.splice(uploadIndex + 1, 0, transformation);

    // Update extension if format is specified and not 'auto'
    if (format !== 'auto') {
        const lastPart = parts[parts.length - 1];
        const extensionIndex = lastPart.lastIndexOf('.');
        if (extensionIndex !== -1) {
            parts[parts.length - 1] = lastPart.substring(0, extensionIndex) + '.' + format;
        }
    }

    return parts.join('/');
};

/**
 * Generates a thumbnail URL for a video from Cloudinary.
 * 
 * @param videoUrl The Cloudinary video URL
 * @param options Thumbnail options
 * @returns The thumbnail image URL
 */
export const getVideoThumbnailUrl = (
    videoUrl: string | undefined,
    options: {
        width?: number;
        height?: number;
        crop?: string;
        gravity?: string;
        quality?: string | number;
        timeOffset?: string | number;
    } = {}
): string => {
    if (!videoUrl) return '';

    // If already a thumbnail/image URL, just optimize it
    if (videoUrl.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
        return optimizeCloudinaryUrl(videoUrl, options);
    }

    if (!videoUrl.includes('cloudinary.com')) {
        // Return original if not cloudinary, maybe it's already a thumb
        return videoUrl;
    }

    const {
        width = 400,
        height,
        crop = 'fill',
        gravity,
        quality = 'auto',
        timeOffset = '1'
    } = options;

    // Convert video URL to image URL for thumbnail
    // e.g. upload/video/upload/v123/video.mp4 -> upload/image/upload/v123/video.jpg
    let thumbUrl = videoUrl.replace('/video/upload/', '/image/upload/');

    // Replace extension
    const lastDot = thumbUrl.lastIndexOf('.');
    if (lastDot !== -1) {
        thumbUrl = thumbUrl.substring(0, lastDot) + '.jpg';
    }

    return optimizeCloudinaryUrl(thumbUrl, {
        width,
        height,
        quality,
        format: 'webp', // WebP is efficient for mobile
        crop,
        gravity,
        startOffset: timeOffset
    });
};

/**
 * Optimizes a Cloudinary Video URL by injecting transformation parameters.
 * 
 * @param url The original video URL
 * @param options Optimization options
 * @returns The optimized video URL
 */
export const optimizeCloudinaryVideoUrl = (
    url: string | undefined,
    options: {
        width?: number;
        height?: number;
        crop?: string;
        gravity?: string;
        quality?: string | number;
        format?: string;
        bitrate?: string | number;
        codec?: string;
    } = {}
): string => {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');

    if (uploadIndex === -1) return url;

    const {
        width,
        height,
        crop = 'fill',
        quality = 'auto',
        format = 'mp4'
    } = options;

    const gravity = options.gravity || (crop === 'fill' ? 'auto' : undefined);

    let transformation = `q_${quality},f_${format}`;

    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (width || height) transformation += `,c_${crop}`;
    if (gravity) transformation += `,g_${gravity}`;

    // Inject transformation after 'upload'
    parts.splice(uploadIndex + 1, 0, transformation);

    return parts.join('/');
};


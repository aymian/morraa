/**
 * Cloudinary Optimization Helper
 * 
 * Provides utility functions to generate optimized URLs for images and videos
 * served via Cloudinary, ensuring fast load times and efficient bandwidth usage.
 */

export const getOptimizedUrl = (
    url: string, 
    type: 'image' | 'video', 
    options: { width?: number; height?: number; quality?: string } = {}
): string => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Detect connection speed (Network Information API)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const isSlowConnection = connection ? (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === '3g') : false;

    // Split the URL to inject transformations
    const uploadRegex = /\/upload\//;
    if (!uploadRegex.test(url)) return url;

    const parts = url.split('/upload/');
    const baseUrl = parts[0] + '/upload/';
    const rest = parts[1];

    // Build transformations
    const transforms: string[] = [];
    
    // Format optimization
    transforms.push('f_auto');

    // Quality optimization based on connection
    if (options.quality) {
        transforms.push(`q_${options.quality}`);
    } else {
        // More aggressive compression for video on slow connections
        if (type === 'video' && isSlowConnection) {
            transforms.push('q_auto:eco');
        } else if (isSlowConnection) {
            transforms.push('q_auto:low');
        } else {
            transforms.push('q_auto:good');
        }
    }

    // Dimension optimization
    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    
    // Device Pixel Ratio - limit to 2.0 to save bandwidth on high density screens
    transforms.push('dpr_2.0');
    
    // Video specific optimizations
    if (type === 'video') {
        transforms.push('vc_auto'); // Video codec optimization
        
        // For slow connections, limit video width if not specified
        if (isSlowConnection && !options.width) {
            transforms.push('w_480'); 
        }
    }

    const transformString = transforms.join(',');
    
    return `${baseUrl}${transformString}/${rest}`;
};

export const getVideoPoster = (videoUrl: string): string => {
    if (!videoUrl) return "";
    if (!videoUrl.includes('cloudinary.com')) return videoUrl; // Fallback?

    // Change extension to .jpg and resource type to video (Cloudinary can generate images from video)
    // Actually, if the URL is .../video/upload/..., we can just change the extension to .jpg
    // and Cloudinary will pick the middle frame by default.
    
    // 1. Ensure it's treated as a video source for the image generation
    // Often video URLs are .../video/upload/... 
    // We want to keep it as video/upload but change extension to .jpg
    
    let url = videoUrl;
    
    // Apply optimizations for the poster too
    url = getOptimizedUrl(url, 'image', { width: 600 }); // Reasonable poster size
    
    // Replace extension
    const lastDotIndex = url.lastIndexOf('.');
    if (lastDotIndex !== -1) {
        url = url.substring(0, lastDotIndex) + '.jpg';
    } else {
        url = url + '.jpg';
    }
    
    return url;
};

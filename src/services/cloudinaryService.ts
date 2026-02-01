export class CloudinaryService {
    private readonly CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    private readonly UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    private get apiUrl() {
        return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/upload`;
    }

    /**
     * Upload a file to Cloudinary
     */
    async uploadFile(uri: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
        if (!this.CLOUD_NAME || !this.UPLOAD_PRESET) {
            console.error('❌ Cloudinary config missing:', { name: this.CLOUD_NAME, preset: this.UPLOAD_PRESET });
            throw new Error('Cloudinary configuration missing. Please check your .env file.');
        }

        try {
            const formData = new FormData();

            // Extract filename and extension from URI
            const filename = uri.split('/').pop() || (resourceType === 'video' ? 'upload.m4a' : 'upload.jpg');
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : (resourceType === 'video' ? 'm4a' : 'jpg');

            // Map common extensions to MIME types
            const mimeTypeMap: Record<string, string> = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'heic': 'image/heic',
                'heif': 'image/heif',
                'mov': 'video/quicktime',
                'mp4': 'video/mp4',
                '3gp': 'audio/3gpp', // Changed from video to audio if appropriate
                'm4a': 'audio/mp4',
                'aac': 'audio/aac',
                'wav': 'audio/wav',
            };

            // Determine MIME type
            let mimeType = mimeTypeMap[ext.toLowerCase()];
            if (!mimeType) {
                mimeType = resourceType === 'video' ? 'video/mp4' : 'image/jpeg';
            }

            // In React Native, we need to treat the URI properly
            // Support multiple schemes (file, content, blob, data)
            const uriLower = uri.toLowerCase();
            const hasScheme = uriLower.startsWith('file://') ||
                uriLower.startsWith('content://') ||
                uriLower.startsWith('blob:') ||
                uriLower.startsWith('data:');

            let finalUri = uri;
            // On Android, content:// and file:// are usually fine as is.
            // On iOS, we often need to ensure file:// prefix if it's a local path.
            if (!hasScheme && !uri.startsWith('/')) {
                // Not a path and no scheme? Probably a local filename
            } else if (!hasScheme) {
                finalUri = `file://${uri}`;
            }

            const fileToUpload = {
                uri: finalUri,
                type: mimeType,
                name: filename,
            };

            formData.append('file', fileToUpload as any);
            formData.append('upload_preset', this.UPLOAD_PRESET);
            formData.append('resource_type', resourceType);

            console.log(`📤 Uploading to Cloudinary: ${filename} (${mimeType}) as ${resourceType}`);
            console.log(`🔗 Final URI: ${finalUri}`);
            console.log(`⚙️ Config: Cloud=${this.CLOUD_NAME}, Preset=${this.UPLOAD_PRESET}`);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    // Note: Do NOT set Content-Type: multipart/form-data manually, 
                    // fetch will do it with the correct boundary.
                },
            });

            const data = await response.json();

            if (data.error) {
                console.error('❌ Cloudinary Error Response:', data.error);
                throw new Error(data.error.message || 'Unknown Cloudinary error');
            }

            console.log('✅ Cloudinary Upload Success:', data.secure_url);
            return data.secure_url;
        } catch (error) {
            console.error('❌ Cloudinary Upload Exception:', error);
            throw error;
        }
    }

    /**
     * Optimize Cloudinary URL (Example: auto format and quality)
     */
    getOptimizedUrl(url: string, transformations: string = 'f_auto,q_auto'): string {
        if (!url.includes('cloudinary.com')) return url;

        // Insert transformations after /upload/
        const parts = url.split('/upload/');
        if (parts.length !== 2) return url;

        return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }
}

export const cloudinaryService = new CloudinaryService();

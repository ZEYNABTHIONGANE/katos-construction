export class CloudinaryService {
    private readonly CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    private readonly UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    private get apiUrl() {
        return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/upload`;
    }

    /**
     * Upload a file to Cloudinary with progress support
     */
    async uploadFile(
        uri: string, 
        resourceType: 'image' | 'video' | 'raw' = 'image',
        onProgress?: (progress: number) => void
    ): Promise<string> {
        if (!this.CLOUD_NAME || !this.UPLOAD_PRESET) {
            console.error('❌ Cloudinary config missing:', { name: this.CLOUD_NAME, preset: this.UPLOAD_PRESET });
            throw new Error('Cloudinary configuration missing. Please check your .env file.');
        }

        return new Promise((resolve, reject) => {
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
                    '3gp': 'audio/3gpp',
                    'm4a': 'audio/mp4',
                    'aac': 'audio/aac',
                    'wav': 'audio/wav',
                };

                let mimeType = mimeTypeMap[ext.toLowerCase()];
                if (!mimeType) {
                    mimeType = resourceType === 'video' ? 'video/mp4' : 'image/jpeg';
                }

                const uriLower = uri.toLowerCase();
                const hasScheme = uriLower.startsWith('file://') ||
                    uriLower.startsWith('content://') ||
                    uriLower.startsWith('blob:') ||
                    uriLower.startsWith('data:');

                let finalUri = uri;
                if (!hasScheme && uri.startsWith('/')) {
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

                const xhr = new XMLHttpRequest();
                xhr.open('POST', this.apiUrl);

                if (onProgress) {
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const progress = Math.round((event.loaded / event.total) * 100);
                            onProgress(progress);
                        }
                    };
                }

                xhr.onload = () => {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            if (response.error) {
                                reject(new Error(response.error.message || 'Cloudinary error'));
                            } else {
                                console.log('✅ Cloudinary Upload Success:', response.secure_url);
                                resolve(response.secure_url);
                            }
                        } else {
                            reject(new Error(response.error?.message || `Upload failed with status ${xhr.status}`));
                        }
                    } catch (e) {
                        reject(new Error('Failed to parse Cloudinary response'));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(formData);

            } catch (error) {
                console.error('❌ Cloudinary Upload Exception:', error);
                reject(error);
            }
        });
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

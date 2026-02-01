import { cloudinaryService } from './cloudinaryService';

export class StorageService {
  /**
   * Upload an image file to Cloudinary (previously Firebase)
   */
  async uploadImage(file: Blob, _path: string): Promise<string> {
    // Note: Cloudinary expects a URI or Base64 in some contexts, but here we use the service
    // For simplicity with the existing code, we'll try to use the URI from the blob if available
    // or adapt the calls. Let's provide a bridge.
    console.warn('StorageService.uploadImage is now using Cloudinary. Path parameter is ignored by Cloudinary.');
    return cloudinaryService.uploadFile(URL.createObjectURL(file), 'image');
  }

  /**
   * Upload an image from React Native URI to Cloudinary
   */
  async uploadImageFromUri(uri: string, _path: string): Promise<string> {
    try {
      return cloudinaryService.uploadFile(uri, 'image');
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload a video from React Native URI to Cloudinary
   */
  async uploadVideoFromUri(uri: string, _path: string): Promise<string> {
    try {
      return cloudinaryService.uploadFile(uri, 'video');
    } catch (error) {
      console.error('Error uploading video to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload media (image or video) from React Native URI
   */
  async uploadMediaFromUri(uri: string, _path: string, mediaType: 'image' | 'video'): Promise<string> {
    return cloudinaryService.uploadFile(uri, mediaType);
  }

  /**
   * Upload a project image
   */
  async uploadProjectImage(file: Blob, _projectId: string, _fileName: string): Promise<string> {
    return this.uploadImage(file, '');
  }

  /**
   * Upload a material image
   */
  async uploadMaterialImage(file: Blob, _materialId: string, _fileName: string): Promise<string> {
    return this.uploadImage(file, '');
  }

  /**
   * Upload a user profile image
   */
  async uploadUserImage(file: Blob, _userId: string, _fileName: string): Promise<string> {
    return this.uploadImage(file, '');
  }

  /**
   * Delete an image (stub: Cloudinary deletion requires admin API or token)
   */
  async deleteImage(_url: string): Promise<void> {
    console.warn('Delete image on Cloudinary requires signed API or specific setup. Skipping for now.');
  }

  /**
   * Generate a unique filename with timestamp
   */
  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `${timestamp}.${extension}`;
  }
}

export const storageService = new StorageService();
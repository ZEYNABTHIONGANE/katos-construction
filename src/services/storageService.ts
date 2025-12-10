import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export class StorageService {
  /**
   * Upload an image file to Firebase Storage
   */
  async uploadImage(file: Blob, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  /**
   * Upload an image from React Native URI to Firebase Storage
   */
  async uploadImageFromUri(uri: string, path: string): Promise<string> {
    try {
      // Fetch the image from the URI
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate a unique filename
      const fileName = this.generateFileName('image.jpg');
      const fullPath = `${path}/${fileName}`;

      return this.uploadImage(blob, fullPath);
    } catch (error) {
      console.error('Error uploading image from URI:', error);
      throw error;
    }
  }

  /**
   * Upload a video from React Native URI to Firebase Storage
   */
  async uploadVideoFromUri(uri: string, path: string): Promise<string> {
    try {
      // Fetch the video from the URI
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate a unique filename with video extension
      const fileName = this.generateFileName('video.mp4');
      const fullPath = `${path}/${fileName}`;

      return this.uploadImage(blob, fullPath);
    } catch (error) {
      console.error('Error uploading video from URI:', error);
      throw error;
    }
  }

  /**
   * Upload media (image or video) from React Native URI
   */
  async uploadMediaFromUri(uri: string, path: string, mediaType: 'image' | 'video'): Promise<string> {
    if (mediaType === 'video') {
      return this.uploadVideoFromUri(uri, path);
    } else {
      return this.uploadImageFromUri(uri, path);
    }
  }

  /**
   * Upload a project image
   */
  async uploadProjectImage(file: Blob, projectId: string, fileName: string): Promise<string> {
    const path = `projects/${projectId}/${fileName}`;
    return this.uploadImage(file, path);
  }

  /**
   * Upload a material image
   */
  async uploadMaterialImage(file: Blob, materialId: string, fileName: string): Promise<string> {
    const path = `materials/${materialId}/${fileName}`;
    return this.uploadImage(file, path);
  }

  /**
   * Upload a user profile image
   */
  async uploadUserImage(file: Blob, userId: string, fileName: string): Promise<string> {
    const path = `users/${userId}/${fileName}`;
    return this.uploadImage(file, path);
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(url: string): Promise<void> {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get a reference to a storage path
   */
  getStorageRef(path: string) {
    return ref(storage, path);
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
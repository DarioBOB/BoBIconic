import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class Trips2ImageService {

  constructor(private firestore: Firestore) {}

  /**
   * Convertit une URL d'image en base64
   */
  async urlToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (error) {
          console.error('[Trips2Image] Erreur conversion base64:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.error('[Trips2Image] Erreur chargement image:', imageUrl);
        reject(new Error('Impossible de charger l\'image'));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Sauvegarde une image dans le localStorage
   */
  saveImageToLocalStorage(tripId: string, imageData: string): void {
    try {
      const key = `trip_image_${tripId}`;
      localStorage.setItem(key, imageData);
      console.log(`[Trips2Image] Image sauvegardée localement pour le voyage: ${tripId}`);
    } catch (error) {
      console.error('[Trips2Image] Erreur sauvegarde localStorage:', error);
    }
  }

  /**
   * Récupère une image depuis le localStorage
   */
  getImageFromLocalStorage(tripId: string): string | null {
    try {
      const key = `trip_image_${tripId}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[Trips2Image] Erreur lecture localStorage:', error);
      return null;
    }
  }

  /**
   * Supprime une image du localStorage
   */
  removeImageFromLocalStorage(tripId: string): void {
    try {
      const key = `trip_image_${tripId}`;
      localStorage.removeItem(key);
      console.log(`[Trips2Image] Image supprimée localement pour le voyage: ${tripId}`);
    } catch (error) {
      console.error('[Trips2Image] Erreur suppression localStorage:', error);
    }
  }

  /**
   * Sauvegarde une image dans Firestore
   */
  async saveImageToFirestore(tripId: string, imageData: string): Promise<void> {
    try {
      const imageRef = doc(this.firestore, 'trip_images', tripId);
      await setDoc(imageRef, {
        tripId: tripId,
        imageData: imageData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`[Trips2Image] Image sauvegardée dans Firestore pour le voyage: ${tripId}`);
    } catch (error) {
      console.error('[Trips2Image] Erreur sauvegarde Firestore:', error);
      throw error;
    }
  }

  /**
   * Récupère une image depuis Firestore
   */
  async getImageFromFirestore(tripId: string): Promise<string | null> {
    try {
      const imageRef = doc(this.firestore, 'trip_images', tripId);
      const imageDoc = await getDoc(imageRef);
      
      if (imageDoc.exists()) {
        const data = imageDoc.data();
        console.log(`[Trips2Image] Image récupérée depuis Firestore pour le voyage: ${tripId}`);
        return data['imageData'];
      }
      
      return null;
    } catch (error) {
      console.error('[Trips2Image] Erreur lecture Firestore:', error);
      return null;
    }
  }

  /**
   * Supprime une image de Firestore
   */
  async removeImageFromFirestore(tripId: string): Promise<void> {
    try {
      const imageRef = doc(this.firestore, 'trip_images', tripId);
      await deleteDoc(imageRef);
      console.log(`[Trips2Image] Image supprimée de Firestore pour le voyage: ${tripId}`);
    } catch (error) {
      console.error('[Trips2Image] Erreur suppression Firestore:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde une image à la fois localement et dans Firestore
   */
  async saveImage(tripId: string, imageUrl: string): Promise<void> {
    try {
      console.log(`[Trips2Image] Sauvegarde de l'image pour le voyage: ${tripId}`);
      
      // Convertir l'URL en base64
      const base64Data = await this.urlToBase64(imageUrl);
      
      // Sauvegarder localement
      this.saveImageToLocalStorage(tripId, base64Data);
      
      // Sauvegarder dans Firestore
      await this.saveImageToFirestore(tripId, base64Data);
      
      console.log(`[Trips2Image] Image sauvegardée avec succès pour le voyage: ${tripId}`);
    } catch (error) {
      console.error('[Trips2Image] Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Récupère une image (priorité au localStorage, puis Firestore)
   */
  async getImage(tripId: string): Promise<string | null> {
    try {
      // Essayer d'abord le localStorage
      const localImage = this.getImageFromLocalStorage(tripId);
      if (localImage) {
        console.log(`[Trips2Image] Image récupérée depuis localStorage pour le voyage: ${tripId}`);
        return localImage;
      }
      
      // Sinon essayer Firestore
      const firestoreImage = await this.getImageFromFirestore(tripId);
      if (firestoreImage) {
        // Sauvegarder dans localStorage pour la prochaine fois
        this.saveImageToLocalStorage(tripId, firestoreImage);
        console.log(`[Trips2Image] Image récupérée depuis Firestore et mise en cache pour le voyage: ${tripId}`);
        return firestoreImage;
      }
      
      return null;
    } catch (error) {
      console.error('[Trips2Image] Erreur lors de la récupération:', error);
      return null;
    }
  }

  /**
   * Supprime une image localement et dans Firestore
   */
  async removeImage(tripId: string): Promise<void> {
    try {
      // Supprimer localement
      this.removeImageFromLocalStorage(tripId);
      
      // Supprimer de Firestore
      await this.removeImageFromFirestore(tripId);
      
      console.log(`[Trips2Image] Image supprimée avec succès pour le voyage: ${tripId}`);
    } catch (error) {
      console.error('[Trips2Image] Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Synchronise les images entre localStorage et Firestore
   */
  async syncImages(tripIds: string[]): Promise<void> {
    try {
      console.log('[Trips2Image] Synchronisation des images...');
      
      for (const tripId of tripIds) {
        // Vérifier si l'image existe localement mais pas dans Firestore
        const localImage = this.getImageFromLocalStorage(tripId);
        if (localImage) {
          const firestoreImage = await this.getImageFromFirestore(tripId);
          if (!firestoreImage) {
            // L'image existe localement mais pas dans Firestore, la sauvegarder
            await this.saveImageToFirestore(tripId, localImage);
            console.log(`[Trips2Image] Image synchronisée vers Firestore: ${tripId}`);
          }
        }
      }
      
      console.log('[Trips2Image] Synchronisation terminée');
    } catch (error) {
      console.error('[Trips2Image] Erreur lors de la synchronisation:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une image existe localement
   */
  hasLocalImage(tripId: string): boolean {
    return this.getImageFromLocalStorage(tripId) !== null;
  }

  /**
   * Récupère les statistiques des images
   */
  getImageStats(): { localCount: number; totalSize: number } {
    let localCount = 0;
    let totalSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trip_image_')) {
          localCount++;
          const imageData = localStorage.getItem(key);
          if (imageData) {
            totalSize += imageData.length;
          }
        }
      }
    } catch (error) {
      console.error('[Trips2Image] Erreur calcul statistiques:', error);
    }
    
    return {
      localCount,
      totalSize: Math.round(totalSize / 1024) // Taille en KB
    };
  }

  /**
   * Nettoie les images orphelines du localStorage
   */
  cleanupOrphanedImages(validTripIds: string[]): void {
    try {
      const validKeys = validTripIds.map(id => `trip_image_${id}`);
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trip_image_') && !validKeys.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[Trips2Image] Image orpheline supprimée: ${key}`);
      });
      
      console.log(`[Trips2Image] Nettoyage terminé: ${keysToRemove.length} images supprimées`);
    } catch (error) {
      console.error('[Trips2Image] Erreur nettoyage:', error);
    }
  }
} 
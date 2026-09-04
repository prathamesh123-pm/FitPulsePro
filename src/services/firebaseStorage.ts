import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { app, auth } from "./firebase";

let storage: any = null;
try {
  if (app) {
    storage = getStorage(app);
  }
} catch (err) {
  console.warn("[Firebase Storage] Initialization notice (fallback to inline data URI if storage offline):", err);
}

export type StorageFolder =
  | "profile"
  | "products"
  | "customers"
  | "bills"
  | "reports"
  | "documents"
  | "qr";

/**
 * Compress an image file to reduce bandwidth and storage footprint.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const fallbackDataUrl = reader.result as string;
          resolve({ dataUrl: fallbackDataUrl, blob: file });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl: compressedDataUrl, blob });
            } else {
              resolve({ dataUrl: compressedDataUrl, blob: file });
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an asset (file or base64) to Firebase Storage under the logged-in user's UID.
 * Returns the public download URL to store inside Firestore documents.
 */
export async function uploadAssetToCloudStorage(
  folder: StorageFolder,
  fileOrDataUrl: File | Blob | string,
  customName?: string,
  userId?: string
): Promise<{ url: string; path: string; isFallback: boolean }> {
  const uid = userId || auth?.currentUser?.uid || "user_local";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const cleanName = customName
    ? customName.replace(/[^a-zA-Z0-9._-]/g, "_")
    : `asset_${timestamp}_${randomSuffix}`;
  
  const storagePath = `users/${uid}/${folder}/${cleanName}`;

  // If storage is available, attempt real cloud storage upload
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);

      if (typeof fileOrDataUrl === "string") {
        if (fileOrDataUrl.startsWith("data:")) {
          await uploadString(storageRef, fileOrDataUrl, "data_url");
        } else {
          await uploadString(storageRef, fileOrDataUrl, "raw");
        }
      } else {
        await uploadBytes(storageRef, fileOrDataUrl);
      }

      const downloadURL = await getDownloadURL(storageRef);
      return { url: downloadURL, path: storagePath, isFallback: false };
    } catch (storageError: any) {
      console.warn(
        `[Firebase Storage] Storage upload error on '${storagePath}', falling back to optimized payload:`,
        storageError?.message || storageError
      );
    }
  }

  // Graceful Fallback: Convert to data URL so the user's photos and documents are never lost
  if (typeof fileOrDataUrl === "string") {
    return { url: fileOrDataUrl, path: storagePath, isFallback: true };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string, path: storagePath, isFallback: true });
    };
    reader.onerror = () => {
      resolve({ url: "", path: storagePath, isFallback: true });
    };
    reader.readAsDataURL(fileOrDataUrl);
  });
}

/**
 * Client-Side Image Compression and Optimization Utility
 * Reduces image file size and memory footprint before uploading/storing.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImageBase64(
  base64Str: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.82,
    mimeType = "image/jpeg",
  } = options;

  if (!base64Str || !base64Str.startsWith("data:image")) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL(mimeType, quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

/**
 * Reads a File object and compresses it directly to a base64 string
 */
export async function readFileAndCompress(
  file: File,
  options?: CompressOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (!rawBase64) {
        reject(new Error("Failed to read file"));
        return;
      }
      try {
        const compressed = await compressImageBase64(rawBase64, options);
        resolve(compressed);
      } catch {
        resolve(rawBase64);
      }
    };
    reader.onerror = (err) => reject(err);
  });
}

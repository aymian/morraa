import { Cloudinary } from '@cloudinary/url-gen';

/**
 * Cloudinary Configuration & Utility
 */

export const CLOUDINARY_CONFIG = {
    cloudName: "dapod4lyo",
    apiKey: "381726959164723",
    uploadPreset: "ml_default",
};

// Initialize Cloudinary instance for transformations
export const cld = new Cloudinary({
    cloud: {
        cloudName: CLOUDINARY_CONFIG.cloudName
    }
});

export const uploadToCloudinary = async (
    file: File,
    folder: string = "morraa_posts",
    onProgress?: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        formData.append("cloud_name", CLOUDINARY_CONFIG.cloudName);
        formData.append("folder", folder);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error?.message || "Cloudinary Upload Failed"));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
        xhr.send(formData);
    });
};

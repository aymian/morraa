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

export const uploadToCloudinary = async (file: File, folder: string = "morraa_posts"): Promise<string> => {
    console.log("Starting Cloudinary upload for file:", file.name, "Size:", file.size, "Folder:", folder);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("cloud_name", CLOUDINARY_CONFIG.cloudName);
    formData.append("folder", folder);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Cloudinary Error Response:", data);
            throw new Error(data.error?.message || "Cloudinary Upload Failed with status " + response.status);
        }

        console.log("Cloudinary Upload Success:", data.secure_url);
        return data.secure_url;
    } catch (error: any) {
        console.error("Cloudinary upload catch block:", error);
        throw new Error(error.message || "Network error during Cloudinary upload");
    }
};

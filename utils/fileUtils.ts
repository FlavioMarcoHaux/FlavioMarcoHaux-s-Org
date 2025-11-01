/**
 * Extracts the base64 encoded data from a data URL string.
 * @param dataUrl The data URL (e.g., "data:image/jpeg;base64,iVBORw0KGgo...").
 * @returns The base64 encoded string part.
 */
export const dataUrlToBase64 = (dataUrl: string): string => {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
        console.error('Invalid data URL format.');
        return '';
    }
    return parts[1];
};

/**
 * Reads a File object and returns its base64 representation and mime type.
 * @param file The File object to read.
 * @returns A promise that resolves to an object containing the base64 data and mime type.
 */
export const readFileAsBase64 = (file: File): Promise<{ data: string; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.split(',')[1];
            if (!base64Data) {
                reject(new Error("Could not read file data."));
                return;
            }
            resolve({ data: base64Data, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

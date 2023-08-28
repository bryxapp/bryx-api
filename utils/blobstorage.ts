import { BlobServiceClient } from "@azure/storage-blob";
import * as multipart from "parse-multipart";

export const uploadPdf = (pdf: Uint8Array, estimateName: string) => {
    // Upload the PDF to blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

    const containerName = "pdf-container";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobName = `${estimateName}-${new Date().getTime()}.pdf`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload data to the blob
    blockBlobClient.upload(pdf, pdf.length, { blobHTTPHeaders: { blobContentType: 'application/pdf' } });

    return blockBlobClient.url;
}


export const deletePdf = async (estimatePdfUrl: string) => {
    // Delete the PDF from blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

    const containerName = "pdf-container";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    let blobName = decodeURI(estimatePdfUrl.split("/").pop());
    blobName = blobName.replace(/%20/g, " ");
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete the blob
    await blockBlobClient.delete();
}


export const uploadImage = async (file: multipart.ParsedFile) => {
    const allowedMimeTypes = ["image/png", "image/jpeg"];
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (!allowedMimeTypes.includes(file.type)) {
        throw new Error("Invalid file type");
    }

    if (file.data.length > maxSize) {
        throw new Error("File size too large");
    }

    // Upload the Image to blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient("user-images-container");

    const imageName = `image-${new Date().getTime()}`;
    const { data } = file;
    const blockBlobClient = containerClient.getBlockBlobClient(imageName);

    try {
        const uploadOptions = {
            blobHTTPHeaders: { blobContentType: file.type },
            timeoutInSeconds: 25
        };
        await blockBlobClient.upload(data, data.length, uploadOptions);
        return blockBlobClient.url;
    } catch (error) {
        console.error("Error uploading image to Azure Blob Storage", error);
        throw error;
    }
};



export const deleteImageBlob = async (imageUrl: string) => {
    // Delete the PDF from blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

    const containerClient = blobServiceClient.getContainerClient("user-images-container");

    let blobName = decodeURI(imageUrl.split("/").pop());
    blobName = blobName.replace(/%20/g, " ");
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete the blob
    await blockBlobClient.delete();
}

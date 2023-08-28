import { BlobServiceClient } from "@azure/storage-blob";

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

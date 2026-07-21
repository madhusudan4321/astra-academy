import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol,
} from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClient) return blobServiceClient;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }

  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient;
}

export async function uploadToAzure(
  containerName: string,
  blobName: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blobName;
}

export async function generateSasUrl(
  containerName: string,
  blobName: string,
  durationMinutes = 10
): Promise<string> {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName || !accountKey) {
    throw new Error('Azure storage credentials are not configured');
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  const expiresOn = new Date();
  expiresOn.setMinutes(expiresOn.getMinutes() + durationMinutes);

  const sasParams = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
      protocol: SASProtocol.Https,
    },
    sharedKeyCredential
  );

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasParams.toString()}`;
}

export async function deleteFromAzure(
  containerName: string,
  blobName: string
): Promise<void> {
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

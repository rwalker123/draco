using Microsoft.WindowsAzure;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using System;
using System.Text;
using System.Threading.Tasks;

namespace SportsManager.Models.Utils
{
    public class AzureStorageUtils
    {
        static public async Task<string> SaveToCloudBlob(string localFileName, string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            String fileName = String.Empty;
            CloudBlobDirectory cloudDirectory = GetFileAndCloudDirectory(container, storageUri, ref fileName);

            // no directory, store in root.
            var blockBlob = cloudDirectory.GetBlockBlobReference(fileName);

            // Create or overwrite the "myblob" blob with contents from a local file.
            using (var fileStream = System.IO.File.OpenRead(localFileName))
            {
                await blockBlob.UploadFromStreamAsync(fileStream);
            }

            System.IO.File.Delete(localFileName);
            return blockBlob.Uri.ToString();
        }

        static public async Task<bool> RemoveCloudDirectory(string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            String fileName = null;
            CloudBlobDirectory dir = GetFileAndCloudDirectory(container, storageUri, ref fileName);

            var blobs = dir.ListBlobs(true);

            foreach(var blob in blobs)
            {
                await ((CloudBlockBlob)blob).DeleteAsync();
            }

            return true;
        }

        static public async Task<bool> RemoveCloudFile(string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            CloudBlockBlob fileBlob = container.GetBlockBlobReference(storageUri);
            if (await fileBlob.ExistsAsync())
                await fileBlob.DeleteAsync();

            return true;
        }

        static private async Task<CloudBlobContainer> GetUploadsContainer()
        {
            // Retrieve storage account from connection string.
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(
                CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create the blob client.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // Retrieve a reference to a container. 
            var container = blobClient.GetContainerReference("uploads");


            // Create the container if it doesn't already exist.
            bool containerExists = await container.ExistsAsync();
            if (!containerExists)
            {
                await container.CreateIfNotExistsAsync();
                await container.SetPermissionsAsync(
                    new BlobContainerPermissions
                    {
                        PublicAccess =
                        BlobContainerPublicAccessType.Blob
                    });
            }

            return container;
        }

        static CloudBlobDirectory GetFileAndCloudDirectory(CloudBlobContainer container, string storageUri, ref String fileName)
        {
            StringBuilder relativePath = new StringBuilder();
            bool startAppending = false;

            char cloudFileSep = '/';

            var dirs = storageUri.Split(new char[] { cloudFileSep }, StringSplitOptions.RemoveEmptyEntries);
            var numDirs = dirs.Length;

            // last entry is the filename
            if (fileName != null)
            {
                fileName = dirs[dirs.Length - 1];
                --numDirs;
            }

            for (int i = 0; i < numDirs; ++i)
            {
                var dir = dirs[i];
                if (startAppending)
                {
                    relativePath.Append(dir);
                    relativePath.Append(cloudFileSep);
                }

                if (dir.Equals("uploads", StringComparison.InvariantCultureIgnoreCase))
                    startAppending = true;
            }

            return container.GetDirectoryReference(relativePath.ToString().TrimEnd(new char[] { cloudFileSep }));
        }
    }
}
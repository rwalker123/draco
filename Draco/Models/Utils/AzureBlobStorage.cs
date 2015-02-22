using System;
using System.Configuration;
using System.IO;
using System.Threading.Tasks;
using System.Web;
using Microsoft.WindowsAzure;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using System.Text;

namespace SportsManager.Models.Utils
{

    public class AzureBlobStorage : IStorage
    {
        const String UploadsContainer = "uploads";

        public String RootPath
        {
            get
            {
                // Retrieve storage account from connection string.
                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(
                    CloudConfigurationManager.GetSetting("StorageConnectionString"));

                // Create the blob client.
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

                // Retrieve a reference to a container. 
                CloudBlobContainer container = blobClient.GetContainerReference(UploadsContainer);
                String uploadDirRoot = container.Uri.ToString();
                uploadDirRoot += "/";

                return uploadDirRoot;
            }
        }

        public String GetUrl(string storageUri)
        {
            return storageUri;
        }

        public bool Exists(string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = GetUploadsContainer().Result;

            CloudBlockBlob fileBlob = container.GetBlockBlobReference(GetBlobNameFromUri(storageUri));
            return fileBlob.Exists();
        }

        public async System.Threading.Tasks.Task<String> Save(MemoryStream ms, string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            String fileName = String.Empty;
            CloudBlobDirectory cloudDirectory = GetFileAndCloudDirectory(container, storageUri, ref fileName);

            // no directory, store in root.
            var blockBlob = cloudDirectory.GetBlockBlobReference(fileName);

            // Create or overwrite the "myblob" blob with contents from a local file.
            try
            {
                await blockBlob.UploadFromStreamAsync(ms);
                ms.Close();
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return blockBlob.Uri.ToString();
        }

        public async System.Threading.Tasks.Task<String> Save(string localFileName, string storageUri)
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

        public async System.Threading.Tasks.Task<bool> DeleteDirectory(string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            String fileName = null;
            CloudBlobDirectory dir = GetFileAndCloudDirectory(container, storageUri, ref fileName);

            var blobs = dir.ListBlobs(true);

            foreach (var blob in blobs)
            {
                await ((CloudBlockBlob)blob).DeleteAsync();
            }

            return true;
        }

        public async System.Threading.Tasks.Task<bool> DeleteFile(string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            CloudBlockBlob fileBlob = container.GetBlockBlobReference(GetBlobNameFromUri(storageUri));
            if (await fileBlob.ExistsAsync())
                await fileBlob.DeleteAsync();

            return true;
        }

        public async System.Threading.Tasks.Task<System.IO.Stream> GetFileAsText(string storageUri)
        {
            // Retrieve a reference to a container. 
            CloudBlobContainer container = await GetUploadsContainer();

            String blobName = GetBlobNameFromUri(storageUri);
            CloudBlockBlob fileBlob = container.GetBlockBlobReference(blobName);
            if (await fileBlob.ExistsAsync())
            {
                var stream = new MemoryStream();
                await fileBlob.DownloadToStreamAsync(stream);
                stream.Position = 0;

                return stream;
            }

            return null;
        }

        static String GetBlobNameFromUri(String uri)
        {
            int uploadsIndex = uri.IndexOf(UploadsContainer);
            if (uploadsIndex >= 0)
            {
                int startIndex = uploadsIndex + UploadsContainer.Length + 1;
                return uri.Substring(startIndex);
            }

            return String.Empty;
        }

        static async Task<CloudBlobContainer> GetUploadsContainer()
        {
            // Retrieve storage account from connection string.
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(
                CloudConfigurationManager.GetSetting("StorageConnectionString"));

            // Create the blob client.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // Retrieve a reference to a container. 
            var container = blobClient.GetContainerReference(UploadsContainer);


            // Create the container if it doesn't already exist.
            bool containerExists = container.Exists();
            //bool containerExists = await container.ExistsAsync();
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

                if (dir.Equals(UploadsContainer, StringComparison.InvariantCultureIgnoreCase))
                    startAppending = true;
            }

            return container.GetDirectoryReference(relativePath.ToString().TrimEnd(new char[] { cloudFileSep }));
        }
    }
}
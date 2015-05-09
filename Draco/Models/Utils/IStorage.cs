using System;
using System.Configuration;
using System.IO;
using System.Threading.Tasks;

namespace SportsManager.Models.Utils
{
    public static class Storage
    {
        static Storage()
        {
            String storageProvider = ConfigurationManager.AppSettings["StorageProvider"];
            if (storageProvider == null || String.IsNullOrEmpty(storageProvider) || storageProvider.Equals("FileSystem"))
                Provider = new FileSystemStorage();
            else if (storageProvider.Equals("AzureBlob"))
                Provider = new AzureBlobStorage();
        }

        public static IStorage Provider
        {
            get;
            private set;
        }
    }

    public interface IStorage
    {
        String RootPath { get; }
        Task<String> Save(string localFileName, string storageUri);
        Task<String> Save(MemoryStream ms, string storageUri);
        Task<bool> DeleteDirectory(string storageUri);
        Task<bool> DeleteFile(string storageUri);
        Task<Stream> GetFileAsText(string storageUri);
        String GetUrl(string storageUri);
        bool Exists(string storageUri);
    }
}
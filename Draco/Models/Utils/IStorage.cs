using System;
using System.IO;
using System.Threading.Tasks;

namespace SportsManager.Models.Utils
{
    public static class Storage
    {
        static Storage()
        {
            Provider = new FileSystemStorage();
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
        Task<bool> DeleteDirectory(string storageUri);
        Task<bool> DeleteFile(string storageUri);
        Task<Stream> GetFileAsText(string storageUri);
        String GetUrl(string storageUri);
    }
}
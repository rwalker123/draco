using System;
using System.Configuration;
using System.IO;
using System.Threading.Tasks;
using System.Web;

namespace SportsManager.Models.Utils
{
    public class FileSystemStorage : IStorage
    {
        public String RootPath
        {
            get
            {
                return ConfigurationManager.AppSettings["UploadDir"]; 
            }
        }

        public async System.Threading.Tasks.Task<String> Save(string localFileName, string storageUri)
        {
            String localPath = GetLocalPath(storageUri);
            if (File.Exists(localFileName))
            {
                await Task.Run(() => 
                {
                    FileInfo fi = new FileInfo(localPath);
                    String dir = fi.DirectoryName;
                    if (!Directory.Exists(dir))
                        Directory.CreateDirectory(dir);

                    File.Copy(localFileName, localPath, true); 
                });
                return storageUri;
            }

            return String.Empty;
        }

        public async System.Threading.Tasks.Task<bool> DeleteDirectory(string storageUri)
        {
            String localPath = GetLocalPath(storageUri);
            if (!Directory.Exists(localPath))
            {
                if (File.Exists(localPath))
                {
                    FileInfo fi = new FileInfo(localPath);
                    localPath = fi.DirectoryName;
                }
            }
            if (Directory.Exists(localPath))
            {
                await Task.Run(() => { Directory.Delete(localPath, true); });
                return true;
            }

            return false;
        }

        public async System.Threading.Tasks.Task<bool> DeleteFile(string storageUri)
        {
            String localPath = GetLocalPath(storageUri);
            if (File.Exists(localPath))
            {
                await Task.Run(() => { File.Delete(localPath); });
                return true;
            }

            return false;
        }

        public async System.Threading.Tasks.Task<System.IO.Stream> GetFileAsText(string storageUri)
        {
            String localPath = GetLocalPath(storageUri);
            if (!File.Exists(localPath))
                return null;

            MemoryStream memoryStream = new MemoryStream();
            using (Stream input = File.OpenRead(localPath))
            {
                await input.CopyToAsync(memoryStream);
            }
            memoryStream.Position = 0;

            return memoryStream;
        }

        private String GetLocalPath(string storageUri)
        {
            return HttpContext.Current.Server.MapPath(storageUri);
        }
    }
}
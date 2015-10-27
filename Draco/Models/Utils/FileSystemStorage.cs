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

        public String GetUrl(string storageUri)
        {
            var url = HttpContext.Current.Server.MapUrl(storageUri);
            if (url.StartsWith("http://"))
                return url;

            if (url.StartsWith("http:"))
                url = url.Replace("http:", "http://");

            return url;
        }

        public bool Exists(string storageUri)
        {
            String localPath = GetLocalPath(storageUri);
            return File.Exists(localPath);
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
                return HttpContext.Current.Server.MapUrl(localPath);
            }

            return String.Empty;
        }

        public async System.Threading.Tasks.Task<String> Save(MemoryStream ms, string storageUri)
        {
            String localPath = GetLocalPath(storageUri);
            await Task.Run(() =>
            {
                FileInfo fi = new FileInfo(localPath);
                String dir = fi.DirectoryName;
                if (!Directory.Exists(dir))
                    Directory.CreateDirectory(dir);

                using (FileStream fs = new FileStream(fi.FullName, FileMode.Create))
                {
                    try
                    {
                        ms.WriteTo(fs);
                        ms.Close();
                    }
                    catch(Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                }
            });
            return HttpContext.Current.Server.MapUrl(localPath);
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

        public String GetLocalPath(string storageUri)
        {
            if (!storageUri.StartsWith("~/"))
            {
                Uri uri = new Uri(storageUri);
                int index = uri.AbsoluteUri.IndexOf(uri.AbsolutePath);
                if (index != 0)
                {
                    string serverPath = uri.AbsoluteUri.Substring(0, index + 1);
                    string physicalRoot = storageUri.Replace(serverPath, "~/");
                    string virtualPath = System.Web.VirtualPathUtility.ToAbsolute("~/").TrimEnd(new char[] { '/' });
                    if (!String.IsNullOrEmpty(virtualPath))
                        physicalRoot = physicalRoot.Replace(virtualPath, String.Empty);

                    return HttpContext.Current.Server.MapPath(physicalRoot);
                }
            }

            return HttpContext.Current.Server.MapPath(storageUri);
        }
    }
}
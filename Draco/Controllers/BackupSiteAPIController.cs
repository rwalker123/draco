using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class BackupSiteAPIController : ApiController
    {
        // API Key
        String apiKey = "el5RRxCKL9XhR9y4UuhnAaxV8IcrZfs02jvhS7vFvhyloChIMYr0ew0qJELCIr50";
        // Sandbox Key
        //const string apiKey = "FtA4Ak6rn8KeR07hb0vbcXrxJPKgffAFxPx54icmAsbTQzOKJk7oOBioeAtt1fgu";

        // Web Service URL
        const String webServiceUrl = "https://api.discountasp.net/1.0/customerapi.asmx/Sql2012CreateBackup";

        const String databaseName = "SQL2012_152800_ezrecsports";

        const String ftpUri = "ftp://ftp.walkerhome.org";

        const String ftpUsername = "0022194|walkerhomeo";
        const String ftpPassword = "xV47yaQ8";

        const String backupFileName = "SQL2012_152800_ezrecsports_backup.bak";
        const String backupDir = "/uploads/dbbackup";
        const String backupFullName = "/_database/" + backupFileName;

        //[SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("GET"), HttpGet]
        public async Task<HttpResponseMessage> BackupSite()
        {

            // delete any previous _database backup
            DeleteFile(backupFullName);

            // backup db into uploads/dbbackup directory.
            HttpClient backupRequest = new HttpClient();
            backupRequest.BaseAddress = new Uri(webServiceUrl);

            String urlParams = String.Format("?key={0}&databaseName={1}", apiKey, databaseName);
            HttpResponseMessage response = await backupRequest.GetAsync(urlParams);
            if (response.IsSuccessStatusCode)
            {
                // move backup file to uploads.
                String newDirName = DateTime.Now.ToString("yyyy-MM-dd");

                CreateDir(newDirName);

                String uploadsBackupFile = backupDir + "/" + newDirName + "/" + backupFileName;
                MoveFile(backupFullName, uploadsBackupFile);

                await RemoveOldBackups();
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        private void MoveFile(String oldName, String newName)
        {
            FtpWebRequest ftpRenReq = (FtpWebRequest)FtpWebRequest.Create(ftpUri + oldName);
            ftpRenReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpRenReq.Method = WebRequestMethods.Ftp.Rename;
            ftpRenReq.RenameTo = newName;
            using (FtpWebResponse ftpRenResponse = (FtpWebResponse)ftpRenReq.GetResponse())
            {
                //Console.WriteLine("Rename status: {0}", ftpRenResponse.StatusDescription);
            }
        }

        private async Task<bool> RemoveOldBackups()
        {
            // delete backups older than 5 days.
            Uri ftpBackupDir = new Uri(ftpUri + backupDir);
            FtpWebRequest ftpReq = (FtpWebRequest)FtpWebRequest.Create(ftpBackupDir);

            ftpReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpReq.Method = WebRequestMethods.Ftp.ListDirectory;

            using (FtpWebResponse ftpListResponse = (FtpWebResponse)ftpReq.GetResponse())
            {
                // go back 5 days.
                var deleteOlderThan = DateTime.Now.Subtract(new TimeSpan(5, 0, 0, 0));

                //Console.WriteLine("List status: {0}", ftpListResponse.StatusDescription);
                var responseStream = ftpListResponse.GetResponseStream();
                using (var readStream = new StreamReader(responseStream, System.Text.Encoding.UTF8))
                {
                    // Display the data received from the server.
                    String dirs = await readStream.ReadToEndAsync();

                    string[] alldirs = dirs.Split(new char[] { '\n' });
                    foreach(var dir in alldirs)
                    {
                        if (String.IsNullOrEmpty(dir))
                            continue;

                        var folderDate = dir.TrimEnd(new char[] { '\r' });
                        //Console.WriteLine(folderDate);

                        DateTime dateCreated;
                        if (DateTime.TryParse(folderDate, out dateCreated))
                        {
                            // only delete if older than 5 days.
                            if (dateCreated < deleteOlderThan)
                                await DeleteFolder(ftpBackupDir.ToString() + "/" + folderDate);
                        }
                    }
                }
            }

            return true;
        }

        private void CreateDir(String dirName)
        {
            Uri backupFile = new Uri(ftpUri + backupDir + "/" + dirName);
            FtpWebRequest ftpReq = (FtpWebRequest)FtpWebRequest.Create(backupFile);
            ftpReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpReq.Method = WebRequestMethods.Ftp.MakeDirectory;
            using (FtpWebResponse ftpDeleteResponse = (FtpWebResponse)ftpReq.GetResponse())
            {
                //Console.WriteLine("Delete status: {0}", ftpDeleteResponse.StatusDescription);
            }
        }

        private async Task<bool> DeleteFilesInFolder(String folderPath)
        {
            Uri ftpBackupDir = new Uri(folderPath);
            FtpWebRequest ftpReq = (FtpWebRequest)FtpWebRequest.Create(ftpBackupDir);

            ftpReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpReq.Method = WebRequestMethods.Ftp.ListDirectory;

            using (FtpWebResponse ftpListResponse = (FtpWebResponse)ftpReq.GetResponse())
            {
                var responseStream = ftpListResponse.GetResponseStream();
                using (var readStream = new StreamReader(responseStream, System.Text.Encoding.UTF8))
                {
                    // Display the data received from the server.
                    String files = await readStream.ReadToEndAsync();

                    string[] allFiles = files.Split(new char[] { '\n' });
                    foreach (var file in allFiles)
                    {
                        if (String.IsNullOrEmpty(file))
                            continue;

                        DeleteFile((folderPath + "/" + file.TrimEnd(new char[] { '\r' })).Substring(ftpUri.Length + 1));
                    }
                }
            }

            return true;
        }

        private async Task<bool> DeleteFolder(String folderPath)
        {
            //Check files inside 
            await DeleteFilesInFolder(folderPath);

            Uri dir = new Uri(folderPath);
            FtpWebRequest ftpReq = (FtpWebRequest)FtpWebRequest.Create(dir);
            ftpReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpReq.Method = WebRequestMethods.Ftp.RemoveDirectory;
            try
            {
                using (FtpWebResponse ftpDeleteResponse = (FtpWebResponse)ftpReq.GetResponse())
                {
                    //Console.WriteLine("Delete status: {0}", ftpDeleteResponse.StatusDescription);
                }
            }
            catch (WebException ex)
            {
                FtpWebResponse response = (FtpWebResponse)ex.Response;
                // ok if file doesn't exist.
                if (response.StatusCode != FtpStatusCode.ActionNotTakenFileUnavailable)
                    throw ex;
            }

            return true;
        }

        private void DeleteFile(String fileName)
        {
            Uri backupFile = new Uri(ftpUri + "/" + fileName);
            FtpWebRequest ftpReq = (FtpWebRequest)FtpWebRequest.Create(backupFile);
            ftpReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpReq.Method = WebRequestMethods.Ftp.DeleteFile;
            try
            {
                using (FtpWebResponse ftpDeleteResponse = (FtpWebResponse)ftpReq.GetResponse())
                {
                    //Console.WriteLine("Delete status: {0}", ftpDeleteResponse.StatusDescription);
                }
            }
            catch (WebException ex)
            {
                FtpWebResponse response = (FtpWebResponse)ex.Response;
                // ok if file doesn't exist.
                if (response.StatusCode != FtpStatusCode.ActionNotTakenFileUnavailable)
                    throw ex;
            }
        }
    }
}

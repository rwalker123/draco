using System;
using System.Collections.Generic;
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
        //String apiKey = "el5RRxCKL9XhR9y4UuhnAaxV8IcrZfs02jvhS7vFvhyloChIMYr0ew0qJELCIr50";
        // Sandbox Key
        const string apiKey = "FtA4Ak6rn8KeR07hb0vbcXrxJPKgffAFxPx54icmAsbTQzOKJk7oOBioeAtt1fgu";

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

        private void CreateDir(String dirName)
        {
            Uri backupFile = new Uri(ftpUri + "/" + backupDir + "/" + dirName);
            FtpWebRequest ftpReq = (FtpWebRequest)FtpWebRequest.Create(backupFile);
            ftpReq.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
            ftpReq.Method = WebRequestMethods.Ftp.MakeDirectory;
            using (FtpWebResponse ftpDeleteResponse = (FtpWebResponse)ftpReq.GetResponse())
            {
                //Console.WriteLine("Delete status: {0}", ftpDeleteResponse.StatusDescription);
            }
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

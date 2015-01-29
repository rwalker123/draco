using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
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

        //[SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("backup")]
        public async Task<HttpResponseMessage> BackupSite()
        {
            Task<bool> dbResult = BackupDatabase();
            Task<bool> uploadsResult = BackupUploads();
            bool result = await dbResult && await uploadsResult;

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        private async Task<bool> BackupUploads()
        {
            var basePath = HttpContext.Current.Server.MapPath("~/Uploads");
            if (!Directory.Exists(basePath))
                return false;

            var baseBackupsDir = basePath + "\\backups";
            
            if (!Directory.Exists(baseBackupsDir))
            {
                Directory.CreateDirectory(baseBackupsDir);
            }

            var backupdate = DateTime.Now.ToString("yyyy-MM-dd");
            var backupDir = baseBackupsDir + "\\" + backupdate;

            if (!Directory.Exists(backupDir))
            {
                Directory.CreateDirectory(backupDir);
            }
            else
            {
                return false; // backup only once a day.
            }

            Task t1 = Task.Run(() =>
            {
                var dirPath = basePath + "\\Contacts";
                var zipFile = backupDir + "\\Contacts.zip";
                System.IO.Compression.ZipFile.CreateFromDirectory(dirPath, zipFile);
            }
            );

            Task t2 = Task.Run(() =>
            {
                var dirPath = basePath + "\\Teams";
                var zipFile = backupDir + "\\Teams.zip";
                System.IO.Compression.ZipFile.CreateFromDirectory(dirPath, zipFile);
            });

            Task t3 = Task.Run(() =>
            {
                var dirPath = basePath + "\\Accounts";
                var zipFile = backupDir + "\\Accounts.zip";
                System.IO.Compression.ZipFile.CreateFromDirectory(dirPath, zipFile);
            });

            await t1;
            await t2;
            await t3;

            RemoveOldBackups(baseBackupsDir);

            return true;
        }

        private async Task<bool> BackupDatabase()
        {
            String databaseName = "SQL2012_152800_ezrecsports";

            String backupFileName = "SQL2012_152800_ezrecsports_backup.bak";
            String backupDir = HttpContext.Current.Server.MapPath("~/uploads/dbbackup");
            String backupFullName = HttpContext.Current.Server.MapPath("~/_database/" + backupFileName);

            // delete any previous _database backup
            if (File.Exists(backupFullName))
                File.Delete(backupFullName);

            // backup db into uploads/dbbackup directory.
            HttpClient backupRequest = new HttpClient();
            backupRequest.BaseAddress = new Uri(webServiceUrl);

            String urlParams = String.Format("?key={0}&databaseName={1}", apiKey, databaseName);
            HttpResponseMessage response = await backupRequest.GetAsync(urlParams);
            if (response.IsSuccessStatusCode)
            {
                // move backup file to uploads.
                String newDirName = backupDir + "\\" + DateTime.Now.ToString("yyyy-MM-dd");

                if (!Directory.Exists(newDirName))
                    Directory.CreateDirectory(newDirName);

                if (File.Exists(backupFullName))
                    File.Move(backupFullName, newDirName + "\\" + backupFileName);

                RemoveOldBackups(backupDir);
            }

            return true;
        }

        private bool RemoveOldBackups(string backupDir)
        {
            if (!Directory.Exists(backupDir))
                return true;

            // go back 5 days.
            var deleteOlderThan = DateTime.Now.Subtract(new TimeSpan(5, 0, 0, 0));

            // delete backups older than 5 days.
            string[] alldirs = Directory.GetDirectories(backupDir);

            foreach(var dir in alldirs)
            {
                if (String.IsNullOrEmpty(dir))
                    continue;

                DateTime dateCreated;
                DirectoryInfo di = new DirectoryInfo(dir);
                if (DateTime.TryParse(di.Name, out dateCreated))
                {
                    // only delete if older than 5 days.
                    if (dateCreated < deleteOlderThan)
                    {
                        Directory.Delete(dir, true);
                    }
                }
            }

            return true;
        }
    }
}

using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Web.SessionState;
using System.Collections.Generic;
using System.Web;
using System.Net;
using System.IO;
using System.Text;

using ICSharpCode.SharpZipLib.Zip;

namespace DataAccess
{
/// <summary>
/// Summary description for Leagues
/// </summary>
	static public class VideoAccounts
	{
        static string serviceRoot = "https://silverlight.services.live.com/";

        static private VideoAccount CreateVideoAccount(SqlDataReader dr)
		{
			return new VideoAccount(dr.GetInt64(0), dr.GetInt64(1), dr.GetString(2), dr.GetString(3), dr.GetString(4));
		}

        static public VideoAccount GetVideoAccount(long id)
        {
            VideoAccount va = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetVideoAccount", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        va = CreateVideoAccount(dr);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return va;
        }


		static public List<VideoAccount> GetVideoAccounts(long accountId)
		{
			List<VideoAccount> vas = new List<VideoAccount>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetVideoAccounts", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while ( dr.Read() ) 
					{
						vas.Add( CreateVideoAccount(dr) );
					}
				}
			} 
			catch(SqlException ex) 
			{
				Globals.LogException(ex);
			}
		
			return vas;
		}

        static public List<VideoAccount> GetAllAccountVideos(long accountId)
        {
            if (accountId == 0)
                return null;

            List<VideoAccount> vas = GetVideoAccounts(accountId);

            foreach (VideoAccount va in vas)
            {
                DataSet ds = GetVideos(va);

                if (ds.Tables.Count > 0)
                {
                    foreach (DataRow dr in ds.Tables[0].Rows)
                    {
                        va.Videos.Add(dr.ItemArray[0].ToString());
                    }
                }
            }

            return vas;
        }

		static public bool ModifyVideoAccount(VideoAccount va)
		{
			int rowCount = 0;
			
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.ModifyVideoAccount", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = va.Id;
					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = va.Name;
                    myCommand.Parameters.Add("@vaId", SqlDbType.VarChar, 20).Value = va.VideoAccountId;
                    myCommand.Parameters.Add("@vaKey", SqlDbType.VarChar, 50).Value = va.VideoAccountKey;
                    myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			} 
			catch (SqlException ex) 
			{
				Globals.LogException(ex);
				rowCount = 0;
			}
		
			return (rowCount <= 0) ? false : true;
		}

		static public bool AddVideoAccount(VideoAccount va)
		{
			int rowCount = 0;

            if (va.AccountId <= 0)
                return false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateVideoAccount", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = va.AccountId;
                    myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = va.Name;
                    myCommand.Parameters.Add("@vaId", SqlDbType.VarChar, 20).Value = va.VideoAccountId;
                    myCommand.Parameters.Add("@vaKey", SqlDbType.VarChar, 50).Value = va.VideoAccountKey;
                    myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}			
			} 
			catch (SqlException ex) 
			{
				Globals.LogException(ex);
				rowCount = 0;
			}
		
			return (rowCount <= 0) ? false : true;
		}

		static public bool RemoveVideoAccount(VideoAccount va)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteVideoAccount", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = va.Id;
					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();            
				}
			}
			catch (SqlException ex) 
			{
				Globals.LogException(ex);
				rowCount = 0;
			}
		
			return (rowCount <= 0) ? false : true;
		}

        private static HttpWebRequest GetAuth(VideoAccount va, string fileSetName, string fileName)
        {
            // Authentication code
            HttpWebRequest req = null;

            if (String.IsNullOrEmpty(fileName))
                req = (HttpWebRequest)HttpWebRequest.Create(serviceRoot + va.VideoAccountId + "/" + fileSetName);
            else
                req = (HttpWebRequest)HttpWebRequest.Create(serviceRoot + va.VideoAccountId + "/" + fileSetName + "/" + fileName);

            req.Credentials = new NetworkCredential(va.VideoAccountId, va.VideoAccountKey);

            return req;
        }

        public static DataSet GetVideos(VideoAccount va)
        {
            if (va.Id == 0)
                return null;

            // accountId = Silverlight Streaming Account ID
            HttpWebRequest req = GetAuth(va, String.Empty, String.Empty);

            try
            {
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    Stream strm = resp.GetResponseStream();

                    StreamReader rdr = new StreamReader(strm);

                    // Create a dataset to bind to the control.     
                    DataSet ds = new DataSet();
                    ds.ReadXml(rdr);
                    return ds;
                }
            }
            catch
            {
                return null;
            }
        }

        public static string DeleteVideo(VideoAccount va, string videoName)
        {
            string statusCode = String.Empty;

            // accountId = Silverlight Streaming Account ID
            HttpWebRequest req = GetAuth(va, videoName, string.Empty);
            req.Method = "DELETE";

            // Handle the response.
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
            {
                Stream strm = resp.GetResponseStream();

                StreamReader rdr = new StreamReader(strm);
                string xmlResponse = rdr.ReadToEnd();
                statusCode = (xmlResponse + "Status code: " + resp.StatusCode.ToString());
            }

            return statusCode;
        }

        public static string PostVideo(VideoAccount va, string videoFilePath, string applicationName)
        {
            string statusCode = string.Empty;

            // build zip package
            //
            string packageDir = System.Web.HttpContext.Current.Server.MapPath("~/SilverlightLivePackage");

            string tempZipFile = CreateTempSilverlightFile(".zip");

            using (FileStream fileStream = new FileStream(tempZipFile, FileMode.Create))
            {
                using (ZipOutputStream zipStream = new ZipOutputStream(fileStream))
                {
                    string[] filesTemp = Directory.GetFiles(packageDir);
                    List<string> files = new List<string>();

                    files.AddRange(filesTemp);
                    files.Add(videoFilePath);

                    foreach (string file in files)
                    {
                        string fileName = Path.GetFileName(file);
                        ZipEntry ze = new ZipEntry(fileName);
                        ze.CompressionMethod = CompressionMethod.Deflated;
                        zipStream.PutNextEntry(ze);

                        try
                        {
                            using (System.IO.FileStream fs = System.IO.File.OpenRead(file))
                            {
                                if (String.Compare(fileName, "StartPlayer.js", true) == 0)
                                {
                                    using (StreamReader sr = new StreamReader(fs))
                                    {
                                        string str = sr.ReadToEnd();

                                        str = str.Replace("{0}", Path.GetFileName(videoFilePath));

                                        zipStream.Write(Encoding.ASCII.GetBytes(str), 0, str.Length);
                                    }
                                }
                                else
                                {
                                    byte[] buffer = new byte[8192];
                                    int buffercount;
                                    while ((buffercount = fs.Read(buffer, 0, buffer.Length)) > 0)
                                        zipStream.Write(buffer, 0, buffercount);
                                }
                            }
                        }
                        finally
                        {
                            zipStream.CloseEntry();
                        }
                    }
                }
            }

            if (!System.IO.File.Exists(tempZipFile))
                return statusCode;

            byte[] data = null;

            // Create a binary reader for the filestream.
            using (FileStream zipFileStream = new FileStream(tempZipFile, FileMode.Open))
            {
                using (BinaryReader br = new BinaryReader(zipFileStream))
                {
                    // convert the file to a byte array
                    data = br.ReadBytes((int)zipFileStream.Length);
                }
            }

            File.Delete(tempZipFile);

            if (data != null)
            {
                // Get the web request object.
                HttpWebRequest req = GetAuth(va, applicationName, String.Empty);
                req.Method = WebRequestMethods.Http.Post;
                req.ContentType = "application/zip";

                try
                {
                    // Set the length for the request.
                    req.ContentLength = data.Length;

                    // Get the request stream and write the post data in.
                    using (Stream requestStream = req.GetRequestStream())
                    {
                        requestStream.Write(data, 0, data.Length);
                    }

                    // Handle the response.
                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                    {
                        statusCode = "Status code: " + resp.StatusCode;
                    }
                }
                catch (WebException ex)
                {
                    statusCode = ex.Message + " Ensure that the file you are uploading does not already exist.";
                }
                catch (System.ArgumentException argEx)
                {
                    statusCode = argEx.Message + " Verify the validity of the path to the .zip archive, and the file set name string.";
                }
            }

            return statusCode;
        }

        public static string CreateTempSilverlightFile(string ext)
        {
            string tempZipFile = System.Web.HttpContext.Current.Server.MapPath("~/TempSilverlightZips");

            if (!Directory.Exists(tempZipFile))
            {
                Directory.CreateDirectory(tempZipFile);
            }

            tempZipFile += "\\" + Guid.NewGuid().ToString() + ext;

            return tempZipFile;
        }

        public static VideoAccount GetVideoOfDay(long accountId, out string videoName)
        {
            VideoAccount va = new VideoAccount();
            videoName = String.Empty;

            List<VideoAccount> vas = GetVideoAccounts(accountId);

            if (vas.Count > 0)
            {
                va = vas[0];
                DataSet ds = GetVideos(va);
                if (ds != null && ds.Tables.Count > 0)
                {
                    videoName = ds.Tables[0].Rows[0].ItemArray[0].ToString();
                }
            }

            return va;
        }


    }
}

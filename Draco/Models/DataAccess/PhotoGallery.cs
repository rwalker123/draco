using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Web.Security;

namespace DataAccess
{
	/// <summary>
	/// Summary description for PhotoGallery
	/// </summary>
	static public class PhotoGallery
	{
		private static PhotoGalleryItem CreatePhotoGalleryItem(SqlDataReader dr)
		{
			return new PhotoGalleryItem(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetInt64(1), dr.GetInt64(4));

		}

		public static List<PhotoGalleryAlbum> GetEditablePhotoAlbums(long accountId)
		{
			if (!Roles.IsUserInRole("PhotoAdmin") && Roles.IsUserInRole("TeamPhotoAdmin"))
			{
				var roles = ContactRoles.GetContactRoles(accountId, Globals.GetCurrentUserId());

                DB db = DBConnection.GetContext();

                String roleId = (from r in db.AspNetRoles
                              where r.Name == "TeamPhotoAdmin"
                              select r.Id).SingleOrDefault();

                var teamPhotoAdmins = (from r in roles
                                       where r.RoleId == roleId
                                       select r);

                List<PhotoGalleryAlbum> albums = new List<PhotoGalleryAlbum>();
				foreach (SportsManager.Model.ContactRole teamPhotoAdmin in teamPhotoAdmins)
				{
					albums.AddRange(GetTeamPhotoAlbums(teamPhotoAdmin.RoleData));
				}

                return albums;
			}

            return GetPhotoAlbums(accountId);
		}

		public static List<PhotoGalleryAlbum> GetPhotoAlbums(long accountId)
		{
			List<PhotoGalleryAlbum> photos = new List<PhotoGalleryAlbum>();

			try
			{

				photos.Add(new PhotoGalleryAlbum(0, "Default", accountId, 0, 0));

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetGalleryAlbums", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						photos.Add(new PhotoGalleryAlbum(dr.GetInt64(0), dr.GetString(2), dr.GetInt64(1), dr.GetInt64(3), dr.GetInt64(4)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return photos;
		}

        public static IQueryable<PhotoGalleryItem> GetPhotos(long accountId, long albumId = -1)
        {
            DB db = DBConnection.GetContext();
            return (from pg in db.PhotoGalleries
                    where pg.AccountId == accountId && (albumId == -1 || pg.AlbumId == albumId)
                    select new PhotoGalleryItem()
                    {
                        Id = pg.id,
                        AccountId = pg.AccountId,
                        AlbumId = pg.AlbumId,
                        Title = pg.Title,
                        Caption = pg.Caption,
                    });
        }

		public static List<PhotoGalleryItem> GetTeamPhotos(long teamId)
		{
			List<PhotoGalleryItem> photos = new List<PhotoGalleryItem>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeamGalleryPhotos", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						photos.Add(CreatePhotoGalleryItem(dr));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return photos;
		}

		public static PhotoGalleryItem GetPhoto(long id)
		{
			PhotoGalleryItem photo = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPhotoGalleryItem", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						photo = CreatePhotoGalleryItem(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return photo;
		}

		public static bool AddPhotoAlbum(PhotoGalleryAlbum p)
		{
			int rowCount = 0;

			int maxAlbums = PhotoGallery.GetMaxAlbums();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreatePhotoAlbum", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@title", SqlDbType.VarChar, 25).Value = p.Title;
					myCommand.Parameters.Add("@albumId", SqlDbType.BigInt).Value = p.ParentAlbumId;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = p.AccountId;
					myCommand.Parameters.Add("@maxAlbums", SqlDbType.Int).Value = maxAlbums;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = p.TeamId;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return rowCount <= 0 ? false : true;
		}

		public static long AddPhotoGiveId(PhotoGalleryItem p)
		{
            p.Id = 0;
            if (p.AccountId > 0)
            {
                int maxPhotosPerAlbum = PhotoGallery.GetMaxPhotosPerAlbum();

                DB db = DBConnection.GetContext();

                var numRecords = (from pg in db.PhotoGalleries
                                  where pg.AccountId == p.AccountId && pg.AlbumId == p.AlbumId
                                  select pg).Count();

                if (numRecords < maxPhotosPerAlbum)
                {
                    var dbPhotoGalleryItem = new SportsManager.Model.PhotoGallery()
                    {
                        id = p.Id,
                        AlbumId = p.AlbumId,
                        AccountId = p.AccountId,
                        Caption = p.Caption,
                        Title = p.Title
                    };
                    db.PhotoGalleries.InsertOnSubmit(dbPhotoGalleryItem);
                    db.SubmitChanges();

                    p.Id = dbPhotoGalleryItem.id;
                }
            }

            return p.Id;
		}

		public static bool ModifyPhotoAlbum(PhotoGalleryAlbum p)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{

					SqlCommand myCommand = new SqlCommand("dbo.UpdatePhotoGalleryAlbum", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@title", SqlDbType.VarChar, 25).Value = p.Title;
					myCommand.Parameters.Add("@parentAlbumId", SqlDbType.BigInt).Value = p.ParentAlbumId;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		public static bool ModifyPhoto(PhotoGalleryItem p)
		{
			int rowCount = 0;

			int maxPhotosPerAlbum = PhotoGallery.GetMaxPhotosPerAlbum();
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{

					SqlCommand myCommand = new SqlCommand("dbo.UpdatePhotoGalleryItem", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@title", SqlDbType.VarChar, 25).Value = p.Title;
					myCommand.Parameters.Add("@caption", SqlDbType.VarChar, 255).Value = p.Caption;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;
					myCommand.Parameters.Add("@albumId", SqlDbType.BigInt).Value = p.AlbumId;
					myCommand.Parameters.Add("@maxPhotosPerAlbum", SqlDbType.Int).Value = maxPhotosPerAlbum;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		public static bool RemovePhoto(PhotoGalleryItem p)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeletePhotoGalleryItem", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();

					if (rowCount > 0)
					{
						if (p.PhotoFile != null)
							System.IO.File.Delete(p.PhotoFile);

						if (p.PhotoThumbFile != null)
							System.IO.File.Delete(p.PhotoThumbFile);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		public static bool RemovePhotoAlbum(PhotoGalleryAlbum p)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeletePhotoGalleryAlbum", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		public static bool RemoveTeamPhotoAlbum(PhotoGalleryAlbum p)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteTeamPhotoGalleryAlbum", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = p.TeamId;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		public static PhotoGalleryItem GetPhotoOfDay(long accountId)
		{
			PhotoGalleryItem photo = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPhotoGalleryItemOfDay", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						photo = CreatePhotoGalleryItem(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return photo;
		}

		public static bool DeletePendingPhoto(PhotoGalleryItem item)
		{
			try
			{
				string photoDir = PhotoGalleryItem.SubmittedPhotoDir;

				if (System.IO.Directory.Exists(photoDir))
				{
					string[] files = System.IO.Directory.GetFiles(photoDir, item.SubmittedPhotoKey.ToString() + "*.*");

					foreach (string file in files)
					{
						try
						{
							System.IO.File.Delete(file);
						}
						catch (System.IO.IOException ex)
						{
							Globals.LogException(ex);
						}
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return true;
		}

		public static List<PhotoGalleryItem> GetPendingPhotos(long accountId)
		{
			List<PhotoGalleryItem> photos = new List<PhotoGalleryItem>();

			try
			{
				string photoDir = PhotoGalleryItem.SubmittedPhotoDir;

				if (System.IO.Directory.Exists(photoDir))
				{
					string[] commentFiles = System.IO.Directory.GetFiles(photoDir, "*.txt");

					foreach (string commentFile in commentFiles)
					{
						System.IO.StreamReader tr = new StreamReader(commentFile);
						string title = String.Empty;
						string caption = String.Empty;
						string user = String.Empty;
						long teamId = 0;

						title = tr.ReadLine();
						if (title != null)
						{
							caption = tr.ReadLine();
							if (caption != null)
							{
								user = tr.ReadLine();
								if (user != null)
								{
									string teamIdStr = tr.ReadLine();
									if (teamIdStr != null)
									{
										Int64.TryParse(teamIdStr, out teamId);
									}
								}
								else
								{
									user = string.Empty;
								}
							}
							else
							{
								caption = String.Empty;
							}
						}
						else
						{
							title = String.Empty;
						}

						tr.Close();
						tr.Dispose();

						PhotoGalleryItem item = new PhotoGalleryItem(0, title, caption, accountId, 0);
						item.SubmittedPhotoName = System.IO.Path.GetFileNameWithoutExtension(commentFile) + ".jpg";
						item.SubmittedThumbPhotoName = System.IO.Path.GetFileNameWithoutExtension(commentFile) + "Thumb.jpg";
						item.SubmittedPhotoKey = new Guid(System.IO.Path.GetFileNameWithoutExtension(commentFile));
						item.SubmittedBy = user;
						item.SubmittedForTeamId = teamId;

						photos.Add(item);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return photos;
		}

		public static List<PhotoGalleryAlbum> GetTeamPhotoAlbums(long teamId)
		{
			List<PhotoGalleryAlbum> photos = new List<PhotoGalleryAlbum>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeamPhotoAlbums", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						photos.Add(new PhotoGalleryAlbum(dr.GetInt64(0), dr.GetString(2), dr.GetInt64(1), dr.GetInt64(3), dr.GetInt64(4)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return photos;
		}

		static public int GetMaxPhotosPerAlbum()
		{
			int numPhotosPerAlbum = 20;

			string configValue = ConfigurationManager.AppSettings["MaxPhotosPerAlbum"];
			if (!String.IsNullOrEmpty(configValue))
			{
				Int32.TryParse(configValue, out numPhotosPerAlbum);
			}

			return numPhotosPerAlbum;
		}

		static public int GetMaxAlbums()
		{
			int numAlbums = 5;

			string configValue = ConfigurationManager.AppSettings["MaxAccountPhotoAlbums"];
			if (!String.IsNullOrEmpty(configValue))
			{
				Int32.TryParse(configValue, out numAlbums);
			}

			return numAlbums;
		}

	}
}

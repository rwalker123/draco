using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess
{
	/// <summary>
	/// Summary description for PhotoGallery
	/// </summary>
	static public class PhotoGallery
	{
		public static IQueryable<PhotoGalleryAlbum> GetEditablePhotoAlbums(long accountId)
		{
            var userId = Globals.GetCurrentUserId();
            bool isSitePhotoAdmin = DataAccess.Accounts.IsAccountAdmin(accountId, userId) || ContactRoles.IsPhotoAdmin(accountId, userId);
            if (isSitePhotoAdmin)
            {
                return GetPhotoAlbums(accountId);
            }
            else 
			{
                DB db = DBConnection.GetContext();

                var roles = ContactRoles.GetContactRoles(accountId, userId);
                if (roles != null)
                {
                    String roleId = DataAccess.ContactRoles.GetTeamPhotoAdminId();

                    // find all the teams the user is a photo admin
                    var teamPhotoAdminIds = (from r in roles
                                             where r.RoleId == roleId
                                             select r.RoleData);


                    IQueryable<PhotoGalleryAlbum> albums = null;
                    foreach (var teamPhotoAdminId in teamPhotoAdminIds)
                    {
                        if (albums == null)
                            albums = GetTeamPhotoAlbums(accountId, teamPhotoAdminId);
                        else
                            albums.Concat(GetTeamPhotoAlbums(accountId, teamPhotoAdminId));
                    }

                    return albums;
                }
			}

            return null;
		}

		public static IQueryable<PhotoGalleryAlbum> GetPhotoAlbums(long accountId)
		{
            DB db = DBConnection.GetContext();
            var accountAlbums = (from pga in db.PhotoGalleryAlbums
                                 where pga.AccountId == accountId
                                 & pga.TeamId == 0
                                 orderby pga.Title
                                 select new PhotoGalleryAlbum()
                                 {
                                     Id = pga.Id,
                                     AccountId = accountId,
                                     ParentAlbumId = pga.ParentAlbumId,
                                     TeamId = pga.TeamId,
                                     Title = pga.Title,
                                     PhotoCount = pga.PhotoGalleries.Count()
                                 }).AsEnumerable();

            // get team ids for current season
            var leagueSeasonTeams = DataAccess.Leagues.GetLeagueTeamsFromSeason(accountId);

            var teamIds = (from lst in leagueSeasonTeams
                           select lst.TeamId);

            // get teams with photos
            var teamAlbums = (from pga in db.PhotoGalleryAlbums
                              where pga.AccountId == accountId
                              & teamIds.Contains(pga.TeamId)
                              select new PhotoGalleryAlbum()
                              {
                                  Id = pga.Id,
                                  AccountId = accountId,
                                  ParentAlbumId = pga.ParentAlbumId,
                                  TeamId = pga.TeamId,
                                  Title = leagueSeasonTeams.Where(i => i.TeamId == pga.TeamId).Select(i => i.Name).FirstOrDefault(),
                                  PhotoCount = pga.PhotoGalleries.Count()
                              }).OrderBy(i => i.Title);


            return accountAlbums.Concat(teamAlbums).AsQueryable();
		}

        public static IQueryable<PhotoGalleryItem> GetPhotos(long accountId, long albumId = -1)
        {
            DB db = DBConnection.GetContext();
            return (from pg in db.PhotoGalleries
                    where pg.AccountId == accountId && (albumId == -1 || pg.AlbumId == albumId)
                    select new PhotoGalleryItem()
                    {
                        Id = pg.Id,
                        AccountId = pg.AccountId,
                        AlbumId = pg.AlbumId,
                        Title = pg.Title,
                        Caption = pg.Caption,
                    });
        }

        static public IQueryable<PhotoGalleryItem> GetRandomPhotos(long accountId, int numRandom, long albumId = -1)
        {
            DB db = DBConnection.GetContext();


            var qry = GetPhotos(accountId, albumId);

            int count = qry.Count() - numRandom;
            if (count < 0)
                count = 0;
            int index = new Random().Next(count);
            
            return qry.Skip(index).Take(numRandom);
        }

		public static IQueryable<PhotoGalleryItem> GetTeamPhotos(long teamId)
		{
            DB db = DBConnection.GetContext();

            var teamAlbumId = (from pga in db.PhotoGalleryAlbums
                                   where pga.TeamId == teamId
                                   select pga.Id).SingleOrDefault();

            return (from p in db.PhotoGalleries
                    where p.AlbumId == teamAlbumId
                    select new PhotoGalleryItem()
                    {
                        Id = p.Id,
                        AccountId = p.AccountId,
                        AlbumId = p.AlbumId,
                        Caption = p.Caption,
                        Title = p.Title
                    });
		}

		public static PhotoGalleryItem GetPhoto(long id)
		{
            DB db = DBConnection.GetContext();
            return (from pg in db.PhotoGalleries
                    where pg.Id == id
                    select new PhotoGalleryItem()
                    {
                        Id = pg.Id,
                        AlbumId = pg.AlbumId,
                        AccountId = pg.AccountId,
                        Title = pg.Title,
                        Caption = pg.Caption
                    }).SingleOrDefault();
		}

		public static bool AddPhotoAlbum(PhotoGalleryAlbum p)
		{
            DB db = DBConnection.GetContext();

            // account photo album
            if (p.TeamId == 0)
            {
                var numAccountAlbums = (from pga in db.PhotoGalleryAlbums
                                        where pga.AccountId == p.AccountId && pga.TeamId == 0
                                        select pga).Count();

			    int maxAlbums = PhotoGallery.GetMaxAlbums();

                if (numAccountAlbums < maxAlbums)
                {
                    SportsManager.Model.PhotoGalleryAlbum dbAlbum = new SportsManager.Model.PhotoGalleryAlbum()
                    {
                        AccountId = p.AccountId,
                        ParentAlbumId = 0,
                        TeamId = p.TeamId,
                        Title = p.Title
                    };

                    db.PhotoGalleryAlbums.InsertOnSubmit(dbAlbum);
                    db.SubmitChanges();

                    p.Id = dbAlbum.Id;
                    return true;
                }
            }
            else
            {
                var teamAlbumExists = (from pga in db.PhotoGalleryAlbums
                                       where pga.TeamId == p.TeamId
                                       select pga).Any();
                if (!teamAlbumExists)
                {
                    SportsManager.Model.PhotoGalleryAlbum dbAlbum = new SportsManager.Model.PhotoGalleryAlbum()
                    {
                        AccountId = p.AccountId,
                        ParentAlbumId = 0,
                        TeamId = p.TeamId,
                        Title = p.Title
                    };

                    db.PhotoGalleryAlbums.InsertOnSubmit(dbAlbum);
                    db.SubmitChanges();

                    p.Id = dbAlbum.Id;
                    return true;
                }
            }

            return false;
		}

		public static bool AddPhoto(PhotoGalleryItem p)
		{
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
                        Id = p.Id,
                        AlbumId = p.AlbumId,
                        AccountId = p.AccountId,
                        Caption = p.Caption,
                        Title = p.Title
                    };
                    db.PhotoGalleries.InsertOnSubmit(dbPhotoGalleryItem);
                    db.SubmitChanges();

                    p.Id = dbPhotoGalleryItem.Id;

                    return true;
                }
            }

            return false;
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
			int maxPhotosPerAlbum = PhotoGallery.GetMaxPhotosPerAlbum();
            DB db = DBConnection.GetContext();

            var numPhotosInAlbum = (from pg in db.PhotoGalleries
                                    where pg.AccountId == p.AccountId && pg.AlbumId == p.AlbumId
                                    select pg).Count();
            if (numPhotosInAlbum < maxPhotosPerAlbum)
            {
                var dbPhotoItem = (from pg in db.PhotoGalleries
                                   where pg.Id == p.Id
                                   select pg).SingleOrDefault();
                if (dbPhotoItem != null)
                {
                    dbPhotoItem.Title = p.Title;
                    dbPhotoItem.Caption = p.Caption == null ? String.Empty : p.Caption;
                    dbPhotoItem.AlbumId = p.AlbumId;

                    db.SubmitChanges();
                    return true;
                }
            }

            return false;
		}

		public static async Task<bool> RemovePhoto(PhotoGalleryItem p)
		{
            bool rc = false;

            DB db = DBConnection.GetContext();
            var dbItem = (from pg in db.PhotoGalleries
                          where pg.Id == p.Id
                          select pg).SingleOrDefault();

            if (dbItem != null)
            {
                db.PhotoGalleries.DeleteOnSubmit(dbItem);
                db.SubmitChanges();
                rc = true;
            }

            await Storage.Provider.DeleteDirectory(p.PhotoURL);

            return rc;
		}

		public static bool RemovePhotoAlbum(PhotoGalleryAlbum p)
		{
            DB db = DBConnection.GetContext();

            var dbAlbum = (from pga in db.PhotoGalleryAlbums
                           where pga.Id == p.Id
                           select pga).SingleOrDefault();

            // not allowing to delete a team photo album until there is a reason for it.
            if (dbAlbum != null && dbAlbum.TeamId == 0)
            {
                var photosInGallery = (from pg in db.PhotoGalleries
                                       where pg.AlbumId == p.Id
                                       select pg);
                foreach (var photo in photosInGallery)
                    photo.AlbumId = 0;

                db.PhotoGalleryAlbums.DeleteOnSubmit(dbAlbum);
                db.SubmitChanges();

                return true;
            }

            return false;
		}

		public static async Task<bool> RemoveTeamPhotoAlbum(PhotoGalleryAlbum p)
		{
            DB db = DBConnection.GetContext();

            var dbAlbums = (from pga in db.PhotoGalleryAlbums
                         where pga.TeamId == p.TeamId
                         select pga);


            // not allowing to delete a team photo album until there is a reason for it.
            foreach (var album in dbAlbums)
            {
                var photosInGallery = (from pg in db.PhotoGalleries
                                       where pg.AlbumId == album.Id
                                       select pg);

                var savedPhotos = new List<PhotoGalleryItem>();
                foreach (var photo in photosInGallery)
                    savedPhotos.Add(new PhotoGalleryItem()
                        {
                            Id = photo.Id,
                            AccountId = photo.AccountId
                        });

                db.PhotoGalleries.DeleteAllOnSubmit(photosInGallery);
                db.PhotoGalleryAlbums.DeleteOnSubmit(album);
                db.SubmitChanges();

                foreach (var photo in savedPhotos)
                {
                    await Storage.Provider.DeleteDirectory(photo.PhotoURL);
                }
            }

            return true;
        }


		public static bool DeletePendingPhoto(PhotoGalleryItem item)
		{
			//string photoDir = PhotoGalleryItem.SubmittedPhotoDirURL;
            // item.SubmittedThumbPhotoThumbUrl

			return true;
		}

		public static List<PhotoGalleryItem> GetPendingPhotos(long accountId)
		{
			List<PhotoGalleryItem> photos = new List<PhotoGalleryItem>();

            //PhotoGalleryItem item = new PhotoGalleryItem(0, title, caption, accountId, 0);
            //item.SubmittedPhotoName = System.IO.Path.GetFileNameWithoutExtension(commentFile) + ".jpg";
            //item.SubmittedThumbPhotoName = System.IO.Path.GetFileNameWithoutExtension(commentFile) + "Thumb.jpg";
            //item.SubmittedPhotoKey = new Guid(System.IO.Path.GetFileNameWithoutExtension(commentFile));
            //item.SubmittedBy = user;
            //item.SubmittedForTeamId = teamId;

            //photos.Add(item);

			return photos;
		}

		public static IQueryable<PhotoGalleryAlbum> GetTeamPhotoAlbums(long accountId, long teamId)
		{
            DB db = DBConnection.GetContext();

            var album = (from pga in db.PhotoGalleryAlbums
                         where pga.AccountId == accountId && pga.TeamId == teamId
                         select new PhotoGalleryAlbum()
                         {
                             Id = pga.Id,
                             TeamId = pga.TeamId,
                             Title = pga.Title,
                             AccountId = pga.AccountId,
                             ParentAlbumId = pga.ParentAlbumId
                         });

            // create a default album for the team
            if (!album.Any())
            {
                SportsManager.Model.PhotoGalleryAlbum dbAlbum = new SportsManager.Model.PhotoGalleryAlbum();
                dbAlbum.ParentAlbumId = 0;
                dbAlbum.Title = DataAccess.Teams.GetTeamNameFromTeamId(teamId, false);
                dbAlbum.AccountId = accountId;
                dbAlbum.TeamId = teamId;

                db.PhotoGalleryAlbums.InsertOnSubmit(dbAlbum);
                db.SubmitChanges();

                return (from pga in db.PhotoGalleryAlbums
                        where pga.AccountId == accountId && pga.TeamId == teamId
                        select new PhotoGalleryAlbum()
                        {
                            Id = pga.Id,
                            TeamId = pga.TeamId,
                            Title = pga.Title,
                            AccountId = pga.AccountId,
                            ParentAlbumId = pga.ParentAlbumId
                        });
            }

            return album;
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

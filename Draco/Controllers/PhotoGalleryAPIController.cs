using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.Models.Utils;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class PhotoGalleryAPIController : DBApiController
    {
        public PhotoGalleryAPIController(DB db) : base(db)
        {


        }
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("photos")]
        public HttpResponseMessage Get(long accountId)
        {
            IQueryable<PhotoGalleryItem> photos = null;

            var queryValues = Request.RequestUri.ParseQueryString();
            String numRandomPhotos = queryValues["random"];
            if (!String.IsNullOrEmpty(numRandomPhotos))
            {
                int numPhotos = 10;
                if (Int32.TryParse(numRandomPhotos, out numPhotos))
                {
                    var qry = (from pg in Db.PhotoGalleries
                            where pg.AccountId == accountId
                            select pg);

                    int count = qry.Count() - numPhotos;
                    if (count < 0)
                        count = 0;
                    int index = new Random().Next(count);

                    photos = qry.Skip(index).Take(numPhotos);
                }
            }
            else
            {
                int albumId = -1;
                String album = queryValues["album"];
                if (!String.IsNullOrEmpty(album))
                {
                    Int32.TryParse(album, out albumId);
                }
                if (albumId == -1)
                    photos = (from pg in Db.PhotoGalleries
                            where pg.AccountId == accountId
                            select pg);
                else
                    photos = (from pg in Db.PhotoGalleries
                              where pg.AccountId == accountId && pg.AlbumId == albumId
                              select pg);
            }

            if (photos != null)
            {
                var vm = Mapper.Map<IEnumerable<PhotoGalleryItem>, PhotoViewModel[]>(photos);
                return Request.CreateResponse<PhotoViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("photos")]
        public async Task<HttpResponseMessage> GetTeamPhotos(long accountId, long teamSeasonId)
        {
            var teamSeason = await Db.TeamsSeasons.FindAsync(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (teamSeason.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var teamAlbums = (from pga in Db.PhotoGalleryAlbums
                              where pga.AccountId == accountId && pga.TeamId == teamSeason.Team.Id
                              select pga);

            // should always be an album.
            if (!teamAlbums.Any())
                return Request.CreateResponse(HttpStatusCode.NotFound);

            // should only be 1 team photo album.
            var photos = teamAlbums.First().Photos;
            if (photos != null)
            {
                var vm = Mapper.Map<IEnumerable<PhotoGalleryItem>, PhotoViewModel[]>(photos);
                return Request.CreateResponse<PhotoViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, AccountPhotoAdmin")]
        public async Task<HttpResponseMessage> UpdatePhoto(long accountId, int id, PhotoViewModel item)
        {
            if (ModelState.IsValid)
            {
                var photo = await Db.PhotoGalleries.FindAsync(id);
                if (photo == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (photo.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                int maxPhotosPerAlbum = GetMaxPhotosPerAlbum();

                var numPhotosInAlbum = (from pg in Db.PhotoGalleries
                                        where pg.AccountId == accountId && pg.AlbumId == item.AlbumId
                                        select pg).Count();
                if (numPhotosInAlbum <= maxPhotosPerAlbum)
                {
                    photo.Title = item.Title;
                    photo.Caption = item.Caption;
                    photo.AlbumId = item.AlbumId;

                    await Db.SaveChangesAsync();

                    var vm = Mapper.Map<PhotoGalleryItem, PhotoViewModel>(photo);
                    return Request.CreateResponse<PhotoViewModel>(HttpStatusCode.OK, vm);
                }
                else
                {
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum Photo Albums Reached.");
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, AccountPhotoAdmin, TeamAdmin, TeamPhotoAdmin")]
        public async Task<HttpResponseMessage> UpdateTeamPhoto(long accountId, long teamSeasonId, int id, PhotoViewModel item)
        {
            if (ModelState.IsValid)
            {
                var team = await Db.TeamsSeasons.FindAsync(teamSeasonId);
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var photo = await Db.PhotoGalleries.FindAsync(id);
                if (photo == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var teamAlbums = (from pga in Db.PhotoGalleryAlbums
                                  where pga.AccountId == accountId && pga.TeamId == team.TeamId
                                  select pga);

                // should always be an album.
                if (!teamAlbums.Any())
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // should only be 1 team photo album.
                var teamAlbum = teamAlbums.First();

                item.AlbumId = teamAlbum.Id;

                int maxPhotosPerAlbum = GetMaxPhotosPerAlbum();

                var numPhotosInAlbum = (from pg in Db.PhotoGalleries
                                        where pg.AccountId == accountId && pg.AlbumId == item.AlbumId
                                        select pg).Count();
                if (numPhotosInAlbum <= maxPhotosPerAlbum)
                {
                    photo.Title = item.Title;
                    photo.Caption = item.Caption;
                    photo.AlbumId = item.AlbumId;

                    await Db.SaveChangesAsync();

                    var vm = Mapper.Map<PhotoGalleryItem, PhotoViewModel>(photo);
                    return Request.CreateResponse<PhotoViewModel>(HttpStatusCode.OK, vm);
                }
                else
                {
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum Photo Albums Reached.");
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, AccountPhotoAdmin")]
        public async Task<HttpResponseMessage> DeletePhoto(long accountId, long id)
        {
            var photo = await Db.PhotoGalleries.FindAsync(id);
            if (photo == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (photo.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.PhotoGalleries.Remove(photo);
            await Db.SaveChangesAsync();

            await Storage.Provider.DeleteDirectory(photo.PhotoURL);
            return Request.CreateResponse<long>(HttpStatusCode.OK, photo.Id);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, AccountPhotoAdmin, TeamAdmin, TeamPhotoAdmin")]
        public async Task<HttpResponseMessage> DeleteTeamPhoto(long accountId, long teamSeasonId, long id)
        {
            var team = await Db.TeamsSeasons.FindAsync(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var photo = await Db.PhotoGalleries.FindAsync(id);
            if (photo == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (photo.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.PhotoGalleries.Remove(photo);
            await Db.SaveChangesAsync();

            await Storage.Provider.DeleteDirectory(photo.PhotoURL);
            return Request.CreateResponse<long>(HttpStatusCode.OK, photo.Id);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("albums")]
        public HttpResponseMessage GetPhotoAlbums(long accountId)
        {
            var accountAlbums = (from pga in Db.PhotoGalleryAlbums
                                 where pga.AccountId == accountId
                                 & pga.TeamId == 0
                                 orderby pga.Title
                                 select pga).AsEnumerable();

            // get team ids for current season
             long currentSeason = this.GetCurrentSeasonId(accountId);

             var teamIds = (from ls in Db.LeagueSeasons
                            join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                            where ls.SeasonId == currentSeason
                            select ts.TeamId);

            // get teams with photos
            var teamAlbums = (from pga in Db.PhotoGalleryAlbums
                              where pga.AccountId == accountId
                              & teamIds.Contains(pga.TeamId)
                              select pga).OrderBy(i => i.Title);


            var photos = accountAlbums.Concat(teamAlbums).AsEnumerable();
            if (photos != null)
            {
                var vm = Mapper.Map <IEnumerable<PhotoGalleryAlbum>, PhotoAlbumViewModel[]>(photos);
                return Request.CreateResponse<PhotoAlbumViewModel[]>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("editablealbums")]
        public HttpResponseMessage EditableAlbums(long accountId)
        {
            var userId = Globals.GetCurrentUserId();
            bool isSitePhotoAdmin = this.IsAccountAdmin(accountId, userId) || this.IsPhotoAdmin(accountId, userId);
            if (isSitePhotoAdmin)
            {
                return GetPhotoAlbums(accountId);
            }
            else
            {
                var roles = this.GetContactRoles(accountId, userId);
                if (roles != null)
                {
                    String roleId = this.GetTeamPhotoAdminId();

                    // find all the teams the user is a photo admin
                    var teamPhotoAdminIds = (from r in roles
                                             where r.RoleId == roleId
                                             select r.RoleData);

                    var albums = (from pga in Db.PhotoGalleryAlbums
                                    where pga.AccountId == accountId && teamPhotoAdminIds.Contains(pga.TeamId)
                                    select pga).AsEnumerable();

                    var vm = Mapper.Map<IEnumerable<PhotoGalleryAlbum>, PhotoAlbumViewModel[]>(albums);
                    return Request.CreateResponse<PhotoAlbumViewModel[]>(HttpStatusCode.OK, vm);
                }
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("albums")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, AccountPhotoAdmin")]
        public async Task<HttpResponseMessage> DeletePhotoAlbum(long accountId, long id)
        {
            var pa = await Db.PhotoGalleryAlbums.FindAsync(id);
            if (pa == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (pa.AccountId != accountId || pa.TeamId != 0)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var photosInGallery = pa.Photos;
            foreach (var photo in photosInGallery)
                photo.AlbumId = 0;

            Db.PhotoGalleryAlbums.Remove(pa);
            await Db.SaveChangesAsync();

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("albums")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, AccountPhotoAdmin")]
        public async Task<HttpResponseMessage> PostPhotoAlbum(long accountId, IdData name)
        {
            if (name == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Must specify Photo Album name.");
            }

            var numAccountAlbums = (from pga in Db.PhotoGalleryAlbums
                                    where pga.AccountId == accountId && pga.TeamId == 0
                                    select pga).Count();

			int maxAlbums = GetMaxAlbums();

            if (numAccountAlbums < maxAlbums)
            {
                PhotoGalleryAlbum dbAlbum = new PhotoGalleryAlbum()
                {
                    Title = name.Id,
                    AccountId = accountId,
                    TeamId = 0,
                    ParentAlbumId = 0
                };

                Db.PhotoGalleryAlbums.Add(dbAlbum);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<PhotoGalleryAlbum, PhotoAlbumViewModel>(dbAlbum);
                return Request.CreateResponse<PhotoAlbumViewModel>(HttpStatusCode.Created, vm);
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum Photo Albums Reached.");
            }
        }

        private int GetMaxPhotosPerAlbum()
        {
            int numPhotosPerAlbum = 20;

            string configValue = ConfigurationManager.AppSettings["MaxPhotosPerAlbum"];
            if (!String.IsNullOrEmpty(configValue))
            {
                Int32.TryParse(configValue, out numPhotosPerAlbum);
            }

            return numPhotosPerAlbum;
        }

        private int GetMaxAlbums()
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

using ModelObjects;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class PhotoGalleryAPIController : DBApiController
    {
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
                    photos = DataAccess.PhotoGallery.GetRandomPhotos(accountId, numPhotos);
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
                photos = DataAccess.PhotoGallery.GetPhotos(accountId, albumId);
            }

            if (photos != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.PhotoGalleryItem>>(HttpStatusCode.OK, photos);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("photos")]
        public HttpResponseMessage GetTeamPhotos(long accountId, long teamSeasonId)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var teamAlbums = DataAccess.PhotoGallery.GetTeamPhotoAlbums(accountId, team.TeamId);
            // should always be an album.
            if (!teamAlbums.Any())
                return Request.CreateResponse(HttpStatusCode.NotFound);

            // should only be 1 team photo album.
            var teamAlbum = teamAlbums.First();

            var photos = DataAccess.PhotoGallery.GetPhotos(accountId, teamAlbum.Id);
            if (photos != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.PhotoGalleryItem>>(HttpStatusCode.OK, photos);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdatePhoto(long accountId, int id, PhotoGalleryItem item)
        {
            if (String.IsNullOrEmpty(item.Title))
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Title cannot be empty.");

            item.Id = id;
            item.AccountId = accountId;
            PhotoGalleryItem foundItem = DataAccess.PhotoGallery.GetPhoto(item.Id);
            if (foundItem == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            bool rc = DataAccess.PhotoGallery.ModifyPhoto(item);

            if (rc)
            {
                return Request.CreateResponse<PhotoGalleryItem>(HttpStatusCode.OK, item);
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum photos in albums reached.");
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin, TeamPhotoAdmin")]
        public HttpResponseMessage UpdateTeamPhoto(long accountId, long teamSeasonId, int id, PhotoGalleryItem item)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var teamAlbums = DataAccess.PhotoGallery.GetTeamPhotoAlbums(accountId, team.TeamId);
            // should always be an album.
            if (!teamAlbums.Any())
                return Request.CreateResponse(HttpStatusCode.NotFound);

            // should only be 1 team photo album.
            var teamAlbum = teamAlbums.First();

            item.AlbumId = teamAlbum.Id;

            return UpdatePhoto(accountId, id, item);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeletePhoto(long accountId, long id)
        {
            var photo = new PhotoGalleryItem()
            {
                AccountId = accountId,
                Id = id
            };

            if (await DataAccess.PhotoGallery.RemovePhoto(photo))
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(photo.Id.ToString())
                };

                return response;
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("photos")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin, TeamPhotoAdmin")]
        public async Task<HttpResponseMessage> DeleteTeamPhoto(long accountId, long teamSeasonId, long id)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            return await DeletePhoto(accountId, id);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("albums")]
        public HttpResponseMessage GetPhotoAlbums(long accountId)
        {
            var photos = DataAccess.PhotoGallery.GetPhotoAlbums(accountId);
            if (photos != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.PhotoGalleryAlbum>>(HttpStatusCode.OK, photos);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("editablealbums")]
        public HttpResponseMessage EditableAlbums(long accountId)
        {
            var photos = DataAccess.PhotoGallery.GetEditablePhotoAlbums(accountId);
            if (photos != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.PhotoGalleryAlbum>>(HttpStatusCode.OK, photos);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("albums")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeletePhotoAlbum(long accountId, long id)
        {
            PhotoGalleryAlbum album = new PhotoGalleryAlbum()
            {
                AccountId = accountId,
                Id = id
            };

            if (DataAccess.PhotoGallery.RemovePhotoAlbum(album))
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(album.Id.ToString())
                };

                return response;
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("albums")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostPhotoAlbum(long accountId, IdData name)
        {
            if (name == null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Must specify Photo Album name.");
            }

            PhotoGalleryAlbum album = new PhotoGalleryAlbum()
            {
                Title = name.Id,
                AccountId = accountId,
                TeamId = 0
            };

            bool rc = DataAccess.PhotoGallery.AddPhotoAlbum(album);
            if (rc)
            {
                return Request.CreateResponse<PhotoGalleryAlbum>(HttpStatusCode.Created, album);
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum Photo Albums Reached.");
            }
        }

    }
}

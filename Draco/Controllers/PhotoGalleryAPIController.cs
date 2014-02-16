using ModelObjects;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class PhotoGalleryAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("photos")]
        public HttpResponseMessage Get(long accountId)
        {
            var photos = DataAccess.PhotoGallery.GetPhotos(accountId);
            if (photos!= null)
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


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("albums")]
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
        public HttpResponseMessage PostPhotoAlbum(long accountId, SportsManager.Controllers.AccountAPIController.IdData name)
        {
            PhotoGalleryAlbum album = new PhotoGalleryAlbum()
            {
                Title = name.Id,
                ParentAlbumId = 0,
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

using System;
using System.Configuration;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using ModelObjects;
using SportsManager.Models;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure;
using Microsoft.WindowsAzure.Storage.Blob;
using System.Text;

namespace SportsManager.Controllers
{
    public class FileUploaderAPIController : ApiController
    {
        // try to keep all at a 16 x 9 format
        private readonly Size largeImageSize = new Size(800, 450); // "50" units 16 x 50 = 800
        private readonly Size largeImageThumbSize = new Size(160, 90); // "10" units 
        private readonly Size smallImageSize = new Size(80, 45); // 5 units
        private readonly Size mediumImageSize = new Size(640, 360); // 40 units 
        private readonly Size wideImageSize = new Size(512, 288); // 32 units

        enum eSizeType
        {
            Normal,
            Absolute,
            Maximum
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage RemoveTempFile(long accountId, string fileUri)
        {
            string fileName = HttpContext.Current.Server.MapPath(fileUri);
            if (File.Exists(fileName))
            {
                File.Delete(fileName);
                return Request.CreateResponse(HttpStatusCode.NoContent);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);            
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> PhotoGallery(long accountId)
        {
            if (accountId == 0)
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "");

            var multipartData = await prep();
            MultipartFileData file = multipartData.FileData[0];
            var formData = multipartData.FormData;

            PhotoGalleryItem item = new PhotoGalleryItem()
            {
                Id = 0,
                Title = formData["Title"],
                Caption = formData["Caption"],
                AlbumId = long.Parse(formData["AlbumId"]),
                AccountId = accountId
            };

            if (String.IsNullOrEmpty(item.Title))
                item.Title = System.IO.Path.GetFileNameWithoutExtension(file.Headers.ContentDisposition.FileName.Trim(new char[] { '"' }));

            bool rc = DataAccess.PhotoGallery.AddPhoto(item);

            if (rc)
            {
                HttpResponseMessage msg = await ProcessUploadRequest(file, accountId, item.PhotoURL, ImageFormat.Jpeg, largeImageSize, eSizeType.Maximum, true, item.PhotoThumbURL, largeImageThumbSize);
                if (msg.IsSuccessStatusCode)
                    return Request.CreateResponse<PhotoGalleryItem>(HttpStatusCode.OK, item);
                else
                {
                    await DataAccess.PhotoGallery.RemovePhoto(item);
                    return msg;
                }
            }
            else
            {
                File.Delete(file.LocalFileName);
            }

            return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum Photos in the given album reached.");
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> MailAttachment(long accountId)
        {
            var multipartData = await prep();
            MultipartFileData file = multipartData.FileData[0];

            return ProcessUploadRequest(file, accountId);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> ContactPhoto(long accountId, long id)
        {
            ModelObjects.Contact c = DataAccess.Contacts.GetContact(id);
            if (c == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var multipartData = await prep();
            MultipartFileData file = multipartData.FileData[0];

            return await ProcessUploadRequest(file, accountId, c.PhotoURL, ImageFormat.Png, smallImageSize, eSizeType.Maximum);
        }


        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> TeamLogo(long accountId, long id)
        {
            Team t = DataAccess.Teams.GetTeamSeason(id);

            var multipartData = await prep();
            MultipartFileData file = multipartData.FileData[0];

            return await ProcessUploadRequest(file, accountId, t.TeamLogoURL, ImageFormat.Png, smallImageSize, eSizeType.Maximum);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> TeamPhoto(long accountId, long id)
        {
            Team t = DataAccess.Teams.GetTeamSeason(id);

            var multipartData = await prep();
            MultipartFileData file = multipartData.FileData[0];

            return await ProcessUploadRequest(file, accountId, t.TeamPhotoURL, ImageFormat.Jpeg, mediumImageSize, eSizeType.Maximum);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> AccountLargeLogo(long accountId)
        {
            Account a = DataAccess.Accounts.GetAccount(accountId);

            var multipartData = await prep();
            MultipartFileData file = multipartData.FileData[0];

            return await ProcessUploadRequest(file, accountId, a.LargeLogoURL, ImageFormat.Png, wideImageSize, eSizeType.Maximum);
        }

        private async Task<MultipartFormDataStreamProvider> prep()
        {
            // Verify that this is an HTML Form file upload request
            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }

            string root = HttpContext.Current.Server.MapPath("~/Uploads/Temp");
            System.IO.Directory.CreateDirectory(root);
            var provider = new MultipartFormDataStreamProvider(root);

            // Read the form data.
            await Request.Content.ReadAsMultipartAsync(provider);

            // This illustrates how to get the file names.
            int numFiles = provider.FileData.Count;
            if (numFiles != 1)
                throw new HttpResponseException(HttpStatusCode.BadRequest);

            return provider;
        }

        private HttpResponseMessage ProcessUploadRequest(MultipartFileData file, long accountId)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK, MapUrl(file.LocalFileName));
            }
            catch (System.Exception e)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e);
            }
        }

        private async Task<HttpResponseMessage> ProcessUploadRequest(MultipartFileData file, long accountId,
            String imageUri, ImageFormat imageFormat, Size photoSize, eSizeType sizeType,
            bool createThumbnail = false, string thumbnailUri = null, Size? thumbnailSize = null)
        {
            try
            {
                String fileExt = Path.GetExtension(file.Headers.ContentDisposition.FileName.Trim(new char[] { '"' })).ToLowerInvariant();
                string imageExtensions = ConfigurationManager.AppSettings["ImageExtensions"];
                if (!imageExtensions.Contains(fileExt) || !IsImageFile(file.LocalFileName))
                {
                    File.Delete(file.LocalFileName);
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Image file must be specified");
                }

                ImageCodecInfo encoder = GetEncoder(imageFormat);
                // Create an Encoder object based on the GUID 
                // for the Quality parameter category.
                System.Drawing.Imaging.Encoder myEncoder = System.Drawing.Imaging.Encoder.Quality;

                // Create an EncoderParameters object. 
                // An EncoderParameters object has an array of EncoderParameter 
                // objects. In this case, there is only one 
                // EncoderParameter object in the array.
                EncoderParameters myEncoderParameters = new EncoderParameters(1);

                // 50 quality is on scale of 0-100, 0 = being the largest file size.
                EncoderParameter myEncoderParameter = new EncoderParameter(myEncoder, 50L);
                myEncoderParameters.Param[0] = myEncoderParameter;

                // convert to correct format
                using (System.Drawing.Image theImage = System.Drawing.Image.FromFile(file.LocalFileName))
                {
                    System.Drawing.Image scaledImage = null;

                    switch (sizeType)
                    {
                        case eSizeType.Absolute:
                            scaledImage = ScaleImage(theImage, photoSize, false);
                            break;
                        case eSizeType.Maximum:
                            scaledImage = ScaleImage(theImage, photoSize, true);
                            break;
                        case eSizeType.Normal:
                            scaledImage = theImage;
                            break;
                    }

                    if (createThumbnail)
                    {
                        System.Drawing.Image thumbnailImage = FixedSize(scaledImage, thumbnailSize.GetValueOrDefault().Width, thumbnailSize.GetValueOrDefault().Height);

                        string tnFile = file.LocalFileName + "-thumbnail";
                        
                        thumbnailImage.Save(tnFile, encoder, myEncoderParameters);
                        await SportsManager.Models.Utils.AzureStorageUtils.SaveToCloudBlob(tnFile, thumbnailUri);
                    }

                    // save file in correct format.
                    string imgFile = file.LocalFileName + "-scaledimage";
                    scaledImage.Save(imgFile, encoder, myEncoderParameters);
                    scaledImage.Dispose();
                    imageUri = await SportsManager.Models.Utils.AzureStorageUtils.SaveToCloudBlob(imgFile, imageUri);
                }

                if (File.Exists(file.LocalFileName))
                    File.Delete(file.LocalFileName);

                // return URI of file
                return Request.CreateResponse<string>(HttpStatusCode.OK, imageUri);
            }
            catch (System.Exception e)
            {
                if (File.Exists(file.LocalFileName))
                    File.Delete(file.LocalFileName);

                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e);
            }
        }

        private ImageCodecInfo GetEncoder(ImageFormat format)
        {
            ImageCodecInfo[] codecs = ImageCodecInfo.GetImageDecoders();

            foreach (ImageCodecInfo codec in codecs)
            {
                if (codec.FormatID == format.Guid)
                {
                    return codec;
                }
            }
            return null;
        }

        private string MapUrl(string path)
        {
            string appPath = HttpContext.Current.Server.MapPath("/").ToLower();
            return string.Format("/{0}", path.ToLower().Replace(appPath, "").Replace(@"\", "/"));
        }

        private bool IsImageFile(string fileName)
        {
            try
            {
                using (Image test = Image.FromFile(fileName))
                {
                    return true;
                }
            }
            catch
            {
            }

            return false;
        }

        private System.Drawing.Image ScaleImage(System.Drawing.Image inImage, System.Drawing.Size photoSize, bool maxSize)
        {
            // Determine the scale.
            float xscale = (float)photoSize.Width / (float)inImage.Width;
            float yscale = (float)photoSize.Height / (float)inImage.Height;

            if (maxSize)
            {
                if (xscale > 1.0)
                    xscale = 1.0f;

                if (yscale > 1.0)
                    yscale = 1.0f;
            }

            if (xscale == 1.0 && yscale == 1.0)
                return inImage;

            // Determine size of new image. 
            //One of them
            // should equal maxDim.
            int scaledW = (int)(xscale * (float)inImage.Width);
            int scaledH = (int)(yscale * (float)inImage.Height);

            return FixedSize(inImage, scaledW, scaledH);
        }

        private System.Drawing.Image FixedSize(System.Drawing.Image imgPhoto, int Width, int Height)
        {
            int sourceWidth = imgPhoto.Width;
            int sourceHeight = imgPhoto.Height;

            System.Drawing.Bitmap bmPhoto = new System.Drawing.Bitmap(Width, Height, PixelFormat.Format32bppArgb);
            bmPhoto.SetResolution(imgPhoto.HorizontalResolution, imgPhoto.VerticalResolution);

            System.Drawing.Graphics grPhoto = System.Drawing.Graphics.FromImage(bmPhoto);
            grPhoto.InterpolationMode = InterpolationMode.HighQualityBicubic;

            grPhoto.DrawImage(imgPhoto,
                new Rectangle(0, 0, Width, Height),
                new Rectangle(0, 0, sourceWidth, sourceHeight),
                GraphicsUnit.Pixel);

            grPhoto.Dispose();
            return bmPhoto;
        }

    }
}

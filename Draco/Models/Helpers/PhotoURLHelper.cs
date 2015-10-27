using SportsManager.Models.Utils;

namespace SportsManager.Models.Helpers
{
    public static class PhotoURLHelper
    {
        private static string PhotoName = "ContactPhoto.jpg";
        private static string LargePhotoName = "ContactActionPhoto.jpg";

        static public string GetPhotoURL(long id)
        {
            return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Contacts/" + id + "/" + PhotoName);
        }

        static public string GetLargePhotoURL(long id)
        {
            return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Contacts/" + id + "/" + LargePhotoName);
        }
    }
}
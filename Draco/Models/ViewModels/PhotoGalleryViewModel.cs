using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class PhotoGalleryViewModel : AccountViewModel
    {
        public PhotoGalleryViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

    }
}
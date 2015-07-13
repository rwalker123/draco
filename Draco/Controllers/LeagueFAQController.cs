using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class LeagueFAQController : Controller
    {
        // GET: LeagueFAQ
        public ActionResult Index(long accountId)
        {
            return View(new AccountViewModel(this, accountId));
        }
    }
}
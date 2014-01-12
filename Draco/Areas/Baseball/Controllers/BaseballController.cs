using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class BaseballController : Controller
    {
        //
        // GET: /Baseball/Baseball/

        public ActionResult Index()
        {
            return View("Index");
        }
    }
}

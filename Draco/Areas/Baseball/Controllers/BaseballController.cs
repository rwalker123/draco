using System.Web.Mvc;

namespace SportsManager.Baseball.Controllers
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

using SportsManager.Baseball.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class PlayerClassifiedController : Controller
    {
        // GET: Baseball/PlayerClassified
        public ActionResult Index(long accountId)
        {
            return View(new PlayerClassifiedViewModel(this, accountId));
        }
    }
}
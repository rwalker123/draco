using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
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
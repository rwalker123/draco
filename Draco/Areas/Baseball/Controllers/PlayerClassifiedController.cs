using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class PlayerClassifiedController : DBController
    {
        public PlayerClassifiedController(DB db) : base(db)
        {
        }

        // GET: Baseball/PlayerClassified
        public ActionResult Index(long accountId)
        {
            return View(new PlayerClassifiedViewModel(this, accountId));
        }
    }
}
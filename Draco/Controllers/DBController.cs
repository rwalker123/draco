using ModelObjects;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public abstract class DBController : Controller
    {
        protected DB m_db;

        protected DBController(DB db)
        {
            m_db = db;
        }
    }
}
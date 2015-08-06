using ModelObjects;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public abstract class DBController : Controller, IDb
    {
        private DB m_db;

        protected DBController(DB db)
        {
            m_db = db;
        }

        public DB Db
        {
            get
            {
                return m_db;
            }
        }
    }
}
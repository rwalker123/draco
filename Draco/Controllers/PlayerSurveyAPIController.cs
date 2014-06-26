using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class PlayerSurveyAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("categories")]
        public HttpResponseMessage GetCategories(long accountId)
        {
            DataAccess.ProfileAdmin.GetPlayersWithProfiles(accountId);
            if (contact != null || isAdmin)
            {
                var teamCats = DataAccess.MessageBoard.GetContactTeamCategoriesWithDetails(accountId, contact);
                if (teamCats != null)
                    categories.AddRange(teamCats);

                var globalCats = DataAccess.MessageBoard.GetContactGlobalCategoriesWithDetails(accountId, contact);
                if (globalCats != null)
                    categories.AddRange(globalCats);
            }

            return Request.CreateResponse<IEnumerable<ModelObjects.MessageCategory>>(HttpStatusCode.OK, categories);
        }
    }
}

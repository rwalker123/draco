using SportsManager.Models;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class RosterAPIController : ApiController
    {
        private int pageSize = 10;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("players")]
        public HttpResponseMessage GetPlayers(long accountId, long teamSeasonId)
        {
            var players = DataAccess.TeamRoster.GetPlayers(teamSeasonId);
            return Request.CreateResponse<IQueryable<ModelObjects.Player>>(HttpStatusCode.OK, players);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availableplayers")]
        public HttpResponseMessage GetAvailablePlayers(long accountId, long teamSeasonId, string lastName, string firstName, int page)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);

            var players = DataAccess.TeamRoster.GetAvailablePlayers(accountId, team.LeagueId, firstName, lastName).Skip((page - 1) * pageSize).Take(pageSize);
            var contactNames = players.Select(a => new ModelObjects.ContactName()
            {
                FirstName = a.FirstName,
                LastName = a.LastName,
                MiddleName = a.MiddleName,
                Id = a.Id,
                PhotoURL = a.PhotoURL
            });

            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, contactNames);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("players")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage SignPlayer(long accountId, long teamSeasonId, long id)
        {
            var players = DataAccess.TeamRoster.SignContact(accountId, teamSeasonId, id);
            return Request.CreateResponse<ModelObjects.Player>(HttpStatusCode.OK, players);
        }

    }
}

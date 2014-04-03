using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Baseball.Controllers
{
    public class LeaguesAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Leagues")]
        public HttpResponseMessage GetLeagues(long accountId)
        {
            var leagues = DataAccess.Leagues.GetLeagues(DataAccess.Seasons.GetCurrentSeason(accountId));
            if (leagues != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.League>>(HttpStatusCode.OK, leagues);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("LeagueManagers")]
        public HttpResponseMessage GetLeagueManagers(long accountId)
        {
            var leagueTeamManagers = new List<ModelObjects.TeamManager>();

            var leagueTeams = DataAccess.Leagues.GetLeagueTeamsFromSeason(accountId);
            foreach(var lt in leagueTeams)
            {
                var teamMgrs = DataAccess.Teams.GetTeamManagers(lt.TeamId);
                foreach(var m in teamMgrs)
                {
                    m.MiddleName += " (" + lt.Name + ")";
                    leagueTeamManagers.Add(m);
                }
            }

            return Request.CreateResponse<IEnumerable<ModelObjects.TeamManager>>(HttpStatusCode.OK, leagueTeamManagers);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("LeagueTeams")]
        public HttpResponseMessage GetLeagueTeams(long accountId)
        {
            var leagueTeams = DataAccess.Leagues.GetLeagueTeamsFromSeason(accountId);
            return Request.CreateResponse<IQueryable<ModelObjects.Team>>(HttpStatusCode.OK, leagueTeams);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Teams")]
        public HttpResponseMessage GetLeagueTeams(long accountId, long id)
        {

            var leagueTeams = DataAccess.Teams.GetTeams(id);
            return Request.CreateResponse<IQueryable<ModelObjects.Team>>(HttpStatusCode.OK, leagueTeams);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("UnassignedTeams")]
        public HttpResponseMessage UnassignedTeams(long accountId, long id)
        {
            var unassignedTeams = DataAccess.Teams.GetUnassignedTeams(id);
            if (unassignedTeams != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.Team>>(HttpStatusCode.OK, unassignedTeams);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("DivisionTeams")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage RemoveDivisionTeams(long accountId, long id)
        {
            var team = DataAccess.Teams.GetTeam(id);
            if (team != null)
            {
                var prevDivisionId = team.DivisionId;
                team.DivisionId = 0;
                if (DataAccess.Teams.ModifyTeam(team))
                {
                    var response = new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(prevDivisionId.ToString())
                    };

                    return response;
                }

                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("CopyLeagueSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage CopyLeagueSetup(long accountId, long id, ModelObjects.Season fromSeason)
        {
            if (!DataAccess.Leagues.CopySeasonLeague(id, fromSeason.Id))
                return Request.CreateResponse(HttpStatusCode.InternalServerError);

            // Create a 201 response.
            var response = new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent(id.ToString())
            };
            response.Headers.Location =
                new Uri(Url.Link("ActionApi", new { action = "Season", accountId = accountId, id = id }));
            return response;
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("LeagueSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage LeagueSetup(long accountId, long id, ModelObjects.League leagueData)
        {
            leagueData.AccountId = accountId;

            if (ModelState.IsValid && leagueData != null)
            {
                long newLeagueId = DataAccess.Leagues.AddLeague(leagueData, seasonId: id);
                if (newLeagueId == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(leagueData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "LeagueSetup", accountId = accountId, id = leagueData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("LeagueSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateLeagueSetup(long accountId, long id, ModelObjects.League leagueData)
        {
            leagueData.AccountId = accountId;
            leagueData.Id = id;

            if (ModelState.IsValid && leagueData != null)
            {
                if (!DataAccess.Leagues.ModifyLeague(leagueData))
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(leagueData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "LeagueSetup", accountId = accountId, id = leagueData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("LeagueSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> LeagueSetup(long accountId, long id)
        {
            bool removeSuccess = await DataAccess.Leagues.RemoveLeague(id);
            if (removeSuccess)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(id.ToString())
                };
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("DivisionSetup")]
        public HttpResponseMessage GetDivisionSetup(long accountId, long id)
        {
            var divisions = DataAccess.Divisions.GetDivisions(id);
            if (divisions != null)
            {
                var divTeams = (from d in divisions
                                select new ModelObjects.DivisionTeams()
                                {
                                    Id = d.Id,
                                    Name = d.Name,
                                    Priority = d.Priority,
                                    LeagueId = d.LeagueId,
                                    AccountId = d.AccountId,
                                    Teams = DataAccess.Teams.GetDivisionTeams(d.Id)
                                });

                return Request.CreateResponse<IQueryable<ModelObjects.DivisionTeams>>(HttpStatusCode.OK, divTeams);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }
        
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DivisionSetup(long accountId, long id)
        {
            if (DataAccess.Divisions.RemoveDivision(id))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(id.ToString())
                };
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateDivisionSetup(long accountId, long id, ModelObjects.Division divisionData)
        {
            divisionData.AccountId = accountId;

            if (ModelState.IsValid && divisionData != null)
            {
                DataAccess.Divisions.ModifyDivision(divisionData);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(divisionData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "DivisionSetup", accountId = accountId, id = divisionData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage DivisionSetup(long accountId, ModelObjects.Division divisionData)
        {
            divisionData.AccountId = accountId;

            if (ModelState.IsValid && divisionData != null)
            {
                long newDivId = DataAccess.Divisions.AddDivision(divisionData);
                if (newDivId == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(divisionData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "DivisionSetup", accountId = accountId, id = divisionData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("TeamDivision")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage TeamDivision(long accountId, long id, ModelObjects.Team teamData)
        {
            teamData.AccountId = accountId;
            teamData.LeagueId = id;

            if (ModelState.IsValid && teamData != null)
            {
                long newLeagueId = DataAccess.Teams.AddTeam(teamData);
                if (newLeagueId == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                var team = DataAccess.Teams.GetTeam(newLeagueId);
                var response = Request.CreateResponse<ModelObjects.Team>(HttpStatusCode.Created, team);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Teams", accountId = accountId, id = teamData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("TeamDivision")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateTeamDivision(long accountId, long id, ModelObjects.Team teamData)
        {
            var team = DataAccess.Teams.GetTeam(teamData.Id);
            if (team != null)
            {
                team.DivisionId = id;
                if (DataAccess.Teams.ModifyTeam(team))
                {
                    // Create a 201 response.
                    var response = Request.CreateResponse<ModelObjects.Team>(HttpStatusCode.OK, team);
                    response.Headers.Location =
                        new Uri(Url.Link("ActionApi", new { action = "Teams", accountId = accountId, id = team.Id }));
                    return response;
                }

                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}

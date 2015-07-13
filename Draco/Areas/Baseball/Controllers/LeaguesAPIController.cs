using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Baseball.Controllers
{
    public class LeaguesAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Leagues")]
        public HttpResponseMessage GetLeagues(long accountId, long? id = 0)
        {
            long seasonId = (id.HasValue && id.GetValueOrDefault() != 0) ? id.Value : m_db.CurrentSeasons.Find(accountId).SeasonId;

            var leagues = (from ls in m_db.LeagueSeasons
                           where ls.SeasonId == seasonId
                           select ls);
            if (leagues != null)
            {
                var vm = Mapper.Map<IEnumerable<LeagueSeason>, LeagueViewModel[]>(leagues);
                return Request.CreateResponse<LeagueViewModel[]>(HttpStatusCode.OK, vm);
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
            var leagueTeamManagers = new List<TeamManagerViewModel>();

            long currentSeason = m_db.CurrentSeasons.Find(accountId).SeasonId;

            var leagueTeams = (from ls in m_db.LeagueSeasons
                               join ts in m_db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                               where ls.SeasonId == currentSeason
                               orderby ls.League.Name, ts.Name
                               select ts);
            if (leagueTeams != null)
            {
                foreach (var lt in leagueTeams)
                {
                    var vms = Mapper.Map<IEnumerable<TeamManager>, List<TeamManagerViewModel>>(lt.TeamSeasonManagers);
                    if (vms != null && vms.Any())
                        leagueTeamManagers.AddRange(vms);
                }
            }

            return Request.CreateResponse<IEnumerable<TeamManagerViewModel>>(HttpStatusCode.OK, leagueTeamManagers);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("LeagueTeams")]
        public HttpResponseMessage GetLeagueTeams(long accountId, long? id = null)
        {
            long seasonId = (id.HasValue && id.GetValueOrDefault() != 0) ? id.Value : m_db.CurrentSeasons.Find(accountId).SeasonId;

            var teams = (from ls in m_db.LeagueSeasons
                    join ts in m_db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    where ls.SeasonId == seasonId
                    orderby ls.League.Name, ts.Name
                    select ts);     
       
            var leagueTeams = Mapper.Map<IEnumerable<TeamSeason>, TeamViewModel[]>(teams);
            return Request.CreateResponse<TeamViewModel[]>(HttpStatusCode.OK, leagueTeams);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Teams")]
        public HttpResponseMessage GetLeagueTeams(long accountId, long id)
        {
            var teams = (from ts in m_db.TeamsSeasons
                         where ts.LeagueSeasonId == id
                         orderby ts.DivisionSeasonId
                         select ts);

            var leagueTeams = Mapper.Map<IEnumerable<TeamSeason>, TeamViewModel[]>(teams);
            return Request.CreateResponse<TeamViewModel[]>(HttpStatusCode.OK, leagueTeams);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("UnassignedTeams")]
        public HttpResponseMessage UnassignedTeams(long accountId, long id)
        {

            var teams = (from ts in m_db.TeamsSeasons
                         where ts.LeagueSeasonId == id && ts.DivisionSeasonId == 0
                         orderby ts.Name
                         select ts);

            if (teams != null)
            {
                var unassignedTeams = Mapper.Map<IEnumerable<TeamSeason>, TeamViewModel[]>(teams);
                return Request.CreateResponse<TeamViewModel[]>(HttpStatusCode.OK, unassignedTeams);
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
            var queryValues = Request.RequestUri.ParseQueryString();
            String strReleasePlayers = queryValues["r"] ?? "f";

            bool releasePlayers = strReleasePlayers.Equals("t");

            var team = m_db.TeamsSeasons.Find(id);  
            if (team != null)
            {
                var prevDivisionId = team.DivisionSeasonId;
                team.DivisionSeasonId = 0;

                if (releasePlayers)
                {
                    var dbPlayers = (from rs in m_db.RosterSeasons
                                     where rs.TeamSeasonId == team.Id
                                     select rs);

                    foreach (var p in dbPlayers)
                        p.Inactive = true;


                    m_db.TeamSeasonManagers.RemoveRange(team.TeamSeasonManagers);
                }

                m_db.SaveChanges();

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(prevDivisionId.ToString())
                };

                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("CopyLeagueSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage CopyLeagueSetup(long accountId, long id, long fromSeasonId)
        {
            var leagues = (from ls in m_db.LeagueSeasons
                           where ls.SeasonId == fromSeasonId
                           select ls).ToList();
            leagues.ForEach(ls =>
            {
                var newls = new LeagueSeason()
                {
                    LeagueId = ls.LeagueId,
                    SeasonId = id
                };

                m_db.LeagueSeasons.Add(newls);

                ls.DivisionSeasons.ToList().ForEach(ds =>
                {
                    var newDiv = new DivisionSeason()
                    {
                        DivisionId = ds.DivisionId,
                        LeagueSeason = newls,
                        Priority = ds.Priority
                    };

                    m_db.DivisionSeasons.Add(newDiv);

                    var teams = (from ts in m_db.TeamsSeasons
                                 where ts.LeagueSeasonId == ls.Id
                                 select ts).ToList();

                    teams.ForEach(ts =>
                    {
                        var newTeam = new TeamSeason()
                        {
                            LeagueSeasonId = ls.Id,
                            TeamId = ts.TeamId,
                            Name = ts.Name,
                            DivisionSeason = newDiv
                        };

                        m_db.TeamsSeasons.Add(newTeam);

                        ts.Roster.ToList().ForEach(r =>
                        {
                            if (!r.Inactive)
                            {
                                var newPlayer = new PlayerSeason()
                                {
                                    PlayerId = r.PlayerId,
                                    TeamSeason = newTeam,
                                    PlayerNumber = r.PlayerNumber,
                                    DateAdded = r.DateAdded,
                                    Inactive = false,
                                    SubmittedWaiver = false
                                };

                                m_db.RosterSeasons.Add(newPlayer);
                            }
                        });

                        ts.TeamSeasonManagers.ToList().ForEach(m =>
                            {
                                var newManager = new TeamManager()
                                {
                                    TeamsSeason = newTeam,
                                    ContactId = m.ContactId
                                };

                                m_db.TeamSeasonManagers.Add(newManager);
                            });
                    });
                });
            });

            m_db.SaveChanges();

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
        public HttpResponseMessage LeagueSetup(long accountId, LeagueSetupViewModel leagueData)
        {
            if (ModelState.IsValid && leagueData != null)
            {
                var leagueDef = (from ld in m_db.Leagues
                                 where ld.AccountId == accountId && ld.Name == leagueData.Name
                                 select ld).SingleOrDefault();
                if (leagueDef == null)
                {
                    leagueDef = new LeagueDefinition()
                    {
                        AccountId = accountId,
                        Name = leagueData.Name
                    };

                    m_db.Leagues.Add(leagueDef);
                }

                LeagueSeason leagueSeason = new LeagueSeason()
                {
                    League = leagueDef,
                    SeasonId = leagueData.SeasonId
                };

                m_db.LeagueSeasons.Add(leagueSeason);

                m_db.SaveChanges();

                if (leagueSeason.Id == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(leagueSeason.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "LeagueSetup", accountId = accountId, id = leagueSeason.Id }));
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
        public HttpResponseMessage UpdateLeagueSetup(long accountId, LeagueSetupViewModel leagueData)
        {
            if (ModelState.IsValid && leagueData != null)
            {
                var leagueDef = m_db.LeagueSeasons.Find(leagueData.Id);
                if (leagueDef == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                leagueDef.League.Name = leagueData.Name;
                m_db.SaveChanges();

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
        [ActionName("Divisions")]
        public HttpResponseMessage GetDivisions(long accountId, long id)
        {
            var divisions = (from d in m_db.DivisionSeasons
                             where d.Id == id
                             select d).OrderBy(d => d.Priority).ThenBy(d => d.DivisionDef.Name).AsEnumerable();
                             
            var dvm = Mapper.Map<IEnumerable<DivisionSeason>, DivisionViewModel[]>(divisions);

            return Request.CreateResponse<DivisionViewModel[]>(HttpStatusCode.OK, dvm);
        }
        

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("DivisionSetup")]
        public HttpResponseMessage GetDivisionSetup(long accountId, long id)
        {
            var divisions = (from ds in m_db.DivisionSeasons
                    join dd in m_db.DivisionDefs on ds.DivisionId equals dd.Id
                    where ds.LeagueSeasonId == id
                    orderby ds.Priority ascending, dd.Name ascending
                    select ds).AsEnumerable();

            if (divisions != null)
            {
                var vm = Mapper.Map<IEnumerable<DivisionSeason>, DivisionSetupViewModel[]>(divisions);
                return Request.CreateResponse<IEnumerable<DivisionSetupViewModel>>(HttpStatusCode.OK, vm);
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
            var divSeason = m_db.DivisionSeasons.Find(id);
            if (divSeason == null)
                return new HttpResponseMessage(HttpStatusCode.NotFound);
                
            m_db.DivisionSeasons.Remove(divSeason);

            foreach(var team in divSeason.TeamsSeasons)
                team.DivisionSeasonId = 0;

            bool divisionInUse = divSeason.DivisionDef.DivisionSeasons.Count > 1;
            if (!divisionInUse)
            {
                m_db.DivisionDefs.Remove(divSeason.DivisionDef);
            }

            m_db.SaveChanges();

            return new HttpResponseMessage(HttpStatusCode.OK);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateDivisionSetup(long accountId, long id, DivisionViewModel divisionData)
        {
            if (ModelState.IsValid && divisionData != null)
            {
                var division = m_db.DivisionSeasons.Find(id);

                if (division != null)
                {
                    division.Priority = divisionData.Priority;
                    division.DivisionDef.Name = divisionData.Name;
                    m_db.SaveChanges();

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
                    return new HttpResponseMessage(HttpStatusCode.NotFound);
                }
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage DivisionSetup(long accountId, DivisionSetupViewModel divisionData)
        {
            divisionData.AccountId = accountId;

            if (ModelState.IsValid && divisionData != null)
            {
                var divisionDef = new DivisionDefinition()
                {
                    AccountId = divisionData.AccountId,
                    Name = divisionData.Name
                };

                var divisionSeason = new DivisionSeason()
                {
                    DivisionDef = divisionDef,
                    LeagueSeasonId = divisionData.LeagueSeasonId,
                    Priority = divisionData.Priority
                };

                m_db.DivisionSeasons.Add(divisionSeason);
                m_db.SaveChanges();

                if (divisionSeason.Id == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(divisionSeason.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "DivisionSetup", accountId = accountId, id = divisionSeason.Id }));
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
        public HttpResponseMessage TeamDivision(long accountId, long id, TeamViewModel teamData)
        {
            teamData.AccountId = accountId;
            teamData.LeagueSeasonId = id;

            if (ModelState.IsValid && teamData != null)
            {
                Team dbTeam = new Team()
                {
                    AccountId = accountId,
                    WebAddress = String.Empty,
                    YouTubeUserId = String.Empty,
                    DefaultVideo = String.Empty
                };

                int nameLength = 25;

                teamData.Name = teamData.Name.Trim();

                TeamSeason dbTeamSeason = new TeamSeason()
                {
                    LeagueSeasonId = teamData.LeagueSeasonId,
                    Team = dbTeam,
                    DivisionSeasonId = teamData.DivisionSeasonId,
                    Name = teamData.Name.Length <= nameLength ? teamData.Name : teamData.Name.Substring(0, nameLength)
                };

                m_db.TeamsSeasons.Add(dbTeamSeason);
                m_db.SaveChanges();

                if (dbTeamSeason.Id == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                var vm = Mapper.Map<TeamSeason, TeamViewModel>(dbTeamSeason);
                var response = Request.CreateResponse<TeamViewModel>(HttpStatusCode.Created, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Teams", accountId = accountId, id = dbTeamSeason.Id }));
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
        public HttpResponseMessage UpdateTeamDivision(long accountId, long id, TeamViewModel teamData)
        {
            if (teamData != null && ModelState.IsValid)
            {
                var team = m_db.TeamsSeasons.Find(teamData.Id);
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                team.DivisionSeasonId = id;
                team.Name = teamData.Name.Trim();
                m_db.SaveChanges();

                // Create a 201 response.
                var vm = Mapper.Map<TeamSeason, TeamViewModel>(team);
                var response = Request.CreateResponse<TeamViewModel>(HttpStatusCode.OK, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Teams", accountId = accountId, id = team.Id }));
                return response;
            }
            else
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
        }
    }
}

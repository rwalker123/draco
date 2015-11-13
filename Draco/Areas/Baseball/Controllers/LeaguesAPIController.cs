using AutoMapper;
using ModelObjects;
using SportsManager.Baseball.ViewModels.API;
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
        public LeaguesAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Leagues")]
        public HttpResponseMessage GetLeagues(long accountId, long? id = 0)
        {
            long seasonId = (id.HasValue && id.GetValueOrDefault() != 0) ? id.Value : Db.CurrentSeasons.Find(accountId).SeasonId;

            var leagues = (from ls in Db.LeagueSeasons
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

            long currentSeason = Db.CurrentSeasons.Find(accountId).SeasonId;

            var leagueTeams = (from ls in Db.LeagueSeasons
                               join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
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
            long seasonId = 0;
            if (id.HasValue)
            {
                seasonId = id.Value;
            }
            else
            {
                var curSeason = Db.CurrentSeasons.Find(accountId);
                if (curSeason != null)
                    seasonId = curSeason.SeasonId;
            }

            var teams = (from ls in Db.LeagueSeasons
                    join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
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
            var teams = (from ts in Db.TeamsSeasons
                         where ts.LeagueSeasonId == id && ts.DivisionSeasonId != 0
                         orderby ts.DivisionSeasonId
                         select ts);

            var leagueTeams = Mapper.Map<IEnumerable<TeamSeason>, TeamViewModel[]>(teams);
            return Request.CreateResponse<TeamViewModel[]>(HttpStatusCode.OK, leagueTeams);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("UnassignedTeams")]
        public HttpResponseMessage UnassignedTeams(long accountId, long id)
        {

            var teams = (from ts in Db.TeamsSeasons
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
        public async Task<HttpResponseMessage> RemoveDivisionTeams(long accountId, long id)
        {
            var queryValues = Request.RequestUri.ParseQueryString();
            String strReleasePlayers = queryValues["r"] ?? "f";

            bool releasePlayers = strReleasePlayers.Equals("t");

            var team = await Db.TeamsSeasons.FindAsync(id);  
            if (team != null)
            {
                if (team.Team.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var prevDivisionId = team.DivisionSeasonId;
                team.DivisionSeasonId = 0;

                if (releasePlayers)
                {
                    var dbPlayers = (from rs in Db.RosterSeasons
                                     where rs.TeamSeasonId == team.Id
                                     select rs);

                    foreach (var p in dbPlayers)
                        p.Inactive = true;


                    Db.TeamSeasonManagers.RemoveRange(team.TeamSeasonManagers);
                }

                await Db.SaveChangesAsync();

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
        public async Task<HttpResponseMessage> CopyLeagueSetup(long accountId, long id, CopySeasonViewModel fromSeason)
        {
            var season = await Db.Seasons.FindAsync(fromSeason.Id);
            if (season == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (season.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var toSeason = await Db.Seasons.FindAsync(id);
            if (toSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (toSeason.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var leagues = (from ls in Db.LeagueSeasons
                           where ls.SeasonId == fromSeason.Id
                           select ls).ToList();
            leagues.ForEach(ls =>
            {
                var newls = new LeagueSeason()
                {
                    LeagueId = ls.LeagueId,
                    SeasonId = id
                };

                Db.LeagueSeasons.Add(newls);

                ls.DivisionSeasons.ToList().ForEach(ds =>
                {
                    var newDiv = new DivisionSeason()
                    {
                        DivisionId = ds.DivisionId,
                        LeagueSeason = newls,
                        Priority = ds.Priority
                    };

                    Db.DivisionSeasons.Add(newDiv);

                    var teams = ds.TeamsSeasons.ToList(); 

                    teams.ForEach(ts =>
                    {
                        var newTeam = new TeamSeason()
                        {
                            LeagueSeason = newls,
                            TeamId = ts.TeamId,
                            Name = ts.Name,
                            DivisionSeason = newDiv
                        };

                        Db.TeamsSeasons.Add(newTeam);

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

                                Db.RosterSeasons.Add(newPlayer);
                            }
                        });

                        ts.TeamSeasonManagers.ToList().ForEach(m =>
                            {
                                var newManager = new TeamManager()
                                {
                                    TeamsSeason = newTeam,
                                    ContactId = m.ContactId
                                };

                                Db.TeamSeasonManagers.Add(newManager);
                            });
                    });
                });
            });

            await Db.SaveChangesAsync();

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
        public async Task<HttpResponseMessage> LeagueSetup(long accountId, long id, LeagueSetupViewModel leagueData)
        {
            if (ModelState.IsValid)
            {
                var season = await Db.Seasons.FindAsync(id);
                if (season == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (season.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var leagueDef = (from ld in Db.Leagues
                                 where ld.AccountId == accountId && ld.Name == leagueData.Name
                                 select ld).SingleOrDefault();
                if (leagueDef == null)
                {
                    leagueDef = new LeagueDefinition()
                    {
                        AccountId = accountId,
                        Name = leagueData.Name
                    };

                    Db.Leagues.Add(leagueDef);
                }

                LeagueSeason leagueSeason = new LeagueSeason()
                {
                    League = leagueDef,
                    SeasonId = id
                };

                Db.LeagueSeasons.Add(leagueSeason);

                await Db.SaveChangesAsync();

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
        public async Task<HttpResponseMessage> UpdateLeagueSetup(long accountId, long id, LeagueSetupViewModel leagueData)
        {
            if (ModelState.IsValid)
            {
                var leagueDef = await Db.LeagueSeasons.FindAsync(id);
                if (leagueDef == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (leagueDef.League.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                leagueDef.League.Name = leagueData.Name;
                await Db.SaveChangesAsync();

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
        public HttpResponseMessage LeagueSetup(long accountId, long id)
        {
            var league = Db.LeagueSeasons.Find(id);
            if (league == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (league.League.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            RemoveLeagueSeason(league);

            RemoveUnusedLeagues(accountId);
            RemoveUnusedDivisions(accountId);
            RemoveUnusedContacts(accountId);

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Divisions")]
        public HttpResponseMessage GetDivisions(long accountId, long id)
        {
            var divisions = (from d in Db.DivisionSeasons
                             where d.LeagueSeasonId == id
                             select d).OrderBy(d => d.Priority).ThenBy(d => d.DivisionDef.Name).AsEnumerable();
                             
            var dvm = Mapper.Map<IEnumerable<DivisionSeason>, DivisionViewModel[]>(divisions);

            return Request.CreateResponse<DivisionViewModel[]>(HttpStatusCode.OK, dvm);
        }
        

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("DivisionSetup")]
        public HttpResponseMessage GetDivisionSetup(long accountId, long id)
        {
            var divisions = (from ds in Db.DivisionSeasons
                    join dd in Db.DivisionDefs on ds.DivisionId equals dd.Id
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
        public async Task<HttpResponseMessage> DivisionSetup(long accountId, long id)
        {
            var divSeason = await Db.DivisionSeasons.FindAsync(id);
            if (divSeason == null)
                return new HttpResponseMessage(HttpStatusCode.NotFound);

            if (divSeason.DivisionDef.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            bool divisionInUse = divSeason.DivisionDef.DivisionSeasons?.Count > 1;

            foreach(var team in divSeason.TeamsSeasons)
                team.DivisionSeasonId = 0;

            if (!divisionInUse)
            {
                Db.DivisionDefs.Remove(divSeason.DivisionDef);
            }
            else
            {
                Db.DivisionSeasons.Remove(divSeason);
            }

            await Db.SaveChangesAsync();

            return new HttpResponseMessage(HttpStatusCode.OK);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> UpdateDivisionSetup(long accountId, long id, DivisionViewModel divisionData)
        {
            if (ModelState.IsValid)
            {
                var division = await Db.DivisionSeasons.FindAsync(id);

                if (division != null)
                {
                    if (division.DivisionDef.AccountId != accountId)
                        return Request.CreateResponse(HttpStatusCode.Forbidden);

                    division.Priority = divisionData.Priority;
                    division.DivisionDef.Name = divisionData.Name;
                    await Db.SaveChangesAsync();

                    var vm = Mapper.Map<DivisionSeason, DivisionSetupViewModel>(division);
                    return Request.CreateResponse<DivisionSetupViewModel>(HttpStatusCode.OK, vm);
                }
                else
                {
                    return new HttpResponseMessage(HttpStatusCode.NotFound);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("DivisionSetup")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public async Task<HttpResponseMessage> DivisionSetup(long accountId, DivisionSetupViewModel divisionData)
        {
            if (ModelState.IsValid)
            {
                var divisionDef = new DivisionDefinition()
                {
                    AccountId = accountId,
                    Name = divisionData.Name
                };

                var divisionSeason = new DivisionSeason()
                {
                    DivisionDef = divisionDef,
                    LeagueSeasonId = divisionData.LeagueSeasonId,
                    Priority = divisionData.Priority
                };

                Db.DivisionSeasons.Add(divisionSeason);
                await Db.SaveChangesAsync();

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
        public async Task<HttpResponseMessage> TeamDivision(long accountId, long id, TeamViewModel teamData)
        {
            teamData.AccountId = accountId;
            teamData.LeagueSeasonId = id;

            if (ModelState.IsValid)
            {
                Team dbTeam = new Team()
                {
                    AccountId = accountId,
                    WebAddress = String.Empty,
                    YouTubeUserId = String.Empty,
                    DefaultVideo = String.Empty
                };

                TeamSeason dbTeamSeason = new TeamSeason()
                {
                    LeagueSeasonId = id,
                    Team = dbTeam,
                    DivisionSeasonId = teamData.DivisionSeasonId,
                    Name = teamData.Name
                };

                Db.TeamsSeasons.Add(dbTeamSeason);
                await Db.SaveChangesAsync();

                if (dbTeamSeason.Id == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                var vm = Mapper.Map<TeamSeason, TeamViewModel>(dbTeamSeason);
                var response = Request.CreateResponse<TeamViewModel>(HttpStatusCode.Created, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Teams", accountId = accountId, id = dbTeamSeason.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("TeamDivision")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> UpdateTeamDivision(long accountId, long id, TeamViewModel teamData)
        {
            var div = await Db.DivisionSeasons.FindAsync(id);
            if (div == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (div.DivisionDef.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var team = await Db.TeamsSeasons.FindAsync(teamData.Id);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (team.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            team.DivisionSeasonId = id;
            await Db.SaveChangesAsync();

            // Create a 201 response.
            var vm = Mapper.Map<TeamSeason, TeamViewModel>(team);
            var response = Request.CreateResponse<TeamViewModel>(HttpStatusCode.OK, vm);
            response.Headers.Location =
                new Uri(Url.Link("ActionApi", new { action = "Teams", accountId = accountId, id = team.Id }));
            return response;
        }
    }
}

using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class SeasonsApiController : DBApiController
    {
        public SeasonsApiController(DB db) : base(db)
        {

        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Seasons")]
        public HttpResponseMessage GetSeasons(long accountId)
        {
            var seasons = Db.Seasons.Where(s => s.AccountId == accountId).AsEnumerable();
            if (seasons != null)
            {
                var vm = Mapper.Map<IEnumerable<Season>, SeasonViewModel[]>(seasons);
                return Request.CreateResponse<SeasonViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> CreateSeason(long accountId, SeasonViewModel seasonData)
        {
            if (ModelState.IsValid)
            {
                var newSeason = new Season()
                {
                    AccountId = accountId,
                    Name = seasonData.Name
                };

                Db.Seasons.Add(newSeason);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<Season, SeasonViewModel>(newSeason);
                return Request.CreateResponse<SeasonViewModel>(HttpStatusCode.OK, vm);
            }
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> EditSeason(long accountId, long id, SeasonViewModel seasonData)
        {
            if (ModelState.IsValid)
            {
                var dbSeason = await Db.Seasons.FindAsync(id);
                if (dbSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbSeason.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbSeason.Name = seasonData.Name;
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<Season, SeasonViewModel>(dbSeason);
                return Request.CreateResponse<SeasonViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("CurrentSeason")]
        public async Task<HttpResponseMessage> CurrentSeason(long accountId)
        {
            var cs = GetCurrentSeason(accountId);
            if (cs == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var season = await Db.Seasons.FindAsync(cs.SeasonId);
            var hasSeasons = Db.Seasons.Where(s => s.AccountId == accountId).Any();

            return Request.CreateResponse<CurrentSeasonViewModel>(HttpStatusCode.OK,
                new CurrentSeasonViewModel()
                {
                    AccountId = accountId,
                    HasSeasons = hasSeasons,
                    SeasonId = season == null ? 0 : season.Id,
                    SeasonName = season == null ? String.Empty : season.Name
                });
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("CurrentSeason")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> EditCurrentSeason(long accountId, long id)
        {
            var curSeason = (from cs in Db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs).SingleOrDefault();
            if (id == 0)
            {
                if (curSeason != null)
                    Db.CurrentSeasons.Remove(curSeason);
            }
            else if (curSeason == null)
            {
                curSeason = new CurrentSeason()
                {
                    AccountId = accountId,
                    SeasonId = id
                };

                Db.CurrentSeasons.Add(curSeason);
            }
            else
            {
                curSeason.SeasonId = id;
            }

            await Db.SaveChangesAsync();


            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> Delete(long accountId, long id)
        {
            var season = await Db.Seasons.FindAsync(id);
            if (season == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (season.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            RemoveSeasonData(season);
            Db.Seasons.Remove(season);
            await Db.SaveChangesAsync();

            //
            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        private CurrentSeason GetCurrentSeason(long accountId)
        {
            return (from cs in Db.CurrentSeasons
                    where cs.AccountId == accountId
                    select cs).SingleOrDefault();
        }

        private string GetCurrentSeasonName(long accountId)
        {
            return (from cs in Db.CurrentSeasons
                    join s in Db.Seasons on cs.AccountId equals s.AccountId
                    where cs.SeasonId == s.Id && cs.AccountId == accountId
                    select s.Name).SingleOrDefault();
        }

        private void RemoveSeasonData(Season season)
        {
            var leagueList = season.LeagueSeasons.ToList();
            while (leagueList.Any())
            {
                var l = leagueList.First();
                RemoveLeagueSeason(l);
                leagueList.Remove(l);
            }

            var currentSeason = GetCurrentSeason(season.AccountId);
            if (currentSeason != null && currentSeason.SeasonId == season.Id)
            {
                currentSeason.SeasonId = 0;
            }

            // do some cleanup.
            RemoveUnusedLeagues(season.AccountId);
            RemoveUnusedDivisions(season.AccountId);
            RemoveUnusedContacts(season.AccountId);
        }
    }
}

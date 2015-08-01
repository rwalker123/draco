using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels;
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
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Seasons")]
        public HttpResponseMessage GetSeasons(long accountId)
        {
            var seasons = m_db.Seasons.Where(s => s.AccountId == accountId).AsEnumerable();
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
        public HttpResponseMessage CreateSeason(long accountId, SeasonViewModel seasonData)
        {
            if (ModelState.IsValid)
            {
                var newSeason = new Season()
                {
                    AccountId = accountId,
                    Name = seasonData.Name
                };

                m_db.Seasons.Add(newSeason);
                m_db.SaveChanges();

                var vm = Mapper.Map<Season, SeasonViewModel>(newSeason);
                return Request.CreateResponse<SeasonViewModel>(HttpStatusCode.OK, vm);
            }
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage EditSeason(long accountId, long id, SeasonViewModel seasonData)
        {
            if (ModelState.IsValid)
            {
                var dbSeason = m_db.Seasons.Find(id);
                if (dbSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbSeason.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbSeason.Name = seasonData.Name;
                m_db.SaveChanges();

                var vm = Mapper.Map<Season, SeasonViewModel>(dbSeason);
                return Request.CreateResponse<SeasonViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("CurrentSeason")]
        public HttpResponseMessage CurrentSeason(long accountId)
        {
            var cs = GetCurrentSeason(accountId);
            if (cs == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var season = m_db.Seasons.Find(cs.SeasonId);
            var hasSeasons = m_db.Seasons.Where(s => s.AccountId == accountId).Any();

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
        public HttpResponseMessage EditCurrentSeason(long accountId, long id)
        {
            var curSeason = (from cs in m_db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs).SingleOrDefault();
            if (id == 0)
            {
                if (curSeason != null)
                    m_db.CurrentSeasons.Remove(curSeason);
            }
            else if (curSeason == null)
            {
                curSeason = new CurrentSeason()
                {
                    AccountId = accountId,
                    SeasonId = id
                };

                m_db.CurrentSeasons.Add(curSeason);
            }
            else
            {
                curSeason.SeasonId = id;
            }

            m_db.SaveChanges();


            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage Delete(long accountId, long id)
        {
            var season = m_db.Seasons.Find(id);
            if (season == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (season.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            RemoveSeasonData(season);
            m_db.Seasons.Remove(season);
            m_db.SaveChanges();

            //
            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        private CurrentSeason GetCurrentSeason(long accountId)
        {
            return (from cs in m_db.CurrentSeasons
                    where cs.AccountId == accountId
                    select cs).SingleOrDefault();
        }

        private string GetCurrentSeasonName(long accountId)
        {
            return (from cs in m_db.CurrentSeasons
                    join s in m_db.Seasons on cs.AccountId equals s.AccountId
                    where cs.SeasonId == s.Id && cs.AccountId == accountId
                    select s.Name).SingleOrDefault();
        }

        private void RemoveSeasonData(Season season)
        {
            foreach (var ls in season.LeagueSeasons)
            {
                RemoveLeagueSeason(ls);
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

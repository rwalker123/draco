using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class SeasonsApiController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Seasons")]
        public HttpResponseMessage GetSeasons(long accountId)
        {
            var seasons = DataAccess.Seasons.GetSeasons(accountId);
            if (seasons != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.Season>>(HttpStatusCode.OK, seasons);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage CreateSeason(long accountId, ModelObjects.Season seasonData)
        {
            seasonData.AccountId = accountId;

            if (ModelState.IsValid && seasonData != null)
            {
                long seasonId = DataAccess.Seasons.AddSeason(seasonData);
                if (seasonId == 0)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(seasonId.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Seasons", accountId = accountId, id = seasonId }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage EditSeason(long accountId, long id, ModelObjects.Season seasonData)
        {
            seasonData.AccountId = accountId;
            seasonData.Id = id;

            if (ModelState.IsValid && seasonData != null)
            {
                if (!DataAccess.Seasons.ModifySeason(seasonData))
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Season", accountId = accountId, id = id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("CurrentSeason")]
        public HttpResponseMessage CurrentSeason(long accountId)
        {
            var currentSeason = DataAccess.Seasons.GetSeason(DataAccess.Seasons.GetCurrentSeason(accountId));
            var hasSeasons = DataAccess.Seasons.GetSeasons(accountId).Any();

            return Request.CreateResponse<ModelObjects.CurrentSeasonInfo>(HttpStatusCode.OK,
                new ModelObjects.CurrentSeasonInfo()
                {
                    AccountId = accountId,
                    HasSeasons = hasSeasons,
                    SeasonId = currentSeason == null ? 0 : currentSeason.Id,
                    SeasonName = currentSeason == null ? String.Empty : currentSeason.Name
                });
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("CurrentSeason")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage EditCurrentSeason(long accountId, long id)
        {
            DataAccess.Seasons.SetCurrentSeason(id, accountId);

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(DataAccess.Seasons.GetCurrentSeason(accountId).ToString())
            };
            response.Headers.Location =
                new Uri(Url.Link("ActionApi", new { action = "Curent", accountId = accountId, id = id }));
            return response;
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Season")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> Delete(long accountId, long id)
        {
            bool removeSuccess = await DataAccess.Seasons.RemoveSeason(id);
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


    }
}

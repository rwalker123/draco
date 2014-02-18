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
    public class WorkoutsAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("workouts")]
        public HttpResponseMessage GetWorkouts(long accountId)
        {
            var workouts = DataAccess.Workouts.GetWorkoutAnnouncementsWithRegistered(accountId);
            if (workouts != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.WorkoutAnnouncement>>(HttpStatusCode.OK, workouts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("whereheard")]
        public async Task<HttpResponseMessage> GetWhereHeard(long accountId)
        {
            var whereHeard = await DataAccess.Workouts.GetWorkoutWhereHeard(accountId);
            if (whereHeard != null)
            {
                return Request.CreateResponse<IEnumerable<String>>(HttpStatusCode.OK, whereHeard);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("activeworkouts")]
        public HttpResponseMessage GetActiveWorkouts(long accountId)
        {
            var workouts = DataAccess.Workouts.GetActiveWorkoutAnnouncements(accountId);
            if (workouts != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.WorkoutAnnouncement>>(HttpStatusCode.OK, workouts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("workouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddWorkout(long accountId, ModelObjects.WorkoutAnnouncement workoutData)
        {
            workoutData.AccountId = accountId;

            if (ModelState.IsValid && workoutData != null)
            {
                bool success = DataAccess.Workouts.AddWorkoutAnnouncement(workoutData);
                if (!success)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(workoutData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Workouts", accountId = accountId, id = workoutData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }
    }
}

using DataAccess;
using Microsoft.Owin.Security;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
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
                return Request.CreateResponse<IEnumerable<String>>(HttpStatusCode.OK, whereHeard.OrderBy(o => o));
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
                var response = Request.CreateResponse<ModelObjects.WorkoutAnnouncement>(HttpStatusCode.Created, workoutData);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Workouts", accountId = accountId, id = workoutData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("register")]
        public HttpResponseMessage RegisterWorkout(long accountId, long id, ModelObjects.WorkoutRegistrant workoutData)
        {
            workoutData.WorkoutId = id;

            if (ModelState.IsValid && workoutData != null)
            {
                bool success = DataAccess.WorkoutRegistrants.AddWorkoutRegistrant(workoutData);
                if (!success)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(workoutData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "registereduser", accountId = accountId, id = workoutData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        public class EmailData
        {
            public String Subject;
            public String Message;
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("registrants")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage GetRegistrantsForWorkout(long accountId, long id)
        {
            var workouts = DataAccess.WorkoutRegistrants.GetWorkoutRegistrants(id);
            if (workouts != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.WorkoutRegistrant>>(HttpStatusCode.OK, workouts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("email")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage EmailRegistrants(long accountId, long id, EmailData emailData)
        {
            var workoutId = id;

            if (ModelState.IsValid && emailData != null)
            {
                String failedSends = DataAccess.WorkoutRegistrants.EmailRegistrants(workoutId, emailData.Subject, emailData.Message);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(failedSends)
                };
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }


        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("workouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage ModifyWorkout(long accountId, ModelObjects.WorkoutAnnouncement workoutData)
        {
            workoutData.AccountId = accountId;
            
            if (ModelState.IsValid && workoutData != null)
            {
                bool success = DataAccess.Workouts.ModifyWorkoutAnnouncement(workoutData);
                if (!success)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                // Create a 201 response.
                return Request.CreateResponse<ModelObjects.WorkoutAnnouncement>(HttpStatusCode.OK, workoutData);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("twitter")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostTwitter(long accountId, long id)
        {
            return Request.CreateResponse(HttpStatusCode.NotImplemented);

            //var properties = new AuthenticationProperties() { RedirectUri = RedirectUri };
            //HttpContext.Current.GetOwinContext().Authentication.Challenge(properties, LoginProvider);

            //var wa = DataAccess.Workouts.GetWorkoutAnnouncement(id);
            //if (wa != null)
            //{
            //    string uri = Globals.GetURLFromRequest(System.Web.HttpContext.Current.Request) + "Forms/RegisterWorkout.aspx?id=" + m_workoutId.ToString();

            //    bool isTwitterConfigured = DataAccess.SocialIntegration.Twitter.SetupTwitterStatusUpdate(Server.UrlEncode(String.Format("{0} @ {1} {2} {3}. Click link to register! http://{4}", wa.Description, wa.WorkoutDate.ToString("M"), wa.WorkoutTime.ToString("t"), DataAccess.Fields.GetFieldName(wa.WorkoutLocation), uri)));
            //    if (isTwitterConfigured)
            //    {
            //        Session["TwitterRefererPage"] = "~/Default.aspx";
            //        Response.Redirect("~/Twitter/TwitterAPI.aspx");
            //    }
            //}
        }

        [AcceptVerbs("DELETE"), HttpPost]
        [ActionName("workouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteWorkout(long accountId, long id)
        {
            if (DataAccess.Workouts.RemoveWorkoutAnnouncement(id))
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("whereheard")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostWhereHeard(long accountId, WorkoutWhereHeard whereHeardData)
        {
            if (ModelState.IsValid && whereHeardData != null)
            {
                DataAccess.Workouts.UpdateWhereHeardOptions(accountId, whereHeardData.WhereHeardList);

                // Create a 201 response.
                return Request.CreateResponse(HttpStatusCode.Created);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }
    }
}

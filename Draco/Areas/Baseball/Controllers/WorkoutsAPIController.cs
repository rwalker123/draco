using AutoMapper;
using LinqToTwitter;
using ModelObjects;
using SportsManager.Baseball.ViewModels.API;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml.Serialization;

namespace SportsManager.Baseball.Controllers
{
    public class WorkoutsAPIController : DBApiController
    {
        [Serializable]
        public class WorkoutWhereHeard
        {
            public List<string> WhereHeardList { get; set; }

            public WorkoutWhereHeard()
            {
            }

            static public string FileUri(long accountId)
            {
                return Globals.UploadDirRoot + "Accounts/" + accountId + "/WhereHeardOptions.xml";
            }
        }

        public WorkoutsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("workouts")]
        public HttpResponseMessage GetWorkouts(long accountId)
        {
            var wo = Db.WorkoutAnnouncements.Where(w => w.AccountId == accountId).OrderBy(w => w.WorkoutDate);
            var vm = Mapper.Map<IEnumerable<WorkoutAnnouncement>, WorkoutAnnouncementRegisteredViewModel[]>(wo);
            return Request.CreateResponse<WorkoutAnnouncementRegisteredViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("whereheard")]
        public async Task<HttpResponseMessage> GetWhereHeard(long accountId)
        {
            XmlSerializer serializer = new XmlSerializer(typeof(WorkoutWhereHeard));

            using (Stream fileText = await Storage.Provider.GetFileAsText(WorkoutWhereHeard.FileUri(accountId)))
            {
                if (fileText != null)
                {
                    WorkoutWhereHeard wwh = (WorkoutWhereHeard)serializer.Deserialize(fileText);
                    return Request.CreateResponse<IEnumerable<String>>(HttpStatusCode.OK, wwh.WhereHeardList.OrderBy(o => o));
                }
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("activeworkouts")]
        public HttpResponseMessage GetActiveWorkouts(long accountId)
        {
            var now = DateTime.Now.AddDays(-1);

            var workouts = (from wa in Db.WorkoutAnnouncements
                            where wa.AccountId == accountId && wa.WorkoutDate >= now
                            orderby wa.WorkoutDate
                            select wa);
            var vm = Mapper.Map<IEnumerable<WorkoutAnnouncement>, WorkoutAnnouncementRegisteredViewModel[]>(workouts);
            return Request.CreateResponse<WorkoutAnnouncementRegisteredViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("workouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> AddWorkout(long accountId, WorkoutAnnouncementViewModel w)
        {
            if (ModelState.IsValid)
            {
                var dbWorkout = new WorkoutAnnouncement()
                {
                    AccountId = accountId,
                    FieldId = w.WorkoutLocation,
                    WorkoutDate = w.WorkoutDate,
                    WorkoutDesc = w.Description ?? String.Empty,
                    Comments = w.Comments ?? String.Empty
                };

                Db.WorkoutAnnouncements.Add(dbWorkout);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<WorkoutAnnouncement, WorkoutAnnouncementRegisteredViewModel>(dbWorkout);

                // Create a 201 response.
                var response = Request.CreateResponse<WorkoutAnnouncementRegisteredViewModel>(HttpStatusCode.Created, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Workouts", accountId = accountId, id = vm.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpPost]
        [ActionName("registrants")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteWorkoutRegistrant(long accountId, long id)
        {
            var wr = await Db.WorkoutRegistrations.FindAsync(id);
            if (wr == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (wr.WorkoutAnnouncement.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.WorkoutRegistrations.Remove(wr);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }



        [AcceptVerbs("POST"), HttpPost]
        [ActionName("register")]
        public async Task<HttpResponseMessage> RegisterWorkout(long accountId, long id, WorkoutRegistrantViewModel wr)
        {
            if (ModelState.IsValid)
            {
                var wa = await Db.WorkoutAnnouncements.FindAsync(id);
                if (wa == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (wa.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                wr.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone1 ?? String.Empty));
                wr.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone2 ?? String.Empty));
                wr.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone3 ?? String.Empty));
                wr.Phone4 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone4 ?? String.Empty));

                var dbRegister = new WorkoutRegistrant()
                {
                    Age = wr.Age,
                    DateRegistered = DateTime.Now,
                    EMail = wr.Email,
                    IsManager = wr.WantToManage,
                    Name = wr.Name,
                    Phone1 = wr.Phone1,
                    Phone2 = wr.Phone2,
                    Phone3 = wr.Phone3,
                    Phone4 = wr.Phone4,
                    Positions = wr.Positions ?? String.Empty,
                    WhereHeard = wr.WhereHeard ?? String.Empty,
                    WorkoutId = id
                };

                Db.WorkoutRegistrations.Add(dbRegister);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<WorkoutRegistrant, WorkoutRegistrantViewModel>(dbRegister);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(vm.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "registereduser", accountId = accountId, id = id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("register")]
        public async Task<HttpResponseMessage> UpdateWorkoutReg(long accountId, long id, WorkoutRegistrantViewModel wr)
        {
            if (ModelState.IsValid)
            {
                var wa = await Db.WorkoutAnnouncements.FindAsync(id);
                if (wa == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (wa.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbRegistrant = wa.WorkoutRegistrations.Where(w => w.Id == wr.Id).SingleOrDefault();
                if (dbRegistrant == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                wr.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone1));
                wr.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone2));
                wr.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone3));

                dbRegistrant.Name = wr.Name;
                dbRegistrant.EMail = wr.Email ?? String.Empty;
                dbRegistrant.Age = wr.Age;
                dbRegistrant.Phone1 = wr.Phone1 ?? String.Empty;
                dbRegistrant.Phone2 = wr.Phone2 ?? String.Empty;
                dbRegistrant.Phone3 = wr.Phone3 ?? String.Empty;
                dbRegistrant.Phone4 = wr.Phone4 ?? String.Empty;
                dbRegistrant.Positions = wr.Positions ?? String.Empty;
                dbRegistrant.IsManager = wr.WantToManage;
                dbRegistrant.WhereHeard = wr.WhereHeard ?? String.Empty;

                await Db.SaveChangesAsync();

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(dbRegistrant.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "registereduser", accountId = accountId, id = dbRegistrant.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        public class EmailData
        {
            public String Subject;
            public String Message;
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("registrants")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> GetRegistrantsForWorkout(long accountId, long id)
        {
            var wa = await Db.WorkoutAnnouncements.FindAsync(id);
            if (wa == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (wa.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var workouts = wa.WorkoutRegistrations;
            var vm = Mapper.Map<IEnumerable<WorkoutRegistrant>, WorkoutRegistrantViewModel[]>(workouts);
            return Request.CreateResponse<WorkoutRegistrantViewModel[]>(HttpStatusCode.OK, vm);
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("email")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> EmailRegistrants(long accountId, long id, EmailData emailData)
        {
            if (ModelState.IsValid)
            {
                var wa = await Db.WorkoutAnnouncements.FindAsync(id);
                if (wa == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (wa.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                String failedSends = EmailRegistrants(wa, emailData.Subject, emailData.Message);

                // Create a 201 response.
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(failedSends)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("workouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> ModifyWorkout(long accountId, WorkoutAnnouncementViewModel wa)
        {
            if (ModelState.IsValid)
            {
                var dbWorkout = await Db.WorkoutAnnouncements.FindAsync(wa.Id);
                if (dbWorkout == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbWorkout.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbWorkout.WorkoutDate = wa.WorkoutDate;
                dbWorkout.WorkoutDesc = wa.Description;
                dbWorkout.Comments = wa.Comments;
                dbWorkout.FieldId = wa.WorkoutLocation;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<WorkoutAnnouncement, WorkoutAnnouncementViewModel>(dbWorkout);
                // Create a 201 response.
                return Request.CreateResponse<WorkoutAnnouncementViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("twitter")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> PostTwitter(long accountId, long id)
        {
            // if twitter keys then use them, if not return "Unauthorized" so that 
            // signin can begin and refresh page, etc.
            var a = await Db.Accounts.FindAsync(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (String.IsNullOrEmpty(a.TwitterOauthSecretKey) || String.IsNullOrEmpty(a.TwitterOauthToken))
                return Request.CreateResponse(HttpStatusCode.ExpectationFailed);

            var wa = await Db.WorkoutAnnouncements.FindAsync(id);
            if (wa == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            String tweet = GetWorkoutTweetText(wa);
            if (String.IsNullOrEmpty(tweet))
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            var auth = new MvcAuthorizer
            {
                CredentialStore = new InMemoryCredentialStore()
                {
                    ConsumerKey = ConfigurationManager.AppSettings["TwitterConsumerKey"],
                    ConsumerSecret = ConfigurationManager.AppSettings["TwitterConsumerSecret"],
                    OAuthToken = a.TwitterOauthToken,
                    OAuthTokenSecret = a.TwitterOauthSecretKey
                }
            };

            var ctx = new TwitterContext(auth);

            try
            {
                Status responseTweet = await ctx.TweetAsync(tweet);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (TwitterQueryException ex)
            {
                // if we get an authentication error, try to have the user log in.
                if (ex.ErrorCode == 32)
                {
                    return Request.CreateResponse(HttpStatusCode.ExpectationFailed);
                }
                else
                {
                    return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
                }
            }
        }

        static internal String GetWorkoutTweetText(WorkoutAnnouncement wa)
        {
            if (wa != null)
            {
                string registerWorkoutUri = Globals.GetURLFromRequest(System.Web.HttpContext.Current.Request); // + "Forms/RegisterWorkout.aspx?id=" + m_workoutId.ToString();

                return String.Format("{0} @ {1} {2} {3}. Click link to register! http://{4}", wa.WorkoutDesc, wa.WorkoutDate.ToString("M"), wa.WorkoutDate.ToString("t"), wa.AvailableField.Name, registerWorkoutUri);
            }

            return String.Empty;
        }

        [AcceptVerbs("DELETE"), HttpPost]
        [ActionName("workouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteWorkout(long accountId, long id)
        {
            var dbWorkout = await Db.WorkoutAnnouncements.FindAsync(id);
            if (dbWorkout == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbWorkout.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.WorkoutAnnouncements.Remove(dbWorkout);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("whereheard")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> PostWhereHeard(long accountId, WorkoutWhereHeard whereHeardData)
        {
            if (ModelState.IsValid)
            {
                var a = await Db.Accounts.FindAsync(accountId);
                if (a == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                WorkoutWhereHeard wwh = new WorkoutWhereHeard();
                wwh.WhereHeardList = whereHeardData.WhereHeardList;

                XmlSerializer serializer = new XmlSerializer(typeof(WorkoutWhereHeard));

                using (StringWriter tw = new StringWriter())
                {
                    var ms = new MemoryStream();
                    serializer.Serialize(ms, wwh);
                    ms.Position = 0;
                    await Storage.Provider.Save(ms, WorkoutWhereHeard.FileUri(accountId));
                }

                // Create a 201 response.
                return Request.CreateResponse(HttpStatusCode.Created);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        private String EmailRegistrants(WorkoutAnnouncement wa, String subject, String message)
        {
            var currentContact = this.GetCurrentContact(wa.AccountId);
            if (currentContact == null)
                return "Invalid sender.";

            var registrants = wa.WorkoutRegistrations;

            if (!registrants.Any())
                return "No registrants found.";

            StringBuilder result = new StringBuilder();

            List<MailAddress> bccList = new List<MailAddress>();
            foreach (var reg in registrants)
            {
                try
                {
                    var address = new MailAddress(reg.EMail, reg.Name);
                    bccList.Add(address);
                }
                catch (Exception)
                {
                    // skip invalid emails.
                    result.Append(reg.EMail);
                    result.Append("; ");
                }
            }

            if (bccList.Any())
            {
                EmailUsersData data = new EmailUsersData()
                {
                    Message = message,
                    Subject = subject
                };

                var failedSends = Globals.MailMessage(new MailAddress(currentContact.Email, currentContact.FullNameFirst), bccList, data);
                foreach (var failedSend in failedSends)
                {
                    result.Append(failedSend.Address);
                    result.Append("; ");
                }
            }

            return result.ToString();
        }

    }
}

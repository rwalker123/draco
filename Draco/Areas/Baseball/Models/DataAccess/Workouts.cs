using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace DataAccess
{
	/// <summary>
	/// Summary description for Workouts
	/// </summary>
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


    static public class Workouts
	{
        static public async Task<IEnumerable<String>> GetWorkoutWhereHeard(long accountId)
        {
            List<String> whereHeardList = new List<string>();

            if (accountId > 0)
            {
                XmlSerializer serializer = new XmlSerializer(typeof(WorkoutWhereHeard));

                using (Stream fileText = await Storage.Provider.GetFileAsText(WorkoutWhereHeard.FileUri(accountId)))
                {
                    if (fileText != null)
                    {
                        WorkoutWhereHeard wwh = (WorkoutWhereHeard)serializer.Deserialize(fileText);
                        whereHeardList = wwh.WhereHeardList;
                    }
                }
            }

            return whereHeardList;
        }

        static public void UpdateWhereHeardOptions(long accountId, List<string> whereHeardOptions)
        {
            if (accountId > 0)
            {
                WorkoutWhereHeard wwh = new WorkoutWhereHeard();
                wwh.WhereHeardList = whereHeardOptions;

                XmlSerializer serializer = new XmlSerializer(typeof(WorkoutWhereHeard));

                using (StringWriter tw = new StringWriter())
                {
                    var ms = new MemoryStream();
                    serializer.Serialize(ms, wwh);
                    ms.Position = 0;
                    Storage.Provider.Save(ms, WorkoutWhereHeard.FileUri(accountId));
                }
            }
        }
        
		static public string GetWorkoutName(long workoutId)
		{
            DB db = DBConnection.GetContext();

            return (from wa in db.WorkoutAnnouncements
                    where wa.Id == workoutId
                    select wa.WorkoutDesc).SingleOrDefault();
		}

        static public IQueryable<WorkoutAnnouncement> GetActiveWorkoutAnnouncements(long accountId)
        {
            DB db = DBConnection.GetContext();
            var now = DateTime.Now.AddDays(-1);
            
            return (from wa in db.WorkoutAnnouncements
                    where wa.AccountId == accountId && wa.WorkoutDate >= now
                    orderby wa.WorkoutDate
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = accountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId,
                        FieldName = wa.AvailableField.Name,
                        NumRegistered = wa.WorkoutRegistrations.Count()
                    });
        }

        static public IQueryable<WorkoutAnnouncement> GetWorkoutAnnouncementsWithRegistered(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from wa in db.WorkoutAnnouncements
                 orderby wa.WorkoutDate
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = accountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId,
                        NumRegistered = wa.WorkoutRegistrations.Count()
                    });
        }


        static public IQueryable<WorkoutAnnouncement> GetWorkoutAnnouncements(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from wa in db.WorkoutAnnouncements
                    where wa.AccountId == accountId
                    orderby wa.WorkoutDate
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = accountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId
                    });
		}

        static public WorkoutAnnouncement GetWorkoutAnnouncement(long workoutId)
        {
            DB db = DBConnection.GetContext();

            return (from wa in db.WorkoutAnnouncements
                    where wa.Id == workoutId
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = wa.AccountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId,
                        FieldName = wa.AvailableField.Name
                    }).SingleOrDefault();
        }

		static public bool ModifyWorkoutAnnouncement(WorkoutAnnouncement w)
		{
            DB db = DBConnection.GetContext();
            var dbWorkout = (from wa in db.WorkoutAnnouncements
                             where wa.Id == w.Id
                             select wa).SingleOrDefault();
            if (dbWorkout != null)
            {
                dbWorkout.WorkoutDate = w.WorkoutDate;
                dbWorkout.WorkoutDesc = w.Description;
                dbWorkout.Comments = w.Comments;
                dbWorkout.FieldId = w.WorkoutLocation;

                db.SubmitChanges();
                return true;
            }

            return false;
		}

		static public bool AddWorkoutAnnouncement(WorkoutAnnouncement w)
		{
            DB db = DBConnection.GetContext();

            var dbWorkout = new SportsManager.Model.WorkoutAnnouncement()
            {
                AccountId = w.AccountId,
                FieldId = w.WorkoutLocation,
                WorkoutDate = w.WorkoutDate,
                WorkoutDesc = w.Description == null ? String.Empty : w.Description,
                Comments = w.Comments == null ? String.Empty : w.Comments
            };

            db.WorkoutAnnouncements.InsertOnSubmit(dbWorkout);
            db.SubmitChanges();

            w.Id = dbWorkout.Id;

            return true;
		}

        static public bool RemoveWorkoutAnnouncement(long id)
        {
            DB db = DBConnection.GetContext();
            var dbWorkout = (from w in db.WorkoutAnnouncements
                             where w.Id == id
                             select w).SingleOrDefault();

            if (dbWorkout != null)
            {
                db.WorkoutAnnouncements.DeleteOnSubmit(dbWorkout);
                db.SubmitChanges();
                return true;
            }

            return false;
        }
	}
}
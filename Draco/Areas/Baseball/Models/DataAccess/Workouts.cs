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

                Stream fileText = await Storage.Provider.GetFileAsText(WorkoutWhereHeard.FileUri(accountId));
                if (fileText != null)
                {
                    try
                    {
                        WorkoutWhereHeard wwh = (WorkoutWhereHeard)serializer.Deserialize(fileText);
                        whereHeardList = wwh.WhereHeardList;
                    }
                    catch(Exception)
                    {
                        // todo.
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
                string fileName = Storage.Provider.GetLocalPath(WorkoutWhereHeard.FileUri(accountId));
                System.IO.DirectoryInfo di = new DirectoryInfo(System.IO.Path.GetDirectoryName(fileName));
                if (!di.Exists)
                    System.IO.Directory.CreateDirectory(di.FullName);

                using (TextWriter tw = new StreamWriter(fileName, false))
                {
                    serializer.Serialize(tw, wwh);
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
                    orderby wa.WorkoutDate, wa.WorkoutTime
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = accountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId,
                        WorkoutTime = wa.WorkoutTime
                    });
        }

        static public IQueryable<WorkoutAnnouncement> GetWorkoutAnnouncementsWithRegistered(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from wa in db.WorkoutAnnouncements
                 join wr in db.WorkoutRegistrations on wa.Id equals wr.WorkoutId into regsInWorkout
                 orderby wa.WorkoutDate, wa.WorkoutTime
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = accountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId,
                        WorkoutTime = wa.WorkoutTime,
                        NumRegistered = regsInWorkout.Count()
                    });
        }


        static public IQueryable<WorkoutAnnouncement> GetWorkoutAnnouncements(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from wa in db.WorkoutAnnouncements
                    where wa.AccountId == accountId
                    orderby wa.WorkoutDate, wa.WorkoutTime
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.Id,
                        AccountId = accountId,
                        Comments = wa.Comments,
                        Description = wa.WorkoutDesc,
                        WorkoutDate = wa.WorkoutDate,
                        WorkoutLocation = wa.FieldId,
                        WorkoutTime = wa.WorkoutTime
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
                        WorkoutTime = wa.WorkoutTime
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
                dbWorkout.WorkoutTime = w.WorkoutTime;
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
                WorkoutTime = w.WorkoutTime,
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
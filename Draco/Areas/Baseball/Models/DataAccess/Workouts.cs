using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
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
			string name = String.Empty;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetWorkoutName", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = workoutId;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
						name = dr.GetString(0);
				}
			} 
			catch (SqlException ex) 
			{
				Globals.LogException(ex);
			}

			return name;
		}

        static public IQueryable<WorkoutAnnouncement> GetActiveWorkoutAnnouncements(long accountId)
        {
            DB db = DBConnection.GetContext();
            var now = DateTime.Now.AddDays(1);
            
            return (from wa in db.WorkoutAnnouncements
                    where wa.AccountId == accountId && wa.WorkoutDate >= now
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.id,
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
                 join wr in db.WorkoutRegistrations on wa.id equals wr.WorkoutId into regsInWorkout
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.id,
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
                    select new WorkoutAnnouncement()
                    {
                        Id = wa.id,
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
			WorkoutAnnouncement workoutAnnouncement = new WorkoutAnnouncement();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetWorkoutAnnouncement", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@workoutId", SqlDbType.BigInt).Value = workoutId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						workoutAnnouncement = new WorkoutAnnouncement(dr.GetInt64(0), dr.GetInt64(1), dr.GetString(2), dr.GetDateTime(3), dr.GetDateTime(4), dr.GetInt64(5), dr.GetString(6));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return workoutAnnouncement;
		}

		static public bool ModifyWorkoutAnnouncement(WorkoutAnnouncement w)
		{
            DB db = DBConnection.GetContext();
            var dbWorkout = (from wa in db.WorkoutAnnouncements
                             where wa.id == w.Id
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

            w.Id = dbWorkout.id;

            return true;
		}

        static public bool RemoveWorkoutAnnouncement(long id)
        {
            DB db = DBConnection.GetContext();
            var dbWorkout = (from w in db.WorkoutAnnouncements
                             where w.id == id
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
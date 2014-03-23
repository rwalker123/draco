using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;

namespace DataAccess
{
	/// <summary>
	/// Summary description for WorkoutRegistrants
	/// </summary>
	static public class WorkoutRegistrants
	{
		static public IQueryable<WorkoutRegistrant> GetWorkoutRegistrants(long workoutId)
		{
            DB db = DBConnection.GetContext();
            return (from wr in db.WorkoutRegistrations
                    where wr.WorkoutId == workoutId
                    select new WorkoutRegistrant()
                    {
                        Id = wr.Id,
                        Name = wr.Name,
                        Email = wr.EMail,
                        DateRegistered = wr.DateRegistered,
                        Age = wr.Age,
                        Positions = wr.Positions,
                        WantToManager = wr.IsManager,
                        WorkoutId = workoutId,
                        WhereHeard = wr.WhereHeard,
                        Phone1 = wr.Phone1,
                        Phone2 = wr.Phone2,
                        Phone3 = wr.Phone3,
                        Phone4 = wr.Phone4
                    });

		}

		static public bool ModifyWorkoutRegistrant(WorkoutRegistrant wr)
		{
            DB db = DBConnection.GetContext();

            var dbRegistrant = (from w in db.WorkoutRegistrations
                                where w.Id == wr.Id
                                select w).SingleOrDefault();

            if (dbRegistrant != null)
            {
                wr.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone1));
                wr.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone2));
                wr.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone3));

                dbRegistrant.Name = wr.Name;
                dbRegistrant.EMail = wr.Email;
                dbRegistrant.Age = wr.Age;
                dbRegistrant.Phone1 = wr.Phone1;
                dbRegistrant.Phone2 = wr.Phone2;
                dbRegistrant.Phone3 = wr.Phone3;
                dbRegistrant.Phone4 = wr.Phone4;
                dbRegistrant.Positions = wr.Positions;
                dbRegistrant.IsManager = wr.WantToManager;
                dbRegistrant.WhereHeard = wr.WhereHeard;

                db.SubmitChanges();
                return true;
            }

            return false;
		}

		static public bool AddWorkoutRegistrant(WorkoutRegistrant wr)
		{
            DB db = DBConnection.GetContext();

            if (wr.Phone3 == null)
                wr.Phone3 = String.Empty;

            if (wr.Phone4 == null)
                wr.Phone4 = String.Empty;

            wr.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone1));
            wr.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone2));
            wr.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone3));
            wr.Phone4 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone4));

            var dbRegister = new SportsManager.Model.WorkoutRegistration()
            {
                Age = wr.Age,
                DateRegistered = DateTime.Now,
                EMail = wr.Email,
                IsManager = wr.WantToManager,
                Name = wr.Name,
                Phone1 = wr.Phone1,
                Phone2 = wr.Phone2,
                Phone3 = wr.Phone3,
                Phone4 = wr.Phone4,
                Positions = wr.Positions,
                WhereHeard = wr.WhereHeard,
                WorkoutId = wr.WorkoutId
            };

            db.WorkoutRegistrations.InsertOnSubmit(dbRegister);
            db.SubmitChanges();

            wr.Id = dbRegister.Id;

            return true;
		}

		static public bool RemoveWorkoutRegistrant(WorkoutRegistrant wr)
		{
            DB db = DBConnection.GetContext();

            var dbWr = (from w in db.WorkoutRegistrations
                        where w.Id == wr.Id
                        select w).SingleOrDefault();

            if (dbWr != null)
            {
                db.WorkoutRegistrations.DeleteOnSubmit(dbWr);
                db.SubmitChanges();
                return true;
            }

            return false;
		}

        static public String EmailRegistrants(long workoutId, String subject, String message)
        {
            string sender = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(sender))
                return String.Empty;

            DB db = DBConnection.GetContext();

            var registrants = (from wr in db.WorkoutRegistrations
                               where wr.WorkoutId == workoutId
                               select wr);

            if (!registrants.Any())
                return "No registrants found.";

            StringBuilder result = new StringBuilder();

            List<MailAddress> bccList = new List<MailAddress>();
            foreach (var reg in registrants)
            {
                try
                {
                    var address = new MailAddress(reg.EMail);
                    bccList.Add(address);
                }
                catch(Exception)
                {
                    // skip invalid emails.
                    result.Append(reg.EMail);
                    result.Append("; ");
                }
            }

            if (bccList.Any())
            {
                var failedSends = Globals.MailMessage(sender, bccList, subject, message);
                foreach(var failedSend in failedSends)
                {
                    result.Append(failedSend.Address);
                    result.Append("; ");
                }
            }

            return result.ToString();
        }
	}
}
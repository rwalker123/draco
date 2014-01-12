using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Web.SessionState;
using System.Collections.Generic;

namespace DataAccess
{
	/// <summary>
	/// Summary description for WorkoutRegistrants
	/// </summary>
	static public class WorkoutRegistrants
	{
		static public string GetWorkoutRegistrantName(int workoutRegistrantId)
		{
			string name = String.Empty;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetWorkoutRegistrantName", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = workoutRegistrantId;
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

		static public List<WorkoutRegistrant> GetWorkoutRegistrants(long workoutId)
		{
			List<WorkoutRegistrant> workoutRegistrants = new List<WorkoutRegistrant>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetWorkoutRegistrants", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@workoutId", SqlDbType.BigInt).Value = workoutId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
                        workoutRegistrants.Add(new WorkoutRegistrant(dr.GetInt64(0), dr.GetString(1), dr.GetString(2), dr.GetInt32(3), dr.GetString(4), dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetBoolean(9), dr.GetInt64(10), dr.GetString(12), dr.GetDateTime(11)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return workoutRegistrants;
		}

		static public bool ModifyWorkoutRegistrant(WorkoutRegistrant wr)
		{
			int rowCount = 0;

            wr.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone1));
            wr.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone2));
            wr.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone3));

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateWorkoutRegistrant", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 100).Value = wr.Name;
					myCommand.Parameters.Add("@email", SqlDbType.VarChar, 100).Value = wr.Email;
					myCommand.Parameters.Add("@age", SqlDbType.Int).Value = wr.Age;
					myCommand.Parameters.Add("@phone1", SqlDbType.VarChar, 14).Value = wr.Phone1;
					myCommand.Parameters.Add("@phone2", SqlDbType.VarChar, 14).Value = wr.Phone2;
					myCommand.Parameters.Add("@phone3", SqlDbType.VarChar, 14).Value = wr.Phone3;
					myCommand.Parameters.Add("@positions", SqlDbType.VarChar, 50).Value = wr.Positions;
					myCommand.Parameters.Add("@manager", SqlDbType.Bit).Value = wr.WantToManager;
                    myCommand.Parameters.Add("@whereHeard", SqlDbType.VarChar, 25).Value = wr.WhereHeard;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = wr.Id;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public bool AddWorkoutRegistrant(WorkoutRegistrant wr)
		{
			int rowCount = 0;

            if (wr.Phone3 == null)
                wr.Phone3 = String.Empty;

            if (wr.Phone4 == null)
                wr.Phone4 = String.Empty;

            wr.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone1));
            wr.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone2));
            wr.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(wr.Phone3));


            if (wr.WorkoutId == 0 && System.Web.HttpContext.Current.Session["AdminCurrentWorkout"] != null)
                wr.WorkoutId = (long)System.Web.HttpContext.Current.Session["AdminCurrentWorkout"];
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateWorkoutRegistrant", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 100).Value = wr.Name;
					myCommand.Parameters.Add("@email", SqlDbType.VarChar, 100).Value = wr.Email;
					myCommand.Parameters.Add("@age", SqlDbType.Int).Value = wr.Age;
					myCommand.Parameters.Add("@phone1", SqlDbType.VarChar, 14).Value = wr.Phone1;
					myCommand.Parameters.Add("@phone2", SqlDbType.VarChar, 14).Value = wr.Phone2;
					myCommand.Parameters.Add("@phone3", SqlDbType.VarChar, 14).Value = wr.Phone3;
					myCommand.Parameters.Add("@positions", SqlDbType.VarChar, 50).Value = wr.Positions;
					myCommand.Parameters.Add("@manager", SqlDbType.Bit).Value = wr.WantToManager;
                    myCommand.Parameters.Add("@whereHeard", SqlDbType.VarChar, 25).Value = wr.WhereHeard;
					myCommand.Parameters.Add("@workoutId", SqlDbType.BigInt).Value = wr.WorkoutId;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

            return (rowCount > 0);
		}

		static public bool RemoveWorkoutRegistrant(WorkoutRegistrant wr)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteWorkoutRegistrant", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = wr.Id;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}
	}
}
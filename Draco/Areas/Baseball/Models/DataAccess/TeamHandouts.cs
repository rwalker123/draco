using System;
using System.Data;
using System.Linq;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Collections.Generic;
using System.Threading.Tasks;
using SportsManager;

namespace DataAccess
{
	/// <summary>
	/// Summary description for TeamHandouts
	/// </summary>
	static public class TeamHandouts
	{
		static private TeamHandout CreateHandout(SqlDataReader dr)
		{
			return new TeamHandout(dr.GetInt64(0), dr.GetString(1), dr.GetString(2), dr.GetInt64(3));
		}

		static public TeamHandout GetHandout(long id)
		{
			TeamHandout h = null;

			try
			{

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetHandout", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
					myCommand.Parameters.Add("@isAccount", SqlDbType.Int).Value = 0;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						h = CreateHandout(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return h;
		}

		static public List<TeamHandout> GetTeamHandouts(long teamSeasonId, int fromTeamId)
		{
            List<TeamHandout> items = new List<TeamHandout>();

			try
			{

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeamHandouts", myConnection);
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
					myCommand.Parameters.Add("@fromTeamId", SqlDbType.Int).Value = fromTeamId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						items.Add(CreateHandout(dr));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return items;
		}

		static public bool ModifyTeamHandout(TeamHandout item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateTeamHandout", myConnection);
					myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = item.Description;
					myCommand.Parameters.Add("@fileName", SqlDbType.VarChar, 255).Value = item.FileName;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = item.Id;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

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

		static public long AddTeamHandout(TeamHandout item)
		{
			long id = 0;

            if (item.Description == null)
                item.Description = String.Empty;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateTeamHandout", myConnection);
					myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = item.Description;
					myCommand.Parameters.Add("@fileName", SqlDbType.VarChar, 255).Value = item.FileName;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = item.ReferenceId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
						id = dr.GetInt64(0);
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return id;
		}

		static public async Task<bool> RemoveTeamHandout(TeamHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbHandout = (from h in db.TeamHandouts
                             where h.Id == item.Id
                             select h).SingleOrDefault();
            if (dbHandout != null)
            {
                db.TeamHandouts.DeleteOnSubmit(dbHandout);
                db.SubmitChanges();

                await SportsManager.Models.Utils.AzureStorageUtils.RemoveCloudFile(item.HandoutURL);
                return true;
            }

            return false;
		}
	}
}

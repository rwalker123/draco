using ModelObjects;
using SportsManager;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace DataAccess
{
	/// <summary>
	/// Summary description for Divisions
	/// </summary>
	static public class Divisions
	{
		static public string GetDivisionName(long divisionSeasonId)
		{
			string name = String.Empty;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetDivisionName", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@divisionSeasonId", SqlDbType.BigInt).Value = divisionSeasonId;
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

        static public IQueryable<Division> GetDivisions(long leagueId)
        {
            DB db = DBConnection.GetContext();
            return (from ds in db.DivisionSeasons
                    join dd in db.DivisionDefs on ds.DivisionId equals dd.Id
                    where ds.LeagueSeasonId == leagueId
                    orderby ds.Priority ascending, dd.Name ascending
                    select new Division(ds.Id, leagueId, dd.Name, ds.Priority, dd.AccountId));
        }

		static public bool ModifyDivision(Division division)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.ModifyDivision", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@divisionSeasonId", SqlDbType.BigInt).Value = division.Id;
					myCommand.Parameters.Add("@divisionName", SqlDbType.VarChar, 25).Value = division.Name;
					myCommand.Parameters.Add("@priority", SqlDbType.Int).Value = division.Priority;
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

		static public long AddDivision(Division d)
		{
            if (d.AccountId <= 0 || d.LeagueId <= 0)
                return 0;

            DB db = DBConnection.GetContext();

            var divisionDef = new SportsManager.Model.DivisionDef()
            {
                AccountId = d.AccountId,
                Name = d.Name
            };

            db.DivisionDefs.InsertOnSubmit(divisionDef);
            db.SubmitChanges();

            var divisionSeason = new SportsManager.Model.DivisionSeason()
            {
                DivisionId = divisionDef.Id,
                LeagueSeasonId = d.LeagueId,
                Priority = d.Priority
            };

            db.DivisionSeasons.InsertOnSubmit(divisionSeason);
            db.SubmitChanges();

            d.Id = divisionSeason.Id;

            return d.Id;
		}

		static public void RemoveLeagueDivisions(long leagueId)
		{
			var divisions = Divisions.GetDivisions(leagueId);
			foreach (Division d in divisions)
			{
				Divisions.RemoveDivision(d.Id);
			}
		}

		static public bool RemoveDivision(long divisionId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteDivision", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@divisionSeasonId", SqlDbType.BigInt).Value = divisionId;
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

		static public bool RemoveUnusedDivisions(long accountId)
		{
            DB db = DBConnection.GetContext();

			var accountDivisions = (from ds in db.DivisionSeasons
									select ds.DivisionId).Distinct();

			var unusedDivisions = (from dd in db.DivisionDefs
								   where dd.AccountId == accountId && !accountDivisions.Contains(dd.Id)
								   select dd);

			db.DivisionDefs.DeleteAllOnSubmit(unusedDivisions);

			return true;
		}

		static public bool CopySeasonDivision(long leagueSeasonId, long copyLeagueSeasonId)
		{
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CopySeasonDivision", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@leagueSeasonIdCopyTo", SqlDbType.BigInt).Value = leagueSeasonId;
					myCommand.Parameters.Add("@leagueSeasonIdCopyFrom", SqlDbType.BigInt).Value = copyLeagueSeasonId;
					myConnection.Open();
					myCommand.Prepare();

					myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				return false;
			}

			return true;
		}

		// this method retrieves the division season id for the new league given the old
		// division season id.
		static public long GetNewTeamDivision(long oldDivisionSeasonId, long newLeagueSeasonId)
		{
			long divisionId = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetNewTeamDivision", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@oldDivisionSeasonId", SqlDbType.BigInt).Value = oldDivisionSeasonId;
					myCommand.Parameters.Add("@newLeagueSeasonId", SqlDbType.BigInt).Value = newLeagueSeasonId;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						divisionId = dr.GetInt64(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return divisionId;
		}
	}
}

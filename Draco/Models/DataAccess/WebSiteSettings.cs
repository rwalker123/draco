using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;

namespace DataAccess
{
/// <summary>
/// Summary description for WebSiteSettings
/// </summary>
	static public class WebSiteSettings
	{
		static public ArrayList GetDisplayLeagueLeaders(int leftRight)
		{
			ArrayList leaders = new ArrayList();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand;

					if (leftRight == 1 || leftRight == 2)
						myCommand = new SqlCommand("SELECT DisplayLeagueLeaders.* FROM DisplayLeagueLeaders LEFT JOIN LeagueSeason ON DisplayLeagueLeaders.LeagueSeasonID = LeagueSeason.ID LEFT JOIN CurrentSeason ON LeagueSeason.SeasonID = CurrentSeason.SeasonId WHERE DisplayOnHomePage=" + leftRight.ToString(), myConnection);
					else
						myCommand = new SqlCommand("SELECT DisplayLeagueLeaders.* FROM DisplayLeagueLeaders LEFT JOIN LeagueSeason ON DisplayLeagueLeaders.LeagueSeasonID = LeagueSeason.ID LEFT JOIN CurrentSeason ON LeagueSeason.SeasonID = CurrentSeason.SeasonId", myConnection);

					myConnection.Open();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						leaders.Add(new LeagueLeaderConfig(dr.GetInt64(0), dr.GetInt64(3), dr.GetString(1), dr.GetInt32(2), dr.GetInt32(4)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return leaders;

		}

		static public bool RemoveDisplayLeagueLeaders(int id)
		{
			int rowCnt = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("DELETE FROM DisplayLeagueLeaders WHERE ID = " + id.ToString(), myConnection);
					myConnection.Open();

					rowCnt = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				rowCnt = 0;
			}

			return (rowCnt == 0) ? false : true;
		}

		static public bool ModifyLeagueLeader(LeagueLeaderConfig l)
		{
			int rowCnt = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("UPDATE DisplayLeagueLeaders SET FieldName = @fieldName, FieldLimit = @fieldLimit, LeagueSeasonID = @leagueId, DisplayOnHomePage = @noLeftRight WHERE ID = @id", myConnection);
					myCommand.Parameters.Add("@fieldName", SqlDbType.VarChar, 50).Value = l.FieldName;
					myCommand.Parameters.Add("@fieldLimit", SqlDbType.Int).Value = l.FieldLimit;
					myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = l.LeagueId;
					myCommand.Parameters.Add("@noLeftRight", SqlDbType.Int).Value = l.NoLeftRight;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = l.Id;
					myCommand.Prepare();
					myConnection.Open();

					rowCnt = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				rowCnt = 0;
			}

			return (rowCnt == 0) ? false : true;
		}

		static public bool AddLeagueLeader(LeagueLeaderConfig l)
		{
			int rowCnt = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("INSERT INTO DisplayLeagueLeaders VALUES(null, @fieldName, @fieldLimit, @leagueId, @noLeftRight)", myConnection);
					myCommand.Parameters.Add("@fieldName", SqlDbType.VarChar, 50).Value = l.FieldName;
					myCommand.Parameters.Add("@fieldLimit", SqlDbType.Int).Value = l.FieldLimit;
					myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = l.LeagueId;
					myCommand.Parameters.Add("@noLeftRight", SqlDbType.Int).Value = l.NoLeftRight;
					myCommand.Prepare();
					myConnection.Open();

					rowCnt = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				rowCnt = 0;
			}

			return (rowCnt == 0) ? false : true;
		}
	}
}

using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Collections.Generic;
using System.Web;


namespace DataAccess
{
    /// <summary>
    /// Summary description for GameEjections
    /// </summary>
    public static class GameEjections
    {
        static private GameEjection CreateGameEjection(SqlDataReader dr)
        {
            string comments = System.Web.HttpContext.Current.Server.HtmlDecode(dr.GetString(5));

            return new GameEjection(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetInt64(3), dr.GetInt64(4), comments);
        }

        static public GameEjection GetGameEjection(long id)
        {
            GameEjection ge = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetGameEjection", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        ge = CreateGameEjection(dr);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return ge;
        }


        static public List<GameEjection> GetGameEjections(long leagueSeasonId)
        {
            List<GameEjection> gameEjections = new List<GameEjection>();

            if (leagueSeasonId == 0)
                leagueSeasonId = DataAccess.Leagues.GetCurrentLeague();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetGameEjections", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@leagueSeasonId", SqlDbType.BigInt).Value = leagueSeasonId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        gameEjections.Add(CreateGameEjection(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return gameEjections;
        }

        static public bool ModifyGameEjection(GameEjection ge)
        {
            int rowCount = 0;

            ge.Comments = System.Web.HttpContext.Current.Server.HtmlEncode(ge.Comments);

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.ModifyGameEjection", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = ge.Id;
                    myCommand.Parameters.Add("@umpireId", SqlDbType.BigInt).Value = ge.UmpireId;
                    myCommand.Parameters.Add("@comments", SqlDbType.NText).Value = ge.Comments;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return rowCount > 0;
        }

        static public bool AddGameEjection(GameEjection ge)
        {
            int rowCount = 0;

            ge.Comments = System.Web.HttpContext.Current.Server.HtmlEncode(ge.Comments);

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.AddGameEjection", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = ge.GameId;
                    myCommand.Parameters.Add("@leagueSeasonId", SqlDbType.BigInt).Value = ge.LeagueSeasonId;
                    myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = ge.PlayerSeasonId;
                    myCommand.Parameters.Add("@umpireId", SqlDbType.BigInt).Value = ge.UmpireId;
                    myCommand.Parameters.Add("@comments", SqlDbType.NText).Value = ge.Comments;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return rowCount > 0;
        }

        static public bool RemoveGameEjection(GameEjection ge)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteGameEjection", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = ge.Id;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return rowCount > 0;
        }
    }
}
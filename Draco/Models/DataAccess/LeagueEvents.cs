using System;
using System.Data;
using System.Collections;
using System.Collections.Generic;
using System.Data.SqlClient;
using ModelObjects;

namespace DataAccess
{

    /// <summary>
    /// Summary description for League Events
    /// </summary>
    static public class LeagueEvents
    {
        static LeagueEvent CreateEvent(SqlDataReader dr)
        {
            return new LeagueEvent(dr.GetInt64(0), dr.GetInt64(1), dr.GetDateTime(2), dr.GetString(3));
        }

        static public LeagueEvent GetEvent(long eventId)
        {
            LeagueEvent e = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetLeagueEvent", myConnection);
                    myCommand.Parameters.Add("@eventId", SqlDbType.BigInt).Value = eventId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        e = CreateEvent(dr);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return e;
        }

        static public List<LeagueEvent> GetEvents(long leagueSeasonId)
        {
            List<LeagueEvent> leagueEvents = new List<LeagueEvent>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetLeagueEvents", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueSeasonId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        leagueEvents.Add(CreateEvent(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return leagueEvents;
        }

        static public List<LeagueEvent> GetEvents(long leagueSeasonId, int month)
        {
            List<LeagueEvent> leagueEvents = new List<LeagueEvent>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetLeagueEventsMonth", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueSeasonId;
                    myCommand.Parameters.Add("@month", SqlDbType.Int).Value = month;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        leagueEvents.Add(CreateEvent(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return leagueEvents;
        }

        static public bool ModifyEvent(LeagueEvent e)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateLeagueEvent", myConnection);
                    myCommand.Parameters.Add("@eventId", SqlDbType.BigInt).Value = e.Id;
                    myCommand.Parameters.Add("@eventDate", SqlDbType.SmallDateTime).Value = e.EventDate;
                    myCommand.Parameters.Add("@eventDescription", SqlDbType.VarChar, 25).Value = e.Description;

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

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

            return (rowCount <= 0) ? false : true;
        }

        static public bool AddEvent(LeagueEvent e)
        {
            if (e.LeagueId <= 0)
                e.LeagueId = Leagues.GetCurrentLeague();

            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateLeagueEvent", myConnection);
                    myCommand.Parameters.Add("@eventDate", SqlDbType.SmallDateTime).Value = e.EventDate;
                    myCommand.Parameters.Add("@eventDescription", SqlDbType.VarChar, 255).Value = e.Description;
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = e.LeagueId;

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

        static public bool RemoveEvent(LeagueEvent e)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteLeagueEvent", myConnection);
                    myCommand.Parameters.Add("@eventId", SqlDbType.BigInt).Value = e.Id;
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
    }
}

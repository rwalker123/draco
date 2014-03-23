using System;
using System.Linq;
using System.Configuration;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Collections.Generic;
using SportsManager;

namespace DataAccess
{
/// <summary>
/// Summary description for HOFMembers
/// </summary>
	static public class HOFMembers
	{
		static private HOFMember CreateHOFMember(SqlDataReader dr)
		{
			Contact contactInfo = Contacts.GetContact(dr.GetInt64(3));
			return new HOFMember(dr.GetInt64(0), dr.GetInt32(2), contactInfo, dr.GetString(4), dr.GetInt64(1));
		}

		static public IQueryable<HOFMember> GetMembers(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from h in db.hofs
                    where h.AccountId == accountId
                    select new HOFMember()
                    {
                        Id = h.Id,
                        AccountId = accountId,
                        Biography = h.Bio,
                        YearInducted = h.YearInducted
                    });
		}

		static public HOFMember GetMemberOfDay(long accountId)
		{
			HOFMember member = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetHOFMemberOfDay", myConnection);
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
                    myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					
					if (dr.Read())
					{
						member = CreateHOFMember(dr);
					}
				}
			}
			catch (SqlException ex) 
			{
                Globals.LogException(ex);
			}

			return member;
		}

		static public HOFMember GetHOFMember(long id)
		{
			HOFMember member = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetHOFMember", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					
					if (dr.Read())
					{
						member = CreateHOFMember(dr);
					}
				}
			}
			catch (SqlException ex) 
			{
                Globals.LogException(ex);
			}

			return member;
		}

		static public bool ModifyMember(HOFMember hofMember)
		{
			int rowCount = 1;
		
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.ModifyHOFMember", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@yearInducted", SqlDbType.Int).Value = hofMember.YearInducted;
					myCommand.Parameters.Add("@lastName", SqlDbType.VarChar, 25).Value = hofMember.LastName;
					myCommand.Parameters.Add("@firstName", SqlDbType.VarChar, 25).Value = hofMember.FirstName;
					myCommand.Parameters.Add("@middleName", SqlDbType.VarChar, 25).Value = hofMember.MiddleName;
					myCommand.Parameters.Add("@bio", SqlDbType.VarChar, 255).Value = hofMember.Biography;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = hofMember.Id;
					
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

		static public long AddMember(HOFMember h)
		{
			long hofId = 0;

            if (h.AccountId <= 0)
                return 0;

			try
			{
				if (h.ContactInfo == null || h.ContactInfo.Id == 0)
				{
					string homePhone = String.Empty;
					string workPhone = String.Empty;
					string cellPhone = String.Empty;

					System.Diagnostics.Debug.Assert(false, "Fix this");
					//h.ContactInfo = Contacts.AddContact(h.FirstName, h.MiddleName, h.LastName,
					//                                        homePhone, workPhone, cellPhone,
					//                                        String.Empty, String.Empty, String.Empty, String.Empty,
					//                                        String.Empty, String.Empty, String.Empty, h.AccountId,
					//                                        h.ContactInfo.FirstYear, h.ContactInfo.DateOfBirth, 0);
				}

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateHOFMember", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@yearInducted", SqlDbType.Int).Value = h.YearInducted;
					myCommand.Parameters.Add("@contactId", SqlDbType.VarChar, 25).Value = h.ContactInfo.Id;
					myCommand.Parameters.Add("@bio", SqlDbType.VarChar, 255).Value = h.Biography;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = h.AccountId;
					
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
						hofId = dr.GetInt64(0);
				}
			}
			catch (SqlException ex) 
			{
                Globals.LogException(ex);
			}
		
			return hofId;
		}
	
		static public bool RemoveMember(HOFMember hofMember)
		{
			int rowCount = 0;
		
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteHOFMember", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = hofMember.Id;

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
	
		static public bool ModifyNomination(HOFNomination h)
		{
			int rowCount = 0;
		
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateHOFNomination", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@nominator", SqlDbType.VarChar, 50).Value = h.Nominator;
					myCommand.Parameters.Add("@phoneNumber", SqlDbType.VarChar, 14).Value = h.PhoneNumber;
					myCommand.Parameters.Add("@email", SqlDbType.VarChar, 75).Value = h.EMail;
					myCommand.Parameters.Add("@nominee", SqlDbType.VarChar, 50).Value = h.Nominee;
					myCommand.Parameters.Add("@reason", SqlDbType.Text).Value = h.Reason;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = h.Id;

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

		static public bool AddNomination(HOFNomination h)
		{
			int rowCount = 0;

            if (h.AccountId <= 0)
                return false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateHOFNomination", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@nominator", SqlDbType.VarChar, 50).Value = h.Nominator;
					myCommand.Parameters.Add("@phoneNumber", SqlDbType.VarChar, 14).Value = h.PhoneNumber;
					myCommand.Parameters.Add("@email", SqlDbType.VarChar, 75).Value = h.EMail;
					myCommand.Parameters.Add("@nominee", SqlDbType.VarChar, 50).Value = h.Nominee;
					myCommand.Parameters.Add("@reason", SqlDbType.Text).Value = h.Reason;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = h.AccountId;

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
	
		static public bool RemoveNomination(HOFNomination h)
		{
			int rowCount = 0;
		
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteHOFNomination", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = h.Id;

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
	
		static public List<HOFNomination> GetHOFNominees(long accountId)
		{
			List<HOFNomination> members = new List<HOFNomination>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetHOFNominees", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while ( dr.Read() ) 
					{
						members.Add( new HOFNomination(dr.GetInt64(0), dr.GetString(2), dr.GetString(4), dr.GetString(3), dr.GetString(5), dr.GetString(6), dr.GetInt64(1)));
					}
				}
			} 
			catch(SqlException ex) 
			{
				System.Diagnostics.Trace.WriteLine(ex.Message);
			}

			return members;
		}

		static public IQueryable<Contact> GetAvailableHOFMembers(long accountId)
		{
            DB db = DBConnection.GetContext();
            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var hofIds = (from h in db.hofs
                          where h.AccountId == accountId
                          select h.ContactId);

            return (from c in db.Contacts
                    where aIds.Contains(c.CreatorAccountId) && !hofIds.Contains(c.Id)
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                                    c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                                    c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
		}

        public static HOFNominationSetup GetHOFNominationSetup(long accountId)
        {
            HOFNominationSetup hofSetup = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetHOFNominationSetup", myConnection);
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        hofSetup = new HOFNominationSetup(dr.GetInt64(0), dr.GetBoolean(1), dr.GetString(2));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return hofSetup;
        }

        public static bool SetHOFNominationSetup(HOFNominationSetup hofSetup)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.SetHOFNominationSetup", myConnection);
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = hofSetup.AccountId;
                    myCommand.Parameters.Add("@enableNomination", SqlDbType.Bit).Value = hofSetup.EnableNomination;
                    myCommand.Parameters.Add("@criteriaText", SqlDbType.VarChar, hofSetup.CriteriaText.Length).Value = hofSetup.CriteriaText;
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

            return (rowCount > 0);
        }

    }
}
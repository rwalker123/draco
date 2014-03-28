using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using ModelObjects;
using SportsManager;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Fields
    /// </summary>
    static public class Fields
    {
        static public string GetFieldName(long fieldId)
        {
            DB db = DBConnection.GetContext();

            return (from fields in db.AvailableFields
                    where fields.Id == fieldId
                    select fields.Name).SingleOrDefault();
        }

        static public string GetFieldShortName(long fieldId)
        {
            string name = String.Empty;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetFieldShortName", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = fieldId;
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

        static public Field GetField(long fieldId)
        {
            Field field = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetField", myConnection);
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = fieldId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        field = new Field(dr.GetInt64(0), dr.GetInt64(1), dr.GetString(2), dr.GetString(3), dr.GetString(4),
                                            dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetString(9),
                                            dr.GetString(10), dr.GetString(11), dr.GetString(12));
                    }
                }
            }
            catch (SqlException ex)
            {
                System.Diagnostics.Trace.WriteLine(ex.Message);
            }

            return field;
        }

        static public IQueryable<Field> GetFields(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from f in db.AvailableFields
                    where f.AccountId == accountId
                    orderby f.Name
                    select new Field()
                    {
                        Id = f.Id,
                        AccountId = accountId,
                        Address = f.Address,
                        City = f.City,
                        Comment = f.Comment,
                        Directions = f.Directions,
                        Latitude = f.Latitude,
                        Longitude = f.Longitude,
                        Name = f.Name,
                        RainoutNumber = f.RainoutNumber,
                        ShortName = f.ShortName,
                        State = f.State,
                        ZipCode = f.ZipCode
                    });
        }

        static public bool ModifyField(Field f)
        {
            DB db = DBConnection.GetContext();

            var dbField = (from fld in db.AvailableFields
                           where fld.Id == f.Id
                           select fld).SingleOrDefault();

            if (dbField == null)
                return false;

            dbField.Address = f.Address ?? String.Empty;
            dbField.City = f.City ?? String.Empty;
            dbField.Comment = f.Comment ?? String.Empty;
            dbField.Directions = f.Directions ?? String.Empty;
            dbField.Latitude = f.Latitude ?? String.Empty;
            dbField.Longitude = f.Longitude ?? String.Empty;
            dbField.Name = f.Name;
            dbField.RainoutNumber = f.RainoutNumber ?? String.Empty;
            dbField.ShortName = f.ShortName;
            dbField.State = f.State ?? String.Empty;
            dbField.ZipCode = f.ZipCode ?? String.Empty;

            db.SubmitChanges();

            return true;
        }

        static public long AddField(Field field)
        {
            DB db = DBConnection.GetContext();

            var dbField = new SportsManager.Model.AvailableField()
            {
                Name = field.Name,
                ShortName = field.ShortName,
                AccountId = field.AccountId,
                Address = field.Address ?? String.Empty,
                City = field.City ?? String.Empty,
                State = field.State ?? String.Empty,
                ZipCode = field.ZipCode ?? String.Empty,
                Directions = field.Directions ?? String.Empty,
                Comment = field.Comment ?? String.Empty,
                Latitude = field.Latitude ?? String.Empty,
                Longitude = field.Longitude ?? String.Empty,
                RainoutNumber = field.RainoutNumber ?? String.Empty
            };

            db.AvailableFields.InsertOnSubmit(dbField);
            db.SubmitChanges();

            field.Id = dbField.Id;

            return field.Id;
        }

        static public bool RemoveField(long id)
        {
            DB db = DBConnection.GetContext();

            var dbField = (from f in db.AvailableFields
                           where f.Id == id
                           select f).SingleOrDefault();

            if (dbField == null)
                return false;

            db.AvailableFields.DeleteOnSubmit(dbField);
            db.SubmitChanges();

            return true;
        }

        static public List<FieldContact> GetFieldContacts(long accountId)
        {
            List<FieldContact> fieldContacts = new List<FieldContact>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetFieldContacts", myConnection);
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = 0;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        fieldContacts.Add(new FieldContact(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2)));
                    }
                }
            }
            catch (SqlException ex)
            {
                System.Diagnostics.Trace.WriteLine(ex.Message);
            }

            return fieldContacts;
        }

        static public List<FieldContact> GetFieldContacts(long accountId, long fieldId)
        {
            List<FieldContact> fieldContacts = new List<FieldContact>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetFieldContacts", myConnection);
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = fieldId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        fieldContacts.Add(new FieldContact(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2)));
                    }
                }
            }
            catch (SqlException ex)
            {
                System.Diagnostics.Trace.WriteLine(ex.Message);
            }

            return fieldContacts;
        }

        static public bool ModifyFieldContact(FieldContact fieldContact)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.ModifyFieldContact", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = fieldContact.Id;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = fieldContact.FieldId;
                    myCommand.Parameters.Add("@ContactId", SqlDbType.BigInt).Value = fieldContact.ContactId;

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

        static public bool AddFieldContact(FieldContact field)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateFieldContact", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = field.FieldId;
                    myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = field.ContactId;
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

        static public bool RemoveFieldContact(FieldContact field)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteFieldContact", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = field.Id;
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
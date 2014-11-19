using ModelObjects;
using SportsManager;
using System;
using System.Linq;

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
            DB db = DBConnection.GetContext();

            return (from f in db.AvailableFields
                    where f.Id == fieldId
                    select f.ShortName).SingleOrDefault();
        }

        static public Field GetField(long fieldId)
        {
            DB db = DBConnection.GetContext();

            return (from f in db.AvailableFields
                    where f.Id == fieldId
                    select new Field()
                    {
                        Id = f.Id,
                        AccountId = f.AccountId,
                        Address = f.Address,
                        City = f.City,
                        Comment = f.Comment,
                        Directions = f.Directions,
                        Latitude = f.Latitude,
                        Longitude = f.Longitude,
                        Name = f.Name,
                        ShortName = f.ShortName,
                        RainoutNumber = f.RainoutNumber,
                        State = f.State,
                        ZipCode = f.ZipCode
                    }).SingleOrDefault();
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

        static public IQueryable<FieldContact> GetFieldContacts(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from fc in db.FieldContacts
                    join af in db.AvailableFields on fc.FieldId equals af.Id
                    where af.AccountId == accountId
                    orderby fc.FieldId
                    select new FieldContact(fc.Id, fc.FieldId, fc.ContactId));
        }

        static public IQueryable<FieldContact> GetFieldContacts(long accountId, long fieldId)
        {
            DB db = DBConnection.GetContext();

            return (from fc in db.FieldContacts
                    join af in db.AvailableFields on fc.FieldId equals af.Id
                    where af.AccountId == accountId && fc.FieldId == fieldId
                    select new FieldContact(fc.Id, fc.FieldId, fc.ContactId));
        }

        static public bool ModifyFieldContact(FieldContact fieldContact)
        {
            DB db = DBConnection.GetContext();

            var dbFieldContact = (from fc in db.FieldContacts
                                  where fc.Id == fieldContact.Id
                                  select fc).SingleOrDefault();
            if (dbFieldContact == null)
                return false;

            dbFieldContact.FieldId = fieldContact.FieldId;
            dbFieldContact.ContactId = fieldContact.ContactId;
            db.SubmitChanges();

            return true;
        }

        static public bool AddFieldContact(FieldContact field)
        {
            DB db = DBConnection.GetContext();

            var dbFieldContact = new SportsManager.Model.FieldContact();
            dbFieldContact.ContactId = field.ContactId;
            dbFieldContact.FieldId = field.FieldId;

            db.FieldContacts.InsertOnSubmit(dbFieldContact);
            db.SubmitChanges();

            field.Id = dbFieldContact.Id;

            return true;
        }

        static public bool RemoveFieldContact(FieldContact field)
        {
            DB db = DBConnection.GetContext();

            var dbFieldContact = (from fc in db.FieldContacts
                                  where fc.Id == field.Id
                                  select fc).SingleOrDefault();
            if (dbFieldContact == null)
                return false;

            db.FieldContacts.DeleteOnSubmit(dbFieldContact);
            db.SubmitChanges();

            return true;
        }
    }
}
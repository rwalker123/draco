using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Baseball.Controllers
{
    public class FieldsAPIController : DBApiController
    {
        public FieldsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("fields")]
        public HttpResponseMessage GetFields(long accountId)
        {
            var fields = m_db.AvailableFields.Where(f => f.AccountId == accountId).OrderBy(f => f.Name);
            if (fields != null)
            {
                var vm = Mapper.Map<IEnumerable<Field>, FieldViewModel[]>(fields);
                return Request.CreateResponse<FieldViewModel[]>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("fields")]
        public HttpResponseMessage PostField(long accountId, FieldViewModel f)
        {
            if (ModelState.IsValid)
            {
                var dbField = new Field()
                {
                    Name = f.Name,
                    ShortName = f.ShortName,
                    AccountId = f.AccountId,
                    Address = f.Address ?? String.Empty,
                    City = f.City ?? String.Empty,
                    State = f.State ?? String.Empty,
                    ZipCode = f.ZipCode ?? String.Empty,
                    Directions = f.Directions ?? String.Empty,
                    Comment = f.Comment ?? String.Empty,
                    Latitude = f.Latitude ?? String.Empty,
                    Longitude = f.Longitude ?? String.Empty,
                    RainoutNumber = f.RainoutNumber ?? String.Empty
                };

                m_db.AvailableFields.Add(dbField);
                m_db.SaveChanges();

                var vm = Mapper.Map<Field, FieldViewModel>(dbField);
                return Request.CreateResponse<FieldViewModel>(HttpStatusCode.Created, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("fields")]
        public HttpResponseMessage PutField(long accountId, FieldViewModel f)
        {
            if (ModelState.IsValid)
            {
                var dbField = m_db.AvailableFields.Find(f.Id);
                if (dbField == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbField.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

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

                m_db.SaveChanges();

                var vm = Mapper.Map<Field, FieldViewModel>(dbField);
                return Request.CreateResponse<FieldViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        // "field" is a stupid dummy action, I couldn't get it to work
        // with FieldsAPI/accountId/Id even though WebApiConfig
        // has a route for it. I think because of "default" id
        // it was matching the action route.
        [ActionName("fields")]
        public HttpResponseMessage DeleteField(long accountId, long id)
        {
            var field = m_db.AvailableFields.Find(id);
            if (field == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (field.AccountId == accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.AvailableFields.Remove(field);
            m_db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}

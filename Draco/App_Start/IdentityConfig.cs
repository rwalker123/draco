using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace SportsManager
{
    public class MyDbInitializer : IDatabaseInitializer<ApplicationDbContext> // DropCreateDatabaseAlways
    {
        public void InitializeDatabase(ApplicationDbContext context)
        {
            var UserManager = new UserManager<ApplicationUser>(new UserStore<ApplicationUser>(context));
            var RoleManager = new RoleManager<IdentityRole>(new RoleStore<IdentityRole>(context));

            string adminUserName = "Admin";
            string adminPassword = "abc#def$ghi%jkl^mno&pqr";

            string[] roles = new string[] { "Administrator", "AccountAdmin", "AccountPhotoAdmin",
                "LeagueAdmin", "TeamAdmin", "TeamPhotoAdmin" };

            string adminRole = roles[0];

            //Create Roles
            foreach( var role in roles)
            {
                if (!RoleManager.RoleExists(role))
                    RoleManager.Create(new IdentityRole(role));
            }
            // create admin user.
            ApplicationUser adminUser = UserManager.FindByName(adminUserName);
            if (adminUser == null || String.IsNullOrEmpty(adminUser.UserName))
            {
                adminUser = new ApplicationUser() { UserName = adminUserName };
                var adminresult = UserManager.Create(adminUser, adminPassword);

                //Add User Admin to Role Admin
                if (adminresult.Succeeded)
                {
                    UserManager.AddToRole(adminUser.Id, adminRole);
                }
            }
        }
    }
}
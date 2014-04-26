using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin;
using SportsManager.Models;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace SportsManager
{
    // Configure the application user manager used in this application. UserManager is defined in ASP.NET Identity and is used by the application.

    public class UserManager : UserManager<ApplicationUser>
    {
        public UserManager(IUserStore<ApplicationUser> store)
            : base(store)
        {
            // pre-Asp.net Identity password support.
            this.PasswordHasher = new SQLPasswordHasher();
        }
    }

    public class ApplicationUserManager : UserManager
    {
        public ApplicationUserManager(IUserStore<ApplicationUser> store)
            : base(store)
        {
        }

        public static ApplicationUserManager Create(IdentityFactoryOptions<ApplicationUserManager> options, IOwinContext context)
        {
            var manager = new ApplicationUserManager(new UserStore<ApplicationUser>(context.Get<ApplicationDbContext>()));
            // Configure validation logic for usernames
            manager.UserValidator = new EmailUserValidator(manager);
            //manager.UserValidator = new UserValidator<ApplicationUser>(manager)
            //{
            //    AllowOnlyAlphanumericUserNames = false,
            //    RequireUniqueEmail = true
            //};
            // Configure validation logic for passwords
            manager.PasswordValidator = new PasswordValidator
            {
                RequiredLength = 6,
                RequireNonLetterOrDigit = false,
                RequireDigit = false,
                RequireLowercase = false,
                RequireUppercase = false,
            };
            // Configure user lockout defaults
            manager.UserLockoutEnabledByDefault = true;
            manager.DefaultAccountLockoutTimeSpan = TimeSpan.FromMinutes(5);
            manager.MaxFailedAccessAttemptsBeforeLockout = 500;
            // Register two factor authentication providers. This application uses Phone and Emails as a step of receiving a code for verifying the user
            // You can write your own provider and plug in here.
            manager.RegisterTwoFactorProvider("EmailCode", new EmailTokenProvider<ApplicationUser>
            {
                Subject = "SecurityCode",
                BodyFormat = "Your security code is {0}"
            });
            manager.EmailService = new EmailService();
            var dataProtectionProvider = options.DataProtectionProvider;
            if (dataProtectionProvider != null)
            {
                manager.UserTokenProvider = new DataProtectorTokenProvider<ApplicationUser>(dataProtectionProvider.Create("ASP.NET Identity"));
            }
            return manager;
        }

        /// <summary>
        /// Method to add user to multiple roles
        /// </summary>
        /// <param name="userId">user id</param>
        /// <param name="roles">list of role names</param>
        /// <returns></returns>
        public virtual async Task<IdentityResult> AddUserToRolesAsync(string userId, IList<string> roles)
        {
            var userRoleStore = (IUserRoleStore<ApplicationUser, string>)Store;

            var user = await FindByIdAsync(userId).ConfigureAwait(false);
            if (user == null)
            {
                throw new InvalidOperationException("Invalid user Id");
            }

            var userRoles = await userRoleStore.GetRolesAsync(user).ConfigureAwait(false);
            // Add user to each role using UserRoleStore
            foreach (var role in roles.Where(role => !userRoles.Contains(role)))
            {
                await userRoleStore.AddToRoleAsync(user, role).ConfigureAwait(false);
            }

            // Call update once when all roles are added
            return await UpdateAsync(user).ConfigureAwait(false);
        }

        /// <summary>
        /// Remove user from multiple roles
        /// </summary>
        /// <param name="userId">user id</param>
        /// <param name="roles">list of role names</param>
        /// <returns></returns>
        public virtual async Task<IdentityResult> RemoveUserFromRolesAsync(string userId, IList<string> roles)
        {
            var userRoleStore = (IUserRoleStore<ApplicationUser, string>)Store;

            var user = await FindByIdAsync(userId).ConfigureAwait(false);
            if (user == null)
            {
                throw new InvalidOperationException("Invalid user Id");
            }

            var userRoles = await userRoleStore.GetRolesAsync(user).ConfigureAwait(false);
            // Remove user to each role using UserRoleStore
            foreach (var role in roles.Where(userRoles.Contains))
            {
                await userRoleStore.RemoveFromRoleAsync(user, role).ConfigureAwait(false);
            }

            // Call update once when all roles are removed
            return await UpdateAsync(user).ConfigureAwait(false);
        }
    }

    // Configure the RoleManager used in the application. RoleManager is defined in the ASP.NET Identity core assembly
    public class ApplicationRoleManager : RoleManager<IdentityRole>
    {
        public ApplicationRoleManager(IRoleStore<IdentityRole, string> roleStore)
            : base(roleStore)
        {
        }

        public static ApplicationRoleManager Create(IdentityFactoryOptions<ApplicationRoleManager> options, IOwinContext context)
        {
            var manager = new ApplicationRoleManager(new RoleStore<IdentityRole>(context.Get<ApplicationDbContext>()));

            return manager;
        }
    }

    public class EmailService : IIdentityMessageService
    {
        public Task SendAsync(IdentityMessage message)
        {
            Globals.MailMessage("admin@ezrecsports.com", message.Destination, message.Subject, message.Body);
            return Task.FromResult(0);
        }
    }


    public class MyDbInitializer : IDatabaseInitializer<ApplicationDbContext> // DropCreateDatabaseAlways
    {
        public void InitializeDatabase(ApplicationDbContext context)
        {
            var UserManager = new UserManager<ApplicationUser>(new UserStore<ApplicationUser>(context));
            var RoleManager = new ApplicationRoleManager(new RoleStore<IdentityRole>(context));

            string adminUserName = "admin@ezrecsports.com";
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
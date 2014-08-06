var InitUserRoleClass = function (accountId, currentUserId, accountAdminId, accountPhotoAdminId, leagueAdminId, teamAdminId, teamPhotoAdminId, isAccountOwner) {

    initKOHelpers();

    var vm = new UserRoleViewModel(accountId, currentUserId, accountAdminId, accountPhotoAdminId, leagueAdminId, teamAdminId, teamPhotoAdminId, isAccountOwner);
    ko.applyBindings(vm, document.getElementById("userRoles"));
};

var AdminTypeViewModel = function(data)
{
    var self = this;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'HomeTeamId': {
        //    create: function (options) {
        //        return ko.observable(options.data);
        //    },
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.selectedLeague = ko.observable();
    self.selectedTeam = ko.observable();

    self.addSelectedUserToRole = function (vm) {
        if (!self.selectedUser)
            return;

        var url = window.config.rootUri + '/api/UserRolesAPI/' + self.AccountId() + '/AddToRole';

        var roleData;
        var roleDataText;
        if (self.ShowLeagues()) {
            roleData = self.selectedLeague();
            roleDataText = 'todo: league name';
        }

        if (self.ShowTeams()) {
            roleData = self.selectedTeam();
            roleDataText = 'todo: team name';
        }

        $.ajax({
            type: 'POST',
            url: url,
            data: {
                Id: 0,
                AccountId: self.AccountId(),
                ContactId: self.selectedUser.id,
                RoleId: self.Id(),
                RoleData: roleData
            },
            success: function (adminData) {
                window.location.hash = 'update';
                // if user already exists, don't add again.
                var existingUser = ko.utils.arrayFirst(self.admins(), function (admin) {
                    return admin.Id == adminData.Id && admin.RoleId == adminData.RoleId && admin.RoleData == adminData.RoleData;
                });
                if (!existingUser)
                    self.admins.push(adminData);

                self.selectedUser = null;
                $("input.autocomplete").val('');
            }
        });
    }

    self.Id.isPopulated = ko.observable(false);

    self.selectedUser = null;

    self.selectUser = function (e, ui) {
        if (ui && ui.item) {
            self.selectedUser = {
                id: ui.item.Id,
                text: ui.item.value,
                logo: ui.item.PhotoURL,
                hasLogo: (!!ui.item.PhotoURL),
                selected: ko.observable(true)
            };
        }

        return true;
    }

    self.populateAdminList = function () {
        var url = window.config.rootUri + '/api/UserRolesAPI/' + self.AccountId() + '/AdminsForRole/' + self.Id();

        $.ajax({
            type: 'GET',
            url: url,
            success: function (admins) {
                window.location.hash = 'update';
                self.Id.isPopulated(true);
                self.admins(admins);
            }
        });
    }

    self.removeUserFromRole = function (vm) {
        var url = window.config.rootUri + '/api/UserRolesAPI/' + self.AccountId() + '/DeleteFromRole';

        $.ajax({
            type: 'DELETE',
            url: url,
            data: {
                ContactId: vm.Id,
                RoleId: vm.RoleId,
                RoleData: vm.RoleData
            },
            success: function (dbId) {
                window.location.hash = 'update';
                self.admins.remove(vm);
            }
        });
    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var UserRoleViewModel = function(accountId, currentUserId, accountAdminId, accountPhotoAdminId, leagueAdminId, teamAdminId, teamPhotoAdminId, isAccountOwner) {
    
    var self = this;
    self.accountId = accountId;

    self.isAccountOwner = ko.observable(isAccountOwner);
    self.currentUserId = currentUserId;

    self.teamAdminId = teamAdminId;
    self.teamPhotoAdminId = teamPhotoAdminId;
    self.leagueAdminId = leagueAdminId;

    self.showChangeAccountWarning = ko.observable(false);
    self.changeAccountOwnerVisible = ko.observable(true);
    
    self.availableLeagues = ko.observableArray();
    self.availableTeams = ko.observableArray();

    self.adminType = ko.observableArray([
        new AdminTypeViewModel(
        {
            Id: accountAdminId,
            Title: 'Account Administrator',
            HelpText: 'Account administrators have access to everything in the account. This includes leagues, teams, photos and all setup related features.',
            ShowLeagues: false,
            ShowTeams: false,
            AccountId: self.accountId,
            admins: ko.observableArray()
        }),
        new AdminTypeViewModel(
        {
            Id: accountPhotoAdminId,
            Title: 'Account Photo Administrator',
            HelpText: 'Account photo administrators have access to all photo and video functions on the site. They may upload, approve, and delete any photo on the site.',
            ShowLeagues: false,
            ShowTeams: false,
            AccountId: self.accountId,
            admins: ko.observableArray()
        }),
        new AdminTypeViewModel(
        {
            Id: leagueAdminId,
            Title: 'League Administrator',
            HelpText: 'League administrators have access to all functions for a specific league. They can create divisions and teams for a league, but cannot create or delete leagues in the account.',
            ShowLeagues: true,
            ShowTeams: false,
            AccountId: self.accountId,
            admins: ko.observableArray()
        }),
        new AdminTypeViewModel(
        {
            Id: teamAdminId,
            Title: 'Team Administrator',
            HelpText: 'Team administrators have the same access to a team that a manager does. They can enter game statistics and recaps, make announcements, and enter team sponsors.',
            ShowLeagues: false,
            ShowTeams: true,
            AccountId: self.accountId,
            admins: ko.observableArray()
        }),
        new AdminTypeViewModel(
        {
            Id: teamPhotoAdminId,
            Title: 'Team Photo Administrator',
            HelpText: 'Team photo administrators can manage all photos and videos related to a specific team.',
            ShowLeagues: false,
            ShowTeams: true,
            AccountId: self.accountId,
            admins: ko.observableArray()
        })
]);

    self.isTeamAdmin = function (roleId) {

        return (roleId == self.teamAdminId || roleId == self.teamPhotoAdminId);
    }

    self.isTeamPhotoAdmin = function (roleId) {
        return (roleId == self.teamPhotoAdminId);
    }

    self.isLeagueAdmin = function (roleId) {
        return (roleId == self.leagueAdminId);
    }

    // ensure that the select options are populated
    self.getLeagues = function () {

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/Leagues';
        $.ajax({
            type: 'GET',
            url: url,
            success: function (leagues) {
                self.availableLeagues(leagues);
            }
        });
    }

    self.getTeams = function () {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/LeagueTeams';
        $.ajax({
            type: 'GET',
            url: url,
            success: function (teams) {
                window.location.hash = 'update';
                self.availableTeams(teams);
            }
        });
    }

    self.startChangeAccountOwner = function () {
        self.showChangeAccountWarning(true);
        self.changeAccountOwnerVisible(false);
    }

    self.cancelChangeAccountOwner = function () {
        self.showChangeAccountWarning(false);
        self.changeAccountOwnerVisible(true);
    }

    self.changeAccountOwner = function () {

        if (!self.selectedNewOwner)
            return;

        // only current owner can change owner, so this is just saying we changed
        // the user to ourself, which is what is already set.
        if (self.selectedNewOwner == this.currentUserId)
            return;

        $("#changeOwnerModal").modal("show");

        $("#confirmChangeOwnerBtn").one("click", function () {
            self.performChangeOwner();
        });

    }

    self.performChangeOwner = function() {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/AccountOwner',
            data: {
                Id: self.selectedNewOwner.id
            },
            success: function (newOwner) {
                if (self.currentUserId != newOwner) {
                    self.isAccountOwner(false);
                    window.location.hash = 'update';
                }

                self.cancelChangeAccountOwner();
            }
        });
    }

    self.getPlayers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/UserRolesAPI/' + self.accountId + '/SearchContacts',
            dataType: "json",
            data: {
                lastName: searchTerm,
                firstName: '',
                page: 1
            },
            success: function (data) {

                var results = $.map(data, function (item) {
                    var fullName = item.LastName + ", " + item.FirstName;
                    if (item.MiddleName)
                        fullName = fullName + ' ' + item.MiddleName;

                    return {
                        label: fullName,
                        Id: item.Id,
                        PhotoURL: item.PhotoURL,
                        FirstName: item.FirstName,
                        LastName: item.LastName
                    }
                });
                response(results);
            },
        });
    }

    $.ui.autocomplete.prototype._renderItem = function (ul, item) {
        var li = $("<li>");
        li.data("item.autocomplete", item);
        var photoURL = item.PhotoURL;
        li.append("<a><img onerror=\"this.style.display = 'none';\" width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
        li.appendTo(ul);

        return li;
    };
 
    self.selectedNewOwner = null;

    self.selectNewOwner = function (e, ui) {
        if (ui && ui.item) {
            self.selectedNewOwner = {
                id: ui.item.Id,
                text: ui.item.value,
                logo: ui.item.PhotoURL,
                hasLogo: (!!ui.item.PhotoURL),
                selected: ko.observable(true)
            };
        }

        return true;
    }


    $('#accordion').on('show.bs.collapse', function () {

        //get the anchor of the accordian that does not has the class "collapsed"
        var openAnchor = $(this).find('a[data-toggle=collapse]:not(.collapsed)');
        if (openAnchor && openAnchor.length == 1) {
            var vm = ko.dataFor(openAnchor[0]);
            if (vm && !vm.Id.isPopulated()) {
                vm.populateAdminList();
            }
        }
    });

    self.getLeagues();
    self.getTeams();
}
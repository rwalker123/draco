function initPlayerClassifiedViewModel(accountId, isAdmin, contactId) {

    initKOHelpers();

    var elem = document.getElementById("playerClassifiedView");
    if (elem) {
        var vm = new PlayerClassifiedsViewModel(accountId, isAdmin, contactId);
        ko.applyBindings(vm, elem);
    }
}

var PlayerRegisterViewModel = function(data) {
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

    self.Name.extend({
        required: true
    });

    self.EMail.extend({
        required: true,
        email: true
    });

    self.Phone.extend({
        required: true
    });

    self.BirthDate.extend({
        required: true
    });

    self.BirthDate.Age = ko.computed(function () {
        return moment().diff(self.BirthDate(), 'years')
    });

    self.initPositionsPlayedList = function () {
        if (self.PositionsPlayed())
            return self.PositionsPlayed().split(',');
        else
            return [];
    }

    self.PositionsPlayed.List = ko.observableArray(self.initPositionsPlayedList());

    self.update = function (data) {
        ko.mapping.fromJS(data, self);

        if (self.PositionsPlayed())
            self.PositionsPlayed.List(self.PositionsPlayed().split(','));
        else
            self.PositionsPlayed(null);
    }

    self.toJS = function () {
        if (self.PositionsPlayed.List())
            self.PositionsPlayed(self.PositionsPlayed.List().toString());
        else
            self.PositionsPlayed('');

        var js = ko.mapping.toJS(self);
        return js;
    }
}

var TeamEventRegisterViewModel = function (data) {
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

    self.TeamEventName.extend({
        required: true
    });

    self.CreatedByContactId.extend({
        required: true
    });

    self.initPositionsNeededList = function () {
        if (self.PositionsNeeded())
            return self.PositionsNeeded().split(',');
        else
            return [];
    }

    self.PositionsNeeded.List = ko.observableArray(self.initPositionsNeededList());

    self.update = function (data) {
        ko.mapping.fromJS(data, self);

        if (self.PositionsNeeded())
            self.PositionsNeeded.List(self.PositionsNeeded().split(','));
        else
            self.PositionsNeeded(null);
    }

    self.toJS = function () {
        if (self.PositionsNeeded.List())
            self.PositionsNeeded(self.PositionsNeeded.List().toString());
        else
            self.PositionsNeeded('');

        var js = ko.mapping.toJS(self);
        return js;
    }
}

var ContactViewModel = function (data) {
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

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var PlayerClassifiedsViewModel = function (accountId, isAdmin, contactId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.contactId = contactId;
    self.contact = ko.observable();
    self.isSaving = ko.observable(false);

    self.playersLooking = ko.observableArray();
    self.teamsLooking = ko.observableArray();

    self.EmptyPlayerData = {
        Id: 0,
        AccountId: self.accountId,
        DateCreated: new Date(),
        Name: '',
        EMail: '',
        Phone: '',
        Experience: '',
        PositionsPlayed: '',
        BirthDate: '',
        CanEdit: true
    }

    self.EmptyTeamData = {
        Id: 0,
        AccountId: self.accountId,
        DateCreate: new Date(),
        CreatedByContactId: self.contactId,
        TeamEventName: '',
        Description: '',
        PositionsNeeded: '',
        EMail: '',
        Phone: '',
        CreatedByName: '',
        CreatedByPhotoUrl: ''
    }

    self.currentPlayerEdit = ko.validatedObservable(new PlayerRegisterViewModel(self.EmptyPlayerData));
    self.currentTeamEdit = ko.validatedObservable(new TeamEventRegisterViewModel(self.EmptyTeamData));

    self.showPlayerRegisterForm = ko.observable(false);
    self.showTeamRegisterForm = ko.observable(false);

    self.registerPlayer = function () {
        self.currentPlayerEdit().update(self.EmptyPlayerData);

        self.showPlayerRegisterForm(true);
        self.showTeamRegisterForm(false);
    }

    self.cancelRegisterPlayer = function () {
        self.showPlayerRegisterForm(false);
    }

    self.editPlayerRegistration = function (vm) {
        self.currentPlayerEdit().update(vm.toJS());

        self.showPlayerRegisterForm(true);
        self.showTeamRegisterForm(false);
    }

    self.saveRegisterPlayer = function () {
        if (!self.currentPlayerEdit.isValid())
            return;

        var url = window.config.rootUri + '/api/PlayerClassifiedAPI/' + self.accountId + '/teamswanted';

        var data = self.currentPlayerEdit().toJS();
        data.DateCreated = moment(new Date()).format("MM DD, YYYY");

        var type = "POST";

        if (data.Id) {
            type = "PUT";
            url = url + '/' + data.Id;
        }
        else {
            url = url + '/?r=' + window.location;
        }

        self.isSaving(true);

        $.ajax({
            type: type,
            url: url,
            data: data,
            success: function (registeredPlayer) {
                if (data.Id) {
                    var vm = ko.utils.arrayFirst(self.playersLooking(), function (t) {
                        return (t.Id() == data.Id)
                    });

                    if (vm)
                        vm.update(registeredPlayer);
                }
                else {
                    self.playersLooking.push(new PlayerRegisterViewModel(registeredPlayer));
                }
            },
            complete: function () {
                self.isSaving(false);
                self.cancelRegisterPlayer();
            }

        });
    }

    self.registerTeam = function () {
        self.currentTeamEdit().update(self.EmptyTeamData);

        self.showPlayerRegisterForm(false);
        self.showTeamRegisterForm(true);
    }

    self.editTeamRegistration = function (vm) {
        self.currentTeamEdit().update(vm.toJS());

        self.showPlayerRegisterForm(false);
        self.showTeamRegisterForm(true);
    }

    self.cancelRegisterTeam = function () {
        self.showTeamRegisterForm(false);
    }

    self.saveRegisterTeam = function () {
        if (!self.currentTeamEdit.isValid())
            return;

        var url = window.config.rootUri + '/api/PlayerClassifiedAPI/' + self.accountId + '/playerswanted';

        var data = self.currentTeamEdit().toJS();
        data.DateCreated = moment(new Date()).format("MM DD, YYYY");

        var type = "POST";

        if (data.Id) {
            type = "PUT";
            url = url + "/" + data.Id;
        }

        $.ajax({
            type: type,
            url: url,
            data: data,
            success: function (registeredTeam) {
                if (data.Id) {
                    var vm = ko.utils.arrayFirst(self.teamsLooking(), function (t) {
                        return (t.Id() == data.Id)
                    });

                    if (vm)
                        vm.update(registeredTeam);
                }
                else {
                    self.teamsLooking.push(new TeamEventRegisterViewModel(registeredTeam));
                }

                self.cancelRegisterTeam();
            }
        });
    }

    self.deletePlayerRegistration = function (vm) {
        $("#deleteModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.performDeletePlayerRegistration(vm);
        });
    }

    self.performDeletePlayerRegistration = function (vm) {
        var url = window.config.rootUri + '/api/PlayerClassifiedAPI/' + self.accountId + '/teamswanted/' + vm.Id();

        if (self.accessCode) {
            url = url + '?c=' + self.accessCode;
        }

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.playersLooking.remove(vm);
            }
        })
    }

    self.deleteTeamRegistration = function (vm) {
        $("#deleteModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.performDeleteTeamRegistration(vm);
        });
    }

    self.performDeleteTeamRegistration = function (vm) {
        var url = window.config.rootUri + '/api/PlayerClassifiedAPI/' + self.accountId + '/playerswanted/' + vm.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.teamsLooking.remove(vm);
            }
        })
    }

    self.getContact = function () {
        var url = window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts/' + self.contactId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (contactDetails) {
                self.contact(new ContactViewModel(contactDetails));
                self.EmptyPlayerData.EMail = contactDetails.Email;
                self.EmptyPlayerData.Name = contactDetails.FullNameFirst;
                self.EmptyPlayerData.Phone = contactDetails.Phone1;

                self.EmptyTeamData.EMail = contactDetails.Email;
                self.EmptyTeamData.CreatedByName = contactDetails.FullNameFirst;
                self.EmptyTeamData.Phone = contactDetails.Phone1;
                self.EmptyTeamData.CreatedByPhotoUrl = contactDetails.PhotoURL;
            }
        })
    }

    self.getAccessCode = function () {
        // get querystring as an array split on "&"
        var querystring = location.search.replace('?', '').split('&');
        // declare object
        var queryObj = {};
        // loop through each name-value pair and populate object
        for (var i = 0; i < querystring.length; i++) {
            // get name and value
            var name = querystring[i].split('=')[0];
            var value = querystring[i].split('=')[1];
            // populate object
            queryObj[name] = value;
        }

        return queryObj["c"];
    }

    self.accessCode = self.getAccessCode();

    self.loadPlayersLooking = function () {
        var url = window.config.rootUri + '/api/PlayerClassifiedAPI/' + self.accountId + '/teamswanted';

        if (self.accessCode)
        {
            url = url + '?c=' + self.accessCode;
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (playersLooking) {
                var mappedPlayers = $.map(playersLooking, function (player) {
                    return new PlayerRegisterViewModel(player);
                });

                self.playersLooking(mappedPlayers);
            }
        });

    }

    self.loadTeamsLooking = function () {
        var url = window.config.rootUri + '/api/PlayerClassifiedAPI/' + self.accountId + '/playerswanted';

        $.ajax({
            type: "GET",
            url: url,
            success: function (teamsLooking) {
                var mappedTeams = $.map(teamsLooking, function (team) {
                    return new TeamEventRegisterViewModel(team);
                });

                self.teamsLooking(mappedTeams);
            }
        });

    }

    if (self.contactId > 0)
        self.getContact();

    self.loadPlayersLooking();
    self.loadTeamsLooking();
}

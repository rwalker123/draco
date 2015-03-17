function InitRosterViewModel(accountId, isAdmin, isTeamAdmin, teamId, firstYear) {
    var rosterElem = document.getElementById("roster");
    if (rosterElem) {

        var rosterVM = new RosterViewModel(accountId, isAdmin, isTeamAdmin, teamId, firstYear);
        rosterVM.init();
        ko.applyBindings(rosterVM, rosterElem);
    }
}

var PlayerViewModel = function (accountId, data) {
    var self = this;

    self.accountId = accountId;

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

    self.Contact.Email.extend({ email: true });
    self.Contact.DateOfBirth.extend({ required: true });

    self.Contact.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.Contact.Id();
    });

    self.DateAdded.Formatted = ko.computed(function () {
        return self.DateAdded() ? moment(self.DateAdded()).format("MM DD, YYYY") : '';
    });

    self.Contact.DateOfBirth.Formatted = ko.computed(function () {
        return self.Contact.DateOfBirth() ? moment(self.Contact.DateOfBirth()).format("MMM DD, YYYY") : '';
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var RosterViewModel = function (accountId, isAdmin, isTeamAdmin, teamId, firstYear) {
    var self = this;

    self.accountId = accountId;
    self.teamId = teamId;
    self.isAdmin = isAdmin;
    self.isTeamAdmin = isTeamAdmin;

    self.firstYear = firstYear;

    self.players = ko.observableArray();

    self.signPlayerVisible = ko.observable(false);

    self.init = function () {
        var elem = $("#handoutSelectedFileName");

        elem.bind('dragenter', function (e) {
            $(this).addClass('dragover');
        });

        elem.bind('dragleave drop', function (e) {
            $(this).removeClass('dragover');
        });


        self.loadPlayers();
    }

    self.selectedPlayer = ko.observable();

    self.isPlayerSelected = ko.computed(function () {
        return self.selectedPlayer();
    })

    // save player data while editing, restore if cancelled.
    var emptyPlayer = new PlayerViewModel(accountId, {
        Id: 0,
        TeamId: self.teamId,
        AccountId: self.accountId,
        PlayerNumber: 0,
        DateAdded: new Date(),
        AffiliationDuesPaid: '',
        SubmittedWaiver: false,
        SubmittedDriversLicense: false,
        Contact: {
            Id: 0,
            Email: '',
            LastName: '',
            FirstName: '',
            MiddleName: '',
            Phone1: '',
            Phone2: '',
            Phone3: '',
            CreatorAccountId: 0,
            StreetAddress: '',
            City: '',
            State: '',
            Zip: '',
            FirstYear: 0,
            DateOfBirth: new Date(),
            IsFemale: false,
            UserId: '',
            GamesPlayed: 0
        }
    });

    self.currentEditPlayer = ko.validatedObservable(new PlayerViewModel(self.accountId, emptyPlayer.toJS()));

    self.editPlayer = function (player) {        
        self.currentEditPlayer().update(player.toJS());
        $("#FirstYearSelect").selectpicker("refresh");
        $("#GenderSelect").selectpicker("refresh");
    }

    self.cancelEditPlayer = function (player) {
        self.currentEditPlayer().update(emptyPlayer.toJS());
    }

    self.editPlayerNumber = function (player) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/playernumber/' + player.Id(),
            data: {
                PlayerNumber: self.currentEditPlayer().PlayerNumber(),
            },
            success: function () {

                player.PlayerNumber(self.currentEditPlayer().PlayerNumber());
                self.currentEditPlayer().update(emptyPlayer.toJS());
            }
        });
    }

    self.newPlayerFirstName = ko.observable('');
    self.newPlayerMiddleName = ko.observable('');
    self.newPlayerLastName = ko.observable('');

    self.createPlayer = function () {
        self.validateNameIsAvailable();
    }

    self.validateNameIsAvailable = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/DoesContactNameExist',
            data: {
                Id: 0,
                FirstName: self.newPlayerFirstName(),
                LastName: self.newPlayerLastName(),
                MiddleName: self.newPlayerMiddleName()
            },
            success: function (response) {
                if (!response)
                    self.createUser();
                else
                    alert('player name already exists.');
            }
        });
    }

    self.createUser = function () {
        var url = window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts';
        $.ajax({
            type: "POST",
            url: url,
            data: {
                Email: '',
                FirstName: self.newPlayerFirstName(),
                LastName: self.newPlayerLastName(),
                MiddleName: self.newPlayerMiddleName(),
                StreetAddress: '',
                City: '',
                State: '',
                Zip: '',
                DateOfBirth: moment(new Date()).format('MMMM D, YYYY'),
                FirstYear: (new Date()).getFullYear(),
                Phone1: '',
                Phone2: '',
                Phone3: '',
                IsFemale: false
            },
            success: function (data) {
                self.selectedPlayer({
                    Id: +data
                });

                self.newPlayerFirstName('');
                self.newPlayerMiddleName('');
                self.newPlayerLastName('');

                self.signPlayer();
            },
        });
    }

    self.savePlayer = function (player) {

        if (!self.currentEditPlayer() && !self.currentEditPlayer().isValid())
            return;

        var data = self.currentEditPlayer().toJS();

        if (!data.Contact.DateOfBirth) {
            alert('must enter birthdate');
            return;
        }

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + player.Id(),
            data: data,
            success: function () {
                player.update(data);
                self.currentEditPlayer().update(emptyPlayer.toJS());
            }
        });

    }

    self.showSignPlayer = function () {
        if (self.signPlayerVisible()) {
            self.signPlayerVisible(false);
        }
        else {
            self.signPlayerVisible(true);
        }
    }

    self.releasePlayer = function (player) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + player.Id(),
            success: function () {
                self.players.remove(player);
            }
        });
    }

    self.deletePlayer = function (player) {
        $("#deletePlayerModal").modal("show");

        $("#confirmPlayerDeleteBtn").one("click", function () {
            self.makePlayerDeleteCall(player)
        });
    }

    self.makePlayerDeleteCall = function (player) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/players/' + player.Id(),
            success: function () {
                self.players.remove(player);
            }
        });

    }

    self.signPlayer = function () {
        if (!self.selectedPlayer())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/Team/' + self.teamId + '/roster/' + self.selectedPlayer().Id,
            success: function (item) {
                var player = new PlayerViewModel(self.accountId, item);

                self.players.push(player);
                self.players.sort(function (left, right) {
                    var lName = left.Contact.FullName().toUpperCase();
                    var rName = right.Contact.FullName().toUpperCase();
                    return lName == rName ? 0 : (lName < rName ? -1 : 1);
                });

                self.selectedPlayer(null);

            }
        });
    }

    self.loadPlayers = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/players',
            success: function (data) {
                var mappedPlayers = $.map(data, function (item) {
                    return new PlayerViewModel(self.accountId, item);
                });

                self.players(mappedPlayers);
            }
        });

    }

    self.getPlayers = function (query, cb) {

        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/availableplayers',
            data: {
                lastName: query,
                firstName: '',
                page: 1
            },
            success: function (data) {

                var results = $.map(data, function (item) {
                    var fullName = item.LastName + ", " + item.FirstName;
                    if (item.MiddleName)
                        fullName += " " + item.MiddleName;

                    return {
                        label: fullName,
                        Id: item.Id,
                        PhotoURL: item.PhotoURL,
                        FirstName: item.FirstName,
                        LastName: item.LastName
                    }
                });
                cb(results);
            }
        });
    }

    self.availableYears = ko.observableArray([]);

    self.availableGenders = ko.observableArray([
    { id: false, name: "Male" },
    { id: true, name: "Female" }
    ]);

    self.availableStates = ko.observableArray([
        { name: "Alabama", abbrev: "AL" },
        { name: "Alaska", abbrev: "AK" },
        { name: "Arizona", abbrev: "AZ" },
        { name: "Arkansas", abbrev: "AR" },
        { name: "California", abbrev: "CA" },
        { name: "Colorado", abbrev: "CO" },
        { name: "Connecticut", abbrev: "CT" },
        { name: "Delaware", abbrev: "DE" },
        { name: "Florida", abbrev: "FL" },
        { name: "Georgia", abbrev: "GA" },
        { name: "Hawaii", abbrev: "HI" },
        { name: "Idaho", abbrev: "ID" },
        { name: "Illinois", abbrev: "IL" },
        { name: "Indiana", abbrev: "IN" },
        { name: "Iowa", abbrev: "IA" },
        { name: "Kansas", abbrev: "KS" },
        { name: "Kentucky", abbrev: "KY" },
        { name: "Louisiana", abbrev: "LA" },
        { name: "Maine", abbrev: "ME" },
        { name: "Maryland", abbrev: "MD" },
        { name: "Massachusetts", abbrev: "MA" },
        { name: "Michigan", abbrev: "MI" },
        { name: "Minnesota", abbrev: "MN" },
        { name: "Mississippi", abbrev: "MS" },
        { name: "Missouri", abbrev: "MO" },
        { name: "Montana", abbrev: "MT" },
        { name: "Nebraska", abbrev: "NE" },
        { name: "Nevada", abbrev: "NV" },
        { name: "New Hampshire", abbrev: "NH" },
        { name: "New Jersey", abbrev: "NJ" },
        { name: "New Mexico", abbrev: "NM" },
        { name: "New York", abbrev: "NY" },
        { name: "North Carolina", abbrev: "NC" },
        { name: "North Dakota", abbrev: "ND" },
        { name: "Ohio", abbrev: "OH" },
        { name: "Oklahoma", abbrev: "OK" },
        { name: "Oregon", abbrev: "OR" },
        { name: "Pennsylvania", abbrev: "PA" },
        { name: "Rhode Island", abbrev: "RI" },
        { name: "South Carolina", abbrev: "SC" },
        { name: "South Dakota", abbrev: "SD" },
        { name: "Tennessee", abbrev: "TN" },
        { name: "Texas", abbrev: "TX" },
        { name: "Utah", abbrev: "UT" },
        { name: "Vermont", abbrev: "VT" },
        { name: "Virginia", abbrev: "VA" },
        { name: "Washington", abbrev: "WA" },
        { name: "West Virginia", abbrev: "WV" },
        { name: "Wisconsin", abbrev: "WI" },
        { name: "Wyoming", abbrev: "WY" }
    ]);

    self.initFirstYear = function () {
        var currentYear = (new Date).getFullYear();
        if (self.firstYear > 0) {
            var maxBack = 50;
            while (maxBack >= 0 && currentYear >= self.firstYear) {
                self.availableYears.push({ name: currentYear + '' });
                currentYear--;
                maxBack--;
            }
        }
    }

    self.initFirstYear();
}
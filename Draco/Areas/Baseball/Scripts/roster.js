function InitRosterViewModel(accountId, isAdmin, isTeamAdmin, teamId) {
    var rosterElem = document.getElementById("roster");
    if (rosterElem) {

        $.ui.autocomplete.prototype._renderItem = function (ul, item) {
            var li = $("<li>");
            li.data("item.autocomplete", item);
            var photoURL = item.PhotoURL ? item.PhotoURL : window.config.rootUri + '/Images/defaultperson.png';
            li.append("<a><img width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
            li.appendTo(ul);

            return li;
        };

        var rosterVM = new RosterViewModel(accountId, isAdmin, isTeamAdmin, teamId);
        rosterVM.init();
        ko.applyBindings(rosterVM, rosterElem);
    }
}

var PlayerViewModel = function (accountId, contactId) {
    var self = this;

    self.id = 0;
    self.contactId = contactId;
    self.accountId = accountId;
    self.PhotoUrl = '';
    self.DateSigned = '';
    self.Age = '';

    self.PlayerNumber = ko.protectedObservable(0);
    self.Name = ko.protectedObservable('');
    self.SubmittedWaiver = ko.protectedObservable(false);
    self.SubmittedDriversLicense = ko.protectedObservable(false);
    self.AffiliationDuesPaid = ko.protectedObservable('');
    self.viewMode = ko.observable(true);
    self.editPlayerNumber = ko.observable(false);

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.contactId;
    });


    self.commit = function () {
        self.PlayerNumber.commit();
        self.Name.commit();
        self.SubmittedWaiver.commit();
        self.SubmittedDriversLicense.commit();
        self.AffiliationDuesPaid.commit();
    }

    self.reset = function () {
        self.PlayerNumber.reset();
        self.Name.reset();
        self.SubmittedWaiver.reset();
        self.SubmittedDriversLicense.reset();
        self.AffiliationDuesPaid.reset();
    }

    self.editPlayerNumberMode = function () {
        self.editPlayerNumber(!self.editPlayerNumber());
    }

    self.cancelEditPlayerNumber = function () {
        self.editPlayerNumber(false);
    }
}

var RosterViewModel = function (accountId, isAdmin, isTeamAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.teamId = teamId;
    self.isAdmin = isAdmin;
    self.isTeamAdmin = isTeamAdmin;

    self.players = ko.observableArray();

    self.signPlayerVisible = ko.observable(false);

    self.selectedPlayer = ko.observable();

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

    self.isPlayerSelected = ko.computed(function () {
        return self.selectedPlayer();
    })

    self.editPlayer = function (player) {
        player.viewMode(!player.viewMode());
    }

    self.cancelEditPlayer = function (player) {
        player.viewMode(true);
        player.reset();
    }

    self.editPlayerNumber = function (player) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/playernumber/' + player.id,
            data: {
                PlayerNumber: player.PlayerNumber.uncommitValue(),
            },
            success: function (item) {
                player.commit();

                player.viewMode(true);
                player.commit();

                player.cancelEditPlayerNumber();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.savePlayer = function (player) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + player.id,
            data: {
                SubmittedWaiver: player.SubmittedWaiver.uncommitValue(),
                SubmittedDriversLicense: player.SubmittedDriversLicense.uncommitValue(),
                PlayerNumber: player.PlayerNumber.uncommitValue(),
                AffiliationDuesPaid: player.AffiliationDuesPaid.uncommitValue()
            },
            success: function (item) {
                player.commit();

                player.viewMode(true);
                player.commit();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
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
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + player.id,
            success: function () {
                self.players.remove(player);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
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
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/players/' + player.id,
            success: function () {
                self.players.remove(player);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.signPlayer = function () {
        if (!self.selectedPlayer())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + self.selectedPlayer().id,
            success: function (item) {
                var player = new PlayerViewModel(self.accountId, item.Contact.Id);
                player.id = item.Id;
                player.Name(item.Contact.FullName);
                player.PhotoUrl = item.Contact.PhotoURL;
                player.Age = item.Age;
                player.PlayerNumber(item.PlayerNumber);
                player.DateSigned = moment(item.DateAdded).format("MM DD, YYYY");
                player.SubmittedWaiver(item.SubmittedWaiver);
                player.SubmittedDriversLicense(item.SubmittedDriversLicense);
                player.AffiliationDuesPaid(item.AffiliationDuesPaid);
                player.commit();

                self.players.push(player);
                self.players.sort(function (left, right) {
                    var lName = left.Name().toUpperCase();
                    var rName = right.Name().toUpperCase();
                    return lName == rName ? 0 : (lName < rName ? -1 : 1);
                });

                self.selectedPlayer(null);
                $("input.autocomplete").val('');

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.loadPlayers = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/players',
            success: function (data) {
                var mappedPlayers = $.map(data, function (item) {
                    var player = new PlayerViewModel(self.accountId, item.Contact.Id);
                    player.id = item.Id;
                    player.PhotoUrl = item.Contact.PhotoURL;
                    player.DateSigned = item.DateAdded ? moment(item.DateAdded).format("MM DD, YYYY") : '';
                    player.Age = item.Age;

                    player.PlayerNumber(item.PlayerNumber);
                    player.Name(item.Contact.FullName);
                    player.SubmittedWaiver(item.SubmittedWaiver);
                    player.SubmittedDriversLicense(item.SubmittedDriversLicense);
                    player.AffiliationDuesPaid(item.AffiliationDuesPaid);
                    player.commit();

                    return player;
                });

                self.players(mappedPlayers);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.getPlayers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/availableplayers',
            data: {
                lastName: searchTerm,
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
                response(results);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.selectPlayer = function (e, ui) {
        if (ui && ui.item) {
            self.selectedPlayer({
                id: ui.item.Id,
                text: ui.item.value,
                logo: ui.item.PhotoURL,
                hasLogo: (!!ui.item.PhotoURL)
            });
        }

        return true;
    }

}
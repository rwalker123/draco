function InitManagersViewModel(accountId, isAdmin, isTeamAdmin, teamId) {
    var managersElem = document.getElementById("teamManagers");
    if (managersElem) {

        $.ui.autocomplete.prototype._renderItem = function (ul, item) {
            var li = $("<li>");
            li.data("item.autocomplete", item);
            var photoURL = item.PhotoURL ? item.PhotoURL : window.config.rootUri + '/Images/defaultperson.png';
            li.append("<a><img width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
            li.appendTo(ul);

            return li;
        };

        var managersVM = new ManagersViewModel(accountId, isAdmin, isTeamAdmin, teamId);
        ko.applyBindings(managersVM, managersElem);
    }
}

var ManagerViewModel = function (accountId, contactId, name, photoUrl) {
    var self = this;

    self.accountId = accountId;
    self.name = name;
    self.photoUrl = photoUrl;
    self.contactId = contactId;

    self.viewMode = ko.observable(true);

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.contactId;
    });
}

var ManagersViewModel = function (accountId, isAdmin, isTeamAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.isTeamAdmin = isTeamAdmin;
    self.teamId = teamId;

    self.managers = ko.observableArray();

    self.viewMode = ko.observable(true);

    self.selectedPlayer = ko.observable();

    self.isPlayerSelected = ko.computed(function () {
        return self.selectedPlayer();
    })

    self.removeManager = function (manager) {
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/managers/' + manager.contactId,
            success: function (manager) {
                var fullName = manager.FirstName + " " + manager.LastName;

                var mvm = new ManagerViewModel(self.accountId, manager.Id, fullName, manager.PhotoURL);
                self.managers.push(mvm);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.addManagerMode = function () {
        self.viewMode(!self.viewMode());
    }

    self.addManager = function () {
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/managers/' + self.selectedPlayer().id,
            success: function (manager) {
                var fullName = manager.FirstName + " " + manager.LastName;

                var mvm = new ManagerViewModel(self.accountId, manager.Id, fullName, manager.PhotoURL);
                self.managers.push(mvm);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.getManagers = function () {
        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/managers',
            success: function (managers) {

                var results = $.map(managers, function (manager) {
                    var fullName = manager.FirstName + " " + manager.LastName;

                    return new ManagerViewModel(self.accountId, manager.Id, fullName, manager.PhotoURL);
                });

                self.managers(results)
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.getAvailableManagers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/availablemanagers',
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

    self.getManagers();

}

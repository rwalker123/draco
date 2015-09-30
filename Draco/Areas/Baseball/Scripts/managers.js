function InitManagersViewModel(accountId, isAdmin, isTeamAdmin, teamId) {
    var managersElem = document.getElementById("teamManagers");
    if (managersElem) {

        var managersVM = new ManagersViewModel(accountId, isAdmin, isTeamAdmin, teamId);
        ko.applyBindings(managersVM, managersElem);
    }
}

var ManagerViewModel = function (accountId, data) {
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

    self.viewMode = ko.observable(true);

    self.name = ko.computed(function () {
        return self.Contact.FullNameFirst();
    });

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.Id();
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

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
        var url = window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/managers/' + manager.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.managers.remove(manager);
            }
        });
    }

    self.addManagerMode = function () {
        self.viewMode(!self.viewMode());
    }

    self.addManager = function () {
        var url = window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/managers/' + self.selectedPlayer().Id;
        $.ajax({
            type: "POST",
            url: url,
            success: function (manager) {
                var mvm = new ManagerViewModel(self.accountId, manager);
                self.managers.push(mvm);
                self.selectedPlayer(null);
            }
        });

    }

    self.getManagers = function () {
        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/managers',
            success: function (managers) {

                var results = $.map(managers, function (manager) {
                    return new ManagerViewModel(self.accountId, manager);
                });

                self.managers(results);
            }
        });

    }

    self.getAvailableManagers = function (query, cb) {

        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/availablemanagers',
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

    self.getManagers();
}

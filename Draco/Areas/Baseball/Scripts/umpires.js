function initViewModel(accountId) {
    initKOHelpers();

    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });

    var umpireData = new UmpiresClass(accountId);
    ko.applyBindings(umpireData);
    umpireData.populateUmpires();
}

var UserDetailsViewModel = function (data) {
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

var UmpireViewModel = function (data, accountId) {
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

    self.fullName = ko.computed(function () {
        var fullName = self.LastName() + ', ' + self.FirstName();
        if (self.MiddleName())
            fullName += ' ' + self.MiddleName();

        return fullName;
    });

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.ContactId();
    });

    self.Details = ko.observable();

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var UmpiresClass = function (accountId) {
    var self = this;
    self.accountId = accountId;

    self.umpires = ko.observableArray();

    self.selectedPlayer = ko.observable();
    self.hasSelectedPlayer = ko.computed(function () {
        return self.selectedPlayer() != null;
    }, self);

    self.getPlayers = function (query, cb) {

        $.ajax({
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/AvailableUmpires',
            dataType: "json",
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

    self.addUmpire = function () {
        if (!self.hasSelectedPlayer())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/umpire/' + self.selectedPlayer().Id,
            dataType: "json",
            success: function (data) {
                var vm = new UmpireViewModel(data, self.accountId);
                self.umpires.push(vm);
                self.umpires.sort(self.sortByName);
                self.selectedPlayer(null);
            }
        });
    }

    self.sortByName = function (l, r) {
        var lName = l.fullName().toUpperCase();
        var rName = r.fullName().toUpperCase();
        return lName == rName ? 0 : (lName < rName ? -1 : 1);
    }

    self.populateUmpires = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId,
            success: function (data) {
                var mappedUsers = $.map(data, function (item) {
                    return new UmpireViewModel(item, item.AccountId);
                });

                self.umpires(mappedUsers);
            }
        });
    }

    self.deleteUmpire = function (umpire) {
        // make Ajax call to save.
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/umpire/' + umpire.Id(),
            success: function (data) {
                // remove from data model.
                self.umpires.remove(umpire);
            }
        });
    }

    self.fillUmpireDetails = function (userData) {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts/' + userData.ContactId(),
            success: function (data) {
                userData.Details(new UserDetailsViewModel(data));
            }
        });
    }

    $('#accordion').on('show.bs.collapse', function () {

        //get the anchor of the accordian that does not has the class "collapsed"
        var openAnchor = $(this).find('a[data-toggle=collapse]:not(.collapsed)');
        if (openAnchor && openAnchor.length == 1) {
            var vm = ko.dataFor(openAnchor[0]);
            if (vm && !vm.Details()) {
                self.fillUmpireDetails(vm);
            }
        }
    });

}


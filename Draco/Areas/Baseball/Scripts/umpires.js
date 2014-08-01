function initViewModel(accountId) {
    initKOHelpers();

    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });

    $.ui.autocomplete.prototype._renderItem = function (ul, item) {
        var li = $("<li>");
        li.data("item.autocomplete", item);
        var photoURL = item.PhotoURL ? item.PhotoURL : window.config.rootUri + '/Images/defaultperson.png';
        li.append("<a><img width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
        li.appendTo(ul);

        return li;
    };

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

    self.selectedPlayer = ko.observable(null);
    self.hasSelectedPlayer = ko.computed(function () {
        return self.selectedPlayer() != null;
    }, self);

    self.getPlayers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/AvailableUmpires',
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

    self.addUmpire = function () {
        if (!self.hasSelectedPlayer())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/umpire/' + self.selectedPlayer().id,
            dataType: "json",
            success: function (data) {
                var vm = new UmpireViewModel(data, self.accountId);
                self.umpires.push(vm);
                self.umpires.sort(self.sortByName);
                self.selectedPlayer(null);
                $("#_newUmpire").val('');
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


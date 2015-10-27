function initUserProfileData(accountId, contactId) {
    initKOHelpers();

    var userData = new UserProfileClass(accountId, contactId);
    ko.applyBindings(userData, document.getElementById("contact"));
}

var UserClass = function (data, accountId) {
    var self = this;
    self.accountId = accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'details': {
        //    create: function (options) {
        //        return ko.validatedObservable(new UserClassDetails(options.data, self.accountId));
        //    }
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

var UserProfileClass = function (accountId, contactId) {
    var self = this;
    self.accountId = accountId;
    self.contactId = contactId;

    self.editMode = ko.observable(false);

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

    self.emptyUser = new UserClass({
        Id: 0,
        StreetAddress: '',
        City: '',
        State: '',
        Zip: '',
        Phone1: '',
        Phone2: '',
        Phone3: '',
        PhotoURL: ''
    });

    self.user = ko.observable(self.emptyUser, self.accountId);
    self.editUser = ko.validatedObservable(self.emptyUser, self.accountId);

    self.editInfo = function () {
        self.editUser().update(self.user().toJS());

        self.editMode(true);
    }

    self.cancelEditInfo = function () {
        self.editMode(false);
    }

    self.saveEditInfo = function (userData) {
        if (!self.editUser.isValid())
            return;

        var data = userData.toJS();

        var url = window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contactinfo'; // don't register for now. UI is messed up. ?register=1';
        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function () {
                self.user().update(data);
                self.editMode(false);
            }
        });
    }

    self.getUser = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts/' + self.contactId,
            success: function (data) {
                if (data) {
                    self.user().update(data);
                    $(".selectpicker").selectpicker();

                }
            }
        });
    }

    self.getUser();
}

function initMemberBusinessViewModel(accountId, isAdmin, contactId) {

    initKOHelpers();

    ko.validation.rules['url'] = {
        validator: function (val, required) {
            if (!val) {
                return !required
            }
            val = val.replace(/^\s+|\s+$/, ''); //Strip whitespace
            //Regex by Diego Perini from: http://mathiasbynens.be/demo/url-regex
            return val.match(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.‌​\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[‌​6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1‌​,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00‌​a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u‌​00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i);
        },
        message: 'This field has to be a valid URL'
    };
    ko.validation.registerExtenders();

    var memberBusinessElem = document.getElementById("memberBusinessView");
    if (memberBusinessElem) {
        var memberBusinessVM = new MemberBusinessesViewModel(accountId, isAdmin, contactId);
        ko.applyBindings(memberBusinessVM, memberBusinessElem);
    }
}

var MemberBusinessViewModel = function (data, accountId) {
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

    self.Website.extend({
        url: true
    });

    self.EMail.extend({
        email: true
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var MemberBusinessesViewModel = function (accountId, isAdmin, contactId) {
    var self = this;

    self.accountId = accountId;
    self.contactId = contactId;
    self.isAdmin = isAdmin;

    self.editMode = ko.observable(false);
    self.startEditBusiness = function () {
        self.editMode(true);
    }

    var emptyBusiness = {
        Id: 0,
        AccountId: self.accountId,
        Name: '',
        StreetAddress: '',
        CityStateZip: '',
        EMail: '',
        Phone: '',
        Website: '',
        Description: '',
        ContactId: self.contactId
    };

    self.memberBusinesses = ko.observableArray();
    self.userBusiness = ko.validatedObservable(new MemberBusinessViewModel(emptyBusiness, self.accountId));

    self.saveEditBusiness = function (data) {
        if (!data.isValid())
            return;
        
        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId;

        if (data.Id() > 0)
            url = url + "/business/" + data.Id();

        $.ajax({
            type: data.Id() > 0 ? "PUT" : "POST",
            url: url,
            data: data.toJS(),
            success: function (sponsor) {
                self.userBusiness().update(sponsor);

                self.editMode(false);
            }
        });

    }
    
    self.cancelEditBusiness = function () {
        self.editMode(false);
    }

    self.deleteBusiness = function (data) {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + "/business/" + data.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.userBusiness().update(emptyBusiness);
            }
        });

    }

    self.adminDeleteBusiness = function (data) {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + "/business/" + data.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.memberBusinesses.remove(data);
            }
        });

    }

    // 3 columns of member business cards.
    self.newBusinessRowClass = function (index) {
        var i = index();
        return (i % 3 == 0);
    }

    self.getMemberBusinesses = function () {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + '/memberbusinesses';

        $.ajax({
            type: "GET",
            url: url,
            success: function (sponsors) {
                var mappedSponsors = $.map(sponsors, function (sponsor) {
                    if (sponsor.Id != self.userBusiness().Id()) {
                        sponsor.AccountId = self.accountId;
                        return new MemberBusinessViewModel(sponsor, self.accountId);
                    }
                });

                self.memberBusinesses(mappedSponsors);
            }
        });

    }

    self.getUserBusiness = function () {
        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + '/userbusiness/' + self.contactId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (sponsor) {
                sponsor.AccountId = self.accountId;

                self.userBusiness().update(sponsor);
                self.getMemberBusinesses();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 404) {
                    self.getMemberBusinesses();
                }
                else {
                    reportAjaxError(url, xhr, ajaxOptions, thrownError);
                }
            }
        });
    }

    self.getUserBusiness();

}

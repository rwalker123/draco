function initUserData(accountId, pageSize, firstYear) {
    initKOHelpers();

    var userData = new UsersClass(accountId, pageSize, firstYear);
    ko.applyBindings(userData, document.getElementById("accordion"));

    var newUserData = new UserClass(accountId, firstYear, true);
    newUserData.selectedView('editUserDetailsTemplate');
    newUserData.detailsVisible(false);

    ko.applyBindings(newUserData, document.getElementById("newContact"));

    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });

    $('#newContact').validate({
        submitHandler: function (form) {
            userData.createUser(form);
        },
        rules: {
            firstname: { required: true, minlength: 1 },
            lastname: { required: true, minlength: 1 },
            email: { email: true }
        },
        errorPlacement: function (error, element) {
            error.appendTo($("#newContact > .contactView > .contactErrorLocation"));
        }
    });

    userData.populateUsers();
}

var UserClass = function (accountId, firstYear, showCreateAccount) {
    var self = this;

    self.firstYear = firstYear;
    self.availableYears = ko.observableArray([]);

    self.showCreateAccount = ko.observable(showCreateAccount);
    self.createAccount = ko.observable(false);

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
    self.accountId = accountId;

    var initDate = new Date();
    var newYear = initDate.getFullYear() - 21;
    initDate.setYear(newYear);

    // declare ko stuff here, otherwise it is static to the class.
    self.id = ko.observable(0);
    self.firstName = ko.protectedObservable('');
    self.middleName = ko.protectedObservable('');
    self.lastName = ko.protectedObservable('');
    self.photoUrl = '';

    self.details = {
        loaded: false,
        email: ko.protectedObservable(''),
        userid: ko.observable(''),
        address: ko.protectedObservable(''),
        city: ko.protectedObservable(''),
        state: ko.protectedObservable(''),
        zip: ko.protectedObservable(''),
        birthdate: ko.protectedObservable(''),
        firstYear: ko.protectedObservable((new Date()).getFullYear()),
        phone1: ko.protectedObservable(''),
        phone2: ko.protectedObservable(''),
        phone3: ko.protectedObservable(''),
        gender: ko.protectedObservable(''),
    };

    self.birthdateDisplay = ko.computed(function () {
        if (!self.details.birthdate())
            return '';
        else
            return moment(new Date(self.details.birthdate())).format('MMMM D, YYYY');
    });


    self.namesEnabled = ko.observable(true);
    self.detailsVisible = ko.observable(true);
    self.selectedView = ko.observable('viewUserDetailsTemplate'); // toggle between edit/view templates.
    self.validatingName = ko.observable(false);

    self.isLocked = ko.observable(false);

    self.isRegistered = ko.computed(function () {
        return self.details.userid() && self.details.userid().length > 0;
    }, this);

    self.canRegister = ko.computed(function () {
        // must have email and can't be already registered.
        var hasEmail = self.details.email() && self.details.email().length > 0;
        return !self.isRegistered() && hasEmail;
    }, this);

    self.fullName = ko.computed(function () {
        var fullName = self.lastName() + ', ' + self.firstName();
        if (self.middleName())
            fullName += ' ' + self.middleName();

        return fullName;
    }, this);

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.id();
    }, this);

    self.initData = function () {

        self.id(0);
        self.photoUrl = '';
        self.firstName('');
        self.middleName('');
        self.lastName('');

        self.details.loaded = false;
        self.details.email('');
        self.details.userid('');
        self.details.address('');
        self.details.city('');
        self.details.state('');
        self.details.zip('');
        self.details.birthdate(self.initDate);
        self.details.firstYear((new Date()).getFullYear());
        self.details.phone1('');
        self.details.phone2('');
        self.details.phone3('');
        self.details.gender('');
        self.commitChanges();

        self.namesEnabled(true);
        self.detailsVisible(false);
    }

    self.unlockUser = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/UnlockUser/' + self.id(),
            success: function (isLocked) {
                self.userIsLocked(isLocked);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.lockUser = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/LockUser/' + self.id(),
            success: function (isLocked) {
                self.userIsLocked(isLocked);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.registerUser = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/RegisterAccount/' + self.id(),
            success: function (userId) {
                self.details.userid(userId);
                var form = $('#' + self.id());
                self.addGenericError($(form).find('.contactView > .contactErrorLocation'),
                    "User has been registered. Email sent to user.");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.resetPassword = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/ResetPassword/' + self.id(),
            success: function () {
                var form = $('#' + self.id());
                self.addGenericError($(form).find('.contactView > .contactErrorLocation'),
                    "Password has been reset. Email sent to user.");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.beginEditContact = function () {
        self.selectedView('editUserDetailsTemplate');
    }

    self.cancelEditContact = function () {
        self.resetChanges();
        self.selectedView('viewUserDetailsTemplate');
    }

    self.beginCreateContact = function () {
        window.clearTimeout(self.errorTimeout);
        if (!self.firstName.uncommitValue() || !self.lastName.uncommitValue()) {
            self.addNameMissingError($('#newContact > .contactView > .contactErrorLocation'));
        }
        else if ($("#newContact").valid()) {
            self.doAction(this, "commit"); // commit the names.
            self.validatingName(true);
            self.validateNameForNewContact();
        }
        else {
            self.errorTimeout = setTimeout(function () {
                $("#newContact").validate().resetForm();
            }, 3000);
        }
    }

    self.validateNameForNewContact = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/DoesContactNameExist',
            data: {
                Id: self.id(),
                FirstName: self.firstName(),
                LastName: self.lastName(),
                MiddleName: self.middleName(),
            },
            success: function (response) {
                self.validatingName(false);

                if (!response) {
                    self.namesEnabled(false);
                    self.detailsVisible(true);
                }
                else {
                    self.addNameExistsError($('#newContact > .contactView > .contactErrorLocation'));
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.addGenericError = function (errorElement, msg) {
        var elem = jQuery('<div/>', {
            'class': 'alert alert-danger',
            text: msg
        }).appendTo(errorElement);
        elem.delay(5000).hide('slow');
    }

    self.addNameMissingError = function (errorElement) {
        var elem = jQuery('<div/>', {
            'class': 'alert alert-danger',
            text: 'First name and Last name required.'
        }).appendTo(errorElement);
        elem.delay(5000).hide('slow');
    }

    self.addNameExistsError = function (errorElement) {
        var elem = jQuery('<div/>', {
            'class': 'alert alert-danger',
            text: 'Name already exists.'
        }).appendTo(errorElement);
        elem.delay(5000).hide('slow');
    }

    self.addEmailExistsError = function (errorElement) {
        var elem = jQuery('<div/>', {
            'class': 'alert alert-danger',
            text: 'Email already exists.'
        }).appendTo(errorElement);
        elem.delay(5000).hide('slow');
    }

    self.commitChanges = function () {
        self.doAction(self, "commit");
        self.doAction(self.details, "commit");
    }

    self.resetChanges = function () {
        self.doAction(self, "reset");
        self.doAction(self.details, "reset");
    }

    self.doAction = function (target, action) {
        for (var key in target) {
            var prop = target[key];
            if (ko.isWriteableObservable(prop) && prop[action]) {
                prop[action]();
            }
        }
    }

    self.updateContact = function (form) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '?register=1',
            data: {
                Id: self.id(),
                Email: self.details.email.uncommitValue(),
                FirstName: self.firstName.uncommitValue(),
                LastName: self.lastName.uncommitValue(),
                MiddleName: self.middleName.uncommitValue(),
                StreetAddress: self.details.address.uncommitValue(),
                City: self.details.city.uncommitValue(),
                State: self.details.state.uncommitValue(),
                Zip: self.details.zip.uncommitValue(),
                DateOfBirth: self.details.birthdate.uncommitValue() ? moment(new Date(self.details.birthdate.uncommitValue())).format('MMMM D, YYYY') : null,
                FirstYear: self.details.firstYear.uncommitValue(),
                Phone1: self.details.phone1.uncommitValue(),
                Phone2: self.details.phone2.uncommitValue(),
                Phone3: self.details.phone3.uncommitValue(),
                IsFemale: self.details.gender.uncommitValue()
            },
            success: function (data) {
                self.commitChanges();

                self.selectedView('viewUserDetailsTemplate');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr && xhr.status == 409) {
                    if (xhr.responseText.indexOf('Email') == 1)
                        self.addEmailExistsError($(form).find('.contactView > .contactErrorLocation'));
                    else
                        self.addNameExistsError($(form).find('.contactView > .contactErrorLocation'));
                }
                else {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            }
        });
    }

    self.cancelContact = function () {
        if (self.id())
            self.cancelEditContact();
        else
            self.cancelCreateContact();
    }

    self.cancelCreateContact = function () {

        self.namesEnabled(true);
        self.detailsVisible(false);
        self.details.loaded = false;

        self.resetChanges();

        self.firstName('');
        self.middleName('');
        self.lastName('');
        self.commitChanges();
    }

    self.userRendered = function (elements) {
        // validate handler
        $(elements[0]).closest('form').validate({
            submitHandler: function (form) {
                ko.dataFor(form).updateContact(form);
            },
            rules: {
                firstname: { required: true, minlength: 1 },
                lastname: { required: true, minlength: 1 },
                email: { email: true }
            },
            errorPlacement: function (error, element) {
                var formElem = $(element).closest('form');

                error.appendTo(formElem.find(".contactView > .contactErrorLocation"));
            }
        });
    }
}

var UsersClass = function (accountId, pageSize, firstYear) {
    var self = this;
    self.accountId = accountId;
    self.pageSize = pageSize;
    self.firstYear = firstYear;

    self.availableFilters = ko.observableArray([
        { id: 'LastName', name: "Last Name" },
        { id: 'FirstName', name: "First Name" },
    ]);
    // other possible filter fields. ContactName is the data
    // model and it doesn't contains these fields. If they are
    // brought back, contactName would have to include them.
    //{ id: 'City', name: "City" },
    //{ id: 'FirstYear', name: "First Year Played" },
    //{ id: 'Zip', name: 'Zip Code' }

    // ex: $filter=not endswith(LastName, 'r')
    //     $filter=Price gt 20
    self.availableOperations = ko.observableArray([
        { id: 'startswith', name: "starts with" },
        { id: 'endswith', name: "ends with" },
        { id: 'eq', name: "equals" }, 
        { id: 'ne', name: "not equals" },
        { id: 'gt', name: "greater than" },
        { id: 'ge', name: "greater than or equal" },
        { id: 'lt', name: 'less than' },
        { id: 'le', name: 'less than or equal' }
    ]);

    self.availableSort = ko.observableArray([
        { id: 'asc', name: "asending sort" },
        { id: 'desc', name: "descending sort" },
    ]);

    self.filterField = ko.observable('LastName');
    self.filterOp = ko.observable('startswith');
    self.filterValue = ko.observable('');
    self.filterSort = ko.observable('asc');

    self.users = ko.observableArray([]);
    
    self.totalRecords = ko.observable('');
    self.pageNumber = ko.observable('');

    // track previous/next query.
    self.currentPage = ko.observable();
    self.totalPages = ko.observable();
    self.currentPageNo = ko.observable();
    self.nextPage = ko.observable();
    self.prevPages = ko.observableArray();

    self.prevPagesAvailable = ko.computed(function () {
        return self.prevPages().length > 0;
    }, this);

    self.deleteUser = function (user) {

        $("#deleteModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.makeUserDeleteCall(user)
        });
    }

    self.makeUserDeleteCall = function (user) {
        // make Ajax call to save.
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/DeleteContact/' + user.id(),
            success: function (data) {
                // remove from data model.
                self.populateUsers();
                //self.users.remove(user);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.createUser = function (form) {
        var userData = ko.dataFor(form);
        var id = userData.createAccount() == true ? 1 : 0;
        if (id == 1 && !userData.details.email.uncommitValue())
            alert("Will not register account, no email specified");

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '?register=' + id,
            data: {
                Email: userData.details.email.uncommitValue(),
                FirstName: userData.firstName.uncommitValue(),
                LastName: userData.lastName.uncommitValue(),
                MiddleName: userData.middleName.uncommitValue(),
                StreetAddress: userData.details.address.uncommitValue(),
                City: userData.details.city.uncommitValue(),
                State: userData.details.state.uncommitValue(),
                Zip: userData.details.zip.uncommitValue(),
                DateOfBirth: userData.details.birthdate.uncommitValue() ? moment(new Date(userData.details.birthdate.uncommitValue())).format('MMMM D, YYYY') : null,
                FirstYear: userData.details.firstYear.uncommitValue(),
                Phone1: userData.details.phone1.uncommitValue(),
                Phone2: userData.details.phone2.uncommitValue(),
                Phone3: userData.details.phone3.uncommitValue(),
                IsFemale: userData.details.gender.uncommitValue() ? true : false
            },
            success: function (data) {
                userData.commitChanges();
                userData.initData();

                // Refresh the accordion, make sure not to change the active one.
                self.populateUsers();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr && xhr.status == 409) {
                    if (xhr.responseText.indexOf('Email') == 1)
                        userData.addEmailExistsError($('#newContact > .contactView > .contactErrorLocation'));
                    else
                        userData.addNameExistsError($('#newContact > .contactView > .contactErrorLocation'));
                }
                else {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            }
        });
    }

    self.gotoNext = function () {
        if (self.nextPage())
            self.populateUsers(self.nextPage());
    }

    self.gotoPrev = function () {
        var previousPageLink = self.prevPages.pop();
        if (previousPageLink)
            self.populateUsers(previousPageLink, true);
    }

    self.applyFilter = function () {
        self.populateUsers(null, null, true);
    }


    self.populateUsers = function (url, isPrev, isFilter) {
        var url, data, calculatePages, updateNavigation = true;
        if (!url) {
            if (self.currentPage() && !isFilter) { //refresh after delete/add/etc.
                url = self.currentPage();
            }
            else { // first time.
                
                url = window.config.rootUri + '/odata/ContactsOData/?accountId=' + self.accountId + '&$inlinecount=allpages';
                url += '&$orderby=LastName ' + self.filterSort() + ', FirstName ' + self.filterSort();
                if (self.filterOp() == 'startswith' ||
                    self.filterOp() == 'endswith') {
                    url += '&$filter=' + self.filterOp() + '(' + self.filterField() + ", '" + self.filterValue() + "')";
                }
                else {
                    url += '&$filter=' + self.filterField() + ' ' + self.filterOp() + " '" + self.filterValue() + "'";
                }

                self.currentPageNo(1);
            }
            calculatePages = true;
            updateNavigation = false;
        }
        $.ajax({
            type: "GET",
            url: url,
            success: function (data) {
                if (data['odata.count'])
                    self.totalRecords(data['odata.count']);
                else
                    self.totalRecords('');

                if (calculatePages) {
                    self.totalPages(self.totalRecords() == undefined ? null : Math.ceil(self.totalRecords() / self.pageSize));
                    if (self.totalPages() == 0) {
                        self.currentPageNo(0);
                        self.currentPage(url);
                        self.nextPage(null);
                        self.prevPages.removeAll();
                        self.users.removeAll();
                        self.refreshUserList();
                        return;
                    }
                    else if (self.currentPageNo() > self.totalPages()) {
                        self.gotoPrev();
                        return;
                    }
                }
                else if (isPrev)
                    self.currentPageNo(self.currentPageNo() - 1);
                else
                    self.currentPageNo(self.currentPageNo() + 1);

                if (self.currentPage() && !isPrev && updateNavigation)
                    self.prevPages.push(self.currentPage());

                self.currentPage(url);
                self.nextPage(data['odata.nextLink']);

                if (data.value) {
                    window.location.hash = 'update';

                    var mappedUsers = $.map(data.value, function (item) {
                        var theUser = new UserClass(self.accountId, self.firstYear, false);
                        theUser.id(item.Id);
                        theUser.firstName(item.FirstName);
                        theUser.lastName(item.LastName);
                        theUser.middleName(item.MiddleName);
                        theUser.photoUrl = item.PhotoURL;
                        theUser.commitChanges();
                        return theUser;
                    });

                    self.users(mappedUsers);
                    self.refreshUserList();
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.getUserId = function (t) {
        var firstItemId = t.lastIndexOf('_');
        if (firstItemId == -1)
            return -1;

        return t.substring(firstItemId + 1);
    }

    self.makeAccordion = function () {
        $("#accordion").accordion({
            heightStyle: 'content',
            autoHeight: false,
            collapsible: true,
            active: false,
            header: 'h3',
            beforeActivate: function (event, ui) {
                if (ui.newPanel !== undefined && ui.newPanel.length > 0) {

                    var vm = ko.dataFor(ui.newPanel[0]);
                    if (vm && vm.details && !vm.details.loaded) {
                        self.fillUserDetails(vm);
                    }
                }
            },
            changestart: function (event, ui) {
                var clicked = $(this).find('.ui-state-active').attr('id');
                $('#' + clicked).load('/widgets/' + clicked);
            }
        });
    }

    self.makeAccordion();

    self.refreshUserList = function () {
        var a = $("#accordion");
        a.accordion('destroy');
        self.makeAccordion();

        // refresh insists on setting the first item expanded
        //a.accordion("refresh");
    }


    self.fillUserDetails = function (userData) {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/GetContactDetails/' + userData.id(),
            success: function (data) {
                if (data) {
                    window.location.hash = 'update';

                    userData.details.email(data.Email);
                    userData.details.userid(data.UserId);
                    userData.details.address(data.StreetAddress);
                    userData.details.city(data.City);
                    userData.details.state(data.State); 
                    userData.details.zip(data.Zip);
                    if (data.DateOfBirth)
                        userData.details.birthdate(new Date(data.DateOfBirth));
                    else
                        userData.details.birthdate('');
                    userData.details.firstYear(data.FirstYear);
                    userData.details.phone1(data.Phone1);
                    userData.details.phone2(data.Phone2);
                    userData.details.phone3(data.Phone3);
                    userData.details.gender(data.IsFemale);

                    userData.isLocked(data.IsLockedOut);
                    
                    userData.details.loaded = true;
                    userData.commitChanges();
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }
}

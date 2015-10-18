function initUserData(accountId, pageSize, firstYear) {
    initKOHelpers();

    var userData = new UsersClass(accountId, pageSize, firstYear);
    ko.applyBindings(userData, document.getElementById("userdata"));

    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });

}

var UserClassDetails = function (data, accountId) {
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

    self.Email.extend({
        email: true
    });

    self.DateOfBirth.extend({
        required: true,
        date: true
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var UserClass = function (data, accountId, showCreateAccount) {
    var self = this;
    self.accountId = accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        'details': {
            create: function (options) {
                return ko.validatedObservable(new UserClassDetails(options.data, self.accountId));
            }
        //    update: function (options) {
        //        return options.data;
        //    }
        }
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.FirstName.extend({
        required: true
    });

    self.LastName.extend({
        required: true
    });

    self.Id.showCreateAccount = ko.observable(showCreateAccount);
    self.Id.createAccount = ko.observable(false);

    self.Id.namesEnabled = ko.observable(true);
    self.Id.detailsVisible = ko.observable(false);
    self.Id.selectedView = ko.observable('viewUserDetailsTemplate'); // toggle between edit/view templates.
    self.Id.validatingName = ko.observable(false);

    self.Id.nameExistsError = ko.observable(false);
    self.Id.emailExistsError = ko.observable(false);
    self.Id.genericErrorMsg = ko.observable('');

    self.isValid = function () {
        return !self.Id.nameExistsError() && !self.Id.emailExistsError();
    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

    self.birthdateDisplay = ko.computed(function () {
        if (!self.details().DateOfBirth())
            return '';
        else
            return moment(new Date(self.details().DateOfBirth())).format('MMMM D, YYYY');
    });

    self.isRegistered = ko.computed(function () {
        return self.details().UserId() && self.details().UserId().length > 0;
    });

    self.canRegister = ko.computed(function () {
        // must have email and can't be already registered.
        var hasEmail = self.details().Email() && self.details().Email().length > 0;
        return !self.isRegistered() && hasEmail;
    }, this);

    self.fullName = ko.computed(function () {
        var fullName = self.LastName() + ', ' + self.FirstName();
        if (self.MiddleName())
            fullName += ' ' + self.MiddleName();

        return fullName;
    });

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.Id();
    });

    self.unlockUser = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/UnlockUser/' + self.Id(),
            success: function (isLocked) {
                self.userIsLocked(isLocked);
            }
        });
    }

    self.lockUser = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/LockUser/' + self.Id(),
            success: function (isLocked) {
                self.userIsLocked(isLocked);
            }
        });
    }

    self.registerUser = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/register/' + self.Id(),
            success: function (userId) {
                self.details().UserId(userId);
                self.addGenericError("User has been registered. Email sent to user.");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr && xhr.status == 409) {
                    self.addGenericError(xhr.responseText);
                }
                else {
                    reportAjaxError(url, xhr, ajaxOptions, thrownError);
                }
            }
        });
    }

    self.resetPassword = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/ResetPassword/' + self.Id(),
            success: function () {
                self.addGenericError("Password has been reset. Email sent to user.");
            }
        });
    }

    var originalValues;

    self.beginEditContact = function () {
        originalValues = self.toJS();
        self.Id.selectedView('editUserDetailsTemplate');
    }

    self.cancelEditContact = function () {
        self.update(originalValues);
        self.Id.selectedView('viewUserDetailsTemplate');
    }

    self.beginCreateContact = function () {
        if (!self.isValid()) {
            return;
        }

        self.Id.validatingName(true);
        self.validateNameForNewContact();
    }

    self.FirstName.subscribe(function () {
        self.Id.nameExistsError(false);
    });

    self.MiddleName.subscribe(function () {
        self.Id.nameExistsError(false);
    });

    self.LastName.subscribe(function () {
        self.Id.nameExistsError(false);
    });

    self.details().Email.subscribe(function () {
        self.Id.emailExistsError(false);
    });

    self.validateNameForNewContact = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/DoesContactNameExist',
            data: {
                Id: self.Id(),
                FirstName: self.FirstName(),
                LastName: self.LastName(),
                MiddleName: self.MiddleName(),
            },
            success: function (response) {
                self.Id.validatingName(false);

                if (!response) {
                    self.Id.namesEnabled(false);
                    self.Id.detailsVisible(true);
                    self.Id.nameExistsError(false);
                }
                else {
                    self.Id.nameExistsError(true);
                }
            }
        });
    }

    self.Id.showGenericErrorMsg = ko.observable(false);

    self.addGenericError = function (msg) {
        self.Id.genericErrorMsg(msg);
        self.Id.showGenericErrorMsg(true);
        setTimeout(function () {
            self.Id.genericErrorMsg('');
            self.Id.showGenericErrorMsg(false);
        }, 5000);
    }

    self.cancelContact = function () {
        if (self.Id())
            self.cancelEditContact();
        else
            self.cancelCreateContact();
    }

    self.cancelCreateContact = function () {

        self.Id.namesEnabled(true);
        self.Id.detailsVisible(false);
        self.details.loaded = false;
    }
}

var UsersClass = function (accountId, pageSize, firstYear) {
    var self = this;
    self.accountId = accountId;
    self.pageSize = pageSize;
    self.firstYear = firstYear;

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

    self.availableYears = ko.observableArray([]);

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

    // Keep in sync with exportToExcel
    self.availableFilters = ko.observableArray([
        { id: 'LastName', name: "Last Name", isNumber: false },
        { id: 'FirstName', name: "First Name", isNumber: false },
        { id: 'FirstYear', name: "First Year Played", isNumber: true },
        { id: 'BirthDate', name: "Birth Year", isNumber: false, isDate: true },
        { id: 'Zip', name: "Zip Code", isNumber: false },
    ]);

    // other possible filter fields. ContactName is the data
    // model and it doesn't contains these fields. If they are
    // brought back, contactName would have to include them.
    //{ id: 'City', name: "City" },
    //{ id: 'FirstYear', name: "First Year Played" },
    //{ id: 'Zip', name: 'Zip Code' }

    // ex: $filter=not endswith(LastName, 'r')
    //     $filter=Price gt 20
    self.stringOnlyOperations = [
        { id: 'endswith', name: "ends with" },
        { id: 'startswith', name: "starts with" }
    ];

    self.commonOperations = [
        { id: 'eq', name: "equals" },
        { id: 'ne', name: "not equals" },
        { id: 'gt', name: "greater than" },
        { id: 'ge', name: "greater than or equal" },
        { id: 'lt', name: 'less than' },
        { id: 'le', name: 'less than or equal' }
    ];

    self.availableOperations = ko.observableArray();

    self.availableSort = ko.observableArray([
        { id: 'asc', name: "asending sort" },
        { id: 'desc', name: "descending sort" },
    ]);

    self.filterField = ko.observable('LastName');
    self.filterField.subscribe(function () {
        var selectedField = ko.utils.arrayFirst(self.availableFilters(), function (item) {
            return item.id == self.filterField();
        });
        var isNumberField = false;
        var isDateField = false;

        if (selectedField) {
            isNumberField = selectedField.isNumber;
            isDateField = selectedField.isDate;
        }

        if (self.availableOperations().length == 0) {
            $.each(self.commonOperations, function (index, item) {
                self.availableOperations.push(item);
            });
        }

        if (isNumberField || isDateField) {
            if (self.availableOperations().length != self.commonOperations.length) {
                $.each(self.stringOnlyOperations, function (index, item) {
                    self.availableOperations.remove(item);
                });
            }
        }
        else {
            if (self.availableOperations().length == self.commonOperations.length) {
                $.each(self.stringOnlyOperations, function (index, item) {
                    self.availableOperations.unshift(item);
                });
            }
        }
    });

    self.filterOp = ko.observable('startswith');
    self.filterValue = ko.observable('');
    self.filterSort = ko.observable('asc');

    self.emptyUser = {
        Id: 0,
        PhotoURL: '',
        FirstName: '',
        MiddleName: '',
        LastName: '',
        details: {
            loaded: false,
            Email: '',
            UserId: '',
            StreetAddress: '',
            City: '',
            State: '',
            Zip: '',
            DateOfBirth: new Date(),
            FirstYear: (new Date()).getFullYear(),
            Phone1: '',
            Phone2: '',
            Phone3: '',
            IsFemale: false,
            IsLockedOut: false
        }
    };

    self.newUser = ko.validatedObservable(new UserClass(self.emptyUser, self.accountId, true));
    self.newUser().Id.selectedView('editUserDetailsTemplate'); // toggle between edit/view templates.

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
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts/' + user.Id(),
            success: function (data) {
                // remove from data model.
                self.populateUsers();
            }
        });
    }

    self.updateOrCreateContact = function (userData) {
        if (userData.Id())
            self.updateContact(userData);
        else
            self.createUser(userData);
    }

    self.updateContact = function (userData) {
        if (!userData.isValid() || !userData.details.isValid())
            return;

        var data = userData.toJS();
        delete data.details;
        var details = userData.details().toJS();

        $.extend(data, details);

        var url = window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts'; // don't register for now. UI is messed up. ?register=1';
        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (data) {
                userData.Id.selectedView('viewUserDetailsTemplate');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr && xhr.status == 409) {
                    if (xhr.responseText.toUpperCase().indexOf('EMAIL') > 0)
                        userData.Id.emailExistsError(true);
                    else
                        userData.Id.nameExistsError(true);
                }
                else {
                    reportAjaxError(url, xhr, ajaxOptions, thrownError);
                }
            }
        });
    }

    self.afterTemplateRendered = function () {
        $(".selectpicker").selectpicker();
    }

    self.createUser = function (userData) {
        if (!userData.isValid() || !userData.details.isValid())
            return;

        var id = userData.Id.createAccount() == true ? 1 : 0;
        if (id == 1 && !userData.details().Email())
            alert("Will not register account, no email specified");

        if (!userData.details().DateOfBirth()) {
            alert("Please enter birth date.");
            return;
        }

        var data = userData.toJS();
        delete data.details;
        var details = userData.details().toJS();

        $.extend(data, details);

        var url = window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts?register=' + id;
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: function (data) {
                self.newUser().update(self.emptyUser);
                
                self.newUser().Id.namesEnabled(true);
                self.newUser().Id.detailsVisible(false);

                // Refresh the accordion, make sure not to change the active one.
                self.populateUsers();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr && xhr.status == 409) {
                    if (xhr.responseText.toUpperCase().indexOf('EMAIL') > 0)
                        userData.Id.emailExistsError(true);
                    else
                        userData.Id.nameExistsError(true);
                }
                else {
                    reportAjaxError(url, xhr, ajaxOptions, thrownError);
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

    self.exportToExcel = function () {
        var selectedField = ko.utils.arrayFirst(self.availableFilters(), function (item) {
            return item.id == self.filterField();
        });
        var isNumberField = selectedField.isNumber;
        var isDateField = selectedField.isDate;

        url = window.config.rootUri + '/Account/exportaddresslist/' + self.accountId;
        url += '?order=' + self.filterSort();
        if (self.filterOp() == 'startswith' ||
            self.filterOp() == 'endswith') {
            if (!isNumberField && !isDateField) // only strings for this type.
                url += '&filter=' + self.filterField() + "," + self.filterOp() + ",'" + self.filterValue() + "'";
        }
        else {
            if (isDateField)
                url += '&filter=' + self.filterField() + ',' + self.filterOp();
            else
                url += '&filter=' + self.filterField() + ',' + self.filterOp();

            if (isNumberField || isDateField)
                url += "," + self.filterValue();
            else
                url += ",'" + self.filterValue() + "'";
        }

        window.location.href = url;
    }

    self.populateUsers = function (url, isPrev, isFilter) {
        var data, calculatePages, updateNavigation = true;
        if (!url) {
            if (self.currentPage() && !isFilter) { //refresh after delete/add/etc.
                url = self.currentPage();
            }
            else { // first time.
                
                var selectedField = ko.utils.arrayFirst(self.availableFilters(), function (item) {
                    return item.id == self.filterField();
                });
                var isNumberField = selectedField.isNumber;
                var isDateField = selectedField.isDate;

                url = window.config.rootUri + '/odata/ContactsOData/?accountId=' + self.accountId + '&$inlinecount=allpages';
                url += '&$orderby=LastName ' + self.filterSort() + ', FirstName ' + self.filterSort();
                if (self.filterOp() == 'startswith' ||
                    self.filterOp() == 'endswith') {
                    if (!isNumberField && !isDateField && self.filterValue() != "") // only strings for this type.
                        url += '&$filter=' + self.filterOp() + '(' + self.filterField() + ", '" + self.filterValue() + "')";
                }
                else {
                    if (isDateField)
                        url += '&$filter=year(' + self.filterField() + ') ' + self.filterOp();
                    else
                        url += '&$filter=' + self.filterField() + ' ' + self.filterOp();

                    if (isNumberField || isDateField)
                        url += " " + self.filterValue();
                    else
                        url += " '" + self.filterValue() + "'";
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
                        
                        var theUser = new UserClass(self.emptyUser, self.accountId, false);
                        theUser.Id(item.Id);
                        theUser.FirstName(item.FirstName);
                        theUser.LastName(item.LastName);
                        theUser.MiddleName(item.MiddleName);
                        theUser.PhotoURL(item.PhotoURL);
                        theUser.Id.detailsVisible(true);
                        return theUser;
                    });

                    self.users(mappedUsers);
                }
            }
        });
    }

    self.fillUserDetails = function (userData) {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/contacts/' + userData.Id(),
            success: function (data) {
                if (data) {
                    window.location.hash = 'update';

                    var details = {
                            loaded: true,
                            Email: data.Email,
                            UserId: data.UserId,
                            StreetAddress: data.StreetAddress,
                            City: data.City,
                            State: data.State,
                            Zip: data.Zip,
                            DateOfBirth: data.DateOfBirth,
                            FirstYear: data.FirstYear,
                            Phone1: data.Phone1,
                            Phone2: data.Phone2,
                            Phone3: data.Phone3,
                            IsFemale: data.IsFemale,
                            IsLockedOut: data.IsLockedOut
                    }

                    userData.details().update(details);
                }
            }
        });
    }

    $('#accordion').on('shown.bs.collapse', function () {

        //get the anchor of the accordian that does not has the class "collapsed"
        var openAnchor = $(this).find('a[data-toggle=collapse]:not(.collapsed)');
        if (openAnchor && openAnchor.length == 1) {
            var vm = ko.dataFor(openAnchor[0]);
            if (vm && vm.details && !vm.details().loaded()) {
                self.fillUserDetails(vm);
            }
        }
    });

    self.populateUsers();
}

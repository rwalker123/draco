function initWelcomesViewModel(accountId, isAdmin, teamId) {

    var wmElem = document.getElementById("WelcomeMessages");
    if (wmElem) {
        var wmVM = new WelcomeClass(accountId, isAdmin, teamId);
        ko.applyBindings(wmVM, wmElem);
    }
}

var WelcomeMessageViewModel = function(data) {

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

    self.Id.isLoaded = ko.observable(false);

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var WelcomeClass = function (accountId, isAdmin, teamId) {
    var self = this;

    // object variables
    self.accountId = accountId;
    self.teamId = teamId;
    self.isAdmin = isAdmin;

    self.welcomeMessages = ko.observableArray();
    self.isEditMode = ko.observable(false);

    self.emptyWelcomeMessage = {
        Id: 0,
        AccountId: self.accountId,
        TeamId: self.teamId ? self.teamId : 0,
        CaptionMenu: '',
        OrderNo: 0,
        WelcomeText: ''
    }

    self.currentWelcomeEdit = ko.observable(new WelcomeMessageViewModel(self.emptyWelcomeMessage));

    self.cancelWelcomeEdit = function () {
        self.isEditMode(false);
    }

    self.startWelcomeAdd = function () {
        self.currentWelcomeEdit().update(self.emptyWelcomeMessage);
        self.isEditMode(!self.isEditMode());
    }

    self.startWelcomeEdit = function (vm) {
        self.currentWelcomeEdit().update(vm.toJS());
        self.isEditMode(true);
    },

    self.deleteWelcome = function (vm) {

        $("#deleteWelcomeMessageModal").modal("show");

        $("#confirmWelcomeMessageDeleteBtn").one("click", function () {
            self.doDeleteWelcome(vm);
        });
    }

    self.doDeleteWelcome = function (vm) {
        var url = window.config.rootUri + '/api/WelcomeAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/WelcomeText/' + vm.Id();
        else
            url = url + '/WelcomeText/' + vm.Id();

        $.ajax({
            type: 'DELETE',
            url: url,
            success: function () {
                window.location.hash = 'update';

                self.welcomeMessages.remove(vm);
                $('#welcomeMessagesTab a:first').tab('show');
                if (self.welcomeMessages().length > 0) {
                    if (!self.welcomeMessages()[0].Id.isLoaded()) {
                        self.fillMenuText(self.welcomeMessages()[0]);
                    }
                }
                    
                self.cancelWelcomeEdit();
            }
        });
    }

    self.saveWelcome = function () {

        if (!self.currentWelcomeEdit())
            return;

        var requestType;
        var url = window.config.rootUri + '/api/WelcomeAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/WelcomeText';
        else
            url = url + '/WelcomeText';

        if (self.currentWelcomeEdit().Id() == 0) {
            requestType = 'POST'; // new message
        }
        else {
            requestType = 'PUT'; // update existing
            url = url + "/" + self.currentWelcomeEdit().Id();
        }

        var data = self.currentWelcomeEdit().toJS();

        $.ajax({
            type: requestType,
            url: url,
            data: data,
            success: function (dbWelcome) {
                if (self.currentWelcomeEdit().Id() != 0) { // edit
                    var existingMessage = ko.utils.arrayFirst(self.welcomeMessages(), function(item) {
                        return item.Id() == dbWelcome.Id;
                    });
                    if (existingMessage) {
                        existingMessage.update(dbWelcome);
                    }
                }
                else { // new message
                    var newvm = new WelcomeMessageViewModel(dbWelcome);
                    newvm.Id.isLoaded(true);
                    self.welcomeMessages.push(newvm);
                }

                self.welcomeMessages.sort(self.sortByOrder);

                window.location.hash = 'update';
                self.cancelWelcomeEdit();
            }
        });
    }

    self.sortByOrder = function(l, r) {
        var lo = l.OrderNo();
        var ro = r.OrderNo();

        return lo == ro ? 0 : (lo < ro ? -1 : 1);
    }

    self.fillMenuText = function (vm) {

        var url = window.config.rootUri + '/api/WelcomeAPI/' + self.accountId;

        if (this.teamId)
            url = url + '/Team/' + this.teamId;

        url = url + '/WelcomeText/' + vm.Id();

        $.ajax({
            type: 'GET',
            url: url,
            success: function (theText) {
                vm.WelcomeText(theText.WelcomeText);
                vm.Id.isLoaded(true);
            }
        });
    }

    self.fillWelcomeHeaders = function () {

        var url = window.config.rootUri + '/api/WelcomeAPI/' + self.accountId;

        if (this.teamId)
            url = url + '/Team/' + this.teamId;

        url = url + '/WelcomeTextHeaders';

        $.ajax({
            type: 'GET',
            url: url,
            success: function (texts) {
                mappedTexts = $.map(texts, function (text) {
                    return new WelcomeMessageViewModel(text);
                });

                self.welcomeMessages(mappedTexts);
                if (self.welcomeMessages().length > 0)
                    self.fillMenuText(self.welcomeMessages()[0]);
            }
        });

    }

    self.tabSelected = function (vm) {
        self.fillMenuText(vm);
    }

    self.fillWelcomeHeaders();
}

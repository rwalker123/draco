function initHallOfFameViewModel(accountId, isAdmin) {
    initKOHelpers();

    var hallOfFameElem = document.getElementById("hallOfFameView");
    if (hallOfFameElem) {
        var hallOfFameVM = new HallOfFameViewModel(accountId, isAdmin);
        ko.applyBindings(hallOfFameVM, hallOfFameElem);
    }
}

var HallOfFameMemberViewModel = function (data, accountId) {
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

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactLargePhoto/' + self.ContactId();
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var HallOfFameClassViewModel = function (data, accountId) {
    var self = this;

    self.accountId = accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'Members': {
        //    create: function (options) {
        //        return ko.observableArray(options.data);
        //    },
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    // 3 columns of HOF members.
    self.newHOFRowClass = function (index) {
        var i = index();
        return (i % 3 == 0);
    }

    self.Year.filledMembers = false;

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var HallOfFameViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.editMode = ko.observable(false);

    self.emptyHofMember = {
        Id: 0,
        AccountId: self.accountId,
        ContactId: 0,
        Name: '',
        YearInducted: 0,
        Biography: '',
        PhotoURL: ''
    };

    self.currentEditMember = ko.observable(new HallOfFameMemberViewModel(self.emptyHofMember, self.accountId));

    self.hallOfFameClasses = ko.observableArray();

    self.inductNewMember = function () {
        self.editMode(true);
        self.currentEditMember().update(self.emptyHofMember);
    }

    self.editMember = function (hofMember) {
        self.editMode(true);
        $('html, body').animate({
            scrollTop: $("#editMemberForm").offset().top
        }, 'fast');

        var json = hofMember.toJS();
        self.currentEditMember().update(json);
    }

    self.deleteMember = function (hofMember) {
        $("#deleteHofMemberModal").modal("show");

        $("#confirmHofDeleteBtn").one("click", function () {
            self.performDeleteMember(hofMember)
        });
    }

    self.performDeleteMember = function (hofMember) {
        var url = window.config.rootUri + '/api/HallOfFameAPI/' + self.accountId + '/classmembers/' + hofMember.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                var hofClass = ko.utils.arrayFirst(self.hallOfFameClasses(), function (hofClass) {
                    return hofClass.Year() == hofMember.YearInducted();
                });

                if (hofClass) {
                    hofClass.Members.remove(hofMember);
                    hofClass.MemberCount(hofClass.MemberCount() - 1);
                }
            }
        });
    }

    self.selectedPlayer = ko.observable();

    self.getPlayers = function (query, syncResults, asyncResults) {

        $.ajax({
            url: window.config.rootUri + '/api/HallOfFameAPI/' + self.accountId + '/availableinductees',
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
                asyncResults(results);
            }
        });
    }

    self.cancelEdit = function () {
        self.editMode(false);
    }

    self.saveEdit = function () {

        if (!self.currentEditMember().Id()) {
            if (!self.selectedPlayer() || !self.selectedPlayer().Id) {
                alert('select a player');
                return;
            }

            self.currentEditMember().ContactId(self.selectedPlayer().Id);
            self.currentEditMember().Name(self.selectedPlayer().label);
        }
        else if (!self.currentEditMember().Name()) {
            alert('name is required');
            return;
        }

        if (!self.currentEditMember().YearInducted()) {
            alert('year inducted is required');
            return;
        }

        var data = self.currentEditMember().toJS();

        var url = window.config.rootUri + '/api/HallOfFameAPI/' + self.accountId + '/classmembers';

        $.ajax({
            type: (self.currentEditMember().Id()) ? "PUT" : "POST",
            url: url,
            data: data,
            success: function (returnHofMember) {

                // edit HOF member.
                if (self.currentEditMember().Id()) {
                // find hof member in hofClasses
                    $.each(self.hallOfFameClasses(), function (index, hofClass) {
                        var theMember = ko.utils.arrayFirst(hofClass.Members(), function (hofMember) {
                            return (hofMember.Id() == self.currentEditMember().Id());
                        });

                        if (theMember) {
                            theMember.Biography(self.currentEditMember().Biography());
                            if (theMember.YearInducted() != self.currentEditMember().YearInducted()) {
                                theMember.YearInducted(self.currentEditMember().YearInducted());
                                hofClass.Members.remove(theMember);
                                // update member count.
                                hofClass.MemberCount(hofClass.MemberCount() - 1);

                                self.addToHofClass(theMember);
                            }
                            return false; // stop each loop.
                        }
                    });
                }
                else {
                    // new hof member.
                    var theMember = new HallOfFameMemberViewModel(returnHofMember, self.accountId);
                    self.addToHofClass(theMember);
                }
            }
        });

        self.editMode(false);
    }

    self.addToHofClass = function(hofMember) {
        var newHofClass = ko.utils.arrayFirst(self.hallOfFameClasses(), function (newClass) {
            return newClass.Year() == hofMember.YearInducted();
        });

        if (newHofClass) {
            if (newHofClass.Year.filledMembers) {
                newHofClass.Members.push(hofMember);
                newHofClass.Members.sort(function (a, b) {
                    if (a.Name() == b.Name())
                        return 0;
                    return a.Name() > b.Name() ? 1 : -1;
                });
            }
            // update members count.
            newHofClass.MemberCount(newHofClass.MemberCount() + 1);
        }
        else {
            // new class, add accordion.
            var hofClass = {
                Year: hofMember.YearInducted(),
                MemberCount: 1,
                Members: [ hofMember ]
            }
            self.hallOfFameClasses.push(new HallOfFameClassViewModel(hofClass, self.accountId));
            self.hallOfFameClasses.sort(function (a, b) {
                if (a.Year() == b.Year())
                    return 0;
                return a.Year() < b.Year() ? 1 : -1;
            });
        }
    }

    self.getHOFClassMembers = function (hofClass) {
        var url = window.config.rootUri + '/api/HallOfFameAPI/' + self.accountId + '/classmembers/' + hofClass.Year();

        $.ajax({
            type: "GET",
            url: url,
            success: function (hofMembers) {
                var mappedHofMembers = $.map(hofMembers, function (hofMember) {
                    return new HallOfFameMemberViewModel(hofMember, self.accountId);
                });

                hofClass.Members(mappedHofMembers);
                hofClass.Year.filledMembers = true;
            }
        });
    }

    self.getHallOfFameClasses = function () {

        var url = window.config.rootUri + '/api/HallOfFameAPI/' + self.accountId + '/classes';

        $.ajax({
            type: "GET",
            url: url,
            success: function (hofClasses) {
                var mappedHofClasses = $.map(hofClasses, function (hofClass) {
                    hofClass.Members = [];
                    return new HallOfFameClassViewModel(hofClass, self.accountId);
                });

                mappedHofClasses.sort(function (a, b) {
                    if (a.Year() == b.Year())
                        return 0;
                    return a.Year() < b.Year() ? 1 : -1;
                });

                self.hallOfFameClasses(mappedHofClasses);
                if (self.hallOfFameClasses().length > 0)
                    self.getHOFClassMembers(self.hallOfFameClasses()[0]);
            }
        });
    }

    self.availableInductionDates = ko.observableArray();

    self.initFirstYear = function () {
        var currentYear = (new Date).getFullYear();
        var maxBack = 100;
        while (maxBack >= 0) {
            self.availableInductionDates.push({ name: currentYear + '' });
            currentYear--;
            maxBack--;
        }
    }

    self.initFirstYear();

    $('#accordion').on('shown.bs.collapse', function () {

        //get the anchor of the accordian that does not has the class "collapsed"
        var openAnchor = $(this).find('a[data-toggle=collapse]:not(.collapsed)');
        if (openAnchor && openAnchor.length == 1) {
            var vm = ko.dataFor(openAnchor[0]);
            if (vm && vm.Year && !vm.Year.filledMembers) {
                self.getHOFClassMembers(vm);
            }
        }
    });

    self.getHallOfFameClasses();
}

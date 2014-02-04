var UserRoleClass = function (accountId, currentUserId) {
    this.init(accountId, currentUserId);
};

$.extend(UserRoleClass.prototype, {
    // object variables
    accountId: 0,
    retrievedLeagues: false,
    retrievedTeams: false,
    selectedUser: null,
    selectedAccountOwner: null,
    currentUserId: null,

    init: function (accountId, currentUserId) {
        this.accountId = accountId;
        this.currentUserId = currentUserId;
    },

    getAdminId: function (t) {
        var firstItemId = t.lastIndexOf('_');
        if (firstItemId == -1)
            return "";

        return t.substring(firstItemId + 1);
    },

    isTeamAdmin: function (roleId) {
        return (roleId == 4 || roleId == 5);
    },

    isLeagueAdmin: function (roleId) {
        return (roleId == 3);
    },

    makeAccordion: function () {
        var target = this;

        $("#accordion").accordion({
            heightStyle: 'content',
            autoHeight: false,
            collapsible: true,
            active: false,
            header: 'h3',
            beforeActivate: function (event, ui) {
                if (ui.newPanel !== undefined && ui.newPanel.attr('id') !== undefined) {

                    var adminId = target.getAdminId(ui.newPanel.attr('id'));
                    if (target.isTeamAdmin(adminId))
                        $('#teamSelect').prependTo($('#div_playerSelect_' + adminId));

                    $('#playerSelect').prependTo($('#div_playerSelect_' + adminId));
                    $('#playerSelect').val('');

                    var divItem = $('#adminsList_' + adminId);
                    if (!divItem.data('hasdata')) {
                        target.populateAdminList(target, divItem);
                    }
                }
            },
            changestart: function (event, ui) {
                var clicked = $(this).find('.ui-state-active').attr('id');
                $('#' + clicked).load('/widgets/' + clicked);
            }
        });
    },

    setSelectedUser: function (user) {
        this.selectedUser = user;
    },

    setSelectedAccountOwner: function (user) {
        this.selectedAccountOwner = user;
    },

    clearSelected: function () {
        this.selectedUser = null;
    },

    addSelectedUserToRole: function (roleId) {
        if (!this.selectedUser)
            return;

        var target = this;
        var url = '/api/UserRolesAPI/' + this.accountId + '/AddToRole';
        var roleData = 0;
        var roleDataText = '';

        if (this.isLeagueAdmin(roleId)) {
            roleData = $('#availableLeagues').val();
            roleDataText = $("#availableLeagues option[value='" + roleData + "']").text()
        }
        else if (this.isTeamAdmin(roleId)) {
            roleData = $('#teamSelect').val();
            roleDataText = $("#teamSelect option[value='" + roleData + "']").text()
        }

        $.ajax({
            type: 'POST',
            url: url,
            data: {
                Id: 0,
                AccountId: target.accountId,
                ContactId: target.selectedUser.Id,
                RoleId: roleId,
                RoleData: roleData
            },
            success: function (adminId) {
                window.location.hash = 'update';
                var elem = $('#div_adminItem' + roleId + '_' + roleData + '_' + target.selectedUser.Id);
                // rest call returns success if element already in list, check to make sure
                // we don't add it twice.
                if (elem.length == 0) {
                    target.addToAdminList(target, roleId, roleData, roleDataText, target.selectedUser);
                }

                $("input#playerSelect").val('');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    removeUserFromRole: function (userId, roleId, roleData) {
        var target = this;
        var roleDiv = $('#div_adminItem' + roleId + '_' + roleData + '_' + userId);
        var url = '/api/UserRolesAPI/' + this.accountId + '/DeleteFromRole';

        $.ajax({
            type: 'DELETE',
            url: url,
            data: {
                ContactId: userId,
                RoleId: roleId,
                RoleData: roleData
            },
            success: function (dbId) {
                window.location.hash = 'update';
                roleDiv.remove();
                if ($('#adminsList_' + roleId).children().length == 0) {
                    $('#noAdminText_' + roleId).show();
                    $('#adminsList_' + roleId).hide();
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + '. Response: ' + xhr.responseText);
            }
        });
    },

    addToAdminList: function(target, roleId, roleData, roleDataText, data) {
        var noAdminText = $('#noAdminText_' + roleId);
        if (noAdminText.is(':visible'))
            noAdminText.hide();

        var adminsList = $('#adminsList_' + roleId);
        if (!adminsList.is(':visible'))
            adminsList.show();

        data.RoleData = roleData;
        data.RoleDataText = roleDataText;
        $('#adminsList_' + roleId).append($('#adminItemTemplate').render(data, { roleId: roleId, roleData: roleData }));
    },

    populateAdminList: function (target, elem) {
            var roleId = target.getAdminId(elem.attr('id'));
            if (!roleId) {
                return;
            }

            var url = '/api/UserRolesAPI/' + this.accountId + '/AdminsForRole/' + roleId;

            $.ajax({
                type: 'GET',
                url: url,
                success: function (data) {
                    window.location.hash = 'update';

                    if (data.length > 0) {
                        $('#noAdminText_' + roleId).hide();
                        $('#adminsList_' + roleId).show();
                        $('#adminsList_' + roleId).append($('#adminItemTemplate').render(data, { roleId: roleId }));
                    }
                    else {
                        $('#noAdminText_' + roleId).show();
                        $('#adminsList_' + roleId).hide();
                    }

                    target.ensureDataLoaded(roleId);
                    $('#adminsList_' + roleId).data('hasdata', true);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    if (xhr.status == 404) {
                        $('#adminsList_' + roleId).html('');
                        $('#adminsList_' + roleId).hide();
                        $('#noAdminText_' + roleId).show();
                    }
                    else {
                        alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                    }
                }
            });

    },

    // ensure that the select options are populated
    ensureDataLoaded: function (roleId) {
        var target = this;

        if (this.isLeagueAdmin(roleId)) { // league admin
            if (!this.retrievedLeagues) {
                var url = '/api/LeaguesAPI/' + this.accountId + '/Leagues';
                $.ajax({
                    type: 'GET',
                    url: url,
                    success: function (leagues) {
                        window.location.hash = 'update';
                        var leagueSelect = $('#availableLeagues');
                        $.each(leagues, function () {
                            leagueSelect.append($('<option></option>').attr("value", this.Id).text(this.Name));
                        });

                        target.retrievedLeagues = true;
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + ". ResponseText: " + xhr.responseText);
                    }
                });
            }
        }
        else if (this.isTeamAdmin(roleId)) { // team admin
            if (!this.retrievedTeams) {
                var url = '/api/LeaguesAPI/' + this.accountId + '/LeagueTeams';
                $.ajax({
                    type: 'GET',
                    url: url,
                    success: function (leagues) {
                        window.location.hash = 'update';
                        var teamSelect = $('#teamSelect');
                        $.each(leagues, function () {
                            teamSelect.append($('<option></option>').attr("value", this.Id).text(this.Name));
                        });

                        target.retrievedTeams = true;
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + ". ResponseText: " + xhr.responseText);
                    }
                });
            }
        }
    },

    startChangeAccountOwner: function () {
        $('#changeAccountOwnerWarning').show('fast');
        $('#changeAccountOwner').hide();
    },

    cancelChangeAccountOwner: function () {
        $('#changeAccountOwnerWarning').hide();
        $('#changeAccountOwner').show('fast');
    },

    changeAccountOwner: function () {
        if (!this.selectedAccountOwner)
            return;

        // only current owner can change owner, so this is just saying we changed
        // the user to ourself, which is what is already set.
        if (this.selectedAccountOwner == this.currentUserId)
            return;

        var target = this;

        $.ajax({
            type: "PUT",
            url: '/api/AccountAPI/' + this.accountId + '/AccountOwner',
            data: {
                Id: this.selectedAccountOwner.Id
            },
            success: function (newOwner) {
                if (target.currentUserId != newOwner) {
                    $('#accountOwner').remove();
                    window.location.hash = 'update';
                }

                target.cancelChangeAccountOwner();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }
});
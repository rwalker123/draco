var LeagueSetupClass = function (accountId, currentSeasonId) {
    this.init(accountId, currentSeasonId);
};

$.extend(LeagueSetupClass.prototype, {
    // object variables
    accountId: 0,
    currentSeasonId: 0,

    init: function (accountId, currentSeasonId) {
        this.accountId = accountId;
        this.currentSeasonId = currentSeasonId;
        this.fillSeasonList();
    },

    fillSeasonList: function () {

        var target = this;

        $.getJSON('/api/SeasonsAPI/' + this.accountId + '/Seasons',
			function (data) {
			    var selectList = $('#seasonList');

			    if (data.length) {

			        $.each(data, function (index, item) {
			            if (item.Id != target.currentSeasonId) {
			                selectList.append($('#seasonOptionTemplate').render(item));
			            }
			        });
			    }

			    if (selectList.children().length > 0) {
			        $('#copyFromSeason').show();
			        $('.selectpicker').selectpicker('refresh');
                }
			    else {
			        $('#copyFromSeason').hide();
			    }

			});

        $("#copyFromSeason").accordion({
            heightStyle: 'content',
            autoHeight: false,
            collapsible: true,
            active: false,
            header: 'h3',
            changestart: function (event, ui) {
                var clicked = $(this).find('.ui-state-active').attr('id');
                $('#' + clicked).load('/widgets/' + clicked);
            }
        });

    },

    getLeagueId: function (t) {
        var firstItemId = t.lastIndexOf('_');
        if (firstItemId == -1)
            return -1;

        return t.substring(firstItemId + 1);
    },

    fillLeagues: function () {
        var target = this;
        $.getJSON('/api/LeaguesAPI/' + this.accountId + '/Leagues',
			function (data) {
			    if (data.length) {
			        window.location.hash = 'update';

			        target.createLeagueFromTemplate(target, data);
			    }

			    // if no more leagues, import from previous season becomes a
			    // move viable option.
			    if ($(".leagueHeader").length > 0) {
			        $('#copyFromSeason').accordion({ active: false });
			    }
			    else {
			        $('#copyFromSeason').accordion({ active: 0 });
			    }
			});
    },

    createLeagueFromTemplate: function (target, data) {

        if ($("#accordion").hasClass("ui-accordion"))
            $("#accordion").accordion("destroy");

        $('#accordion').append($("#leagueTemplate").render(data));
        target.makeAccordion();

        // setup the action when a team is selected from the team drop
        // down associated with each league.
        $.each(data, function (index, item) {
            $('#divisionTeamSelect_' + item.Id).change(function () {
                var listSelect = $('#divisionTeamSelect_' + item.Id);
                var isNewTeam = parseInt(listSelect.val()) == 0;
                if (isNewTeam) {
                    $('#newTeam_' + item.Id).show();
                }
                else {
                    $('#newTeam_' + item.Id).hide();
                }
            });
        });

        $(".leagueselectpicker").selectpicker();
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

                    var leagueId = target.getLeagueId(ui.newPanel.attr('id'));
                    var divItem = $('#LeagueSetupData_' + leagueId);
                    if (divItem.data('hasdata') == 'False') {
                        target.fillLeagueData(target, divItem);
                    }
                }
            },
            changestart: function (event, ui) {
                var clicked = $(this).find('.ui-state-active').attr('id');
                $('#' + clicked).load('/widgets/' + clicked);
            }
        });
    },

    makeTeamsDraggable: function () {
        $("#accordion li").draggable({
            appendTo: "body",
            helper: "clone"
        });

        $("#accordion ul").droppable({
            activeClass: "ui-state-default",
            hoverClass: "ui-state-hover",
            accept: function (ui) {
                return !ui.hasClass($(this).attr('id'));
            },
            drop: function (event, ui) {
                $(this).find(".placeholder").remove();

                ui.draggable.appendTo(this);

                // set the new class to be the id of the parent.                    
                var currentClass = ui.draggable.attr('class').split(' ');
                currentClass[0] = $(this).attr('id');

                var newClass = currentClass.join(' ');
                ui.draggable.attr('class', newClass);

            }
        }).sortable({
            items: "li:not(.placeholder)",
            cursor: 'move',
            sort: function () {
                // gets added unintentionally by droppable interacting with sortable
                // using connectWithSortable fixes this, but doesn't allow you to customize active/hoverClass options
                $(this).removeClass("ui-state-default");
            }
        });
    },

    fillLeagueData: function (target, elem) {
        var divId = elem.attr('id');
        var leagueSeasonId = target.getLeagueId(divId);
        if (leagueSeasonId == -1) {
            return;
        }

        $.ajax({
            type: "GET",
            url: '/api/LeaguesAPI/' + this.accountId + '/DivisionSetup/' + leagueSeasonId,
            success: function (divisionData) {
                window.location.hash = 'update';
                elem.data('hasdata', 'True');
                elem.html('');

                elem.append($("#divisionTemplate").render(divisionData));

                target.fillTeamList(leagueSeasonId);

                // attach file uploaders for each team.
                $.each(divisionData, function (index, item) {
                    target.attachTeamFileUploaders(target, item.Id);
                });

                $("#accordion").accordion("refresh");
                // this isn't working, dragging team to another division
                // doesn't add them to that division. Comment out functionality
                // until it can be fixed.
                //target.makeTeamsDraggable();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    fillTeamList: function (leagueId) {
        var selectList = $('#divisionTeamSelect_' + leagueId);
        var target = this;
        $.ajax({
            type: "GET",
            url: '/api/LeaguesAPI/' + this.accountId + '/UnassignedTeams/' + leagueId,
            success: function (teams) {
                window.location.hash = 'update';

                selectList.append($('#teamOptionTemplate').render(teams));
                target.selectFirstTeam(leagueId);
                selectList.selectpicker("refresh");

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    },

    selectFirstTeam: function(leagueId) {
        var teamSelectList = $('#divisionTeamSelect_' + leagueId);

        if (teamSelectList.children().length > 1) {
            $('#newTeam_' + leagueId).hide();

            var option = teamSelectList.children('option').eq(1);
            teamSelectList.val(option.val());
        }
        else { // only can be New Team left..
            $('#newTeam_' + leagueId).show();
        }
    },

    startAddTeam: function (leagueId, divisionId) {
        var editElem = $('#divisionTeamPanel_' + leagueId).parent();

        // first stop any other existing add for this league.
        if (editElem.attr('class') == 'addDivisionTeamPanel') {
            var oldDivId = this.getLeagueId(editElem.attr('id'));
            this.stopAddTeam(leagueId, oldDivId);
        }

        editElem = $('#divisionTeamPanel_' + leagueId);

        $('#divisionTeamEdit_' + divisionId).hide();

        var divPanel = $('#addDivisionTeamPanel_' + divisionId);
        editElem.prependTo(divPanel);
        editElem.show();
        divPanel.show();

    },

    stopAddTeam: function (leagueId, divisionId) {
        // move team select list back to parent element.
        var divTeamPanel = $('#divisionTeamPanel_' + leagueId);
        divTeamPanel.appendTo($('#leagueData_' + leagueId));
        divTeamPanel.hide();

        // swap back to add team link.
        $('#addDivisionTeamPanel_' + divisionId).hide();
        $('#divisionTeamEdit_' + divisionId).show();
    },

    addTeamToDivision: function (leagueId, divisionId) {
        var listSelect = $('#divisionTeamSelect_' + leagueId);
        var selectedValue = parseInt(listSelect.val());

        var target = this;

        if (selectedValue == 0) {
            var name = $('#newTeamName_' + leagueId).val();
            if (name.length == 0)
                return;

            $.ajax({
                type: "POST",
                url: '/api/LeaguesAPI/' + this.accountId + '/TeamDivision/' + leagueId,
                data: {
                    AccountId: this.accountId,
                    LeagueId: leagueId,
                    DivisionId: divisionId,
                    Name: name
                },
                success: function (team) {
                    window.location.hash = 'update';
                    $('#newTeamName_' + leagueId).val('');

                    var jsonObj = []; //declare array
                    jsonObj.push({ Id: team.Id, TeamId: team.TeamId, LeagueId: leagueId, Name: name, DivisionId: divisionId });
                    target.updateTeamList(target, jsonObj, true);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
                }
            });

        }
        else {
            var selectedTeamName = $('#divisionTeamSelect_' + leagueId + ' option:selected').text();

            $.ajax({
                type: "PUT",
                url: '/api/LeaguesAPI/' + this.accountId + '/TeamDivision/' + divisionId,
                data: {
                    Id: selectedValue
                },
                success: function (team) {
                    window.location.hash = 'update';

                    var jsonObj = []; //declare array
                    jsonObj.push({ Id: team.Id, TeamId: team.TeamId, LeagueId: leagueId, Name: selectedTeamName, DivisionId: divisionId });
                    target.updateTeamList(target, jsonObj, false);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            });
        }
    },

    // update the html after adding a team to a division.
    updateTeamList: function (target, teamDataList, fromNewTeam) {
        var teamData = teamDataList[0];

        // add team to list.
        $('#placeholder_' + teamData.DivisionId).hide();

        $('#divisionTeams_' + teamData.DivisionId).append($("#teamTemplate").render(teamData));
        target.positionTeamInDivisionList(target, teamData);
        this.addTeamFileUploaders(teamData.Id);

        // remove team from select list.
        var teamSelectList = $('#divisionTeamSelect_' + teamData.LeagueId);
        teamSelectList.find("option[value='" + teamData.Id + "']").remove();
        teamSelectList.selectpicker("refresh");

        // avoid going back to New team selection if we didn't come from new team
        // and teams are available.
        if (!fromNewTeam) {
            target.selectFirstTeam(teamData.LeagueId);
        }

        // don't stop, allow multiple teams added.
        //target.stopAddTeam(leagueId, divisionId);
    },

    attachTeamFileUploaders : function(target, divisionId) {
        var allTeams = $('#divisionTeams_' + divisionId + ' > li.divisionTeam');
        $.each(allTeams, function (index, item) {
            var teamId = target.getLeagueId(item.id);
            target.addTeamFileUploaders(teamId);
        });
    },

    addTeamFileUploaders: function(teamId) {
        var logo = $('#teamLogo_' + teamId);
        var logoBusy = $('#teamLogoBusy_' + teamId);
        this.configureFileUpload(logo, logoBusy);

        //var photo = $('#teamPhoto_' + teamId);
        //var photoBusy = $('#teamPhotoBusy_' + teamId);
        //this.configureFileUpload(photo, photoBusy);
    },

    configureFileUpload: function(elem, busyElem) {
        elem.bind('dragenter', function (e) {
            $(this).addClass('over');
        });

        elem.bind('dragleave drop', function (e) {
            $(this).removeClass('over');
        });

        elem.fileupload({
            dataType: 'json',
            dropZone: elem,
            add: function (e, data) {

                // set opacity of current image and show busy cusor.
                elem.fadeTo('fast', 0.4);
                busyElem.show('fast');

                data.submit();
            },
            done: function (e, data) {
                var seconds = new Date().getTime() / 1000;
                elem.attr("src", data.result + "?" + seconds);
            },
            always: function (e, data) {
                //remove opacity, hide progress
                elem.fadeTo('fast', 1.0);
                busyElem.hide('fast');
            }
        });
    },

    positionTeamInDivisionList: function(target, teamData) {
        // foreach division, until priority is greater than ours.
        var teamElems = $('#divisionTeams_' + teamData.DivisionId + ' > .divisionTeam');

        var beforeElem;
        $.each(teamElems, function (index, item) {
            if (target.getLeagueId(item.id) != teamData.Id) {
                if (item.getAttribute('data-name') > teamData.Name) {
                    beforeElem = item;
                    return false;
                }
            }
        });

        var targetElem = $('#divisionTeam_' + teamData.Id);
        if (beforeElem) {
            targetElem.insertBefore($('#' + beforeElem.id));
        }
        else {
            targetElem.appendTo($('#divisionTeams_' + teamData.DivisionId));
        }
    },

    removeTeamFromDivision: function (leagueId, divisionId, teamId) {
        var target = this;

        $.ajax({
            type: "DELETE",
            url: '/api/LeaguesAPI/' + this.accountId + '/DivisionTeams/' + teamId,
            success: function (divisionId) {
                window.location.hash = 'update';

                // remove file uploaders.
                $('#fileupload_' + teamId).fileupload('destroy');

                var divTeam = $('#divisionTeam_' + teamId);
                var teamName = divTeam.data('name');
                divTeam.remove();

                // show placeholder if this is last team.
                if ($('.division_' + divisionId).length == 0) {
                    $('#placeholder_' + divisionId).show();
                }

                // add team back to select list.
                var jsonObj = []; //declare array
                jsonObj.push({ Id: teamId, LeagueId: leagueId, DivisionId: divisionId, Name: teamName });
                target.addTeamToSelectList(jsonObj[0]);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    addTeamToSelectList: function (teamData) {
        var teamOptions = $('#divisionTeamSelect_' + teamData.LeagueId  + ' option');

        var beforeElem;
        $.each(teamOptions, function (index, item) {
            if (index > 0) { // skip index 0 which is New Team...
                if (item.text > teamData.Name) {
                    beforeElem = item;
                    return false;
                }
            }
        });

        var targetElem = $('#teamOptionTemplate').render(teamData);
        if (beforeElem) {
            $(targetElem).insertBefore(beforeElem);
        }
        else {
            $('#divisionTeamSelect_' + teamData.LeagueId).append(targetElem);
        }

        // select the team.
        $('#divisionTeamSelect_' + teamData.LeagueId).val(teamData.Id);
        $('#newTeam_' + teamData.LeagueId).hide();
        $('#divisionTeamSelect_' + teamData.LeagueId).selectpicker("refresh");
    },

    addDivision: function (leagueId) {

        var name = $('#NewDivisionName_' + leagueId).val();
        if (name.length == 0)
            return;

        var sortOrder = $('#NewDivisionPriority_' + leagueId).val();
        if (isNaN(sortOrder))
            return;

        var target = this;

        $.ajax({
            type: "POST",
            url: '/api/LeaguesAPI/' + this.accountId + '/DivisionSetup/' + leagueId,
            data: {
                LeagueId: leagueId,
                Name: name,
                Priority: sortOrder
            },
            success: function (divisionId) {
                window.location.hash = 'update';

                var jsonObj = []; //declare array
                jsonObj.push({
                    Id: divisionId,
                    LeagueId: leagueId,
                    Name: name,
                    Priority: sortOrder,
                    Teams: []
                });
                $('#LeagueSetupData_' + leagueId).append($("#divisionTemplate").render(jsonObj));

                target.repositionDivisionBySortOrder(leagueId, divisionId);

                // reset the data fields.
                $('#NewDivisionName_' + leagueId).val('');
                $('#NewDivisionPriority_' + leagueId).val('1');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    },

    editDivision: function (divisionId) {
        var headerElem = $('#divisionHeader_' + divisionId);
        headerElem.hide();

        var editElem = $('#divisionEdit_' + divisionId);
        editElem.show();
    },

    cancelDivisionEdit: function (divisionId) {
        var headerElem = $('#divisionHeader_' + divisionId);
        headerElem.show();

        var editElem = $('#divisionEdit_' + divisionId);
        editElem.hide();

        // reset fields
        var divItem = $('#division_' + divisionId);
        var divisionName = divItem.data('name');
        var divisionPriority = divItem.data('priority');

        $('#editDivisionName_' + divisionId).val(divisionName);
        $('#editDivisionPriority_' + divisionId).val(divisionPriority);
    },

    saveDivisionEdit: function (leagueId, divisionId) {
        var name = $('#editDivisionName_' + divisionId).val();
        if (name.length == 0)
            return;

        var sortOrder = $('#editDivisionPriority_' + divisionId).val();
        if (isNaN(sortOrder))
            return;

        var target = this;

        $.ajax({
            type: "PUT",
            url: '/api/LeaguesAPI/' + this.accountId + '/DivisionSetup/' + divisionId,
            data: {
                Id: divisionId,
                LeagueId: leagueId,
                Name: name,
                Priority: sortOrder
            },
            success: function (obj) {
                window.location.hash = 'update';

                $('#divisionHeaderName_' + divisionId).html(name);
                var divItem = $('#division_' + divisionId);
                divItem.data('priority', sortOrder);
                divItem.data('name', name);

                target.repositionDivisionBySortOrder(leagueId, divisionId);

                target.cancelDivisionEdit(divisionId);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    repositionDivisionBySortOrder: function (leagueId, divisionId) {
        // foreach division, until priority is greater than ours.
        var targetElem = $('#division_' + divisionId);
        var targetPriority = parseInt(targetElem.data('priority'));
        var targetName = targetElem.data('name');
        var targetElemId = targetElem.attr('id');

        var divisionElems = $('#LeagueSetupData_' + leagueId + ' > .divisionItem');

        var beforeElem;
        $.each(divisionElems, function (index, item) {
            if (item.id != targetElemId) {
                var itemPriority = parseInt(item.getAttribute('data-priority'));
                if (targetPriority < itemPriority) {
                    beforeElem = item;
                    return false;
                }
                else if (targetPriority == itemPriority) {
                    if (targetName < item.getAttribute('data-name')) {
                        beforeElem = item;
                        return false;
                    }
                }
            }
        });

        if (beforeElem) {
            targetElem.insertBefore($('#' + beforeElem.id));
        }
        else {
            targetElem.appendTo($('#LeagueSetupData_' + leagueId));
        }
    },

    deleteDivision: function (divisionId) {
        $.ajax({
            type: "DELETE",
            url: '/api/LeaguesAPI/' + this.accountId + '/DivisionSetup/' + divisionId,
            success: function (divisionId) {
                window.location.hash = 'update';

                $('#division_' + divisionId).remove();
                $("#accordion").accordion("refresh");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    addLeague: function (seasonId) {
        var name = $('#newLeagueName').val();
        if (name.length == 0)
            return;

        var target = this;
        $.ajax({
            type: "POST",
            url: '/api/LeaguesAPI/' + this.accountId + '/LeagueSetup/' + seasonId,
            data: {
                Name: name
            },
            success: function (leagueId) {
                window.location.hash = 'update';
                $('#newLeagueName').val('');

                var jsonObj = []; //declare array
                jsonObj.push({ Id: leagueId, Name: name });
                target.createLeagueFromTemplate(target, jsonObj);

                $('#copyFromSeason').accordion({ active: false });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    editLeague: function (leagueId) {
        var name = $('#newLeagueName_' + leagueId).val();
        if (name.length == 0)
            return;

        var target = this;
        $.ajax({
            type: "PUT",
            url: '/api/LeaguesAPI/' + this.accountId + '/LeagueSetup/' + leagueId,
            data: {
                Name: name
            },
            success: function (leagueId) {
                window.location.hash = 'update';

                $('#leagueHeaderLink_' + leagueId).html(name);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    deleteLeague: function (leagueId) {
        
        var target = this;

        $("#deleteModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            target.makeLeagueDeleteCall(target, leagueId)
        });
    },

    makeLeagueDeleteCall: function(target, leagueId) {
        $.ajax({
            type: "DELETE",
            url: '/api/LeaguesAPI/' + this.accountId + '/LeagueSetup/' + leagueId,
            success: function (deletedLeagueId) {
                window.location.hash = 'update';

                $('#leagueHeader_' + deletedLeagueId).remove();
                $('#leagueData_' + deletedLeagueId).remove();

                if ($("#accordion").hasClass("ui-accordion"))
                    $("#accordion").accordion("destroy");

                target.makeAccordion();

                // if no more leagues, import from previous season becomes a
                // more viable option.
                if ($(".leagueHeader").length == 0) {
                    $('#copyFromSeason').accordion({ active: 0 });
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    copySeason: function (seasonId) {
        if ($(".leagueHeader").length > 0) {
            var answer = confirm('Importing league data will MERGE all current league data with imported data. Are you sure you want to continue?');
            if (!answer)
                return;
        }

        var copyFromSeasonId = $('#seasonList option:selected').val();
        var target = this;

        $.ajax({
            type: "POST",
            url: '/api/LeaguesAPI/' + this.accountId + '/CopyLeagueSetup/' + seasonId,
            data: {
                AccountId: this.accountId,
                Id: copyFromSeasonId
            },
            success: function (teamSeasonId) {
                window.location.hash = 'update';

                // remove all old leagues
                $('.leagueHeader').remove();
                $('.leagueData').remove();

                // restore...
                target.fillLeagues();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    },
});


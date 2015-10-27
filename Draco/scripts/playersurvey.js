function initPlayerSurveysViewModel(accountId, isAdmin, contactId) {

    initKOHelpers();

    var playerSurveysElem = document.getElementById("playersurvey");
    if (playerSurveysElem) {
        var playerSurveysVM = new PlayerSurveysViewModel(accountId, isAdmin, contactId);
        ko.applyBindings(playerSurveysVM, playerSurveysElem);
    }
}

var PlayerAnswerViewModel = function (data, accountId) {
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

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var PlayerSurveyCategory = function (parent, data) {
    var self = this;
    self.parent = parent;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        'Questions': {
            create: function (options) {
                if (!options.data)
                    return;

                var surveyQuestion = new PlayerSurveyQuestion(self.parent, self, data.AccountId, options.data);
                return surveyQuestion;
            }
        //    update: function (options) {
        //        return options.data;
        //    }
        }
    }

    if (!data.Questions)
        data.Questions = [];

    ko.mapping.fromJS(data, self.mapping, self);

    self.CategoryName.subscribe(function () {
        self.updateCategory();
    });

    self.Id.newQuestionNum = ko.observable();
    self.Id.newQuestion = ko.observable();


    self.Priority.subscribe(function () {
        self.updateCategory();
    });

    self.Questions.sortQuestions = function () {
        self.Questions.sort(function (left, right) {
            if (left.QuestionNum() == right.QuestionNum()) {
                // case insensitive compare.
                var l = left.Question().toLowerCase();
                var r = right.Question().toLowerCase();
                return (l == r ? 0 : (l < r) ? -1 : 1);
            }

            return (+left.QuestionNum() < +right.QuestionNum() ? -1 : 1);
        });
    };

    self.updateCategory = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.AccountId() + '/categories/' + self.Id();

        var data = self.toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (questionAnswer) {
                self.Id(questionAnswer.Id);
                parent.sortCategories();
            }
        });


    }

    self.deleteQuestion = function (question) {
        $("#deleteQuestionModal").modal("show");

        $("#confirmQuestionDeleteBtn").one("click", function () {
            self.deleteQuestionVerified(question)
        });
    }

    self.deleteQuestionVerified = function (question) {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.AccountId() + '/questions/' + question.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.Questions.remove(question);
            }
        });
    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var PlayerSurveyQuestion = function (parent, category, accountId, data) {
    var self = this;
    self.accountId = accountId;
    self.category = category;
    self.parent = parent;

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

    self.Question.PlayerAnswer = ko.observable(new PlayerAnswerViewModel({
        Id: 0,
        PlayerId: 0,
        Answer: '',
        QuestionId: self.Id()
    }, self.accountId));

    self.Question.NewAnswer = ko.observable();
    self.Question.PlayerAnswer().Answer.subscribe(function () {
        if (self.parent.isLoadingAnswers)
            return;

        self.updateQuestionAnswer();
    });

    self.Question.subscribe(function () {
        self.updateQuestion();
    });

    self.QuestionNum.subscribe(function () {
        self.updateQuestion();
    });

    self.updateQuestion = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/questions/' + self.Id();

        var data = self.toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function () {
                self.category.Questions.sortQuestions();
            }
        });
    }

    self.updateQuestionAnswer = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/questionAnswer/' + self.Question.PlayerAnswer().PlayerId();

        var data = self.Question.PlayerAnswer().toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (questionAnswer) {
                self.Question.PlayerAnswer().update(questionAnswer);
            }
        });
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var PlayerSurveyViewModel = function (data, accountId) {
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

    self.isLoading = ko.observable(true);
    self.answers = ko.observableArray();

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var PlayerSurveysViewModel = function (accountId, isAdmin, contactId) {
    var self = this;

    self.accountId = accountId;
    self.contactId = contactId;
    self.isAdmin = isAdmin;

    self.isLoading = ko.observable(true);

    self.surveys = ko.observableArray();
    self.surveyQuestions = ko.observableArray();

    self.sortCategories = function () {
        self.surveyQuestions.sort(function (left, right) {
            if (left.Priority() == right.Priority()) {
                // case insensitive compare.
                var l = left.CategoryName().toLowerCase();
                var r = right.CategoryName().toLowerCase();
                return (l == r ? 0 : (l < r) ? -1 : 1);
            }

            return (+left.Priority() < +right.Priority() ? -1 : 1);
        });
    };

    self.editMode = ko.observable(false);
    self.startEditSurvey = function () {
        self.editMode(true);
    }

    self.currentPlayerSurvey = ko.observable(new PlayerSurveyViewModel({
        Id: self.contactId,
        LastName: '',
        FirstName: '',
        MiddleName: '',
        PhotoURL: window.config.rootUri + '/uploads/contacts/' + self.contactId + '/ContactPhoto.jpg',
        Categories: []
    }, self.accountId));

    self.pageNo = ko.observable(0);
    self.hasNext = ko.observable(false);

    self.loadSurveys = function () {
        var pageSize = 20; // must match pageSize from API call.

        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/activesurveys';

        if (self.pageNo()) {
            url = url + "?pageNo=" + self.pageNo()
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (playerSurveys) {
                self.hasNext(playerSurveys && playerSurveys.length == pageSize);
                if (!playerSurveys && self.pageNo() > 0) {
                    self.pageNo(self.pageNo() - 1);
                    self.hasNext(false);
                    return;
                }
                                        
                var mappedSurveys = $.map(playerSurveys, function (survey) {
                    if (survey.Id == self.contactId) {
                        self.currentPlayerSurvey().update(survey);
                        return null;
                    }

                    return new PlayerSurveyViewModel(survey, self.accountId);
                });

                self.surveys(mappedSurveys);

                self.isLoading(false);
            }
        });
    }

    self.gotoNext = function () {
        self.pageNo(self.pageNo() + 1);
        self.loadSurveys();
    }

    self.gotoPrev = function () {
        if (self.pageNo() > 0) {
            self.pageNo(self.pageNo() - 1);
            self.loadSurveys();
        }
    }

    self.isLoadingAnswers = false;

    self.getPlayerAnswers = function (contactId) {
        self.isLoadingAnswers = true;

        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/playeranswers/' + contactId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (playerAnswers) {
                var mappedAnswers = $.map(playerAnswers, function (answer) {
                    return new PlayerAnswerViewModel(answer, self.accountId);
                });

                var survey;
                
                if (contactId == self.contactId) {
                    survey = self.currentPlayerSurvey();

                    $.each(self.currentPlayerSurvey().Categories(), function (categoryIndex, category) {
                        $.each(category.Questions(), function (questionIndex, question) {
                            // for the current user, we want every question, not just ones
                            // they answered, map all the questions to answers. Categories
                            // have questions, which have answers.
                            var answerToQuestion = ko.utils.arrayFirst(mappedAnswers, function (answer) {
                                return (answer.QuestionId() == question.Id())
                            });
                            if (answerToQuestion)
                                question.Question.PlayerAnswer().update(answerToQuestion.toJS());
                            else 
                                question.Question.PlayerAnswer().update({
                                    Id: 0,
                                    PlayerId: self.contactId,
                                    QuestionId: question.Id(),
                                    Answer: ''
                                });
                        });
                    });
                }
                else {
                    survey = ko.utils.arrayFirst(self.surveys(), function (item) {
                        return (item.Id() == contactId);
                    });
                }

                if (survey) {
                    survey.answers(mappedAnswers);
                }

                survey.isLoading(false);
                self.isLoadingAnswers = false;
            }
        });
    }

    self.removePlayerAnswer = function (playerAnswer) {
        $("#deleteQuestionAnswerModal").modal("show");

        $("#confirmQuestionAnswerBtn").one("click", function () {
            self.removePlayerAnswerVerified(playerAnswer);
        });
    }

    self.removePlayerAnswerVerified = function(playerAnswer) {
        playerAnswer.Answer('');
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/questionAnswer/' + playerAnswer.PlayerId();

        var data = playerAnswer.toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (questionAnswer) {
            }
        });
    }

    var questionMap = {};

    self.loadQuestions = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/questions';

        $.ajax({
            type: "GET",
            url: url,
            success: function (categoryQuestions) {
                var mappedQuestions = $.map(categoryQuestions, function (categoryQuestion) {
                    $.each(categoryQuestion.Questions, function (index, item) {
                        questionMap[item.Id] = item.Question;
                    });
                    return new PlayerSurveyCategory(self, categoryQuestion);
                });

                self.currentPlayerSurvey().Categories(mappedQuestions);
                self.surveyQuestions(mappedQuestions);
                self.loadSurveys();
            }
        });
    }

    self.questionFromId = function (questionId) {
        return questionMap[questionId];
    }

    self.addQuestion = function (category) {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/questions/' + category.Id();

        $.ajax({
            type: "POST",
            url: url,
            data: {
                CategoryId: category.Id(),
                QuestionNum: category.Id.newQuestionNum(),
                Question: category.Id.newQuestion()
            },
            success: function (question) {
                category.Questions.push(new PlayerSurveyQuestion(self, category, self.accountId, question));

                category.Questions.sortQuestions();
                
                category.Id.newQuestion('');
                category.Id.newQuestionNum('');
            }
        });
    }

    self.deleteCategory = function (category) {
        $("#deleteCategoryModal").modal("show");

        $("#confirmCategoryDeleteBtn").one("click", function () {
            self.deleteCategoryVerified(category)
        });
    }

    self.deleteCategoryVerified = function (category) {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/categories/' + category.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.surveyQuestions.remove(category);
            }
        });
    }

    self.newCategoryName = ko.observable();
    self.newCategoryPriority = ko.observable();

    self.addCategory = function () {
        var url = window.config.rootUri + '/api/PlayerSurveyAPI/' + self.accountId + '/categories';

        $.ajax({
            type: "POST",
            url: url,
            data: {
                AccountId: self.accountId,
                Priority: self.newCategoryPriority(),
                CategoryName: self.newCategoryName()
            },
            success: function (category) {
                self.newCategoryName('');
                self.newCategoryPriority('');
                self.surveyQuestions.push(new PlayerSurveyCategory(self, category));
                self.sortCategories();
            }
        });
    }

    self.loadQuestions();

    $('#accordion, #accordion1').on('shown.bs.collapse', function (item) {
        self.getPlayerAnswers(item.target.id);
    })
}
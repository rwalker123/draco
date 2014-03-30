function initDiscussionsViewModel(accountId, isAdmin, userId) {
    initKOHelpers();

    var discussionsElem = document.getElementById("discussions");
    if (discussionsElem) {
        var discussionsVM = new DiscussionsViewModel(accountId, isAdmin, userId);
        ko.applyBindings(discussionsVM, discussionsElem);
    }
}

function MessageCategoryViewModel(data, userId) {
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

    self.Name.extend({ required: true });
    self.Order.extend({ min: 0, max: 100 });

    self.addTopicModel = {
        Id: 0,
        CategoryId: 0,
        CreatorContactId: 0,
        CreateDate: new Date(),
        TopicTitle: '',
        StickTopic: false,
        NumberOfViews: 0,
        LastPost: {}
    }

    self.editTopic = ko.validatedObservable(new MessageTopicViewModel(self.addTopicModel, self.AccountId()));
    self.currentTopic = ko.observable(new MessageTopicViewModel(self.addTopicModel, self.AccountId()));

    self.topics = ko.observableArray();
    self.topics.loaded = ko.observable(false);

    self.topics.load = function (callback) {

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.AccountId() + '/categories/' + self.Id() + '/topics',
            success: function (topics) {
                var topicsVM = $.map(topics, function (topic) {
                    return new MessageTopicViewModel(topic, self.AccountId());
                });

                self.topics(topicsVM);
                self.topics.loaded(true);

                callback();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.canPost = ko.computed(function () {
        return self.AllowAnonymousTopic() || userId;
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

function MessageTopicViewModel(data, accountId)
{
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

    self.newPostModel = {
        Id: 0,
        TopicId: self.Id(),
        Order: 0,
        CreatorContactId: '',
        CreateDate: new Date(),
        Text: '',
        EditDate: new Date(),
        Subject: '',
        CategoryId: 0
    }

    self.editPost = ko.observable(new MessagePostViewModel(self.newPostModel));
    self.posts = ko.observableArray();
    self.posts.loaded = ko.observable(false);

    self.posts.load = function (callback) {

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/topics/' + self.Id() + '/messages',
            success: function (messages) {
                var messagesVM = $.map(messages, function (message) {
                    return new MessagePostViewModel(message);
                });

                self.posts(messagesVM);
                self.posts.loaded(true);

                callback();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
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

function MessagePostViewModel(data) {
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

function DiscussionsViewModel(accountId, isAdmin, userId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.userId = userId;

    self.viewMode = ko.observable(true);
    self.addCategoryMode = ko.observable(false);
    self.editTopicMode = ko.observable(false);
    self.categories = ko.observableArray();
    self.deletePostsAfter = ko.observable();
    self.breadcrumbs = ko.observableArray();
    self.loading = ko.observable(true);
    self.forumView = ko.observable(true);
    self.topicView = ko.observable(false);
    self.postView = ko.observable(false);

    self.addCategoryModel = {
        Id: 0,
        AccountId: self.accountId,
        Order: 0,
        Name: '',
        Description: '',
        AllowAnonymousPost: false,
        AllowAnonymousTopic: false,
        IsTeam: false,
        IsModerated: false,
        LastPost: {}
    }

    self.currentCategory = ko.observable(new MessageCategoryViewModel(self.addCategoryModel, self.userId));
    self.editCategory = ko.validatedObservable(new MessageCategoryViewModel(self.addCategoryModel, self.userId));

    self.startAddCategory = function () {
        self.addCategoryMode(true);
        
        self.editCategory().update(self.addCategoryModel);
    }

    self.endAddCategoryMode = function () {
        self.addCategoryMode(false);

    }

    self.startEditTopic = function (topic) {
        self.editTopicMode(true);

        topic.editTopic().update(topic.addTopicModel);
    }

    self.endEditTopic = function () {
        self.editTopicMode(false);
    }

    self.saveEditTopic = function () {

        $("#confirmModal").modal("show");

        $("#confirmBtn").one("click", function () {
            self.confirmedSaveEditTopic();
        });
    }

    self.confirmedSaveEditTopic = function () {
        var newData = self.currentCategory().editTopic().toJS();
        newData.CreateDate = moment(new Date()).format("MM DD, YYYY h:mm a");

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/categories/' + self.currentCategory().Id() + '/topics',
            data: newData,
            success: function (topic) {
                //self.currentCategory().topics().push(new MessageTopicViewModel(topic, self.accountId));

                var messageData = {
                    Id: 0,
                    TopicId: topic.Id,
                    Order: 0,
                    CreateDate: newData.CreateDate,
                    Text: self.currentCategory().editTopic().editPost().Text(),
                    EditDate: newData.CreateDate,
                    Subject: newData.TopicTitle
                };

                // topic is created, now add the post.
                $.ajax({
                    type: "POST",
                    url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/topics/' + topic.Id + '/messages',
                    data: messageData,
                    success: function (message) {
                        //self.currentCategory().topics().push(new MessageTopicViewModel(topic, self.accountId));

                        self.endEditTopic();
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                    }
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.loadTopics = function (forum) {
        self.forumView(false);
        self.postView(false);

        var newData = forum.toJS();

        if (!forum.topics.loaded()) {
            forum.topics.load(function () {
                self.currentCategory().topics(forum.topics());
                self.currentCategory().topics.loaded(true);
            });
        }
        else {
            self.currentCategory().topics(forum.topics());
        }

        self.currentCategory().update(newData);

        self.breadcrumbs.push({
            Title: 'Discussion Board',
            Callback: function (br) {
                self.topicView(false);
                self.postView(false);
                self.forumView(true);
                self.breadcrumbs.removeAll();
            }
        })
        self.topicView(true);
    }

    self.loadPosts = function (topic, post) {
        self.forumView(false);
        self.topicView(false);

        var newData = topic.toJS();

        if (!topic.posts.loaded()) {
            topic.posts.load(function () {
                self.currentCategory().currentTopic().posts(topic.posts());
                self.currentCategory().currentTopic().posts.loaded(true);
            });
        }
        else {
            self.currentCategory().currentTopic().posts(topic.posts());
        }

        self.currentCategory().currentTopic().update(newData);

        self.breadcrumbs.push({
            Title: topic.TopicTitle,
            Callback: function (br) {
                self.postView(false);
                self.forumView(false);
                self.topicView(true);
                self.breadcrumbs.remove(br);
            }
        })

        self.postView(true);
    }

    self.loadLastPost = function (topic) {
        self.loadPosts(topic, topic().LastPost);
    }

    self.addNewCategory = function (category) {
        if (!self.editCategory.isValid())
            return;

        var newData = self.editCategory().toJS();

        $.ajax({
            type: (self.addCategoryMode()) ? "POST" : "PUT",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/categories',
            data: newData,
            success: function (category) {
                self.categories.push(new MessageCategoryViewModel(category, self.userId));
                self.endAddCategoryMode();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.getMessageCategories = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/categories',
            success: function (cats) {
                var catsVM = $.map(cats, function (cat) {
                    return new MessageCategoryViewModel(cat, self.userId);
                });

                self.categories(catsVM);
                self.loading(false);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    $("#_mbDeletePostsAfter").selectpicker();
    self.getMessageCategories();
}

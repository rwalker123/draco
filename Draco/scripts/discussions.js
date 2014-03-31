function initDiscussionsViewModel(accountId, isAdmin, userId) {
    initKOHelpers();

    var discussionsElem = document.getElementById("discussions");
    if (discussionsElem) {
        var discussionsVM = new DiscussionsViewModel(accountId, isAdmin, userId);
        ko.applyBindings(discussionsVM, discussionsElem);
    }
}

function MessageCategoryViewModel(data, userId, isAdmin) {
    var self = this;

    self.isAdmin = isAdmin;
    self.userId = userId;

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
        CreatorName: '',
        CreateDate: new Date(),
        TopicTitle: '',
        StickTopic: false,
        NumberOfViews: 0,
        LastPost: {}
    }

    self.editTopic = ko.validatedObservable(new MessageTopicViewModel(self.addTopicModel, self.AccountId(), self.userId, self.isAdmin));
    self.currentTopic = ko.observable(new MessageTopicViewModel(self.addTopicModel, self.AccountId(), self.userId, self.isAdmin));

    self.topics = ko.observableArray();
    self.topics.loaded = ko.observable(false);

    self.topics.load = function (callback) {

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.AccountId() + '/categories/' + self.Id() + '/topics',
            success: function (topics) {
                var topicsVM = $.map(topics, function (topic) {
                    return new MessageTopicViewModel(topic, self.AccountId(), self.userId, self.isAdmin);
                });

                self.topics(topicsVM);
                self.topics.sort(function (left, right) {
                    if (!left.LastPost && !right.LastPost)
                        return 0;
                    if (!left.LastPost)
                        return 1;
                    if (!right.LastPost)
                        return -1;

                    if (left.LastPost.CreateDate == right.LastPost.CreateDate)
                        return 0;

                    return left.LastPost.CreateDate > right.LastPost.CreateDate ? 1 : -1;

                });
                self.topics.loaded(true);

                callback();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.canCreateTopic = ko.computed(function () {
        return self.AllowAnonymousTopic() || self.userId;
    });

    self.canPost = ko.computed(function () {
        return self.AllowAnonymousPost() || self.userId;
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

function MessageTopicViewModel(data, accountId, userId, isAdmin)
{
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.userId = userId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        //'LastPost': {
        //    create: function (options) {
        //        if (options.data && options.data.Id)
        //            return new MessagePostViewModel(options.data, self.userId, self.isAdmin);
        //    }
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
        CreatorContactId: 0,
        CreatorName: '',
        CreateDate: new Date(),
        Text: '',
        EditDate: new Date(),
        Subject: '',
        CategoryId: 0
    }

    self.editPost = ko.observable(new MessagePostViewModel(self.newPostModel, self.userId, self.isAdmin));
    self.posts = ko.observableArray();
    self.posts.loaded = ko.observable(false);

    self.posts.load = function (callback) {

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/topics/' + self.Id() + '/messages',
            success: function (messages) {
                var messagesVM = $.map(messages, function (message) {
                    return new MessagePostViewModel(message, self.userId, self.isAdmin);
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

function MessagePostViewModel(data, userId, isAdmin) {
    var self = this;

    self.isAdmin = isAdmin;
    self.userId = userId;

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

    self.canEdit = ko.computed(function () {
        return self.isAdmin || (userId > 0 && self.CreatorContactId() == userId);
    });

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
        IsModerated: false
    }

    self.currentCategory = ko.observable(new MessageCategoryViewModel(self.addCategoryModel, self.userId, self.isAdmin));
    self.editCategory = ko.validatedObservable(new MessageCategoryViewModel(self.addCategoryModel, self.userId, self.isAdmin));

    self.startAddCategory = function () {
        self.addCategoryMode(true);
        
        self.editCategory().update(self.addCategoryModel);
    }

    self.startEditCategory = function (category) {

        self.addCategoryMode(true);

        var data = category.toJS();
        self.editCategory().update(data);
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

    self.deleteTopic = function (topic) {
        $("#confirmTopicDeleteModal").modal("show");

        $("#confirmTopicDeleteBtn").one("click", function () {
            self.confirmedDeleteTopic(topic);
        });
    }

    self.confirmedDeleteTopic = function (topic) {
        
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/topics/' + topic.Id(),
            success: function () {

                ko.utils.arrayFirst(self.currentCategory().topics(), function (item) {
                    if (item.Id() === topic.Id()) {
                        self.currentCategory().topics.remove(item);
                        self.currentCategory().NumberOfThreads(self.currentCategory().NumberOfThreads() - 1);
                        if (self.currentCategory().LastPost && item.Id() == self.currentCategory().LastPost.Id()) {
                            if (self.currentCategory().topics.length > 0)
                                self.currentCategory().LastPost = self.currentCategory().topics[0];
                            else
                                self.currentCategory().LastPost(undefined);

                        }
                        return true;
                    }
                });

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.confirmedSaveEditTopic = function () {
        var newData = self.currentCategory().editTopic().toJS();
        newData.CreateDate = moment(new Date()).format("MM DD, YYYY h:mm a");

        $.ajax({
            type: (newData.Id <= 0) ? "POST" : "PUT",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/categories/' + self.currentCategory().Id() + '/topics',
            data: newData,
            success: function (topic) {

                var topicVM = new MessageTopicViewModel(topic, self.accountId, self.userId, self.isAdmin);

                // first topic/post is made at the same time. Topic has been created, make the post now.
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
                        message.CreatorName = topic.CreatorName;
                        // fully created, add topic to list.
                        var postVM = new MessagePostViewModel(message, self.userId, self.isAdmin);
                        topicVM.posts.unshift(postVM);
                        topicVM.LastPost = postVM;
                        self.currentCategory().topics.unshift(topicVM);

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
            Title: self.currentCategory().Name(),
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
        self.loadPosts(topic, topic.LastPost);
    }

    self.addNewCategory = function (category) {
        if (!self.editCategory.isValid())
            return;

        var newData = self.editCategory().toJS();

        $.ajax({
            type: (newData.Id <= 0) ? "POST" : "PUT",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/categories',
            data: newData,
            success: function (newCat) {
                if (newData.Id <= 0) {
                    self.categories.push(new MessageCategoryViewModel(newCat, self.userId, self.isAdmin));
                }
                else {
                    ko.utils.arrayFirst(self.categories(), function (item) {
                        if (item.Id() === newData.Id) {
                            item.update(newData);
                            return true;
                        }
                    });
                }
                self.categories.sort(self.sortCategories);
                self.endAddCategoryMode();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.deleteCategory = function (category) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/categories/' + category.Id(),
            success: function () {
                ko.utils.arrayFirst(self.categories(), function (item) {
                    if (item.Id() === category.Id()) {
                        self.categories.remove(item);
                        return true;
                    }
                });
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
                    return new MessageCategoryViewModel(cat, self.userId, self.isAdmin);
                });

                catsVM.sort(self.sortCategories);

                self.categories(catsVM);
                self.loading(false);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.sortCategories = function (left, right) {
        // first are account forums sorted by order, then name
        // system accounts second Account == 0
        // teams last sorted by name
        if (left.IsTeam() && right.IsTeam()) {
            return left.Name() == right.Name() ? 0 : left.Name() > right.Name() ? 1 : -1;
        }
        if (left.IsTeam())
            return 1;

        if (right.IsTeam())
            return -1;

        if (left.Order() == right.Order())
            return left.Name() == right.Name() ? 0 : left.Name() > right.Name() ? 1 : -1;

        return left.Order() > right.Order() ? 1 : -1;
    }

    $("#_mbDeletePostsAfter").selectpicker();
    self.getMessageCategories();
}

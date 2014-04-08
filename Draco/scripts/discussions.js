function initDiscussionsViewModel(accountId, isAdmin, userId) {
    initKOHelpers();

    var discussionsElem = document.getElementById("discussions");
    if (discussionsElem) {
        var discussionsVM = new DiscussionsViewModel(accountId, isAdmin, userId);
        ko.applyBindings(discussionsVM, discussionsElem);
    }
}

function formatMessageBoardDate(theDate) {
    var editDate = new Date(theDate);
    var today = new Date();
    if (editDate.getDay() == today.getDay()) {
        if (editDate.getMonth() == today.getMonth()) {
            if (editDate.getYear() == today.getYear()) {
                return 'Today at ' + moment(theDate).format('h:mm a');
            }
        }
    }

    return moment(theDate).format('MM/DD/YYYY h:mm a');

}

function MessageCategoryViewModel(data, userId, isAdmin) {
    var self = this;

    self.isAdmin = isAdmin;
    self.userId = userId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        'LastPost': {
            create: function (options) {
                if (options.data)
                    return ko.observable(new MessagePostViewModel(options.data, self.userId, self.isAdmin));
                else
                    return ko.observable();
            }
        //    update: function (options) {
        //        return options.data;
        //    }
        }
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.Name.extend({ required: true });
    self.Order.extend({ min: 0, max: 100 });

    self.formattedDate = ko.computed(function () {
        if (self.LastPost && self.LastPost() && self.LastPost().CreateDate) {
            return formatMessageBoardDate(self.LastPost().CreateDate());
        }

        return '';

    });


    self.addTopicModel = {
        Id: 0,
        CategoryId: data.Id,
        CreatorContactId: 0,
        CreatorName: '',
        PhotoUrl: '',
        CreateDate: new Date(),
        TopicTitle: '',
        StickTopic: false,
        NumberOfViews: 0,
        LastPost: null
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
        'LastPost': {
            create: function (options) {
                if (options.data)
                    return ko.observable(new MessagePostViewModel(options.data, self.userId, self.isAdmin));
                else
                    return ko.observable();
            }
        //    update: function (options) {
        //        return options.data;
        //    }
        }
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.LastPost.formattedDate = ko.computed(function () {
        if (self.LastPost() && self.LastPost().CreateDate) {
            return formatMessageBoardDate(self.LastPost().CreateDate());
        }

        return '';
    });

    self.newPostModel = {
        Id: 0,
        TopicId: self.Id(),
        Order: 0,
        CreatorContactId: 0,
        CreatorName: '',
        PhotoUrl: '',
        CreateDate: new Date(),
        Text: '',
        EditDate: null,
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

    self.CreateDate.wasEditted = ko.computed(function () {
        if (self.CreateDate && self.EditDate) {
            var cd = new Date(self.CreateDate());
            var ed = new Date(self.EditDate());

            return (ed.getTime() > cd.getTime());
        }

        return false;
    });

    self.CreateDate.formattedDate = ko.computed(function () {
        if (self.CreateDate) {
            return formatMessageBoardDate(self.CreateDate());
        }

        return '';
    });

    self.EditDate.formattedDate = ko.computed(function () {
        if (self.EditDate) {
            return formatMessageBoardDate(self.EditDate());
        }

        return '';
    });

    self.Id.canEdit = ko.computed(function () {
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
    self.editPostMode = ko.observable(false);
    self.replyToTopicMode = ko.observable(false);
    self.categories = ko.observableArray();
    self.deletePostsAfter = ko.observable();
    self.breadcrumbs = ko.observableArray();
    self.loading = ko.observable(true);
    self.forumView = ko.observable(true);
    self.topicView = ko.observable(false);
    self.postView = ko.observable(false);

    self.removePostOptions = ko.observableArray([
        { Id: "3", Name: "3 days" },
        { Id: "7", Name: "7 days" },
        { Id: "14", Name: "14 days" },
        { Id: "30", Name: "30 days" },
        { Id: "60", Name: "60 days" },
        { Id: "90", Name: "90 days" },
        { Id: "120", Name: "120 days" },
        { Id: "150", Name: "150 days" },
        { Id: "180", Name: "180 days" }
    ]);

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

        // tinyMCE editor will not bind two-ways, have to manually set the control
        // when changing the data model.
        tinymce.get('topicEditor').setContent('');
    }

    self.endEditTopic = function () {
        self.editTopicMode(false);
        $("#confirmBtn").unbind('click');
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

                        ko.utils.arrayFirst(self.categories(), function (cat) {
                            if (cat.Id() == self.currentCategory().Id()) {
                                cat.NumberOfThreads(cat.NumberOfThreads() - 1);
                                if (cat.LastPost && item.LastPost.Id() == cat.LastPost.Id()) {
                                    if (cat.topics().length > 0)
                                        cat.LastPost = cat.topics()[0];
                                    else
                                        cat.LastPost = undefined;

                                    return true;
                                }
                            }
                        });

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

                self.createMessagePost(messageData, function (message) {

                    message.CreatorName = topic.CreatorName;

                    // fully created, add topic to list.
                    var postVM = new MessagePostViewModel(message, self.userId, self.isAdmin);
                    topic.LastPost = postVM;

                    var topicVM = new MessageTopicViewModel(topic, self.accountId, self.userId, self.isAdmin);

                    self.addNewPost(postVM, topicVM);

                    ko.utils.arrayFirst(self.categories(), function (cat) {
                        if (cat.Id() == self.currentCategory().Id()) {
                            cat.NumberOfThreads(cat.NumberOfThreads() + 1);
                            cat.LastPost = postVM;
                            return true;
                        }
                    });

                    topicVM.NumberOfReplies(topicVM.NumberOfReplies() + 1);
                    self.currentCategory().topics.unshift(topicVM);

                    self.endEditTopic();
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.addNewPost = function (postVM, topicVM, append) {

        if (append) {
            topicVM.posts.push(postVM);
        }
        else {
            topicVM.posts.unshift(postVM);
        }
    }

    self.startEditPost = function (post) {
        self.editPostMode(true);

        var data = post.toJS();
        self.currentCategory().currentTopic().editPost().update(data);

        // tinyMCE editor will not bind two-ways, have to manually set the control
        // when changing the data model.
        tinymce.get('postEditor').setContent(data.Text);
    }

    self.cancelEditPost = function () {
        self.editPostMode(false);
        self.replyToTopicMode(false);

        $('#confirmBtn').unbind('click');
    }

    self.saveEditPost = function () {
        $("#confirmModal").modal("show");

        $("#confirmBtn").one("click", function () {
            self.confirmedSaveEditPost();
        });
    }

    self.confirmedSaveEditPost = function() {
        var data = self.currentCategory().currentTopic().editPost().toJS();
        self.createMessagePost(data, function (message) {

            if (self.replyToTopicMode()) {
                var postVM = new MessagePostViewModel(message, self.userId, self.isAdmin);
                self.addNewPost(postVM, self.currentCategory().currentTopic(), true);

                // update the number of replies on the topic.
                var topicId = self.currentCategory().currentTopic().Id();

                ko.utils.arrayFirst(self.currentCategory().topics(), function (topic) {
                    if (topic.Id() === topicId) {
                        var numReplies = self.currentCategory().currentTopic().NumberOfReplies() + 1;
                        topic.NumberOfReplies(numReplies);
                        topic.LastPost(postVM);

                        return true;
                    }
                });
            }
            else {
                // find post and update with data.
                ko.utils.arrayFirst(self.currentCategory().currentTopic().posts(), function (post) {
                    if (post.Id() === data.Id) {

                        post.update(message);
                        return true;
                    }
                });
            }
            self.cancelEditPost();
        });
    }

    self.createMessagePost = function (data, callback) {
        var url = window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/topics/' + data.TopicId + '/messages'; 
        if (data.Id)
            url = url + '/' + data.Id;

        data.CreateDate = moment(new Date()).format("MM DD, YYYY h:mm a");
        data.EditDate = data.CreateDate;

        $.ajax({
            type: data.Id ? "PUT" : "POST",
            url: url,
            data: data,
            success: function (message) {
                callback(message);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.startReplyToTopic = function (post) {
        self.replyToTopicMode(true);

        self.currentCategory().currentTopic().editPost().update(self.currentCategory().currentTopic().newPostModel, self.userId, self.isAdmin);

        var subject = post.Subject();
        if (subject.lastIndexOf("re:", 0) !== 0)
            subject = "re: " + subject;

        self.currentCategory().currentTopic().editPost().Subject(subject);
        self.currentCategory().currentTopic().editPost().CategoryId(self.currentCategory().Id());
        self.currentCategory().currentTopic().editPost().TopicId(self.currentCategory().currentTopic().Id());

        // tinyMCE editor will not bind two-ways, have to manually set the control
        // when changing the data model.
        tinymce.get('postEditor').setContent('');
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
                self.postView(true);
            });
        }
        else {
            self.currentCategory().currentTopic().posts(topic.posts());
            self.postView(true);
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

    self.deletePost = function (post) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/topics/' + post.TopicId() + '/messages/' + post.Id(),
            success: function (topicRemoved) {
                var theCat;

                ko.utils.arrayFirst(self.categories(), function (cat) {
                    if (cat.Id() === post.CategoryId()) {
                        theCat = cat;
                        return true;
                    }
                });
                if (!theCat)
                    return;

                var theTopic;
                ko.utils.arrayFirst(theCat.topics(), function (topic) {
                    if (topic.Id() === post.TopicId()) {
                        theTopic = topic;
                        return true;
                    }
                });

                ko.utils.arrayFirst(theTopic.posts(), function (thePost) {
                    if (thePost.Id() === post.Id()) {
                        // remove from the currentTopic as well.
                        ko.utils.arrayFirst(self.currentCategory().currentTopic().posts(), function(currentPost) {
                            if (currentPost.Id() == post.Id()) {
                                self.currentCategory().currentTopic().posts.remove(currentPost);
                                return true;
                            }
                        });
                        theTopic.posts.remove(thePost);
                        theTopic.NumberOfReplies(theTopic.NumberOfReplies() - 1);
                        return true;
                    }
                });

                if (topicRemoved) {
                    theCat.topics.remove(theTopic);
                    self.breadcrumbs.removeAll();
                    self.loadTopics(theCat);
                }
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

        if (left.AccountId() == 0 && right.AccountId() != 0) {
            return 1;
        }

        if (left.AccountId() != 0 && right.AccountId() == 0) {
            return -1;
        }

        if (left.Order() == right.Order())
            return left.Name() == right.Name() ? 0 : left.Name() > right.Name() ? 1 : -1;

        return left.Order() > right.Order() ? 1 : -1;
    }

    self.getMessageExpiration = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/expirationdays',
            success: function (expirationDays) {
                self.deletePostsAfter(expirationDays);

                self.deletePostsAfter.subscribe(function (newValue) {
                    self.updateMessageExpiration(newValue);
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.updateMessageExpiration = function (days) {
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/DiscussionsAPI/' + self.accountId + '/expirationdays?days=' + days,
            success: function (expirationDays) {
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.getMessageCategories();
    if (self.isAdmin) {
        self.getMessageExpiration();
    }
}

function initFAQViewModel(accountId, isAdmin) {
    initKOHelpers();

    var faqElem = document.getElementById("faq");
    if (faqElem) {
        var faqVM = new FAQViewModel(accountId, isAdmin);
        ko.applyBindings(faqVM, faqElem);
    }
}

var FAQItemViewModel = function (data, accountId) {
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

    self.Question.extend({
        required: true
    });

    self.Answer.extend({
        required: true
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var FAQViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.isEditMode = ko.observable(false);
    self.faqs = ko.observableArray();

    self.emptyFAQItem = {
        Id: 0,
        AccountId: self.accountId,
        Question: '',
        Answer: ''
    };

    self.currentEditFAQ = ko.validatedObservable(new FAQItemViewModel(self.emptyFAQItem, self.accountId));

    self.addBtnClicked = function () {
        self.isEditMode(!self.isEditMode());
        self.currentEditFAQ().update(self.emptyFAQItem);
    }

    self.editBtnClicked = function (vm) {
        self.currentEditFAQ().update(vm.toJS());
        self.isEditMode(true);
    }

    self.cancelEditBtnClicked = function () {
        self.isEditMode(false);
    }

    self.deleteBtnClicked = function (vm) {

        var url = window.config.rootUri + '/api/LeagueFAQAPI/' + self.accountId + "/faqs/" + vm.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function (id) {
                self.faqs.remove(vm);
            }
        });
    }

    self.saveBtnClicked = function (vm) {
        if (!self.currentEditFAQ.isValid())
            return;

        var data = self.currentEditFAQ().toJS();

        var type = data.Id == 0 ? 'POST' : 'PUT';

        var url = window.config.rootUri + '/api/LeagueFAQAPI/' + self.accountId + '/faqs';

        $.ajax({
            type: type,
            url: url,
            data: data,
            success: function (faq) {
                if (data.Id == 0) {
                    self.faqs.push(new FAQItemViewModel(faq));
                }
                else {
                    var faqItem = ko.utils.arrayFirst(self.faqs(), function (item) {
                        return item.Id() == faq.Id;
                    });

                    if (faqItem) {
                        faqItem.update(faq);
                    }
                }
                self.isEditMode(false);
            }
        });
    }
    self.fillFAQ = function () {
        var url = window.config.rootUri + '/api/LeagueFAQAPI/' + self.accountId + '/faqs';

        $.ajax({
            type: "GET",
            url: url,
            success: function (faqs) {
                var mappedFaqs = $.map(faqs, function (item) {
                    return new FAQItemViewModel(item, self.accountId);
                });

                self.faqs(mappedFaqs);
            }
        });

    }

    self.fillFAQ();
}

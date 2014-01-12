var ScoreboardClass = function (accountId, isAdmin) {
    this.init(accountId, isAdmin);
};

$.extend(ScoreboardClass.prototype, {
    // object variables
    accountId: 0,

    init: function (accountId, isAdmin) {
        this.accountId = accountId;
        this.isAdmin = isAdmin;
    }
});


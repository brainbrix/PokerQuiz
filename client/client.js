Accounts.ui.config({
    requestPermissions: {
        github: ['user', 'repo']
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
});

Deps.autorun(function () {
    if (Meteor.user()) {
        var user = Meteor.user();
        if (user.profile) {
            username = user.profile.name;
        } else {
            username = user.username;
        }
        
        var dbuser = Players.findOne({name: username});
        if (!dbuser) {
            Players.insert({name: username, score: 10});
            dbuser = Players.findOne({name: username});
            Meteor.call("writeLog", dbuser.name, dbuser.score, "has registered");
        }
        userId = dbuser._id;

    } else {
        userId = null;
    }
	
	Meteor.subscribe("players");
	Meteor.subscribe("logs");
});


Template.questions.events({
    'click .nextQuestion': function (a) {
        Session.set("correct_answer", "x");
        Session.set("selected_answer", "y");
        Session.set("selected_question", null);
        Meteor.call("getRandomQuestion", _onQuestionReceive);
        return false;
    }
});

_onQuestionReceive = function(error, question) {
    console.log("got question: " + question.id);
    if (question) {
        var theAnswers = question["answers"];
        var correct = theAnswers[0];
        theAnswers = _.shuffle(theAnswers);
        question["answers"] = theAnswers;
    }
    Session.set("selected_question", question);
    Session.set("correct_answer", correct);
    Session.set("selected_answer", "");

    Answers.remove({});
    for (var i = 0; i < theAnswers.length; i++) {
        Answers.insert({label: String.fromCharCode(65 + i), text: theAnswers[i] });
    }
}

Template.questions.questionSelected = function () {
    return Session.get("selected_question");
};

Template.questions.answerSelected = function () {
    return Session.get("selected_answer");
};

Template.questions.answerChosen = function () {
    return Session.get("selected_answer") == Session.get("correct_answer");
};

Template.question.questionSelected = function () {
    return Session.get("selected_question");
};

Template.question.answers = function () {
    return Answers.find();
};

Template.answer.events({
    'click .answer': function () {
        console.info(this);
        var correct = Session.get("correct_answer");
        var points = -5;
        var message = " was wrong."

        if (this.text === correct) {
            points = 10;
            message = " answered right."
        }

        Players.update(userId, {$inc: {score: points}});
        Meteor.call("writeLog", username, points, message);

        Session.set("selected_answer", this.text)

        return false;
    }
});


Template.ranking.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
};

Template.player.selected = function () {
    return userId == this._id ? "warning" : "";
};

Template.activities.logs = function () {
    return Logs.find({}, {sort: {timestamp: -1}});
};

Template.logentry.isError = function() {
    return (this.score > 0) ? "success" : "error";
};

writeLog = function (thename, thescore, themessage) {
    var dateTimeString = moment().format("YYYY-MM-DD HH:mm:ss");
    Logs.insert({timestamp: dateTimeString, name: thename, score: thescore, message: themessage});
}

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
            writeLog(dbuser.name, dbuser.score, "has registered");
        }
        userId = dbuser._id;

    } else {
        userId = null;
    }
	
	Meteor.subscribe("players");
	Meteor.subscribe("logs");
	Meteor.subscribe("questions");
});


Template.questions.events({
    'click .nextQuestion': function (a) {
        Session.set("correct_answer", "x");
        Session.set("selected_answer", "y");
        Session.set("question", "");
        Session.set("selected_question", null);
        Template.questions.questions();
        return false;
    }
});

Template.questions.questions = function () {
    var count = Questions.find({}, {}).count();
    var rp = Math.floor(Math.random() * count);
    console.log("rp: " + rp + " count:" + count);
    var selectedQuestion = Questions.findOne({}, { limit: 1, sort: {id: -1}, skip: rp });

    var theAnswers = selectedQuestion["answers"];
    if (selectedQuestion) {
        var temp = theAnswers[0];
        theAnswers = _.shuffle(theAnswers);
        selectedQuestion["answers"] = theAnswers;
    }
    Session.set("selected_question", selectedQuestion);
    Session.set("correct_answer", temp);
    Session.set("selected_answer", "");

    Answers.remove({});
    for (var i = 0; i < theAnswers.length; i++) {
        Answers.insert({label: String.fromCharCode(65 + i), text: theAnswers[i] });
    }
};

Template.questions.chosenAnswer = function () {
    return Session.get("selected_answer") == Session.get("correct_answer");
};

Template.questions.selected_question = function () {
    return Session.get("selected_question");
};

Template.questions.correct_answer = function () {
    return Session.get("correct_answer");
};

Template.questions.selected_answer = function () {
    return Session.get("selected_answer");
};

Template.question.questionselected = function () {
    return Session.get("selected_question");
};

Template.question.answers = function () {
    return Answers.find();
};

Template.answer.events({
    'click .answer': function (a) {
        console.info(this);
        var correct = Session.get("correct_answer");
        var points = -5;
        var message = " was wrong."

        if (this.text === correct) {
            points = 10;
            message = " answered right."
        }

        Players.update(userId, {$inc: {score: points}});
        writeLog(username, points, message);

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

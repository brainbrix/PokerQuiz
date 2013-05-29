// Collection, not db mapped, used only on client
Answers = new Meteor.Collection(null);

// Settings for Accounts module
Accounts.ui.config({
    requestPermissions: {
        github: ['user', 'repo']
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
});

/*
 * Autorun methods run whenever their dependencies change
 */
Deps.autorun(function () {
    // user handling (only called when logging in/out)
    if (Meteor.user()) {
        var user = Meteor.user();
        if (user.profile) {
            username = user.profile.name;
        } else {
            username = user.username;
        }
        console.log("user logged in: " + username);
        Meteor.call("createPlayerIfNotExist", username, _onCreatePlayerCallback);
        _resetQuestion();
    } else {
        Session.set("playerId", null);
    }
});

_onCreatePlayerCallback = function(error, playerId) {
    Session.set("playerId", playerId);
};

// subscriptions to published (change-)events from server
Deps.autorun(function () {
	Meteor.subscribe("players");
	Meteor.subscribe("logs");
});

// event when user select the next question
Template.questions.events({
	// get next question (random, from server)
    'click .nextQuestion': function (a) {
		// first reset the session values
		_resetQuestion();
		// now get the question from the server asynchronous
        Meteor.call("getRandomQuestion", _onQuestionReceive);
        return false;
    }
});

// callback for receiving a new random question
_onQuestionReceive = function(error, question) {
    console.log("got question: %o", question);
    if (question) {
		// determine the correct answer and shuffle the answers
        var theAnswers = question["answers"];
        var correct = theAnswers[0];
        theAnswers = _.shuffle(theAnswers);
        question["answers"] = theAnswers;
    }
	// update the values in the session for reactive computation
    Session.set("selected_question", question);
    Session.set("correct_answer", correct);
    Session.set("selected_answer", "");

	// fill the answer-collection with the possible answers
    Answers.remove({});
    for (var i = 0; i < theAnswers.length; i++) {
        Answers.insert({label: String.fromCharCode(65 + i), text: theAnswers[i] });
    }
};

_resetQuestion = function() {
    Session.set("correct_answer", "x");
    Session.set("selected_answer", "y");
    Session.set("selected_question", null);
}

// Template functions for the questions
Template.questions.questionSelected = function () {
    return Session.get("selected_question");
};

Template.questions.answerSelected = function () {
    return Session.get("selected_answer");
};

Template.questions.answerChosen = function () {
    return Session.get("selected_answer") === Session.get("correct_answer");
};

Template.question.questionSelected = function () {
    return Session.get("selected_question");
};

Template.question.answers = function () {
    return Answers.find();
};

// event when user clicks on an answer
Template.answer.events({
    'click .answer': function () {
        console.log("chosen answer: %o", this);
        var correct = Session.get("correct_answer");
        var points = -5;
        var message = "was wrong."

        if (this.text === correct) {
            points = 10;
            message = "answered right."
        }

		// update score of player
		console.log("%s; score: %d", message, points);
        Meteor.call("updateScore", Session.get("playerId"), points);
		// write it in the activity log
        Meteor.call("writeLog", username, points, message);

        Session.set("selected_answer", this.text)
        return false;
    }
});

/*
 * Template functions for ranking and players
 */
Template.ranking.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
};

Template.player.selected = function () {
    return Session.equals("playerId", this._id) ? "warning" : "";
};

/*
 * Template functions for activity log
 */
Template.activities.logs = function () {
    return Logs.find({}, {sort: {timestamp: -1}});
};

Template.logentry.isError = function() {
    return (this.score > 0) ? "success" : "error";
};

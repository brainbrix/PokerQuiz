// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".


getCurrentDateString = function () {
    da = new Date();	// Create a Date Object set to the last modifed date
    db = da.toGMTString();	// Convert to a String in "predictable formt"
    dc = db.split(" ");	// Split the string on spaces
    if (eval(dc[3]) < 1970) dc[3] = eval(dc[3]) + 100;	// Correct any date purporting to be before 1970
    db = dc[1] + " " + dc[2] + " " + dc[3];	// Ignore day of week and combine date, month and year
    return db;	// Display the result
}

Players = new Meteor.Collection("players");
Logs = new Meteor.Collection("logs");
Questions = new Meteor.Collection("questions");

// Collection is not db mapped
Answers = new Meteor.Collection(null);

if (Meteor.isClient) {

    Template.leaderboard.writeLog = function (thename, thescore, themessage) {
        var d = new Date();
        Logs.insert({zeitpunkt: getCurrentDateString() + " " + d.toLocaleTimeString(), name: thename, score: thescore, message: themessage});
    }

    Meteor.autorun(function () {
        if (Meteor.user()) {

            username = Meteor.user().username;
            //Session.set("selected_player", Meteor.user().username );
            var dbuser = Players.findOne({name: username});
            if (!dbuser) {
                Players.insert({name: username, score: 10});
            }

            dbuser = Players.findOne({name: username});
            Session.set("selected_player", dbuser._id);

        } else {
            Session.set("selected_player", null);
        }
    });


    Template.ranking.players = function () {
        return Players.find({}, {limit: 10, sort: {score: -1, name: 1}});
    };

    Template.activities.logs = function () {
        return Logs.find({}, { limit: 10, sort: {zeitpunkt: -1}});
    };

    Template.question.answers = function () {
        return Answers.find({}, {});
    };


    Template.questions.questions = function () {
        var count = Questions.find({}, {}).count();
        var rp = Math.floor(Math.random() * count);
        console.log("rp: " + rp + " count:" + count);
        var selectedQuestion = Questions.findOne({}, { limit: 1, sort: {id: -1}, skip: rp });

        var pn = Array();

        for (var propName in selectedQuestion) {
            console.log("Iterating through prop with name>", propName, "< its value is ", selectedQuestion[propName]);
        }

        for (var propName in selectedQuestion) {
            pn.push(propName);
            console.log("Iterating through prop with name>", propName, "< its value is ", selectedQuestion[propName]);
        }

        for (var propName in pn) {
            console.log("Iterating through prop with name>", propName, "< its value is ", pn[propName]);
            console.log("Iterating through prop with name>", propName, "< its value is ", selectedQuestion[ pn[propName] ]);
        }

        var theAnswers = selectedQuestion[ 'answers' ];
        if (selectedQuestion) {

            var temp = theAnswers[0];
            var randfn = function (left, right) {
                return Math.floor(Math.random() * 3) - 1;
            };
            theAnswers.sort(randfn);
            theAnswers.sort(randfn);
            theAnswers.sort(randfn);
            theAnswers.sort(randfn);

            selectedQuestion[ 'answers' ] = theAnswers;
        }
        Session.set("selected_question", selectedQuestion);
        Session.set("correct_answer", temp);
        Session.set("selected_answer", "");

        Answers.remove({});

        for (var i = 0; i < theAnswers.length; i++) {
            Answers.insert({label: String.fromCharCode(65 + i), text: theAnswers[i] });
            // Similar to 4 lines like:
            // Answers.insert( {label:'A', text: theAnswers[0] } );
        }

        return q;
    };

    Template.questions.events({
        'click .answer': function (a) {

            var correct = Session.get("correct_answer");
            var points = -5;
            var message = " was wrong."

            if (a.target.defaultValue === correct) {
                points = 10;
                message = " answered right."
            }

            //message = message + " (Points: "+points+")";
            Players.update(Session.get("selected_player"), {$inc: {score: points}});

            Template.leaderboard.writeLog(username, points, message);

            Session.set("selected_answer", a.target.defaultValue)

            return false;
        }
    });

    Template.answer.events({

        'click': function (a) {
            console.info(this);
            var correct = Session.get("correct_answer");
            var points = -5;
            var message = " was wrong."

            if (this.text === correct) {
                points = 10;
                message = " answered right."
            }

            //message = message + " (Points: " + points + ")";
            Players.update(Session.get("selected_player"), {$inc: {score: points}});

            Template.leaderboard.writeLog(username, points, message);

            Session.set("selected_answer", this.text)

            return false;
        }
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

    Template.questions.chosenAnswer = function () {
        //alert( "Answer what"+what );

        /*	var myRsvp = _.find(this.rsvps, function (r) {
         return r.user === Meteor.userId();
         }) || {};
         */
        return Session.get("selected_answer") == Session.get("correct_answer");
    };

    Template.questions.mix2 = function (a) {
        if (a) {
            console.log("mix q" + q);
            var temp = q[0];

            var randfn = function (left, right) {
                return Math.floor(Math.random() * 3) - 1;
            };

            q.sort(randfn);
            q.sort(randfn);
            //	q[0].answers.sort(randfn);
            //	q[0].answers.sort(randfn);

            console.log("correct:" + q.indexOf(temp));
        }
    }

    Accounts.ui.config({
        requestPermissions: {
            facebook: ['user_likes'],
            github: ['user', 'repo']
        },
        requestOfflineToken: {
            google: true
        },
        passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
    });

    Template.questions.selected_name = function () {
        var player = Players.findOne(Session.get("selected_player"));
        return player && player.name;
    };

    Template.player.selected = function () {
        return Session.equals("selected_player", this._id) ? "warning" : "";
    };
    
    Template.logentry.isError = function() {
        return (this.score > 0) ? "success" : "error";
    };

    Template.questions.selected_question = function () {
        return Session.get("selected_question");
    };

    Template.questions.correct_answer = function () {
        return Session.get("correct_answer");
    };

    Template.question.questionselected = function () {
        return Session.get("selected_question");
    };

    Template.questions.selected_answer = function () {
        return Session.get("selected_answer");
    };

    Template.player.events({
//        'click': function () {
//            Session.set("selected_player", this._id);
//        }
    });
}
/**
 *  On server startup, create some players if the database is empty.
 */
if (Meteor.isServer) {
    Meteor.startup(function () {

        // add some demo players
        if (Players.find().count() === 0) {
            var names = ["Ada Lovelace",
                "Claude Shannon" ];
            for (var i = 0; i < names.length; i++) {
                Players.insert({name: names[i], score: Math.floor(Math.random() * 10) * 5});
            }
        }

        if (Questions.find().count() === 0) {
            // Just to have some questions at hand
            Questions.insert({id: 1, question: "Wie viele Kinobesucher gab es im Jahr 2012 in Deutschland?", answers: ["12 Mio", "1 Mio", "34 Mio", "6,54 Mio" ]});
            Questions.insert({id: 2, question: "Wie viele Einwohner hat Deutschland?", answers: ["81 Mio", "63  Mio", "112 Mio", "44,5 Mio" ]});
            Questions.insert({id: 3, question: "Wie viele Einwohner hat Europa ca.?", answers: ["700 Mio", "1050 Mio", "112 Mio", "300 Mio" ]});

            // File questions_json.js is auto paced and loaded
            for (var i = 0; i < jsonData.length; i++) {
                Questions.insert({question: jsonData[i].question, answers: jsonData[i].answers });
            }
        }
    });
}

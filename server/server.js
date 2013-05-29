// Collection, DB mapped, used only on server
Questions = new Meteor.Collection("questions");

// On server startup, create some players and questions if the database is empty.
Meteor.startup(function () {

    // add some demo players
    if (Players.find().count() === 0) {
        console.log("creating some dummy players...");
        var names = ["John Doe", "Ada Lovelace", "Claude Shannon" ];
        for (var i = 0; i < names.length; i++) {
            Players.insert({name: names[i], score: Math.floor(Math.random() * 10) * 5});
        }
    }

    // File europe.js is auto parsed and loaded
    if (Questions.find().count() < europe.length) {
        Questions.remove({});
        var countries = _.shuffle(europe)
        for (var i = 0; i < countries.length; i++) {
            var c = countries[i];
            console.log("creating question with country %o", c);
            var q = "What is the capital of " + c.country + "?";
            var a = [];
            a.push(c.capital);
            for (int n = 1; n < 4; n++) {
                var k = i + n;
                if (k > countries.length) {
                    k = k - countries.length;
                }
                a.push(countries[k].capital);
            }
            Questions.insert({id: i, question: q, answers: a});
        }
    }
});

// Publish the collections used on server and client
// (declared in /common/collections.js)
Meteor.publish("logs", function() {
    return Logs.find({}, {limit: 10, sort: {timestamp: -1}});
});
Meteor.publish("players", function() {
    return Players.find({}, {limit: 10, sort: {score: -1, name: 1}});
});

// Method implementations, called asynchronously from the client
// (for the client, the stubs are declared in /client/methods.js)
Meteor.methods({
    // pick a random question out of the Questions collection/DB
    getRandomQuestion: function() {
        var q = Questions.find().fetch();
        q = _.shuffle(q);
        return q[0];
    },
    // write the log entry with the name, score and message given,
    // extend with the current timestamp (makes use of momentJS library in the ./lib folder)
    writeLog: function(theName, theScore, theMessage) {
        var dateTimeString = moment().format("YYYY-MM-DD HH:mm:ss");
        Logs.insert({timestamp: dateTimeString, name: theName, score: theScore, message: theMessage});
    }
});
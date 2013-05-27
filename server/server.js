/**
 *  On server startup, create some players and questions if the database is empty.
 */
Meteor.startup(function () {

    // add some demo players
    if (Players.find().count() === 0) {
        var names = ["John Doe", "Ada Lovelace", "Claude Shannon" ];
        for (var i = 0; i < names.length; i++) {
            Players.insert({name: names[i], score: Math.floor(Math.random() * 10) * 5});
        }
    }

    if (Questions.find().count() === 0) {
        // File questions_json.js is auto parsed and loaded
        for (var i = 0; i < questionsJson.length; i++) {
            Questions.insert({id: questionsJson[i].id, question: questionsJson[i].question, answers: questionsJson[i].answers });
        }
    }
});

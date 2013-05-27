// Set up collections.
// On the server, it is backed by a MongoDB collection named by the given argument string.
Players = new Meteor.Collection("players");
Logs = new Meteor.Collection("logs");
Questions = new Meteor.Collection("questions");

// Collection is not db mapped
Answers = new Meteor.Collection(null);

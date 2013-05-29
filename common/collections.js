// Set up collections used on client and server.
// On the server, it is backed by a MongoDB collection named by the given argument string.
Players = new Meteor.Collection("players");
Logs = new Meteor.Collection("logs");

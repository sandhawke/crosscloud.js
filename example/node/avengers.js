
var Promise = require('promise');
var crosscloud = require('../..');

var person = {
	nick: 
	{ 
		name: "Nick Fury", 
		selfDescription: "Director",
		imageURL: "http://fc01.deviantart.net/fs71/f/2010/244/d/4/the_avengers___nick_fury_by_agustin09-d2xr4ck.jpg"
	},
	maria:
	{
		name: "Maria Hill",
		selfDescription: "Actually does everything",
		imageURL: "http://upload.wikimedia.org/wikipedia/commons/2/29/Cobie_Smulders%281%29.jpg"
	},
	phil:
	{
		name: "Phil Coulson",
		selfDescription: "Just trying to do my job",
		imageURL: "http://upload.wikimedia.org/wikipedia/commons/f/f0/Clark_Gregg_by_Gage_Skidmore.jpg"
	},
	thor:
	{
		name: "Thor",
		selfDescription: "Genuinely Nice Guy",
		imageURL: "https://c2.staticflickr.com/4/3726/10412961916_46f51bbf33_b.jpg"},
	stark:
	{
		name: "Tony Stark",
		selfDescription: "Genius",
		imageURL: "https://c1.staticflickr.com/9/8403/8709578942_b6d9dd8002_h.jpg"
	},
	odin:
	{
		name: "Odin",
		// imageURL: "http://upload.wikimedia.org/wikipedia/commons/f/f8/Odin,_der_G%C3%B6ttervater.jpg"
		imageURL: "http://upload.wikimedia.org/wikipedia/commons/9/9f/Odin_%28Manual_of_Mythology%29.jpg"
	},
	loki:
	{
		name: "Loki",
		imageURL: "http://fc04.deviantart.net/fs70/i/2012/114/0/1/happy_loki_by_vadeg-d4xhx5d.jpg"
	},
	widow:
	{
		name: "Natasha Romanoff",
		imageURL: "http://fc05.deviantart.net/fs70/f/2012/258/5/d/natasha_romanoff_by_scarlet_xx-d5eu9p5.jpg"
	},
	cap:
	{
		name: "Captain America",
		imageURL: "http://fc07.deviantart.net/fs15/f/2007/046/c/7/Chibi_Captain_America_4__by_hedbonstudios.jpg"
	}
};

var contacts = [
	{from:person.nick, to:person.phil},
	{from:person.nick, to:person.maria},
	{from:person.nick, to:person.thor},
	{from:person.nick, to:person.stark},
	{from:person.nick, to:person.widow},
	{from:person.thor, to:person.odin},
	{from:person.thor, to:person.loki},
	{from:person.cap, to:person.widow},
];

var connection = {};

base = "http://localhost:8080/pod/";
for (var key in person) {
	// person[key]._id = base+key+"/";
	person[key]._id = "http://"+key+".databox1.com/";
}

var promises = [];
for (var key in person) {
	var profile = person[key];
	# set .openWith ??
	var pod = crosscloud.connect({podURL:profile._id});
	connection[profile._id] = pod;
	pod.push(profile, function (p) {
		console.log("Pushed", p._id);
		// if pod.outstandingPushes == 0, then go on...?
	});
}

// running this repeatedly results in duplicated contacts...
for (var i in contacts) {
	var contact = contacts[i];
	pod = connection[contact.from._id];
	var contact = {isContact:true,
				   siteURL:contact.to._id}
	pod.push(contact, 
			 function(c) {console.log('pushed connection', c);});
};
for (var i in contacts) {
	var contact = contacts[i];
	pod = connection[contact.to._id];
	var contact = {isContact:true,
				   siteURL:contact.from._id}
	pod.push(contact, 
			 function(c) {console.log('pushed connection', c);});
};

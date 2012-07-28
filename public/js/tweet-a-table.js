/*
* This app has been made for the H-ack012 http://www.facebook.com/h.ack.012
* Authors: Fabrizio Codello, Marco Sors, Nicola De Lazzari
* Copyright © 2012
*
*/

$(document).ready(function() {

	Handlebars.registerHelper('ifIsNation', function(type, options) {
		if (type == "nation") {
			return options.fn(this);
		}
	});
	Handlebars.registerHelper('ifIsSport', function(type, options) {
		if (type == "sport") {
			return options.fn(this);
		}
	});

	var Debug = {

		log: function(msg) {
			console.log(new Date().toJSON() +": "+ msg);
		},

		toggle: function(speed) {
			speed = speed || 'fast';
			defaultDebug.slideToggle(speed);
		}
	};

	function SortByCountDesc(a, b) {
		a = a.count;
		b = b.count;
		return ((a < b) ? 1 : ((a > b) ? -1 : 0));
	}
	function SortByIdAsc(a, b) {
		a = a.id;
		b = b.id;
		return ((a < b) ? -1 : ((a > b) ? 1 : 0));
	}

	function updateNations() {
		nationsHandle.html(''); //FIMXE
		nationsHandle.append(nationsTemplate({ nation: entities }));
	}

	function updateSports() {
		sportsHandle.html('');
		sportsHandle.append(sportsTemplate({ sport: entities }));
	}

	function updateAll() {
		updateNations();
		updateSports();
	}

	function readAndGenerate() {
		$.ajax({
			url: 'countries.json',
			dataType: 'json',
			success: function(data) {
				entities = data;
				//entities = data.sort(SortByIdAsc); // make sure it's ordered alphabetically

				nationsSource = $("#nation-template").html();
				nationsTemplate = Handlebars.compile(nationsSource);
				updateNations();

				sportsSource = $("#sport-template").html();
				sportsTemplate = Handlebars.compile(sportsSource);
				updateSports();
			}
		});
	}

	function init() {
		Debug.log("Connecting...");

		readAndGenerate();

		// resetLeaderboard();

		$(document).keyup(function(e) {
			if (e.keyCode === 220) { //backslash
				Debug.toggle();
			}
		});
	}

	function calcMaxPerSecond() {
		maxPerSecondInterval = setInterval(function() {
			speed.html(tweetsAmount);

			if (maxTweetsAmount < tweetsAmount) {
				maxTweetsAmount = tweetsAmount;
			}

			maxSpeed.html(maxTweetsAmount);

			tweetsAmount = 0;
		}, 1000);
	}

	/*
	* Main
	*/

	var socket = new io.connect(window.location.href);
	
	var leaderboardHandle = $("#tweets ul"),
		nationsHandle = $("#nations"),
		sportsHandle = $("#sports ul"),
		defaultDebug = $("#stats"),
		speed = $("#speed"),
		maxSpeed = $("#maxSpeed"),
		maxPerSecondInterval = null,
		tweetsAmount = 0,
		maxTweetsAmount = 0,
		entities;

	var nationsSource,
		nationsTemplate,
		sportsSource,
		sportsTemplate;

	init();
	calcMaxPerSecond();

	/*
	* Socket stuff
	*/
    
    socket.on('connect', function() {
		Debug.log("Connected.");
	});
			
	socket.on('disconnect', function() {
		Debug.log("Disconnected.");
		clearInterval(maxPerSecondInterval);
	});
		
	socket.on('tot', function(data) {
		Debug.log("Current viewers: "+ data.tot);
	});

	socket.on('filters', function(data) {
		Debug.log("Event: "+ data.event +", options: "+ data.options.join(", ") +", created at: "+ data.createdAt);
	});

	function strdecode(data) {
		return JSON.parse(decodeURIComponent(escape(data)));
	}

	function resetLeaderboard() {
		$('.amount').html('0');
	}

	function updateLeaderboard(leaderboard) {
		//leaderboardHandle.html('');
		leaderboard.forEach(function(item, index) {
			//console.log(index +"# "+ item.option +" has "+ item.count);

			// $('#'+ item.option +' .amount').html(item.count);

			var length = entities.length;
			for (var i = 0; i < length; i++) {
				if (entities[i].id == item.option) {
					entities[i].count = item.count;
					break;
				}
			}
		});
		entities.sort(SortByCountDesc);
		updateAll();
	}

	socket.on('leaderboard', function(leaderboard) {
		leaderboard = strdecode(leaderboard);

		updateLeaderboard(leaderboard);

		tweetsAmount++;
	});
});
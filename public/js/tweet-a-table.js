/*
* This app has been made for the H-ack012 http://www.facebook.com/h.ack.012
* Authors: Fabrizio Codello, Marco Sors, Nicola De Lazzari
* Copyright © 2012
*
*/

$(document).ready(function() {

	jQuery.fn.sortDomElements = (function() {
		return function(comparator) {
			return Array.prototype.sort.call(this, comparator).each(function(i) {
				this.parentNode.appendChild(this);
			});
		};
	})();

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
		nationsHandle.children().sortDomElements(function(a, b) {
			var akey = $(a).find(".amount").text();
			var bkey = $(b).find(".amount").text();
			if (akey == bkey) return 0;
			if (akey < bkey) return 1;
			if (akey > bkey) return -1;
		});
	}

	function updateSports() {
		sportsHandle.children().sortDomElements(function(a, b) {
			var akey = $(a).find(".amount").text();
			var bkey = $(b).find(".amount").text();
			if (akey == bkey) return 0;
			if (akey < bkey) return 1;
			if (akey > bkey) return -1;
		});
	}

	function updateAll() {
		updateNations();
		updateSports();
	}

	function readAndGenerate() {
		$.ajax({
			url: 'election2012.json',
			dataType: 'json',
			success: function(data) {
				entities = data;

				//entities = data.sort(SortByIdAsc); // make sure it's ordered alphabetically

				// nationsSource = $("#nation-template").html();
				// nationsTemplate = Handlebars.compile(nationsSource);
				// nationsHandle.append(nationsTemplate({ nation: entities }));

				// sportsSource = $("#sport-template").html();
				// sportsTemplate = Handlebars.compile(sportsSource);
				// sportsHandle.append(sportsTemplate({ sport: entities }));

				isReady = true;
			}
		});
	}

	function resetSums() {
		obamaAmount.html('0');
		romneyAmount.html('0');
		slogan1Amount.html('0');
		slogan2Amount.html('0');
	}

	function updateSums() {
		resetSums();

		var slogan1Amount = $("#slogan1 .amount"),
			slogan2Amount = $("#slogan2 .amount");

		var length = entities.length;
		for (var i = 0; i < length; i++) {
			var handle = $("#"+ entities[i].type +" .amount");
			var amount = parseInt(handle.text(), 10) + entities[i].count;

			handle.html(amount);

			if (entities[i].option == "forward") {
				amount = parseInt(slogan1Amount.text(), 10) + entities[i].count;
				slogan1Amount.html(amount);
			}
			if (entities[i].option == "keepamericaamerican") {
				amount = parseInt(slogan2Amount.text(), 10) + entities[i].count;
				slogan2Amount.html(amount);
			}
			
		}

	}

	function updateEntity(entity, count) {
		var length = entities.length;
		for (var i = 0; i < length; i++) {
			if (entities[i].option == entity) {
				entities[i].count = count;
				break;
			}
		}
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
		entities,
		isReady = false,
		obamaAmount = $("#obama .amount"),
		romneyAmount = $("#romney .amount");

	var slogan1Amount = $("#slogan1 .amount"),
		slogan2Amount = $("#slogan2 .amount");

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
		Debug.log("Event: "+ data.events.join(", ") +", options: "+ data.options.join(", ") +", created at: "+ data.createdAt);
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
			// console.log(index +"# "+ item.option +" has "+ item.count);

			// $('#'+ item.option +' .amount').html(item.count);

			updateEntity(item.option, item.count);
		});
		// updateAll();
	}

	socket.on('leaderboard', function(leaderboard) {
		if (isReady) {
			leaderboard = strdecode(leaderboard);

			updateLeaderboard(leaderboard);
			updateSums();

			tweetsAmount++;
		}
	});
});
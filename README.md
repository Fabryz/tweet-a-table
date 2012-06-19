Tweet-a-table
=============

Team #100 application for the [H-Ack012](http://h-ack.herokuapp.com) event that took place the 2012-06-16 at Digital Accademia.

Using the [Twitter Streaming API](https://dev.twitter.com/docs/streaming-api/methods) with Node.js, Express.js, Socket.io and jQuery

Live app: [http://tweet-a-table.nodejitsu.com](http://tweet-a-table.nodejitsu.com)

Requirements
------------

* [Node.js](http://nodejs.org/)
* [Npm](http://npmjs.org/)

Modules:

* [Socket.io](http://socket.io/)
* [Express](http://expressjs.com/)
* [Tuiter](https://github.com/danzajdband/Tuiter)

Installation
------------

1. Clone the repository with ``git clone git://github.com/Fabryz/tweet-a-table.git``
2. Install dependencies with ``npm install``
3. Modify ``/configs/twitter.json`` with your twitter application credentials
4. Modify ``/configs/keywords.json`` with the param/value used for filtering the tweets accordingly to the Twitter Streaming API Methods.
An example of the default configuration file to search for the international teams trends on the Euro2012 event:

		{
			"param": "track",
			"value": "#euro2012 #croatia,#euro2012 #czech,#euro2012 #denmark,#euro2012 #england,#euro2012 #france,#euro2012 #germany,#euro2012 #greece,#euro2012 #italy,#euro2012 #netherlands,#euro2012 #poland,#euro2012 #portugal,#euro2012 #ireland,#euro2012 #russia,#euro2012 #spain,#euro2012 #sweden,#euro2012 #ukraine"
		}

4. Start the server with ``node server.js``
5. Point your browser to ``YOUR_SERVER_IP:8080``
6. Stare at the screen, use "\" to toggle the stats panel

Contributors
------------

* [Fabrizio Codello](http://fabryz.com/)
* [Marco Sors](http://www.web-expert.it/)
* [Nicola De Lazzari](https://twitter.com/#!/Nicola_DL)

License
-------

Copyright (C) 2012 Fabrizio Codello, Marco Sors, Nicola De Lazzari

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
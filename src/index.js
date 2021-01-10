const tmi = require('tmi.js');
const mongoose = require('mongoose');
import { Match } from './models/match';
import { Iam } from './models/iam';
import { Puntos } from './models/punto';
mongoose.connect(process.env.DB, { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('conectado');
});

const express = require('express');
const app = express();
const canalDeTwitch = 'jmellera';
app.listen(process.env.PORT, () =>
  console.log('Se pico bot en ' + process.env.PORT || 80)
);

app.get('/', (req, res) => {
  try {
    Puntos.find((err, puntos) => {
      if (puntos) {
        res.send(puntos);
      }
    });
  } catch (error) {}
});

const options = {
  options: {
    debug: false,
  },
  connection: {
    cluster: 'aws',
    reconnect: true,
  },
  identity: {
    username: 'SePicoBot',
    password: process.env.TWITCH_OAUTH,
  },
  channels: [canalDeTwitch],
};

const client = new tmi.client(options);

client.connect();

client.on('connected', (address, port) => {
  //client.action('hallmartwitch', 'Farmeen!!')
});

client.on('message', (channel, tags, message, self) => {
  try {
    if (self || !message.startsWith('!')) return;
    const args = message.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    if (command === 'yosoy') {
      if (args[0]) {
        const iam = new Iam({ who: tags.username, instagram: args[0] });
        iam.save();
      }
    }
    if (command === 'punto' && (tags.mod || tags.badges.broadcaster === '1')) {
      try {
        if (args[0] && args[0].startsWith('@')) {
          args[0] = args[0].startsWith('@') ? args[0].substring(1) : args[0];
          let user = args[0].toLowerCase();
          Puntos.find({ user: user }, (err, puntos) => {
            if (err) throw new Error(err);
            if (puntos && user != tags.username) {
              const total = puntos ? puntos.length + 1 : 1;
              const punto = new Puntos({ user, givenBy: tags.username });
              punto.save();
              if (user !== 'menem91') {
                client.say(
                  channel,
                  `punto punto punto para la ${user} army! @${user} tiene ${total} puntos!`
                );
              } else {
                client.say(
                  channel,
                  `punto punto punto para la ${user} army! @${user} tiene -${total} puntos!`
                );
              }
            } else {
              client.say(channel, `No seas corrupto @${tags.username}!`);
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (command === 'puntos') {
      try {
        if (args[0] && args[0].startsWith('@')) {
          args[0] = args[0].startsWith('@') ? args[0].substring(1) : args[0];
          let user = args[0].toLowerCase();
          Puntos.find({ user: user }, (err, puntos) => {
            if (err) throw new Error(err);
            if (puntos) {
              const total = puntos.length;
              client.say(channel, `@${user} tiene ${total} puntos!`);
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (command === 'like') {
      if (args[0]) {
        args[0] = args[0].startsWith('@') ? args[0].substring(1) : args[0];
        /* 	Iam.findOne({who: tags.username}, async (err, miInstagram) => {
						if(miInstagram) {
							console.log('0'+miInstagram);
							let someoneLikedMyInstagram = await searchIfSomeoenLikedMyInstagram(channel, miInstagram, args[0]);
							if(!someoneLikedMyInstagram) {
								searchIfSomeoenLikedMe(channel, tags.username, args[0], miInstagram);
							}
						} else { */
        searchIfSomeoenLikedMe(channel, tags.username, args[0]);
      } /* 
				});
			}*/
    }
  } catch (error) {
    console.log(error);
  }
});

function newMatch(who, likes) {
  let match = new Match({ who: who.toLowerCase(), likes: likes.toLowerCase() });
  match.save((err, match) => {
    if (err) throw new Error(e.message);

    //console.log('guardado');
  });
}

function searchIfSomeoenLikedMyInstagram(channel, miInstagram, who) {
  return new Promise((resolve, reject) => {
    Match.findOne({ likes: miInstagram.who, who }, (err, match) => {
      if (err) {
        console.log(err);
      } else {
        if (match) {
          //console.log('1',match)
          match.match = true;
          Iam.findOne({ who: match.who }, (err, whoInstagram) => {
            match.save();
            client.say(
              channel,
              `match entre @${match.who} ${
                whoInstagram && whoInstagram.instagram
                  ? 'https://instagram.com/' + whoInstagram.instagram
                  : ''
              } y @${miInstagram.who || ''} ${
                miInstagram && miInstagram.instagram
                  ? 'https://instagram.com/' + miInstagram.instagram
                  : ''
              }`
            );
            resolve(true);
          });
        } else {
          //newMatch(tags.username, args[1], undefined ,args[0]);
          resolve(false);
        }
      }
    });
  });
}

function searchIfSomeoenLikedMe(channel, miUsername, likes, myInstagram) {
  /* let query = myInstagram ? { likes: { $in:[miUsername.toLowerCase(), myInstagram.instagram.toLowerCase()]}, who: likes} : { likes: miUsername.toLowerCase(), who: likes}; */
  let query = { likes: miUsername.toLowerCase(), who: likes.toLowerCase() };

  Match.findOne(query, (err, match) => {
    if (err) {
      //console.log(err);
    } else {
      if (match) {
        //console.log('2',match,miUsername,likes)
        match.match = true;
        match.save();
        client.say(channel, `match entre @${match.who} y @${miUsername}`);
        /* Iam.findOne({who: match.who}, (err, whoInstagram) => {
					//console.log('1'+whoInstagram);
					client.say(channel, `match entre @${match.who} ${whoInstagram ? "https://instagram.com/"+whoInstagram.instagram: ''} y @${miUsername || ''} ${myInstagram && myInstagram.instagram ? "https://instagram.com/"+myInstagram.instagram: ''}`)
				}); */
      } else {
        //console.log(miUsername, likes);
        Match.findOne(
          {
            who: miUsername.toLowerCase(),
            likes: likes.toLowerCase(),
            match: true,
          },
          (err, match) => {
            if (match) {
              match.match = true;
              match.save();
              client.say(
                channel,
                `match entre @${match.who} y @${likes || ''}`
              );
              //console.log('3',match,miUsername,likes)
              /* Iam.findOne({who: match.who}, (err, whoInstagram) => {
							//console.log('2'+whoInstagram);
							Iam.findOne({ who: likes.toLowerCase()}, (err, insta) => {
								//console.log('3'+whoInstagram);
								client.say(channel, `match entre @${match.who} ${whoInstagram ? "https://instagram.com/"+whoInstagram.instagram: ''} y @${likes || ''} ${insta && insta.instagram ? "https://instagram.com/"+insta.instagram: ''}`)
							})
						}); */
            } else {
              newMatch(miUsername, likes);
            }
          }
        );
      }
    }
  });
}

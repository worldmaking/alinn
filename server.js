
const express = require('express');
const WebSocket = require('ws');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");

const glmatrix = require("gl-matrix");
const vec2 = glmatrix.vec2;

//process.chdir(process.argv[2] || ".");
const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");
console.log("project_path", project_path);
console.log("server_path", server_path);
console.log("client_path", client_path);

let sessionId = 0;
let sessions = [];

const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
	res.sendFile(path.join(client_path, 'index.html'));
});
//app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app);
// add a websocket service to the http server:
const wss = new WebSocket.Server({ server });

// send a (string) message to all connected clients:
function send_all_clients(msg) {
	wss.clients.forEach(function each(client) {
		client.send(msg);
	});
}

// whenever a client connects to this websocket:
wss.on('connection', function(ws, req) {
    // it defines a new session:
	let session = {
		id: sessionId++,
		socket: ws,
	};
	sessions[session.id] = session;
	console.log("server received a connection, new session " + session.id);
	console.log("server has "+wss.clients.size+" connected clients");
	
	const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	
	ws.on('error', function (e) {
		if (e.message === "read ECONNRESET") {
			// ignore this, client will still emit close event
		} else {
			console.error("websocket error: ", e.message);
		}
	});

	// what to do if client disconnects?
	ws.on('close', function(connection) {
		console.log("session", session.id, "connection closed");
		delete sessions[session.id];
	});
	
	// respond to any messages from the client:
	ws.on('message', function(e) {
		if (e instanceof Buffer) {
			// get an arraybuffer from the message:
			const ab = e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);
			console.log("session", session.id, "received arraybuffer", ab);
			// as float32s:
			console.log(new Float32Array(ab));
		} else {
			try {
				handlemessage(JSON.parse(e), session);
			} catch (e) {
				console.log('bad JSON: ', e);
			}
		}
	});

	// // Example sending some greetings:
	// ws.send(JSON.stringify({
	// 	type: "greeting",
	// 	value: "hello",
	// 	session: sessionId,
	// 	date: Date.now()
	// }));
	// // Example sending binary:
	// const array = new Float32Array(5);
	// for (var i = 0; i < array.length; ++i) {
	// 	array[i] = i / 2;
	// }
	// ws.send(array);
});


//console.log(geojson)

function sanitize_geojson(geojson) {
	let map = JSON.parse(geojson);
	let res = {
		// we need the bounding box:
		bounds: {
			min: [1000, 1000],
			max: [-1000, -1000]
		},
		nodes: [],
		ways: [],
		polys: []
	};
	for (let f of map.features) {
		assert (f.type == "Feature");

		switch(f.geometry.type) {
			case "Point": {
				assert(f.id.substr(0,3) == "nod");
				 
				// update bounding box:
				let p = f.geometry.coordinates;
				res.bounds.min[0] = Math.min(res.bounds.min[0], p[0]);
				res.bounds.max[0] = Math.max(res.bounds.max[0], p[0]);
				res.bounds.min[1] = Math.min(res.bounds.min[1], p[1]);
				res.bounds.max[1] = Math.max(res.bounds.max[1], p[1]);

				res.nodes.push(f);
			} break;
			case "LineString": {
				//if(f.properties.route) console.log("route:", f.properties.route);

				if (f.id.substr(0,3) == "way") {
					res.ways.push(f);
				} else { 
					assert(f.id.substr(0,3) == "rel") 
				}
				
			} break;
			case "Polygon": {
				res.polys.push(f);
			} break;
			// case "MultiLineString": {
			// } break;
			default: {
				console.log("unknown geometry type", f.geometry.type);
			}
		}

	}
	return res;
}

function sanitize(json) {


	// these are all the kinds of *polygonal* way that I have found:
	let kinds =  {
		"building": {
			"yes": 1321,
			"university": 123,
			"roof": 21,
			"school": 178,
			"apartments": 1722,
			"dormitory": 11,
			"kindergarten": 28,
			"church": 25,
			"residential": 533,
			"commercial": 1235,
			"hotel": 1,
			"supermarket": 1,
			"office": 11,
			"public": 14,
			"college": 8,
			"house": 34,
			"pavilion": 1,
			"industrial": 35,
			"warehouse": 7,
			"hospital": 37,
			"cathedral": 1,
			"train_station": 2,
			"construction": 3,
			"stable": 2,
			"detached": 1,
			"강당": 1,
			"급식실": 1,
			"학원": 1,
			"retail": 4,
			"toilets": 2
		},
		"amenity": {
			"university": 16,
			"school": 227,
			"kindergarten": 27,
			"parking": 329,
			"public_building": 1,
			"bus_station": 1,
			"hospital": 27,
			"parking_space": 1,
			"recycling": 1,
			"police": 2,
			"fountain": 7,
			"bicycle_parking": 2,
			"fuel": 12,
			"grave_yard": 1,
			"place_of_worship": 9,
			"water_point": 1,
			"shelter": 49,
			"college": 5,
			"public_bookcase": 1,
			"waste_transfer_station": 1,
			"prison": 1,
			"library": 2,
			"bank": 1,
			"townhall": 3,
			"studio": 1,
			"toilets": 1
		},
		"tourism": {
			"attraction": 4,
			"theme_park": 1,
			"museum": 2
		},
		"historic": {
			"memorial": 3,
			"monument": 7,
			"archaeological_site": 1,
			"ruins": 1
		},
		"leisure": {
			"park": 237,
			"stadium": 8,
			"pitch": 285,
			"playground": 129,
			"sports_centre": 1,
			"golf_course": 7,
			"garden": 2,
			"track": 3,
			"fitness_station": 4,
			"swimming_pool": 1,
			"ice_rink": 1,
			"miniature_golf": 2,
			"fitness_centre": 1
		},
		"landuse": {
			"residential": 787,
			"industrial": 60,
			"retail": 9,
			"farmland": 64,
			"commercial": 57,
			"grass": 68,
			"military": 5,
			"religious": 2,
			"allotments": 9,
			"farmyard": 1,
			"forest": 56,
			"orchard": 1,
			"construction": 28,
			"cemetery": 9,
			"railway": 9,
			"garages": 2,
			"greenfield": 1,
			"greenhouse_horticulture": 1
		},
		"place": {
			"islet": 4,
			"farm": 1,
			"square": 1,
			"isolated_dwelling": 1,
			"town": 3
		},
		"area": {
			"yes": 111
		},
		"natural": {
			"water": 71,
			"wood": 74,
			"sand": 35,
			"heath": 16,
			"grassland": 20,
			"fell": 1
		},
		"waterway": {
			"riverbank": 5
		},
		"highway": {
			"trunk_link": 2,
			"service": 44,
			"residential": 13,
			"tertiary": 3,
			"footway": 48,
			"unclassified": 5,
			"secondary": 4,
			"secondary_link": 4,
			"pedestrian": 2,
			"rest_area": 1
		},
		"barrier": {
			"fence": 5,
			"wall": 2
		},
		"aeroway": {
			"aerodrome": 1,
			"taxiway": 2,
			"helipad": 2
		},
		"railway": {
			"station": 1,
			"rail": 1
		},
		"power": {
			"substation": 4,
			"transformer": 1
		},
		"military": {
			"training_area": 1
		},
		"shop": {
			"supermarket": 1,
			"car_repair": 1
		},
		"office": {
			"company": 2
		},
		"man_made": {
			"bridge": 5,
			"water_tower": 3,
			"wastewater_plant": 1,
			"water_works": 1
		},
		"public_transport": {
			"station": 1
		}
	}
	for (let k in kinds) {
		kinds[k] = {};
	}


	let map = JSON.parse(json);
	let res = {
		// we need the bounding box:
		bounds: {
			min: [1000, 1000],
			max: [-1000, -1000]
		},
		nodes: {},
		ways: {},
		polys: {},
		node_ids: [],
		way_ids: [],
		poly_ids: [],
	};
	for (let f of map.elements) {
		if (f.type == "node") {
			// update bounding box:
			let p = [f.lon, f.lat];
			res.bounds.min[0] = Math.min(res.bounds.min[0], p[0]);
			res.bounds.max[0] = Math.max(res.bounds.max[0], p[0]);
			res.bounds.min[1] = Math.min(res.bounds.min[1], p[1]);
			res.bounds.max[1] = Math.max(res.bounds.max[1], p[1]);

			// insert:
			res.nodes[f.id] = {
				pos: p,
				id: f.id,
				tags: f.tags,
				ways: [],
			};
			res.node_ids.push(f.id);
		}
	}


	// note how some items have a "layer" tag to indicate verticality

	for (let f of map.elements) {
		if (f.type == "way") {
			let first = f.nodes[0];
			let last = f.nodes[f.nodes.length-1];
			if (f.nodes.length > 1 && first == last) {
				// this is a loop
				if (!f.tags) {
					// a loop with no tags -- what is it??
					//console.log(f);
					continue;
				}
				let found = false;
				for (let k in kinds) {
					let v = f.tags[k];
					if (v) {
						if (kinds[k][v] == undefined) kinds[k][v] = 1;
						else kinds[k][v]++;
						found = true;
						break;
					}
				}
				if (!found) {
					//console.log(f.tags);
				}

				// building: yes, commercial, ...
				// tourism: attraction
				// amenity: parking, schoool, college, university, hospital
				// historic: ruins

				// leisure: pitch, park, playground
				// landuse: commercial, residential, farmland, retail
				// area: yes
				// natural: water, heath
				// waterway: riverbank

				// highway: footway, unclassified + oneway: yes | junction: roundabout

				// trim nodes to those that exist?
				let rnodes = [];
				for (let n of f.nodes) {
					if (res.nodes[n]) {
						rnodes.push(n);
					}
				}

				// insert:
				res.polys[f.id] = {
					id: f.id,
					tags: f.tags,
					nodes: rnodes
				};
				res.poly_ids.push(f.id);
			} else {

				// trim nodes to those that exist?
				let rnodes = [];
				let n, nnode;
				n = f.nodes[0];
				nnode = res.nodes[n];
				if (nnode) rnodes.push(n);

				for (let i=1; i<f.nodes.length; i++) {
					let p = n;
					let pnode = nnode;

					n = f.nodes[i];
					nnode = res.nodes[n];
					if (nnode) rnodes.push(n);
					
					// if both nodes exist, there is a valid way between them
					if (pnode && nnode) {
						// store this relation in the nodes:
						let vec_np = vec2.sub(vec2.create(), pnode.pos, nnode.pos);
						let vec_pn = vec2.sub(vec2.create(), nnode.pos, pnode.pos);
						pnode.ways.push({ 
							to: nnode.id, 
							way: f.id,
							vec: vec_pn, 
							dir: vec2.normalize(vec2.create(), vec_pn)
						});
						nnode.ways.push({ 
							to: pnode.id, 
							way: f.id,
							vec: vec_np,
							dir: vec2.normalize(vec2.create(), vec_np)
						});
					}
				}
					
				// insert:
				res.ways[f.id] = {
					id: f.id,
					tags: f.tags,
					nodes: rnodes
				};
				res.way_ids.push(f.id);

			}
		}
	}

	//console.log("let kinds = ", JSON.stringify(kinds, null, 4));
	return res;
}

// let json = fs.readFileSync(path.join("data", "gwangju" + ".json"), "utf8");
// let map = sanitize(json);

function handlemessage(msg, session) {
	if (msg.type == "get_map") {
		let name = msg.value || "downtown"; // "gwangju"
		//let geojson = fs.readFileSync(path.join("data", name + ".geojson"), "utf8");
		//let map = sanitize_geojson(geojson);
		
		let json = fs.readFileSync(path.join("data", name + ".json"), "utf8");
		let map = sanitize(json);
		//console.log(map);
		// store that:
		fs.writeFileSync(path.join("data", name + ".sanitized.json"), JSON.stringify(map, null, 2), "utf8");
		fs.writeFileSync(path.join("data", name + ".sanitized.min.json"), JSON.stringify(map), "utf8");
		// before sending, lets massage the data a little.
		//console.log("sending map data for " + name);
		//console.log(mapstr);
		session.socket.send(JSON.stringify({
			type: "map_data",
			value: JSON.stringify(map),
			session: session.id,
			date: Date.now()
		}));
	} else {

		console.log("session", session.id, "received JSON", msg);
	}

	
}

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});
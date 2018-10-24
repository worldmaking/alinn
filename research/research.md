

## Experiments on codepen:

Mobilenet: https://codepen.io/grrrwaaa/pen/VGxXvw
OSM testing: https://codepen.io/grrrwaaa/pen/XPYMXr?editors=0010
GA NN: https://codepen.io/grrrwaaa/pen/QBZOyB


## Overview

System restarts each day; over 10 days have 10 histories.

System of 3 layers:

1. endless city: AI-driven generation of city; trained on gwangju; the roadways, walkways, etc. all ways material and information transit through the city
2. population of agents traversing these ways, with simpler, evoving NNs as their brains
3. an observing system, looking for any dominant subpopulations, any elements drowning out interest, and removing them (annihilation-assimilation?), the panoptic eraser, in order to maximize variety and satisfy curiosity

2 & 3 are therefore somewhat adversarial?

immune systems: preserve identity through variety
immune system is defence at micro-scale, where pathogen is far smaller than the host it will exploit/eat
immune system combines innate and adaptive components
immune system is a discriminator, distinguish between real & fake (cf CAS tags), but also between parts of self that have become autonomous (cancer)

when recognizer/discriminator agents detect a known pathogen, 

law of requiste variety (only variety can destroy variety) https://en.wikipedia.org/wiki/Variety_(cybernetics)#Law_of_Requisite_Variety

can you get good balance between observer-controller and autonomy, optimization and adaptability




## Reference points

https://opendot.github.io/ml4a-invisible-cities/ -- Gene Kogan etc. doing style transfer from satellite photos to imaginary cities

TextureGAN: https://towardsdatascience.com/cvpr-2018-paper-summary-texturegan-controlling-deep-image-synthesis-with-texture-patches-50040c0e5cf



## Sharpening filter

Agent leaves pheromone trail.

First pass is widely dispersed. 
Subsequent passes focus the line, sharpening it.
Variant of a kernel sharpener? That is, degree of diffusion depends on the amount already present. 


## Genetic Algorithms for NNs

I made this simple version using raw JS: https://codepen.io/grrrwaaa/pen/QBZOyB?editors=0010

Neataptic.js
pull into a page using one of these: 
- https://wagenaartje.github.io/neataptic/cdn/1.4.7/neataptic.js
- https://cdn.jsdelivr.net/npm/neataptic@1.4.7/dist/neataptic.min.js

... and put `neataptic.` in front of the methods, e.g. `new neataptic.Network(...)` or `new neataptic.architect.Perceptron(...)` etc.


Many tutorials here: https://wagenaartje.github.io/neataptic/docs/tutorials/tutorials/
https://codepen.io/grrrwaaa/pen/pOMqMG?editors=1010
https://github.com/wagenaartje/neataptic

Evolving agents example here: https://corpr8.github.io/neataptic-targetseeking-tron/
https://wagenaartje.github.io/neataptic/articles/neuroevolution/



Evolving Simple Organisms using a Genetic Algorithm and Deep Learning from Scratch with Python
https://nathanrooy.github.io/posts/2017-11-30/evolving-simple-organisms-using-a-genetic-algorithm-and-deep-learning/
- TL;DR - Learn how to evolve a population of simple organisms each containing a unique neural network using a genetic algorithm.
- python
- v. relevant to AN!!

- See also 
- https://wagenaartje.github.io/neataptic/articles/agario
- https://github.com/zonetti/snake-neural-network/


## Open questions

Does the map generator work on a pixel-basis or some other basis more closely related to an ontology of places and connections?

Pixel based search keywords: texture synthesis, inpainting, pixelRNN

## Street data

Openstreetmap.org has street map coverage of Gwangju.
It has an open API for read-only access to the data at https://wiki.openstreetmap.org/wiki/Overpass_API

Gwangju: 35.1768202,126.7737603

more or less:

```
// whole city
node(35.1,126.78,35.25,126.94);out body;
```
https://www.overpass-api.de/api/interpreter?data=[out:json];(node(35.1,126.78,35.25,126.94);way(35.1,126.78,35.25,126.94););out%20body;


```
// nodes & ways around ACC:
(node(35.14,126.91,35.16,126.93);way(35.14,126.91,35.16,126.93););out body;
```

https://www.overpass-api.de/api/interpreter?data=[out:json];(node(35.12,126.85,35.20,126.93);way(35.12,126.85,35.20,126.93););out%20body;


https://www.overpass-api.de/api/interpreter?data=[out:json];(node(35.14,126.91,35.16,126.93);way(35.14,126.91,35.16,126.93););out%20body;

// ACC: 35.146,126.917
node(35.14,126.91,35.15,126.92);out body;

multiple statements (terminating with ";")
statements are node, way, rel, or out.



The OSM data ontology has these kinds of objects:
- node (a single point, with ID and metadata)
- way (refer to lists of nodes; represent roads, and also boundary regions e.g. park edges)
- relation (inter-relations between certain nodes & ways)

It uses a query language to specify what data is required. Fantastic online test environment here:
http://overpass-turbo.eu

There are various URLs to talk to this service, but it looks like a good default is https://overpass-api.de/api/interpreter




Lots of info here:
https://wiki.openstreetmap.org/wiki/Frameworks
https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example

Examples in the Frameworks page above of tools for converting the requested map data into Canvas rendering (e.g. https://github.com/kothic/kothic-js) -- and from a Canvas we can extract pixel data to feed into an image-based NN.

(but, is image-based the right way? or should we be doing some kind of object-based NN that mirrors the OSM ontology?)

Some npm modules that use this API -- probably we don't need to use these, and can work with the API directly, but it might be helpful to compare:
https://github.com/marook/osm-read/
https://www.npmjs.com/package/get-overpass
https://github.com/plepe/overpass-frontend
https://github.com/perliedman/query-overpass
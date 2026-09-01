this.L = this.L || {};
this.L.GridLayer = this.L.GridLayer || {};
this.L.GridLayer.GoogleMutant = (function (leaflet) {
	"use strict";

	/**
	 * GoogleMutant by Iván Sánchez Ortega <ivan@sanchezortega.es> https://ivan.sanchezortega.es
	 * Source and issue tracking: https://gitlab.com/IvanSanchez/Leaflet.GridLayer.GoogleMutant/
	 *
	 * Based on techniques from https://github.com/shramov/leaflet-plugins
	 * and https://avinmathew.com/leaflet-and-google-maps/ , but relying on MutationObserver.
	 *
	 * "THE BEER-WARE LICENSE":
	 * <ivan@sanchezortega.es> wrote this file. As long as you retain this notice you
	 * can do whatever you want with this stuff. If we meet some day, and you think
	 * this stuff is worth it, you can buy me a beer in return.
	 *
	 * Uses MIT-licensed code from https://github.com/rsms/js-lru/
	 */

	// This implementation of LRUMap is a copy of https://github.com/rsms/js-lru/ ,
	// trivially adapted for ES6 exports.

	/*
	The MIT License

	Copyright (c) 2010-2020 Rasmus Andersson <https://rsms.me/>

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	*/

	/**
	 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
	 * recently used items while discarding least recently used items when its limit
	 * is reached.
	 *
	 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
	 * See README.md for details.
	 *
	 * Illustration of the design:
	 *
	 *       entry             entry             entry             entry
	 *       ______            ______            ______            ______
	 *      | head |.newer => |      |.newer => |      |.newer => | tail |
	 *      |  A   |          |  B   |          |  C   |          |  D   |
	 *      |______| <= older.|______| <= older.|______| <= older.|______|
	 *
	 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
	 */

	const NEWER = Symbol("newer");
	const OLDER = Symbol("older");

	class LRUMap {
		constructor(limit, entries) {
			if (typeof limit !== "number") {
				// called as (entries)
				entries = limit;
				limit = 0;
			}

			this.size = 0;
			this.limit = limit;
			this.oldest = this.newest = undefined;
			this._keymap = new Map();

			if (entries) {
				this.assign(entries);
				if (limit < 1) {
					this.limit = this.size;
				}
			}
		}

		_markEntryAsUsed(entry) {
			if (entry === this.newest) {
				// Already the most recenlty used entry, so no need to update the list
				return;
			}
			// HEAD--------------TAIL
			//   <.older   .newer>
			//  <--- add direction --
			//   A  B  C  <D>  E
			if (entry[NEWER]) {
				if (entry === this.oldest) {
					this.oldest = entry[NEWER];
				}
				entry[NEWER][OLDER] = entry[OLDER]; // C <-- E.
			}
			if (entry[OLDER]) {
				entry[OLDER][NEWER] = entry[NEWER]; // C. --> E
			}
			entry[NEWER] = undefined; // D --x
			entry[OLDER] = this.newest; // D. --> E
			if (this.newest) {
				this.newest[NEWER] = entry; // E. <-- D
			}
			this.newest = entry;
		}

		assign(entries) {
			let entry,
				limit = this.limit || Number.MAX_VALUE;
			this._keymap.clear();
			let it = entries[Symbol.iterator]();
			for (let itv = it.next(); !itv.done; itv = it.next()) {
				let e = new Entry(itv.value[0], itv.value[1]);
				this._keymap.set(e.key, e);
				if (!entry) {
					this.oldest = e;
				} else {
					entry[NEWER] = e;
					e[OLDER] = entry;
				}
				entry = e;
				if (limit-- == 0) {
					throw new Error("overflow");
				}
			}
			this.newest = entry;
			this.size = this._keymap.size;
		}

		get(key) {
			// First, find our cache entry
			var entry = this._keymap.get(key);
			if (!entry) return; // Not cached. Sorry.
			// As <key> was found in the cache, register it as being requested recently
			this._markEntryAsUsed(entry);
			return entry.value;
		}

		set(key, value) {
			var entry = this._keymap.get(key);

			if (entry) {
				// update existing
				entry.value = value;
				this._markEntryAsUsed(entry);
				return this;
			}

			// new entry
			this._keymap.set(key, (entry = new Entry(key, value)));

			if (this.newest) {
				// link previous tail to the new tail (entry)
				this.newest[NEWER] = entry;
				entry[OLDER] = this.newest;
			} else {
				// we're first in -- yay
				this.oldest = entry;
			}

			// add new entry to the end of the linked list -- it's now the freshest entry.
			this.newest = entry;
			++this.size;
			if (this.size > this.limit) {
				// we hit the limit -- remove the head
				this.shift();
			}

			return this;
		}

		shift() {
			// todo: handle special case when limit == 1
			var entry = this.oldest;
			if (entry) {
				if (this.oldest[NEWER]) {
					// advance the list
					this.oldest = this.oldest[NEWER];
					this.oldest[OLDER] = undefined;
				} else {
					// the cache is exhausted
					this.oldest = undefined;
					this.newest = undefined;
				}
				// Remove last strong reference to <entry> and remove links from the purged
				// entry being returned:
				entry[NEWER] = entry[OLDER] = undefined;
				this._keymap.delete(entry.key);
				--this.size;
				return [entry.key, entry.value];
			}
		}

		// -------------------------------------------------------------------------------------
		// Following code (until end of class definition) is optional and can be removed without
		// breaking the core functionality.

		find(key) {
			let e = this._keymap.get(key);
			return e ? e.value : undefined;
		}

		has(key) {
			return this._keymap.has(key);
		}

		delete(key) {
			var entry = this._keymap.get(key);
			if (!entry) return;
			this._keymap.delete(entry.key);
			if (entry[NEWER] && entry[OLDER]) {
				// relink the older entry with the newer entry
				entry[OLDER][NEWER] = entry[NEWER];
				entry[NEWER][OLDER] = entry[OLDER];
			} else if (entry[NEWER]) {
				// remove the link to us
				entry[NEWER][OLDER] = undefined;
				// link the newer entry to head
				this.oldest = entry[NEWER];
			} else if (entry[OLDER]) {
				// remove the link to us
				entry[OLDER][NEWER] = undefined;
				// link the newer entry to head
				this.newest = entry[OLDER];
			} else {
				// if(entry[OLDER] === undefined && entry.newer === undefined) {
				this.oldest = this.newest = undefined;
			}

			this.size--;
			return entry.value;
		}

		clear() {
			// Not clearing links should be safe, as we don't expose live links to user
			this.oldest = this.newest = undefined;
			this.size = 0;
			this._keymap.clear();
		}

		keys() {
			return new KeyIterator(this.oldest);
		}

		values() {
			return new ValueIterator(this.oldest);
		}

		entries() {
			return this;
		}

		[Symbol.iterator]() {
			return new EntryIterator(this.oldest);
		}

		forEach(fun, thisObj) {
			if (typeof thisObj !== "object") {
				thisObj = this;
			}
			let entry = this.oldest;
			while (entry) {
				fun.call(thisObj, entry.value, entry.key, this);
				entry = entry[NEWER];
			}
		}

		/** Returns a JSON (array) representation */
		toJSON() {
			var s = new Array(this.size),
				i = 0,
				entry = this.oldest;
			while (entry) {
				s[i++] = { key: entry.key, value: entry.value };
				entry = entry[NEWER];
			}
			return s;
		}

		/** Returns a String representation */
		toString() {
			var s = "",
				entry = this.oldest;
			while (entry) {
				s += String(entry.key) + ":" + entry.value;
				entry = entry[NEWER];
				if (entry) {
					s += " < ";
				}
			}
			return s;
		}
	}

	function Entry(key, value) {
		this.key = key;
		this.value = value;
		this[NEWER] = undefined;
		this[OLDER] = undefined;
	}

	function EntryIterator(oldestEntry) {
		this.entry = oldestEntry;
	}
	EntryIterator.prototype[Symbol.iterator] = function () {
		return this;
	};
	EntryIterator.prototype.next = function () {
		let ent = this.entry;
		if (ent) {
			this.entry = ent[NEWER];
			return { done: false, value: [ent.key, ent.value] };
		} else {
			return { done: true, value: undefined };
		}
	};

	function KeyIterator(oldestEntry) {
		this.entry = oldestEntry;
	}
	KeyIterator.prototype[Symbol.iterator] = function () {
		return this;
	};
	KeyIterator.prototype.next = function () {
		let ent = this.entry;
		if (ent) {
			this.entry = ent[NEWER];
			return { done: false, value: ent.key };
		} else {
			return { done: true, value: undefined };
		}
	};

	function ValueIterator(oldestEntry) {
		this.entry = oldestEntry;
	}
	ValueIterator.prototype[Symbol.iterator] = function () {
		return this;
	};
	ValueIterator.prototype.next = function () {
		let ent = this.entry;
		if (ent) {
			this.entry = ent[NEWER];
			return { done: false, value: ent.value };
		} else {
			return { done: true, value: undefined };
		}
	};

	// GoogleMutant by Iván Sánchez Ortega <ivan@sanchezortega.es>

	function waitForAPI(callback, context) {
		let checkCounter = 0,
			intervalId = null;

		intervalId = setInterval(function () {
			if (checkCounter >= 20) {
				clearInterval(intervalId);
				throw new Error("window.google not found after 10 seconds");
			}
			if (!!window.google && !!window.google.maps && !!window.google.maps.Map) {
				clearInterval(intervalId);
				callback.call(context);
			}
			++checkCounter;
		}, 500);
	}

	// 🍂class GridLayer.GoogleMutant
	// 🍂extends GridLayer
	class GoogleMutant extends leaflet.GridLayer {
		static {
			// Try to set default option values the Leaflet 2 way
			if (this.setDefaultOptions) {
				this.setDefaultOptions({
					maxZoom: 21, // can be 23, but ugly if more than maxNativeZoom
					// 🍂option type: String = 'roadmap'
					// Google's map type. Valid values are 'roadmap', 'satellite', 'terrain' or 'hybrid'.
					type: "roadmap",
					maxNativeZoom: 21,
				});
			} else {
				// If Leaflet v2 is not available, fall back.
				this.options ??= {};
				this.options.maxZoom ??= 21;
				this.options.type ??= "roadmap";
				this.options.maxNativeZoom ??= 21;
			}
		}

		constructor(options) {
			super(options);

			// Couple data structures indexed by tile key
			this._tileCallbacks = {}; // Callbacks for promises for tiles that are expected
			this._lru = new LRUMap(100); // Tile LRU cache

			// Before 2024(ish), Google used two tiles for hybrid mode, reusing
			// the aerial tiles. This seems to be no longer the case.
			// this._imagesPerTile = this.options.type === "hybrid" ? 2 : 1;
			this._imagesPerTile = 1;

			this._boundOnMutatedImage = this._onMutatedImage.bind(this);
		}

		onAdd(map) {
			super.onAdd(map);
			this._initMutantContainer();

			// Attribution and logo nodes are not mutated a second time if the
			// mutant is removed and re-added to the map, hence they are
			// not cleaned up on layer removal, so they can be added here.
			if (this._logoContainer) {
				map._controlCorners.bottomleft.appendChild(this._logoContainer);
			}
			if (this._attributionContainer) {
				map._controlCorners.bottomright.appendChild(this._attributionContainer);
			}

			waitForAPI(() => {
				if (!this._map) {
					return;
				}
				this._initMutant();

				//handle layer being added to a map for which there are no Google tiles at the given zoom
				google.maps.event.addListenerOnce(this._mutant, "idle", () => {
					if (!this._map) {
						return;
					}
					this._checkZoomLevels();
					this._mutantIsReady = true;
				});
			});
		}

		onRemove(map) {
			super.onRemove(map);
			this._observer.disconnect();
			map._container.removeChild(this._mutantContainer);
			this._logoContainer?.remove();
			this._attributionContainer?.remove();
			if (this._mutant) {
				google.maps.event.clearListeners(this._mutant, "idle");
			}
		}

		// 🍂method addGoogleLayer(name: String, options?: Object): this
		// Adds layer with the given name and options to the google Map instance.
		// `name`: one of the google maps API layers, with it's constructor available in `google.maps` object.
		// currently following values supported: 'TrafficLayer', 'TransitLayer', 'BicyclingLayer'.
		// `options`: see https://developers.google.com/maps/documentation/javascript/reference/map
		addGoogleLayer(googleLayerName, options) {
			if (!this._subLayers) this._subLayers = {};
			this.whenReady(() => {
				var Constructor = google.maps[googleLayerName];
				var googleLayer = new Constructor(options);
				googleLayer.setMap(this._mutant);
				this._subLayers[googleLayerName] = googleLayer;
			});
			return this;
		}

		// 🍂method removeGoogleLayer(name: String): this
		// Removes layer with the given name from the google Map instance.
		removeGoogleLayer(googleLayerName) {
			this.whenReady(() => {
				var googleLayer = this._subLayers && this._subLayers[googleLayerName];
				if (googleLayer) {
					googleLayer.setMap(null);
					delete this._subLayers[googleLayerName];
				}
			});
			return this;
		}

		_initMutantContainer() {
			if (!this._mutantContainer) {
				this._mutantContainer = leaflet.DomUtil.create(
					"div",
					"leaflet-google-mutant leaflet-top leaflet-left"
				);
				this._mutantContainer.id =
					"_MutantContainer_" + leaflet.Util.stamp(this._mutantContainer);
				this._mutantContainer.style.pointerEvents = "none";
				this._mutantContainer.style.visibility = "hidden";

				leaflet.DomEvent.off(this._mutantContainer);
			}
			this._map.getContainer().appendChild(this._mutantContainer);

			this.setOpacity(this.options.opacity);
			const style = this._mutantContainer.style;
			if (this._map.options.zoomSnap < 1) {
				// Fractional zoom needs a bigger mutant container in order to load more (smaller) tiles
				style.width = "180%";
				style.height = "180%";
			} else {
				style.width = "100%";
				style.height = "100%";
			}
			style.zIndex = -1;

			this._attachObserver(this._mutantContainer);
		}

		_initMutant() {
			if (this._mutant) {
				return;
			}

			var options = {
				center: { lat: 0, lng: 0 },
				zoom: 0,
				tilt: 0,
				mapTypeId: this.options.type,
				disableDefaultUI: true,
				keyboardShortcuts: false,
				draggable: false,
				disableDoubleClickZoom: true,
				scrollwheel: false,
				styles: this.options.styles || [],
				backgroundColor: "transparent",
			};
			if (this.options.mapId != null) {
				options.mapId = this.options.mapId;
			}
			var map = new google.maps.Map(this._mutantContainer, options);

			this._mutant = map;

			this._update();

			// 🍂event spawned
			// Fired when the mutant has been created.
			this.fire("spawned", { mapObject: map });

			this._waitControls();
			this.once("controls_ready", this._setupAttribution);
		}

		_attachObserver(node) {
			if (!this._observer)
				this._observer = new MutationObserver(this._onMutations.bind(this));

			// pass in the target node, as well as the observer options
			this._observer.observe(node, { childList: true, subtree: true });

			// if we are reusing an old _mutantContainer, we must manually detect
			// all existing tiles in it
			Array.prototype.forEach.call(node.querySelectorAll("img"), this._boundOnMutatedImage);
		}

		_waitControls() {
			const id = setInterval(() => {
				const layoutManager = this._mutant.__gm.layoutManager;
				if (!layoutManager) {
					return;
				}
				clearInterval(id);
				let positions;
				// iterate through obfuscated key names to find positions set (atm: layoutManager.o)
				Object.keys(layoutManager).forEach(function (key) {
					const el = layoutManager[key];
					if (el.get) {
						if (el.get(1) instanceof Node) {
							positions = el;
						}
					}
				});
				// 🍂event controls_ready
				// Fired when controls positions get available (passed in `positions` property).
				this.fire("controls_ready", { positions });
			}, 50);
		}

		_setupAttribution(ev) {
			if (!this._map) {
				return;
			}
			// https://developers.google.com/maps/documentation/javascript/reference/control#ControlPosition
			const pos = google.maps.ControlPosition;
			const ctr = (this._attributionContainer = ev.positions.get(pos.BOTTOM_RIGHT));
			ctr.classList.add("leaflet-control", "leaflet-control-attribution");
			leaflet.DomEvent.disableClickPropagation(ctr);
			ctr.style.height = "14px";
			this._map._controlCorners.bottomright.appendChild(ctr);

			this._logoContainer = ev.positions.get(pos.BOTTOM_LEFT);
			this._logoContainer.style.pointerEvents = "auto";
			this._map._controlCorners.bottomleft.appendChild(this._logoContainer);
		}

		_onMutations(mutations) {
			for (var i = 0; i < mutations.length; ++i) {
				var mutation = mutations[i];
				for (var j = 0; j < mutation.addedNodes.length; ++j) {
					var node = mutation.addedNodes[j];

					if (node instanceof HTMLImageElement) {
						this._onMutatedImage(node);
					} else if (node instanceof HTMLElement) {
						Array.prototype.forEach.call(
							node.querySelectorAll("img"),
							this._boundOnMutatedImage
						);
					}
				}
			}
		}

		// Only images which 'src' attrib match this will be considered for moving around.
		// Looks like some kind of string-based protobuf, maybe??
		// Only the roads (and terrain, and vector-based stuff) match this pattern
		_roadRegexp = /!1i(\d+)!2i(\d+)!3i(\d+|VinaFnapurmBegrtn)!/;

		// On the other hand, raster imagery matches this other pattern
		_satRegexp = /x=(\d+)&y=(\d+)&z=(\d+|VinaFnapurmBegrtn)/;

		_onMutatedImage(imgNode) {
			let coords;
			let match = imgNode.src.match(this._roadRegexp);
			let sublayer = 0;

			if (match) {
				coords = {
					z: match[1],
					x: match[2],
					y: match[3],
				};
				if (this._imagesPerTile > 1) {
					imgNode.style.zIndex = 1;
					sublayer = 1;
				}
			} else {
				match = imgNode.src.match(this._satRegexp);
				if (match) {
					coords = {
						x: match[1],
						y: match[2],
						z: match[3],
					};
				}
				// imgNode.style.zIndex = 0;
				sublayer = 0;
			}

			if (coords) {
				var tileKey = this._tileCoordsToKey(coords);
				imgNode.style.position = "absolute";

				var key = tileKey + "/" + sublayer;
				// Cache img so it can also be used in subsequent tile requests
				this._lru.set(key, imgNode);

				if (key in this._tileCallbacks && this._tileCallbacks[key]) {
					// Use the tile for *all* pending callbacks. They'll be cloned anyway.
					this._tileCallbacks[key].forEach((callback) => callback(imgNode));
					delete this._tileCallbacks[key];
				}
			}
		}

		createTile(coords, done) {
			const key = this._tileCoordsToKey(coords),
				tileContainer = leaflet.DomUtil.create("div");

			tileContainer.style.textAlign = "left";
			tileContainer.dataset.pending = this._imagesPerTile;
			done = done.bind(this, null, tileContainer);

			for (var i = 0; i < this._imagesPerTile; ++i) {
				const key2 = key + "/" + i,
					imgNode = this._lru.get(key2);
				if (imgNode) {
					tileContainer.appendChild(this._clone(imgNode));
					--tileContainer.dataset.pending;
				} else {
					this._tileCallbacks[key2] = this._tileCallbacks[key2] || [];
					this._tileCallbacks[key2].push(
						function (c /*, k2*/) {
							return function (imgNode) {
								c.appendChild(this._clone(imgNode));
								--c.dataset.pending;
								if (!parseInt(c.dataset.pending)) {
									done();
								}
							}.bind(this);
						}.bind(this)(tileContainer /*, key2*/)
					);
				}
			}

			if (!parseInt(tileContainer.dataset.pending)) {
				leaflet.Util.requestAnimFrame(done);
			}
			return tileContainer;
		}

		_clone(imgNode) {
			const clonedImgNode = imgNode.cloneNode(true);
			clonedImgNode.style.visibility = "visible";
			return clonedImgNode;
		}

		_checkZoomLevels() {
			//setting the zoom level on the Google map may result in a different zoom level than the one requested
			//(it won't go beyond the level for which they have data).
			const zoomLevel = this._map.getZoom(),
				gMapZoomLevel = this._mutant.getZoom();

			if (!zoomLevel || !gMapZoomLevel) return;

			if (
				gMapZoomLevel !== zoomLevel || //zoom levels are out of sync, Google doesn't have data
				gMapZoomLevel > this.options.maxNativeZoom
			) {
				//at current location, Google does have data (contrary to maxNativeZoom)
				//Update maxNativeZoom
				this._setMaxNativeZoom(gMapZoomLevel);
			}
		}

		_setMaxNativeZoom(zoomLevel) {
			if (zoomLevel !== this.options.maxNativeZoom) {
				this.options.maxNativeZoom = zoomLevel;
				this._resetView();
			}
		}

		_update(center) {
			// zoom level check needs to happen before super's implementation (tile addition/creation)
			// otherwise tiles may be missed if maxNativeZoom is not yet correctly determined
			if (this._mutant) {
				center = center || this._map.getCenter();
				const _center = new google.maps.LatLng(center.lat, center.lng),
					zoom = Math.round(this._map.getZoom()),
					mutantZoom = this._mutant.getZoom();

				this._mutant.setCenter(_center);

				//ignore fractional zoom levels
				if (zoom !== mutantZoom) {
					this._mutant.setZoom(zoom);

					if (this._mutantIsReady) this._checkZoomLevels();
					//else zoom level check will be done later by 'idle' handler
				}
			}

			super._update(center);
		}

		// @method whenReady(fn: Function, context?: Object): this
		// Runs the given function `fn` when the mutant gets initialized, or immediately
		// if it's already initialized, optionally passing a function context.
		whenReady(callback, context) {
			if (this._mutant) {
				callback.call(context || this, { target: this });
			} else {
				this.on("spawned", callback, context);
			}
			return this;
		}
	}

	// 🍂factory gridLayer.googleMutant(options)
	// Returns a new `GridLayer.GoogleMutant` given its options
	if (L && L.gridLayer) {
		L.gridLayer.googleMutant = function (options) {
			return new L.GridLayer.GoogleMutant(options);
		};
	}

	return GoogleMutant;
})(L);
//# sourceMappingURL=Leaflet.GoogleMutant.js.map

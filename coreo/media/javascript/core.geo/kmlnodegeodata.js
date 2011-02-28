/**
 * Class: KmlNodeGeoData
 * 
 * GeoData implementation for nodes in a KML document.
 * 
 * Unique IDs are assigned to KML element children when they are read the 
 * first time. This ID is specific to KmlNodeGeoData and not associated 
 * with the true XML element ID or the KML feature ID. The reason for this is 
 * that some KML elements might already have other IDs assigned to them, and 
 * we cannot guarantee that another KML document won't be loaded in the future
 * with KML IDs that already exist.
 * 
 * SuperClass:
 *  <GeoData>
 *  
 * Dependencies:
 *  - jQuery
 *  - core.geo.GeoData
 *  - core.util.KmlUtils
 *  - core.util.XmlUtils
 *  - core.geo.GeoDataStore
 *  - core.util.CallbackUtils
 *  - core.util.Assert
 */
if (!window.core)
	window.core = {};
if (!window.core.geo)
	window.core.geo = {};

(function($, ns) {
	var GeoData = core.geo.GeoData;
	var KmlUtils = core.util.KmlUtils;
	var XmlUtils = core.util.XmlUtils;
	var GeoDataStore = core.geo.GeoDataStore;
	var CallbackUtils = core.util.CallbackUtils;
	var Assert = core.util.Assert;

	var KmlNodeGeoData = function(id, node, nsPrefix) {
		GeoData.call(this, id);
		this.node = node;
		this.nsPrefix = nsPrefix;
	};

	KmlNodeGeoData.fromKmlDoc = function(kmlDoc) {
		var root = kmlDoc.documentElement;
		var nsPrefix = XmlUtils.declareNamespace(root, KmlNodeGeoData.NS_URI);
		var kmlNodeGeoData = new KmlNodeGeoData(null, root, nsPrefix);
		GeoDataStore.persist(kmlNodeGeoData);
		return kmlNodeGeoData;
	};

	KmlNodeGeoData.fromKmlString = function(kmlString) {
		var kmlDoc = XmlUtils.createXmlDoc(kmlString);
		return KmlNodeGeoData.fromKmlDoc(kmlDoc);
	};

	KmlNodeGeoData.NS_URI = "urn:core:geo:KmlNodeGeoData";

	KmlNodeGeoData.getIdFromElement = function(element, nsPrefix) {
		XmlUtils.assertElement(element);
		if (nsPrefix != null && nsPrefix != undefined) {
			var id = $(element).attr(nsPrefix + ":id");
			if (id != undefined)
				return id;
		}
		return null;
	};
	
	KmlNodeGeoData.setIdOnElement = function(element, id, nsPrefix) {
		XmlUtils.assertElement(element);
		if (id == null || id == undefined) {
			$(element).removeAttr(nsPrefix + ":id");
		}
		else {
			$(element).attr(nsPrefix + ":id", "" + id);			
		}
	};
	
	/**
	 * Finds a child KML element with an ID. The ID in this context is the 
	 * KmlNodeGeoData ID, not the true XML element ID nor the KML 
	 * feature ID.
	 */
	KmlNodeGeoData.getChildElementById = function(element, id, nsPrefix) {
		XmlUtils.assertElement(element);
		if (id && id != null) {
			Assert.type(id, "string");
			if ($.trim(id).length > 0) {
				var children = $(element).find(KmlUtils.KML_FEATURE_ELEMENTS.join("[" + nsPrefix + "\\:id='" + id + "'],") 
						+ "[" + nsPrefix + "\\:id='" + id + "']");
				return children.length > 0 ? children[0] : null;
			}
		}
		return null;
	};
	
	$.extend(KmlNodeGeoData.prototype, GeoData.prototype, {
		
		getParent: function() {
			var parentNode = KmlUtils.findNextKmlElementParent(this.node);
			if (parentNode != null) {
				var parentId = KmlNodeGeoData.getIdFromElement(parentNode, this.nsPrefix);
				var parent = new KmlNodeGeoData(parentId, parentNode, this.nsPrefix);
				return parent;
			}
			else {
				// this is the root
				return null;
			}
		},
		
		iterateChildren: function(callback) {
			var nsPrefix = this.nsPrefix;
			KmlUtils.iterateChildKmlElements(this.node, function(child) {
				var id = KmlNodeGeoData.getIdFromElement(child, nsPrefix);
				var childFeature = new KmlNodeGeoData(id, child, nsPrefix);
				GeoDataStore.persist(childFeature);
				CallbackUtils.invokeCallback(callback, childFeature);
			});
		},
		
		getChildById: function(id) {
			var el = KmlNodeGeoData.getChildElementById(this.node, id, this.nsPrefix);
			if (el && el != null) {
				return new KmlNodeGeoData(id, el, this.nsPrefix);
			}
			return null;
		},
		
		getKmlString: function() {
			return XmlUtils.getXmlString(this.node);
		},
		
		/**
		 * Invoked by GeoDataStore after the ID is set
		 */
		postSave: function() {
			KmlNodeGeoData.setIdOnElement(this.node, this.id, this.nsPrefix);
		}
	});
	ns.KmlNodeGeoData = KmlNodeGeoData;
})(jQuery, window.core.geo);
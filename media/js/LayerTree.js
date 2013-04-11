/*
 * Copyright (C) 2007  Camptocamp
 *
 * This file is part of MapFish
 *
 * MapFish is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MapFish is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with MapFish.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @requires OpenLayers/Map.js
 * @requires OpenLayers/Layer/WMS.js
 * @requires OpenLayers/Layer/WMS/Untiled.js
 */
Ext.namespace('mapfish.widgets');
debugger;
mapfish.widgets.LayerTree = function (config) {
    Ext.apply(this, config);
    mapfish.widgets.LayerTree.superclass.constructor.call(this);
};

Ext.extend(mapfish.widgets.LayerTree, Ext.tree.TreePanel, {

    rootVisible: false,
    animate: true,
    autoScroll: true,
    loader: new Ext.tree.TreeLoader({}),
    enableDD: false,
    containerScroll: true,
    ascending: true,

    // set to false automatically if a model is given. Should not be manually overriden
    _automaticModel: true,

    /**
     * Method: hasCheckbox
     * Returns whether a Node has a checkbox attached to it
     *
     * Parameters:
     * node - {Ext.data.Node} node to query
     *
     * Returns:
     * {Boolean} True if the node has a checkbox
     */
    hasCheckbox: function (node) {
        return typeof (node.attributes.checked) == "boolean";
    },

    /**
     * Method: setNodeChecked
     * Sets the checked status on a node
     *
     * Parameters:
     * node - {Ext.data.Node} node to set the checked status
     * checked - {Boolean} checked status to set
     */
    setNodeChecked: function (node, checked) {
        if (!this.hasCheckbox(node)) return;

        node.attributes.checked = checked;

        if (node.ui && node.ui.checkbox) node.ui.checkbox.checked = checked;
    },

    getLayerFromNode: function (node) {
        var returnLayer = null;
        var layerName = "";
        if (node.attributes.layerName) {
            layerName = node.attributes.layerName;
        } else if (node.attributes.text) {
            layerName = node.attributes.text;
        }
        if (layerName.indexOf("!") != -1) {
            layerName = layerName.split("!")[1];
        }
        Ext.each(this.map.layers, function (layer) {
            if (layerName == layer.name) {
                returnLayer = layer;
            }
            if (!layer._origLayers) {
                if (layer.params && layer.params.LAYERS) {
                    layer._origLayers = layer.params.LAYERS;
                }
            }
            var sublayers = layer._origLayers;

            if (sublayers instanceof Array) {
                for (var j = 0; j < sublayers.length; j++) {
                    var sublayer = sublayers[j];
                    if (layerName == sublayer) {
                        returnLayer = layer;
                    }
                }
            }
        }, this);
        return returnLayer;
    },

    _updateCheckboxAncestors: function () {

        // Map of all the node ids not yet visited by updateNodeCheckbox
        var unvisitedNodeIds = {};
        var tree = this;

        //
        // This function updates the node checkbox according to the status of
        // the descendants. It must be called on a node checkbox nodes only.
        //
        // It is called recursively and returns a boolean:
        // - If the node has no children checkboxes, the status of the checkbox
        //   is returned
        // - Otherwise, it returns true if all the children witch checkbox are
        //   checked or false in the other case.
        //
        // As a side effect, it will update the checkbox state of the node, and
        //  remove visited node ids from the unvisitedNodeIds variable, to
        //  prevent visiting nodes multiple times.
        function updateNodeCheckbox(node) {
            if (!tree.hasCheckbox(node)) {
                throw new Error(arguments.callee.name + " should only be called on checkbox nodes");
            }

            var checkboxChildren = [];
            node.eachChild(function (child) {
                if (tree.hasCheckbox(child)) checkboxChildren.push(child);
            }, this);

            // If this node has no children with checkbox, its checked state
            // will be returned.
            if (checkboxChildren.length == 0) {
                return node.attributes.checked;
            }

            var allChecked = true;
            Ext.each(checkboxChildren, function (child) {
                if (!updateNodeCheckbox(child)) {
                    allChecked = false;
                    return false;
                }
            }, this);

            tree.setNodeChecked(node, allChecked);
            delete unvisitedNodeIds[node.id];

            return allChecked;
        }

        var checkboxNodes = [];

        this.getRootNode().cascade(function (node) {
            if (this.hasCheckbox(node)) {
                checkboxNodes.push(node);
                unvisitedNodeIds[node.id] = true;
            }
        }, this);

        // taking node from the tree order (using shift) should be more efficient
        var node;
        while (node = checkboxNodes.shift()) {
            if (unvisitedNodeIds[node.id]) updateNodeCheckbox(node);
        }
    },

    _handleModelChange: function LT__handleModelChange(clickedNode, checked) {

        // Tree can be modified in two situations:
        //
        // 1) The user clicks on a checkbox
        // 2) The user drags a node to another location
        //
        // Situation 1) could modify the descendants and ancestors of the checkbox clicked
        // Situation 2) could only modify ancestors of the moved node and of the ancestors
        //  of the previous node location.
        //
        // Descendants updating is done below
        //
        // Ancestors updating is done in the _updateCheckboxAncestors() method.
        if (clickedNode) {
            clickedNode.cascade(function (node) {
                this.setNodeChecked(node, checked);
            }, this);
        }

        this._updateCheckboxAncestors();

        if (!this.map) {
            return;
        }

        // Some of these variables are used in the functions declared below.
        // The documentation mentions which variables are accessed if not
        // given through parameters.
        var currentBaseLayerName;
        if (this.map.baseLayer) currentBaseLayerName = this.map.baseLayer.name;

        var layerNameToLayer = {};
        var baseLayerNames = [];
        var layersWithSublayers = {};

        var layerToNodeIds = {};
        // We can't use this.getNodeById here because it only contains nodes
        // which have been generated in the DOM, and we can get called before
        // the DOM is generated. This variable is used to do the mapping ourself
        var nodeIdToNode = {};
        var clickedBaseLayer;

        // TODO: maybe cache the layersWithSublayers object
        this.getRootNode().cascade(function (node) {
            if (!node.attributes.layerNames) return true;
            var layerNames = node.attributes.layerNames;

            for (var i = 0; i < layerNames.length; i++) {
                if (layerNames[i].indexOf("!") != -1) {
                    var name = layerNames[i].split("!")[0];
                    layersWithSublayers[name] = true;
                }
            }
        }, this);


        /**
         * This function reads the visibility of the layers in the map, and returns
         * an {Object} which is mapping between {String} layer names and {Boolean}
         * visibility status of the named layer.
         *
         * Sublayers are included in the list using the
         * <WMS layername:sublayer name> convention.
         *
         * Side effects: populates the variables:
         * - layerNameToLayer
         * - baseLayerNames

         * Parameters:
         * layersWithSublayers - {Object} Map of layer name to boolean. Contains
         *      as keys the name of layers which are using sublayers
         *
         * Returns:
         * {Object} layerVisibility map
         */
        function getVisibilityFromMap(layersWithSublayers) {

            var layerVisibility = {};

            Ext.each(this.map.layers, function (layer) {
                var name = layer.name;
                layerNameToLayer[name] = layer;

                layerVisibility[name] = layer.visibility;

                if (layer.isBaseLayer) baseLayerNames.push(name);

                // LSG WMS.Untiled is deprecated so this part removed from if expression && !(layer instanceof OpenLayers.Layer.WMS.Untiled)
                if (!(layer instanceof OpenLayers.Layer.WMS) ) {
                    return;
                }

                if (!layersWithSublayers[layer.name]) return;

                // FIXME: base layers and WMS do not play well for now...
                if (layer.isBaseLayer) {
                    OpenLayers.Console.error("Using sublayers on a base layer " + "is not supported (base layer is " + name + ")");
                }

                // Save the original set of sublayers in a property on the
                // layer object. The layer ordering is kept if drag and drop
                // is not used (this is implemented in updateMapFromVisibility()
                // below.
                if (!layer._origLayers) {
                    layer._origLayers = layer.params.LAYERS;
                }
                var sublayers = layer._origLayers;

                if (sublayers instanceof Array) {
                    for (var j = 0; j < sublayers.length; j++) {
                        var sublayer = sublayers[j];
                        layerVisibility[name + "!" + sublayer] = layer.visibility;
                    }
                }
            }, this);

            return layerVisibility;
        }

        /**
         * Walks the tree and updates the given layerVisibility object
         *
         * Side effects: populates the variables:
         * - layerToNodeIds
         * - nodeIdToNode
         * - clickedBaseLayer
         *
         * Parameters:
         * layerVisibility - {Object} Map of layer name to {Boolean}
         *
         * Returns:
         * {Object} updated layerVisibility map
         */
        function updateVisibilityFromTree(layerVisibility) {

            // Clicked node takes precedence for setting state. This map contains
            // as keys the layername that were clicked (so that we do not override
            // them with non clicked nodes).
            var forcedVisibility = {};

            this.getRootNode().cascade(function (node) {
                var checked = node.attributes.checked;

                var layerNames = node.attributes.layerNames;
                if (!layerNames) return;

                for (var i = 0; i < layerNames.length; i++) {
                    var layerName = layerNames[i];
                    if (!layerName) continue;

                    if (!layerToNodeIds[layerName]) layerToNodeIds[layerName] = [];
                    layerToNodeIds[layerName].push(node.id);
                    nodeIdToNode[node.id] = node;

                    if (typeof (layerVisibility[layerName]) === 'undefined') OpenLayers.Console.error("Invalid layer: ", layerName);

                    if (forcedVisibility[layerName]) continue;
                    if (node == clickedNode) {
                        if (baseLayerNames.indexOf(layerName) != -1) {
                            clickedBaseLayer = layerName;
                        }
                        forcedVisibility[layerName] = true;
                    }
                    layerVisibility[layerName] = checked;

                }
            }, this);

            return layerVisibility;
        }

        /**
         * Ensure only one baseLayer is visible.
         *
         * Parameters:
         * layerVisibility - {Object} Map of layer name to {Boolean}
         * clickedBaseLayer - {String} name of the base layer that was clicked.
         *                    can be null/undefined
         * currentBaseLayerName - {String} name of the selected base layer
         * baseLayerNames - {Array(String)} list of base layers
         *
         * Returns:
         * {Object} updated layerVisibility map
         */
        function applyBaseLayerRestriction(layerVisibility, clickedBaseLayer, currentBaseLayerName, baseLayerNames) {

            var numBaseLayer = 0;
            for (var i = 0; i < baseLayerNames.length; i++) {
                if (layerVisibility[baseLayerNames[i]]) numBaseLayer++;
            }

            if (numBaseLayer == 1) return layerVisibility;

            // Here we have 0 or more that 1 active base layer. We need to
            // change that situation. The strategy is to clear all, and only
            // select one afterwards.
            for (var i = 0; i < baseLayerNames.length; i++) {
                layerVisibility[baseLayerNames[i]] = false;
            }

            // Higher priority: if a baseLayer was clicked the user intended to
            // select it, so we make sure this is the one active. This will do
            // nothing if the user clicked on an already active base layer.
            if (clickedBaseLayer) {
                layerVisibility[clickedBaseLayer] = true;
                return layerVisibility;
            }

            // Otherwise, restore the initial selected base layer
            if (!currentBaseLayerName) return layerVisibility;

            layerVisibility[currentBaseLayerName] = true;
            return layerVisibility;
        }

        /**
         * Updates the tree from the given layerVisibility object.
         *
         * Parameters:
         * layerVisibility - {Object} Map of layer name to {Boolean}
         * layerToNodeIds - {Object} Map of {String} layer name to {String}
         *                  node identifiers.
         * nodeIdToNode - {Object} Map of {String} node identifiers to
         *                {Ext.data.Node} nodes.
         */
        function updateTreeFromVisibility(layerVisibility, layerToNodeIds, nodeIdToNode) {
            var layerName;
            for (layerName in layerVisibility) {

                var nodeIds = layerToNodeIds[layerName];
                if (!nodeIds) continue;
                for (var i = 0; i < nodeIds.length; i++) {

                    var node = nodeIdToNode[nodeIds[i]];
                    if (!node) continue;

                    // only check a node if all the mapped layers are visible
                    var layerNames = node.attributes.layerNames;
                    if (!layerNames) {
                        OpenLayers.Console.error("unexpected state");
                        continue;
                    }

                    var allChecked = true;
                    for (var j = 0; j < layerNames.length; j++) {
                        layerName = layerNames[j];
                        if (!layerName) continue;
                        if (!layerVisibility[layerName]) {
                            allChecked = false;
                            break;
                        }
                    }
                    this.setNodeChecked(node, allChecked);
                }
            }
        }

        /**
         * Updates the map layers from the given visibility variable.
         *
         * Parameters:
         * layerVisibility - {Object} Map of layer name to {Boolean}
         * layerNameToLayer - {Object} Map of layer name to {<OpenLayers.Layer>}
         * layersWithSublayers - {Object} Map of layer name to boolean. Contains
         *      as keys the name of layers which have sublayers
         * baseLayerNames - {Array(String)} list of base layers
         */

        function updateMapFromVisibility(layerVisibility, layerNameToLayer, layersWithSublayers, baseLayerNames) {

            // open the Legend window at the top right corner of the map
            AMNDSS.LegendWindow.draw();
            // init vars
            var wmsLayers = {};
            var iconUrl;
            var layerName;
            var layer;
            var layerSpanID;
            var layerSpan;
            var sublayers;

            for (layerName in layerVisibility) {

                var visible = layerVisibility[layerName];
                var splitName = layerName.split("!");
                if (splitName.length != 2) continue;

                delete layerVisibility[layerName];

                layerName = splitName[0];
                layer = layerNameToLayer[layerName];
                sublayerName = splitName[1];

                if (!wmsLayers[layerName]) {
                    wmsLayers[layerName] = [];
                }

                layerSpanID = this.convertToId(sublayerName);
                layerSpan = document.getElementById(layerSpanID);

                if (visible) {


                    // don't show icon for the base layer
                    if (!layer.hide_in_legend) {
                        // add the icon to the layer control when the layer is turned on
                        iconUrl = this.layerNameToUrl[sublayerName];
                        if (iconUrl.indexOf("'") > -1) {
                            // then there is a single quote in the url such as "Lil'wat",
                            // replace it with the html escape code for it (in this case &#39;)  
                            iconUrl = iconUrl.replace("'", '&#39;');
                        }
                        layerSpan.innerHTML = "<br/><img src='" + iconUrl + "' class='cf-wms-image'/>";

                        // add this layer to the legend window
                        AMNDSS.LegendWindow.update(this.layerNameToUrl[sublayerName], layer, sublayerName);
                    } else {
                        if (layerSpan) layerSpan.innerHTML = " <i>(no legend)</i>";
                    }

                    wmsLayers[layerName].push(sublayerName);

                } else if (layerSpan) {
                    // clear the icon from the layer control when the layer is turned off
                    layerSpan.innerHTML = "";
                }
            }

            // Remove WMS layers from layerVisibility, they are handled separately.
            for (layerName in wmsLayers) {
                if (layerVisibility[layerName] !== undefined) {
                    delete layerVisibility[layerName];
                }
            }

            for (layerName in layerVisibility) {
                layer = layerNameToLayer[layerName];

                if (!layer) {
                    OpenLayers.Console.error("Non existing layer name", layerName);
                    continue;
                }

                if (baseLayerNames.indexOf(layerName) != -1) {
                    if (layerVisibility[layerName]) {
                        this.map.setBaseLayer(layer);
                    }
                } else {
                    layer.setVisibility(layerVisibility[layerName]);
                    if (layer.params) {
                        layerSpanID = this.convertToId(layerName);
                        layerSpan = document.getElementById(layerSpanID);
                        if (layer.getVisibility()) {

                            // don't show icon for the base layer
                            if (!layer.hide_in_legend) {
                                // add the icon to the layer control when the layer is turned on
                                iconUrl = this.layerNameToUrl[layerName];
                                if (iconUrl.indexOf("'") > -1) {
                                    // then there is a single quote in the url such as "Lil'wat",
                                    // replace it with the html escape code for it (in this case &#39;)  
                                    iconUrl = iconUrl.replace("'", '&#39;');
                                }
                                layerSpan.innerHTML = "<br/><img src='" + iconUrl + "' class='cf-wms-image'/>";

                                // add this layer to the legend window
                                AMNDSS.LegendWindow.update(this.layerNameToUrl[layerName], layer, layerName);
                            } else {
                                layerSpan.innerHTML = " <i>(no legend)</i>";
                            }

                        } else if (layerSpan) {
                            // clear the icon from the layer control when the layer is turned off
                            layerSpan.innerHTML = "";
                        }
                    }
                }
            }

            for (layerName in wmsLayers) {
                layer = layerNameToLayer[layerName];
                sublayers = wmsLayers[layerName];

                if (layer.isBaseLayer) {
                    OpenLayers.Console.error("base layer for WMS sublayer are not supported");
                    return;
                }
                if (sublayers.length == 0) {
                    layer.setVisibility(false); // was false, true
                } else {
                    // If drag and drop is not active, we try to preserve the
                    //  sublayer order from the one set during layer construction.
                    //  We stick a property on the layer object to remember the
                    //  the original ordering.
                    if (!this.enableDD) {

                        if (!layer._origLayers) {
                            OpenLayers.Console.error("Assertion failure");
                        }
                        var origLayers = layer._origLayers;
                        var orderedLayers = [];

                        for (var i = 0; i < origLayers.length; i++) {
                            var l = origLayers[i];
                            if (sublayers.indexOf(l) != -1) orderedLayers.push(l);
                        }
                        sublayers = orderedLayers;
                    }

                    layer.params.LAYERS = sublayers;
                    layer.redraw();
                    layer.setVisibility(true); // was true, true
                }
            }
        }

        // Definition:
        // A sublayer is a selectable layer inside a WMS layer.
        var layerVisibility = getVisibilityFromMap.call(this, layersWithSublayers);

        layerVisibility = updateVisibilityFromTree.call(this, layerVisibility);

        applyBaseLayerRestriction.call(this, layerVisibility, clickedBaseLayer, currentBaseLayerName, baseLayerNames);

        updateTreeFromVisibility.call(this, layerVisibility, layerToNodeIds, nodeIdToNode);

        updateMapFromVisibility.call(this, layerVisibility, layerNameToLayer, layersWithSublayers, baseLayerNames);
    },

    _extractOLModel: function LT__extractOLModel() {
        var getLegendParams = {
            service: "WMS",
            version: "1.1.1",
            request: "GetLegendGraphic",
            exceptions: "application/vnd.ogc.se_inimage",
            format: "image/png"
        };

        // TODO: how to deal with baseLayers?
        var layers = [];

        var layersArray = this.map.layers.slice();

        if (!this.ascending) {
            layersArray.reverse();
        }
        for (var i = 0; i < layersArray.length; i++) {
            var l = layersArray[i];
            var wmsChildren = [];

            // LSG WMS.Untiled is deprecated so remvoed from expression || l instanceof OpenLayers.Layer.WMS.Untiled
            if (l instanceof OpenLayers.Layer.WMS ) {

                var sublayers = l.params.LAYERS;
                var iconUrl;

                // Handle layers contained within folders.
                if (sublayers instanceof Array) {
                    for (var j = 0; j < sublayers.length; j++) {

                        var currentLayerName = sublayers[j];

                        if (this.showWmsLegend) {
                            var params = OpenLayers.Util.extend({
                                LAYER: currentLayerName
                            }, getLegendParams);
                            var paramsString = OpenLayers.Util.getParameterString(params);

                            iconUrl = l.url + paramsString;

                            // for the getlegendgraphic call to work for private local layers, 
                            // we need to replace the django call in the url with a reference
                            // to the cgi script
                            if (l.url.indexOf('wms_layers/private') > -1) {
                                l.is_private = true; // set the flag for amndsslegendwindow.js
                                iconUrl = iconUrl.replace('wms_layers/private/', 'cgi-bin/amndss.cgi');
                            }

                            // save cache of this url for use in the legend window
                            this.layerNameToUrl[currentLayerName] = iconUrl;
                        }

                        // TODO: i18n
                        // we're now adding the full image to the tree node, 
                        // and style it based on a style class in amndss.css
                        wmsChildren.push({
                            text: currentLayerName + "<span id=" + this.convertToId(currentLayerName) + "></span>",
                            checked: l.getVisibility(),
                            layerName: l.name + "!" + currentLayerName,
                            children: [],
                            cls: "cf-wms-node"
                        });
                    }
                } else { // layers not contained in folders, always external...
                    var params = OpenLayers.Util.extend({
                        LAYER: '' + sublayers
                    }, getLegendParams);

                    // l.is_private is always undefined (and thus false)
                    // for these layers since they're public
                    var paramsString = OpenLayers.Util.getParameterString(params);

                    iconUrl = l.url + paramsString;

                    // save cache of the url for use in the legend window
                    this.layerNameToUrl[l.name] = iconUrl;
                }
                // initially sync the check box state with sublayer 
                // parameters (visibility of sublayers)
                if (wmsChildren.length > 1) l.params.LAYERS = [];
            }

            // We hide the layers using css instead of removing them from the
            // model, so that their position is remembered when drag and drop is used
            var className = 'cf-wms-parent';
            if (!l.displayInLayerSwitcher) {
                className = 'cf-wms-parent x-hidden';
            }

            // don't show the checkbox for parent nodes, thus disabling
            // functionality to turn on/off ALL layers as it slows performance
            if (wmsChildren.length > 0) {
                className += ' cf-wms-disable-checkbox';
            }

            layers.push({
                text: l.name + "<span id=" + this.convertToId(l.name) + "></span>",
                // TODO: i18n
                checked: l.getVisibility(),
                cls: className,
                layerName: (wmsChildren.length > 0 ? null : l.name),
                children: wmsChildren
            });
        }
        return layers;
    },

    // XXX maybe merge/refactor with _handleModelChange
    _updateOrder: function () {

        var layerNameToLayer = {};
        Ext.each(this.map.layers, function (layer) {
            layerNameToLayer[layer.name] = layer;
        });

        // TODO: handle WMS sublayers correctly
        //var wmsLayers = {};
        // DESIGN CHOICE:
        // Layers available on map but not on model will be put in the
        // bottom (beginning of map.layers array)
        function layerIndex(layers, name) {
            for (var i = 0; i < layers.length; i++) {
                var l = layers[i];
                if (l.name == name) return i;
            }
            return -1;
        }

        var orderedLayers = this.map.layers.slice();
        var seenLayers = {};

        var nodes = [];
        this.getRootNode().cascade(function (node) {
            if (this.ascending) nodes.push(node);
            else nodes.unshift(node);
        }, this);

        Ext.each(nodes, function (node) {
            var nodeLayerName = node.attributes.layerName;

            if (!nodeLayerName) return;

            var layerName = nodeLayerName;

            var wmsParts = nodeLayerName.split("!");
            if (wmsParts.length == 2) {
                layerName = wmsParts[0];
            }

            if (seenLayers[layerName]) return;
            seenLayers[layerName] = true;

            var index = layerIndex(orderedLayers, layerName);
            if (index == -1 || !layerNameToLayer[layerName]) {
                throw new Error("Layer " + layerName + " not available");
            }

            orderedLayers.splice(index, 1);
            orderedLayers.push(layerNameToLayer[layerName]);
        });

        this._updateCheckboxAncestors();

        this.map.layers = orderedLayers;

        for (var i = 0; i < this.map.layers.length; i++) {
            this.map.setLayerZIndex(this.map.layers[i], i);
        }
    },

    initComponent: function () {

        this.layerNameToUrl = {};

        mapfish.widgets.LayerTree.superclass.initComponent.call(this);

        this.addListener("checkchange", function checkChange(node, checked) {
            this._handleModelChange(node, checked);
        }, this);


        if (!this.model) {
            this._automaticModel = true;
            this.model = this._extractOLModel();
        }

        var root = {
            text: 'Root',
            draggable: false,
            // disable root node dragging
            id: 'source',
            children: this.model,
            leaf: false
        };

        // Pre-build the tree so that non-expanded nodes exist in the model.
        function buildTree(attributes) {
            var node = new Ext.tree.TreeNode(attributes);

            var cs = attributes.children;
            node.leaf = !cs;
            if (!cs) return node;

            for (var i = 0; i < cs.length; i++) {
                // XXX This index is sometimes undefined on IE for unknown reason
                if (!cs[i]) {
                    continue;
                }
                node.appendChild(buildTree(cs[i]));
            }
            return node;
        }

        // Canonicalize the model (for instance, convert layerName to layerNames properties)
        function fixupModel(rootNode) {
            rootNode.cascade(function (node) {
                var attrs = node.attributes;
                if (!attrs.layerNames && attrs.layerName) {
                    attrs.layerNames = [attrs.layerName];
                }
            }, this);
            return rootNode;
        }

        var rootNode = buildTree(root);
        rootNode = fixupModel(rootNode);

        this.setRootNode(rootNode);

        this.addListener("dragdrop", function () {
            this._updateOrder(arguments);
        }, this);

        // Synchronize the OL layer state if a usermodel is supplied
        // This means that the layers checked state defined in the model takes
        // precedence over the OL layer state
        // FIXME: is this still needed in any case if we want the state of a WMS
        //  layer / sublayers to be updated?
        if (this._automaticModel) {
            this._handleModelChange(null, null);
            if (this.enableDD) this._updateOrder();
        }
    },

    // private
    onRender: function (container, position) {
        if (!this.el) {
            this.el = document.createElement('div');
        }
        mapfish.widgets.LayerTree.superclass.onRender.apply(this, arguments);
    },

    convertToId: function (string) {
        return string.replace(/['\s\(\)]/g, "");
    }
});
Ext.reg('layertree', mapfish.widgets.LayerTree);

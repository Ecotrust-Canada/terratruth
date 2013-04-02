/*
 * This file was originally part of MapFish
 *
 * Copyright (C) 2007  Camptocamp
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

AMNDSS.OLMapComponent = function(config) {
    Ext.apply(this, config);
    this.contentEl=this.map.div;
    var content = Ext.get(this.contentEl); 
    content.setStyle('width', '100%'); 
    content.setStyle('height', '100%'); 
    AMNDSS.OLMapComponent.superclass.constructor.call(this);
};

Ext.extend(AMNDSS.OLMapComponent, Ext.Panel, {
    /**
     * The map to display.
     * {OpenLayers.Map}
     */
    map: null,

    initComponent: function() {
        AMNDSS.OLMapComponent.superclass.initComponent.apply(this, arguments);
        this.on("bodyresize", this.map.updateSize, this.map);
    }
});
Ext.reg('olmapcomponent', AMNDSS.OLMapComponent);

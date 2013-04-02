AMNDSS.LegendWindow = function () {
    var obj = {

        _init: function () {

        },
        
        draw: function () {
            if (!this.windowInstance) {
                // get a handle to the map element
                var map_element = document.getElementById("map").parentNode;

                // define body of legend window              
                this.content = new Ext.Panel({
                    autoTabs: true,
                    activeTab: 0,
                    deferredRender: false,
                    border: false
                });

                // format the window, give it a title, etc
                this.windowInstance = new Ext.Window({
                    title: 'Legend',
                    layout: 'fit',
                    width: 200,
                    height: 200,
                    autoscroll: true,
                    minimizable: true,
                    closable: false, // don't let them close it
                    x: map_element.offsetWidth - 200,
                    y: 0,
                    items: this.content
                });

                this.windowInstance.render(map_element);
                this.windowInstance.show();
                this.windowInstance.on("minimize", function () {
                    this.toggleCollapse();
                },
                this.windowInstance);
                this.legend_body = this.content.body.dom;
                this.legend_body.style.overflow = "auto";

            } else {
                // clean up / initialize
                this.legend_body.innerHTML = "";
                this.private_title_drawn = false;
                this.public_title_drawn = false;
            }
        },

        // this function is called from LayerTree.js and takes
        // the url of the getlegendgraphic, the layer object and layer name
        update: function (url, layer, layer_name) {

            // bail for the base layer
            if (layer.hide_in_legend) return; 

            var title;
            var layer_name_header;

            if (layer.is_private) { // we're updating a locally served layer...
                if (!this.private_title_drawn) { // the title hasn't been drawn before...
                  title = document.createElement("h2");
                  title.className = "legend-title";
                  title.innerHTML = "Private Local Layers";
                  this.legend_body.appendChild(title);
                  this.private_title_drawn = true;
                }
            } else { // otherwise it's an external layer, add the appropriate title... 
                if (!this.public_title_drawn) { // if we haven't already... 
                  title = document.createElement("h2");
                  title.className = "legend-title";
                  title.innerHTML = "Public External Layers";
                  this.legend_body.appendChild(title);
                  this.public_title_drawn = true;
                }
            }
            
            // get a handle to the getlegendgraphic url                  
            var image = new Image();
            image.src = url;
            // make it nice and pretty as defined in amndss.css
            image.className = "legend-image";
            // create the nice layer name styled in amndss.css  
            layer_name_header = document.createElement("p");
            layer_name_header.className = "layer_name_header";
            layer_name_header.innerHTML = layer_name;
            // and now add the layer name and then the legend graphic      
            this.legend_body.appendChild(layer_name_header);
            this.legend_body.appendChild(image);
        }
    };
    obj._init();
    return obj;
} ();

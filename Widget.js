///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 MAGIS. All Rights Reserved.
//
// Licensed under the GPL licence Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://github.com/magis-nc/esri-webappbuilder-widget-url/blob/master/LICENSE
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

/**
*    This widget for ESRI WebApp Builder deals with...
*/
define([
    'dojo/_base/declare',
    'jimu/BaseWidget',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/aspect',
	'dojo/query'
  ],
    function (
        declare,
        BaseWidget,
        on,
        lang,
        aspect,
		query
    ) {
        var clazz = declare([BaseWidget], {
            name: 'ePopup',
            baseClass: 'jimu-widget-epopup',

            /**
             *  On startup
             */
            startup: function () {
                this.afterGetAttachments = lang.hitch(this, this.afterGetAttachments);
                this.onAttachementsResult = lang.hitch(this, this.onAttachementsResult);

                this.map.infoWindow.on("set-features", lang.hitch(this, this.onSetFeatures));
                this.map.infoWindow.on("show", lang.hitch(this, this.setSizeAndPlacement));
				
                this.layers = {};

                this.theme = (this.config.attachments && this.config.attachments.theme) ? this.config.attachments.theme : "default";
                this.maxImgSize = (this.config.attachments && this.config.attachments.maxImgSize) ? this.config.attachments.maxImgSize : 1024*1024 ;
            },
            
			_getPopupRenderers:function(){
				var popups = dojo.query(".esriViewPopup");
				var renderers = [];
				for(var i=0,nb=popups.length;i<nb;i++){
					var popup = popups[i];
					var id = popup.id || popup.widgetid;
					var popupRenderer = dijit.byId(id);
					if(!popupRenderer){
						continue;					
					}
					renderers.push(popupRenderer);
					if(!this._nls){
						this._nls = popupRenderer._nls;
						console.log("popupRenderer NLS", this._nls);
					}	
				}

				return renderers;
				
			},
			
            onAttachementsResult:function(attachments){
				//get attachments zones (can be multiple because of mobile/non-mobile view)
				var popupRenderers = this._getPopupRenderers();
				if(!popupRenderers)
					return;
				
				//Prepare attachments content
                if(attachments.length > 0){
                    var html = '';
                    for(var i=0,nb=attachments.length;i<nb;i++){
                        html += this._getLi(attachments[i]);
                    }
					
                }
                else{
                    html = '<li>'+ this._nls.NLS_noAttach +'</li>';
                }
				
				//Setup attachments content
				for(var i=0,nb=popupRenderers.length;i<nb;i++){
					var attach_ul = popupRenderers[i]._attachmentsList;
					attach_ul.innerHTML = html;
                    attach_ul.className = 'widget-epopup-' + this.theme;
					if(this.config.attachments.hide.sectionTitle){
						attach_ul.parentNode.childNodes[0].style.display = 'none';
					}
					if(this.config.attachments.hide.noAttachments && !attachments.length){
						attach_ul.parentNode.style.display = 'none';
					}
					else{
						attach_ul.parentNode.className = attach_ul.parentNode.className.replace(" hidden", "");
					}
				}
            },

            _getHumanSize:function(size){
                var unity = "o";
                var unities = ["ko", "mo", "go", "to"];
                for(var i = 0, nb=unities.length;i<nb;i++){
                    if(size < 1024)
                        break;
                    unity = unities[i];
                    size = size / 1024;
                }
                return (Math.round(size*100)/100) + ' ' + unity;
            },

            _getIcon:function(attachment, noImage){
				var ext = attachment.name.split(".").slice(-1)[0].toLowerCase();
				var contentType = attachment.contentType.split("/");
				
                if(!noImage && contentType[0] == "image" && attachment.size <= this.maxImgSize){
                    return '<img src="'+attachment.url+'" />';
                }
                
                if(this.config.icons && this.config.icons.indexOf(ext) > -1){
					return '<img src="'+this.folderUrl +'/images/extensions/'+ext+'.png" />';
				}
                    
                return '<img src="'+this.folderUrl +'/images/apps/_blank.png" />';
            },

            _getLi:function(attachment){
                var title = attachment.name + ' ('+this._getHumanSize(attachment.size)+')';
                switch(this.theme){
                    case "icon":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a title="'+title+'" target="_blank" href="'+attachment.url+'">'
                            + img + title
                            +'</a></li>';

                    case "thumb":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a title="'+title+'" target="_blank" href="'+attachment.url+'">'
                            + img
                            +'</a></li>';
							
					case "large":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a title="'+title+'" target="_blank" href="'+attachment.url+'">'
                            + img
                            +'</a></li>';

                    default:
                        return '<li title="'+title+'"><a title="'+title+'" target="_blank" href="'+attachment.url+'">'+title+'</a></li>';
                }
            },

            afterGetAttachments:function(defered){
				var popupRenderers = this._getPopupRenderers();
				for(var i=0,nb=popupRenderers.length;i<nb;i++){
					var attach_ul = popupRenderers[i]._attachmentsList;
					attach_ul.parentNode.childNodes[0].style.display = 'block';
					attach_ul.parentNode.style.display = 'block';
					attach_ul.innerHTML = this._nls.NLS_searching;
				}
				
                defered.then(this.onAttachementsResult);
            },
            
            onSetFeatures: function (evt) {               
                //Get layers and track infoTemplate getAttachments
                for(var i=0, nb=evt.target.features.length;i<nb;i++){
                    var layer = evt.target.features[i].getLayer();
                    if(!this.layers[layer.id] && layer.hasAttachments){
                        this.layers[layer.id] = layer;
                        if(layer.infoTemplate.getAttachments && layer.infoTemplate.info.showAttachments){
                            aspect.after(layer.infoTemplate, "getAttachments", this.afterGetAttachments);
                        }
                    }
                }
            },
			
			setSizeAndPlacement:function(){
				if(this.config.size){
					var width = this.config.size.width;
					var height = this.config.size.height;
					
					//Control if proportions are respected
					if(width > (this.map.width * this.config.size.max_with_proportion))
						width = this.map.width * this.config.size.max_with_proportion;
					if(height > (this.map.height * this.config.size.max_height_proportion))
						height = this.map.height * this.config.size.max_height_proportion;
					
					//Get popup map's anchor and distances to possibles anchor positions (top, right, bottom-left...)
					/*var popup_anchor = this.map.toScreen(this.map.infoWindow.location);
					var anchor_distances = {
						"top":popup_anchor.y,
						"bottom":this.map.height - popup_anchor.y,
						"left":popup_anchor.x,
						"right":this.map.width - popup_anchor.x
					};
					var corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
					for(var i=0,nb=corners.length;i<nb;i++){
						var corner = corners[i];
						var tab_corner = corner.split("-");
						anchor_distances[corner] = Math.sqrt(
							Math.pow(anchor_distances[tab_corner[0]],2) 
							+ Math.pow(anchor_distances[tab_corner[1]],2)
						)
					}
					console.log("anchor_distances", anchor_distances);
					
					//Determine best anchor position
					var max_distance = 0;
					var best_anchor = "left";
					for(var possible_anchor in anchor_distances){
						if(anchor_distances[possible_anchor] > max_distance){
							best_anchor = possible_anchor;
							max_distance = anchor_distances[possible_anchor];
						}
					}
					console.log("best !", best_anchor);
					
					//Define best anchor !
					this.map.infoWindow.set("anchor", best_anchor);*/
					
					//resize
					this.map.infoWindow.resize(width, height);
				}				
			}
        });

        return clazz;
    });
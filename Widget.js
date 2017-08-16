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
	'dojo/query',
	'esri/urlUtils',
	'dojo/has',
	'dojo/_base/sniff'
  ],
    function (
        declare,
        BaseWidget,
        on,
        lang,
        aspect,
		query,
		urlUtils,
		has
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
                    return '<img class="thumbnail" src="'+attachment.url+'" />';
                }

                if(this.config.icons && this.config.icons.indexOf(ext) > -1){
					return '<img src="'+this.folderUrl +'/images/extensions/'+ext+'.png" />';
				}

                return '<img src="'+this.folderUrl +'/images/extensions/_blank.png" />';
            },

            _getLinkAttributes:function(attachment){
                var title = attachment.name + ' ('+this._getHumanSize(attachment.size)+')';
                var proxyRule = urlUtils.getProxyRule(attachment.url);
                if(proxyRule && proxyRule.proxyUrl)
					attachment.url = proxyRule.proxyUrl + "?" + attachment.url;

			    var download_name = attachment.name.replace('"', " ");

                var attrs = ' title="'+title.replace('"', ' ')+'"'
                    + ' type="'+attachment.contentType+'"'
                    + ' target="_blank"'
                    + ' href="'+attachment.url+'"';

                if(!has("ff"))
                    attrs += ' download="'+download_name+'"';

                return attrs;
            },

            _getLi:function(attachment){
                var title = attachment.name + ' ('+this._getHumanSize(attachment.size)+')';
				var link_attributes = this._getLinkAttributes(attachment);

                switch(this.theme){
                    case "icon":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a '+link_attributes+'>'
                            + img + '<span>' + title + '</span>'
                            +'</a></li>';

                    case "thumb":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a '+link_attributes+'>'
                            + img
                            +'</a></li>';

                    case "medium":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a '+link_attributes+'>'
                            + img
                            +'</a></li>';

					case "large":
                        var img = this._getIcon(attachment);
                        return '<li title="'+title+'">'
                            + '<a '+link_attributes+'>'
                            + img
                            +'</a></li>';

                    default:
                        return '<li title="'+title+'"><a '+link_attributes+'>'+title+'</a></li>';
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
			    if(!this.config.size)
			        return;

                var width = this.config.size.width;
                var height = this.config.size.height;

                //Control if proportions are respected
                if(width > (this.map.width * this.config.size.max_with_proportion))
                    width = this.map.width * this.config.size.max_with_proportion;
                if(height > (this.map.height * this.config.size.max_height_proportion))
                    height = this.map.height * this.config.size.max_height_proportion;

                //Get spaces for popup
                var popup_anchor = this.map.toScreen(this.map.infoWindow.location);
                var anchor_distances = {
                    "top":popup_anchor.y,
                    "bottom":this.map.height - popup_anchor.y,
                    "left":popup_anchor.x,
                    "right":this.map.width - popup_anchor.x
                };

                //Ajust with deltas optionnaly configured
                if(this.config.placement_deltas){
                    for(var anchor in anchor_distances){
                        if(this.config.placement_deltas[anchor])
                            anchor_distances[anchor] -= this.config.placement_deltas[anchor];
                    }
                 }

                //Determine best placement (top/bottom/left/right)
                var best_anchor = null;
                var max = 0;
                for(var anchor in anchor_distances){
                    if(anchor_distances[anchor]>max){
                        max = anchor_distances[anchor];
                        best_anchor = anchor;
                    }
                }

                //Ajust the placement if needed
                if(best_anchor == "top" || best_anchor == "bottom"){
                    if(anchor_distances["left"] < (heigth / 2)){
                        best_anchor += "-right";
                    }
                    else if(anchor_distances["right"] < (heigth / 2)){
                        best_anchor += "-left";
                    }
                }
                else{
                     if(anchor_distances["top"] < (heigth / 2)){
                        best_anchor = "bottom-" + best_anchor;
                    }
                    else if(anchor_distances["bottom"] < (heigth / 2)){
                        best_anchor = "top-" + best_anchor;
                    }
                }

                this.map.infoWindow.resize(width, height);
                this.map.infoWindow.set("anchor", best_anchor);
			}
        });

        return clazz;
    });

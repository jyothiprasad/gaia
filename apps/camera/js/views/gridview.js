define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var find = require('utils/find');
var bind = require('utils/bind');

/**
**Locals
*/

var unbind = bind.unbind;
/**
 * Exports
 */

module.exports = View.extend({
  name:'gridview',
  className: 'gridview',
  itemDisplayed: null,
  basePath:"style/images/drawable-hdpi/",
  selectedExt:"_selected.png",
  offExt:".png",
   l10n: navigator.mozL10n,
 initialize: function() {
 	this.el.innerHTML = this.getBaseElement();
    this.els.menuHolder = find('.js-menuholder', this.el);
    /***Hide the Menu itnitialy****/
 	this.el.classList.add('hidden');
 },
getBaseElement:function(){
	return "<div class='js-menuholder'></div>";
},

/**
*
*
*
*/
  render: function(){
    this.el.classList.remove('hidden');
  	this.els.menuHolder.appendChild(this.getGridMenu(this.dataArray));
  },



/**
*
*
*
*/
  getdummydata:function(){
  var ul = document.createElement('ul');
  ul.classList.add('menusettings');
  for(var i=0;i<5 ;i++)
  {
  	var li = document.createElement('li');
  	li.classList.add('gridMenulist');
  	li.innerHTML=" Item "+i;
  	li.myParam =  " Item "+i;
  	li.setAttribute("data-menu", " Item "+i);
  	bind(li,"click",this.showSubMenu,this);
  	ul.appendChild(li);
  }
  return ul;
  },

/**
*
*
*
*/
  getGridMenu: function(dataArr){
	var i = 0;
	var menuName = new Array();
	var ul = document.createElement('ul');
	//var ul =  document.createDocumentFragment();
	ul.classList.add('menusettings');
	ul.classList.add('rotates');
	

	for ( var k in dataArr) {
		
		/**if menu item is disabled than leave the menu Item**/
		if(dataArr[k].disabled)
			continue;
		/** add the Li element for each enabled menu item */
		var self =this;
		var value = dataArr[k].value;
		var li = this.getGridMenuLi(dataArr[k]);
		bind(li,"click",this.showSubMenu,this);
		ul.appendChild(li);
		menuName.push(dataArr[k]);
		if(++i % 3 == 0)
		{
			this.appendSubmenu(ul,menuName);
			menuName = null;
			menuName = new Array();		
		}
			
	}
	this.appendSubmenu(ul,menuName);
	menuName = null;
  	return  ul;
},
  
/**
*
*
*
*/
appendSubmenu:function(ul,menuName){
 	var list = this.addSubMenu(menuName);
	if(list)
	{
		for(var n=0;n<list.length;n++)
			ul.appendChild(list[n]);
	}

 },

/**
*
*
*
*/
 getGridMenuLi: function(obj){
	var item = obj.MenuID;
	var value = obj.value;
	var imgclass = value? obj.options[value].icon : obj.icon;
	console.log(" imgclass :: "+imgclass);
	var li = document.createElement('li');
	li.id = item.replace(" ","");
	li.classList.add('gridMenulist');
	li.setAttribute("data-menu",item);
	li.setAttribute("data-select","off");
	li.classList.add(imgclass);
	li.myParam = item;
	li.appendChild(this.getMenuNameNode(obj));
	if(value)
		li.appendChild(this.getMenuValueNode(obj));
	return li;
  },

/**
*
*
*
*/

  getMenuNameNode:function(obj){
  	var item = obj.MenuID;
  	var divText = document.createElement('div');
	divText.classList.add("menuName");
	divText.innerHTML = item;  //this.l10n.get(obj.l10ID);  uncomment when get l10 token
	divText.myParam = item;
	return divText;
  },

/**
*
*
*
*/
  getMenuValueNode:function(obj){
  	var item = obj.MenuID;
	var value = obj.value;
  	var divText = document.createElement('div');
	divText.classList.add("menuValue");
	divText.innerHTML = value;  //this.l10n.get(obj.options[value].l10ID);  uncomment when get l10 token
	divText.myParam = item;
	return divText;

  },

/**
*
*
*
*/
addSubMenu: function  (menuName){
	var liList = new Array();
	for(var i=0;i<menuName.length;i++)
	{
		if(!menuName[i].options)
			continue;
		var li = document.createElement('li');
		li.classList.add('hidden');
		li.classList.add('inlineMenu');
		li.id = "sub_"+menuName[i].MenuID.replace(" ","");	
		var elem = this.getSubMenuItems(menuName[i]);
		if(elem)
			li.appendChild(elem);	
		liList.push(li);
	}
	return liList;	
},

/**
*
*
*
*/

getSubMenuItems:function(objArray){
	var Ul = document.createElement('ul');	
	var menuArr = objArray.options;
	if(!menuArr)
		return;
	
	for (var k in menuArr) {
		var self =this;
		var li = document.createElement('li');
		li.setAttribute("data-value", menuArr[k].name);
		bind(li,"click",this.settingChanges,this);
		li.menuitem = objArray.MenuID;
		li.menuvalue = menuArr[k].name;
		li.menusetval = menuArr[k].value;
		li.innerHTML = menuArr[k].name  ;     //this.l10n.get(menuArr[k].l10ID); // menuArr[k];
		var img = new Image();	
		if(objArray.value == menuArr[k].name)
			img.src = "style/images/drawable-hdpi/btn_radio_on_holo_light.png";
		else
			img.src = "style/images/drawable-hdpi/btn_radio_off_holo_light.png";	
		li.classList.add(menuArr[k].subicon);
		li.appendChild(img);

		Ul.appendChild(li);
		}

	return Ul;
},

/**
*
*
*
*/
settingChanges:function(event){
	var item = event.target.menuitem.replace(" ","");
	var objArry = this.dataArray[item];
	var value = objArry.value;
	var className = objArry.options[value].icon;
	var subElm = find('#'+item,this.els.menuHolder);
	subElm.classList.remove(className);
	this.emit("setSettingOption",event);
},

/**
*
*
*
*/
showSubMenu:function(event){
	//this.emit("showSettingOption",event);
	var elId = event.target.myParam;
	var subId = "sub_"+elId.replace(" ","");
	if(!this.itemDisplayed  || this.itemDisplayed == null)
	{
		this.itemDisplayed = elId;
		var subElm = find('#'+subId,this.els.menuHolder);
		subElm.classList.remove('hidden');
		this.updateMenuUI(elId,true);
	} else if( this.itemDisplayed != elId)
	{
		this.updateMenuUI(this.itemDisplayed,false);
		var previusId =  "sub_"+this.itemDisplayed.replace(" ","");
		var preElem = find('#'+previusId,this.els.menuHolder);
		var subElm = find('#'+subId,this.els.menuHolder);
		preElem.classList.add('hidden');
		subElm.classList.remove('hidden');
		this.itemDisplayed = elId;
		this.updateMenuUI(elId,true);

	}else{
		this.updateMenuUI(this.itemDisplayed,false);
		var subElm = find('#'+subId,this.els.menuHolder);
		subElm.classList.add('hidden');
		this.itemDisplayed = null;
	}
},
 
/**
*
*
*
*/
clearSettingMenu:function(){
	var elements =  find('.menusettings',document.body);
	 this.el.classList.add('hidden');
	if(!elements)
		return;
   	elements.remove();
   },

/**
*
*
*
*/
   findElementList:function(className,elements){

   	return elements.getElementsByClassName(className);
   },

/**
*
*
*
*/
   

   updateMenuUI:function(item,mode){
	   	var menuElm = find('#'+item.replace(" ",""),this.els.menuHolder);
	   	var  itemname = find('.menuName',menuElm);
	   
	   	if(mode)
	   	{
	   		menuElm.setAttribute("data-select","on");
	   		itemname.style.color = "#03A2B4";
	   	}
	   	else{
	   		menuElm.setAttribute("data-select","off");
	   		itemname.style.color = "#606060";
	   	}
   		
   },

/**
*
*
*
*/
   updateMenuOptionUI:function(item){
	   	var seltedId =  "sub_"+item.replace(" ","");
	   	var optionElm = find('#'+seltedId,this.els.menuHolder);
	   	var menuElm = find('#'+item.replace(" ",""),this.els.menuHolder);
	   	var valueElm = find('.menuValue',menuElm);
	   	var index = item.replace(" ","");
	   	var obj = this.dataArray[index];
	   	var value = obj.value;
	   	var classname = obj.options[value].icon;
	   	menuElm.classList.add(classname);
	   	optionElm.innerHTML = "";
	   	valueElm.innerHTML =  obj.value; //this.getLanguageString('value');  // obj.values;
	   	//console.log(' Value  Item :: '+this.getLanguageString('value'));
	   	var elem = this.getSubMenuItems(obj);
		if(elem)
			optionElm.appendChild(elem);	
	  	var self =this;
	  	this.updateMenuUI(item,true);
		setTimeout(function(){
			optionElm.classList.add('hidden');
			self.updateMenuUI(item,false);
			self.itemDisplayed = null;
			},1000);

   },

   /***
*
*
*
**/

getLanguageString : function(name){
//var l10n = navigator.mozL10n;
	var langstring = null;
	console.log("  name :: ");
	switch(name){
	  case 'value':
	  {
		langstring = l10n.get('retake-button');
	  	break;
	  }
	  case 'Focus':
	  {
	    langstring = l10n.get('close-button');
	     break;
	  }
	 default:
	 {
	  langstring = l10n.get('select-button');
	   break;
	 }
	}
	return langstring;
},
});

});
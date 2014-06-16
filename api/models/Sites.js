var fs = require('fs');

module.exports = {

	attributes	: {
		domain: 'STRING',
		site_name: 'STRING',
		slogan: 'STRING',
		site_type: 'STRING',
		favicon: 'STRING',
		logo_url: 'INT',
		address: 'STRING',
		copyright: 'STRING',
		static_server: 'STRING',
		upload_path: 'STRING'
	},

	//path: './../assets/api/',
	path: './',

	getTemplate: function(template) {
		var template = "api-1.0.0";
		var filepath = this.path + template + ".js",
			file = fs.readFileSync(filepath,{encoding:'utf8'});

		//console.log("filepath",filepath);
		try {
			eval(file);
		} catch(e) {
			console.log("error getTemplate",e)
			return {};
		}
  
		return site;
	},

	getSite: function(req) {
		var template = "api-1.0.0";
		//var filepath = this.path + req.host+".js";
		var filepath = this.path + template + ".js";
			file = fs.readFileSync(filepath,{encoding:'utf8'});

		//console.log("filepath",filepath);

		try {
			eval(file);
		} catch(e) {
			console.log("error getSite",e)
			return {};
		}			
  
		return site;
	},

	get: function(req) {
		var site = {},
			page_site = this.getSite(req),
			abstract_site = this.getTemplate(page_site.template);	

		site.name = page_site.name;
		site.slogan = page_site.slogan;
		site.favicon = page_site.favicon;
		site.logo_url = page_site.logo_url;
		site.address = page_site.address;
		site.copyright = page_site.copyright;

		site.layout = abstract_site.layout;
		site.modules = abstract_site.modules;
		site.routes = abstract_site.routes;
		site.default_page = abstract_site.default_page;
		site.pages = abstract_site.pages;
		site.api = abstract_site.api;

		for(var i in page_site.modules) site.modules[i] = page_site.modules[i];
		for(var i in page_site.routes) site.routes[i] = page_site.routes[i];
		for(var i in page_site.pages) site.pages[i] = page_site.pages[i];
		for(var i in page_site.api) site.api[i] = page_site.api[i];
			
		if (page_site.default_page) site.default_page = page_site.default_page;

		//console.log(site);
  
		return site;
	}

};
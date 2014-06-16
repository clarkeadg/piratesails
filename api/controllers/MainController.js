/**
 * MainController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
    
	api: function (req, res) {
		var user = (req.session.user) ? req.session.user : null,
	        site = Sites.get(req),
			slug = req.param('slug'),
			id = req.param('id'),
			key = req.param('key');
			//metacode_path = site.modules.metacode.path;

		try {

			if (!slug) return res.json({error:"missing slug"}); 
			if (!id) return res.json({error:"missing id"}); 

			/*var filepath = metacode_path + "controllers/Api.js",
				file = fs.readFileSync(filepath,{encoding:'utf8'});
			eval(file);*/

			MetaCode = site.api;

			res.setHeader('content-type', 'application/json');
			res.setHeader('Access-Control-Allow-Origin','*');

			if (!key &&  typeof(MetaCode[slug]) != "undefined" && typeof(MetaCode[slug][id]) != "undefined") return MetaCode[slug][id](req,res);
			if (!key &&  typeof(MetaCode[slug]) != "undefined" && typeof(MetaCode[slug][id]) != "undefined" && typeof(MetaCode[slug][id][key]) != "undefined") return MetaCode[slug][id][key](req,res);

		} catch (e) {
			console.log("error api",e);
		   return res.jsonp({error:e}); 
		}

		return res.jsonp({error:"Coudn't find MetaCode Method"}); 	
	}

	,page: function (req, res) {
		var user = (req.session.user) ? req.session.user : null,
	        site = Sites.get(req),
			slug = req.param('slug'),
			id = req.param('id'),
			key = req.param('key'),
			value = req.param('value');

		try {

			if (typeof(site.pages) == "undefined") return res.view("404",{});

			MetaCode = site.pages;

			if (slug) {
				if (typeof(MetaCode[slug]) == "function") return MetaCode[slug](req,res);

				if (typeof(MetaCode[slug]) == "object") {

					if (value && key) {
						//console.log("2323223");
						if (typeof(MetaCode[slug][id][key]) == "function") return MetaCode[slug][id][key](req,res);	
					}

					if (key) {
						//if (typeof(MetaCode[slug][id]) == "function") return MetaCode[slug][id](req,res);	
					}

					if (id) {
						if (typeof(MetaCode[slug][id]) == "object") {	
							if (key) {
								if (typeof(MetaCode[slug][id][key]) == "function") return MetaCode[slug][id][key](req,res);
							}
						}
						if (typeof(MetaCode[slug][id]) == "function") return MetaCode[slug][id](req,res);
					}

				}
				
				if (site.routes[slug]) return site.routes[slug](req,res);

				return site.pages.profile(req,res);
			}

			if (!slug) return MetaCode["index"](req,res);

		} catch (e) {
			console.log("error page",e)
		   res.view("404",{});	
		}	

		return res.view("404",{});	
	}

	/**
	* Overrides for the settings in `config/controllers.js`
	* (specific to MainController)
	*/
	,_config: {}  
};

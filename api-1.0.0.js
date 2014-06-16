/************************************
API
v.1.0.0
http://localhost:1337/
**************************************/

/* 
ENTITY CONFIG 
key: {
	attributes: {
		atype: "int" string" "text"
		,unique: true false
		,required: true false
		,maxChars: 32
		,minChars: 4
		,validChars: '^[0-9a-z]+$'		
	}
}
*/

/* 
METHODS 
Entity.c()		
Entity.r()
Entity.u()
Entity.d()
Entity.property.c()
Entity.property.r()
Entity.property.u()
Entity.property.d()
Entity.property.history.c()
Entity.property.history.r()
Entity.property.history.d()
Entity.relationship.c()
Entity.relationship.r()
Entity.relationship.u()
Entity.relationship.d()
Collection.find()
Collection.findOne()
Collection.count()
Service.auth.session()
Service.auth.access()
Service.file.upload()
Service.file.get()
Service.file.stream()
Service.validation.getEntityCreateOptions()
Service.validation.getEntityReadOptions()
Service.validation.getEntityUpdateOptions()
Service.validation.getEntityDestroyOptions()
Service.validation.checkEntityType()
Service.validation.checkPropertyName()
Service.validation.checkPropertyValue()
Service.validation.validateOptions()
Service.validation.checkRequired()
Service.validation.checkMinLength()
Service.validation.checkMaxLength()
Service.validation.checkChars()
*/

/* 
API 
http://localhost:1337/
http://localhost:1337/api/entity/c
http://localhost:1337/api/entity/r
http://localhost:1337/api/entity/u
http://localhost:1337/api/entity/d
http://localhost:1337/api/collection/find
http://localhost:1337/api/collection/findone
http://localhost:1337/api/collection/count
http://localhost:1337/api/service/auth
http://localhost:1337/api/service/file

Examples:
http://localhost:1337/api/entity/c?type=user&props[username]=brian2&props[password]=1234
http://localhost:1337/api/entity/c?type=tag&props[name]=rock
http://localhost:1337/api/entity/r?id=1
http://localhost:1337/api/entity/u?id=1&props[legal]=1
http://localhost:1337/api/entity/d?id=1&action=enable
http://localhost:1337/api/entity/d?id=1&action=disable
http://localhost:1337/api/entity/d?id=1&action=delete
http://localhost:1337/api/collection/find?where[enabled]=1&where[key]=tag&limit=1&skip=1&sort[id]=desc
http://localhost:1337/api/collection/findone?where[enabled]=1&where[key]=user&sort[id]=desc
http://localhost:1337/api/collection/count?where[key]=user

http://localhost:1337/api/collection/find?where[attr_name]=brian

http://localhost:1337/api/entity/u?id=1&props[friend]=2

*/

/* NOTES

TODO:
-query collection by properties
-query collection by relationship
-relationships crud
-entity history crud
-dtos and memcached
-services

https://foundationdb.com/layers/sql/documentation/GettingStarted/eav.tutorial.html

select * from entities as E
inner join properties_string as PS on E.id = PS.object_id
inner join properties_int as PI on E.id = PI.object_id
inner join properties_text as PT on E.id = PT.object_id
inner join relationships as R on E.id = R.parent_object_id

*/

Entity = {
	c: function(key,props,cb) {
		var z = this;
		if (!site.entities[key]) return cb("no config for entity: "+key);
		var entity = site.entities[key],
			send = {};
		for(var i in props) {
			if (entity.attributes[i]) {
				send[i] = props[i];
			}
		}
		Entities.create({key:key,enabled:1},function(err,data) {
			if (err) return cb("Error Creating Object: "+key);
			var t = 0;
			for (var s in send) t++;
			if (t == 0) return cb("Error Creating Object no props to send");
			var n = 0,
				rs = { key: key, properties: {} };
			var myProps = {};
			for (var p in send) {
				myProps[p] = send[p];
				Entity.property.c(key,data.id,p,send[p],entity.attributes[p].atype,function(error,prop){
					console.log(error,prop)
					if (error) return cb(error);					
					//rs.properties[prop["attr_name"]] = prop["attr_value"];
					//rs["createdAt"] = data["createdAt"];
					//rs["updatedAt"] = data["updatedAt"];
					//rs["enabled"] = 1;
					n++;
					if (n == t) {
						data.props = myProps;
						EntityCache.create({enabled:1,object_id:data.id,object_key:key,object_value:JSON.stringify(data)},function(err,data){
							if (err) return cb(err);
							return cb(false,rs);
						});						
					}
				})
			}
		});
	}
	,r: function(opts,cb) {
		var z = this;
		var enabled = 1;
		opts.id = +opts.id;
		var send = {id:opts.id,enabled:1};
		if (opts.enabled == "all") send = {id:opts.id};
		//return console.log(opts)
		Entities.findOne(send,function(err,entity) {
			if (err) return cb(err);
			if (!entity) return cb("No entity found");			
			z.property.r(opts,function(error,data) {
				if (error) return cb(error);
				entity.properties = data;
				/*for(var i in data) {
					entity[i] = data[i];
					entity.properties.push(data);
				}*/			
				return cb(false,entity);
			});				
		});
	}
	,u: function(opts,cb) {
		var z = this, rs = {};
		//console.log(opts);
		if (!opts.id) return cb("no id for entity");
		if (!opts.type) return cb("no type for entity");
		if (!opts.props) return cb("no props for entity");
		if (!site.entities[opts.type]) return cb("no type for entity");
		var entity = site.entities[opts.type],
			send = opts.props;
		
		//return cb(false,send)
		Entities.update({id:opts.id,enabled:1},{},function(err,data) {
			//return cb(false,{err:err,data:data});
			if (err) return cb("Error Updating Object");
			var t = 0;
			for (var s in send) t++;
			if (t == 0) return cb("Error Updating Object no props to send");
			var n = 0;				
			rs = data;
			rs.properties = {};
			for (var p in send) {
				//return console.log(opts.id,p,send[p],entity.attributes[p].atype)
				Entity.property.u(opts.type,opts.id,p,send[p],entity.attributes[p].atype,function(error,prop){
					if (error) return cb(error);
					if (!prop && !prop[0]) return cb("no prop found");
					//console.log(error,prop[0])
					prop = prop[0];
					//rs.properties[prop["attr_name"]] = prop["attr_value"];
					//rs.properties[prop["attr_name"]] = prop;
					//rs["createdAt"] = data["createdAt"];
					//rs["updatedAt"] = data["updatedAt"];
					//rs["enabled"] = 1;
					n++;
					console.log(rs)
					if (n == t) return cb(false,rs);
				})
			}
		});
	}
	,d: function(opts,cb) {
		opts.enabled = "all";
		Entity.r(opts,function(err,entity){
			if (err) return cb(err);

			switch(opts.action) {
				case "enable":
					Entities.update({
					  id: opts.id
					},{
						enabled: 1
					}, function(err, data) {
						if (err) return cb(err)
						done(entity);			 	
					});
				break;
				case "disable":
					Entities.update({
					  id: opts.id
					},{
						enabled: 0
					}, function(err, data) {
						if (err) return cb(err)
					 	done(entity);	
					});
				break;
				case "delete":
					Entities.destroy({
					  id: opts.id
					}).done(function(err) {
						if (err) return cb(err)
					 	done(entity);
					});
				break;
				default:
					cb("not a valid action")
				break;
			}
		});	

		function done(entity) {
			var n = 0, t = 0, send = {};			
			for(var i in entity.properties) { t++; };
			for(var i in entity.properties) {
				send = {
					id:entity.properties[i].id
					,action: opts.action
					,atype: site.entities[entity.key].attributes[i].atype
				};
				//console.log("done",send)
				Entity.property.d(send,function(err,prop){
					//console.log("done111",err,prop)
					if (err) return cb(err);
					n++;
					entity.properties[prop["attr_name"]] = prop;
					if (n == t) {
						//cb(false,entity)
						Entity.r({id:entity.id,enabled:"all"},function(err,rs){
							if (err) return cb(err);
							return cb(false,rs);
						});
					}
				});
			}	
		}	
	}
	,property: {
		c: function(key,object_id,attr,value,atype,cb) {
			var opts = {enabled:1,object_id:object_id,attr_name:attr,attr_value:value,key:key};
			switch(atype) {
				case "int":
					Properties_Int.create(opts,function(err,data){
						if (err) return cb("Error creating property: "+attr);
						return cb(false,data);
					});
				break;
				case "string":
					Properties_String.create(opts,function(err,data){
						if (err) return cb("Error creating property: "+attr);
						return cb(false,data);
					});
				break;
				case "text":
					Properties_Text.create(opts,function(err,data){
						if (err) return cb("Error creating property: "+attr);
						return cb(false,data);
					});
				break;
				default:
					//return cb("missing atype");
				break;
			}
		}
		,r: function(opts,cb) {
			var n = 0, t = 2, props = {}, send = {enabled:1,object_id:opts.id};
			if (opts.enabled == "all") send = {object_id:opts.id};
			Properties_Int.find(send,function(err,data){
				if (err) return cb("Error finding properties int");
				if (data) addProps(data);				
				if (n++ == t) cb(false,props);
			});
			Properties_String.find(send,function(err,data){
				if (err) return cb("Error finding properties string");
				if (data) addProps(data);
				if (n++ == t) cb(false,props);
			});
			Properties_Text.find(send,function(err,data){
				if (err) return cb("Error finding properties text");
				if (data) addProps(data);
				if (n++ == t) cb(false,props);
			});
			function addProps(data) {
				for(var i=0,c=data.length;i<c;i++) {
					//props[data[i]["attr_name"]] = data[i]["attr_value"];
					props[data[i]["attr_name"]] = data[i];
				}
			}
		}
		,u: function(key,object_id,attr,value,atype,cb) {
			var opts = {enabled:1,object_id:object_id,attr_name:attr};
			var send = {attr_value:value};
			//return console.log(opts,send)
			function create() {
				Entity.property.c(key,object_id,attr,value,atype,function(err,data){
					if (err) return cb("Error creating property: "+attr);
					return cb(false,data);
				});
			}
			function updateInt(opts,send,cb) {
				Properties_Int.update(opts,send,function(err,data){
					if (err) return cb("Error updating property: "+attr);
					return cb(false,data);
					//key,object_id,attr_id,revision_from,revision_to
					/*Entity.property.history.c(function(err,h){
						if (err) return cb("Error creating history: "+attr);
						return cb(false,data);
					});*/				
				});
			}
			function updateString(opts,send,cb) {
				Properties_String.update(opts,send,function(err,data){
					if (err) return cb("Error updating property: "+attr);
					return cb(false,data);
					/*Entity.property.history.c(function(err,h){
						if (err) return cb("Error creating history: "+attr);
					});*/
				});
			}
			function updateText(opts,send,cb) {
				Properties_Text.update(opts,send,function(err,data){
					if (err) return cb("Error updating property: "+attr);
					return cb(false,data);
					/*Entity.property.history.c(function(err,h){
						if (err) return cb("Error creating history: "+attr);
					});*/
				});
			}
			switch(atype) {
				case "int":					
					Properties_Int.findOne({attr_name:attr},function(err,data){
						if (err) return cb("Error finding property: "+attr);
						if (!data) {
							create(opts,send,cb);
						} else {
							updateInt(opts,send,cb);
						}
					});
				break;
				case "string":
					Properties_String.findOne({attr_name:attr},function(err,data){
						if (err) return cb("Error finding property: "+attr);
						if (!data) {
							create(opts,send,cb);
						} else {
							updateString(opts,send,cb);
						}
					});
				break;
				case "text":
					Properties_Text.findOne({attr_name:attr},function(err,data){
						if (err) return cb("Error finding property: "+attr);
						if (!data) {
							create(opts,send,cb);
						} else {
							updateText(opts,send,cb);
						}
					});
				break;
				default:
					//return cb("missing atype");
				break;
			}
		}
		,d: function(opts,cb) {
			opts.enabled = "all";
			Entity.property.r(opts,function(err,property){
				if (err) return cb(err);
				switch(opts.action) {
					case "enable":
						switch(opts.atype) {
							case "int":
								Properties_Int.update({
								  id: opts.id
								},{
									enabled: 1
								}, function(err, data) {
									if (err) return cb(error)
								 	return cb(false,data);
								});
							break;
							case "string":
								Properties_String.update({
								  id: opts.id
								},{
									enabled: 1
								}, function(err, data) {
									if (err) return cb(error)
								 	return cb(false,data);
								});
							break;
							case "text":
								Properties_Text.update({
								  id: opts.id
								},{
									enabled: 1
								}, function(err, data) {
									if (err) return cb(error)
								 	return cb(false,data);
								});
							break;
							default:
								return cb("missing atype");
							break;
						}						
					break;
					case "disable":
						switch(opts.atype) {
							case "int":
								Properties_Int.update({
								  id: opts.id
								},{
									enabled: 0
								}, function(err, data) {
									if (err) return cb(error)
								 	return cb(false,data);
								});
							break;
							case "string":
								Properties_String.update({
								  id: opts.id
								},{
									enabled: 0
								}, function(err, data) {
									if (err) return cb(error)
								 	return cb(false,data);
								});
							break;
							case "text":
								Properties_Text.update({
								  id: opts.id
								},{
									enabled: 0
								}, function(err, data) {
									if (err) return cb(error)
								 	return cb(false,data);
								});
							break;
							default:
								return cb("missing atype");
							break;
						}
					break;
					case "delete":
						switch(opts.atype) {
							case "int":
								Properties_Int.destroy({
								  id: opts.id
								}).done(function(err) {
									if (err) return cb(error)
								 	return cb(false,{});
								});
							break;
							case "string":
								Properties_String.destroy({
								  id: opts.id
								}).done(function(err) {
									if (err) return cb(error)
								 	return cb(false,{});
								});
							break;
							case "text":
								Properties_Text.destroy({
								  id: opts.id
								}).done(function(err) {
									if (err) return cb(error)
								 	return cb(false,{});
								});
							break;
							default:
								return cb("missing atype");
							break;
						}
					break;
					default:
						cb("not a valid action");
					break;
				}
			});	
		}
		/* not finished - almost done, decided to de-prioritize till last */
		,history: {
			c: function(key,object_id,attr_id,revision_from,revision_to,cb) {
				var send = {
					object_id:object_id
					,attr_id:attr_id
					,revision_from:revision_from
					,revision_to:revision_to
					,key:key
				};
				Properties_History.create(send,function(err,data){
					if (err) return cb("Error creating property history: "+attr_id);
					return cb(false,data);
				});
			}
			,r: function(opts,cb) {
				var send = {
					attr_id:opts.attr_id
				};
				Properties_History.find(send,function(err,data){
					if (err) return cb("Error finding property history"+attr_id);									
					cb(false,data);
				});
			}
			,d: function(opts,cb) {			
				switch(opts.action) {
					case "delete":
						Properties_History.destroy({
						  attr_id: opts.attr_id
						}).done(function(err) {
							if (err) return cb(error)
						 	return cb(false,{});
						});
					break;
					default:
						cb("not a valid action");
					break;
				}				
			}
		}	
	}
	/* not finished */
	,relationship: {
		c: function(opts,cb) {}
		,r: function(opts,cb) {}
		,u: function(opts,cb) {}
		,d: function(opts,cb) {}
	}	
};

Collection = {
	/* not finished -- need to add propery search, and relationship graph */
	find: function(opts,cb) {
		var z = this, where = {}, limit = 10, skip = 0, sort = 'id DESC', props;
		if (opts.where) where = opts.where;
		if (opts.limit) limit = opts.limit;
		if (opts.skip) skip = opts.skip;
		if (opts.sort) sort = opts.sort;
		if (opts.props) props = opts.props;
		var myOpts = {where:where,limit:limit,skip:skip,sort:sort};
		//return cb(false,{opts:myOpts,props:props})
		z.query(false,myOpts,function(err,data){
			if (err) return cb(err);
			return cb(false,data)
		});
	}
	,findOne: function(opts,cb) {
		var z = this, where = {}, sort = 'id DESC', props;
		if (opts.where) where = opts.where;
		if (opts.sort) sort = opts.sort;
		if (opts.props) props = opts.props;
		var myOpts = {where:where,sort:sort};
		z.query(true,myOpts,function(err,data){
			if (err) return cb(err);
			return cb(false,data)
		});
	}
	,query: function(single,opts,cb) {
		console.log(single,opts)
		var where = {}, limit = 10, skip = 0, sort = 'id DESC', myOpts = {};
		if (opts.where) where = opts.where;
		if (opts.limit) limit = opts.limit;
		if (opts.skip) skip = opts.skip;
		if (opts.sort) sort = opts.sort;
		if (single) {
			//console.log("3")
			myOpts = {where:where,sort:sort};
			Entities.findOne(myOpts,function(err,data){
				if (err) return cb(err);
				return cb(false,data);
			});
		} else {
			//console.log("4")
			var myOpts = {groupBy: ['object_id'], where:where,limit:limit,skip:skip,sort:sort};
			var myOpts = {groupBy: ['object_id']};
			console.log(myOpts)
			Properties_String.count(myOpts).done(function(err, count) {
				console.log(err,count)
				if (err) return cb(err);
				Properties_String.find(myOpts,function(err,data){
					if (err) return cb(err);
					return cb(false,{collection:data,count:count});
				});
			});
			/*Entities.count(myOpts).done(function(err, count) {
				console.log(err,count)
				if (err) return cb(err);
				Entities.find(myOpts,function(err,data){
					if (err) return cb(err);
					return cb(false,{collection:data,count:count});
				});
			});*/
		}	
	}
	,count: function(opts,cb) {
		var where = [{}], limit = 10, props, skip = 0, sort = 'id DESC';
		if (opts.where) where = opts.where;
		if (opts.limit) limit = opts.limit;
		if (opts.skip) skip = opts.skip;
		if (opts.sort) sort = opts.sort;
		if (opts.props) props = opts.props;
		var myOpts = {where:where,limit:limit,skip:skip,sort:sort};
		if (props) {

		} else {
			Entities.count(myOpts).done(function(err, data) {
				if (err) return cb(err)	
				return cb(false,data)
			});	
		}		
	}
};

Service = {
	/* not finished */
	auth: {
		session: {}
		,checkAccess: function(req,res) {

		}
	}
	/* not finished */
	,file: {
		upload: {}
		,get: {}
		,stream: {}
	}
	/* need to test/add update unique key to value that is not unique anymore and get error */
	,validation: {
		getEntityCreateOptions: function(req,cb) {
			var z = this, n = 0, t = 0, opts = req.query, send = {};
			z.hasResponsed = false;
			//console.log("getEntityCreateOptions",opts)		
			if (!opts) return cb("opts not valid");	
			if (!opts.type) return cb("missing type");
			if (!opts.props) return cb("missing props");			
			if (!z.checkEntityType(opts.type)) return cb("invalid entity type");
			send.type = opts.type;
			send.props = {};
			for (var i in opts.props) { t++ };
			var error = false;
			for (var i in opts.props) {	
				if (error) return false;
				if (!z.checkPropertyName(send.type,i)) {
					error = "invalid property name - "+send.type+":"+i;					
					return false;
				}
				//console.log("checkPropertyValue")
				z.checkPropertyValue(false,send.type,i,opts.props[i],function(err,data){
					//console.log("checkPropertyValue done",err,data)
					if (err) {
						error = err;
						done();
					}
					if (data) {
						send.props[data.k] = data.v;
						n++;
						if (n == t) done();	
					}			
				}); 
			}
			if (error) done();
			function done() {
				if (!z.hasResponsed) {
					z.hasResponsed = true;
					if (!error) {
						//Check Required
						error = z.checkRequired(send);
					}				
					cb(error,send);
				}
			}
		}
		,getEntityReadOptions: function(req,cb) {
			var z = this, n = 0, t = 0, opts = req.query, send = {};
			//console.log("getEntityReadOptions",opts)		
			if (!opts) return cb("opts not valid");	
			if (!opts.id) return cb("missing id");
			send.id = opts.id;							
			cb(false,send);				
		}
		,getEntityUpdateOptions: function(entity,req,cb) {
			var z = this, n = 0, t = 0, opts = req.query, send = {};
			z.hasResponsed = false;
			//console.log("getEntityUpdateOptions",entity)		
			if (!opts) return cb("opts not valid");	
			if (!entity.key) return cb("missing type");
			opts.type = entity.key;
			if (!opts.props) return cb("missing props");			
			if (!z.checkEntityType(opts.type)) return cb("invalid entity type");
			send.type = opts.type;
			send.props = {};
			for (var i in opts.props) { t++ };
			var error = false;
			for (var i in opts.props) {	
				if (error) return false;
				if (!z.checkPropertyName(send.type,i)) {
					error = "invalid property name - "+send.type+":"+i;					
					return false;
				}
				//console.log("checkPropertyValue")
				z.checkPropertyValue(true,send.type,i,opts.props[i],function(err,data){
					//console.log("checkPropertyValue done",err,data)
					if (err) {
						error = err;
						done();
					}
					if (data) {
						send.props[data.k] = data.v;
						n++;
						if (n == t) done();	
					}			
				}); 
			}
			if (error) done();
			function done() {
				if (!z.hasResponsed) {
					z.hasResponsed = true;									
					cb(error,send);
				}
			}
		}	
		,getEntityDestroyOptions: function(req,cb) {
			var z = this, opts = req.query, send = {};
			//console.log("getEntityDestoryOptions",opts)		
			if (!opts) return cb("opts not valid");	
			if (!opts.id) return cb("missing id");
			if (!opts.action) return cb("missing action");
			send.id = opts.id;
			send.action = opts.action;							
			cb(false,send);				
		}
		,checkEntityType: function(key) {
			var rs = false;
			if (site.entities[key]) rs = true;
			return rs;
		}
		,checkPropertyName: function(key,name) {
			var rs = false;
			if (site.entities[key].attributes[name]) rs = true;
			return rs;
		}
		,checkPropertyValue: function(skipUnique,key,name,value,cb) {
			var z = this, 
				prop = site.entities[key].attributes[name];			
			//console.log("checkUnique")
			z.validateOptions(skipUnique,prop,name,value,function(err,data){
				//console.log("checkUnique done")
				if (err) return cb(err);
				return cb(false,{k:name,v:value});
			});					
		}
		,validateOptions: function(skipUnique,entity,key,val,cb) {
			//console.log("checkUnique",entity,key,val);
			var z = this, opts = {"attr_name":key,"attr_value":val};	

			//TREAT OPTIONS
			if (entity.atype == "int") {
				//make sure value is an int
				val = +val;
			}
			if (entity.atype == "string") {
				if (val.length > 128 ) {
					return cb(key+" is longer than the max allowed 128");
				}
			}
			if (entity.atype == "text") {
				if (val.length > 4096) {
					return cb(key+" is longer than the max allowed 4096");
				}
			}

			//VALIDATE OPTIONS			
			
			//Check MinLength
			if (entity.minChars) {
				if (z.checkMinLength(entity,key,val)) {
					return cb(key+" is is not enough characterss.  Min length is "+entity.minChars+ " characters.");
				}
			}
			//Check MaxLength
			if (entity.maxChars) {
				if (z.checkMaxLength(entity,key,val)) {
					return cb(key+" is too many characters.  Max length is "+entity.maxChars+ " characters.");
				}
			}
			//Check Chars
			if (entity.validChars) {
				if (z.checkChars(entity,key,val)) {
					return cb(key+" has invalid characters.");
				}
			}
			//Check Unique
			if (!entity.unique) return cb(false);	
			if (skipUnique) return cb(false);
			switch(entity.atype) {
				case "int":
					Properties_Int.findOne(opts,function(err,data){						
						if (err) return cb("Error finding property: "+key);
						if (data) return cb("key already exists with this value - "+key+":"+val);
						return cb(false);
					});
				break;
				case "string":
					Properties_String.findOne(opts,function(err,data){						
						if (err) return cb("Error finding property: "+key);
						if (data) return cb("key already exists with this value - "+key+":"+val);
						return cb(false);
					});
				break;
				case "text":
					Properties_Text.findOne(opts,function(err,data){						
						if (err) return cb("Error finding property: "+key);
						if (data) return cb("key already exists with this value - "+key+":"+val);
						return cb(false);
					});
				break;
				default:
					Properties_String.findOne(opts,function(err,data){						
						if (err) return cb("Error finding property: "+key);
						if (data) return cb("key already exists with this value - "+key+":"+val);
						return cb(false);
					});
				break;
			}	
		}
		,checkRequired: function(send) {
			var error = false, entity = site.entities[send.type];
			//console.log("checkRequired",send)
			for(var i in entity.attributes) {
				if (entity.attributes[i].required) {
					if (!send.props[i]) {
						error = "missing required opt: "+i;
						return error;
					}
				}
			}
			return error;
		}
		,checkMinLength: function(entity,key,val) {
			//console.log("checkMinLength",entity,key,val)
			if (val.length < entity.minChars) return true;
			return false;
		}
		,checkMaxLength: function(entity,key,val) {
			//console.log("checkMaxLength",entity,key,val)
			if (val.length > entity.maxChars) return true;
			return false;
		}
		,checkChars: function(entity,key,val) {
			//console.log("checkChars",entity,key,val)
			var exp = new RegExp(entity.validChars,"i");		
			if (!val.match(exp) ) return true;
			return false;
		}
	}
};

/* SITE CONFIG */
site = {
	entities: {
		user: {
			attributes: {
				username: {
					atype: "string"
					,unique: true
					,required: true
					,maxChars: 32
					,minChars: 4
					,validChars: '^[0-9a-z]+$' 
				}
				,password: {
					atype: "string"
					,required: true
					,maxChars: 32
					,minChars: 4
					,validChars: '^[0-9a-z]+$'
				}
				,status: {
					atype: "text"
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
				,email: {
					atype: "string"
					,unique: true
					//,validChars: '^[0-9a-z@]+$'
					,maxChars: 128
				}
				,email_notify: {
					atype: "string"
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
				,legal: {
					atype: "string"
					//,required: true
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
				,forgot_password: {
					atype: "string"
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
				,tokens: {
					atype: "int"
				}
				,points: {
					atype: "int"
				}
				,friend: {
					atype: "int"
				}
				,subscription: {
					atype: "string"
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
				,ip: {
					atype: "string"
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
				,last_login: {
					atype: "string"
					,validChars: '^[0-9a-z]+$'
					,maxChars: 10
				}
			}		
		}
		,tag: {
			attributes: {
				name: {
					atype: "string"
					,unique: true
					,required: true
					,maxChars: 32
					,minChars: 1
					,validChars: '^[0-9a-z]+$' 
				}			
			}		
		}		
	}	
	,pages: {
		index: function (req, res) {
			return res.json({"data":"Hello, Welcome to Pirate Sails Api!"});	
		}	
	}
	,api: {
		entity: {
			c: function (req, res) {
				Service.validation.getEntityCreateOptions(req,function(err,opts){
					if (err) return res.jsonp({error:err});
					if (!opts) return res.jsonp({error:"opts not valid"});
					Entity.c(opts.type,opts.props,function(err,data){
						if (err) return res.jsonp({error:err});
						return res.jsonp(false,{data:data});
					});
				});
			}
			,r: function (req, res) {				
				Service.validation.getEntityReadOptions(req,function(err,opts){
					if (err) return res.jsonp({error:err});
					if (!opts) return res.jsonp({error:"opts not valid"});	
					Entity.r(opts,function(err,data){
						if (err) return res.jsonp({error:err});
						return res.jsonp(false,{data:data});
					});
				});
			}
			,u: function (req, res) {
				if (!req.query.id) res.jsonp({error:"missing id"});
				Entity.r({id:+req.query.id},function(err,entity){
					//console.log(entity)
					if (err) return res.jsonp({error:err});
					if (!entity) return res.jsonp({error:"No entity found"});
					Service.validation.getEntityUpdateOptions(entity,req,function(err,opts){
						//console.log(err,opts)
						if (err) return res.jsonp({error:err});
						if (!opts) return res.jsonp({error:"opts not valid"});	
						opts.id = entity.id;
						//return 	res.jsonp(false,{data:opts});				
						Entity.u(opts,function(err,data){
						if (err) return res.jsonp({error:err});
							return res.jsonp(false,{data:data});
						});									
					});
				});			
			}
			,d: function (req, res) {				
				Service.validation.getEntityDestroyOptions(req,function(err,opts){
					if (err) return res.jsonp({error:err});
					if (!opts) return res.jsonp({error:"opts not valid"});	
					Entity.d(opts,function(err,data){
						if (err) return res.jsonp({error:err});
						return res.jsonp(false,{data:data});
					});
				});
			}
		}
		,collection: {
			find: function (req, res) {
				var opts = req.query;
				Collection.find(opts,function(err,data){
					if (err) return res.jsonp({error:err});
					return res.jsonp(false,{data:data});
				});
			}
			,findone: function (req, res) {
				var opts = req.query;
				Collection.findOne(opts,function(err,data){
					if (err) return res.jsonp({error:err});
					return res.jsonp(false,{data:data});
				});
			}
			,count: function(req, res) {
				var opts = req.query;
				Collection.count(opts,function(err,data){
					if (err) return res.jsonp({error:err});
					return res.jsonp(false,{data:data});
				});
			}
		}
		,service: {
			auth: function (req, res) {
				return res.jsonp({});
			}
			,file: function (req, res) {
				return res.jsonp({});
			}	
		}
	}
};

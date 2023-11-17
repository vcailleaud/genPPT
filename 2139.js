const https = require('https');

var tenantConfig = require('./config/2139/index_2139.js');
var extJS = require('./scripts/tkRulesLibrary.js');

function replaceAll(string, search, replace) {
	return string.split(search).join(replace);
}

var methods = {

	/**
	 * COPY existing dataobject
	 */
	copyDataobject : function (dataObjectId, logger, callback) {
		
		extJS.executeStoredSelector(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, 
									tenantConfig.triskell.stroredSelectors.getDataobjectDetails, 
									tenantConfig.triskell.parameters.dataobject_id+'#'+dataObjectId, 
									logger, function(err1, details) {
			if (!err1) {
				//if current dataobject details 
				if (details.data.res) {	
					
					var objectName = '';
					var dataobjectName = '';
					var description = '';
					var defaultStage = '';
					var pool = '';
					var parentid = '';
					var currency = '';
					var attributes = '';
					var roles = '';
					var relations = '';

					for(var key in details.data.res[0]) {
						if(details.data.res[0][key]) {
							var value = details.data.res[0][key];
							console.log("key:"+key+", value:"+value);

							if (key.includes('|ATT|')) {
								//attributes.set(key.replace('|ATT|',''),details.data.res[0][key]);
								attributes += '<attribute><name>'+key.replace('|ATT|','')+'</name><value>'+value+'</value></attribute>'
							} else if (key.includes('|ROL|')) {
								//roles.set(key.replace('|ROL|',''),details.data.res[0][key]);
								roles += '<user_role><user_code>'+value+'</user_code><role>'+key.replace('|ROL|','')+'</role></user_role>';
							} else if (key.includes('|REL|')) {
								//relations.set(key.replace('|REL|',''),details.data.res[0][key]);
								relations += '<relationship><dataobjectid>'+value+'</dataobjectid><type>'+key.replace('|REL|','')+'</type></relationship>';
							} else {
								if(key == 'object') {
									objectName = value;
								} else if(key == 'name') {
									dataobjectName = value;
								} else if(key == 'description') {
									description = value;
								} else if(key == 'pool') {
									pool = value;
								} else if(key == 'stage') {
									defaultStage = value;
								} else if(key == 'parentid') {
									parentid = value;
								} else if(key == 'currency') {
									currency = value;
								}
							}
						}
					}

					if (objectName && dataobjectName && pool && defaultStage && parentid && currency) {
						methods.createDataobject(objectName, dataobjectName, description, defaultStage, pool, parentid, currency, attributes, relations, roles, logger, function(err2, result) {
							if (err2) {
								logger.error('copyDataobject.createDataobject error : ' + err2);
								callback(err2, null);
							} else {
								var HTML = '<!doctype html>'+
											'<html>'+
											'<head>'+
											'<title>Dataobject Copie</title>'+
											/*'<meta name="description" content="Our first page">'+
											'<meta name="keywords" content="html tutorial template">'+*/
											'</head>'+
											'<body>'+
											/*"Le dataobject <b>"+dataobjectName+"</b>, a été recopié avec succès.<br>"*/ "Nouveau dataobject name: <b>"+result+'</b>'+ //'Content goes here.'+
											'</body>'+
											'</html>';
								callback(null,HTML);
							}
						});
					} else {
						console.log("objectName:"+objectName);
						console.log("dataobjectName:"+dataobjectName);
						console.log("pool:"+pool);
						console.log("defaultStage:"+defaultStage);
						console.log("parentid:"+parentid);
						console.log("currency:"+currency);
					}

				}
			} else {
				logger.error('copyDataobject.executeStoredSelector('+tenantConfig.triskell.stroredSelectors.getEBdetails+') : ' + err1.message);
				callback(err1, null);
			}
		});
	},

	createDataobject : function(objectName, dataobjectName, description, defaultStage, pool, parentid, currency, attributes, relations, roles, logger, callback) {
		extJS.login(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.password, function(errLogin, responseLogin) {
			const authash = responseLogin[0];
			const jsessionid = responseLogin[1];
			var dataobjectId = '';
			var generatedName = '';
			
			extJS.createDataobject(tenantConfig.triskell.server, authash, jsessionid, 
								objectName, 
								dataobjectName, 
								description, 
								defaultStage, 
								pool, 
								parentid, 
								currency, 
								attributes,
								'', //childs
								relations,
								roles,
								logger, function(errCreation, responseCreation) {
				if(errCreation) {
					console.log(errCreation);
					console.log(responseCreation);
					logger.error('Error when creating dataobject from ' + dataobjectName + ', ' + errCreation );
					callback(errCreation, null);
				} else {
					//console.log('responseCreation : ' + responseCreation);
					for(var id in responseCreation.dataobjects.dataobject){
						//console.log('name : ' + responseCreation.dataobjects.dataobject[id].name);
						if(responseCreation.dataobjects.dataobject[id].name.toString() == dataobjectName.toString()) {
							dataobjectId = responseCreation.dataobjects.dataobject[id].dataobjectid;
							generatedName = responseCreation.dataobjects.dataobject[id].name_generated;
							break;
						}
					}
					if (generatedName) {						
						//console.log('dataobjectid : ' + dataobjectid);
						logger.debug('Success when creating dataobject from ' + dataobjectName + ', NEW dataobject name :' + generatedName );
						//callback(null, generatedName);
						callback(null, '<a onclick="onAttrRelValueClick(event)" data-objectidd="'+dataobjectId+'" data-relationid="'+dataobjectId+
							'" class="field-fake; x-edit-underline" data-="" href="javascript:void(0)" onmouseover="checkPermissions(event)" onmouseleave="removeRelLinkStyles(event)">'+dataobjectName+'</a>');
					} else {
						callback('Unexpected error when getting dataobject name generated', null);
					}
				}
			});
		});
	},

};

module.exports = methods;

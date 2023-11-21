const https = require('https');
const pptxgen = require('pptxgenjs');

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

	renderProjectHTMLiFrame : function(dataObjectId, identifier, logger, callback) {
		extJS.login(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.password, 
			function(err, response) {
				const authash = response[0];
				const jsessionid = response[1];
				console.log('authash : ' + authash);
				console.log('jsessionid : ' + jsessionid);
				
				extJS.GetRequestIdentifierData(tenantConfig.triskell.server, tenantConfig.triskell.login, authash, jsessionid, identifier, logger, 
					function(err, response) {
						if (response.data) {
							dataObjectId = response.data.dataobject_id
							console.log('dataobject_id : ' + dataObjectId);
							var parameters = tenantConfig.triskell.parameters.dataobject_id+"#"+dataObjectId
							//extJS.executeStoredSelector(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, tenantConfig.triskell.reports.getFlashReport, parameters, logger, 
							extJS.executeReport(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, tenantConfig.triskell.reports.getFlashReport, parameters, logger, 
							function(err2, response2) {
								//
								if (response2.data.getProjectFlashDetails.res) {
									var fillLabel = 'e87b3a'; //203764
									var fillValue = 'D9D9D9'; //D9E1F2
									//var data = response2.data.getProjectFlashDetails.res;
									/*
									dataobject_name as name,
									$_$SponsorProjet as sponsor,
									$_$DepartementProprietaire as departement,
									$Realisationdumois as realisation
									*/

									for(var id in response2.data.getProjectFlashDetails.res) {
										var name = response2.data.getProjectFlashDetails.res[id].name;
										var sponsor = response2.data.getProjectFlashDetails.res[id].sponsor;
										var departement = response2.data.getProjectFlashDetails.res[id].departement;
										var realisation = response2.data.getProjectFlashDetails.res[id].realisation;
									}
									/*
									var actions = [];
									actions.push([
										{ text: "Date", options: { align: "left", color: 'FFFFFF', fill: '${fillLabel}'} },
										{ text: "Propriètaire", options: { align: "center", color: 'FFFFFF', fill: '${fillLabel}'} },
										{ text: "Type", options: { align: "right", color: 'FFFFFF', fill: '${fillLabel}'} },
									],);

									var actions2 = [];
									actions2.push([
										{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Date', style:'tableTitleContentLabel'}, 
										{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Propriètaire', style:'tableTitleContentLabel'},
										{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Type', style:'tableTitleContentLabel'}
									],);
									*/
									var rows2 = `[
										[
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Description', style:'tableTitleContentLabel'}, 
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Date', style:'tableTitleContentLabel'}, 
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Propriètaire', style:'tableTitleContentLabel'},
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Type', style:'tableTitleContentLabel'}
										],`;

									var rows = `[
										[
											{ text: "Description", options: { align: "center", color: 'FFFFFF', fill: '${fillLabel}'} },
											{ text: "Date", options: { align: "center", color: 'FFFFFF', fill: '${fillLabel}'} },
											{ text: "Propriètaire", options: { align: "center", color: 'FFFFFF', fill: '${fillLabel}'} },
											{ text: "Type", options: { align: "center", color: 'FFFFFF', fill: '${fillLabel}'} },
										],`;

									if (response2.data.getProjectFlashActions.res) {
										for(var id in response2.data.getProjectFlashActions.res) {
											/*
											$DateEstimee as datee,
											$TypedEvenement as typee,
											$_$Proprietaire as ownere
											*/
											/*
											actions.push([
												{ text: response2.data.getProjectFlashActions.res[id].datee, options: { align: "left", color: '000000', fill: '${fillValue}'} },
												{ text: response2.data.getProjectFlashActions.res[id].typee, options: { align: "center", color: '000000', fill: '${fillValue}'} },
												{ text: response2.data.getProjectFlashActions.res[id].ownere, options: { align: "right", color: '000000', fill: '${fillValue}'} },
											],);
											*/
											rows = rows + `[
												{ text: "${response2.data.getProjectFlashActions.res[id].desce}", options: { align: "center", color: '000000', fill: '${fillValue}'} },
												{ text: "${response2.data.getProjectFlashActions.res[id].datee}", options: { align: "center", color: '000000', fill: '${fillValue}'} },
												{ text: "${response2.data.getProjectFlashActions.res[id].ownere}", options: { align: "center", color: '000000', fill: '${fillValue}'} },
												{ text: "${response2.data.getProjectFlashActions.res[id].typee}", options: { align: "center", color: '000000', fill: '${fillValue}'} },
											],`;
											rows2 = rows2 + `[
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: "${response2.data.getProjectFlashActions.res[id].desce}", style:'tableContentValue'},
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: "${response2.data.getProjectFlashActions.res[id].datee}", style:'tableContentValue'},
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: "${response2.data.getProjectFlashActions.res[id].ownere}", style:'tableContentValue'},
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: "${response2.data.getProjectFlashActions.res[id].typee}", style:'tableContentValue'}
											],`;
											/*
											actions2.push([
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].datee, style:'tableContentValue'},
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].ownere, style:'tableContentValue'},
												{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].typee, style:'tableContentValue'}
											],);
											*/
										}
									}
									
									rows = rows + `]`
									rows2 = rows2 + `]`

									/*
									$Centredecouts as centrec,
									$TypedeCout as typec,
									CASE WHEN YEAR(startdate) = YEAR(now())-1 THEN SUM(unit) ELSE 0 END as previousy,
									CASE WHEN YEAR(startdate) = YEAR(now()) THEN SUM(unit) ELSE 0 END as currenty,
									CASE WHEN YEAR(startdate) = YEAR(now())+1 THEN SUM(unit) ELSE 0 END nexty,
									SUM(unit) as total
									*/

									var budget = `[
										[
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Centre de coûts', style:'tableTitleContentLabel'}, 
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Type de coûts', style:'tableTitleContentLabel'},
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Années passées', style:'tableTitleContentLabel'},
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Année en cours', style:'tableTitleContentLabel'},
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Années suivantes', style:'tableTitleContentLabel'},
											{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Total', style:'tableTitleContentLabel'}
										],`;

									if (response2.data.getProjectFlashBudget.res) {
										for(var id in response2.data.getProjectFlashBudget.res) {
											if (response2.data.getProjectFlashBudget.res[id].centrec) {
												budget = budget + `[
													{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: '${response2.data.getProjectFlashBudget.res[id].centrec}', style:'tableContentValue'},
													{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: '${response2.data.getProjectFlashBudget.res[id].typec}', style:'tableContentValue'},
													{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: '${response2.data.getProjectFlashBudget.res[id].previousy}', style:'tableContentValue'},
													{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: '${response2.data.getProjectFlashBudget.res[id].currenty}', style:'tableContentValue'},
													{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: '${response2.data.getProjectFlashBudget.res[id].nexty}', style:'tableContentValue'},
													{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: '${response2.data.getProjectFlashBudget.res[id].total}', style:'tableContentValue'}
												],`;
											} else {
												budget = budget + `[
													{colSpan:2, border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: 'TOTAL', style:'tableContentValueTotal'},
													{},
													{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: '${response2.data.getProjectFlashBudget.res[id].previousy}', style:'tableContentValueTotalleft'},
													{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: '${response2.data.getProjectFlashBudget.res[id].currenty}', style:'tableContentValueTotalleft'},
													{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: '${response2.data.getProjectFlashBudget.res[id].nexty}', style:'tableContentValueTotalleft'},
													{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: '${response2.data.getProjectFlashBudget.res[id].total}', style:'tableContentValueTotalleft'}
												],`;
											}
											
										}
									}
																								
									/*
									[
										
									]
									*/
									budget = budget + `]`;

										/*
										x.year,
										SUM(x.affecte) affecte,
										SUM(x.previsionnel) previsionnel
										*/

									var dataChartAreaLine = `[
										{
											name: "affecte",`;
									
									var labels = 'labels: [';
									var valuesA = 'values: [';
									var valuesP = 'values: [';
									 if (response2.data.getProjectFlashBudget2.res) {
										for(var id in response2.data.getProjectFlashBudget2.res) {
											labels = labels + `"${response2.data.getProjectFlashBudget2.res[id].year}",`;
											valuesA = valuesA + `${response2.data.getProjectFlashBudget2.res[id].affecte},`;
											valuesP = valuesP + `${response2.data.getProjectFlashBudget2.res[id].previsionnel},`;
										}
									}
									dataChartAreaLine = dataChartAreaLine + labels.slice(0, -1) + `],` + valuesA.slice(0, -1) + `]},`;
									dataChartAreaLine = dataChartAreaLine + `{ name: "previsionnel",`;
									dataChartAreaLine = dataChartAreaLine + labels.slice(0, -1) + `],` + valuesP.slice(0, -1) + `]},`;

									dataChartAreaLine = dataChartAreaLine + `]`;
								} else {
									callback(err2, null);
								}
								/*
								if (response2.data.res[0]) {
									var data = response2.data.res[0].x;
								}
								*/

								//Google chart test
								var html1 = `<html>
											<head>
												<meta charset="utf-8">
												<meta name="description" content="">
												<meta name="author" content="">
												
												<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
												<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
												<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@latest/dist/pptxgen.min.js"></script>
												<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/vcailleaud/genPPT@1.0.2/scripts/pptgen.js"></script>
												<script src='https://cdn.jsdelivr.net/npm/pdfmake@latest/build/pdfmake.min.js'></script>
												<script src='https://cdn.jsdelivr.net/npm/pdfmake@latest/build/vfs_fonts.min.js'></script>
												<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
												
												<script type="text/javascript">
													// Flash Report
													function flashPPT() {
														let pptx = new PptxGenJS();

														pptx.author = 'Vincent CAILLEAUD';
														pptx.company = 'Triskell Software France';
														pptx.revision = '1';
														pptx.subject = 'Flash Report';
														pptx.title = 'Flash Report';
														
														//LAYOUT_16x9	Yes	10 x 5.625 inches
														//pptx.layout = 'LAYOUT_NAME';
														
														pptx.theme = { headFontFace: "Montserrat" };
														pptx.theme = { bodyFontFace: "Montserrat" };			
											
														let slide = pptx.addSlide("${name}");;
														
														//Title
														let title_label = {x: 0.25, y: 0.25, w: 1.5, h: 0.30, align: 'center', fontSize: 10, color: 'FFFFFF', fill: '${fillLabel}'}; 
														slide.addText('Projet', title_label);
											
														let title = {x: 1.75, y: 0.25, w: 4, h: 0.30, align: 'center', fontSize: 10, color: '000000', fill: '${fillValue}'};
														slide.addText('${name}', title);
														
														//Logo
														//let boxHeight = 0.7, boxWidth = 2, poxY = 4.9, poxX = 8;
														let boxHeight = 0.7, boxWidth = 2, poxY = 0.1, poxX = 7.5;
														slide.addImage({ data: "image/png;base64,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", x: poxX, y: poxY, w: boxWidth, h: boxHeight });
											
														//Actors
														let sponsor_label = {x: 0.25, y: 0.56, w: 1.5, h: 0.25, align: 'center', fontSize: 8, color: 'FFFFFF', fill: '${fillLabel}'}; 
														slide.addText('Sponsor Projet', sponsor_label);
											
														let sponsor = {x: 1.75, y: 0.56, w: 1.95, h: 0.25, align: 'left', fontSize: 8, color: '000000', fill: '${fillValue}'};
														slide.addText('${sponsor}', sponsor);
														
														let direction_label = {x: 3.70, y: 0.56, w: 1.5, h: 0.25, align: 'center', fontSize: 8, color: 'FFFFFF', fill: '${fillLabel}'}; 
														slide.addText('Département Propriétaire', direction_label);
											
														let direction = {x: 5.20, y: 0.56, w: 0.55, h: 0.25, align: 'left', fontSize: 8, color: '000000', fill: '${fillValue}'};
														slide.addText('${departement}', direction);

														let realisation = {x: 0.25, y: 1, w: 5.25, h: 1.75, align: 'left', fontSize: 8, color: '000000', fill: '${fillValue}'};
														slide.addText('${realisation}', realisation);
											
														//Table
														let rows = ${rows};
														slide.addTable(rows, { x: 0.25, y: 3, w: 9, rowH: 0.25, align: "left"});
														
														//Line chart
														let dataChartAreaLine = ${dataChartAreaLine}
											
														slide.addChart(pptx.ChartType.line, dataChartAreaLine, { x: 5.5, y: 1, w: 4, h: 2 });
											
														pptx.writeFile({ fileName: "Flash report.pptx" });
													}
													function flashPDF(){
														var dd = {
														pageSize: 'A4',

														pageOrientation: 'landscape',
														pageMargin: [40,80,40,60],
														header: {
															columns: [
															{},
															{
															//image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAAD6CAIAAAAHjs1qAAAACXBIWXMAAC4jAAAuIwF4pT92AAABNmlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjarY6xSsNQFEDPi6LiUCsEcXB4kygotupgxqQtRRCs1SHJ1qShSmkSXl7VfoSjWwcXd7/AyVFwUPwC/0Bx6uAQIYODCJ7p3MPlcsGo2HWnYZRhEGvVbjrS9Xw5+8QMUwDQCbPUbrUOAOIkjvjB5ysC4HnTrjsN/sZ8mCoNTIDtbpSFICpA/0KnGsQYMIN+qkHcAaY6addAPAClXu4vQCnI/Q0oKdfzQXwAZs/1fDDmADPIfQUwdXSpAWpJOlJnvVMtq5ZlSbubBJE8HmU6GmRyPw4TlSaqo6MukP8HwGK+2G46cq1qWXvr/DOu58vc3o8QgFh6LFpBOFTn3yqMnd/n4sZ4GQ5vYXpStN0ruNmAheuirVahvAX34y/Axk/96FpPYgAAACBjSFJNAAB6JQAAgIMAAPn/AACA6AAAUggAARVYAAA6lwAAF2/XWh+QAAAcLklEQVR42uydeVQUV7rAa+2FzQZRVAwoYpQIoqK4MaBJBBMjMQlJXKJxxiXGxGSciNuDSWYkxqizqJgZY3R8gwFnYlxQIqDxIbgF4woGF1ZZFKLQyNJdXdv7oxNC6Kap7q5qupvvdzw5J0XXdutXX3331r23UJ7nEQDoGWBQBADoDgCgOwCA7gAAugMA6A4AoDsAgO4AALoDAOgOAKA7AIDuAOgOAKA7AIDuAAC6AwDoDgCgOwCA7gAAugMA6A4AoDsAgO4A6A4AoDsAgO4A4GAQUAQODU81s6Xn2OJc7sFNrr6Cf3wf4XkEw1GP/ni/p/AhvyGCX0B7DYCC0oPCHJGOqTnPlp6lL+1nbmYgLG3yCmNESKwsej3m5Q/FBro7HswPmbpTn3IPfjBjHZyUR68nI95GUBR0BxwDrqaAOrqGrbxsYeY6YoZi9i4EJ0F3wM5DOqX7dosu7zOEY62qqwXFKOb9C8Fw0B2w16D+411t6iKu9rYoW5NNeV8WvR50B+wyrBccpb5eyetaRNymcvEhPGByDyxMaHe3a3TfbtWmLRXXdQRBqCOru2jPAd0B22YwLHX4A923WyTZ9sNi+nIa6A7Yi+vatCX0pf3S7YHO3YnwHOgO2IHrX73L3MyQdif15WxxLugOdCs8rz34HnP9kA12RV/9L+gOdGvd9OQnzLWDttkXe/tbK1vxQXfAcpir/9XlbLPdg0SjZmtugO5AN8BW5GsP/cHW1YTy70B3wOYZe0u9Nm2p7dvC2fuFoDtg8+rpV+/wj+/bfs9c7S3QHbBt9TRvJ3vndPfcaA2VoDtgw/j6413dqU+77bmiUSO0BnQHbCM7Sx18D2F03ZlJtTaA7oAtoM/vZiuvdHPFgWoG3QHpPWuq1Z3a3P3HwepAd0ByqKyPRe/ZC4Du9ghbdZXpeV1WQPceiu7EnxE7GUcmd+s5xQ7TKnVHaC89z5adF32zqEc/zMsfdfFEUJzXtfCPyrj6iq7XUqpAd0DK0J69UTTF3byJETPwwCn4kAhU4dGxNtzawN45TV850GnXdhQ1XMuJgaHZNg/td05r9s2xfjt4wCRywiIiKEbIvDFc1TUqI5GtyDd4IPR3XXsNojsgWWjP+8xa0Z8YI4tJxAMmmVFFGzhKufSoLme77tSm9nUGTOXbowofdLcp3IMitiTP8mexq5f8hY+J0JctWhmTTf095vmE9qt320apoj1s4kjQ3abQ53ZZfqlGzpLP3Ii69rbqeo96Rc5S1Ncrf4rufYeB7oAk8FQTfeOwRVdJJp/5CTnuDVEOgwyby1UX0Bf3IgiC+QzvUZcA2t1tB3P1IEJrzc5BVANdlmWI5boe+XN/xLwGIQiCDwgB3QFpMpnLB8y+PP1HuCzLwAaMFPlQSKXs+T+hHv172pcOIJmxVSW1vpyrvmbWKviQCMW8f0nULk48NZ378W5Puwqgu60ymWvmTR2DB0xWLvgSIRXSHZIs8p2edhUgmbGV7ubMCoYHTFa+Ka3rCIIgKAa6Awjf8ohvqhNzg401nOAx/5hvqGLBfoRUwoWAZEYCuXWtXOVlrqaAvX+Tqy3iH5Whbn2VSw6LuAvm9rdCA67KV7lgPypzgesCuotYc2TZe9+zt08xJblcTUH7ueNQpUrxu/+I22Qh8E0qKndTLtiPuvcFL0F3USI5z1bkM9cOMgXpvEZt9CeK1z/Tt0mLudNSQbrLX/sM6/cUSAm6W60c1cxcOUBf2Ms9LDHxMzJsLv7kMyI/SB4W8y31Xf6MnLyUCIoBI0F3K1PzFvrsLvrsP3jt4y5yCZmLLOZ/xM+bqq51XT0dOEo+/Y+gI+hujekc/X2qLvtjIcEVQRAibC7q5i36UbBd6Y7KXBSzP+/JnzsF3a2OqY/KqK/eZe99L3wVcuwcSY6kq89by6YnwhfcQXfLYa4dpI7E87pW4augHv2x/sGS6G7yXT0+aDw5fiGICLpblsDwupOfWPBRANwvTJLD0T7mm3/sfK+k/JW/98C3m6C7OK5T6Wvo7/7XglWx3gGSHJG62lQaE7FMov0Cxq+yM50MdeIjy1xHEARR9pJE98c1naZPbn3IKb8HBUF3y/L1r+mz/7R8fWm+nMG3POq8hpqA9qQpjUB38axqrKGOxFu1heaHkhyYptF4ufcdSo5+DfwD3S1KYzISrZxelKu7LY3uauOh/elVUEOFqqpFptbeYgqPW7uRyssIo0MImS1iTN+hREisNI85jvuxmKu7wz0q5dVVfKua16gRlkZIJapwQ919sN6Dsf7BuG8oQshBd4eEvvCFCJ7oWpmSM8SwaTY4YJFDO89x1TeYuzlsaR5XeVXQU45UEkOjiNGvE0ExCIaD7g6UtnPMD5niVHa/TxVfdwOtUdVAIvgFMU6cZyu+YwrSmcLjfFOtmRFCw/yQyfyQiXn6yaYnECEvgu4OksnU3TH1Hscs3X84wdXdwfo+KabtcveOoX3iIgSzqtj55of0lQNMfgpXX25t6TXc06Ytxa/8V/Hazp4wFTDmBLqL96DgqW8+Ejm4d2jOJ5XEuHmWn+zDEurIqpbNY3SZG6x3vQ329ilN8jS+sQZ0t/tc5vEDEbfG3vmWuXFUTN1/PTSJDHkRVVjyPot7VKY98Fbr3ybT+SkIQ4kfNRruaXa/JO4IXdDdAaCOxHMN90TT3fOJX+WOFnW6ZCsvUwffYwqPS/rBD66+XHvgrbbZUkF3+6x9iNygxmsbtfsXivWRMMxrUFumjvUejPuPt2Aj+BNhyreOuSbeVsz9ggiKQVBUorJky87T+f8G3e34BHoPFj/O3b+pTVkgTrcCjMB8fppllxg5yxpTUbkbETxTMf/fLivPESNmSFSeutN/sWAiS9DdVifgO1KKaMeWnNX8+w1RPqCO+439SXeRXi1h3kMU8/Yq3tgnRVsK31Rn4TTFoLsNQJUq3HeUJE/2uzmaPXEm+ngJ1T0gAkEQzMtf3FkGiKeeU76dIcWcpuJW1kF3sbP30XFS5bL3vm9NftasEYBGdB86BcFJfHi0+BfPO1C5+JCVHzgwlsGfk6LxB3QXS/fXpPt8HN9Yo/n8RfrsPy1uFUEVHsTQqcTQKRJVXRSv/1PkjTI6Z50c2Bl0RxUe5G+knMyWY6hvPtR8HmvxKy1y4iI8YLJER4cHRpJhc0U+4/p7oLv9IotYJkUTza8e8RX5rTue1mVvtKCNEh86RdIpTmXRa8Wdt8PEICzQ3Q4gFfK47ZJ37mNpXc621i1j6fO7JRr9ZOHzzd1H5G5eHAe62zW4f7g8JsEGO+Jb6qnjCS1bw+m8z7qcmcx29/uolxGg5+iOIAj5m+Vk+ALb7ItvrKFO/Kn109FURiJXe6v77/bBk8TMZ5x08Iez9ZmRx26y8Cu7lklPNdPnPm/dFtWaPI0+v7s7u1iRSqxPoGhaOOnXtJ1uWiUMV7yaTCk86O/22XK3XM0NquYGlZGI+47Cg6YTw6dh/Z6SrnOL8VP39OMeFIlTGVANdErdUV7KTnbdCH32H1TmhvbfKbB1ySpVuH84NngC7h+O+QTZYI4NKn2d/uPAVsdAmduHpU45RavTTolKRryNDRyjPfAW//h+txwAr1Ezt7KRW9k/h94nsH5PYX2HoaqBmMoXVQ1EPfp12emFb21AUFRo3xiRGqbwASOddTpiZ57wGh803mXFaerYWnvoBMI1VHINlUhR1q8fASiq6IUqPBBFuzF+HMNTLQij5Vsb8AEjFW9+aet80D/cWZVw8s8ZoK5eitmfM6NfpY6uMT1dY/fA87xG3dlcNMSY1xUvfmrG+ymR+ugTw551Vh96xGgmYtg015XnZdHrpetaI3rer3g1WRG33ax3sZwY9zPq2hsfNAF0d/RcXiGb8r5L/CVZ1ArD2QHsyXSUGBXn8vs8YvSrZj8qGipFCA1OPfOM07bMmNKCama+T9Wd28Wrq+yrsjF0qjx6HeYbaslJ6Vpa/hRo/UhT5fJMfOBo0N3p4Fi2JJe+8h/m5jfd3L0bJ4mQF2URy7ABIRZvgy3J0+yxtt8/5hvq8k62M6e1SI8Fw/GhU/GhU3ntY7YokynKZu+cFmtEtlDPnxhDhL5MhL6CunpZuSm2Il+EjG/Cb5286aLnRndDGB1bfoEtyWPLv2OrrkrU5xGVu+GDJuLDnsGHPYv9eloOa9B8Np2tumrV7e81yOUP56yc4QyiuwMVhgwPjMIDoxAEQRiKrbrK3b/J1RZxD4q42ts81WRpzFRifYbiA4KxASH4E2FY/2DR64K8utpK1xEEIZ9e6dyug+4mCkaOD5rQvkmO16h5dTXXWMM3VvOtDbxGjWgaeY5FqJ/7AGMkInNB5W6owh116Y26+6Ae/TAvP9Sjv+SPpZvWzveN9R5Mjopz/qsKYgtNQpQqVKnC+o+wuyPjefpSipXbkL2wwelDOwKT5jkBbNl5rs6qkdTE8GjbTGwPugPWQl/YY13OrpDN/LiHlBXo7thwNQXMD99YswX5cx9inn6gO+AA6E5vtWZaYHzoFHL8b3tOcYHujhzaq69b86EeVKlSvPJ3Gw+5At0Bi+B5Kn2d5aujmGL2Lhs0koLugBg11CtpbOVli1eXPbsGl2YeP9AdEDuytzboMpMsXp0YMUM25f0eWG6gu0NCHV1j8UzcuN9YxWs7e1TKDro7MMz1Q0yBhaNvMe8hivkpkk5YCboD4qUx6irq6BoLa6ce/RW/PWB9Z2PQHbBNYKc0Xy6ybGJK1KO/csnhnvNGCXR3gpR9LVd9zXLXJZ4THHQHRIO++C/6cqol19jTD1z/6baH0UyOkcUUZWn3L7Rg5DU2YKRyYSrq1gfKEIH+7g4Be+977YGlFriOD52qmLcHlblCGUIy4xhwD4q0KfMt+LQvOXGx8s394DpEd0dyXbPnZb6l3syrKpPP2kKOmQ0FCLo7ueuY9xDFnM+x/sFQgKC747hefU2zb465rpNjZstiN0ICA7o7VN30zreaLxchtEb4KqhbH/msLcRTz0Hpge6OBH05lTq8yqzvjpBjZsue/wh18YTSA90dKINhqcw/02fN+Og71i9IHrvJiaeoBt2dE761QZu2mC05KzR7ce8re3YtGTbbieenBt2dNFkvv6j9z9t8o6BPs6MunuRvlssmLemx/XhBdwdOYHSn/6L7v78JeWmKefqREW8RYXOg7QV0d0DVa29pD77fdSdHFCOGPUOMnUcMj4bUBXR3QBid7sw2Xc42U9Nqoyg+cDQR8iIxchbq0Q/KDHR3TNVvZeuOJ3L15cYzlt4BmP84YkgEPvRp1M0biktEoAOwzROYB0X0lQN8yyNEP2E8LkcVbqi7D+oxAOsTiPULEvrRYAB0BwBTdX0oAgB0BwDQHQBAdwAA3QEAdAcA0B0AQHcAAN0BAHQHANAdAEB3AHQHANAdABwea4d3zJgxo6WlRYoji4uLe/fdd6XYMtdQ2bplrOFyctIS+QtJ4IS4ZGZmbtq0yXB5UlJSREREh4XFxcWLFy82/PHChQsXLlwI0R0AQHcAkCKZ8fHxMZ3MNDU1tba2Gi739vbGcVOD6t3d3SU6ZxTDUdVAI8th0jnQ3TR79+41/YPk5OSDBw8aXd6vX/eMrkd7DXBdfRmuPSQzAAC6AwAkM91Oa2trWVlZY2NjU1OT0SkVQkJCfH19OyzUaDRnzpwx/LG/v39QUJDwvavV6nv37jU1NTU1NQn5vVKpjIqK6uyvV65cqaurM1w+ffp005stKCiorq62YMXOoCiqtLRUX6os+8u82y4uLm5ubgMHDuzbty/objsqKyuzs7Pz8vIqKipMTxyydu1aQ90bGxuNtgTHxcUJ0f3WrVtZWVkXL168f/++udV6E7p//fXX586ds8DajIyMzMxM63Wvra09efJkTk5OaWkpx5masNLT03Ps2LHR0dFhYWEYhoHuUlFXV7d79+5Tp051y/Q4JSUlO3fuvHLlipM94tVq9b59+9LT001b3kZDQ8PJkydPnjwZEBDw9ttvjxs3DnQXn4sXL27YsEGil7hdcvjw4eTk5PYPd+egsLAwMTGxoaHBgnVLS0vj4+Pj4uKWL1/uEGHeYXS/fPlyQkICwzCGfxo3btzw4cONtuIHBgaKsvcjR45s27bNSPERREREhJ+fn5CL7ebmZm+levfu3VWrVmm1Rj7aGhoaGhwcTJJk+2wnNzfXMNwcPHiQpumVK1eC7uKg0WiSkpIMXVcoFJ988sno0aMl3XtVVdXOnTsNl/ft23fLli3+/v4OGtdZlk1KSjJ0HcfxhISEqVOnGq6ydOnS9evXFxUVdVh+9OjRCRMmTJw40c5P2THqGVlZWUaftsuWLZPa9bboZbh83bp1jus6giAXLlyoqKgwXD537lyjrusrqRs2bGgf8ttIS0uz/1N2DN1v3LhhdPm0adNssPdr164ZDe02uNMk5fr160aXR0dHm1jL29s7LCzMaB3AaKoJupuN0dDu6urq6mqLb7ZoNBqHSMTNpbPXBZ6eXfQdUqlUhgs5jjNaBwDdzUZgA5ktqaqq6q42IsDJdbdDdDrdnj177KQeb+S6YnBljQAfq7GcQ4cONTc3z5s3z8/PD0XR7jqMR48eGS7s06cPXCDQ3RJM9MvPzs7Ozs5uv4QkSXd3dw8Pj4CAgKCgoEmTJhn2YhA3tN+9e9dw+YgRIyR9shldbrTFBnR3MAIDA2tqagT+mKbp+vr6+vr68vLy06dP79y5Mzg4+M0335ToTfvJkycpijJcbnH/MCEnaLSpysPDQy6XQ+7u8MyYMcOa1QsLC+Pj49etW/f48WNxD6y2tvaLL74wXD5mzJjw8HCJSmPXrl319fWGyx2i5wxE964ZP378008/ffr0aWs2cuHCheXLl2/fvt3Ly8usFYuLiw0Xchx3586dvXv3Gt5Cnp6ea9asseZQS0tLXVxcDJffv3//2LFj+fn5RteaNWsW6O4krF69urm5ubMrLZCqqqoPP/xw+/btZtVrjU5EYQIvL6+rV68+88wzFmfS7733nrmrxMTEhISE2P91hGRGEAqFYtOmTUuXLlUqldZsp6CgIC8vT9JDLSkp2bRp07x586TeURthYWEffPCBQ1xH0F1wSWHY3LlzU1NT33jjDR8fH4u3k5OTY4OjraurS0xMNJrZixsFFixYsHnzZplM5hAXEZIZ8/D09Fy8ePGiRYvKyspu3bpVXl6uH7zXNtyEYZiSkpKHDx92tgVzx0BNnjzZ9A9Yli0rK6utrTX80/79+z09PV955RWz9jhhwgTTc6JgGObp6Tl8+PBJkyYZ7VAAujsVKIoGBAQEBAQY/SvHccePH9+2bZvRsSCdNVp3xscff9zlb3ieP3HixF//+lfDTlq7du2Kiory9vYWvseEhAQn6BEEyYzt0p7Y2NhFixbZ8vZ7/vnnly1bZvTuysjIgIsCukvLSy+9ZDolEJ3Y2FijL3o66z4NugOioVQqe/XqZSR9JKRKIGUymdE6tFqt7uyZ0FlqBLoD5tHU1GTUM2tadbrErLb2zqaLuXfvHugOmEdaWprRbvqTJk2ykyPs7EhSU1OdNcCD7uJDUdS+fftSU1MN/zR48GDbDDgUwrBhwyIjIw2Xnzt3bvPmzaL38LEHoCFSKO+//75A18vLy40OY1OpVBs2bLBx/dU08fHxlZWVZWVlHZafOHHi1KlTgwYNMtp5xpDVq1dL2s8ZdLc1nQ1kFsiTTz750UcfDRgwwK5Oyt3dfceOHRs3bjx//nyHP9E0bbQnvVGMjqgC3XsiPj4+CxYseO655+xzQJ2bm9vGjRsvXLiwZ88eo70vIZkBusDV1XXw4MFBQUGTJ08eOXKk/Y8cnThx4sSJE4uLi3NycoqKikpKSjprvnRoUKnr4BRFGZ2TyMXFRbgEGo3G8IU8iqKWTbzBcZzR7+eQJGliPE5zc7PA7SuVSgsSdK1Wa3SeFrPe57e2tho2B2EYJjAFF1JKRjFxNWmaNjreSqFQGL6C6GynMplMlF5oqBO/UwCAjnc+FAEAugMA6A4AoDsAgO4AALoDP8MW5zIF6R0WcvUVQn4GWIDDvGai81Po3B16FfDASHlMAuYbKmRFpiCdKTzWpgsREksEzyRCYoWsq01b0sEzIiRWMWe30R/rspJ0Z3YYLnd5J7uzQ2Wrr+uykuSaRjJ8fvudKubsxrz82+zX7H0VD4wUeMy6rCRZTILwgtWd2aHLSmr7XzwwUjFnN6pUmbUWgiCoUuWaeBt0F8d16sgqPDDSbVU+V31dm7aEKc6VCdCdOrKKzk8hQmJdE2+jShWvUeuykrRpS8iSXPmsrQL3rpizW4hqspgEvWf6m0TIWkRgpC4LYQrT23Tnqq9z1deZgnRZ1Iq22xVBEHxIpJBD5aqv687sQBS92lYXiCxqhSwmQV9c1JH4zm5po2tBMiMyTGE6giCyyBUIgmC+oS6r8oVcTt2ZHXR+iiwmoS1coUqVfNZWWUwCnZ9iNBLbuvR9Q/HASLY4ty2BoS+lIAjCFB5rd+7HUKWqffg3dcq5yahSxVxKsex45LO2okoVW5wLubsdZLrVZvRJ5DVqOjcZ8/I3vDFkUSsw31A6N5nXqLv9pPRhuy1lYotzMS9/rvq63jl9sMcDI7vMLvSnzBbnEiEzufoKa25mXqO2h5Lpubrr47ouK6lDvmgyZT/Ga9R4oPEcgAieyWvUTMExgRl883of/T9t2hKRTy1qBapU6cM5nZ/C1VcQ4+a3hXn9f4ngmYJSvtxkXqMmI1cQIbEWB3j9M1DI3aV/fraVTMuGYaC7SCEwMFIxZzfmG6ovXyHO6eOT6cvGN1TYydnpwzlTmK5/HOkzHH20xrz8hdQceI1aX0vBvPyJYLMDvL7S3Lo1nNeoych3oWWmuw80JJYIiaXzU5jCdKYgXaNRK3/3lekQZSL/4WpuIAiCKHqJWFW1GHLcfKYgnSlMZ4tz9akXERxLFefqspK4+gqBWXtbbqZ/AOozeOEVVtw3lM5PQZW9XFbltzUKQVW1myHD5yt/9xXm5d++etfJ7TFTX+syrHjpmz70DSN2Et0xL386/5e8hQyf37aEHNe17vrQrq8D6M7s0J3ZwWvU5gV4RS9ZTAJXX+HcDfyOobv+EnZcarI6hSpV+odyh7ZzfTvmT0oJa7m3zbPrJ+9/PiT9Esw3VMhB6kO7Ys5ut421bf8wL3+zMngyfD4ZPl+XleTExjtGMsMUHuOqr/MNFfq2c66+QogH+ke5vqEdPRJPhs9nCtJ/eVEluN3dFpcheKbuzI72jev6JUIqqfrQbpjiEyGx+qZYgekQgiDyWVvZ6hvUkXjMN1RISqPP+H95PpjZ2A+6d5o969+A/PRI8g0V/h6ECIykL6W0NbSb9VbVdg9Z31A8MLK9LvolQo5Tl5VktH5JjJuvO7ODvmSG7vqi1uyM1u59Vd820IXu7XJFVKmyf90dbDQTV18hvCLlWHDV1zvoZbgE6Fm6A0APapkBANAdAEB3AADdAdAdAEB3AADdAQB0BwDQHQBAdwAA3QEAdAcA0B0AQHcAAN0B0B0AQHcAAN0BAHQHANAdAEB3AADdAQB0BwDQHQBAdwAA3QEAdAdAdwAA3QEAdAcA0B0AQHcAAN0BAHQHABH5/wEArqUpv+5BXTMAAAAASUVORK5CYII=', 
															image : 'data:image/png;base64,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',
															width: 200, 
															margin: [-25,0]
															}
															]
														},
														styles: {

																tableTitleHeaderLabel: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 15,
																	color: '#${fillLabel}',
																	fillColor: 'white',
																	alignment: 'left'
																},
																tableTitleHeaderValue: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 17,
																	color: 'black',
																	fillColor: '#${fillValue}',
																	alignment: 'left'
																},
																tableFieldLabel: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 11,
																	color: 'black',
																	fillColor: 'white',
																	alignment: 'right'
																},
																tableTitleContentLabel: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 11,
																	color: 'white',
																	fillColor: '#${fillLabel}', 
																	alignment: 'center'
																},
																tableContentValue: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 12,
																	color: 'black',
																	fillColor: '#${fillValue}',
																	alignment: 'left'
																},
																tableContentValueTotal: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 12,
																	color: 'black',
																	fillColor: 'white',
																	alignment: 'right'
																},
																tableContentValueTotalleft: {
																	font: 'Roboto',
																	bold: true,
																	fontSize: 12,
																	color: 'black',
																	fillColor: 'white',
																	alignment: 'left'
																},
																tableTitleSmall: {
																	font: 'Roboto',
																	bold: false,
																	fontSize: 1,
																	color: 'white',
																	fillColor: 'white',
																	alignment: 'center'
																},
															},
															defaultStyle: {
																fontSize: 10,
																color: 'black'
															},
															content: [
																'    ',
																{
																	table: {
																		widths: [100,150,100,150],
																		body: [
																			[
																				{border: [true, false, false, true], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: 'Nom du projet', style:'tableTitleHeaderLabel'}, 
																				{border: [false, false, false, true], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: '${name}', style:'tableTitleHeaderValue', colSpan:3},
																				{},
																				{}
																			],
																			[
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
																			],
																			[
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: 'Sponsor Projet', style:'tableFieldLabel'}, 
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: '${sponsor}', style:'tableContentValue'},
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: 'Département Propriétaire', style:'tableFieldLabel'}, 
																				{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: '${departement}', style:'tableContentValue'}
																			]
																		]
																	}
																},
																'    ',
																'    ',
																'    ',
																'    ',
																{ text : 'Actions Evènements', style:'tableTitleHeaderLabel' },
																{
																	table: {
																		widths: [100,100,100,100],
																		body: ${rows2.toString()}
																	},
																},
																'    ',
																'    ',
																{ text : 'Réalisations du mois', style:'tableTitleHeaderLabel' },
																{
																	table: {
																		widths: [700],
																		body: [
																				[
																					{ border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text : '${realisation}', style:'tableContentValue'}
																				]
																		]
																	},
																	
																},
																'    ',
																'    ',
																{ text : 'Finances - Budget prévisionnel (€)', style:'tableTitleHeaderLabel' },
																{
																	table: {
																		widths: [100,100,70,70,70,70],
																		body: ${budget}
																	}
																}
															]
														}
														pdfMake.createPdf(dd).download('${name}.pdf');
													}
												</script>
												<style>
												.text{
													font-family: Roboto-Medium,sans-serif;
												}
												/* Navbar container */
												.navbar {
												overflow: hidden;
												background-color: #2e3e56;
												font-family: Roboto-Medium,sans-serif;
												}
												
												/* Links inside the navbar */
												.navbar a {
												float: left;
												font-size: 16px;
												color: white;
												text-align: center;
												padding: 14px 16px;
												text-decoration: none;
												}
												
												/* The dropdown container */
												.dropdown {
												float: left;
												overflow: hidden;
												}
												
												/* Dropdown button */
												.dropdown .dropbtn {
												font-size: 16px;
												border: none;
												outline: none;
												color: white;
												padding: 14px 16px;
												background-color: inherit;
												font-family: inherit; /* Important for vertical align on mobile phones */
												margin: 0; /* Important for vertical align on mobile phones */
												}
												
												/* Add a orange background color to navbar links on hover */
												.navbar a:hover, .dropdown:hover .dropbtn {
												background-color: #e87b3a;
												}
												
												/* Dropdown content (hidden by default) */
												.dropdown-content {
												display: none;
												position: absolute;
												background-color: #f9f9f9;
												min-width: 160px;
												box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
												z-index: 1;
												}
												
												/* Links inside the dropdown */
												.dropdown-content a {
												float: none;
												color: black;
												padding: 12px 16px;
												text-decoration: none;
												display: block;
												text-align: left;
												}
												
												/* Add a grey background color to dropdown links on hover */
												.dropdown-content a:hover {
												background-color: #ddd;
												}
												
												/* Show the dropdown menu on hover */
												.dropdown:hover .dropdown-content {
												display: block;
												}
												.btn-orange {
													background-color: gray;
													border: none;
													color: white;
													padding: 12px 12px;
													font-size: 12px;
													cursor: pointer;
												}
												
												/* Darker background on mouse-over */
												.btn-orange:hover {
													background-color: #d46322;
												}

												table {
													border-collapse: collapse;
													border: 2px black solid;
													font: 12px sans-serif;
													}
													td {
													border: 1px black solid;
													padding: 5px;
												}
												
												</style>															
											</head>
											<body style="background-color:white;">
												<div class="navbar">
												<a href="#home">Home</a>
												<a href="https://triskelldo.atlassian.net/jira/software/projects/PRFPRJ226/boards/9" target="_blank">JIRA</a>
													<div class="dropdown">
														<button class="dropbtn"><i class="fa fa-download"></i> Rapport Flash
															<i class="fa fa-caret-down"></i>
														</button>
														<div class="dropdown-content">
															<a onclick="flashPPT()">Au format PPT</a>
															<a onclick="flashPDF()">Au format PDF</a>
														</div>
													</div>
												</div>
												<div class="text">
													<h3>Exemple d'utilisation d'un Embedded Panel</h3>
													<p>3 options de menu disponibles :</p>
													<ul>
														<li>Home : aucune action</li>
														<li>JIRA : Accèder au projet dans JIRA</li>
														<li>Rapport flash : Téléchargement au format PPT ou PDF</li>
													</ul>
												<div/>
												<br>
												<!-- 
												<div class="text">
													<h3>Exemple de manipulation d'un fichier CSV</h3>
													<p>CSV Source File * :</p>
													<input type="file" id="dealCsv"/>
													<div id='container'></div>
												<div/>
												-->
												
												<script type="text/javascript">
												function uploadDealcsv () {}; 

												/*------ Method for read uploded csv file ------*/
												uploadDealcsv.prototype.getCsv = function(e) {
													 
													let input = document.getElementById('dealCsv');
													input.addEventListener('change', function() {
														var filePath = input.value;
														var fileSize = input.size;
														var iConvert = (fileSize / 1048576).toFixed(2);

														// Allowing file type
														var allowedExtensions = 
																/(\.csv|\.txt)$/i;
														
														if (!allowedExtensions.exec(filePath) || fileSize > 1048576) {
															alert('Invalid file type or size : ' + iConvert + ' MB \\n\\n' + 'Please make sure your file is in pdf or doc format and less than 1 MB.\\n\\n";');
															alert('Invalid file type or size : ' + iConvert + ' MB \\n\\n' + 'Please make sure your file is in pdf or doc format and less than 1 MB.\\n\\n";');
															input.value = '';
															return false;
														} 
														else 
														{
															if (this.files && this.files[0]) {
													
																var myFile = this.files[0];
																var reader = new FileReader();
																
																reader.addEventListener('load', function (e) {
																	
																	let csvdata = e.target.result; 
																	parseCsv.getParsecsvdata(csvdata); // calling function for parse csv data 
																});
																
																//reader.readAsBinaryString(myFile);
																  reader.readAsText(myFile, 'UTF-8')
															}
														}
													});
												  }
											  
												  /*------- Method for parse csv data and display --------------*/
												  uploadDealcsv.prototype.getParsecsvdata = function(data) {
											  
													let parsedata = [];
																																
													let newLinebrk = data.split("\\n");
													for(let i = 0; i < newLinebrk.length; i++) {
											
														parsedata.push(newLinebrk[i].split(","));
														
													}
											
													console.table(parsedata);
													
													var lines = data.split("\\n"), output = [];

													/* HEADERS */
													output.push("<tr><th>" 
														+ lines[0].slice().split(",").join("</th><th>") 
														+ "</th></tr>");

													let ln=lines.length;
													if(lines.length>10) {
														ln=10;
													}

													for (let i = 1; i < ln; i++)
														output.push("<tr><td>" 
															+ lines[i].slice().split(",").join("</td><td>") 
															+ "</td></tr>");

													output = "<table><tbody>" 
																+ output.join("") + "</tbody></table>";
																															   
													var div = document.getElementById('container');
													div.innerHTML = output
												  }
											  
											  
												
												var parseCsv = new uploadDealcsv();
												parseCsv.getCsv();
												</script>
											</body>
										</html>
										`;												
								
								callback(null, html1);
								/*
								res.writeHead(200,{'Content-Type': 'text/html'});
								res.write(html1);
								res.end();
								console.log('OK');
								*/
								} 
							) 
						} else {
							callback(err, null);
						}
					} 
				)
			}
		)
	},

	generateflashPPT : function (dataObjectId, user_name, logger, callback) {
		var now = new Date();
		var parameters = tenantConfig.triskell.parameters.dataobject_id+"#"+dataObjectId
		extJS.executeReport(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, tenantConfig.triskell.reports.getFlashReport, parameters, logger, 
			function(err2, response2) {
				//
				if (response2.data.getProjectFlashDetails.res) {
					var fillLabel = 'e87b3a'; //203764
					var fillValue = 'D9D9D9'; //D9E1F2
					
					/*
					dataobject_name as name,
					$_$SponsorProjet as sponsor,
					$_$DepartementProprietaire as departement,
					$Realisationdumois as realisation
					*/

					for(var id in response2.data.getProjectFlashDetails.res) {
						var name = response2.data.getProjectFlashDetails.res[id].name;
						var sponsor = response2.data.getProjectFlashDetails.res[id].sponsor;
						var departement = response2.data.getProjectFlashDetails.res[id].departement;
						var realisation = response2.data.getProjectFlashDetails.res[id].realisation;
					}
					
					let rows = [];
					rows.push(
						[
							{ text: "Description", options: { align: "center", color: 'FFFFFF', fill: fillLabel} },
							{ text: "Date", options: { align: "center", color: 'FFFFFF', fill: fillLabel} },
							{ text: "Propriètaire", options: { align: "center", color: 'FFFFFF', fill: fillLabel} },
							{ text: "Type", options: { align: "center", color: 'FFFFFF', fill: fillLabel} },
						],);

					if (response2.data.getProjectFlashActions.res) {
						for(var id in response2.data.getProjectFlashActions.res) {
							/*
							dataobject_description as desce,
							$DateEstimee as datee,
							$TypedEvenement as typee,
							$_$Proprietaire as ownere
							*/
							rows.push(
							[
								{ text: response2.data.getProjectFlashActions.res[id].desce, options: { align: "center", color: '000000', fill: fillValue} },
								{ text: response2.data.getProjectFlashActions.res[id].datee, options: { align: "center", color: '000000', fill: fillValue} },
								{ text: response2.data.getProjectFlashActions.res[id].ownere, options: { align: "center", color: '000000', fill: fillValue} },
								{ text: response2.data.getProjectFlashActions.res[id].typee, options: { align: "center", color: '000000', fill: fillValue} },
							],);
						}
					}
					
					//rows = rows + `]`

					/*
					x.year,
					SUM(x.affecte) affecte,
					SUM(x.previsionnel) previsionnel
					*/

					let dataChartAreaLine = [];
					let labels = [];
					let values = [];
					
					if (response2.data.getProjectFlashBudget2.res) {
						for(var id in response2.data.getProjectFlashBudget2.res) {
							labels.push(response2.data.getProjectFlashBudget2.res[id].year);
							values.push(response2.data.getProjectFlashBudget2.res[id].affecte);
						}
					}
					dataChartAreaLine.push(
						{
							name: "affecte",
							labels,
							values
						},);

					labels = [];
					values = [];

					if (response2.data.getProjectFlashBudget2.res) {
						for(var id in response2.data.getProjectFlashBudget2.res) {
							labels.push(response2.data.getProjectFlashBudget2.res[id].year);
							values.push(response2.data.getProjectFlashBudget2.res[id].previsionnel);
						}
					}
					
					dataChartAreaLine.push(
						{
							name: "previsionnel",
							labels,
							values
						},
					);

					let pptx = new pptxgen();

					pptx.author = user_name;
					pptx.company = 'Triskell Software France';
					pptx.revision = '1';
					pptx.subject = 'Flash Report';
					pptx.title = 'Flash Report';
					
					//LAYOUT_16x9	Yes	10 x 5.625 inches
					//pptx.layout = 'LAYOUT_NAME';
					
					pptx.theme = { headFontFace: "Montserrat" };
					pptx.theme = { bodyFontFace: "Montserrat" };			
		
					let slide = pptx.addSlide(name);
					
					//Title
					let title_label = {x: 0.25, y: 0.25, w: 1.5, h: 0.30, align: 'center', fontSize: 10, color: 'FFFFFF', fill: fillLabel}; 
					slide.addText('Projet', title_label);
		
					let title = {x: 1.75, y: 0.25, w: 4, h: 0.30, align: 'center', fontSize: 10, color: '000000', fill: fillValue};
					slide.addText(name, title);
					
					//Logo
					//let boxHeight = 0.7, boxWidth = 2, poxY = 4.9, poxX = 8;
					let boxHeight = 0.7, boxWidth = 2, poxY = 0.1, poxX = 7.5;
					slide.addImage({ path:'public/images/Logo+symbol-200px.png', x: poxX, y: poxY, w: boxWidth, h: boxHeight });
		
					//Actors
					let sponsor_label = {x: 0.25, y: 0.56, w: 1.5, h: 0.25, align: 'center', fontSize: 8, color: 'FFFFFF', fill: fillLabel}; 
					slide.addText('Sponsor Projet', sponsor_label);
		
					let sponsor_z = {x: 1.75, y: 0.56, w: 1.95, h: 0.25, align: 'left', fontSize: 8, color: '000000', fill: fillValue};
					slide.addText(sponsor, sponsor_z);
					
					let direction_label = {x: 3.70, y: 0.56, w: 1.5, h: 0.25, align: 'center', fontSize: 8, color: 'FFFFFF', fill: fillLabel}; 
					slide.addText('Département Propriétaire', direction_label);
		
					let direction = {x: 5.20, y: 0.56, w: 0.55, h: 0.25, align: 'left', fontSize: 8, color: '000000', fill: fillValue};
					slide.addText(departement, direction);

					let realisation_z = {x: 0.25, y: 1, w: 5.25, h: 1.75, align: 'left', fontSize: 8, color: '000000', fill: fillValue};
					slide.addText(realisation, realisation_z);
		
					//Table
					//let rows = ${rows};
					//console.log(rows);
					slide.addTable(rows, { x: 0.25, y: 3, w: 9, rowH: 0.25, align: "left"});
					
					//Line chart
					//let dataChartAreaLine = ${dataChartAreaLine}
					//console.log(dataChartAreaLine);
					slide.addChart(pptx.ChartType.line, dataChartAreaLine, { x: 5.5, y: 1, w: 4, h: 2 });
		
					//pptx.writeFile({ fileName: "Flash report.pptx" });

					pptx.write("base64")
						.then((data) => {
							//console.log("write as base64: Here are 0-100 chars of `data`:\n");
							//console.log(data.substring(0, 100));

							b64 = data
							//console.log(b64);
							
							var payload = JSON.stringify({
								"objects": [],
								"params": {
									"dataObjectId": dataObjectId.toString(),
									"name": 'Flash Report PPT',
									"description": "Rapport Flash PPT généré par Triskell",
									"url": "-",
									"fileName": 'Flash Report.ppt',
									"rolesAllowed": "",
									"fileContent": b64.toString()
								},
								"id": 0
							});

							extJS.login(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.password, function(err, response) {
								const authash = response[0];
								const jsessionid = response[1];
								console.log('authash : ' + authash);
								console.log('jsessionid : ' + jsessionid);

								//console.log(payload);
								extJS.SaveAttachment(tenantConfig.triskell.server, authash, jsessionid, payload, logger, function(err, response) {
									console.log('Saved in attachment !');
								});
							});
						})
						.catch((err) => {
							console.error(err);
							callback(err, null);
						});

					console.log(new Date() - now);
					var HTML = '<!doctype html>'+
								'<html>'+
								'<head>'+
								'<title>Flash report PPT</title>'+
								/*'<meta name="description" content="Our first page">'+
								'<meta name="keywords" content="html tutorial template">'+*/
								'</head>'+
								'<body>'+
								"Un rapport Flash <b>PPT</b>, a été généré avec succès.<br>Il est disponible dans l'onglet <b>Documents</b> du projet" +
								'</body>'+
								'</html>';
					callback(null,HTML);
				} else {
					callback(err2, null);
				}
			} 
		) 
	},

	generateflashPDF : function(dataObjectId, logger, callback) {
		var parameters = tenantConfig.triskell.parameters.dataobject_id+"#"+dataObjectId
		//extJS.executeStoredSelector(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, tenantConfig.triskell.reports.getFlashReport, parameters, logger, 
		extJS.executeReport(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, tenantConfig.triskell.reports.getFlashReport, parameters, logger, 
		function(err2, response2) {
			//
			if (response2.data.getProjectFlashDetails.res) {
				let fillLabel = 'e87b3a'; //203764
				let fillValue = 'D9D9D9'; //D9E1F2
				//var data = response2.data.getProjectFlashDetails.res;
				/*
				dataobject_name as name,
				$_$SponsorProjet as sponsor,
				$_$DepartementProprietaire as departement,
				$Realisationdumois as realisation
				*/

				for(var id in response2.data.getProjectFlashDetails.res) {
					var name = response2.data.getProjectFlashDetails.res[id].name;
					var sponsor = response2.data.getProjectFlashDetails.res[id].sponsor;
					var departement = response2.data.getProjectFlashDetails.res[id].departement;
					var realisation = response2.data.getProjectFlashDetails.res[id].realisation;
				}
				
				let rows = [];
				rows.push(
					[
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Description', style:'tableTitleContentLabel'}, 
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Date', style:'tableTitleContentLabel'}, 
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Propriètaire', style:'tableTitleContentLabel'},
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Type', style:'tableTitleContentLabel'}
					],);

				if (response2.data.getProjectFlashActions.res) {
					for(var id in response2.data.getProjectFlashActions.res) {
						/*
						$DateEstimee as datee,
						$TypedEvenement as typee,
						$_$Proprietaire as ownere
						*/
						rows.push(
							[
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].desce, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].datee, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].ownere, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashActions.res[id].typee, style:'tableContentValue'}
							],);
					}
				}
				
				/*
				$Centredecouts as centrec,
				$TypedeCout as typec,
				CASE WHEN YEAR(startdate) = YEAR(now())-1 THEN SUM(unit) ELSE 0 END as previousy,
				CASE WHEN YEAR(startdate) = YEAR(now()) THEN SUM(unit) ELSE 0 END as currenty,
				CASE WHEN YEAR(startdate) = YEAR(now())+1 THEN SUM(unit) ELSE 0 END nexty,
				SUM(unit) as total
				*/
				let budget = [];
				budget.push(									
					[
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Centre de coûts', style:'tableTitleContentLabel'}, 
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Type de coûts', style:'tableTitleContentLabel'},
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Années passées', style:'tableTitleContentLabel'},
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Année en cours', style:'tableTitleContentLabel'},
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Années suivantes', style:'tableTitleContentLabel'},
						{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: 'Total', style:'tableTitleContentLabel'}
					],);

				if (response2.data.getProjectFlashBudget.res) {
					for(var id in response2.data.getProjectFlashBudget.res) {
						if (response2.data.getProjectFlashBudget.res[id].centrec) {
							budget.push(
							[
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashBudget.res[id].centrec, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashBudget.res[id].typec, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashBudget.res[id].previousy, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashBudget.res[id].currenty, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashBudget.res[id].nexty, style:'tableContentValue'},
								{border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text: response2.data.getProjectFlashBudget.res[id].total, style:'tableContentValue'}
							],);
						} else {
							budget.push(
							[
								{colSpan:2, border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: 'TOTAL', style:'tableContentValueTotal'},
								{},
								{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: response2.data.getProjectFlashBudget.res[id].previousy, style:'tableContentValueTotalleft'},
								{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: response2.data.getProjectFlashBudget.res[id].currenty, style:'tableContentValueTotalleft'},
								{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: response2.data.getProjectFlashBudget.res[id].nexty, style:'tableContentValueTotalleft'},
								{border: [true, true, true, true], borderColor: ['#999999', 'black', '#999999', '#999999'], text: response2.data.getProjectFlashBudget.res[id].total, style:'tableContentValueTotalleft'}
							],);
						}
						
					}
				}
				
				var now = new Date();
				
				var PDF = require('pdfmake/build/pdfmake');
				var PDF_Fonts=require('pdfmake/build/vfs_fonts');
				PDF.vfs = PDF_Fonts.pdfMake.vfs;

				var docDefinition = {
					pageSize: 'A4',

					pageOrientation: 'landscape',
					pageMargin: [40,80,40,60],
					header: {
						columns: [
						{},
						{
						image : 'data:image/png;base64,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',
						width: 200, 
						margin: [-25,0]
						}
						]
					},
					styles: {

							tableTitleHeaderLabel: {
								font: 'Roboto',
								bold: true,
								fontSize: 15,
								color: `#${fillLabel}`,
								fillColor: 'white',
								alignment: 'left'
							},
							tableTitleHeaderValue: {
								font: 'Roboto',
								bold: true,
								fontSize: 17,
								color: 'black',
								fillColor: `#${fillValue}`,
								alignment: 'left'
							},
							tableFieldLabel: {
								font: 'Roboto',
								bold: true,
								fontSize: 11,
								color: 'black',
								fillColor: 'white',
								alignment: 'right'
							},
							tableTitleContentLabel: {
								font: 'Roboto',
								bold: true,
								fontSize: 11,
								color: 'white',
								fillColor: `#${fillLabel}`, 
								alignment: 'center'
							},
							tableContentValue: {
								font: 'Roboto',
								bold: true,
								fontSize: 12,
								color: 'black',
								fillColor: `#${fillValue}`,
								alignment: 'left'
							},
							tableContentValueTotal: {
								font: 'Roboto',
								bold: true,
								fontSize: 12,
								color: 'black',
								fillColor: 'white',
								alignment: 'right'
							},
							tableContentValueTotalleft: {
								font: 'Roboto',
								bold: true,
								fontSize: 12,
								color: 'black',
								fillColor: 'white',
								alignment: 'left'
							},
							tableTitleSmall: {
								font: 'Roboto',
								bold: false,
								fontSize: 1,
								color: 'white',
								fillColor: 'white',
								alignment: 'center'
							},
						},
						defaultStyle: {
							fontSize: 10,
							color: 'black'
						},
						content: [
							'    ',
							{
								table: {
									widths: [100,150,100,150],
									body: [
										[
											{border: [true, false, false, true], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: 'Nom du projet', style:'tableTitleHeaderLabel'}, 
											{border: [false, false, false, true], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: name, style:'tableTitleHeaderValue', colSpan:3},
											{},
											{}
										],
										[
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: ' ', style:'tableTitleSmall', colSpan:4}, 
										],
										[
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: 'Sponsor Projet', style:'tableFieldLabel'}, 
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: sponsor, style:'tableContentValue'},
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: 'Département Propriétaire', style:'tableFieldLabel'}, 
											{border: [false, false, false, false], borderColor: ['#999999', '#999999', '#999999', '#999999'], text: departement, style:'tableContentValue'}
										]
									]
								}
							},
							'    ',
							'    ',
							'    ',
							'    ',
							{ text : 'Actions Evènements', style:'tableTitleHeaderLabel' },
							{
								table: {
									widths: [100,100,100,100],
									body: rows
								},
							},
							'    ',
							'    ',
							{ text : 'Réalisations du mois', style:'tableTitleHeaderLabel' },
							{
								table: {
									widths: [700],
									body: [
											[
												{ border: [true, true, true, true], borderColor: ['white', 'white', 'white', 'white'], text : realisation, style:'tableContentValue'}
											]
									]
								},
								
							},
							'    ',
							'    ',
							{ text : 'Finances - Budget prévisionnel (€)', style:'tableTitleHeaderLabel' },
							{
								table: {
									widths: [100,100,70,70,70,70],
									body: budget
								}
							}
						]
					}
					
					logger.debug('PdfCreation.docDefinition : ' + docDefinition);
					let b64;
					const pdfDocGenerator = PDF.createPdf(docDefinition);
					pdfDocGenerator.getBase64((data) => {
						b64 = data
						//console.log(b64);
				
						var payload = JSON.stringify({
						"objects": [],
						"params": {
							"dataObjectId": dataObjectId.toString(),
							"name": 'Flash Report PDF',
							"description": "Rapport Flash PDF généré par Triskell",
							"url": "-",
							"fileName": 'Flash Report.pdf',
							"rolesAllowed": "",
							"fileContent": b64.toString()
						},
						"id": 0
					});
					//console.log(payload);
					extJS.login(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.password, function(err, response) {
						const authash = response[0];
						const jsessionid = response[1];
						console.log('authash : ' + authash);
						console.log('jsessionid : ' + jsessionid);
						
						extJS.SaveAttachment(tenantConfig.triskell.server, authash, jsessionid, payload, logger, function(err, response) {
							console.log('Saved in attachment !');
						});
					});
				});
				
			} else {
				callback(err2, null);
			}

			

			console.log(new Date() - now);
			var HTML = '<!doctype html>'+
						'<html>'+
						'<head>'+
						'<title>Flash report PDF</title>'+
						/*'<meta name="description" content="Our first page">'+
						'<meta name="keywords" content="html tutorial template">'+*/
						'</head>'+
						'<body>'+
						"Un rapport Flash <b>PDF</b>, a été généré avec succès.<br>Il est disponible dans l'onglet <b>Documents</b> du projet" +
						'</body>'+
						'</html>';
			callback(null,HTML);
		}
	) 
},

};

module.exports = methods;

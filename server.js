const http = require('http');
const url = require('url');
var config = require('./config');

require('mkdirp').sync('logs') // your log directory

var hostname = config.tkserver.hostname;
var port = config.tkserver.port;
var loglevel = config.tkserver.loglevel;

const log4js = require("log4js");

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    afile: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log' }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    whlistener: { appenders: ['afile'], level: loglevel }
  },
  pm2: true,
  pm2InstanveVar: 'INSTANCE_ID'
});


/**
 * Here is the Triskell webhook listener for ondemand
 * version : 1.02 
 * date    : 3/10/2021
 * author  : Vincent Cailleaud
 */
var server = http.createServer(function(req, res) {
	var page = url.parse(req.url).pathname;
	var dataObjectId = '';
	var dataObjectName = '';
	var user_name = '';
	var lastmodified = '';
	var result = '';
	result = 'HTTP/1.1 200 OK\r\n\r\n';
	
	if (page.includes('triskell') /*&& (req.connection.remoteAddress === '34.240.241.233' || req.connection.remoteAddress === '46.137.78.101'*/) {
		var cmd = page.split("/");
		let q = url.parse(req.url, true).query;
		
		var tenant_id = 0;
		var dateTime = require('node-datetime');
		var dt = dateTime.create();
		var formatted = dt.format('Ymd');
		
		if(typeof q.tenant != 'undefined') {
			tenant_id = q.tenant;
		} else if(typeof q.tenant_identifier != 'undefined') {
			tenant_id = q.tenant_identifier;
		}
		
		if (tenant_id) {
			const logger = log4js.getLogger("whlistener."+tenant_id+'.'+formatted);
			logger.level = loglevel;

			logger.debug(`Received URL: ${req.url}`);
			console.log(`Received URL: ${req.url}`);
			logger.debug(`from: ${req.socket.remoteAddress}`);
			console.log(`from: ${req.socket.remoteAddress}`);
			
			var extJS = require('./scripts/tkRulesLibrary.js');
			var tenantConfig = require('./config/'+tenant_id+'/index_'+tenant_id+'.js');

			let data = []
			// we can access HTTP headers
			req.on('data', chunk => {
				data.push(chunk)
			})

			req.on('end', () => {
				
				if(typeof data != 'undefined' && data.length > 0 ) {				
					const attr = JSON.parse(data);
					user_name = q.user_name;
					logger.debug(`---- Requestor: ${user_name}`);
					dataObjectName = attr.name;
					logger.debug(`---- on dataObjectName: ${dataObjectName}`);
					dataObjectId = attr.dataobjectId;
					logger.debug(`---- (dataObjectId: ${dataObjectId})`);
					lastmodified = attr.lastmodified;
					logger.debug(`---- (at: ${lastmodified})`);
				}
				
				//Tenant test vca
				if (tenant_id === '915') {
					if (cmd[2] === 'HTMLtest') {
						if(typeof q.execution_identifier != 'undefined') {
							extJS.login(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.password, 
								function(err, response) {
									const authash = response[0];
									const jsessionid = response[1];
									console.log('authash : ' + authash);
									console.log('jsessionid : ' + jsessionid);
									
									extJS.GetRequestIdentifierData(tenantConfig.triskell.server, tenantConfig.triskell.login, authash, jsessionid, q.execution_identifier, logger, 
										function() {
											extJS.executeStoredSelector(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, 12, "", logger, 
											function(err, response2) {
												//
												if (response2.data.res[0]) {
													var data = response2.data.res[0].x;
												}
												
												//Google chart test
												var html1 = `<html>
															<head>
																<meta charset="utf-8">
																<meta name="description" content="">
																<meta name="author" content="">
																<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vcailleaud/Orange-OKRtree@1.0.0/styles/okrtree.css">
																<script src="https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/libs/jszip.min.js"></script>
																<script src="https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.min.js"></script>
																<script src="https://cdn.jsdelivr.net/gh/vcailleaud/genPPT@1.0.1/scripts/pptgen.js"></script>
																<style>
																	body {
																		background: var(--light);
																	}
																</style>															
															</head>
															<body>
															<div class="container py-3">
																<h1 class="text-primary font-weight-light">Triskell Export Demo</h1>
																<h5 class="text-secondary font-weight-light">Generate PowerPoint from Triskell</h5>
																<h6 class="bg-white border p-3 my-5">
																	<p>Generate a "Hello World" presentation on any modern desktop or mobile browser.</p>
																	<button type="button" class="btn btn-primary px-5" onclick="onButtonClick()">Generate Demo PowerPoint</button>
																</h6>
															</div>
															<button onclick="onButtonClick()">Click me!</button>
															</body>
														</html>
														`;												
												
												res.writeHead(200,{'Content-Type': 'text/html'});
												res.write(html1);
												res.end();
												console.log('OK');
												}
											)
										} 
									)
								}
							)
							
						} else {
							console.log(new Date().toISOString()+ ' - ' + 'GetRequestIdentifierData error');
							console.log(req.url);
							result = 'HTTP/1.1 500 KO\r\n\r\n';
							res.writeHead(200, null);
							res.end(result);
						}
					} else {
						console.log(new Date().toISOString()+ ' - ' + 'Bad request! : Wrong service');
						console.log(req.url);
						result = 'HTTP/1.1 500 KO\r\n\r\n';
						res.writeHead(200, null);
						res.end(result);
					}
				} else {
						console.log(new Date().toISOString()+ ' - ' + 'Bad request! : Wrong tenant');
						console.log(req.url);
						result = 'HTTP/1.1 500 KO\r\n\r\n';
						res.writeHead(200, null);
						res.end(result);
					}
			})
			
			//X
		} else {
			console.log(new Date().toISOString()+ ' - ' + 'Bad request! : Missing tenant identifier');
			console.log(req.connection.remoteAddress);
			console.log(req.url);

			res.writeHead(200, null);
			res.write('HTTP/1.1 500 KO\r\n\r\n');
			res.end();
		}
	} else {
		console.log(new Date().toISOString()+ ' - ' + 'Bad request!');
		console.log(req.connection.remoteAddress);
		console.log(req.url);
		
		res.writeHead(200, null);
		res.write('HTTP/1.1 500 KO\r\n\r\n');
		res.end();
	}
});

function format1(n, currency) {
  return currency + n.toFixed(2).replace(/./g, function(c, i, a) {
    return i > 0 && c !== "." && (a.length - i) % 3 === 0 ? " " + c : c;
  });
}

server.timeout = 0; //Set to 0 to disable any kind of automatic timeout behavior on incoming connections.

server.listen(port, hostname, () => {
  console.log(new Date().toISOString()+ ' - ' + `Server running at http://${hostname}:${port}/`);
});

process.on('uncaughtException', function (err) {
  console.log(new Date().toISOString()+ ' - ' + 'Caught exception: ' + err.stack);
});



/*
ISP specific JavaScript for Internode

MUST implement the following methods:
getCustomOptions (returns an array of Option Objects)
getConnectionDetails (returns a ConnectionDetails Object)
processData(xml, text) (processes the supplied input data to return a UsageData Object)
getUsageTypes() (returns the different Usage Types available in this ISPs data)

See util.js for details on individual Objects
*/

function getCustomOptions() {
	// make a call to function in util.js
	var options = getBasicOptions();
	var count = options.length;
	options[count++] = new Option("input", "Username<br><b>(Including @internode.on.net)</b>", "username");
	options[count++] = new Option("input", "Password", "password");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "GET";
	details.username = localStorage["username"];
	details.password = localStorage["password"];
	details.url = debug ? "internode.json" : "https://customer-webtools-api.internode.on.net/api/v1.5/";
	details.loaded = details.username && details.password;
	if (!details.loaded) {
		details.error = "Username / Password missing"
	}
	return details;
}

function processData(xml, text) {
	var services = xml.getElementsByTagName("service");
    var serviceId = services[0].textContent;
	if (serviceId) {
        var service = loadService(serviceId);
		var usage = loadUsage(serviceId);
		if (service.error) {
			return service;
		}
		return loadServiceUsage(service, usage);
	} else {
		return createFailure("Unable to find service information");
	}
}

function getUsageTypes() {
	// FORMAT: Name in dictionary (and displayed on usage popup), Display name for dropdown
	return [["Total","Total"]
    //, ["Upload","Upload"]
    //, ["Freezone","Freezone"]
    ];
}

function loadService(serviceId) {
	var url = "https://customer-webtools-api.internode.on.net/api/v1.5/" + serviceId + "/service/";
	var responseXml = callURLForXml(url);
	if (responseXml) {
		return responseXml;
	} else {
		return createFailure("Unable to load service details");
	}
}

function loadUsage(serviceId) {
	var url = "https://customer-webtools-api.internode.on.net/api/v1.5/" + serviceId + "/usage/";
	var responseXml = callURLForXml(url);
	if (responseXml) {
		return responseXml;
	} else {
		return createFailure("Unable to load usage details");
	}
}

function loadServiceUsage(service, usage) {
	var data = new UsageData();
	data.user = service.getElementsByTagName("username")[0].textContent;
	data.plan = service.getElementsByTagName("plan")[0].textContent;
	data.unit = "B";
	
	data.usageTypes["Total"] = new UsageType();
	//data.usageTypes["Upload"] = new UsageType();
	//data.usageTypes["Freezone"] = new UsageType();
	
	var total = getTrafficType(usage.getElementsByTagName("traffic"), "total");
	//var uploads = getTrafficType(service.usage.traffic_types, "uploads");
	//var freezone = getTrafficType(service.usage.traffic_types, "freezone");


	data.usageTypes["Total"].quota = total.getAttribute("quota");
	//data.usageTypes["Upload"].quota = uploads.allocation;
	//data.usageTypes["Freezone"].quota = freezone.allocation;

	data.usageTypes["Total"].usage = total.textContent;
	//data.usageTypes["Upload"].usage = uploads.used;
	//data.usageTypes["Freezone"].usage = freezone.used;

	var rollover = service.getElementsByTagName("rollover")[0].textContent;
	//var now = new Date();
	//var month = now.getDate() < rollover ? now.getMonth() - 1 : now.getMonth();
	//var year = now.getMonth() < month ? now.getFullYear() - 1 : now.getFullYear();

	var nextResetDate = new Date(rollover);
	data.nextReset = formatDate(nextResetDate);
    
    var lastResetDate = getLastReset(nextResetDate);
	data.lastReset = formatDate(lastResetDate);

	doDataPctCalc(data);

	data.loaded = true;
	return data;
}

function getTrafficType(traffic_types, typeName) {
	for (tt in traffic_types) {
		if (traffic_types[tt].getAttribute("name") == typeName) {
			return traffic_types[tt];
		}
	}	
}

function createFailure(error) {
	var data = new UsageData();
	data.loaded = false;
	data.error = error;
	return data;
}

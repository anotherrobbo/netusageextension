/*
ISP specific JavaScript for Adam Internet

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
	options[count++] = new Option("input", "Username<br><b>(Including @adam.com.au)</b>", "username");
	options[count++] = new Option("input", "Password", "password");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "GET";
	username = localStorage["username"];
	password = localStorage["password"];
	details.url = debug ? "adam.json" : "https://toolbox.iinet.net.au/cgi-bin/api.cgi?_USERNAME=" + username + "&_PASSWORD=" + password;
	details.loaded = username && password;
	if (!details.loaded) {
		details.error = "Username / Password missing"
	}
	return details;
}

function processData(xml, text) {
	reply = JSON.parse(text);
	if (reply.success) {
		service = loadService(reply);
		if (service.error) {
			return service;
		}
		return loadServiceUsage(service);
	} else {
		return createFailure(reply);
	}
}

function getUsageTypes() {
	// FORMAT: Name in dictionary (and displayed on usage popup), Display name for dropdown
	return [["Download","Download"], ["Upload","Upload"], ["Freezone","Freezone"]];
}

function loadService(reply) {
	token = reply.token;
	service = findService(reply.response);
	stoken = service.s_token;
	url = "https://toolbox.iinet.net.au/cgi-bin/api.cgi?Usage&_TOKEN=" + token + "&_SERVICE=" + stoken;
	responseText = callURL(url);
	reply = JSON.parse(responseText);
	if (reply.success) {
		response = reply.response
		response.user = service.pk_v;
		return response;
	} else {
		return createFailure(reply);
	}
}

function loadServiceUsage(service) {
	var data = new UsageData();
	data.user = service.user;
	var planName = service.account_info.plan;
	var planType = null;//account.getElementsByTagName("PlanType")[0].textContent;
	var planSpeed = null;//account.getElementsByTagName("PlanSpeed")[0].textContent;
	data.plan = planName;// + "<br/>" + planType + " " + planSpeed;
	data.unit = "B";
	
	data.usageTypes["Download"] = new UsageType();
	data.usageTypes["Upload"] = new UsageType();
	data.usageTypes["Freezone"] = new UsageType();
	
	var anytime = getTrafficType(service.usage.traffic_types, "anytime");
	var uploads = getTrafficType(service.usage.traffic_types, "uploads");
	var freezone = getTrafficType(service.usage.traffic_types, "freezone");


	data.usageTypes["Download"].quota = anytime.allocation;
	data.usageTypes["Upload"].quota = uploads.allocation;
	data.usageTypes["Freezone"].quota = freezone.allocation;

	data.usageTypes["Download"].usage = anytime.used;
	data.usageTypes["Upload"].usage = uploads.used;
	data.usageTypes["Freezone"].usage = freezone.used;

	var anniversary = service.quota_reset.anniversary;
	var now = new Date();
	var month = now.getDate() < anniversary ? now.getMonth() - 1 : now.getMonth();
	var year = now.getMonth() < month ? now.getFullYear() - 1 : now.getFullYear();

	var lastResetDate = new Date(year, month, anniversary);
	data.lastReset = formatDate(lastResetDate);

	var nextResetDate = getNextReset(lastResetDate);
	data.nextReset = formatDate(nextResetDate);

	doDataPctCalc(data);

	data.loaded = true;
	return data;
}

function findService(response) {
	for (s in response.service_list) {
		service = response.service_list[s];
		for (a in service.actions) {
			action = service.actions[a];
			if (action == "Usage") {
				return service;
			}
		}
	}
	return null;
}

function getTrafficType(traffic_types, typeName) {
	for (tt in traffic_types) {
		if (traffic_types[tt].name == typeName) {
			return traffic_types[tt];
		}
	}	
}

function createFailure(reply) {
	var data = new UsageData();
	data.loaded = false;
	data.error = reply.error;
	return data;
}

/*
ISP specific JavaScript for Optusnet

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
	options[count++] = new Option("input", "Username", "username");
	options[count++] = new Option("input", "Password", "password");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "POST";
	username = localStorage["username"];
	password = localStorage["password"];
	details.url = debug ? "optusnet.html" : "https://memberservices.optuszoo.com.au/login/?target=/myusage/";
	details.loaded = username && password;
	if (details.loaded) {
		details.params = "Action='login'/username=" + username + "/password=" + password;
	} else {
		details.error = "Username or Password missing"
	}		
	return details;
}

function processData(xml, text) {
	var data = new UsageData();
//	data.user
	var planRegex = /<td align="left" >Current Plan:<\/td>\s*<td><i>(.+)<\/i>/;
	var result = planRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Plan information not found";
		return data;
	}
	data.plan = result[1];
	data.unit = "MB";
	
	data.usageTypes["Peak DL"] = new UsageType();
	data.usageTypes["Peak Upload"] = new UsageType();
	data.usageTypes["Peak Usage"] = new UsageType();
	data.usageTypes["OffPeak Usage"] = new UsageType();
	
	var peakQuotaRegex = /<td headers='planDataAlwd'>(\d+)<\/td>/;
	result = peakQuotaRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Peak quota information not found";
		return data;
	}
	data.usageTypes["Peak DL"].quota = result[1];
	data.usageTypes["Peak Upload"].quota = result[1];
	data.usageTypes["Peak Usage"].quota = result[1];
	
	
	var peakUsageRegex = /<td headers='planDataU'>(\d+)<\/td>\s*<td headers='planDataU'>(\d+)<\/td>\s*<td headers='planDataU'>(\d+)<\/td>/;
	result = peakUsageRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Peak usage information not found";
		return data;
	}
	data.usageTypes["Peak DL"].usage = result[2];
	data.usageTypes["Peak Upload"].usage = result[1];
	data.usageTypes["Peak Usage"].usage = result[3];
	
	var offpeakQuotaRegex = /<td headers='yesdataAl'>(\d+)<\/td>/;
	result = offpeakQuotaRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "OffPeak quota information not found";
		return data;
	}
	data.usageTypes["OffPeak Usage"].quota = result[1];

	var offpeakUsageRegex = /<td headers='yesDataU'>(\d+)<\/td>/;
	result = offpeakUsageRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "OffPeak usage information not found";
		return data;
	}
	data.usageTypes["OffPeak Usage"].usage = result[1];
	
	var datesRegex = /<td align="left" >Billing Period:<\/td>\s*<td ><strong>(\d+ [A-z]+ \d+) - (\d+ [A-z]+ \d+)<\/strong><\/td>/;
	result = datesRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Date information not found";
		return data;
	}
	var lastResetDate = parseOptusDate(result[1]);
	data.lastReset = formatDate(lastResetDate);
	
	var nextResetDate = parseOptusDate(result[2]);
	// Add 1 day
	nextResetDate = new Date(nextResetDate.getTime() + (24 * 60 * 60 * 1000))
	data.nextReset = formatDate(nextResetDate);
	
	doDataPctCalc(data);
	
	data.loaded = true;
	return data;
}

function getUsageTypes() {
	return [["Peak DL","Peak DL"], ["Peak Upload","Peak Upload"], ["Peak Usage","Peak Usage"], ["OffPeak Usage","OffPeak Usage"]];
}

function parseOptusDate(dateString) {
	var d = Date.parse(dateString);
	var date = new Date(d);
	return date;
}
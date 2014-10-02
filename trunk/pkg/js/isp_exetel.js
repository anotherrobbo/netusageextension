/*
ISP specific JavaScript for Exetel

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
	details.action = "GET";
	username = localStorage["username"];
	password = localStorage["password"];
	details.url = debug ? "exetel.xml" : "https://www.exetel.com.au/members/usagemeter_xml.php?" + username + "," + password;
	details.loaded = username && password;
	if (!details.loaded) {
		details.error = "Username or Password missing"
	}		
	return details;
}

function processData(xml, text) {
	var data = new UsageData();
//	data.user
	var planRegex = /<PlanName>(.+)<\/PlanName>/;
	var result = planRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Plan information not found";
		return data;
	}
	data.plan = result[1];
	data.unit = "MB";
	
	data.usageTypes["Peak DL"] = new UsageType();
	data.usageTypes["OffPeak DL"] = new UsageType();
	
	var peakQuotaRegex = /<PeakTimeDownloadInMB>(\d+)<\/PeakTimeDownloadInMB>/;
	result = peakQuotaRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Peak quota information not found";
		return data;
	}
	data.usageTypes["Peak DL"].quota = result[1];
	
	var usageRegex = /<CurrentMonthUsage>\s+<PeakDownload>([\d\.]+)<\/PeakDownload>\s+<PeakUpload>([\d\.]+)<\/PeakUpload>\s+<OffpeakDownload>([\d\.]+)<\/OffpeakDownload>\s+<OffpeakUpload>([\d\.]+)<\/OffpeakUpload>/;
	result = usageRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Peak DL information not found";
		return data;
	}
	data.usageTypes["Peak DL"].usage = result[1];
	data.usageTypes["OffPeak DL"].usage = result[3];
	
	var offpeakQuotaRegex = /<OffpeakTimeDownloadInMB>(\d+)<\/OffpeakTimeDownloadInMB>/;
	result = offpeakQuotaRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "OffPeak quota information not found";
		return data;
	}
	data.usageTypes["OffPeak DL"].quota = result[1];

	var datesRegex = /<DailyUsage>\s+<Daily>\s+<UsageDate>([\d-]+)<\/UsageDate>/;
	result = datesRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Date information not found";
		return data;
	}
	var lastResetDate = parseExetelDate(result[1]);
	data.lastReset = formatDate(lastResetDate);
	
	var nextResetDate = getNextReset(lastResetDate);
	data.nextReset = formatDate(nextResetDate);
	
	doDataPctCalc(data);
	
	data.loaded = true;
	return data;
}

function getUsageTypes() {
	return [["Peak DL","Peak DL"], ["OffPeak DL","OffPeak DL"]];
}

function parseExetelDate(dateString) {
	var year = dateString.substring(0, 4);
	var month = dateString.substring(5, 7) - 1;
	var day = dateString.substring(8, 10);
	var date = new Date(year, month, day);
	return date;
}
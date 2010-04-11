/*
ISP specific JavaScript for Orcon

MUST implement the following methods:
getCustomOptions (returns an array of Option Objects)
getConnectionDetails (returns a ConnectionDetails Object)
processData(xml, text) (processes the supplied input data to return a UsageData Object)

See util.js for details on individual Objects
*/

function getCustomOptions() {
	// make a call to function in util.js
	var options = getBasicOptions();
	var count = options.length;
	options[count++] = new Option("input", "Quota (GB)", "quota");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "GET";
	details.url = debug ? "orcon.xml" : "https://www.orcon.net.nz/modules/usagemeter/view/CosmosController.php";
	details.loaded = localStorage["quota"];
	if (!details.loaded) {
		details.error = "Quota missing"
	}
	return details;
}

function processData(xml, text) {
	var data = new UsageData();
//	data.user;
	var planRegex = /<dt>Plan<\/dt>\s*<dd>(.*)<\/dd>/;
	var result = planRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Plan information not found";
		return data;
	}
	data.plan = result[1];
	data.unit = "GB";
	
	data.peakQuota = localStorage["quota"];
//	data.offpeakQuota = data.peakQuota;
	data.uploadQuota = data.peakQuota;
	data.miscQuota = data.peakQuota;
	
	var peakDlRegex = /<dt>Total Downloads<\/dt>\s*<dd>([\d\.]+?) GB<\/dd>/;
	result = peakDlRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Download information not found";
		return data;
	}
	data.peakDl = result[1];
//	data.offpeakDl;
	var uploadRegex = /<dt>Total Uploads<\/dt>\s*<dd>([\d\.]+?) GB<\/dd>/;
	result = uploadRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Upload information not found";
		return data;
	}
	data.upload = result[1];
	
	var totalUsageRegex = /<dt>Total Usage<\/dt>\s*<dd>([\d\.]+?) GB<\/dd>/;
	result = totalUsageRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Total Usage information not found";
		return data;
	}
	data.miscUsage = result[1];
	data.miscName = "Total";
	
	var datesRegex = /<dt>Period<\/dt>\s*<dd>([\d\/]+?) - ([\d\/]+?)<\/dd>/;
	result = datesRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Date information not found";
		return data;
	}
	var lastResetDate = parseOrconDate(result[1]);
	data.lastReset = formatDate(lastResetDate);
	
	var nextResetDate = parseOrconDate(result[2]);
	data.nextReset = formatDate(nextResetDate);
	
	doDataPctCalc(data);
	
	data.loaded = true;
	return data;
}

//Parses the dateString in the format dd/MM/yyyy
function parseOrconDate(dateString) {
	var year = dateString.substring(6, 10);
	var month = dateString.substring(3, 5) - 1;
	var day = dateString.substring(0, 2);
	var date = new Date(year, month, day);
	return date;
}
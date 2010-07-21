/*
ISP specific JavaScript for BigPond - Sean Flanigan <sean@flanigan.org>

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
	options[count++] = new Option("input", "Quota (MB)", "quota");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "POST";
	username = localStorage["username"];
	password = localStorage["password"];
	details.url = debug ? "bigpond.html" : "https://signon.bigpond.com/login";
	details.loaded = username && password;
	if (details.loaded) {
		details.params = "username="+encodeURIComponent(username)+"&password="+encodeURIComponent(password)+"&goto=https://my.bigpond.com/mybigpond/myaccount/myusage/default.do";
	} else {
		details.error = "Username or Password missing"
	}
	return details;
}

function processData(xml, text) {
	var data = new UsageData();
//	data.user
	var planRegex = /<td valign="top" nowrap="nowrap">Current Plan:<\/td>\s*<td width="40%" valign="top" nowrap="nowrap">([^<>]*)<\/td>/;
	var result = planRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Plan information not found";
		return data;
	}
	data.plan = result[1];
	data.unit = "MB";
	
	data.usageTypes["Total Usage"] = new UsageType();
	
	var quota = localStorage["quota"];
	data.usageTypes["Total Usage"].quota = quota;
	
	var totalUsageRegex = /<td nowrap="nowrap" style="vertical-align:bottom">Current Account Usage<sup><a href="#footnote2">2<\/a><\/sup>:<\/td>\s*<td colspan="2" style="vertical-align:bottom"><strong>([\d,]+)MB<\/strong><\/td>/;
	result = totalUsageRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Current Account Usage not found";
		return data;
	}
	var totalMb = parseInt(result[1].replace(/\,/g,''));
	data.usageTypes["Total Usage"].usage = totalMb;
	
	var datesRegex = /<td nowrap="nowrap" style="vertical-align:bottom">Current Bill Period<sup><a href="#footnote1">1<\/a><\/sup>:<\/td>\s*<td colspan="2" style="vertical-align:bottom">(\d+ \w+ \d+) - (\d+ \w+ \d+)<\/td>/;
	result = datesRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Current Bill Period not found";
		return data;
	}
	var lastResetDate = new Date(result[1]);
	data.lastReset = formatDate(lastResetDate);
	
	var nextResetDate = new Date(result[2]);
	data.nextReset = formatDate(nextResetDate);

	var currentAllowanceRegex =
		/<td nowrap="nowrap" style="vertical-align:bottom">Current Usage Allowance:<\/td>\s*<td colspan="2" style="vertical-align:bottom">(\d+)([MG]B)[^<>]*<\/td>/;
	result = currentAllowanceRegex.exec(text);
	if (result == null) {
		data.loaded = false;
		data.error = "Current Usage Allowance not found";
		return data;
	}
	var currentAllowance = parseInt(result[1].replace(/\,/g,''));
	if (result[2] == 'GB') {
		currentAllowance *= 1024; // I think Telstra treats 1GB = 1024MB
	}
	data.peakQuota = localStorage["quota"];
	if (!data.peakQuota || data.peakQuota == 0 || data.peakQuota == '') {
		data.peakQuota = currentAllowance;
	}
	data.uploadQuota = data.peakQuota;
	data.miscQuota = data.peakQuota;
	
	doDataPctCalc(data);
	
	data.loaded = true;
	return data;
}

function getUsageTypes() {
	return [["Total Usage","Total Usage"]];
}

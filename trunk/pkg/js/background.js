var failureReason;
var failureDetail;
var updateId;

function updateUsage() {
	cancelScheduledUpdate();
	doUpdate();
	if (localStorage["refresh"] && localStorage["refresh"] > 0) {
		updateId = setTimeout(function() {
			updateUsage();
		}, localStorage["refresh"]);
	}
}

function cancelScheduledUpdate() {
	if (updateId) {
		clearTimeout(updateId);
		updateId = undefined;
	}
}

function doUpdate() {
	console.log("doUpdate: " + new Date());
	loading();
	var isp = localStorage["isp"];
	if (!isp) {
		fail("Failed to load required settings<br>ISP details missing<br>Please set up in Options");
		return;
	}
	var ispLoaded = loadISP(isp, function() {
		var details = getConnectionDetails();
		loadData(details);
	});
	if (ispLoaded) {
		var details = getConnectionDetails();
		loadData(details);
	}
}

function loadData(details) {
	if (details.loaded) {
		var req = new XMLHttpRequest();

		timeoutId = setTimeout(function() {
			if (req.readyState != 4 || req.status != 200) {
				req.abort();
				fail("Failed to get usage data<br>Request timed out<br>Please check settings in Options");
			}
		}, 60000);

		req.open(details.action, details.url, true);
		req.onload = function() {
			console.log("onload, req.status=" + req.status);
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			if (req.status == 200 || (debug && req.status == 0)) {
				var data = processData(req.responseXML, req.responseText);
				if (data.loaded) {
					storeObject("data", data);
					success(data);
				} else {
					fail("Failed to get usage data<br>Invalid response returned from server<br>" + data.error
							+ "<br>Please check settings in Options<br><br>", req.responseText);
				}
			} else {
				fail("Failed to get usage data<br>Request returned status of " + req.status + "<br>Please check settings in Options");
			}
		}
		if (details.action == "POST") {
			req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			req.send(details.params);
		} else {
			req.send(null);
		}
	} else {
		fail("Failed to load required settings<br>" + details.error + "<br>Please set up in Options");
	}
}

function loading() {
	chrome.browserAction.setBadgeText( {
		text : "..."
	});
	chrome.browserAction.setBadgeBackgroundColor( {
		color : [ 0, 0, 255, 255 ]
	});
	chrome.browserAction.setIcon( {
		path : "images/icon19.png"
	});
	chrome.browserAction.setTitle( {
		title : "Loading..."
	});
}

function success(data) {
	failureReason = undefined;
	var title = "";
	var graph1UsageType = localStorage["graph1"];
	var graph1Usage = data.usageTypes[graph1UsageType];
	if (graph1Usage) {
		chrome.browserAction.setBadgeText( {
			text : graph1Usage.pct + "%"
		});
		if (graph1Usage.pct >= 90) {
			chrome.browserAction.setBadgeBackgroundColor( {
				color : [ 255, 0, 0, 255 ]
			});
		} else {
			chrome.browserAction.setBadgeBackgroundColor( {
				color : [ 0, 128, 0, 255 ]
			});
		}
		title += graph1UsageType + ": " + getDisplayUsage(graph1Usage, data.unit);
		var graph2UsageType = localStorage["graph2"];
		var graph2Usage = data.usageTypes[graph2UsageType];
		if (graph2Usage) {
			title += "\n" + graph2UsageType + ": " + getDisplayUsage(graph2Usage, data.unit);
		}
	} else {
		chrome.browserAction.setBadgeText( {
			text : "?"
		});
		chrome.browserAction.setBadgeBackgroundColor( {
			color : [ 0, 0, 255, 255 ]
		});
		title += "Please set Graph 1 data type in Options"
	}
	chrome.browserAction.setIcon( {
		path : "images/icon19.png"
	});
	title += "\nClick for more details"
	chrome.browserAction.setTitle( {
		title : title
	});
	updateViews(data);
}

function fail(reason, detail) {
	console.log("fail: " + reason);
	failureReason = reason;
	failureDetail = detail;
	chrome.browserAction.setBadgeText( {
		text : "?"
	});
	chrome.browserAction.setBadgeBackgroundColor( {
		color : [ 128, 128, 128, 255 ]
	});
	chrome.browserAction.setIcon( {
		path : "images/icon19_m.png"
	});
	chrome.browserAction.setTitle( {
		title : "Please check Options"
	});
	updateViews(undefined);
}

function updateViews(data) {
	var views = chrome.extension.getViews();
	for ( var i = 0, view; view = views[i]; i++) {
		if (view.location.pathname == "/usage.html") {
			view.showUsage(data);
		}
	}
}

//Add event listeners once the DOM has fully loaded by listening for the 'DOMContentLoaded' event
//on the document, and adding your listeners to specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
	updateUsage();
});
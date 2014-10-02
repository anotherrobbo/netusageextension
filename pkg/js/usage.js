var background = chrome.extension.getBackgroundPage();

function updateUsage() {
	var graphContainer = document.getElementById("graphContainer");
	var errorContainer = document.getElementById("errorContainer");
	var infoContainer = document.getElementById("infoContainer");
	errorContainer.style.display = "none";
	graphContainer.style.display = "block";
	infoContainer.style.display = "none";
	loading(true);
	background.updateUsage();
}

function showUsage(data) {
	var graphContainer = document.getElementById("graphContainer");
	var errorContainer = document.getElementById("errorContainer");
	var infoContainer = document.getElementById("infoContainer");
	if (!background.failureReason) {
		// Perform date calcs each load so they are correct against the time now.
		doDataDateCalc(data);

		var graph1UsageType = localStorage["graph1"];
		var graph1Usage = data.usageTypes[graph1UsageType];

		var graph2UsageType = localStorage["graph2"];
		var graph2Usage = data.usageTypes[graph2UsageType];

		// update graph
		if (graph1Usage) {
			var graph1 = document.getElementById("graph1");
			var graph1Percent = document.getElementById("graph1Percent");
			graph1.style.width = graph1Usage.pct + "%";
			// if (localStorage["graphText"]) {
			graph1Percent.innerHTML = graph1Usage.pct + "%";
			// }
		}

		if (graph2Usage) {
			var graph2 = document.getElementById("graph2");
			var graph2Percent = document.getElementById("graph2Percent");
			graph2.style.width = graph2Usage.pct + "%";
			// if (localStorage["graphText"]) {
			graph2Percent.innerHTML = graph2Usage.pct + "%";
			// }
		}

		var timePercent = Math.round((data.totalDays - data.daysRemaining) / data.totalDays * 100);
		var arrow = document.getElementById("arrow");
		arrow.style.left = timePercent + "%";

		// update info table
		removeAllChildren(infoContainer);
		if (data.user) {
			addInfoRow(infoContainer, "User:", data.user);
		}
		if (data.plan) {
			addInfoRow(infoContainer, "Plan:", data.plan);
		}
		for (usageType in data.usageTypes) {
			theUsage = data.usageTypes[usageType]
			addInfoRow(infoContainer, usageType + ":", getDisplayUsage(theUsage, data.unit));
		}
		addInfoRow(infoContainer, "Last Reset:", data.lastReset);
		addInfoRow(infoContainer, "Time Remaining:", data.daysRemaining + "d " + data.hoursRemaining + "h");
		if (data.peakDl) {
			addInfoRow(infoContainer, "Peak Remaining:", data.peakPerDayRemaining + " " + data.unit + "/d");
		}
		if (data.offpeakDl) {
			addInfoRow(infoContainer, "Off-Peak Remaining:", data.offpeakPerDayRemaining + " " + data.unit + "/d");
		}

		errorContainer.style.display = "none";
		graphContainer.style.display = "block";
		infoContainer.style.display = "block";
	} else {
		errorContainer.innerHTML = "<b>ERROR:</b> " + background.failureReason;
		errorContainer.style.display = "block";
		graphContainer.style.display = "none";
		infoContainer.style.display = "none";
	}
	loading(false);
}

function loading(mask) {
	var loading = document.getElementById("loading");
	if (mask) {
		loading.style.display = "block";
	} else {
		loading.style.display = "none";
	}
}

function addInfoRow(container, label, value) {
	var infoRow = document.createElement("div");
	infoRow.className = "infoRow";

	var infoLabel = document.createElement("div");
	infoLabel.className = "infoLabel";
	infoLabel.innerHTML = label;
	infoRow.appendChild(infoLabel);

	var infoValue = document.createElement("div");
	infoValue.className = "infoValue";
	infoValue.innerHTML = value;
	infoRow.appendChild(infoValue);

	container.appendChild(infoRow);
	/*
	 * <div class="infoRow">
	 * 		<div class="infoLabel">User:</div>
	 * 		<div id="user" class="infoValue"></div>
	 * </div>
	 */
}

//Add event listeners once the DOM has fully loaded by listening for the 'DOMContentLoaded' event
//on the document, and adding your listeners to specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('refreshButton').addEventListener('click', updateUsage);
	showUsage(loadObject('data'));
});
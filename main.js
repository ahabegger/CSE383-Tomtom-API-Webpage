// Defining Global Variables
var API_key = "NgCAXXvHYck3IBA8phZemfgEtauA8jGU";
var Base_URL = "api.tomtom.com";


function getRadioButton(name) {
	let button = document.getElementsByName(name);

        for(i = 0; i < button.length; i++) {
        	if(button[i].checked) {
                	return button[i].value;
            	}
        }
}


function getRoute(lat1, long1, lat2, long2, storage) {
	// Define Variables for API call
	let routeType = getRadioButton('routeType');
	let hilliness = getRadioButton('hills');
	let modeTravel = getRadioButton('modeTravel');

        // Store in object
        storage.request.routeType = routeType;
        storage.request.hilliness = hilliness;
        storage.request.modeTravel = modeTravel;

	console.log(routeType, hilliness, modeTravel);

	let apiCall = "";

	if (routeType == "thrilling") {
		apiCall =  "https://" + Base_URL + "/routing/1/calculateRoute/" + lat1 + "," + long1 + ":" + lat2 + "," + long2 + "/json?instructionsType=text&language=en-US&vehicleHeading=90&&sectionType=traffic&report=effectiveSettings&routeType=" + routeType + "&traffic=true&travelMode=" + modeTravel + "&hilliness=" + hilliness + "&key=" + API_key;
	} else {
		apiCall =  "https://" + Base_URL + "/routing/1/calculateRoute/" + lat1 + "," + long1 + ":" + lat2 + "," + long2 + "/json?instructionsType=text&language=en-US&vehicleHeading=90&&sectionType=traffic&report=effectiveSettings&routeType=" + routeType + "&traffic=true&travelMode=" + modeTravel + "&key=" + API_key;
	}

        // Store in object
        storage.request.apiCall = apiCall;

        // Routing Call
        r=$.ajax({
                url: apiCall,
        	method: "GET"
        }).done(function(data) {
		// Routing data collection
		console.log("GET Request Routing", data.routes[0]);

		let distanceKilo = Math.round(data.routes[0].summary.lengthInMeters / 1000);
		let travelTime = Math.round(data.routes[0].summary.travelTimeInSeconds / 60);
		let delayTime = Math.round(data.routes[0].summary.trafficDelayInSeconds / 60);

	        // Store in object
        	storage.response.distanceKilo = distanceKilo;
                storage.response.travelTime = travelTime;
                storage.response.delayTime = delayTime;

		// Route Summary
		$("#distance").html(distanceKilo);
		$("#travelTime").html(travelTime);
		$("#trafficDelay").html(delayTime);

		console.log("Length of Instruction : ", data.routes[0].guidance.instructions.length);
		console.log("Storage Object : ", storage);

		var legs = [];

		// Looping Through Instructions
		for (let i = 0; i <= data.routes[0].guidance.instructions.length-1; i++) {
			let message = data.routes[0].guidance.instructions[i].message;

			let time = data.routes[0].guidance.instructions[i].travelTimeInSeconds / 60;
			time = time.toFixed(1);
			let distance = data.routes[0].guidance.instructions[i].routeOffsetInMeters / 1000;
			distance = distance.toFixed(2);

			let latMap = data.routes[0].guidance.instructions[i].point.latitude;
			let longMap = data.routes[0].guidance.instructions[i].point.longitude;
			let apiMap = "https://api.tomtom.com/map/1/staticimage?layer=basic&style=main&format=jpg&zoom=12&center=" + longMap + "," + latMap + "&width=512&height=512&view=Unified&key=" + API_key;

	                $("#path").append("<li class='list-group-item'>" + (1+i) + ".) "  + message + ". | " + time + " min | " + distance + " km");
			$("#path").append("<img alt='Map for " + latMap + ", " + longMap + "' class='img-thumbnail rounded mx-auto d-block' src='" + apiMap + "'></li>");

			legs.push({"message":message, "time":time, "distance":distance, "map":apiMap});
		}

		storage.response.legs = legs;

		// Send Object
		r=$.ajax({
			url: "http://172.17.13.127/final.php?method=setMap",
			method: "POST",
    			dataType: "json",
    			data: JSON.stringify(storage),
    			contentType: "application/json"
		}).done(function(data) {
			console.log("return", data);
		});

        }).fail(function(error) {
		// Error in Routing API Call
		console.log("Failure in GET Request Routing", error);
	});

}


function getLatLong(query1, query2) {
	let storage = createJSON();

	// Get Lat Long
        r=$.ajax({
        	url: "https://" + Base_URL + "/search/2/geocode/" + query1 + ".json?key=" + API_key,
                method: "GET"

       	}).done(function(data) {
		console.log("GET Request for Geocode Location", data.results[0]);

                // Get Lat and Long
               	let lat1 = data.results[0].position.lat;
                let long1 = data.results[0].position.lon;

               	$("#startLatLong").html(lat1 + ", " + long1);

		// Store in object
		storage.request.lat1 = lat1;
		storage.request.long1 = long1;

		// Get Lat Long Again
        	r=$.ajax({

                	url: "https://" + Base_URL + "/search/2/geocode/" + query2 + ".json?key=" + API_key,
                	method: "GET"

        	}).done(function(data) {
                	console.log("GET Request for Geocode Location", data.results[0]);

                	// Get Lat and Long
                	let lat2 = data.results[0].position.lat;
                	let long2 = data.results[0].position.lon;

                	$("#endLatLong").html(lat2 + ", " + long2);

                	// Store in object
        	        storage.request.lat2 = lat2;
	                storage.request.long2 = long2;

	                // Routing Call
        	        getRoute(lat1, long1, lat2, long2, storage);

        	}).fail(function(error) {
                	// Search Failure
                	console.log("Failure in GET Request Geocode Query2", error);
                	$("#errorMessage4").removeClass('hiddenSection');
        	});

        }).fail(function(error) {
                // Search Failure
                console.log("Failure in GET Request Geocode Query1", error);
		$("#errorMessage3").removeClass('hiddenSection');
        });
}

function inputValid(input1, input2) {
	if ((input1 == "") || (input2 == "")) {
		if (input1 == "") {
			console.log("Empty Input for Starting Address");
			$("#errorMessage1").removeClass('hiddenSection');
		}
		if (input2 == "") {
                        console.log("Empty Input for Ending Address");
			$("#errorMessage2").removeClass('hiddenSection');
		}
		return false;
	}
	return true;
}

function clearErrors() {
	$("#errorMessage1").addClass('hiddenSection');
	$("#errorMessage2").addClass('hiddenSection');
	$("#errorMessage3").addClass('hiddenSection');
	$("#errorMessage4").addClass('hiddenSection');
}

function createJSON() {
	let storage =
	{
		"request": {
			"apiCall" : "",
			"lat1" : 0,
			"long1" : 0,
			"lat2" : 0,
			"long2" : 0,
			"routeType" : "",
			"hilliness" : "",
			"modeTravel" : ""
		},
		"response": {
			"distanceKilo" : 0,
			"travelTime" : 0,
			"delayTime" : 0
		}
   	};

	console.log(storage);
	return storage;
}


$(document).ready(function() {
	console.log("Document Ready");

	$("#submit").click(function() {
		console.log("Submit Button Clicked");


		// Get Address Information
		let start = document.getElementById("startAddress").value;
                let end = document.getElementById("endAddress").value;

		clearErrors();

		if (inputValid(start, end)) {
			// Make Visible Results
	                $("#results").removeClass("hiddenSection");

			// Get Results
			getLatLong(start, end);
		}
	});
});

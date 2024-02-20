/**
 * StAuth10244: I Mauricio Canul, 000881810 certify that this material is my original work. No other person's work has been used without 
 * due acknowledgement. I have not made my work available to anyone else.
 */

let map;

let userP = null;

let markers = [];

let filter = [];

let input;

let directionsService;

let directionsRenderer;

const geolocationOptions = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 5000,
};

/**
 * InitMap is a callback function part of the GoogleAPI, it has been modified in order to
 * accomodate the initialization of all relevant objects and lists needed for the web page's
 * functionality, in the following order:
 * - Sets up the options for the Map object
 * - Initializes a new instance of a google map object within the corresponding div
 * - Adds in the functionality for the user to search for new locations
 * - It Fetches all locations from a formatted JSON file
 * - Loops through all the locations and sets up their respective markers in the map
 * - Based on all the available locations creates the options for a select element
 * - Creates the functionality needed to get directions to a location based on the aforementioned select element
 */
async function initMap(){

    var options = {
      zoom:12,
      center:{lat:43.23271837848249, lng:-79.85923121184759},
      clickableIcons: true
    }

    map = new google.maps.Map(document.getElementById('map'),options);

    input = document.getElementById("locationFinder");
    const searchBox = new google.maps.places.SearchBox(input);
    searchBox.addListener("places_changed", ()=>{
        positionSearch(searchBox);
    })

    let locations = await fetch("./locations.json").then((res) => {return res.json()});

    // Marker info:
    // https://developers.google.com/maps/documentation/javascript/reference/marker
    Object.values(locations).forEach((Element) => {
        item =  new google.maps.Marker({
            position: Element.position,
            map,
            label: Element.label,
            title: Element.title,
            content: Element.content,
            tags: Element.tags,
        });

        markers.push(item);
    });


    inputList = document.getElementById("placeSel")
    markers.forEach((marker) => {
        // Click events found at:
        // https://developers.google.com/maps/documentation/javascript/examples/event-simple
        marker.addListener("click", () => {

            // Add marker windows (can be its own function)
            // Found it on the docs, improvised adding a field to the marker object AND JS ALLOWED ME, HOW!!11!!1|1!1?!1?!
            // https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple

            let contentWindow = marker.content

            let infowindow = new google.maps.InfoWindow({
                content: contentWindow,
                ariaLabel: marker.title,
            });
            
            infowindow.open({
                anchor: marker,
                map,
            });    
        });
    
        opt = document.createElement("option");
        opt.text = marker.title;
        opt.value = marker.title
        inputList.add(opt)

    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

/**
 * Function used to clear the variable that holds the user position and marker on the map,
 * it sets the variable to null and just in case, clears the directions being rendered on
 * the map object
 */
function removeUserMarker(){
    if(userP != null){ 
        userP.setMap(null); 
        userP = null;
        clearDirection()
    }
}

/**
 * Sets up a marker object on the map instance of the script, it is
 * nominally the marker meant to represent the user, therefore it takes
 * a name and location parameter, this function was created to stop code
 * repetition, as the "user" may enter the direction directly and not via 
 * geolocation but both instances would call for the same marker creation.
 * @param {*} name to be displayed as part of the marker
 * @param {*} location coordinates where to place the marker
 */
function userMarker(name, location){
    removeUserMarker();

    // Icon information:
    // https://developers.google.com/maps/documentation/javascript/custom-markers?hl=es-419#maps_custom_markers-javascript
    userP = new google.maps.Marker({
        map,
        title: name,
        position: location,
        icon: "user.png",
    });
}

/**
 * Function called on change of the text input box of the HTML, meant
 * to process location searches and call for the creation of a marker in
 * the case that the entered location is recognized.
 * @param {*} searchBox the input element itself
 */
function positionSearch(searchBox){
    places = searchBox.getPlaces();
    places.forEach((place) => {
        if (!place.geometry || !place.geometry.location) {
            console.log("Returned place contains no geometry");
            return;
        }
        else {
            userMarker(place.name, place.geometry.location);
        }
    });
}

/**
 * Function called in the case that the user presses the button to set a marker
 * at their current location, in the case that the request to enable the geolocation
 * features succeeds the function will create a marker for the users location and
 * it will call the directions function, in case the user has already selected a
 * destination, otherwise, it will print out the failure message to the console
 */
function userPosition(){
    navigator.geolocation.getCurrentPosition(
        (pos)=>{
            userMarker("U", {lat: pos.coords.latitude, lng: pos.coords.longitude});
            directions();
        }, 
        (fail) => {
            switch(fail.code){
                case fail.PERMISSION_DENIED:
                    errMsg = "User did not grant permission";
                    break;
                case fail.POSITION_UNAVAILABLE:
                    errMsg = "No position could be determined";
                    break;
                case fail.TIMEOUT:
                    errMsg = "The request doe location has timed-out";
                    break; 
                case fail.UNKWOWN_ERROR:
                    errMsg = "An unknown error has occurred";
                    break;
                default:
                    errMsg = "For I shall bring a flood unto the earth, to drown all flesh that walks under heaven...";
                    break;
            }
            console.error(errMsg);
    }, geolocationOptions);
}

/**
 * Function called whenever a checkbox's value is changed, this
 * will take the value of the checkbox and check if said "tag"
 * has been added to the filter array, adding or removing it
 * according to the current status of the checkbox
 * @param {*} elem the checkbox that was changed
 */
function filterChange(elem){
    val = elem.srcElement.value
    if(elem.srcElement.checked){
        if(!filter.includes(val)){
            filter.push(val)
        }
    }else{
        if(filter.includes(val)){
            filter = filter.filter(function(ent){
                return ent != val
            })
        }
    }
    filterMap();
}

/**
 * Function called by filter change, this function takes the
 * markers array and checks each element, setting their visibility
 * according to the tags currently found within visible, or auto
 * setting their visibility to true if there are no tags within
 * the filter array
 * 
 * Tags are set up at marker creation and are fed from the JSON
 * file used to load in the locations
 */
function filterMap(){
    Object.values(markers).forEach((Element) => {
        if(filter.length > 0) {
            Element.setVisible(false);
            filter.forEach((tag) => {
                if(Element.tags.includes(tag)){
                    Element.setVisible(true);
                }
            })
        } else Element.setVisible(true);
    });
}

/**
 * Function called whenever the direction currently rendered within the map
 * objects must be disposed of, it gets all directions of the renderer
 * using the getDirections() method and then sets the value to an empty array
 * if it is not already.
 */
function clearDirection(){
    var dir = directionsRenderer.getDirections();
    if (dir != []){
        directionsRenderer.setDirections({routes: []});
    }
}

/**
 * Function called from multiple different sources, it checks that the location
 * options of the select input and a user marker have been set, in such case, it
 * acquires the geolocation of both andcreates a request for the directionsService,
 * rendering the generated route in the map object, in the case that one of the
 * required values isn't found it instead calls for the deletion of any current
 * direction
 */
function directions(){
    //https://developers.google.com/maps/documentation/javascript/directions?hl=es-419
    option = document.getElementById("placeSel");
    if(userP != null && option.value != "none"){ 
        var start = userP.position;   
        var end = markers.find((elm)=>{return option.value == elm.title}).position;
        var request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
        };
        directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
        }
        });
    } else{
        clearDirection()
        console.log("No user position or destination given");
    }
}

window.addEventListener("load", (func) => {
    
    document.getElementById("MyPosition").addEventListener("click", userPosition);
    document.querySelectorAll(".filterInp").forEach((elem) => {
        elem.addEventListener("change", function (elem){
            filterChange(elem)
        });
    });
})

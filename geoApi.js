let map;

let markers = [];

const geolocationOptions = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 5000,
};

let userP;

async function initMap(){
    let locations = await fetch("./locations.json").then((res) => {return res.json()});

    var options = {
      zoom:12,
      center:{lat:43.23271837848249, lng:-79.85923121184759},
      clickableIcons: true
    }

    map = new google.maps.Map(document.getElementById('map'),options);

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
    });
}

function userPosition(){
    if(userP == null){
        navigator.geolocation.getCurrentPosition(
            (pos)=>{
                console.log(pos.coords.longitude, pos.coords.latitude, pos.timestamp, pos.coords.accuracy)
                userP = new google.maps.Marker({
                    position: {"lat": pos.coords.latitude, "lng": pos.coords.longitude},
                    map,
                    label: "U",
                    title: "You are here"
                });
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
    } else{
        userP.setMap(null);
        userP = null;
    }

}

function filterChange(elem){
    if(elem.srcElement.checked){
        console.log(elem.srcElement.value)
    }else{
        console.log("unchecked!")
    }
}

window.addEventListener("load", (func) => {
    
    document.getElementById("MyPosition").addEventListener("click", userPosition);
    document.querySelectorAll(".filterInp").forEach((elem) => {
        elem.addEventListener("change", function (elem){
            filterChange(elem)
        })
    })
})

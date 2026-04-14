let map;
let userLat, userLon;
let markers = [];

// Page load
window.onload = function () {
    getLocation();
};

// Get user location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showMap, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Show map
function showMap(position) {
    userLat = position.coords.latitude;
    userLon = position.coords.longitude;

    map = L.map('map').setView([userLat, userLon], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    addUserMarker();
}

// Add user marker
function addUserMarker() {
    let marker = L.marker([userLat, userLon])
        .addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();

    markers.push(marker);
}

// Error handling
function showError() {
    alert("Location access denied. Please allow GPS permission.");
}

// Clear markers
function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    document.getElementById("places-list").innerHTML = "";
}

// 🔥 Fetch with backup server
async function fetchData(query) {

    let baseUrls = [
        "https://overpass-api.de/api/interpreter?data=",
        "https://overpass.kumi.systems/api/interpreter?data="
    ];

    for (let base of baseUrls) {
        try {
            let res = await fetch(base + encodeURIComponent(query));

            if (!res.ok) throw new Error();

            let data = await res.json();
            return data;

        } catch (err) {
            console.log("Trying backup server...");
        }
    }

    throw new Error("All servers failed");
}

// Find nearby places
async function findNearby(placeType) {

    if (!map) {
        alert("Map not loaded yet.");
        return;
    }

    clearMarkers();
    addUserMarker();

    let radius = 7000; // 10 km
    let query = "";

    if (placeType === "restaurant") {
        query = `
            [out:json];
            (
                node["amenity"="restaurant"](around:${radius},${userLat},${userLon});
                node["amenity"="cafe"](around:${radius},${userLat},${userLon});
                node["amenity"="fast_food"](around:${radius},${userLat},${userLon});
                node["shop"="bakery"](around:${radius},${userLat},${userLon});
            );
            out;
        `;
    }
    else if (placeType === "hospital") {
        query = `
            [out:json];
            (
                node["amenity"="hospital"](around:${radius},${userLat},${userLon});
                node["amenity"="clinic"](around:${radius},${userLat},${userLon});
                node["amenity"="pharmacy"](around:${radius},${userLat},${userLon});
            );
            out;
        `;
    }
    else if (placeType === "atm") {
        query = `
            [out:json];
            (
                node["amenity"="atm"](around:${radius},${userLat},${userLon});
                node["amenity"="bank"](around:${radius},${userLat},${userLon});
            );
            out;
        `;
    }
    else {
        query = `
            [out:json];
            node["amenity"="${placeType}"](around:${radius},${userLat},${userLon});
            out;
        `;
    }

    try {
        let data = await fetchData(query);

        if (!data.elements || data.elements.length === 0) {
            alert("No nearby " + placeType + " found.");
            return;
        }

        let bounds = [];
        let listHTML = "";

        data.elements.forEach(place => {

            let name = place.tags?.name || placeType;

            let marker = L.marker([place.lat, place.lon])
                .addTo(map)
                .bindPopup(name);

            markers.push(marker);
            bounds.push([place.lat, place.lon]);

            listHTML += `<p>📍 ${name}</p>`;
        });

        document.getElementById("places-list").innerHTML = listHTML;

        if (bounds.length > 0) {
            map.fitBounds(bounds);
        }

    } catch (error) {
        console.log(error);
        alert("Server busy 😅 Please try again");
    }
}
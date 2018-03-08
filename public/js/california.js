var width = 1000,   // Width of SVG canvas    
    height = 1000;  // Height of SVG canvas

// SVG Canvas
var svg = d3.select('body').append('svg').attr('viewBox', '0 0 ' + width 
                                               + ' ' + height)
                                               .attr('width', '600px'); 

// Tooltip Div
var tooltip = d3.select("body")
		      .append("div")
    		  .attr("class", "tooltip")
    		  .style("opacity", 0)
              .style("border-radius", "8px");

// Calculated Scale for Map Overlay
var scale = (512) * 0.5 / Math.PI * Math.pow(2, 5.7);

// Map
var projection = d3.geo.mercator()
        .center([-118.734060,37.786874])
        .scale(scale)
        .translate([width/2, height/2]);

// Path Generator to draw regions on map
var path = d3.geo.path().projection(projection);

// Current mode for visualizing connections
var vizMode = 'COUNTY_TO_RES'

var connections = {
//    'Los Angeles' : ['SHA', 'SCC', 'CCH', 'FRD', 'BCL']
}

var currSelection = '';

var resConnections = {
    'CHV': {'HTH': 0.2892,
            'SPM': 0.0939,
            'NAT': 0.0905,
            'ANT': 0.035},
    
    'HTH': {'CHV': 0.2892,
            'CTG': 0.2156,
            'SLS': 0.1984,
            'ICH': 0.1483,
            'LON': 0.0974,
            'DON': 0.0802,
            'BLB': 0.0793,
            'LYS': 0.0577,
            'ENG': 0.0304,
            'BER': 0.0204,
            'LEW': 0.0135},
    
    'DNP': {'EXC': 0.1971,
            'CMN': 0.1552,
            'SPM': 0.1414,
            'HID': 0.0665,
            'PNF': 0.0632,
            'SHA': 0.0597,
            'BLB': 0.0527,
            'FOL': 0.0366,
            'ISB': 0.0161}
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////// DATA READING AND MAP DRAWING /////////////////////////
///////////////////////////////////////////////////////////////////////////////
d3.json("ca_counties.geojson", function(err, data) {
    if (err) return console.error(err);
    
    // Get features from JSON
    var features = data.features;
    
    // Create SVG paths to draw zip code boundaries
    createZipcodePaths(path, features);
    
    d3.json("reservoir_data.json", function(err, data) {
        if (err) return console.error(err);
        createReservoirPaths(path, data);
    });
});



/* Draws zipcode boundaries using SVG paths. */
function createZipcodePaths(path, features) {
    svg.selectAll('.zip')
        .data(features)
        .enter().append('path')
        .attr('d', path)
        .attr("stroke", "rgb(2, 70, 120)")
        .attr("fill", "rgb(2, 88, 171)")
        .attr("stroke-width", "2")
        .attr("opacity", 0.3)
        .attr("id", function(d) { return d.properties.NAME.replace(/\s/g, '') })
        .attr("class", "zip")
        .on("mouseover", zipCodeMouseover)
        .on("mouseout", tooltipMouseout);
}

/* Draws reservoirs as circles. */
function createReservoirPaths(path, res) {
            svg.selectAll('.res')
            .data(res)
            .enter().append('circle')
            .attr('cx', function (d) { return projection([d.Longitude, d.Latitude])[0]})
            .attr('cy', function (d) { return projection([d.Longitude, d.Latitude])[1]})
            .attr('r', '5px')
            .attr('fill', 'black')
            .attr('stroke', 'black')
            .attr('id', function(d) { return d.Name })
            .attr('class', 'res')
            .on('mouseover', reservoirMouseover)
            .on('mouseout', tooltipMouseout)
            .on('click', reservoirClick);
    
    var allRes = document.getElementsByClassName('res');
    for (var reservoir of allRes) {
        if (resConnections[reservoir.id]) {
            reservoir.setAttribute('class', 'res importantRes');
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
//////////////////////// TOOLTIP + INTERACTIVITY //////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/* Builds the inner HTML of the tooltip div, to display whenever a region is 
moused over. */
function makeTooltipHTML(d) {
    var name = d.properties.NAME + " County";
    var html = "<p><strong>" + name + "</strong></p>"
    return html;
}

/* Builds the inner HTML of the tooltip div, to display whenever a reservoir is moused over. */
function makeTooltipReservoirHTML(d) {
    var name = d.LakeName + ' (' + d.Name + ')';
    var elevation = 'Elevation: ' + d.Elevation;
    var capacity = 'Capacity: ' + d.Capacity;
    var html = '<p><strong>' + name + '</strong></p>';
    if (currSelection !== '' && 
        resConnections[currSelection] && 
        resConnections[currSelection][d.Name]) {
        html += '<p>Edge Weight: ' + resConnections[currSelection][d.Name] + '</p>'; 
    }
    return html;
}

/* Shows our tooltip div whenever a region is moused over, and changes the color
of the moused-over region */
function zipCodeMouseover(d) {
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip.html(makeTooltipHTML(d))  
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) - 30 + "px")
            .style("color","white")
            .style("background-color", "rgba(0, 0, 0, 0.5)");
    
    
    
    if (connections[d.properties.NAME]) {
        for (var connectedRes of connections[d.properties.NAME]) {
            var el = document.getElementById(connectedRes);
            el.classList.add('highlightedRes');
            el.style.r = 10;
        }
    }
    
}

/* Hides the tooltip div when the mouse leaves a region */
function tooltipMouseout(d) {
    tooltip.transition().duration(500).style("opacity", 0);
    clearReservoirClasses(false);
}


function clearReservoirClasses(clearAll) {
    var res = document.getElementsByClassName('res');
    for (var reservoir of res) {
        if (reservoir.id === currSelection) continue;
        if (clearAll || currSelection == '' || !resConnections[currSelection] || !resConnections[currSelection][reservoir.id]) {
            reservoir.classList.remove('highlightedRes');
            reservoir.style.r = 5;
        }
        reservoir.classList.remove('hoveredRes');
        reservoir.classList.remove('selectedRes');
    }
}

/* Shows our tooltip div whenever a reservoir is moused over */
function reservoirMouseover(d) {
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip.html(makeTooltipReservoirHTML(d))  
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) - 30 + "px")
            .style("color","white")
            .style("background-color", "rgba(0, 0, 0, 0.5)");
    
    var currRes = document.getElementById(d.Name);
    console.log(d.Name);
    currRes.classList.add('hoveredRes');
    
    if (currSelection === '') {
        addResConnections(d.Name);
    }
}

function addResConnections(resName) {
    if (resConnections[resName]) {
        for (var connectedRes in resConnections[resName]) {
            var edgeWeight = resConnections[resName][connectedRes];
            var el = document.getElementById(connectedRes);
            el.classList.add('highlightedRes');
            el.style.r = 5 + edgeWeight * 30;
        }
    }
}

/* Selects the reservoir (so you can mouse around and see connections) */
function reservoirClick(d) {
    var selectedRes = document.getElementById(d.Name);
    if (currSelection !== d.Name) {
        if (currSelection !== '') {
            clearReservoirClasses(true);
            var prevSelection = document.getElementById(currSelection);
            prevSelection.classList.remove('selectedRes');
            prevSelection.classList.remove('hoveredRes');
            prevSelection.style.r = 5;
            addResConnections(d.Name);
        }
        currSelection = d.Name;
        selectedRes.classList.remove('hoveredRes');
        selectedRes.classList.add('selectedRes');
        selectedRes.style.r = 10;
    } else {
        currSelection = '';
        selectedRes.classList.remove('selectedRes');
        selectedRes.classList.add('hoveredRes');
        selectedRes.style.r = 5;
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


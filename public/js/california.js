var width = 1000,   // Width of SVG canvas    
    height = 1000;  // Height of SVG canvas

// SVG Canvas
var svg = d3.select('body').append('svg').attr('viewBox', '0 0 ' + width 
                                               + ' ' + height)
                                               .attr('width', '100%'); 

// Tooltip Div
var tooltip = d3.select("body")
		      .append("div")
    		  .attr("class", "tooltip")
    		  .style("opacity", 0)
              .style("border-radius", "8px");

// Calculated Scale for Map Overlay
var scale = (512) * 0.5 / Math.PI * Math.pow(2, 5);

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
    'Los Angeles' : ['SHA', 'SCC', 'CCH', 'FRD', 'BCL']
}

var resConnections = {
    'SHA' : ['TRM', 'RLF', 'LEW', 'WRS', 'SNL']
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
        for (var reservoir of data) {
            reservoirMeasurements[reservoir.Name] = {};
            reservoirMeasurements[reservoir.Name]['capacity'] = reservoir.Capacity;
        }
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
    console.log(res);
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
            .on('mouseout', tooltipMouseout);
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
    console.log(d);
    var name = d.LakeName + ' (' + d.Name + ')';
    var elevation = 'Elevation: ' + d.Elevation;
    var capacity = 'Capacity: ' + d.Capacity;
    var html = '<p><strong>' + name + '</strong></p><p>' + 
        elevation + '</p><p>' + capacity + '</p>';
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
            el.style.fill = 'red';
            el.style.stroke = 'red';
            el.style.opacity = 1;
            el.style.r = 10;
        }
    }
    
}

/* Hides the tooltip div when the mouse leaves a region */
function tooltipMouseout(d) {
    tooltip.transition().duration(500).style("opacity", 0);
    var res = document.getElementsByClassName('res');
    console.log(res);
    for (var reservoir of res) {
        reservoir.style.fill = 'black';
        reservoir.style.stroke = 'black';
        reservoir.style.opacity = 0.4;
        reservoir.style.r = 5;
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
    currRes.style.fill = 'red';
    currRes.style.stroke = 'red';
    currRes.style.opacity = 1;
    currRes.style.r = 10;
    
    if (resConnections[d.Name]) {
        for (var connectedRes of resConnections[d.Name]) {
            var el = document.getElementById(connectedRes);
            el.style.fill = 'red';
            el.style.stroke = 'red';
            el.style.opacity = 1;
            el.style.r = 10;
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


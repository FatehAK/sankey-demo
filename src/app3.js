(function() {

    const margin = 10;
    const width = 740;
    const height = 500;
    const svgBackground = "#eee";
    const svgBorder = "1px solid #333";
    const nodeWidth = 24;
    const nodePadding = 16;
    const nodeOpacity = 0.8;
    const linkOpacity = 0.5;
    const nodeDarkenFactor = 0.3;
    const nodeStrokeWidth = 4;
    const arrow = "\u2192";
    const nodeAlignment = d3.sankeyCenter;
    const colorScale = d3.interpolateRainbow;
    const path = d3.sankeyLinkHorizontal();
    let initialMousePosition = {};
    let initialNodePosition = {};

    function addGradientStop(gradients, offset, fn) {
        return gradients.append("stop")
            .attr("offset", offset)
            .attr("stop-color", fn);
    }

    function color(index) {
        let ratio = index / (data.nodes.length - 1.0);
        return colorScale(ratio);
    }

    function darkenColor(color, factor) {
        return d3.color(color).darker(factor)
    }

    function getGradientId(d) {
        return `gradient_${d.source.id}_${d.target.id}`;
    }

    function getMousePosition(e) {
        e = e || d3.event;
        return {
            x: e.x,
            y: e.y
        };
    }

    function getNodePosition(node) {
        return {
            x: +node.attr("x"),
            y: +node.attr("y"),
            width: +node.attr("width"),
            height: +node.attr("height")
        };
    }

    function moveNode(node, position) {
        position.width = position.width || +(node.attr("width"));
        position.height = position.height || +(node.attr("height"));
        if (position.x < 0) {
            position.x = 0;
        }
        if (position.y < 0) {
            position.y = 0;
        }
        if (position.x + position.width > graphSize[0]) {
            position.x = graphSize[0] - position.width;
        }
        if (position.y + position.height > graphSize[1]) {
            position.y = graphSize[1] - position.height;
        }
        node.attr("x", position.x)
            .attr("y", position.y);
        let nodeData = node.data()[0];
        nodeData.x0 = position.x
        nodeData.x1 = position.x + position.width;
        nodeData.y0 = position.y;
        nodeData.y1 = position.y + position.height;
        sankey.update(graph);
        svgLinks.selectAll("linearGradient")
            .attr("x1", d => d.source.x1)
            .attr("x2", d => d.target.x0);
        svgLinks.selectAll("path")
            .attr("d", path);
    }

    function onDragDragging() {
        let currentMousePosition = getMousePosition(d3.event);
        let delta = {
            x: currentMousePosition.x - initialMousePosition.x,
            y: currentMousePosition.y - initialMousePosition.y
        };
        let thisNode = d3.select(this);
        let newNodePosition = {
            x: initialNodePosition.x + delta.x,
            y: initialNodePosition.y + delta.y,
            width: initialNodePosition.width,
            height: initialNodePosition.height
        };
        moveNode(thisNode, newNodePosition);
    }

    function onDragEnd() {
        let node = d3.select(this)
            .attr("stroke-width", 0);
    }

    function onDragStart() {
        let node = d3.select(this)
            .raise()
            .attr("stroke-width", nodeStrokeWidth);
        setInitialNodePosition(node);
        initialNodePosition = getNodePosition(node);
        initialMousePosition = getMousePosition(d3.event);
    }

    function reduceUnique(previous, current) {
        if (previous.indexOf(current) < 0) {
            previous.push(current);
        }
        return previous;
    }

    function setInitialMousePosition(e) {
        initialMousePosition.x = e.x;
        initialMousePosition.y = e.y;
    }

    function setInitialNodePosition(node) {
        let pos = node ? getNodePosition(node) : { x: 0, y: 0, width: 0, height: 0 };
        initialNodePosition.x = pos.x;
        initialNodePosition.y = pos.y;
        initialNodePosition.width = pos.width;
        initialNodePosition.height = pos.height;
    }

    function sumValues(previous, current) {
        previous += current;
        return previous;
    }

    const data = {
        nodes: [
            { id: "A1" },
            { id: "A2" },
            { id: "A3" },
            { id: "B1" },
            { id: "B2" },
            { id: "B3" },
            { id: "B4" },
            { id: "C1" },
            { id: "C2" },
            { id: "C3" },
            { id: "D1" },
            { id: "D2" }
        ],
        links: [
            { source: "A1", target: "B1", value: 27 },
            { source: "A1", target: "B2", value: 9 },
            { source: "A2", target: "B2", value: 5 },
            { source: "A2", target: "B3", value: 11 },
            { source: "A3", target: "B2", value: 12 },
            { source: "A3", target: "B4", value: 7 },
            { source: "B1", target: "C1", value: 13 },
            { source: "B1", target: "C2", value: 10 },
            { source: "B4", target: "C2", value: 5 },
            { source: "B4", target: "C3", value: 2 },
            { source: "B1", target: "D1", value: 4 },
            { source: "C3", target: "D1", value: 1 },
            { source: "C3", target: "D2", value: 1 }
        ]
    }

    const svg = d3.select("#canvas")
        .attr("width", width)
        .attr("height", height)
        .style("background-color", svgBackground)
        .style("border", svgBorder)
        .append("g")
        .attr("transform", `translate(${margin},${margin})`);

    // Define our sankey instance.
    const graphSize = [width - 2 * margin, height - 2 * margin];
    const sankey = d3.sankey()
        .size(graphSize)
        .nodeId(d => d.id)
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .nodeAlign(nodeAlignment);
    let graph = sankey(data);

    // Loop through the nodes. Set additional properties to make a few things
    // easier to deal with later.
    graph.nodes.forEach(node => {
        let fillColor = color(node.index);
        node.fillColor = fillColor;
        node.strokeColor = darkenColor(fillColor, nodeDarkenFactor);
        node.width = node.x1 - node.x0;
        node.height = node.y1 - node.y0;
    });

    // Build the links.
    let svgLinks = svg.append("g")
        .classed("links", true)
        .selectAll("g")
        .data(graph.links)
        .enter()
        .append("g");

    let gradients = svgLinks.append("linearGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", d => d.source.x1)
        .attr("x2", d => d.target.x0)
        .attr("id", d => getGradientId(d));
    addGradientStop(gradients, 0.0, d => color(d.source.index));
    addGradientStop(gradients, 1.0, d => color(d.target.index));
    svgLinks.append("path")
        .classed("link", true)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", d => `url(#${getGradientId(d)})`)
        .attr("stroke-width", d => Math.max(1.0, d.width))
        .attr("stroke-opacity", linkOpacity);

    // Add hover effect to links.
    svgLinks.append("title")
        .text(d => `${d.source.id} ${arrow} ${d.target.id}\n${d.value}`);

    /* nodes */
    // let svgNodes = svg.append("g")
    //     .classed("nodes", true)
    //     .selectAll("rect")
    //     .data(graph.nodes)
    //     .enter()

    //     .append("rect")
    //     .classed("node", true)
    //     .attr("x", d => d.x0)
    //     .attr("y", d => d.y0)
    //     .attr("width", d => d.width)
    //     .attr("height", d => d.height)
    //     .attr("fill", d => d.fillColor)
    //     .attr("opacity", nodeOpacity)
    //     .attr("stroke", d => d.strokeColor)
    let svgNodes = svg.append("g")
        .classed("nodes", true)
        .selectAll("nodes")
        // .selectAll("text")
        .data(graph.nodes)
        .enter()

    svgNodes.append("rect")
        .classed("node", true)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.width)
        .attr("height", d => d.height)
        .attr("fill", d => d.fillColor)
        .attr("opacity", nodeOpacity)
        .attr("stroke", d => d.strokeColor)
        .attr("stroke-width", 0)

    svgNodes.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.5rem")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .attr("fill-opacity", 0.7)
        .attr('font-size', '1rem')
        .attr("transform", null)
        .text(d => `${d.id}`);

    // Add hover effect to nodes.
    // svgNodes.append("title")
    //     .text(d => `${d.id}\n${d.value} unit(s)`);

    // svgNodes.append('text')
    //     // .attr("x", -6)
    //     // .attr("y", function(d) { return d.dy / 2; })
    //     .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    //     .attr("y", d => (d.y1 + d.y0) / 2)
    //     .attr("dy", "1rem")
    //     .attr("text-anchor", "end")
    //     .attr("transform", null)
    //     .text(function(d) { return d.id; })
    //     // .filter(function(d) { return d.x < width / 2; })
    //     .attr("x", 6 + sankey.nodeWidth())
    //     .attr("text-anchor", "start");

    // svgNodes.append("text")
    //     // .style("font", "10px sans-serif")
    //     // .selectAll("text")
    //     .data(graph.nodes)
    //     .join("text")
    //     .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    //     .attr("y", d => (d.y1 + d.y0) / 2)
    //     .attr("dy", "0.5rem")
    //     .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    //     .text(d => d.name)
    //     .append("tspan")
    //     .attr("fill-opacity", 0.7)
    //     .attr('font-size', '1rem')
    //     .text(d => ` ${d.id.toLocaleString()}`);

    // svg.append("g")
    //     // .style("font", "10px sans-serif")
    //     .selectAll("text")
    //     .data(graph.nodes)
    //     .join("text")
    //     .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    //     .attr("y", d => (d.y1 + d.y0) / 2)
    //     .attr("dy", "0.5rem")
    //     .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    //     .text(d => d.name)
    //     .append("tspan")
    //     .attr("fill-opacity", 0.7)
    //     .attr('font-size', '1rem')
    //     .text(d => ` ${d.id.toLocaleString()}`);

    let nodeDepths = graph.nodes
        .map(n => n.depth)
        .reduce(reduceUnique, []);

    nodeDepths.forEach(d => {
        let nodesAtThisDepth = graph.nodes.filter(n => n.depth === d);
        let numberOfNodes = nodesAtThisDepth.length;
        let totalHeight = nodesAtThisDepth
            .map(n => n.height)
            .reduce(sumValues, 0);
        let whitespace = graphSize[1] - totalHeight;
        let balancedWhitespace = whitespace / (numberOfNodes + 1.0);
        console.log("depth", d, "total height", totalHeight, "whitespace", whitespace, "balanced whitespace", balancedWhitespace);
    });

    svgNodes.call(d3.drag()
        .on("start", onDragStart)
        .on("drag", onDragDragging)
        .on("end", onDragEnd));
    console.log("sankey1.js loaded.");
})();

// function chart() {
//     const data = {
//         nodes: [
//             { "name": "A", "h": 2 },
//             { "name": "B", "h": 3 },
//             { "name": "C", "h": 4 }
//         ],
//         links: [
//             { "source": 0, "target": 1, "value": 1 },
//             { "source": 1, "target": 2, "value": 1 }
//         ]
//     };

//     const svg = d3.select('.chart')
//         .style("background", "#fff")
//     // .style("width", "100%")
//     // .style("height", "auto");
//     // const svg = d3.select(DOM.svg(width, height))
//     //     .style("background", "#fff")
//     //     .style("width", "100%")
//     //     .style("height", "auto");

//     const { nodes, links } = sankey({
//         nodes: data.nodes.map(d => Object.assign({}, d)),
//         links: data.links.map(d => Object.assign({}, d))
//     });

//     svg.append("g")
//         .selectAll("rect")
//         .data(nodes)
//         .join("rect")
//         .attr("x", d => d.x0 + 1)
//         .attr("y", d => d.y0)
//         .attr("height", d => d.y1 - d.y0)
//         .attr("width", d => d.x1 - d.x0 - 2)
//         .attr("fill", d => {
//             let c;
//             for (const link of d.sourceLinks) {
//                 if (c === undefined) c = link.color;
//                 else if (c !== link.color) c = null;
//             }
//             if (c === undefined) for (const link of d.targetLinks) {
//                 if (c === undefined) c = link.color;
//                 else if (c !== link.color) c = null;
//             }
//             return (d3.color(c) || d3.color(color)).darker(0.5);
//         })
//         .append("title")
//         .text(d => `${d.name}\n${d.value.toLocaleString()}`);

//     const link = svg.append("g")
//         .attr("fill", "none")
//         .selectAll("g")
//         .data(links)
//         .join("g")
//         .attr("stroke", d => d3.color(d.color) || color)
//         .style("mix-blend-mode", "multiply");

//     link.append("path")
//         .attr("d", d3.sankeyLinkHorizontal())
//         .attr("stroke-width", d => Math.max(1, d.width));

//     link.append("title")
//         .text(d => `${d.source.name} → ${d.target.name}\n${d.value.toLocaleString()}`);

//     svg.append("g")
//         .style("font", "10px sans-serif")
//         .selectAll("text")
//         .data(nodes)
//         .join("text")
//         .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
//         .attr("y", d => (d.y1 + d.y0) / 2)
//         .attr("dy", "0.35em")
//         .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
//         .text(d => d.name)
//         .append("tspan")
//         .attr("fill-opacity", 0.7)
//         .text(d => ` ${d.value.toLocaleString()}`);

//     return svg.node();
// }

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './AssetAllocationChart.css'; // The shared CSS file contains chart variables

const AssetAllocationChart = ({ data }) => {
  const chartRef = useRef(null);

  // Define color mapping from root variables
  const colorMap = {
    '#f59e0b': 'var(--accent-orange)', // Bitcoin
    '#3b82f6': 'var(--accent-blue)', // Ethereum
    '#22c55e': 'var(--accent-green-bright)', // Solana (bright green needed for visibility)
    '#eab308': 'var(--accent-yellow)', // BNB
    '#6b7280': 'var(--text-muted)' // Others
  };

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;

    // --- Chart Data & Dimensions ---
    const width = 200;
    const height = 200;
    const innerRadius = 70; // This controls the donut hole size
    const outerRadius = 90;

    // --- Setup SVG and Container ---
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove(); // Clear previous rendering on data change

    const container = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // --- Color Scale ---
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(data.map(d => colorMap[d.color] || d.color)); // Use mapped color or fallback

    // --- Compute Arc & Pie ---
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(10) // Matches the rounded look in image
      .padAngle(0.04); // Adds space between segments

    // --- Generate Arcs ---
    const arcs = container.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.name))
      .style("transition", "all 0.3s ease")
      .on("mouseover", function() {
        d3.select(this).style("filter", "drop-shadow(var(--glow-soft))");
      })
      .on("mouseout", function() {
        d3.select(this).style("filter", "none");
      });

    // --- Calculate Total Portfolio Value ---
    const totalValue = data.reduce((sum, item) => sum + item.usdValue, 0);
    const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalValue);

    // --- Center Text (Total Label & Value) ---
    const textGroup = container.append("g")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em");

    textGroup.append("text")
      .attr("class", "chart-label-text")
      .attr("y", -10)
      .text("Total");

    textGroup.append("text")
      .attr("class", "chart-value-text")
      .attr("y", 15)
      .text(formattedTotal);

  }, [data]);

  return (
    <div className="chart-and-legend-container">
      <div className="chart-wrapper">
        <svg ref={chartRef} width={200} height={200}></svg>
      </div>
      <div className="legend-wrapper">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <span 
              className="legend-dot" 
              style={{ backgroundColor: colorMap[item.color] || item.color }} 
            />
            <span className="legend-name text-muted">{item.name} ({item.symbol})</span>
            <span className="legend-percentage">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocationChart;
// src/components/LanguageGraph.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { useTheme } from "../contexts/ThemeContext"; // Import useTheme

interface LanguageGraphProps {
  languages: Record<string, number>;
}

const LanguageGraph: React.FC<LanguageGraphProps> = ({ languages }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 20 }); // Adjusted height for a sleeker bar
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    language: string;
    percentage: number;
  } | null>(null);
  const { theme } = useTheme(); // Use the theme hook

  // Define color palettes for dark and light themes
  const darkThemeColors = [
    "#586e75",
    "#859900",
    "#cb4b16",
    "#dc322f",
    "#d33682",
    "#6c71c4",
    "#268bd2",
    "#2aa198",
    "#b58900",
    "#657b83",
  ]; // Slightly adjusted for dark theme

  const lightThemeColors = [
    "#00876c",
    "#6aae9c",
    "#b4d4cf",
    "#d33682",
    "#cb4b16",
    "#d33682",
    "#268bd2",
    "#b58900",
    "#dc322f",
    "#6c71c4",
  ]; // Vibrant colors for light theme

  const currentColors = theme === "dark" ? darkThemeColors : lightThemeColors;

  const customColorScale = useCallback(
    (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % currentColors.length;
      return currentColors[index];
    },
    [currentColors]
  ); // Depend on currentColors to re-evaluate on theme change

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions((prev) => ({
          width: containerRef.current ? containerRef.current.clientWidth : 0,
          height: prev.height,
        }));
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (
      !dimensions.width ||
      !dimensions.height ||
      !languages ||
      Object.keys(languages).length === 0
    ) {
      setTooltip(null); // Hide tooltip if no data
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0
    );
    if (totalBytes === 0) {
      setTooltip(null); // Hide tooltip if no data
      return;
    }

    const languageData = Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: (bytes / totalBytes) * 100,
      }))
      .sort((a, b) => b.bytes - a.bytes); // Sort by size descending

    type LanguageData = (typeof languageData)[number]; // Define the type for language data

    let currentX = 0;

    svg
      .selectAll(".language-bar")
      .data<LanguageData>(languageData)
      .enter()
      .append("rect")
      .attr("class", "language-bar")
      .attr("x", (d: LanguageData) => {
        const xPos = currentX;
        currentX += (d.percentage / 100) * dimensions.width;
        return xPos;
      })
      .attr("y", 0)
      .attr(
        "width",
        (d: LanguageData) => (d.percentage / 100) * dimensions.width
      )
      .attr("height", dimensions.height)
      .attr("fill", (d: LanguageData) => customColorScale(d.name))
      .attr("rx", 3) // Rounded corners
      .attr("ry", 3)
      .on(
        "mouseover",
        (
          event: React.MouseEvent<SVGRectElement, MouseEvent>,
          d: { name: string; bytes: number; percentage: number }
        ) => {
          d3.select(event.currentTarget).attr("opacity", 0.8); // Slight opacity change on hover
          setTooltip({
            x: event.pageX, // Use pageX
            y: event.pageY, // Use pageY
            language: d.name,
            percentage: parseFloat(d.percentage.toFixed(2)),
          });
        }
      )
      .on(
        "mousemove",
        function (event: React.MouseEvent<SVGRectElement, MouseEvent>) {
          // Update tooltip position to follow mouse with a small offset
          setTooltip((prev) =>
            prev ? { ...prev, x: event.pageX + 10, y: event.pageY + 10 } : null
          );
        }
      )
      .on("mouseout", (event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
        d3.select(event.currentTarget).attr("opacity", 1);
        setTooltip(null);
      });
  }, [languages, dimensions, customColorScale]);

  return (
    <div className="language-graph-container">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: `${dimensions.height}px`,
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
        ></svg>
      </div>
      {/* Legend */}
      <div className="language-legend">
        {Object.entries(languages)
          .sort(([, a], [, b]) => b - a)
          .map(([name]) => (
            <div key={name} className="language-legend-item">
              <span
                className="legend-color-box"
                style={{ backgroundColor: customColorScale(name) }}
              ></span>
              <span className="legend-text">{name}</span>
            </div>
          ))}
      </div>
      {tooltip && (
        <div
          className="language-tooltip"
          style={{
            left: tooltip.x + "px",
            top: tooltip.y + "px",
            position: "absolute",
            backgroundColor: "var(--tooltip-background)", // Use CSS variable
            color: "var(--tooltip-text)", // Use CSS variable
            padding: "5px 10px",
            borderRadius: "4px",
            pointerEvents: "none", // Important for tooltip not to block mouse events on the bar
            zIndex: 1000,
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.language}: {tooltip.percentage}%
        </div>
      )}
    </div>
  );
};

export default LanguageGraph;

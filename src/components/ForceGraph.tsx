import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { buildTree, TreeNode } from '../utils/data-transformer';
import { GitTreeResponse } from '../services/github';

interface ForceGraphProps {
  data: GitTreeResponse;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set dimensions based on parent container
    const updateDimensions = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        setDimensions({
          width: svgRef.current.parentElement.clientWidth,
          height: svgRef.current.parentElement.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !data) return;

    const hierarchicalData = buildTree(data.tree);

    interface GraphNode extends d3.SimulationNodeDatum {
      id: string;
      name: string;
      isBranch: boolean;
    }

    interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
      source: string;
      target: string;
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const transformToGraphData = (treeNodes: TreeNode[], parentId: string | null) => {
      treeNodes.forEach(node => {
        const nodeId = node.path;
        if (!nodeMap.has(nodeId)) {
          const newNode: GraphNode = { id: nodeId, name: node.name, isBranch: node.isBranch };
          nodes.push(newNode);
          nodeMap.set(nodeId, newNode);
        }

        if (parentId !== null) {
          links.push({ source: parentId, target: nodeId });
        }

        if (node.children && node.children.length > 0) {
          transformToGraphData(node.children, nodeId);
        }
      });
    };

    transformToGraphData(hierarchicalData, null);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const g = svg.append('g'); // Group for all graph elements to be zoomed

    const simulation = d3.forceSimulation<GraphNode, GraphLink>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id as string).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));

    const link = g.append('g') // Append links to the zoomable group 'g'
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5);

    const nodeGroup = g.append('g') // Append nodes to the zoomable group 'g'
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    nodeGroup.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.isBranch ? 'var(--accent-color)' : '#bbb');

    nodeGroup.append('text')
      .attr('x', 12)
      .attr('y', '0.31em')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('stroke', 'none')
      .text(d => d.name);

    nodeGroup.append('title')
      .text(d => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      nodeGroup.attr('transform', d => `translate(${d.x!},${d.y!})`);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [dimensions.width, dimensions.height]])
      .scaleExtent([0.1, 8])
      .on('zoom', zoomed);

    svg.call(zoom);

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      g.attr('transform', event.transform.toString());
    }

    function drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGCircleElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

  }, [data, dimensions]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default ForceGraph;

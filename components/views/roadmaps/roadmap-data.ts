import type { ApiRoadmapDay } from "@/lib/api-types";

export type RoadmapDay = ApiRoadmapDay;

export const PREVIEW_ROADMAP: RoadmapDay[] = [
  {
    day: 1,
    title: "Foundations & Layering Paradigms",
    topic:
      "Introduction to layered protocols, TCP/IP stack vs OSI model, packet switching basics, and performance metrics (delay, loss).",
    resources: [
      "Introduction to Layers & Protocols.pdf",
      "Computer Networks: System Approach (Slides)",
      "Network Architecture 101 (YouTube)",
    ],
    tasks: [
      "Read Layering paradigms slide deck",
      "Explain propagation vs transmission delay differences",
      "Summarize peer-to-peer vs client-server models",
    ],
    pyqs: [
      "State differences between OSI and TCP/IP protocol architectures (2024, 2022 repeats)",
      "Calculate throughput for a multi-hop link (2023 exam)",
    ],
    done: [true, false, false, false, false],
  },
  {
    day: 2,
    title: "Link Layer & Media Access Control",
    topic:
      "Error detection (parity, CRC), sliding window protocols, multiple access protocols (CSMA/CD, CSMA/CA), Ethernet, and switching.",
    resources: [
      "Sliding Window Protocols Visual Guide.pdf",
      "CRC Error Detection Solver",
      "CSMA/CD Collision Resolution Note",
    ],
    tasks: [
      "Attempt 5 practice questions on CRC generation and validation",
      "Verify sliding window sequence numbers",
      "Understand MAC vs IP address resolutions",
    ],
    pyqs: [
      "Describe sliding window flow control protocols (2023, 2021 repeat)",
      "Show how switch learns MAC addresses dynamically (2022 exam)",
    ],
    done: [true, true, false, false, false],
  },
  {
    day: 3,
    title: "Routing Algorithms & Subnetting",
    topic:
      "IP addressing, CIDR subnetting, Distance Vector vs Link State routing, packet forwarding mechanics, and NAT mappings.",
    resources: [
      "IP Subnetting Cheat Sheet.pdf",
      "Dijkstra Routing Visualizer",
      "NAT Port Mapping Handout",
    ],
    tasks: [
      "Solve subnetting allocation problems for 4 networks",
      "Trace Dijkstra shortest path computation",
      "Compare IPv4 and IPv6 headers side-by-side",
    ],
    pyqs: [
      "Given an IP block, partition it into 4 subnets (2024, 2023 repeat)",
      "Explain link-state routing vs distance-vector routing (2023 exam)",
    ],
    done: [false, false, false, false, false],
  },
  {
    day: 4,
    title: "Transport Protocols & Congestion Control",
    topic:
      "TCP 3-way handshake, connection release, flow control, congestion window phases (Slow Start, Congestion Avoidance, Fast Recovery).",
    resources: [
      "TCP Congestion Control note.pdf",
      "Connection Handshake Trace",
      "UDP vs TCP Header Comparison",
    ],
    tasks: [
      "Graph TCP window sizing during packet drops",
      "Understand TCP Retransmission Timeout calculation",
      "Review UDP sockets architecture",
    ],
    pyqs: [
      "Discuss TCP congestion window phase shifts on duplicate ACKs (2023, 2021 repeat)",
      "Explain why UDP is preferred for real-time video (2022 exam)",
    ],
    done: [false, false, false, false, false],
  },
  {
    day: 5,
    title: "Application Layer & Security Principles",
    topic:
      "DNS resolution stages, HTTP/1.1 vs HTTP/2 multiplexing, SMTP email delivery, symmetric/asymmetric cryptography (RSA), SSL/TLS handshakes.",
    resources: [
      "DNS Resolution Walkthrough.pdf",
      "Web Server protocols cheat sheet",
      "Intro to RSA & Cryptography",
    ],
    tasks: [
      "Trace a recursive DNS resolution path",
      "Review TLS cipher suite negotiations",
      "Revise public key encryption mathematical steps",
    ],
    pyqs: [
      "Explain the TLS handshake procedure (2024 repeat)",
      "Differentiate symmetric key vs asymmetric key cryptography (2023 exam)",
    ],
    done: [false, false, false, false, false],
  },
];

export function roadmapCompletedCount(day: RoadmapDay) {
  return day.done.filter(Boolean).length;
}

export function roadmapProgress(day: RoadmapDay) {
  if (!day.done.length) return 0;
  return Math.round((roadmapCompletedCount(day) / day.done.length) * 100);
}

export function roadmapChartHeight(count: number) {
  if (count <= 3) return 300;
  if (count <= 5) return 450;
  return 600;
}

export function roadmapPillStyle(index: number, count: number) {
  const colWidth = 100 / count;
  return {
    left: `${index * colWidth + 1}%`,
    top: `${index * 76 + 18}px`,
    width: `${colWidth - 2}%`,
    animationDelay: `${index * 80}ms`,
  };
}

export function roadmapPathData(count: number) {
  const centers = Array.from({ length: count }, (_, index) => {
    const colWidth = 100 / count;
    const left = index * colWidth + 1;
    const width = colWidth - 2;
    return {
      x: (left + width / 2) * 10,
      y: index * 76 + 67,
    };
  });

  if (!centers.length) return "";
  return centers.slice(1).reduce((path, point, index) => {
    const previous = centers[index];
    const midX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${centers[0].x} ${centers[0].y}`);
}

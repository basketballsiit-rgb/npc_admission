"use client";

import React, { useState } from "react";
import { DepartmentKey, DEPARTMENTS } from "@/lib/guidance-config";

interface RadarChartProps {
  scores: Record<DepartmentKey, number>;
  maxScore?: number;
  highlightDept?: DepartmentKey;
  theme?: "light" | "dark" | "cyber";
  hideScores?: boolean;
  hideHint?: boolean;
  containerClassName?: string;
}

const AXIS_KEYS: DepartmentKey[] = ["AUTO", "ELEC", "TRON", "IT", "ACC", "MKT"];

export default function RadarChart({
  scores,
  maxScore = 15,
  highlightDept,
  theme = "light",
  hideScores = false,
  hideHint = false,
  containerClassName,
}: RadarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<DepartmentKey | null>(null);

  const isCyber = theme === "cyber";
  const viewBoxW = isCyber ? 324 : 440;
  const viewBoxH = isCyber ? 228 : 440;
  const centerX = viewBoxW / 2;
  const centerY = viewBoxH / 2;
  const radius = isCyber ? 62 : 115;

  // Concentric levels (3, 6, 9, 12, 15)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper: compute (x, y) for an axis index and relative ratio (0 to 1)
  // Start from top (-90 deg), clockwise
  const getCoordinates = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / AXIS_KEYS.length - Math.PI / 2;
    const x = centerX + radius * ratio * Math.cos(angle);
    const y = centerY + radius * ratio * Math.sin(angle);
    return { x, y, angle };
  };

  // Build grid polygon points
  const gridPolygons = levels.map((lvl) => {
    return AXIS_KEYS.map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  });

  // Build data polygon points
  const dataPoints = AXIS_KEYS.map((key, i) => {
    const score = Math.max(0, Math.min(scores[key] || 0, maxScore));
    const ratio = score / maxScore;
    const { x, y } = getCoordinates(i, ratio);
    return { key, x, y, score, ratio };
  });

  const polygonPath = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const activeHoverKey = hoveredKey || highlightDept || null;
  const activePoint = dataPoints.find((p) => p.key === activeHoverKey);

  // Build accessible summary text for screen readers
  const ariaSummary = `กราฟใยแมงมุมแสดงคะแนนความถนัด 6 แผนกวิชา: ${AXIS_KEYS.map((key) => {
    const dept = DEPARTMENTS[key];
    const score = scores[key] || 0;
    const pct = Math.round((score / maxScore) * 100);
    return `${dept.shortName} ${score} จาก ${maxScore} คะแนน (${pct}%)`;
  }).join(", ")}`;

  const handleToggleKey = (key: DepartmentKey) => {
    setHoveredKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`relative w-full ${containerClassName || (isCyber ? "w-full h-full" : "max-w-[380px] aspect-square")} flex items-center justify-center`}>
        <svg
          role="img"
          aria-label={ariaSummary}
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full h-full overflow-visible select-none drop-shadow-xs"
        >
          {/* Background */}
          {isCyber ? (
            <rect
              width={viewBoxW}
              height={viewBoxH}
              rx={14}
              fill="#0b1b3d"
              fillOpacity={0.96}
            />
          ) : (
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill={theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "#F8FAFC"}
              className="transition-colors"
            />
          )}

          {/* Grid Concentric Polygons */}
          {gridPolygons.map((pts, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={pts}
              fill="none"
              stroke={
                isCyber
                  ? "#60a5fa"
                  : theme === "dark"
                  ? "rgba(255, 255, 255, 0.25)"
                  : "#E2E8F0"
              }
              strokeWidth={idx === levels.length - 1 ? 1.5 : 1}
              strokeOpacity={isCyber ? 0.35 : 1}
              strokeDasharray={idx < levels.length - 1 ? "3 3" : undefined}
            />
          ))}

          {/* Axis lines from center to outer vertex */}
          {AXIS_KEYS.map((key, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            return (
              <line
                key={`axis-${key}`}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={
                  isCyber
                    ? "#93c5fd"
                    : theme === "dark"
                    ? "rgba(255, 255, 255, 0.3)"
                    : "#CBD5E1"
                }
                strokeWidth={1}
                strokeOpacity={isCyber ? 0.45 : 1}
              />
            );
          })}

          {/* Data Filled Polygon */}
          <polygon
            points={polygonPath}
            fill={
              isCyber
                ? "rgba(251, 191, 36, 0.32)"
                : theme === "dark"
                ? "rgba(245, 158, 11, 0.38)"
                : "rgba(30, 58, 138, 0.22)"
            }
            stroke={isCyber ? "#fbbf24" : theme === "dark" ? "#F59E0B" : "#1E3A8A"}
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Outer Vertex Labels and Badges */}
          {AXIS_KEYS.map((key, i) => {
            const { x, y, angle } = getCoordinates(i, isCyber ? 1.24 : 1.22);
            const dept = DEPARTMENTS[key];
            const score = scores[key] || 0;
            const pct = Math.round((score / maxScore) * 100);
            const isHovered = activeHoverKey === key;

            // Anchor text according to angle
            let textAnchor: "middle" | "start" | "end" = "middle";
            if (Math.cos(angle) > 0.3) textAnchor = "start";
            else if (Math.cos(angle) < -0.3) textAnchor = "end";

            return (
              <g
                key={`label-${key}`}
                role="button"
                tabIndex={isCyber ? -1 : 0}
                aria-label={`${dept.name}: ${score} จาก ${maxScore} คะแนน (${pct}%)`}
                className="cursor-pointer transition-transform duration-200 focus:outline-hidden"
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                onFocus={() => setHoveredKey(key)}
                onBlur={() => setHoveredKey(null)}
                onClick={() => handleToggleKey(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleKey(key);
                  }
                }}
              >
                <text
                  x={x}
                  y={hideScores ? y : y - 7}
                  textAnchor={textAnchor}
                  dominantBaseline={hideScores ? "central" : "auto"}
                  fill={
                    isCyber
                      ? isHovered
                        ? "#fde68a"
                        : "#ffffff"
                      : theme === "dark"
                      ? isHovered
                        ? "#fcd34d"
                        : "#ffffff"
                      : isHovered
                      ? "#1e3a8a"
                      : "#0f172a"
                  }
                  fontSize={isCyber ? 11 : 13}
                  fontWeight={700}
                  style={{
                    filter: isCyber ? "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" : undefined,
                    userSelect: "none",
                  }}
                  className="select-none"
                >
                  {dept.shortName}
                </text>
                {!hideScores && (
                  <text
                    x={x}
                    y={y + 9}
                    textAnchor={textAnchor}
                    fill={
                      isCyber
                        ? "#fde68a"
                        : theme === "dark"
                        ? isHovered
                          ? "#6ee7b7"
                          : "#fcd34d"
                        : isHovered
                        ? "#d97706"
                        : "#1e3a8a"
                    }
                    fontSize={12}
                    fontWeight="bold"
                    style={{
                      fontFamily: "monospace",
                      filter: isCyber ? "drop-shadow(0 1px 2px rgba(0,0,0,0.9))" : undefined,
                      userSelect: "none",
                    }}
                    className="text-xs font-mono font-bold"
                  >
                    {score}/{maxScore} ({pct}%)
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertex Point Circles with generous >=44px touch hit-areas */}
          {dataPoints.map((pt) => {
            const isHovered = activeHoverKey === pt.key;
            const dept = DEPARTMENTS[pt.key];
            return (
              <g
                key={`point-${pt.key}`}
                role="button"
                tabIndex={isCyber ? -1 : 0}
                aria-label={`ดูคะแนน ${dept.name}: ${pt.score}/${maxScore}`}
                className="cursor-pointer focus:outline-hidden"
                onMouseEnter={() => setHoveredKey(pt.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onFocus={() => setHoveredKey(pt.key)}
                onBlur={() => setHoveredKey(null)}
                onClick={() => handleToggleKey(pt.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleKey(pt.key);
                  }
                }}
              >
                {/* Invisible generous touch target (>= 44x44px) */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isCyber ? 18 : 24}
                  fill="transparent"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? (isCyber ? 6 : 8) : isCyber ? 4.5 : 5.5}
                  fill={isCyber ? "#fbbf24" : isHovered ? "#F59E0B" : "#1E3A8A"}
                  stroke="#FFFFFF"
                  strokeWidth={isCyber ? 1.5 : 2}
                  className="transition-all duration-200 shadow-md"
                />
              </g>
            );
          })}
        </svg>

        {/* Screen-Reader Accessible Score Table */}
        <table className="sr-only">
          <caption>ตารางคะแนนความถนัดรายแผนกวิชา วิทยาลัยสารพัดช่างน่าน</caption>
          <thead>
            <tr>
              <th scope="col">แผนกวิชา</th>
              <th scope="col">คะแนนที่ได้</th>
              <th scope="col">ร้อยละ</th>
            </tr>
          </thead>
          <tbody>
            {AXIS_KEYS.map((key) => {
              const score = scores[key] || 0;
              const pct = Math.round((score / maxScore) * 100);
              return (
                <tr key={key}>
                  <td>{DEPARTMENTS[key].name}</td>
                  <td>
                    {score}/{maxScore}
                  </td>
                  <td>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Floating Tooltip inside container */}
        {activePoint && !isCyber && (
          <div
            onClick={() => setHoveredKey(null)}
            className="absolute z-10 bg-slate-900/95 text-white rounded-xl px-3.5 py-2 text-xs shadow-xl backdrop-blur-xs border border-white/15 cursor-pointer"
            style={{
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                <span className="font-bold">
                  {DEPARTMENTS[activePoint.key].name}
                </span>
              </div>
              {hoveredKey && (
                <span className="text-[11px] text-slate-300 font-medium">
                  ✕
                </span>
              )}
            </div>
            <div className="text-xs text-slate-200 mt-0.5 tabular-nums">
              คะแนนความถนัด:{" "}
              <strong className="text-amber-300 font-mono text-sm">
                {activePoint.score}
              </strong>{" "}
              / {maxScore} คะแนน (
              {Math.round((activePoint.score / maxScore) * 100)}%)
            </div>
          </div>
        )}
      </div>

      {!hideHint && !hideScores && (
        <div className="text-center text-xs text-slate-500 mt-1.5">
          * แตะหรือชี้ที่มุมของกราฟใยแมงมุมเพื่อดูคะแนนรายแผนกวิชา
        </div>
      )}
    </div>
  );
}

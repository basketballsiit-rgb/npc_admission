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
  const viewBoxW = isCyber ? 280 : 440;
  const viewBoxH = isCyber ? 220 : 440;
  const centerX = viewBoxW / 2;
  const centerY = viewBoxH / 2;
  const radius = isCyber ? 68 : 115;

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

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`relative w-full ${containerClassName || (isCyber ? "w-full h-full" : "max-w-[380px] aspect-square")} flex items-center justify-center`}>
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full h-full overflow-visible select-none drop-shadow-xs"
        >
          {/* Background */}
          {isCyber ? (
            <rect
              width={viewBoxW}
              height={viewBoxH}
              rx={14}
              fill="#081426"
              fillOpacity={0.98}
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
                  ? "#0284c7"
                  : theme === "dark"
                  ? "rgba(255, 255, 255, 0.25)"
                  : "#E2E8F0"
              }
              strokeWidth={idx === levels.length - 1 ? 1.5 : 1}
              strokeOpacity={isCyber ? 0.45 : 1}
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
                    ? "#0ea5e9"
                    : theme === "dark"
                    ? "rgba(255, 255, 255, 0.3)"
                    : "#CBD5E1"
                }
                strokeWidth={1}
                strokeOpacity={isCyber ? 0.6 : 1}
              />
            );
          })}

          {/* Data Filled Polygon */}
          <polygon
            points={polygonPath}
            fill={
              isCyber
                ? "rgba(6, 182, 212, 0.48)"
                : theme === "dark"
                ? "rgba(245, 158, 11, 0.38)"
                : "rgba(30, 58, 138, 0.22)"
            }
            stroke={isCyber ? "#38bdf8" : theme === "dark" ? "#F59E0B" : "#1E3A8A"}
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Outer Vertex Labels and Badges */}
          {AXIS_KEYS.map((key, i) => {
            const { x, y, angle } = getCoordinates(i, isCyber ? 1.25 : 1.22);
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
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => setHoveredKey(key)}
              >
                <text
                  x={x}
                  y={hideScores ? y : y - 7}
                  textAnchor={textAnchor}
                  dominantBaseline={hideScores ? "central" : "auto"}
                  className={`select-none ${
                    isCyber
                      ? isHovered
                        ? "fill-cyan-300 font-black text-[11px]"
                        : "fill-white font-black text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                      : theme === "dark"
                      ? isHovered
                        ? "fill-amber-300 font-black text-[13px]"
                        : "fill-white font-black text-[13px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      : isHovered
                      ? "fill-[#1E3A8A] font-black text-[13px]"
                      : "fill-[#0F172A] font-black text-[13px]"
                  }`}
                >
                  {dept.shortName}
                </text>
                {!hideScores && (
                  <text
                    x={x}
                    y={y + 8}
                    textAnchor={textAnchor}
                    className={`text-[11px] font-mono font-bold ${
                      isCyber
                        ? "fill-cyan-300"
                        : theme === "dark"
                        ? isHovered
                          ? "fill-emerald-300 font-black"
                          : "fill-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                        : isHovered
                        ? "fill-amber-600 font-black"
                        : "fill-[#1E3A8A] font-black"
                    }`}
                  >
                    {score}/{maxScore} ({pct}%)
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertex Point Circles */}
          {dataPoints.map((pt) => {
            const isHovered = activeHoverKey === pt.key;
            return (
              <g
                key={`point-${pt.key}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredKey(pt.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => setHoveredKey(pt.key)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? (isCyber ? 6 : 8) : isCyber ? 4 : 5}
                  fill={isCyber ? "#38bdf8" : isHovered ? "#F59E0B" : "#1E3A8A"}
                  stroke="#FFFFFF"
                  strokeWidth={isCyber ? 1.5 : 2}
                  className="transition-all duration-200 shadow-md"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip inside container */}
        {activePoint && !isCyber && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-900/90 text-white rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-xs border border-white/10"
            style={{
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="font-bold">
                {DEPARTMENTS[activePoint.key].name}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              คะแนนความถนัด:{" "}
              <strong className="text-amber-400 font-mono text-sm">
                {activePoint.score}
              </strong>{" "}
              / {maxScore} คะแนน (
              {Math.round((activePoint.score / maxScore) * 100)}%)
            </div>
          </div>
        )}
      </div>

      {!hideHint && !hideScores && (
        <div className="text-center text-[11px] text-slate-400 mt-1">
          * แตะหรือชี้ที่มุมของกราฟใยแมงมุมเพื่อดูคะแนนรายแผนกวิชา
        </div>
      )}
    </div>
  );
}

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  score: number;
}

interface Props {
  data: DataPoint[];
}

export default function NPSTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[-100, 100]}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "8px",
            color: "#fff",
          }}
          labelStyle={{ color: "#9ca3af" }}
        />
        <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="4 4" label={{ value: "0", fill: "#6b7280", fontSize: 10 }} />
        <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Excellent", fill: "#22c55e", fontSize: 10 }} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#0ea5e9"
          strokeWidth={2}
          fill="url(#npsGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#0ea5e9" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

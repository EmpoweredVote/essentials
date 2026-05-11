import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';

/**
 * IndustryChart — horizontal bar chart showing campaign contributions by sector.
 *
 * Props:
 *   data — array of { sector: string, total: number, count: number }
 */

function formatDollarTick(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
}

function CustomTooltip({ active, payload }) {
  const { isDark } = useTheme();
  if (!active || !payload || !payload.length) return null;
  const { sector, total, count } = payload[0].payload;
  return (
    <div className={`rounded shadow-md px-3 py-2 text-sm border ${
      isDark
        ? 'bg-gray-800 border-gray-600 text-white'
        : 'bg-white border-gray-200 text-gray-800'
    }`}>
      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{sector}</p>
      <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(total)}
      </p>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{count} contribution{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function IndustryChart({ data }) {
  const { isDark } = useTheme();
  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm italic py-2">No sector data available</p>
    );
  }

  const chartHeight = Math.max(150, data.length * 30);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <YAxis
          type="category"
          dataKey="sector"
          width={140}
          tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#4b5563' }}
          tickLine={false}
          axisLine={false}
        />
        <XAxis
          type="number"
          tickFormatter={formatDollarTick}
          tick={{ fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
        />
        <Bar
          dataKey="total"
          fill="#3b82f6"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

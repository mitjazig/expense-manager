export const CHART = {
  accent: '#3b82f6',
  muted: '#6d6d72',
  grid: 'rgba(255, 255, 255, 0.06)',
  text: '#9a9a9e',
  font: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export function baseChartOptions(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: CHART.text,
          boxWidth: 10,
          boxHeight: 10,
          padding: 14,
          font: { family: CHART.font, size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 23, 0.95)',
        titleFont: { family: CHART.font, size: 12 },
        bodyFont: { family: CHART.font, size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: CHART.text, font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: { color: CHART.text, font: { size: 10 } },
        grid: { color: CHART.grid },
        border: { display: false },
        beginAtZero: true,
      },
    },
    ...overrides,
  };
}

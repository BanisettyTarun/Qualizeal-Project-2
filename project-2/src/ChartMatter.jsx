import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const customStyles = `
  .custom-chart-legend li {
    margin-bottom: 10px !important;
  }
  .custom-chart-legend .legend-label {
    margin-left: 10px;
  }
`;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        font: {
          size: 12,
        },
      },
    },
    title: {
      display: true,
      text: "Test Metrics Overview",
      font: { size: 20, weight: "bold" },
      padding: {
        top: 10,
        bottom: 30,
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y;
          }
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      suggestedMin: -0.5, // Start y-axis slightly below zero
      title: {
        display: true,
        text: "Count",
        font: {
          size: 14,
          weight: "bold",
        },
      },
      ticks: {
        callback: function (value) {
          if (Math.floor(value) === value) {
            return value;
          }
        },
      },
    },
    x: {
      title: {
        display: true,
        text: "Month",
        font: {
          size: 14,
          weight: "bold",
        },
      },
    },
  },
  barThickness: 30,
  maxBarThickness: 40,
  categoryPercentage: 0.8,
  barPercentage: 0.5, // Reduced from 0.9 to create more space between bars
};

const datasetConfigs = [
  { label: "Test Cases Authored", backgroundColor: "rgba(255, 99, 132, 0.7)" },
  { label: "TC Execution", backgroundColor: "rgba(54, 162, 235, 0.7)" },
  { label: "Pass", backgroundColor: "rgba(75, 192, 192, 0.7)" },
  { label: "Fail", backgroundColor: "rgba(255, 206, 86, 0.7)" },
  { label: "Defects Posted", backgroundColor: "rgba(215, 216, 80, 0.7)" },
  { label: "High", backgroundColor: "rgba(153, 102, 255, 0.7)" },
  { label: "Med", backgroundColor: "rgba(255, 159, 64, 0.7)" },
  { label: "Low", backgroundColor: "rgba(231, 233, 237, 0.7)" },
  { label: "Cycles", backgroundColor: "rgba(102, 187, 106, 0.7)" },
];

const quarters = {
  Q1: ["Jan", "Feb", "March"],
  Q2: ["April", "May", "Jun"],
  Q3: ["Jul", "Aug", "Sep"],
  Q4: ["Oct", "Nov", "Dec"],
};

function ChartMatter() {
  const [rawData, setRawData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3010/api/data");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid data format received");
        }
        setRawData(data);
        updateChartData(data, selectedQuarter);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (rawData) {
      updateChartData(rawData, selectedQuarter);
    }
  }, [selectedQuarter, rawData]);

  const updateChartData = (data, quarter) => {
    if (!Array.isArray(data) || data.length === 0) {
      console.error("Invalid or empty data received");
      setError("Invalid data format received");
      return;
    }

    const quarterMonths = quarters[quarter];
    const filteredData = data.filter((row) => {
      if (!row || typeof row.Month !== "string") {
        return false;
      }
      const monthParts = row.Month.split(" ");
      const month = monthParts[0];
      return quarterMonths.includes(month);
    });

    // Group data by month
    const groupedData = filteredData.reduce((acc, row) => {
      if (!row || typeof row.Month !== "string") {
        return acc;
      }
      const monthParts = row.Month.split(" ");
      const month = monthParts[0];
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(row);
      return acc;
    }, {});

    const labels = Object.keys(groupedData).flatMap((month) =>
      groupedData[month].map((row) => row.Month)
    );

    const datasets = datasetConfigs.map(({ label, backgroundColor }) => ({
      label,
      data: labels.map((monthLabel) => {
        const monthData = groupedData[monthLabel.split(" ")[0]];
        const rowData = monthData.find((row) => row.Month === monthLabel);
        return Math.max(rowData && rowData[label] ? rowData[label] : 0, 0.1);
      }),
      backgroundColor,
    }));

    setChartData({ labels, datasets });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <style>{customStyles}</style>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Test Metrics Dashboard
        </h1>
        <div className="mb-4 flex justify-center">
          {Object.keys(quarters).map((quarter) => (
            <button
              key={quarter}
              onClick={() => setSelectedQuarter(quarter)}
              className={`mx-2 px-4 py-2 rounded-full ${
                selectedQuarter === quarter
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              } hover:bg-blue-400 hover:text-white transition-colors duration-200`}
            >
              {quarter}
            </button>
          ))}
        </div>
        {error ? (
          <p className="text-center text-red-600 text-lg">{error}</p>
        ) : chartData ? (
          <div
            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            style={{ height: "600px" }}
          >
            <Bar
              data={chartData}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  x: {
                    ...chartOptions.scales.x,
                    ticks: {
                      callback: function (value, index, values) {
                        const label = this.getLabelForValue(value);
                        return label.includes("Week")
                          ? label.split(" ")[2]
                          : label;
                      },
                    },
                  },
                },
              }}
              plugins={[
                {
                  id: "customLegend",
                  afterDraw: (chart) => {
                    const legendItems = chart.legend.legendItems;
                    legendItems.forEach((item) => {
                      item.pointStyle = "circle";
                    });
                    chart.legend.legendItems = legendItems;
                  },
                },
              ]}
            />
          </div>
        ) : (
          <p className="text-center text-gray-600 text-lg">
            Loading chart data...
          </p>
        )}
      </div>
    </div>
  );
}

export default ChartMatter;

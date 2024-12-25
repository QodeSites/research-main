import React from "react";

function MonthlyPLTable({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-brown">No data available</p>;
  }

  const monthsShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthsFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderCell = (value) => {
    const numValue = parseFloat(value);
    const cellValue = isNaN(numValue) ? "0.0%" : `${numValue.toFixed(1)}%`;
    const isHighlighted = !isNaN(numValue) && numValue > 4;
    return (
      <td
        className={`text-center text-sm p-4 border border-brown ${
          isHighlighted ? "bg-green-400 font-semibold" : ""
        }`}
      >
        {cellValue}
      </td>
    );
  };

  return (
    <>
      <p className="font-subheading mt-6 text-brown text-subheading mb-2">
        Monthly PL Table (%)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse border border-brown">
          <thead>
            <tr className="bg-lightBeige">
              <th className="p-4 text-sm sm:text-body font-body text-center border border-brown font-semibold">
                Year
              </th>
              {monthsShort.map((month) => (
                <th
                  key={month}
                  className="p-4 text-sm sm:text-body font-body text-center border border-brown font-semibold"
                >
                  {month}
                </th>
              ))}
              <th className="p-4 text-sm sm:text-body font-body text-center border border-brown font-semibold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="p-4 border border-brown bg-lightBeige text-center font-semibold">
                  {row.Year}
                </td>
                {monthsFull.map((month) => renderCell(row[month]))}
                {renderCell(row.Total)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default MonthlyPLTable;
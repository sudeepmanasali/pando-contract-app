import React from "react";

const ContractsTable = ({getPaginationData, contracts, isLoading, noMoreData}) => {

  const tableRef = React.createRef();

  const loadContracts = () => {
    const table = tableRef.current;
    if (!table) return;

    if (
      Math.floor(table.scrollHeight - table.scrollTop) === table.clientHeight
    ) {
      if (!isLoading) {
        getPaginationData();
      }
    }
  };
  const headers = [
    { label: "Source", key: "source" },
    { label: "Shipper", key: "shipper" },
    { label: "Destination", key: "destination" },
    { label: "Vehicle Type", key: "vehicleType" },
    { label: "Transporter", key: "transporter" },
    { label: "Contract Type", key: "contractType" },
    { label: "Valid From", key: "validFrom" },
    { label: "Valid To", key: "validTo" },
  ];

  return (
    <div>
      <div
        style={{ width: "100%", height: "700px", overflowY: "auto" }}
        ref={tableRef}
        onScroll={loadContracts}
      >
        <table style={{ width: "100%", position: "relative" }}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Shipper</th>
              <th>Destination</th>
              <th>Vehicle Type</th>
              <th>Transporter</th>
              <th>Contract Type</th>
              <th>Valid From</th>
              <th>Valid To</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td key={header?.key}>{contract[header?.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="status-text">
            <span>Loading...</span>
          </div>
        )}

        {noMoreData && (
          <div className="status-text">
            <span>No more contracts to load</span>
          </div>
        )}
      </div>
      <div className="table-footer">
        <div className="table-count">
          <span className="title">Total: </span>
          {contracts.length} Contracts
        </div>
      </div>
    </div>
  );
};

export default ContractsTable;

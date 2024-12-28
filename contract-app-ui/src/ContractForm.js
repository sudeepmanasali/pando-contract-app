import React, { useState } from "react";

const ContractForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    vehicleType: "",
    transporter: "",
    validFrom: "",
    validTo: "",
    shipper: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="contract-form-modal-backdrop">
      <div className="contract-form">
        <div className="header">
          <h2>Contract Details</h2>
          <div className="close" onClick={onClose}>
            X
          </div>
        </div>

        <div className="input-box">
          <label htmlFor="source">Source</label>
          <input
            type="text"
            id="source"
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-box">
          <label htmlFor="destination">Destination</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-box">
          <label htmlFor="vehicleType">Vehicle Type</label>
          <input
            type="text"
            id="vehicleType"
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-box">
          <label htmlFor="transporter">Transporter</label>
          <input
            type="text"
            id="transporter"
            name="transporter"
            value={formData.transporter}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-box">
          <label htmlFor="transporter">Shipper</label>
          <input
            type="text"
            id="shipper"
            name="shipper"
            value={formData.shipper}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-box">
          <label htmlFor="validFrom">Valid From</label>
          <input
            type="date"
            id="validFrom"
            name="validFrom"
            value={formData.validFrom}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-box">
          <label htmlFor="validTo">Valid To</label>
          <input
            type="date"
            id="validTo"
            name="validTo"
            value={formData.validTo}
            onChange={handleInputChange}
            required
          />
        </div>

        <button onClick={handleSubmit} className="submit">
          Submit
        </button>
      </div>
    </div>
  );
};

export default ContractForm;

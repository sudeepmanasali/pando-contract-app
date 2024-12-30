import React, { useState } from "react";
import axios from "axios";

let progressLine = {
  height: "5px",
  backgroundColor: "green",
  color: "white",
  padding: "2px",
  textAlign: "right",
  borderRadius: "5px",
};

const UploadContractFile = ({ onClose, getPaginationData }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("csv-file", file);

    setUploading(true);
    setProgress(0);

    try {
      const apiUrl = process.env.BACKEND_API_URL || "http://localhost:8089";
      const response = await axios.post(`${apiUrl}/csv-upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percent = Math.floor((loaded / total) * 100);
          setProgress(percent);
        },
      });

      if (response.status === 200) {
        let { success, failed, invalidInput, missingValueCount, pending } =
          response.data;
        alert("data updated successfully,");
        alert(
          `Success: ${success}, Failed: ${failed}, Invalid input: ${invalidInput}, Missing Fields: ${missingValueCount}, Pending: ${pending}`
        );
      };
      getPaginationData();
      onClose();
    } catch (error) {
      if (error.status === 429) {
        alert(
          error.response.data.message
        );
      } else {
        alert(error.message);
        console.error(error);
      }
    } finally {
      setUploading(false);
      onClose();
    }
  };

  return (
    <div className="contract-form-modal-backdrop">
      <div className="contract-form">
        <div className="header">
          <h2> Contract File Upload form</h2>
          <button className="close" onClick={onClose} disabled={uploading}>
            X
          </button>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          name="csv-file"
          disabled={uploading}
        />

        {progress !== 100 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? "Uploaing..." : "Upload CSV"}
          </button>
        )}

        {uploading && progress !== 100 && (
          <div style={{ width: "100%" }}>
            <div style={{ backgroundColor: "#DCFCE7", borderRadius: "10px" }}>
              <div style={{ ...progressLine, width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {progress === 100 && <span className="loader"></span>}
        {progress === 100 && (
          <div>
            The CSV file has been uploaded and is currently being processed.
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadContractFile;

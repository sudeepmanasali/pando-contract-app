import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';

let progressLine = {
  backgroundColor: "green",
  color: "white",
  padding: "2px",
  textAlign: "right",
  borderRadius: "10px",
  fontSize: "10px",
  paddingRight: "10px",
  height: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'right'
};

const UploadContractFile = ({ onClose, getPaginationData }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressInterval, setProgressInterval] = useState(null);

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

    const apiUrl = process.env.BACKEND_API_URL || "http://localhost:8089";
    const progressId = Date.now() + file.name;

    axios.post(`${apiUrl}/csv-upload?progressId=${progressId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      })
      .then((response) => {
        setProgress(100);
        if (response.status === 200) {
          clearInterval(progressInterval);

          let { success, failed, invalidInput, missingValueCount, pending } =
            response.data;
          toast.success(
            `Success: ${success}, Failed: ${failed}, Invalid input: ${invalidInput}, Missing Fields: ${missingValueCount}, Pending: ${pending}`, {duration: 10000}
          );
          getPaginationData();
          onClose();
        }
      })
      .catch((error) => {
        if (error.status === 429) {
          toast.error(error.response.data.message);
        } else {
          toast.error(error.message);
          console.error(error);
        }
      })
      .finally(() => {
        setUploading(false);
        onClose();
      });

    getProgress(progressId);
  };

  const getProgress = (pid) => {
    let progressInterval = setInterval(async () => {
      const apiUrl = process.env.BACKEND_API_URL || "http://localhost:8089";
      axios
        .get(`${apiUrl}/contract-progress?progressId=${pid}`)
        .then((response) => {
          setProgress(Math.floor(response.data.progress * 100));
        })
        .catch((error) => {
          toast.error(error.message);
          console.error(error);
        });
    }, 1500);

    setProgressInterval(progressInterval);
  };

  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  return (
    <div className="contract-form-modal-backdrop">
      <div className="contract-form">
        <div className="header">
          <h2> Contract File Upload form</h2>
          <button className="close" onClick={onClose} disabled={uploading} style={{background: uploading ? '#6e6f77': '#5D60EF' }}>
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
            {uploading ? "Processing..." : "Upload CSV 🗂️"}
          </button>
        )}

        {uploading && progress !== 100 && (
          <div style={{ width: "100%" }}>
            <div style={{ backgroundColor: "#DCFCE7", borderRadius: "10px" }}>
              <div style={{ ...progressLine, width: `${progress}%`, color:'white' }}>
                {  !!progress && <div>{progress} %</div>}
              </div>
            </div>
          </div>
        )}

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

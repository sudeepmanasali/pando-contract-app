import "./App.css";
import ContractForm from "./ContractForm";
import ContractsTable from "./ContractInfo";
import ReactDOM from "react-dom";
import React, { useState, useEffect } from "react";
import UploadContractFile from "./UploadContractFile";
import axios from "axios";

const offset = 50;

let handleError = (error) => {
  let response = error.response;
  let message = (response.data.message || 'Something went wrong');
  alert(message);
}
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  useEffect(() => {
    getPaginationData();
    // eslint-disable-next-line
  }, []);

  const apiUrl = process.env.BACKEND_API_URL || "http://localhost:8089";
  const [contracts, setContractsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);

  let getPaginationData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${apiUrl}/contracts-page-data?page=${pageNumber}&offset=${offset}`
      );
      if (response.data.length > 0) {
        setContractsData([...contracts, ...response.data]);
        setPageNumber(pageNumber + 1);
      } else {
        setNoMoreData(true);
      }
    } catch (error) {
      console.log(error);
      handleError(error);
      setNoMoreData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (file = false) => {
    setIsModalOpen(true);
    setOpenFileUploadModal(file);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (formValue) => {
    try {
      const apiUrl = process.env.BACKEND_API_URL || "http://localhost:8089";
      const response = await axios.post(`${apiUrl}/save-contract`, formValue);
      setContractsData([...contracts, response.data]);
      alert("Contract added successfully");
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="contract-app">
      <h1>Contract Details</h1>
      <div className="action-box">
        <button
          onClick={() => {
            handleOpenModal(false);
          }}
          className="add-contract"
        >
          Add Contract
        </button>
        <button
          onClick={() => {
            handleOpenModal(true);
          }}
          className="add-contract"
        >
          Upload Contract file
        </button>
      </div>

      <ContractsTable
        getPaginationData={getPaginationData}
        contracts={contracts}
        isLoading={isLoading}
        noMoreData={noMoreData}
      />

      {isModalOpen &&
        ReactDOM.createPortal(
          openFileUploadModal ? (
            <UploadContractFile onClose={handleCloseModal}       getPaginationData={getPaginationData}/>
          ) : (
            <ContractForm
              onClose={handleCloseModal}
              onSubmit={handleFormSubmit}
            />
          ),
          document.body
        )}
    </div>
  );
}

export default App;

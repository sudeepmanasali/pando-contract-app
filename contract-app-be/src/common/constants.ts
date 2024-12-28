export const enum API_REQUEST_ROUTES {
  UPLOAD_CONTRACT_FILE = '/csv-upload',
  CREATE_CONTRACT = '/save-contract',
  GET_CONTRACTS = '/all-contracts',
  GET_CONTRACTS_COUNT = '/contracts-count',
  GET_CONTRACTS_PAGE_DATA = '/contracts-page-data'
}

export const enum JOB_STATUSES {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STALLED = 'stalled',
  DELAYED = 'delated'
}

export const enum REDIS_STATUS {
  END = 'end',
  CONNECT = 'connect',
  ERROR = 'error'
}

export const enum REDIS_RESPONSE_CODE {
  OK = 'OK'
}


export const CSV_FILE_DIRECTORY = "csv-uploads";
export const CSV_FILE_NAME = "csv-file";

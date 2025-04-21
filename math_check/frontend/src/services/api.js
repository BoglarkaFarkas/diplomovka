import axiosInstance from "./axiosInstance";

export const fetchUserTasks = async () => {
  const response = await axiosInstance.get(`/examples/`);
  return response.data.tasks;
};

export const fetchUserResults = async () => {
  const response = await axiosInstance.get(`/items/`);
  return response.data.results;
};

export const submitTestResult = async (formData) => {
  const response = await axiosInstance.post(`/items/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const saveExampleResults = async (
  testId,
  exampleID,
  correctAnsweId,
  taskDescription
) => {
  const formData = new FormData();
  formData.append("test_id", testId);
  formData.append("example_id", exampleID);
  formData.append("correct_answer", correctAnsweId);
  formData.append("description", taskDescription);

  const response = await axiosInstance.post(`/examples/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const saveCSVExampleResults = async (formData) => {
  const response = await axiosInstance.post(`/examples/upload-csv/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateExampleResult = async (
  testId,
  exampleId,
  correctAnswer,
  taskDescription
) => {
  const formData = new FormData();
  formData.append("test_id", testId);
  formData.append("correct_answer", correctAnswer);
  formData.append("description", taskDescription);

  const response = await axiosInstance.put(`/examples/${exampleId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteExampleResult = async (
  testId,
  exampleId,
  correctAnswer,
  description
) => {
  const response = await axiosInstance.delete(`/examples/${exampleId}`, {
    params: {
      test_id: testId,
      correct_answer: correctAnswer,
      description: description,
    },
  });
  return response.data;
};

export const submitMatrixCalculation = async (data) => {
  const response = await axiosInstance.post(`/calculate/`, data);
  return response.data;
};

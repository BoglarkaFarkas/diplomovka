import React, { useState, useEffect, useRef } from "react";
import {
  saveExampleResults,
  saveCSVExampleResults,
  updateExampleResult,
  deleteExampleResult,
  fetchUserTasks as fetchUserTasksApi,
} from "../services/api";

function TestResults() {
  const [testId, setTestId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [response, setResponse] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [uploadMethod, setUploadMethod] = useState("single");
  const [editingTask, setEditingTask] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserEmail(payload.sub || "");
      } catch (err) {
        console.error("JWT decode hiba:", err);
      }
    }
  }, []);

  const loadUserTasks = async () => {
    try {
      const tasksData = await fetchUserTasksApi();
      setTasks(tasksData);
    } catch (error) {
      console.error("Chyba pri načítavaní úloh:", error);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadUserTasks();
    }
  }, [userEmail]);

  const handleAddTask = async () => {
    if (!testId || !taskName || !correctAnswer) {
      setResponse("Prosím, vyplňte všetky povinné polia.");
      return;
    }

    try {
      if (editingTask) {
        await updateExampleResult(
          testId,
          taskName,
          correctAnswer,
          taskDescription || ""
        );
        setResponse("Úloha bola úspešne aktualizovaná.");
        setEditingTask(null);
      } else {
        await saveExampleResults(
          testId,
          taskName,
          correctAnswer,
          taskDescription || ""
        );
        setResponse("Úloha bola úspešne pridaná.");
      }

      loadUserTasks();
      resetForm();
    } catch (error) {
      console.error("Chyba pri ukladaní úlohy:", error);
      setResponse("Chyba pri ukladaní úlohy.");
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTestId(task.test_id);
    setTaskName(task.example_id);
    setTaskDescription(task.description || "");
    setCorrectAnswer(task.correct_answer);
    setUploadMethod("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteTask = async (task) => {
    if (window.confirm(`Ste si istý, že chcete vymazať úlohu?`)) {
      try {
        await deleteExampleResult(
          task.test_id,
          task.example_id,
          task.correct_answer,
          task.description
        );
        setResponse(`Úloha ${task.example_id} bola úspešne vymazaná`);
        loadUserTasks();
      } catch (error) {
        console.error("Chyba pri odstraňovaní úlohy:", error);
        setResponse("Chyba pri odstraňovaní úlohy.");
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      await saveCSVExampleResults(formData);
      setResponse(`Súbor CSV „${file.name}" bol úspešne nahraný.`);
      loadUserTasks();
    } catch (error) {
      console.error("Chyba pri nahrávaní súboru CSV:", error);
      setResponse("Chyba pri nahrávaní súboru CSV.");
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetForm = () => {
    setTestId("");
    setTaskName("");
    setTaskDescription("");
    setCorrectAnswer("");
    setEditingTask(null);
  };

  return (
    <div className="test-checker-container">
      <div className="glass-card">
        <h1>{editingTask ? "Úprava úlohy" : "Pridanie úloh"}</h1>
        <p className="subtitle">
          Tu môžete jednoducho zadať správne odpovede na jednotlivé úlohy, aby
          ste ich neskôr mohli efektívne vyhodnotiť v testoch. Úlohy môžete
          pridávať jednotlivo, alebo ak máte viacero odpovedí naraz, môžete
          nahrať CSV súbor so všetkými potrebnými údajmi, čím si výrazne
          uľahčíte prácu.
        </p>

        {!editingTask && (
          <div className="upload-method-selector">
            <button
              className={`method-button ${
                uploadMethod === "single" ? "active" : ""
              }`}
              onClick={() => setUploadMethod("single")}
            >
              Jednotlivé úlohy
            </button>
            <button
              className={`method-button ${
                uploadMethod === "csv" ? "active" : ""
              }`}
              onClick={() => setUploadMethod("csv")}
            >
              Hromadný upload (CSV)
            </button>
          </div>
        )}

        {uploadMethod === "single" || editingTask ? (
          <div className="form-container">
            <div className="input-group">
              <label>Test ID</label>
              <input
                type="text"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                className="form-input"
                disabled={editingTask !== null}
              />
            </div>
            <div className="input-group">
              <label>Číslo úlohy</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="form-input"
                disabled={editingTask !== null}
              />
            </div>
            <div className="input-group">
              <label>Popis úlohy (nepovinné)</label>
              <input
                type="text"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="input-group">
              <label>Správna odpoveď</label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="button-group">
              <button onClick={handleAddTask} className="submit-button">
                {editingTask ? "Aktualizovať úlohu" : "Pridaj úlohu"}
              </button>
              {editingTask && (
                <button onClick={resetForm} className="submit-button">
                  Zrušiť
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="form-container">
            <div className="input-group">
              <label>Nahrávanie CSV súboru</label>
              <p className="help-text">
                CSV súbor by mal obsahovať stĺpce: test_id, example_id,
                correct_answer, description (nepovinné)
              </p>
              <br />
              <button
                onClick={handleUploadButtonClick}
                className="file-upload-button"
              >
                Nahraj CSV
              </button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </div>
          </div>
        )}

        {response && <p className="response-message">{response}</p>}

        {tasks && tasks.length > 0 && (
          <div className="table-container">
            <h2>Vaše úlohy</h2>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Číslo úlohy</th>
                  <th>Popis úlohy</th>
                  <th>Správna odpoveď</th>
                  <th>Akcie</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={index}>
                    <td>{task.test_id}</td>
                    <td>{task.example_id}</td>
                    <td>{task.description || "-"}</td>
                    <td>{task.correct_answer}</td>
                    <td className="action-buttons">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="edit-button"
                      >
                        Upraviť
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="delete-button"
                      >
                        Vymazať
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestResults;

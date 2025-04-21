import React, { useState, useEffect } from "react";
import { submitTestResult, fetchUserResults } from "../services/api";

function TestChecker() {
  const [imageFile, setImageFile] = useState(null);
  const [response, setResponse] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserEmail(payload.sub || "");
      } catch (err) {
        console.error("JWT decode chyba:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadAllUserResults();
    }
  }, [userEmail]);

  const loadAllUserResults = async () => {
    try {
      const results = await fetchUserResults();
      setTestResults(results);
    } catch (error) {
      console.error("Chyba pri načítaní dát:", error);
    }
  };

  const sendData = async (files) => {
    if (!files || files.length === 0) {
      setResponse("Prosím nahraj aspoň jeden obrázok.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const result = await submitTestResult(formData);
      setResponse(result.message || "Úspešne nahratý!");
      setSubmitted(true);

      await loadAllUserResults();

      setImageFile(null);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      setResponse("Chyba pri nahrávanie obrázkov.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    setImageFile(files);
    if (files && files.length > 0) {
      sendData(files);
    }
  };

  const downloadCSV = () => {
    if (!testResults.length) return;

    const headers = [
      "Názov súboru",
      "Body",
      "Test ID",
      "Číslo úlohy",
      "Študent ID",
      "Odpoveď od študenta",
      "Dátum",
    ];

    const csvRows = [
      headers.join(","),
      ...testResults.map((result) =>
        [
          `"${result.file_name || "-"}"`,
          result.answer_results === true ? "1" : "0",
          result.test_id,
          result.example_id,
          result.student_id,
          `"${result.student_answer}"`,
          result.created_at,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "test-results.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="test-checker-container">
      <div className="glass-card">
        <h1>Kontrola testu</h1>
        <p className="subtitle">
          Máte možnosť nahrať obrázky, ktoré systém automaticky spracuje a
          vyhodnotí. Môžete odoslať jeden obrázok naraz alebo nahrať viacero
          súborov súčasne, aby si urýchlil a zjednodušil celý proces. Každý
          nahraný obrázok bude analyzovaný a výsledky sa okamžite porovnajú s
          predtým uloženými správnymi odpoveďami. Takto ihneď zistíte, či sú
          výpočty testov správne alebo nie!
        </p>

        <div className="input-container">
          <div className="input-group">
            <label htmlFor="test-image">Nahrať obrázky</label>
            <input
              id="test-image"
              type="file"
              multiple
              onChange={handleFileChange}
              className="form-input"
            />
            <label htmlFor="test-image" className="file-upload-button">
              Vybrať súbor
              {imageFile && <span>{imageFile[0].name}</span>}
            </label>
          </div>
          {response && <p className="response-message">{response}</p>}
        </div>

        <div className="results-section">
          <h2>Vyhodnotené testy</h2>

          {testResults.length > 0 ? (
            <div className="table-container">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Názov súboru</th>
                    <th>Body</th>
                    <th>Test ID</th>
                    <th>Číslo úlohy</th>
                    <th>Študent ID</th>
                    <th>Odpoveď od študenta</th>
                    <th>Dátum</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.file_name || "-"}</td>
                      <td>{result.answer_results === true ? 1 : 0}</td>
                      <td>{result.test_id}</td>
                      <td>{result.example_id}</td>
                      <td>{result.student_id}</td>
                      <td>{result.student_answer}</td>
                      <td>{result.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-results">
              Zatiaľ nie sú k dispozícii žiadne výsledky testov
            </p>
          )}
        </div>

        {testResults.length > 0 && (
          <div
            className="download-button-container"
            style={{ marginTop: "1rem" }}
          >
            <button onClick={downloadCSV} className="submit-button">
              Stiahnuť výsledky ako CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestChecker;

import React, { useEffect, useState } from "react";
import { submitMatrixCalculation } from "../services/api";

function MatrixCalculator() {
  const [operation, setOperation] = useState("rank");
  const [matrixSize, setMatrixSize] = useState(2);
  const [matrix, setMatrix] = useState([]);
  const [vectorSize, setVectorSize] = useState(2);
  const [gcdValues, setGcdValues] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (operation === "vector normal form") {
      setMatrix(Array(vectorSize).fill(""));
    } else if (operation === "GCD") {
      setGcdValues([0, 0]);
    } else {
      const newMatrix = Array(matrixSize)
        .fill(null)
        .map(() => Array(matrixSize).fill(""));
      setMatrix(newMatrix);
    }
  }, [matrixSize, vectorSize, operation]);

  const handleGcdChange = (index, value) => {
    const newGcdValues = [...gcdValues];
    newGcdValues[index] = value;
    setGcdValues(newGcdValues);
  };

  const renderVectorInputs = () => {
    return Array.from({ length: vectorSize }, (_, i) => (
      <input
        key={i}
        type="text"
        className="matrix-input"
        placeholder="0"
        onChange={(e) => handleVectorChange(i, e.target.value)}
      />
    ));
  };

  const handleVectorChange = (index, value) => {
    setMatrix((prevMatrix) => {
      const newMatrix = [...prevMatrix];
      newMatrix[index] = value;
      return newMatrix;
    });
  };

  const handleInputChange = (row, col, value) => {
    setMatrix((prevMatrix) =>
      prevMatrix.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? value : c)) : r
      )
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result;
      if (operation === "GCD") {
        const gcdMatrix = [gcdValues];
        result = await submitMatrixCalculation({
          operation,
          matrix: gcdMatrix,
        });
      } else {
        result = await submitMatrixCalculation({ operation, matrix });
      }
      if (result && result.operation && result.result) {
        setResponse(
          `Operácia: ${result.operation} | Výsledok: ${JSON.stringify(
            result.result
          )}`
        );
      } else {
        setResponse("Výpočet nevrátil očakávaný výsledok.");
      }
    } catch (error) {
      setResponse("Nepodarilo sa vykonať výpočet.");
    } finally {
      setLoading(false);
    }
  };

  const renderMatrixInputs = () => {
    if (!Array.isArray(matrix)) return null;
    return matrix.map((row, i) => (
      <div key={i} className="matrix-row">
        {Array.isArray(row) &&
          row.map((cell, j) => (
            <input
              type="text"
              key={`${i}-${j}`}
              value={cell}
              onChange={(e) => handleInputChange(i, j, e.target.value)}
              className="matrix-input"
              placeholder="0"
            />
          ))}
      </div>
    ));
  };

  return (
    <div className="test-checker-container">
      <div className="glass-card">
        <h1>Kalkulačky</h1>
        <p className="subtitle">
          Ak si nie ste istí správnou odpoveďou na konkrétnu otázku, môžete
          použiť jeden z dostupných kalkulačiek na určenie správneho výsledku.
          Keď získate odpoveď, môžete prejsť na stránku, kde ju môžete priamo
          uložiť k príslušnej otázke. Výsledky sú zaokrúhlené v prípade
          normálnej vektorovej formy.
        </p>
        <div className="input-group">
          <label>Vyberte operáciu</label>
          <div className="operation-group">
            {[
              "rank",
              "corank",
              "trace",
              "determinant",
              "vector normal form",
              "GCD",
            ].map((op) => (
              <label
                key={op}
                className={`radio-button ${operation === op ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="operation"
                  value={op}
                  checked={operation === op}
                  onChange={(e) => setOperation(e.target.value)}
                />
                {op.charAt(0).toUpperCase() + op.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <br />
        {operation !== "vector normal form" && operation !== "GCD" && (
          <>
            <div className="input-group">
              <label>
                Veľkosť matice: {matrixSize}x{matrixSize}
              </label>
              <input
                type="number"
                min="2"
                max="9"
                value={matrixSize}
                onChange={(e) => setMatrixSize(parseInt(e.target.value))}
                className="form-input"
              />
            </div>
            <div className="matrix-container">{renderMatrixInputs()}</div>
          </>
        )}

        {operation === "vector normal form" && (
          <>
            <div className="input-group">
              <label>Veľkosť vektor: {vectorSize}</label>
              <input
                type="number"
                min="1"
                max="10"
                value={vectorSize}
                onChange={(e) => setVectorSize(parseInt(e.target.value))}
                className="form-input"
              />
            </div>
            <div className="matrix-container">
              <div className="matrix-row">{renderVectorInputs()}</div>
            </div>
          </>
        )}

        {operation === "GCD" && (
          <>
            <div className="input-group">
              <label>Prvé číslo</label>
              <input
                type="number"
                value={gcdValues[0]}
                onChange={(e) => handleGcdChange(0, e.target.value)}
                className="form-input"
              />
            </div>
            <div className="input-group">
              <label>Druhé číslo</label>
              <input
                type="number"
                value={gcdValues[1]}
                onChange={(e) => handleGcdChange(1, e.target.value)}
                className="form-input"
              />
            </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          className={`submit-button ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          {loading ? "Processing..." : "Vypočítať"}
        </button>

        {response && <p className="response-message">{response}</p>}
      </div>
    </div>
  );
}

export default MatrixCalculator;

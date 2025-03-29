import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <div className="glass-card">
        <h1>Vitajte na MathCheck</h1>

        <div className="feature-section">
          <p>
            Táto stránka slúži na automatické hodnotenie matematických testov.
            Používateľ môže vopred zadať správne odpovede, a neskôr jednoducho
            nahrať test vo forme obrázka. Náš systém automaticky vyhodnotí
            odpovede – porovná konečný výsledok uvedený v teste s referenčnými
            odpoveďami, ktoré boli predtým uložené. Na základe tohto porovnania
            okamžite zistíte, či bol príklad vypočítaný správne alebo nie.
            <br />
            Zjednodušte si kontrolu matematických testov s MathCheck – rýchlo,
            presne a efektívne!
          </p>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <h3>Hodnotenie úloh</h3>
              <p>
                Rozpoznáme výsledok, porovnáme a okamžite zistíme, či je výpočet
                správny!
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Uloženie správnych výsledkov</h3>
              <p> Zadávajte jednotlivo alebo nahrajte cez CSV súbor!</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🧮</div>
              <h3>Kalkulačky</h3>
              <p>
                Ak nemáte čas alebo chuť počítať manuálne, môžete využiť
                dostupné kalkulačky na rýchly a presný výpočet výsledku.
              </p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <Link to="/test-checker" className="cta-button">
            Spustiť kontrolu testov
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;

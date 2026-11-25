/**
 * Charts — Chart.js Rendering Helpers
 *
 * Renders accuracy pie/doughnut charts and trend graphs using Chart.js,
 * with SVG fallback for offline use.
 */
export class Charts {
  constructor() {
    this.instances = {
      accuracy: null,
      scoreTrend: null,
      accuracyTrend: null,
      levelResult: null
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Accuracy Pie / Doughnut Chart                                   */
  /* ---------------------------------------------------------------- */

  renderAccuracyPie(canvasEl, svgFallbackEl, correct, missed, legendCorrectEl, legendMissedEl) {
    const total = correct + missed;
    if (total === 0) return;

    const correctPct = ((correct / total) * 100).toFixed(1);
    const missedPct = ((missed / total) * 100).toFixed(1);

    if (legendCorrectEl) legendCorrectEl.textContent = `${correctPct}%`;
    if (legendMissedEl) legendMissedEl.textContent = `${missedPct}%`;

    this._destroyChart('accuracy');

    if (typeof Chart !== 'undefined') {
      this.instances.accuracy = new Chart(canvasEl, {
        type: 'doughnut',
        data: {
          labels: ['Correct', 'Missed / Skipped'],
          datasets: [{
            data: [correct, missed],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
          },
          cutout: '70%'
        }
      });
    } else {
      // SVG fallback
      if (svgFallbackEl) {
        svgFallbackEl.classList.remove('hidden');
        svgFallbackEl.innerHTML = this._svgDoughnut(correctPct, missedPct);
      }
      if (canvasEl) canvasEl.classList.add('hidden');
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Trend Line Chart (Score or Accuracy)                            */
  /* ---------------------------------------------------------------- */

  renderTrendChart(canvasEl, svgFallbackEl, labels, data, title) {
    this._destroyChart('scoreTrend');

    if (typeof Chart !== 'undefined') {
      this.instances.scoreTrend = new Chart(canvasEl, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: title,
            data: data,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#4f46e5'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true },
            x: { display: true }
          }
        }
      });
    } else {
      if (svgFallbackEl) {
        svgFallbackEl.classList.remove('hidden');
        svgFallbackEl.textContent = 'Chart.js unavailable — install for trend graphs.';
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Level Result Pie Chart                                          */
  /* ---------------------------------------------------------------- */

  renderLevelResultChart(canvasEl, svgFallbackEl, correct, total) {
    const missed = total - correct;
    const pct = total > 0 ? ((correct / total) * 100).toFixed(1) : '0';

    this._destroyChart('levelResult');

    if (typeof Chart !== 'undefined') {
      this.instances.levelResult = new Chart(canvasEl, {
        type: 'doughnut',
        data: {
          labels: ['Correct', 'Missed'],
          datasets: [{
            data: [correct, missed],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          cutout: '70%'
        }
      });
    } else {
      if (svgFallbackEl) {
        svgFallbackEl.classList.remove('hidden');
        svgFallbackEl.innerHTML = this._svgDoughnut(pct, (100 - parseFloat(pct)).toFixed(1));
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                         */
  /* ---------------------------------------------------------------- */

  _destroyChart(key) {
    const inst = this.instances[key];
    if (inst) {
      inst.destroy();
      this.instances[key] = null;
    }
  }

  _svgDoughnut(correctPct, missedPct) {
    const size = 220;
    const cx = size / 2, cy = size / 2, r = 80;
    const correctAngle = (correctPct / 100) * 360;
    const rad = (correctAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(-Math.PI / 2);
    const y1 = cy + r * Math.sin(-Math.PI / 2);
    const x2 = cx + r * Math.cos(rad - Math.PI / 2);
    const y2 = cy + r * Math.sin(rad - Math.PI / 2);
    const largeArc = correctAngle > 180 ? 1 : 0;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="20"/>
        <path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}"
              fill="none" stroke="#10b981" stroke-width="20" stroke-linecap="round"/>
        <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="24" font-weight="bold" fill="#1e293b">${correctPct}%</text>
        <text x="${cx}" y="${cy + 34}" text-anchor="middle" font-size="14" fill="#64748b">Correct</text>
      </svg>
    `;
  }

  destroyAll() {
    ['accuracy', 'scoreTrend', 'accuracyTrend', 'levelResult'].forEach(k => this._destroyChart(k));
  }
}
/**
 * HomeView — Game Selector / Landing Page
 *
 * Handles the landing screen where the player picks which game to play.
 * Currently only "Math Blast" is playable; others are "Coming Soon" placeholders.
 */
export class HomeView {
  constructor(elementsRef, soundRef, onGameSelect, onPlaySelected) {
    this.elements = elementsRef;
    this.sound = soundRef;
    this.onGameSelect = onGameSelect;
    this.onPlaySelected = onPlaySelected;
    this.selectedGame = 'math-blast';
  }

  init() {
    this._bindGameCardSelection();
    this._bindPlayButton();
  }

  _bindGameCardSelection() {
    const cards = this.elements.gameCards;
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) {
          if (this.sound) this.sound.playTap();
          return;
        }
        cards.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');
        this.selectedGame = card.dataset.game || 'math-blast';
        if (this.sound) this.sound.playTap();
        if (this.onGameSelect) this.onGameSelect(this.selectedGame);
      });
    });
  }

  _bindPlayButton() {
    const btn = this.elements.btnPlaySelectedGame;
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (this.selectedGame === 'math-blast') {
        if (this.onPlaySelected) this.onPlaySelected();
      } else {
        if (this.sound) this.sound.playTap();
      }
    });
  }

  switchToConfig() {
    const { screenLanding, screenConfig } = this.elements;
    if (screenLanding) screenLanding.classList.remove('active');
    if (screenConfig) screenConfig.classList.add('active');
  }
}
import { isMusicMuted, toggleMusic } from "../audio/music";

/** The one persistent music mute/unmute button, visible on every screen. */
export function mountMusicToggle(): void {
  const button = document.createElement("button");
  button.className = "music-toggle";
  button.setAttribute("aria-label", "Music on/off");

  function render() {
    button.textContent = isMusicMuted() ? "🔇" : "🔊";
  }
  render();

  button.addEventListener("click", () => {
    toggleMusic();
    render();
  });

  document.body.appendChild(button);
}

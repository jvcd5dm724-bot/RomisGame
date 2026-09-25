/** A persistent way back to the TV, shown on every screen except the home screen itself. */
export function createHomeButton(navigate: (hash: string) => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "home-button";
  button.setAttribute("aria-label", "Back to TV home");
  button.textContent = "🏠";
  button.addEventListener("click", () => navigate("#/"));
  return button;
}

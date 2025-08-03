let currentFilter = ''; // Start blank to allow default toggle

function searchNotes() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.note-card');

  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    const match = text.includes(input);
    card.style.display = match ? 'block' : 'none';

    // Show hidden .other cards if matching
    if (input.length > 0 && card.classList.contains('other')) {
      card.classList.remove('hidden');
    }
  });

  // Remove all active buttons
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  currentFilter = 'all';
}

function filterNotes(category) {
  const cards = document.querySelectorAll('.note-card');
  const buttons = document.querySelectorAll('.filter-btn');

  if (currentFilter === category) {
    // Toggle off filter → show all
    cards.forEach(card => card.style.display = 'block');
    buttons.forEach(btn => btn.classList.remove('active'));
    currentFilter = 'all';
    return;
  }

  // Apply new filter
  cards.forEach(card => {
    card.style.display = card.classList.contains(category) ? 'block' : 'none';
  });

  document.getElementById('searchInput').value = '';

  // Highlight the selected tab
  buttons.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-${category}`);
  if (activeBtn) activeBtn.classList.add('active');

  currentFilter = category;
}

document.addEventListener('DOMContentLoaded', () => {
  filterNotes('notes'); // Default: show Study Notes
});
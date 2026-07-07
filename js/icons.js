const CATEGORY_ICON_PATHS = {
  hrana: '<path d="M4 12h16a8 8 0 0 1-16 0Z"/><path d="M8 12V8"/><path d="M12 12V6"/><path d="M16 12V8"/>',
  pijaca:
    '<path d="M6 3h12l-1.2 16.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 3Z"/><path d="M5.5 8h13"/><path d="M15 3l3-2"/>',
  prevoz:
    '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  bivanje: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  racuni: '<path d="M6 2h12v19l-3-2-3 2-3-2-3 2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  zabava:
    '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M13 6v12"/>',
  zdravje: '<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z"/>',
  obleka: '<path d="M8 3l4 2 4-2 4 4-3 3v11H7V10L4 7Z"/>',
  drugo: '<path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
};

const MISC_ICON_PATHS = {
  wallet:
    '<path d="M20 7H4a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Z"/><path d="M16 4H6a2 2 0 0 0-2 2v1"/><circle cx="16" cy="13" r="1.4"/>',
  receipt: '<path d="M6 2h12v19l-3-2-3 2-3-2-3 2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M4 19h16"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3M12 16h.01"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/>',
  trending: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 12 3.5 6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
};

export function categoryIconSvg(id) {
  const path = CATEGORY_ICON_PATHS[id] ?? CATEGORY_ICON_PATHS.drugo;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

export function iconSvg(name) {
  const path = MISC_ICON_PATHS[name] ?? '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

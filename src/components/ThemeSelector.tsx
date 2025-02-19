import React from 'react';

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
  showDropdown: boolean;
}

interface Theme {
  id: string;
  name: string;
  description: string;
}

const themes: Theme[] = [
  { id: 'black', name: 'Black (Default)', description: 'Black background, white text, blue links' },
  { id: 'white', name: 'White', description: 'White background, black text, blue links' },
  { id: 'league', name: 'League', description: 'Gray background, white text, blue links' },
  { id: 'beige', name: 'Beige', description: 'Beige background, dark text, brown links' },
  { id: 'night', name: 'Night', description: 'Black background, thick white text, orange links' },
  { id: 'serif', name: 'Serif', description: 'Cappuccino background, gray text, brown links' },
  { id: 'simple', name: 'Simple', description: 'White background, black text, blue links' },
  { id: 'solarized', name: 'Solarized', description: 'Cream-colored background, dark green text, blue links' },
  { id: 'moon', name: 'Moon', description: 'Dark blue background, thick grey text, blue links' },
  { id: 'dracula', name: 'Dracula', description: 'Purple black background, thick purple text, pink links' },
  { id: 'sky', name: 'Sky', description: 'Blue background, thin white text, blue links' },
  { id: 'blood', name: 'Blood', description: 'Black background, thin white text, red links' },
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedTheme, onThemeChange, showDropdown }) => {
  if (!showDropdown) {
    return null;
  }

  return (
    <div className="theme-selector mt-4">
      <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Presentation Theme
      </label>
      <select
        id="theme-select"
        value={selectedTheme}
        onChange={(e) => onThemeChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id} title={theme.description}>
            {theme.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-gray-500">
        {themes.find(theme => theme.id === selectedTheme)?.description}
      </p>
    </div>
  );
};

export default ThemeSelector; 
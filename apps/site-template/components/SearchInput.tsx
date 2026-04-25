interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="search-input-wrapper">
      <label htmlFor="blog-search" className="sr-only">
        Buscar artigos
      </label>
      <input
        id="blog-search"
        type="search"
        className="search-input"
        placeholder="Buscar artigos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Buscar artigos"
      />
    </div>
  );
}

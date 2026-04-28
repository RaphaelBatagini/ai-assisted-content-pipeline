interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="search-input-wrapper">
      <label htmlFor="blog-search" className="sr-only">
        Search articles
      </label>
      <input
        id="blog-search"
        type="search"
        className="search-input"
        placeholder="Search articles..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search articles"
      />
    </div>
  );
}

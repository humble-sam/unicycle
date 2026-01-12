import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  collegeName?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const SearchBar = ({
  placeholder = "Search for laptops, textbooks, and more...",
  collegeName = "Your College",
  onSearch,
  className = "",
}: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center w-full max-w-2xl ${className}`}
    >
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 sm:pl-12 pr-3 sm:pr-4 h-12 sm:h-14 text-sm sm:text-base rounded-l-xl sm:rounded-l-2xl rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:border-secondary"
        />
      </div>
      <Button
        type="submit"
        variant="sell"
        className="h-12 sm:h-14 px-4 sm:px-8 rounded-l-none rounded-r-xl sm:rounded-r-2xl text-sm sm:text-base shrink-0"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;

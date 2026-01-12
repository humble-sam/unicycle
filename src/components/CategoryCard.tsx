import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  count: number;
  href: string;
  delay?: number;
}

const CategoryCard = ({ title, icon: Icon, count, href, delay = 0 }: CategoryCardProps) => {
  return (
    <Link
      to={href}
      className="group flex flex-col items-center p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-secondary/10 transition-colors duration-300">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-secondary group-hover:scale-110 transition-transform duration-300" />
      </div>
      <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base text-center">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground">{count} items</p>
    </Link>
  );
};

export default CategoryCard;

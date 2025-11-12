import { Discover } from '@/app/discover/page';
import Image from 'next/image';

interface SmallNewsCardProps {
  item: Discover;
}

const SmallNewsCard = ({ item }: SmallNewsCardProps) => {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-3 group cursor-pointer"
    >
      <div className="relative w-full aspect-video overflow-hidden rounded-lg">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium line-clamp-2 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors duration-200">
          {item.title}
        </h3>
        <p className="text-sm text-black/70 dark:text-white/70 line-clamp-2">
          {item.content}
        </p>
      </div>
    </a>
  );
};

export default SmallNewsCard;

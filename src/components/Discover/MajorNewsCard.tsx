import { Discover } from '@/app/discover/page';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MajorNewsCardProps {
  item: Discover;
  isLeft: boolean;
}

const MajorNewsCard = ({ item, isLeft }: MajorNewsCardProps) => {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex gap-6 group cursor-pointer',
        isLeft ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <div className="relative w-1/2 aspect-video overflow-hidden rounded-lg flex-shrink-0">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex flex-col gap-2 w-1/2">
        <h2 className="text-2xl font-medium line-clamp-3 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors duration-200">
          {item.title}
        </h2>
        <p className="text-base text-black/70 dark:text-white/70 line-clamp-3">
          {item.content}
        </p>
      </div>
    </a>
  );
};

export default MajorNewsCard;

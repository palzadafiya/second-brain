import React from 'react';
import { CancelIcon } from '../../icons/CancelIcon';
import { Link } from 'react-router-dom';
import { Tag } from '../../types';
import { DeleteIcon } from '../../icons/DeleteIcon';

interface CardProps {
  id: string;
  type: string;
  title: string;
  link: string;
  image?: string;
  domain?: string;
  tags?: Tag[];
  onDelete: (id: string) => void;
}

export function Card({ id, type, title, link, image, domain, tags, onDelete }: CardProps) {
  // Default placeholder image if no image is provided
  const placeholderImage = "https://placehold.co/600x400?text=No+Image";

  return (
    <div className="bg-white rounded-lg shadow-md w-72 flex flex-col relative">
      
      {/* Image section */}
      <div className="h-40 overflow-hidden rounded-t-lg relative">
        <img 
          src={image || placeholderImage} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = placeholderImage;
          }}
        />
      </div>
      
      {/* Content section */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          {domain && (
            <span className="text-xs text-gray-500 mb-1 block">{domain}</span>
          )}
          <h3 className="font-semibold text-lg text-black-600 line-clamp-2">{title}</h3>
        </div>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 my-2">
            {tags.slice(0, 3).map(tag => (
              <span 
                key={tag.id} 
                className="bg-beige-100 text-black-600 text-xs px-2 py-1 rounded-full"
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500">+{tags.length - 3}</span>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-2 flex justify-between items-center">
          <Link 
            to={`/link/${id}`}
            className="bg-black-600 text-white px-3 py-1 rounded-md hover:bg-opacity-80 transition-colors inline-block"
          >
            View Details
          </Link>

          <div>
            <DeleteIcon onClick={() => onDelete(id)} />
          </div>
        </div>
      </div>
    </div>
  );
} 
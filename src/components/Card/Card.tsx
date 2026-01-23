import React from 'react';
import styles from './Card.module.sass';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, hoverable = false, className }) => {
  const cardClasses = [
    styles.card,
    hoverable && styles.hoverable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

export default Card;

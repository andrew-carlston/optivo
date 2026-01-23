import React from 'react';
import styles from './Form.module.sass';

interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

const Form: React.FC<FormProps> = ({ children, onSubmit, className, ...rest }) => {
  const formClasses = [styles.form, className].filter(Boolean).join(' ');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <form className={formClasses} onSubmit={handleSubmit} {...rest}>
      {children}
    </form>
  );
};

export default Form;

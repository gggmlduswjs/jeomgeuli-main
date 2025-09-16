interface BigButtonProps {
  label: string;
  color?: 'primary' | 'accent';
  onClick: () => void;
}

export default function BigButton({ label, color = 'accent', onClick }: BigButtonProps) {
  const colorClasses =
    color === 'accent'
      ? 'bg-accent text-primary'
      : 'bg-primary text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${colorClasses} px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
    >
      {label}
    </button>
  );
}

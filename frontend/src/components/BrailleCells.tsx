
interface BrailleCellsProps {
  data: string[];
  className?: string;
}

export function BrailleCells({ data, className = "" }: BrailleCellsProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-100 rounded-lg ${className}`}>
        <span className="text-gray-500 text-sm">출력할 키워드가 없습니다</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {data.map((keyword, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg border border-blue-200"
        >
          <span className="text-xs text-blue-600 font-mono">⠠⠃</span>
          <span className="text-sm font-medium text-blue-800">{keyword}</span>
        </div>
      ))}
    </div>
  );
}

export default BrailleCells;
